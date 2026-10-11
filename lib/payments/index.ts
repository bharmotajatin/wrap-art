import crypto from "crypto";
import type { PaymentProvider } from "./types";

class RazorpayProvider implements PaymentProvider {
  name = "razorpay" as const;

  async createOrder(input: { amount: number; receipt: string }) {
    const key = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key || !secret) {
      return { id: `order_demo_${input.receipt}`, amount: input.amount, currency: "INR" as const, receipt: input.receipt };
    }
    const Razorpay = (await import("razorpay")).default;
    const client = new Razorpay({ key_id: key, key_secret: secret });
    const order = await client.orders.create({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt,
    });
    return { id: order.id, amount: Number(order.amount), currency: "INR" as const, receipt: input.receipt };
  }

  verifySignature({ orderId, paymentId, signature }: { orderId: string; paymentId: string; signature: string }) {
    const secret = process.env.RAZORPAY_KEY_SECRET || "demo";
    if (orderId.startsWith("order_demo_") && signature === "demo") return true;
    const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    return expected === signature;
  }
}

class StripeProvider implements PaymentProvider {
  name = "stripe" as const;
  async createOrder(input: { amount: number; receipt: string }) {
    return { id: `stripe_demo_${input.receipt}`, amount: input.amount, currency: "INR" as const, receipt: input.receipt };
  }
  verifySignature() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }
}

export function getPaymentProvider(name: "razorpay" | "stripe" = "razorpay"): PaymentProvider {
  return name === "stripe" ? new StripeProvider() : new RazorpayProvider();
}
