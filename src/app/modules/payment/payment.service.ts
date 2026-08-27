import Stripe from "stripe";
import { stripe } from "../../Helper/stripe";
import { prisma } from "../../shared/prisma";
import { PaymentStatus } from "@prisma/client";

const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  // 1. Verify Stripe webhook
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
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

      const appointmentId = session.metadata?.appointmentId;

      const paymentId = session.metadata?.paymentId;

      // Validate metadata first
      if (!appointmentId) {
        throw new Error("Appointment ID missing from Stripe metadata");
      }

      if (!paymentId) {
        throw new Error("Payment ID missing from Stripe metadata");
      }

      // Verify payment
      if (session.payment_status !== "paid") {
        console.log("Checkout completed but payment is not paid");
        break;
      }

      const transactionId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.id;

      await prisma.$transaction(async (tx: any) => {
        const appointment = await tx.appointment.findUnique({
          where: {
            id: appointmentId,
          },
        });

        if (!appointment) {
          throw new Error(`Appointment not found: ${appointmentId}`);
        }

        // Update payment
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: PaymentStatus.PAID,
            transactionId,

            paymentGatewaydata: {
              stripeSessionId: session.id,
              paymentIntent: session.payment_intent,
              paymentStatus: session.payment_status,
            },
          },
        });

        // Update appointment
        await tx.appointment.update({
          where: {
            id: appointmentId,
          },
          data: {
            paymentStatus: PaymentStatus.PAID,
          },
        });

        // Book doctor schedule
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
      });

      console.log(`Payment completed for appointment ${appointmentId}`);

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
