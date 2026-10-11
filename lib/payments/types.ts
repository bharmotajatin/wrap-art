export type CheckoutOrder = {
  id: string;
  amount: number;
  currency: "INR";
  receipt: string;
};

export interface PaymentProvider {
  name: "razorpay" | "stripe";
  createOrder(input: { amount: number; receipt: string }): Promise<CheckoutOrder>;
  verifySignature(payload: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean;
}
