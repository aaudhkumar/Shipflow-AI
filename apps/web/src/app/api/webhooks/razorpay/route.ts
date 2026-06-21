import { NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@shipflow/workflow";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return new NextResponse("Missing signature or secret", { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "subscription.charged") {
      await inngest.send({
        name: "billing.payment.success",
        data: {
          subscriptionId: event.payload.subscription.entity.id,
          paymentId: event.payload.payment.entity.id,
          amount: event.payload.payment.entity.amount,
        },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
