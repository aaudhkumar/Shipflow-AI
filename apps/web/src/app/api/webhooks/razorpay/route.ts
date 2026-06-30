import { NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@shipflow/workflow";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
    }
    if (!signature) {
      return new NextResponse("Missing signature", { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (
      expectedSignature.length !== signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
    ) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === "subscription.charged" || event.event === "payment.captured") {
      const payload = event.payload.payment?.entity || event.payload.subscription?.entity;
      await inngest.send({
        name: "billing.payment.success",
        data: {
          subscriptionId: event.payload.subscription?.entity?.id || null,
          paymentId: event.payload.payment?.entity?.id || payload?.id,
          amount: payload?.amount || 0,
          orgId: payload?.notes?.orgId || null,
          planId: payload?.notes?.planId || null,
        },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
