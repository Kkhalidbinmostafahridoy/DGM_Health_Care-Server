import Stripe from "stripe";
import { stripe } from "../../Helper/stripe";
import { prisma } from "../../shared/prisma";

const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  // 1. Verify Stripe webhook
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);

    throw new Error("Invalid Stripe webhook signature");
  }

  console.log("Stripe Event:", event.type);

  // 2. Handle event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Checkout Session:", session.id);

      // 3. Get appointment ID
      const appointmentId = session.metadata?.appointmentId;

      if (!appointmentId) {
        throw new Error("Appointment ID missing from Stripe metadata");
      }

      // 4. Verify payment actually completed
      if (session.payment_status !== "paid") {
        console.log("Checkout completed but payment is not paid");

        break;
      }

      // 5. Database transaction
      await prisma.$transaction(async (tx: any) => {
        const appointment = await tx.appointment.findUnique({
          where: {
            id: appointmentId,
          },
        });

        if (!appointment) {
          throw new Error(`Appointment not found: ${appointmentId}`);
        }

        // 6. Idempotency check
        if (appointment.paymentStatus === "PAID") {
          console.log(`Appointment ${appointmentId} already paid`);

          return;
        }

        // 7. Get Stripe transaction ID
        const transactionId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.id;

        // 8. Create/update Payment
        await tx.payment.upsert({
          where: {
            appointmentId,
          },

          create: {
            appointmentId,

            amount: Number(session.amount_total || 0) / 100,

            transactionId,

            status: "PAID",

            paymentGatewaydata: {
              stripeSessionId: session.id,
              paymentIntent: session.payment_intent || null,
              paymentStatus: session.payment_status,
            },
          },

          update: {
            amount: Number(session.amount_total || 0) / 100,

            transactionId,

            status: "PAID",

            paymentGatewaydata: {
              stripeSessionId: session.id,
              paymentIntent: session.payment_intent || null,
              paymentStatus: session.payment_status,
            },
          },
        });

        // 9. Update appointment
        await tx.appointment.update({
          where: {
            id: appointmentId,
          },

          data: {
            paymentStatus: "PAID",
          },
        });

        // 10. Book doctor schedule
        await tx.doctorSchedule.update({
          where: {
            doctorId_scheduleId: {
              doctorId: appointment.doctorId,
              scheduleId: appointment.scheduleId,
            },
          },

          data: {
            isBooked: true,
          },
        });

        console.log(`Appointment ${appointmentId} payment completed`);
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      console.log("Payment failed:", paymentIntent.id);

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      const appointmentId = session.metadata?.appointmentId;

      console.log("Checkout expired:", session.id, appointmentId);

      break;
    }

    default: {
      console.log(`Unhandled Stripe event: ${event.type}`);
    }
  }
};
export const paymentService = {
  handleStripeWebhook,
};
