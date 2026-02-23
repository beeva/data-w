import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency } = body;

    if (!amount || !currency) {
      return NextResponse.json(
        { error: "Amount and currency are required" },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      return NextResponse.json(
        { error: "Minimum deposit is $1.00" },
        { status: 400 }
      );
    }

    const orderId = `dep_${user.id.slice(0, 8)}_${Date.now()}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const paymentRes = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: amountNum,
        price_currency: "usd",
        pay_currency: currency.toLowerCase(),
        ipn_callback_url: `${appUrl}/api/crypto/webhook`,
        order_id: orderId,
        order_description: `Wallet deposit for ${user.email}`,
      }),
    });

    if (!paymentRes.ok) {
      const errData = await paymentRes.json().catch(() => ({}));
      console.error("NOWPayments error:", errData);
      return NextResponse.json(
        { error: errData.message || "Failed to create payment" },
        { status: 502 }
      );
    }

    const payment = await paymentRes.json();

    const { error: dbError } = await supabase
      .from("crypto_deposits")
      .insert({
        user_id: user.id,
        payment_id: String(payment.payment_id),
        order_id: orderId,
        amount_usd: amountNum,
        pay_amount: payment.pay_amount,
        pay_currency: currency.toLowerCase(),
        pay_address: payment.pay_address,
        status: payment.payment_status || "waiting",
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to record deposit" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payment_id: String(payment.payment_id),
      pay_address: payment.pay_address,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency,
      order_id: orderId,
      amount_usd: amountNum,
      status: payment.payment_status,
      expiration_estimate_date: payment.expiration_estimate_date,
    });
  } catch (err) {
    console.error("Create payment error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
