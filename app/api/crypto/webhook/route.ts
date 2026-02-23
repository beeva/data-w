import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sortObject(obj: Record<string, any>): Record<string, any> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, any>, key: string) => {
      result[key] =
        obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])
          ? sortObject(obj[key])
          : obj[key];
      return result;
    }, {});
}

function verifySignature(
  payload: Record<string, any>,
  signature: string
): boolean {
  const sorted = sortObject(payload);
  const hmac = createHmac("sha512", IPN_SECRET);
  hmac.update(JSON.stringify(sorted));
  const calculatedSig = hmac.digest("hex");
  return calculatedSig === signature;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-nowpayments-sig");
    const body = await request.json();

    if (!signature || !verifySignature(body, signature)) {
      console.error("IPN signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const {
      payment_id,
      payment_status,
      order_id,
      actually_paid,
      pay_amount,
      outcome_amount,
    } = body;

    const paymentIdStr = String(payment_id);

    // Update the deposit record status
    await supabaseAdmin
      .from("crypto_deposits")
      .update({
        status: payment_status,
        actually_paid: actually_paid || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_id", paymentIdStr);

    if (
      payment_status === "finished" ||
      payment_status === "confirmed"
    ) {
      // Look up the deposit to get user_id and amount
      const { data: deposit } = await supabaseAdmin
        .from("crypto_deposits")
        .select("user_id, amount_usd, status")
        .eq("payment_id", paymentIdStr)
        .single();

      if (deposit && deposit.status !== "confirmed") {
        const { error: rpcError } = await supabaseAdmin.rpc(
          "credit_user_balance",
          {
            p_user_id: deposit.user_id,
            p_amount: deposit.amount_usd,
            p_payment_id: paymentIdStr,
          }
        );

        if (rpcError) {
          console.error("Credit balance error:", rpcError);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
