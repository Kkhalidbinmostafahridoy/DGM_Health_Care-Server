import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { paymentService } from "./payment.service";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  await paymentService.handleStripeWebhook(req.body, signature);

  return res.status(200).json({
    success: true,
    message: "Webhook received successfully",
  });
});

export const paymentController = {
  handleStripeWebhook,
};
