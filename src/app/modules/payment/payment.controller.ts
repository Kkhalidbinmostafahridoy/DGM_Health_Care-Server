import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { paymentService } from "./payment.service";
import { stripe } from "../../Helper/stripe";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret =
    "whsec_76e2556af3d2074b926cb724cd1a84e3105ead3474e4487430279ba1fe349f22";

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.log("webhook verification failed:", err.message);
    return res.status(400).send(`webhook Error:${err.message}`);
  }

  const result = await paymentService.handleStripeWebhook(event);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "webHook Request Send Successfully",
    success: true,
    data: result,
  });
});

export const paymentController = {
  handleStripeWebhook,
};
