import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// toyyibPay integration — handles the customer deposit only (full service
// payment + therapist payout stay manual, see dashboard). Same fail-open
// contract as the other external-API helpers in this codebase: a missing
// key or a toyyibPay hiccup returns null, it never throws and never blocks
// a booking from being created.
//
// TOYYIBPAY_SANDBOX controls which server we talk to — defaults to "true"
// (sandbox/dev.toyyibpay.com) so nothing can accidentally take a real
// payment until it's explicitly switched to production. Set it to "false"
// on Railway once sandbox testing is done.
function isSandbox() {
  return process.env.TOYYIBPAY_SANDBOX !== "false";
}

function apiBaseUrl() {
  return isSandbox() ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";
}

// The public site URL toyyibPay redirects/callbacks back to. Falls back to
// the known production Railway domain (already hardcoded elsewhere in this
// codebase) if NEXT_PUBLIC_BASE_URL isn't set.
function siteBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://spago.up.railway.app";
}

// billName/billDescription only accept alphanumeric, space and underscore
// per toyyibPay's docs — strip anything else rather than let the API call
// fail on a therapist/service name with odd punctuation.
function sanitizeBillText(text: string, maxLen: number) {
  const cleaned = text.replace(/[^a-zA-Z0-9 _]/g, "").trim();
  return cleaned.slice(0, maxLen) || "SpaGo";
}

async function postForm(path: string, data: Record<string, string | number>) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) body.append(key, String(value));

  const res = await fetch(`${apiBaseUrl()}/index.php/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    console.error(`[toyyibpay] ${path} request failed:`, res.status, await res.text().catch(() => ""));
    return null;
  }
  return res.json().catch(() => null);
}

// The whole platform shares a single toyyibPay account (the owner's own
// personal account), so there's only ever one Category — created once on
// first use and cached on SiteSettings rather than making the owner run a
// separate setup step.
async function getOrCreateCategoryCode(): Promise<string | null> {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  if (!secretKey) return null;

  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (settings?.toyyibpayCategoryCode) return settings.toyyibpayCategoryCode;

  const result = await postForm("createCategory", {
    catname: "SpaGo Deposit",
    catdescription: "Deposit tempahan servis SpaGo",
    userSecretKey: secretKey,
  });
  const categoryCode: string | undefined = Array.isArray(result) ? result[0]?.CategoryCode : undefined;
  if (!categoryCode) {
    console.error("[toyyibpay] createCategory did not return a CategoryCode:", JSON.stringify(result).slice(0, 300));
    return null;
  }

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { toyyibpayCategoryCode: categoryCode },
    create: { id: "singleton", toyyibpayCategoryCode: categoryCode },
  });
  return categoryCode;
}

export async function createDepositBill(params: {
  bookingId: string;
  therapistName: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  amountRM: number;
}): Promise<{ billCode: string; paymentUrl: string } | null> {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  if (!secretKey) return null;

  try {
    const categoryCode = await getOrCreateCategoryCode();
    if (!categoryCode) return null;

    const base = siteBaseUrl();
    const result = await postForm("createBill", {
      userSecretKey: secretKey,
      categoryCode,
      billName: sanitizeBillText(`Deposit ${params.therapistName}`, 30),
      billDescription: sanitizeBillText(`Deposit tempahan ${params.serviceName}`, 100),
      billPriceSetting: 1,
      billPayorInfo: 1,
      billAmount: Math.round(params.amountRM * 100), // cents
      billReturnUrl: `${base}/booking/${params.bookingId}/deposit-status`,
      billCallbackUrl: `${base}/api/toyyibpay/callback`,
      billExternalReferenceNo: params.bookingId,
      billTo: params.customerName,
      // toyyibPay requires an email on the bill even though SpaGo doesn't
      // collect one from customers today — a placeholder is fine since the
      // callback (not any emailed receipt) is what actually confirms
      // payment back to the booking.
      billEmail: "customer@spago.app",
      billPhone: params.customerPhone,
      billPaymentChannel: 2, // FPX + credit card
    });

    const billCode: string | undefined = Array.isArray(result) ? result[0]?.BillCode : undefined;
    if (!billCode) {
      console.error("[toyyibpay] createBill did not return a BillCode:", JSON.stringify(result).slice(0, 300));
      return null;
    }

    return { billCode, paymentUrl: `${apiBaseUrl()}/${billCode}` };
  } catch (err) {
    console.error("[toyyibpay] createDepositBill failed:", err);
    return null;
  }
}

// Verifies a callback's hash against MD5(userSecretKey + status + order_id
// + refno + "ok") per toyyibPay's docs — must pass before trusting any
// callback payload and marking a deposit as paid.
export function verifyCallbackHash(params: { status: string; orderId: string; refno: string; hash: string }): boolean {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
  if (!secretKey) return false;
  const expected = crypto
    .createHash("md5")
    .update(secretKey + params.status + params.orderId + params.refno + "ok")
    .digest("hex");
  return expected === params.hash;
}
