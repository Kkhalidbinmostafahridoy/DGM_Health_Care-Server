import express from "express";
import { paymentController } from "./payment.controller";

const router = express.Router();

// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   paymentController.handleStripeWebhook,
// );

export const paymentRoutes = router;
