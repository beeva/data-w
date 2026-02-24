import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

export async function GET(request: NextRequest) {
  try {
    const paymentId = request.nextUrl.searchParams.get("payment_id");

    if (!paymentId) {
      return NextResponse.json(
        { error: "payment_id is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${NOWPAYMENTS_API_URL}/payment/${paymentId}`,
      {
        headers: { "x-api-key": NOWPAYMENTS_API_KEY },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch payment status" },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      payment_id: String(data.payment_id),
      status: data.payment_status,
      pay_amount: data.pay_amount,
      actually_paid: data.actually_paid,
      pay_currency: data.pay_currency,
      outcome_amount: data.outcome_amount,
    });
  } catch (err) {
    console.error("Payment status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
