var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/r2.ts
var r2_exports = {};
__export(r2_exports, {
  deleteFromR2: () => deleteFromR2,
  getPresignedUrl: () => getPresignedUrl,
  r2: () => r2,
  uploadToR2: () => uploadToR2
});
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/@aws-sdk/client-s3/dist-cjs/index.js";
import { getSignedUrl } from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/@aws-sdk/s3-request-presigner/dist-cjs/index.js";
async function uploadToR2(key, body, contentType) {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Object-level expiry metadata (informational — actual deletion done by cleanup worker)
    Metadata: { "expires-in": "86400" }
  }));
  return key;
}
async function getPresignedUrl(key) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 86400 }
    // 24h in seconds
  );
}
async function deleteFromR2(key) {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
  }
}
var BUCKET, ACCOUNT_ID, r2;
var init_r2 = __esm({
  "server/r2.ts"() {
    "use strict";
    BUCKET = process.env.R2_BUCKET_NAME;
    ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
    console.log(
      "[r2] init \u2014 account:",
      ACCOUNT_ID,
      "| bucket:",
      BUCKET,
      "| key id:",
      process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.slice(0, 8) + "\u2026" : "MISSING",
      "| secret:",
      process.env.R2_SECRET_ACCESS_KEY ? "(set)" : "MISSING"
    );
    r2 = new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
  }
});

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  conversions: () => conversions,
  conversionsRelations: () => conversionsRelations,
  payments: () => payments,
  profiles: () => profiles
});
import { pgTable, text, integer, bigint, timestamp, doublePrecision } from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/pg-core/index.js";
import { relations } from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/index.js";
var conversions, profiles, payments, conversionsRelations;
var init_schema = __esm({
  "src/db/schema.ts"() {
    "use strict";
    conversions = pgTable("conversions", {
      id: text("id").primaryKey(),
      userId: text("user_id"),
      fileName: text("file_name").notNull(),
      status: text("status").notNull().default("processing"),
      // Cloudflare R2 storage
      r2Key: text("r2_key"),
      // object key in R2 bucket
      outputUrl: text("output_url"),
      // presigned download URL (regenerated on demand)
      fileSize: bigint("file_size", { mode: "number" }),
      // original PDF size in bytes
      expiresAt: timestamp("expires_at"),
      // 24h after creation — file deleted from R2 after this
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    profiles = pgTable("profiles", {
      id: text("id").primaryKey(),
      plan: text("plan").default("free"),
      conversionCount: integer("conversion_count").default(0),
      // Razorpay subscription tracking
      subscriptionId: text("subscription_id"),
      subscriptionStatus: text("subscription_status"),
      // created | authenticated | active | paused | cancelled | completed | expired
      planId: text("plan_id"),
      // e.g. pro_monthly_INR
      renewalDate: timestamp("renewal_date"),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    payments = pgTable("payments", {
      id: text("id").primaryKey(),
      // razorpay order_id or subscription_id
      userId: text("user_id"),
      userEmail: text("user_email").notNull(),
      planId: text("plan_id").notNull(),
      amount: integer("amount").notNull(),
      // paise/cents (Razorpay unit)
      displayAmount: doublePrecision("display_amount"),
      // human-readable amount (e.g. 500.00 for ₹500)
      currency: text("currency").notNull().default("INR"),
      status: text("status").notNull().default("created"),
      // created | paid | failed
      paymentType: text("payment_type").notNull().default("one_time"),
      // one_time | subscription
      razorpayPaymentId: text("razorpay_payment_id"),
      razorpaySignature: text("razorpay_signature"),
      razorpaySubscriptionId: text("razorpay_subscription_id"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    conversionsRelations = relations(conversions, ({ one }) => ({
      profile: one(profiles, { fields: [conversions.userId], references: [profiles.id] })
    }));
  }
});

// auth-schema.ts
var auth_schema_exports = {};
__export(auth_schema_exports, {
  account: () => account,
  accountRelations: () => accountRelations,
  session: () => session,
  sessionRelations: () => sessionRelations,
  user: () => user,
  userRelations: () => userRelations,
  verification: () => verification
});
import { relations as relations2 } from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/index.js";
import { pgTable as pgTable2, text as text2, timestamp as timestamp2, boolean, index } from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/pg-core/index.js";
var user, session, account, verification, userRelations, sessionRelations, accountRelations;
var init_auth_schema = __esm({
  "auth-schema.ts"() {
    "use strict";
    user = pgTable2("user", {
      id: text2("id").primaryKey(),
      name: text2("name").notNull(),
      email: text2("email").notNull().unique(),
      emailVerified: boolean("email_verified").default(false).notNull(),
      image: text2("image"),
      createdAt: timestamp2("created_at").defaultNow().notNull(),
      updatedAt: timestamp2("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
    });
    session = pgTable2(
      "session",
      {
        id: text2("id").primaryKey(),
        expiresAt: timestamp2("expires_at").notNull(),
        token: text2("token").notNull().unique(),
        createdAt: timestamp2("created_at").defaultNow().notNull(),
        updatedAt: timestamp2("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
        ipAddress: text2("ip_address"),
        userAgent: text2("user_agent"),
        userId: text2("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
      },
      (table) => [index("session_userId_idx").on(table.userId)]
    );
    account = pgTable2(
      "account",
      {
        id: text2("id").primaryKey(),
        accountId: text2("account_id").notNull(),
        providerId: text2("provider_id").notNull(),
        userId: text2("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
        accessToken: text2("access_token"),
        refreshToken: text2("refresh_token"),
        idToken: text2("id_token"),
        accessTokenExpiresAt: timestamp2("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp2("refresh_token_expires_at"),
        scope: text2("scope"),
        password: text2("password"),
        createdAt: timestamp2("created_at").defaultNow().notNull(),
        updatedAt: timestamp2("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
      },
      (table) => [index("account_userId_idx").on(table.userId)]
    );
    verification = pgTable2(
      "verification",
      {
        id: text2("id").primaryKey(),
        identifier: text2("identifier").notNull(),
        value: text2("value").notNull(),
        expiresAt: timestamp2("expires_at").notNull(),
        createdAt: timestamp2("created_at").defaultNow().notNull(),
        updatedAt: timestamp2("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
      },
      (table) => [index("verification_identifier_idx").on(table.identifier)]
    );
    userRelations = relations2(user, ({ many }) => ({
      sessions: many(session),
      accounts: many(account)
    }));
    sessionRelations = relations2(session, ({ one }) => ({
      user: one(user, {
        fields: [session.userId],
        references: [user.id]
      })
    }));
    accountRelations = relations2(account, ({ one }) => ({
      user: one(user, {
        fields: [account.userId],
        references: [user.id]
      })
    }));
  }
});

// server/resend.ts
var resend_exports = {};
__export(resend_exports, {
  sendEmail: () => sendEmail
});
import "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/dotenv/config.js";
async function sendEmail({ to, subject, html }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  const FROM_ADDRESS = process.env.RESEND_FROM || "ExcelfromPDF <onboarding@resend.dev>";
  if (!RESEND_API_KEY) {
    console.log(`[resend] RESEND_API_KEY not set \u2014 skipping email to ${to}`);
    console.log(`[resend] Subject: ${subject}`);
    return;
  }
  console.log(`[resend] Sending to ${to} from ${FROM_ADDRESS}`);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error ${res.status}: ${err}`);
  }
  console.log(`[resend] Email sent to ${to}`);
}
var init_resend = __esm({
  "server/resend.ts"() {
    "use strict";
  }
});

// server/emailTemplates.ts
var emailTemplates_exports = {};
__export(emailTemplates_exports, {
  resetPasswordEmail: () => resetPasswordEmail,
  verifyEmailTemplate: () => verifyEmailTemplate
});
function wrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ExcelfromPDF</title>
  ${BASE_STYLE}
</head>
<body style="background-color:#f9fafb;padding:40px 16px;margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr>
      <td>

        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;text-align:center;">
          <tr>
            <td style="padding:0 0 8px;">
              <span style="font-size:22px;font-weight:700;color:#166534;letter-spacing:-0.5px;">
                Excel<span style="color:#16a34a;">from</span>PDF
              </span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <!-- Green top bar -->
            <td style="height:4px;background:linear-gradient(90deg,#166534 0%,#16a34a 50%,#22c55e 100%);display:block;"></td>
          </tr>
          <tr>
            <td style="padding:40px 40px 36px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;text-align:center;">
          <tr>
            <td style="font-size:12px;color:#9ca3af;line-height:1.6;">
              ExcelfromPDF &mdash; Convert PDFs to Excel instantly<br/>
              You received this email because an action was requested on your account.<br/>
              If you didn't request this, you can safely ignore this email.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
function ctaButton(label, url) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <a href="${url}"
            style="display:inline-block;padding:13px 32px;background:#166534;color:#ffffff;
                   font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;
                   letter-spacing:0.1px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}
function fallbackLink(url) {
  return `
    <p style="font-size:12px;color:#9ca3af;margin-top:20px;word-break:break-all;">
      Button not working? Copy and paste this link into your browser:<br/>
      <a href="${url}" style="color:#166534;text-decoration:underline;">${url}</a>
    </p>
  `;
}
function divider() {
  return `<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />`;
}
function resetPasswordEmail(name, resetUrl, appUrl = "https://www.excelfrompdf.com") {
  const displayName = name || "there";
  const content = `
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <div style="width:48px;height:48px;background:#f0fdf4;border-radius:12px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:24px;line-height:48px;text-align:center;">
            \u{1F510}
          </div>
        </td>
      </tr>
    </table>

    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.3px;">
      Reset your password
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 4px;line-height:1.6;">
      Hi ${displayName},
    </p>
    <p style="font-size:15px;color:#6b7280;margin:0;line-height:1.6;">
      We received a request to reset the password for your ExcelfromPDF account.
      Click the button below to choose a new password.
    </p>

    ${ctaButton("Reset Password", resetUrl)}

    <!-- Expiry notice -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#fffbeb;border:1px solid #fef3c7;border-radius:8px;
                   padding:12px 16px;">
          <p style="font-size:13px;color:#92400e;margin:0;">
            \u23F1 This link expires in <strong>1 hour</strong>. If it expires, you can
            <a href="${appUrl}/forgot-password" style="color:#166534;font-weight:600;text-decoration:none;">
              request a new one
            </a>.
          </p>
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
      Didn't request a password reset? No action is needed \u2014 your account is safe.
      Someone may have typed your email address by mistake.
    </p>

    ${fallbackLink(resetUrl)}
  `;
  return wrapper(content);
}
function verifyEmailTemplate(name, verifyUrl) {
  const displayName = name || "there";
  const content = `
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <div style="width:48px;height:48px;background:#f0fdf4;border-radius:12px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:24px;line-height:48px;text-align:center;">
            \u2709\uFE0F
          </div>
        </td>
      </tr>
    </table>

    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.3px;">
      Verify your email address
    </h1>
    <p style="font-size:15px;color:#6b7280;margin:0 0 4px;line-height:1.6;">
      Hi ${displayName},
    </p>
    <p style="font-size:15px;color:#6b7280;margin:0;line-height:1.6;">
      Welcome to ExcelfromPDF! Please verify your email address to activate your account
      and start converting PDFs to Excel.
    </p>

    ${ctaButton("Verify Email Address", verifyUrl)}

    <!-- What you get -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;padding:16px 20px;">
          <p style="font-size:13px;font-weight:600;color:#166534;margin:0 0 10px;">
            What you get with ExcelfromPDF:
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#15803d;padding:3px 0;">\u2713&nbsp;&nbsp;Convert PDFs to Excel in seconds</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#15803d;padding:3px 0;">\u2713&nbsp;&nbsp;Accurate table detection &amp; formatting</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#15803d;padding:3px 0;">\u2713&nbsp;&nbsp;5 free conversions to get started</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
      Didn't create an ExcelfromPDF account? You can safely ignore this email \u2014
      no account will be created without verification.
    </p>

    ${fallbackLink(verifyUrl)}
  `;
  return wrapper(content);
}
var BASE_STYLE;
var init_emailTemplates = __esm({
  "server/emailTemplates.ts"() {
    "use strict";
    BASE_STYLE = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f9fafb; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
`;
  }
});

// vite.config.ts
import { defineConfig } from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/@vitejs/plugin-react/dist/index.js";
import multer from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/multer/index.js";
import { randomUUID, createHmac, randomBytes } from "crypto";
import { config as loadDotenv } from "file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/dotenv/lib/main.js";
loadDotenv({ path: ".env" });
loadDotenv({ path: ".env.local", override: true });
var RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
var RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
function validateRazorpayCredentials() {
  const missing = [
    !RAZORPAY_KEY_ID && "RAZORPAY_KEY_ID",
    !RAZORPAY_KEY_SECRET && "RAZORPAY_KEY_SECRET"
  ].filter(Boolean);
  if (missing.length) {
    return `Razorpay credentials not configured on server: missing ${missing.join(", ")}`;
  }
  if (!/^rzp_(test|live)_/.test(RAZORPAY_KEY_ID)) {
    return "Invalid Razorpay Key ID. It must start with rzp_test_ or rzp_live_.";
  }
  if (RAZORPAY_KEY_SECRET.startsWith("rzp_")) {
    return "Invalid Razorpay Key Secret. You pasted a Key ID into RAZORPAY_KEY_SECRET; use the matching secret from Razorpay Dashboard.";
  }
  return null;
}
var PLAN_AMOUNTS = {
  pro_monthly_INR: 5e4,
  // ₹500
  pro_yearly_INR: 36e4
  // ₹3,600
};
var PLAN_DISPLAY_AMOUNTS = {
  pro_monthly_INR: 500,
  pro_yearly_INR: 3600
};
var PLAN_CURRENCIES = {
  pro_monthly_INR: "INR",
  pro_yearly_INR: "INR"
};
var PLAN_PERIOD = {
  pro_monthly_INR: "monthly",
  pro_yearly_INR: "yearly"
};
var PLAN_NAMES = {
  pro_monthly_INR: "Professional Monthly (INR)",
  pro_yearly_INR: "Professional Yearly (INR)"
};
var rzpPlanIdCache = {};
async function getOrCreateRazorpayPlan(planId) {
  if (rzpPlanIdCache[planId]) return rzpPlanIdCache[planId];
  const amount = PLAN_AMOUNTS[planId];
  const currency = PLAN_CURRENCIES[planId];
  const period = PLAN_PERIOD[planId];
  const envKey = `RAZORPAY_PLAN_ID_${planId.toUpperCase()}`;
  const envPlanId = process.env[envKey];
  if (envPlanId) {
    rzpPlanIdCache[planId] = envPlanId;
    return envPlanId;
  }
  const res = await fetch("https://api.razorpay.com/v1/plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`
    },
    body: JSON.stringify({
      period: period === "yearly" ? "yearly" : "monthly",
      interval: 1,
      item: {
        name: PLAN_NAMES[planId],
        amount,
        currency,
        description: PLAN_NAMES[planId]
      }
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.description || "Failed to create Razorpay plan");
  }
  const plan = await res.json();
  rzpPlanIdCache[planId] = plan.id;
  console.log(`[razorpay] Created plan ${planId} \u2192 ${plan.id} (set ${envKey}=${plan.id} in .env to cache)`);
  return plan.id;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
function localApiPlugin() {
  return {
    name: "local-api-dev",
    configureServer(server) {
      const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (url.startsWith("/api/r2/upload") && req.method === "POST") {
          return new Promise((resolve) => {
            upload.single("file")(req, res, async () => {
              try {
                const file = req.file;
                if (!file) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: "No file provided" }));
                  return resolve();
                }
                const { uploadToR2: uploadToR22, getPresignedUrl: getPresignedUrl2 } = await Promise.resolve().then(() => (init_r2(), r2_exports));
                const ext = file.originalname.split(".").pop() ?? "xlsx";
                const key = `conversions/${randomUUID()}.${ext}`;
                console.log(`[r2/upload] uploading ${file.originalname} \u2192 ${key} (${file.size} bytes)`);
                await uploadToR22(key, file.buffer, file.mimetype || "application/octet-stream");
                const fileUrl = await getPresignedUrl2(key);
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
                console.log(`[r2/upload] success \u2192 key=${key}`);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ key, url: fileUrl, expiresAt }));
              } catch (err) {
                console.error("[r2/upload]", err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Upload failed" }));
              }
              resolve();
            });
          });
        }
        if (url.startsWith("/api/r2/presign") && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          try {
            const key = new URL(url, "http://localhost").searchParams.get("key") ?? "";
            if (!key) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing key param" }));
              return;
            }
            const { getPresignedUrl: getPresignedUrl2 } = await Promise.resolve().then(() => (init_r2(), r2_exports));
            const presignedUrl = await getPresignedUrl2(key);
            res.end(JSON.stringify({ url: presignedUrl }));
          } catch (err) {
            console.error("[r2/presign]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Presign failed" }));
          }
          return;
        }
        if (url === "/api/r2/health" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          try {
            const { uploadToR2: uploadToR22, deleteFromR2: deleteFromR22 } = await Promise.resolve().then(() => (init_r2(), r2_exports));
            const testKey = `health-check/${randomUUID()}.txt`;
            await uploadToR22(testKey, Buffer.from("ok"), "text/plain");
            await deleteFromR22(testKey);
            res.end(JSON.stringify({ status: "ok", bucket: process.env.R2_BUCKET_NAME }));
          } catch (err) {
            console.error("[r2/health]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ status: "error", error: err instanceof Error ? err.message : String(err) }));
          }
          return;
        }
        if (url.startsWith("/api/conversions")) {
          try {
            const { drizzle } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/node-postgres/index.js");
            const { Pool } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/pg/esm/index.mjs");
            const { conversions: conversions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            const { eq, desc } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/index.js");
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            const db = drizzle(pool);
            const toSnake = (row) => ({
              id: row.id,
              user_id: row.userId,
              file_name: row.fileName,
              status: row.status,
              r2_key: row.r2Key,
              output_url: row.outputUrl,
              file_size: row.fileSize,
              expires_at: row.expiresAt?.toISOString() ?? null,
              created_at: row.createdAt?.toISOString() ?? null,
              updated_at: row.updatedAt?.toISOString() ?? null
            });
            res.setHeader("Content-Type", "application/json");
            if (req.method === "POST" && url === "/api/conversions") {
              const body = JSON.parse(await readBody(req));
              const id = randomUUID();
              const [row] = await db.insert(conversions2).values({
                id,
                userId: body.user_id ?? null,
                fileName: body.file_name,
                fileSize: body.file_size ?? null,
                status: body.status ?? "processing"
              }).returning();
              res.end(JSON.stringify(toSnake(row)));
              await pool.end();
              return;
            }
            const patchMatch = url.match(/^\/api\/conversions\/([^/?]+)$/);
            if (req.method === "PATCH" && patchMatch) {
              const body = JSON.parse(await readBody(req));
              const [row] = await db.update(conversions2).set({
                status: body.status,
                outputUrl: body.output_url ?? null,
                r2Key: body.r2_key ?? null,
                expiresAt: body.expires_at ? new Date(body.expires_at) : null,
                updatedAt: /* @__PURE__ */ new Date()
              }).where(eq(conversions2.id, patchMatch[1])).returning();
              res.end(JSON.stringify(row ? toSnake(row) : {}));
              await pool.end();
              return;
            }
            if (req.method === "GET" && url.startsWith("/api/conversions/count")) {
              const userId = new URL(url, "http://localhost").searchParams.get("user_id") ?? "";
              const rows = await db.select({ id: conversions2.id }).from(conversions2).where(eq(conversions2.userId, userId));
              res.end(JSON.stringify({ count: rows.length }));
              await pool.end();
              return;
            }
            if (req.method === "GET") {
              const userId = new URL(url, "http://localhost").searchParams.get("user_id") ?? "";
              const rows = await db.select().from(conversions2).where(eq(conversions2.userId, userId)).orderBy(desc(conversions2.createdAt));
              res.end(JSON.stringify(rows.map(toSnake)));
              await pool.end();
              return;
            }
            res.statusCode = 405;
            res.end(JSON.stringify({ error: "Method not allowed" }));
            await pool.end();
          } catch (err) {
            console.error("[conversions]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "DB error" }));
          }
          return;
        }
        if (url === "/api/payment/create-order" && req.method === "POST") {
          res.setHeader("Content-Type", "application/json");
          try {
            const body = JSON.parse(await readBody(req));
            const planId = body.plan_id ?? "";
            const amount = PLAN_AMOUNTS[planId];
            if (!amount) {
              res.statusCode = 400;
              res.end(JSON.stringify({ detail: `Unknown plan_id: ${planId}` }));
              return;
            }
            const credentialError = validateRazorpayCredentials();
            if (credentialError) {
              res.statusCode = 500;
              res.end(JSON.stringify({ detail: credentialError }));
              return;
            }
            let rzpPlanId;
            try {
              rzpPlanId = await getOrCreateRazorpayPlan(planId);
            } catch (planErr) {
              console.error("[payment/create-order] plan creation failed, falling back to one-time order", planErr);
              rzpPlanId = "";
            }
            const { drizzle } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/node-postgres/index.js");
            const { Pool } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/pg/esm/index.mjs");
            const { payments: payments2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            const db = drizzle(pool);
            if (rzpPlanId) {
              const rzpRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`
                },
                body: JSON.stringify({
                  plan_id: rzpPlanId,
                  total_count: 12,
                  // max 12 cycles; user can cancel anytime
                  quantity: 1,
                  customer_notify: 1,
                  // Razorpay emails the customer
                  notify_info: {
                    notify_email: body.user_email ?? ""
                  }
                })
              });
              if (!rzpRes.ok) {
                const err = await rzpRes.json();
                await pool.end();
                res.statusCode = 502;
                res.end(JSON.stringify({ detail: err?.error?.description || "Razorpay subscription creation failed" }));
                return;
              }
              const sub = await rzpRes.json();
              await db.insert(payments2).values({
                id: sub.id,
                userId: body.user_id ?? null,
                userEmail: body.user_email ?? "",
                planId,
                amount,
                displayAmount: PLAN_DISPLAY_AMOUNTS[planId],
                currency: PLAN_CURRENCIES[planId] ?? "INR",
                status: "created",
                paymentType: "subscription",
                razorpaySubscriptionId: sub.id
              });
              await pool.end();
              res.end(JSON.stringify({
                success: true,
                type: "subscription",
                order: {
                  subscription_id: sub.id,
                  key_id: RAZORPAY_KEY_ID,
                  amount,
                  currency: PLAN_CURRENCIES[planId] ?? "INR",
                  plan_name: PLAN_NAMES[planId] ?? planId
                }
              }));
            } else {
              const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`
                },
                body: JSON.stringify({ amount, currency: PLAN_CURRENCIES[planId] ?? "INR", receipt: randomUUID() })
              });
              if (!rzpRes.ok) {
                const err = await rzpRes.json();
                await pool.end();
                res.statusCode = 502;
                res.end(JSON.stringify({ detail: err?.error?.description || "Razorpay order creation failed" }));
                return;
              }
              const order = await rzpRes.json();
              await db.insert(payments2).values({
                id: order.id,
                userId: body.user_id ?? null,
                userEmail: body.user_email ?? "",
                planId,
                amount: order.amount,
                displayAmount: PLAN_DISPLAY_AMOUNTS[planId],
                currency: order.currency,
                status: "created",
                paymentType: "one_time"
              });
              await pool.end();
              res.end(JSON.stringify({
                success: true,
                type: "order",
                order: {
                  order_id: order.id,
                  key_id: RAZORPAY_KEY_ID,
                  amount: order.amount,
                  currency: order.currency,
                  plan_name: PLAN_NAMES[planId] ?? planId
                }
              }));
            }
          } catch (err) {
            console.error("[payment/create-order]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ detail: "Order creation failed" }));
          }
          return;
        }
        if (url === "/api/payment/verify" && req.method === "POST") {
          res.setHeader("Content-Type", "application/json");
          try {
            const body = JSON.parse(await readBody(req));
            const sigBase = body.razorpay_subscription_id ? `${body.razorpay_payment_id}|${body.razorpay_subscription_id}` : `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
            const expectedSig = createHmac("sha256", RAZORPAY_KEY_SECRET).update(sigBase).digest("hex");
            if (expectedSig !== body.razorpay_signature) {
              res.statusCode = 400;
              res.end(JSON.stringify({ detail: "Invalid payment signature" }));
              return;
            }
            const { drizzle } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/node-postgres/index.js");
            const { Pool } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/pg/esm/index.mjs");
            const { payments: payments2, profiles: profiles2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            const { eq } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/index.js");
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            const db = drizzle(pool);
            const recordId = body.razorpay_subscription_id || body.razorpay_order_id || "";
            await db.update(payments2).set({
              status: "paid",
              razorpayPaymentId: body.razorpay_payment_id,
              razorpaySignature: body.razorpay_signature,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(payments2.id, recordId));
            const planId = body.plan_id;
            const isYearly = planId.includes("yearly");
            const renewalDate = /* @__PURE__ */ new Date();
            if (isYearly) renewalDate.setFullYear(renewalDate.getFullYear() + 1);
            else renewalDate.setMonth(renewalDate.getMonth() + 1);
            const basePlan = planId.split("_")[0];
            const existing = await db.select().from(profiles2).where(eq(profiles2.id, body.user_email));
            const profileUpdate = {
              plan: basePlan,
              planId,
              subscriptionId: body.razorpay_subscription_id ?? null,
              subscriptionStatus: "active",
              renewalDate,
              updatedAt: /* @__PURE__ */ new Date()
            };
            if (existing.length > 0) {
              await db.update(profiles2).set(profileUpdate).where(eq(profiles2.id, body.user_email));
            } else {
              await db.insert(profiles2).values({ id: body.user_email, ...profileUpdate });
            }
            await pool.end();
            res.end(JSON.stringify({ success: true, plan: basePlan, renewal_date: renewalDate.toISOString() }));
          } catch (err) {
            console.error("[payment/verify]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ detail: "Payment verification failed" }));
          }
          return;
        }
        if (url.startsWith("/api/profile") && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          try {
            const email = new URL(url, "http://localhost").searchParams.get("email") ?? "";
            if (!email) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "email required" }));
              return;
            }
            const { drizzle } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/node-postgres/index.js");
            const { Pool } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/pg/esm/index.mjs");
            const { profiles: profiles2, payments: payments2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            const { eq, desc } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/index.js");
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            const db = drizzle(pool);
            const [profile] = await db.select().from(profiles2).where(eq(profiles2.id, email));
            const paymentHistory = await db.select().from(payments2).where(eq(payments2.userEmail, email)).orderBy(desc(payments2.createdAt));
            const paidPayments = paymentHistory.filter((p) => p.status === "paid");
            const hasPaidPayment = paidPayments.length > 0;
            const latestPaidPayment = paidPayments[0] ?? null;
            if (hasPaidPayment && profile && profile.plan !== "pro") {
              try {
                await db.update(profiles2).set({
                  plan: "pro",
                  planId: latestPaidPayment?.planId ?? profile.planId,
                  subscriptionId: latestPaidPayment?.razorpaySubscriptionId ?? profile.subscriptionId,
                  subscriptionStatus: profile.subscriptionStatus ?? "active",
                  updatedAt: /* @__PURE__ */ new Date()
                }).where(eq(profiles2.id, email));
              } catch {
              }
            }
            await pool.end();
            res.end(JSON.stringify({
              profile: profile ?? { id: email, plan: "free", planId: null, subscriptionId: null, subscriptionStatus: null, renewalDate: null },
              hasPaidPayment,
              latestPaidPayment: latestPaidPayment ? {
                plan_id: latestPaidPayment.planId,
                status: latestPaidPayment.status,
                display_amount: latestPaidPayment.displayAmount,
                amount: latestPaidPayment.amount,
                currency: latestPaidPayment.currency
              } : null,
              payments: paymentHistory.map((p) => ({
                id: p.id,
                plan_id: p.planId,
                amount: p.amount,
                display_amount: p.displayAmount,
                currency: p.currency,
                status: p.status,
                payment_type: p.paymentType,
                razorpay_payment_id: p.razorpayPaymentId,
                razorpay_subscription_id: p.razorpaySubscriptionId,
                created_at: p.createdAt?.toISOString() ?? null,
                updated_at: p.updatedAt?.toISOString() ?? null
              }))
            }));
          } catch (err) {
            console.error("[profile]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to fetch profile" }));
          }
          return;
        }
        if (url === "/api/payment/cancel-subscription" && req.method === "POST") {
          res.setHeader("Content-Type", "application/json");
          try {
            const body = JSON.parse(await readBody(req));
            const credentialError = validateRazorpayCredentials();
            if (credentialError) {
              res.statusCode = 500;
              res.end(JSON.stringify({ detail: credentialError }));
              return;
            }
            const rzpRes = await fetch(`https://api.razorpay.com/v1/subscriptions/${body.subscription_id}/cancel`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`
              },
              body: JSON.stringify({ cancel_at_cycle_end: 1 })
            });
            if (!rzpRes.ok) {
              const err = await rzpRes.json();
              res.statusCode = 502;
              res.end(JSON.stringify({ detail: err?.error?.description || "Cancellation failed" }));
              return;
            }
            const { drizzle } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/node-postgres/index.js");
            const { Pool } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/pg/esm/index.mjs");
            const { profiles: profiles2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            const { eq } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/index.js");
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            const db = drizzle(pool);
            await db.update(profiles2).set({ subscriptionStatus: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq(profiles2.id, body.user_email));
            await pool.end();
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            console.error("[payment/cancel-subscription]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ detail: "Cancellation failed" }));
          }
          return;
        }
        if (url === "/api/auth/forgot-password" && req.method === "POST") {
          res.setHeader("Content-Type", "application/json");
          const body = JSON.parse(await readBody(req));
          if (!body.email) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "email is required" }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          try {
            const { drizzle } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/node-postgres/index.js");
            const { Pool } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/pg/esm/index.mjs");
            const { eq } = await import("file:///C:/Users/kharo/Downloads/Exelfrompdf/node_modules/drizzle-orm/index.js");
            const { user: userTable, verification: verification2 } = await Promise.resolve().then(() => (init_auth_schema(), auth_schema_exports));
            const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_resend(), resend_exports));
            const { resetPasswordEmail: resetPasswordEmail2 } = await Promise.resolve().then(() => (init_emailTemplates(), emailTemplates_exports));
            const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            const db = drizzle(pool);
            const email = body.email.toLowerCase().trim();
            const [foundUser] = await db.select({ id: userTable.id, name: userTable.name }).from(userTable).where(eq(userTable.email, email)).limit(1);
            if (foundUser) {
              const token = randomBytes(32).toString("hex");
              const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
              await db.delete(verification2).where(eq(verification2.identifier, `reset-password:${email}`));
              await db.insert(verification2).values({
                id: randomUUID(),
                identifier: `reset-password:${email}`,
                value: token,
                expiresAt
              });
              const appUrl = process.env.VITE_APP_URL || "http://localhost:3000";
              const resetUrl = `${appUrl}/reset-password?token=${token}`;
              await sendEmail2({
                to: email,
                subject: "Reset your ExcelfromPDF password",
                html: resetPasswordEmail2(foundUser.name, resetUrl, appUrl)
              });
            }
            await pool.end();
          } catch (err) {
            console.error("[forgot-password]", err);
          }
          return;
        }
        if (url.startsWith("/api/r2/presign") && req.method === "GET") {
          try {
            const key = new URL(url, "http://localhost").searchParams.get("key");
            if (!key) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "key is required" }));
              return;
            }
            const { getPresignedUrl: getPresignedUrl2 } = await Promise.resolve().then(() => (init_r2(), r2_exports));
            const fileUrl = await getPresignedUrl2(key);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ url: fileUrl }));
          } catch (err) {
            console.error("[r2/presign]", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to generate URL" }));
          }
          return;
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    port: 3e3,
    proxy: {
      // /api/r2 is handled by localApiPlugin above (same port).
      // Everything else under /api goes to the Python backend.
      "/api": {
        target: "http://153.75.250.227:8000",
        changeOrigin: true,
        bypass(req) {
          const url = req.url || "";
          if (url.startsWith("/api/r2") || url.startsWith("/api/conversions") || url.startsWith("/api/payment") || url.startsWith("/api/profile") || url.startsWith("/api/auth")) return url;
          return null;
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2VydmVyL3IyLnRzIiwgInNyYy9kYi9zY2hlbWEudHMiLCAiYXV0aC1zY2hlbWEudHMiLCAic2VydmVyL3Jlc2VuZC50cyIsICJzZXJ2ZXIvZW1haWxUZW1wbGF0ZXMudHMiLCAidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcXFxcc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcXFxcc2VydmVyXFxcXHIyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9raGFyby9Eb3dubG9hZHMvRXhlbGZyb21wZGYvc2VydmVyL3IyLnRzXCI7aW1wb3J0IHtcbiAgUzNDbGllbnQsXG4gIFB1dE9iamVjdENvbW1hbmQsXG4gIERlbGV0ZU9iamVjdENvbW1hbmQsXG4gIEdldE9iamVjdENvbW1hbmQsXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zMydcbmltcG9ydCB7IGdldFNpZ25lZFVybCB9IGZyb20gJ0Bhd3Mtc2RrL3MzLXJlcXVlc3QtcHJlc2lnbmVyJ1xuXG5jb25zdCBCVUNLRVQgPSBwcm9jZXNzLmVudi5SMl9CVUNLRVRfTkFNRSFcbmNvbnN0IEFDQ09VTlRfSUQgPSBwcm9jZXNzLmVudi5SMl9BQ0NPVU5UX0lEIVxuXG4vLyBMb2cgY3JlZGVudGlhbCBwcmVzZW5jZSBhdCBtb2R1bGUgbG9hZCBzbyB3ZSBjYW4gZGlhZ25vc2UgbWlzc2luZyBlbnYgdmFyc1xuY29uc29sZS5sb2coJ1tyMl0gaW5pdCBcdTIwMTQgYWNjb3VudDonLCBBQ0NPVU5UX0lELCAnfCBidWNrZXQ6JywgQlVDS0VULFxuICAnfCBrZXkgaWQ6JywgcHJvY2Vzcy5lbnYuUjJfQUNDRVNTX0tFWV9JRCA/IHByb2Nlc3MuZW52LlIyX0FDQ0VTU19LRVlfSUQuc2xpY2UoMCwgOCkgKyAnXHUyMDI2JyA6ICdNSVNTSU5HJyxcbiAgJ3wgc2VjcmV0OicsIHByb2Nlc3MuZW52LlIyX1NFQ1JFVF9BQ0NFU1NfS0VZID8gJyhzZXQpJyA6ICdNSVNTSU5HJylcblxuZXhwb3J0IGNvbnN0IHIyID0gbmV3IFMzQ2xpZW50KHtcbiAgcmVnaW9uOiAnYXV0bycsXG4gIGVuZHBvaW50OiBgaHR0cHM6Ly8ke0FDQ09VTlRfSUR9LnIyLmNsb3VkZmxhcmVzdG9yYWdlLmNvbWAsXG4gIGNyZWRlbnRpYWxzOiB7XG4gICAgYWNjZXNzS2V5SWQ6IHByb2Nlc3MuZW52LlIyX0FDQ0VTU19LRVlfSUQhLFxuICAgIHNlY3JldEFjY2Vzc0tleTogcHJvY2Vzcy5lbnYuUjJfU0VDUkVUX0FDQ0VTU19LRVkhLFxuICB9LFxufSlcblxuLy8gVXBsb2FkIGEgYnVmZmVyIHRvIFIyLiBSZXR1cm5zIHRoZSBvYmplY3Qga2V5LlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwbG9hZFRvUjIoXG4gIGtleTogc3RyaW5nLFxuICBib2R5OiBCdWZmZXIsXG4gIGNvbnRlbnRUeXBlOiBzdHJpbmdcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGF3YWl0IHIyLnNlbmQobmV3IFB1dE9iamVjdENvbW1hbmQoe1xuICAgIEJ1Y2tldDogQlVDS0VULFxuICAgIEtleToga2V5LFxuICAgIEJvZHk6IGJvZHksXG4gICAgQ29udGVudFR5cGU6IGNvbnRlbnRUeXBlLFxuICAgIC8vIE9iamVjdC1sZXZlbCBleHBpcnkgbWV0YWRhdGEgKGluZm9ybWF0aW9uYWwgXHUyMDE0IGFjdHVhbCBkZWxldGlvbiBkb25lIGJ5IGNsZWFudXAgd29ya2VyKVxuICAgIE1ldGFkYXRhOiB7ICdleHBpcmVzLWluJzogJzg2NDAwJyB9LFxuICB9KSlcbiAgcmV0dXJuIGtleVxufVxuXG4vLyBHZW5lcmF0ZSBhIHByZXNpZ25lZCBkb3dubG9hZCBVUkwgdmFsaWQgZm9yIDI0IGhvdXJzLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFByZXNpZ25lZFVybChrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBnZXRTaWduZWRVcmwoXG4gICAgcjIsXG4gICAgbmV3IEdldE9iamVjdENvbW1hbmQoeyBCdWNrZXQ6IEJVQ0tFVCwgS2V5OiBrZXkgfSksXG4gICAgeyBleHBpcmVzSW46IDg2NDAwIH0gLy8gMjRoIGluIHNlY29uZHNcbiAgKVxufVxuXG4vLyBEZWxldGUgYW4gb2JqZWN0IGZyb20gUjIuIFNhZmUgdG8gY2FsbCBldmVuIGlmIHRoZSBrZXkgaXMgYWxyZWFkeSBnb25lLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUZyb21SMihrZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGF3YWl0IHIyLnNlbmQobmV3IERlbGV0ZU9iamVjdENvbW1hbmQoeyBCdWNrZXQ6IEJVQ0tFVCwgS2V5OiBrZXkgfSkpXG4gIH0gY2F0Y2gge1xuICAgIC8vIEFscmVhZHkgZGVsZXRlZCBvciBuZXZlciBleGlzdGVkIFx1MjAxNCBub3QgYW4gZXJyb3JcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcXFxcc3JjXFxcXGRiXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcXFxcc3JjXFxcXGRiXFxcXHNjaGVtYS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMva2hhcm8vRG93bmxvYWRzL0V4ZWxmcm9tcGRmL3NyYy9kYi9zY2hlbWEudHNcIjtpbXBvcnQgeyBwZ1RhYmxlLCB0ZXh0LCBpbnRlZ2VyLCBiaWdpbnQsIHRpbWVzdGFtcCwgZG91YmxlUHJlY2lzaW9uIH0gZnJvbSAnZHJpenpsZS1vcm0vcGctY29yZSdcbmltcG9ydCB7IHJlbGF0aW9ucyB9IGZyb20gJ2RyaXp6bGUtb3JtJ1xuXG4vLyBBcHAtc3BlY2lmaWMgdGFibGVzIG9ubHkuXG4vLyBBdXRoIGlkZW50aXRpZXMgYXJlIG1hbmFnZWQgYnkgTmVvbiBBdXRoLlxuXG5leHBvcnQgY29uc3QgY29udmVyc2lvbnMgPSBwZ1RhYmxlKCdjb252ZXJzaW9ucycsIHtcbiAgaWQ6IHRleHQoJ2lkJykucHJpbWFyeUtleSgpLFxuICB1c2VySWQ6IHRleHQoJ3VzZXJfaWQnKSxcbiAgZmlsZU5hbWU6IHRleHQoJ2ZpbGVfbmFtZScpLm5vdE51bGwoKSxcbiAgc3RhdHVzOiB0ZXh0KCdzdGF0dXMnKS5ub3ROdWxsKCkuZGVmYXVsdCgncHJvY2Vzc2luZycpLFxuICAvLyBDbG91ZGZsYXJlIFIyIHN0b3JhZ2VcbiAgcjJLZXk6IHRleHQoJ3IyX2tleScpLCAgICAgICAgICAgLy8gb2JqZWN0IGtleSBpbiBSMiBidWNrZXRcbiAgb3V0cHV0VXJsOiB0ZXh0KCdvdXRwdXRfdXJsJyksICAgLy8gcHJlc2lnbmVkIGRvd25sb2FkIFVSTCAocmVnZW5lcmF0ZWQgb24gZGVtYW5kKVxuICBmaWxlU2l6ZTogYmlnaW50KCdmaWxlX3NpemUnLCB7IG1vZGU6ICdudW1iZXInIH0pLCAvLyBvcmlnaW5hbCBQREYgc2l6ZSBpbiBieXRlc1xuICBleHBpcmVzQXQ6IHRpbWVzdGFtcCgnZXhwaXJlc19hdCcpLCAvLyAyNGggYWZ0ZXIgY3JlYXRpb24gXHUyMDE0IGZpbGUgZGVsZXRlZCBmcm9tIFIyIGFmdGVyIHRoaXNcbiAgY3JlYXRlZEF0OiB0aW1lc3RhbXAoJ2NyZWF0ZWRfYXQnKS5kZWZhdWx0Tm93KCksXG4gIHVwZGF0ZWRBdDogdGltZXN0YW1wKCd1cGRhdGVkX2F0JykuZGVmYXVsdE5vdygpLFxufSlcblxuZXhwb3J0IGNvbnN0IHByb2ZpbGVzID0gcGdUYWJsZSgncHJvZmlsZXMnLCB7XG4gIGlkOiB0ZXh0KCdpZCcpLnByaW1hcnlLZXkoKSxcbiAgcGxhbjogdGV4dCgncGxhbicpLmRlZmF1bHQoJ2ZyZWUnKSxcbiAgY29udmVyc2lvbkNvdW50OiBpbnRlZ2VyKCdjb252ZXJzaW9uX2NvdW50JykuZGVmYXVsdCgwKSxcbiAgLy8gUmF6b3JwYXkgc3Vic2NyaXB0aW9uIHRyYWNraW5nXG4gIHN1YnNjcmlwdGlvbklkOiB0ZXh0KCdzdWJzY3JpcHRpb25faWQnKSxcbiAgc3Vic2NyaXB0aW9uU3RhdHVzOiB0ZXh0KCdzdWJzY3JpcHRpb25fc3RhdHVzJyksIC8vIGNyZWF0ZWQgfCBhdXRoZW50aWNhdGVkIHwgYWN0aXZlIHwgcGF1c2VkIHwgY2FuY2VsbGVkIHwgY29tcGxldGVkIHwgZXhwaXJlZFxuICBwbGFuSWQ6IHRleHQoJ3BsYW5faWQnKSwgICAgICAgICAvLyBlLmcuIHByb19tb250aGx5X0lOUlxuICByZW5ld2FsRGF0ZTogdGltZXN0YW1wKCdyZW5ld2FsX2RhdGUnKSxcbiAgdXBkYXRlZEF0OiB0aW1lc3RhbXAoJ3VwZGF0ZWRfYXQnKS5kZWZhdWx0Tm93KCksXG59KVxuXG5leHBvcnQgdHlwZSBDb252ZXJzaW9uID0gdHlwZW9mIGNvbnZlcnNpb25zLiRpbmZlclNlbGVjdFxuZXhwb3J0IHR5cGUgTmV3Q29udmVyc2lvbiA9IHR5cGVvZiBjb252ZXJzaW9ucy4kaW5mZXJJbnNlcnRcbmV4cG9ydCB0eXBlIFByb2ZpbGUgPSB0eXBlb2YgcHJvZmlsZXMuJGluZmVyU2VsZWN0XG5cbmV4cG9ydCBjb25zdCBwYXltZW50cyA9IHBnVGFibGUoJ3BheW1lbnRzJywge1xuICBpZDogdGV4dCgnaWQnKS5wcmltYXJ5S2V5KCksICAgICAgICAgICAgICAvLyByYXpvcnBheSBvcmRlcl9pZCBvciBzdWJzY3JpcHRpb25faWRcbiAgdXNlcklkOiB0ZXh0KCd1c2VyX2lkJyksXG4gIHVzZXJFbWFpbDogdGV4dCgndXNlcl9lbWFpbCcpLm5vdE51bGwoKSxcbiAgcGxhbklkOiB0ZXh0KCdwbGFuX2lkJykubm90TnVsbCgpLFxuICBhbW91bnQ6IGludGVnZXIoJ2Ftb3VudCcpLm5vdE51bGwoKSwgICAgICAgLy8gcGFpc2UvY2VudHMgKFJhem9ycGF5IHVuaXQpXG4gIGRpc3BsYXlBbW91bnQ6IGRvdWJsZVByZWNpc2lvbignZGlzcGxheV9hbW91bnQnKSwgLy8gaHVtYW4tcmVhZGFibGUgYW1vdW50IChlLmcuIDUwMC4wMCBmb3IgXHUyMEI5NTAwKVxuICBjdXJyZW5jeTogdGV4dCgnY3VycmVuY3knKS5ub3ROdWxsKCkuZGVmYXVsdCgnSU5SJyksXG4gIHN0YXR1czogdGV4dCgnc3RhdHVzJykubm90TnVsbCgpLmRlZmF1bHQoJ2NyZWF0ZWQnKSwgLy8gY3JlYXRlZCB8IHBhaWQgfCBmYWlsZWRcbiAgcGF5bWVudFR5cGU6IHRleHQoJ3BheW1lbnRfdHlwZScpLm5vdE51bGwoKS5kZWZhdWx0KCdvbmVfdGltZScpLCAvLyBvbmVfdGltZSB8IHN1YnNjcmlwdGlvblxuICByYXpvcnBheVBheW1lbnRJZDogdGV4dCgncmF6b3JwYXlfcGF5bWVudF9pZCcpLFxuICByYXpvcnBheVNpZ25hdHVyZTogdGV4dCgncmF6b3JwYXlfc2lnbmF0dXJlJyksXG4gIHJhem9ycGF5U3Vic2NyaXB0aW9uSWQ6IHRleHQoJ3Jhem9ycGF5X3N1YnNjcmlwdGlvbl9pZCcpLFxuICBjcmVhdGVkQXQ6IHRpbWVzdGFtcCgnY3JlYXRlZF9hdCcpLmRlZmF1bHROb3coKSxcbiAgdXBkYXRlZEF0OiB0aW1lc3RhbXAoJ3VwZGF0ZWRfYXQnKS5kZWZhdWx0Tm93KCksXG59KVxuXG5leHBvcnQgdHlwZSBQYXltZW50ID0gdHlwZW9mIHBheW1lbnRzLiRpbmZlclNlbGVjdFxuXG5leHBvcnQgY29uc3QgY29udmVyc2lvbnNSZWxhdGlvbnMgPSByZWxhdGlvbnMoY29udmVyc2lvbnMsICh7IG9uZSB9KSA9PiAoe1xuICBwcm9maWxlOiBvbmUocHJvZmlsZXMsIHsgZmllbGRzOiBbY29udmVyc2lvbnMudXNlcklkXSwgcmVmZXJlbmNlczogW3Byb2ZpbGVzLmlkXSB9KSxcbn0pKVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGtoYXJvXFxcXERvd25sb2Fkc1xcXFxFeGVsZnJvbXBkZlxcXFxhdXRoLXNjaGVtYS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMva2hhcm8vRG93bmxvYWRzL0V4ZWxmcm9tcGRmL2F1dGgtc2NoZW1hLnRzXCI7aW1wb3J0IHsgcmVsYXRpb25zIH0gZnJvbSBcImRyaXp6bGUtb3JtXCI7XG5pbXBvcnQgeyBwZ1RhYmxlLCB0ZXh0LCB0aW1lc3RhbXAsIGJvb2xlYW4sIGluZGV4IH0gZnJvbSBcImRyaXp6bGUtb3JtL3BnLWNvcmVcIjtcblxuZXhwb3J0IGNvbnN0IHVzZXIgPSBwZ1RhYmxlKFwidXNlclwiLCB7XG4gIGlkOiB0ZXh0KFwiaWRcIikucHJpbWFyeUtleSgpLFxuICBuYW1lOiB0ZXh0KFwibmFtZVwiKS5ub3ROdWxsKCksXG4gIGVtYWlsOiB0ZXh0KFwiZW1haWxcIikubm90TnVsbCgpLnVuaXF1ZSgpLFxuICBlbWFpbFZlcmlmaWVkOiBib29sZWFuKFwiZW1haWxfdmVyaWZpZWRcIikuZGVmYXVsdChmYWxzZSkubm90TnVsbCgpLFxuICBpbWFnZTogdGV4dChcImltYWdlXCIpLFxuICBjcmVhdGVkQXQ6IHRpbWVzdGFtcChcImNyZWF0ZWRfYXRcIikuZGVmYXVsdE5vdygpLm5vdE51bGwoKSxcbiAgdXBkYXRlZEF0OiB0aW1lc3RhbXAoXCJ1cGRhdGVkX2F0XCIpXG4gICAgLmRlZmF1bHROb3coKVxuICAgIC4kb25VcGRhdGUoKCkgPT4gLyogQF9fUFVSRV9fICovIG5ldyBEYXRlKCkpXG4gICAgLm5vdE51bGwoKSxcbn0pO1xuXG5leHBvcnQgY29uc3Qgc2Vzc2lvbiA9IHBnVGFibGUoXG4gIFwic2Vzc2lvblwiLFxuICB7XG4gICAgaWQ6IHRleHQoXCJpZFwiKS5wcmltYXJ5S2V5KCksXG4gICAgZXhwaXJlc0F0OiB0aW1lc3RhbXAoXCJleHBpcmVzX2F0XCIpLm5vdE51bGwoKSxcbiAgICB0b2tlbjogdGV4dChcInRva2VuXCIpLm5vdE51bGwoKS51bmlxdWUoKSxcbiAgICBjcmVhdGVkQXQ6IHRpbWVzdGFtcChcImNyZWF0ZWRfYXRcIikuZGVmYXVsdE5vdygpLm5vdE51bGwoKSxcbiAgICB1cGRhdGVkQXQ6IHRpbWVzdGFtcChcInVwZGF0ZWRfYXRcIilcbiAgICAgIC4kb25VcGRhdGUoKCkgPT4gLyogQF9fUFVSRV9fICovIG5ldyBEYXRlKCkpXG4gICAgICAubm90TnVsbCgpLFxuICAgIGlwQWRkcmVzczogdGV4dChcImlwX2FkZHJlc3NcIiksXG4gICAgdXNlckFnZW50OiB0ZXh0KFwidXNlcl9hZ2VudFwiKSxcbiAgICB1c2VySWQ6IHRleHQoXCJ1c2VyX2lkXCIpXG4gICAgICAubm90TnVsbCgpXG4gICAgICAucmVmZXJlbmNlcygoKSA9PiB1c2VyLmlkLCB7IG9uRGVsZXRlOiBcImNhc2NhZGVcIiB9KSxcbiAgfSxcbiAgKHRhYmxlKSA9PiBbaW5kZXgoXCJzZXNzaW9uX3VzZXJJZF9pZHhcIikub24odGFibGUudXNlcklkKV0sXG4pO1xuXG5leHBvcnQgY29uc3QgYWNjb3VudCA9IHBnVGFibGUoXG4gIFwiYWNjb3VudFwiLFxuICB7XG4gICAgaWQ6IHRleHQoXCJpZFwiKS5wcmltYXJ5S2V5KCksXG4gICAgYWNjb3VudElkOiB0ZXh0KFwiYWNjb3VudF9pZFwiKS5ub3ROdWxsKCksXG4gICAgcHJvdmlkZXJJZDogdGV4dChcInByb3ZpZGVyX2lkXCIpLm5vdE51bGwoKSxcbiAgICB1c2VySWQ6IHRleHQoXCJ1c2VyX2lkXCIpXG4gICAgICAubm90TnVsbCgpXG4gICAgICAucmVmZXJlbmNlcygoKSA9PiB1c2VyLmlkLCB7IG9uRGVsZXRlOiBcImNhc2NhZGVcIiB9KSxcbiAgICBhY2Nlc3NUb2tlbjogdGV4dChcImFjY2Vzc190b2tlblwiKSxcbiAgICByZWZyZXNoVG9rZW46IHRleHQoXCJyZWZyZXNoX3Rva2VuXCIpLFxuICAgIGlkVG9rZW46IHRleHQoXCJpZF90b2tlblwiKSxcbiAgICBhY2Nlc3NUb2tlbkV4cGlyZXNBdDogdGltZXN0YW1wKFwiYWNjZXNzX3Rva2VuX2V4cGlyZXNfYXRcIiksXG4gICAgcmVmcmVzaFRva2VuRXhwaXJlc0F0OiB0aW1lc3RhbXAoXCJyZWZyZXNoX3Rva2VuX2V4cGlyZXNfYXRcIiksXG4gICAgc2NvcGU6IHRleHQoXCJzY29wZVwiKSxcbiAgICBwYXNzd29yZDogdGV4dChcInBhc3N3b3JkXCIpLFxuICAgIGNyZWF0ZWRBdDogdGltZXN0YW1wKFwiY3JlYXRlZF9hdFwiKS5kZWZhdWx0Tm93KCkubm90TnVsbCgpLFxuICAgIHVwZGF0ZWRBdDogdGltZXN0YW1wKFwidXBkYXRlZF9hdFwiKVxuICAgICAgLiRvblVwZGF0ZSgoKSA9PiAvKiBAX19QVVJFX18gKi8gbmV3IERhdGUoKSlcbiAgICAgIC5ub3ROdWxsKCksXG4gIH0sXG4gICh0YWJsZSkgPT4gW2luZGV4KFwiYWNjb3VudF91c2VySWRfaWR4XCIpLm9uKHRhYmxlLnVzZXJJZCldLFxuKTtcblxuZXhwb3J0IGNvbnN0IHZlcmlmaWNhdGlvbiA9IHBnVGFibGUoXG4gIFwidmVyaWZpY2F0aW9uXCIsXG4gIHtcbiAgICBpZDogdGV4dChcImlkXCIpLnByaW1hcnlLZXkoKSxcbiAgICBpZGVudGlmaWVyOiB0ZXh0KFwiaWRlbnRpZmllclwiKS5ub3ROdWxsKCksXG4gICAgdmFsdWU6IHRleHQoXCJ2YWx1ZVwiKS5ub3ROdWxsKCksXG4gICAgZXhwaXJlc0F0OiB0aW1lc3RhbXAoXCJleHBpcmVzX2F0XCIpLm5vdE51bGwoKSxcbiAgICBjcmVhdGVkQXQ6IHRpbWVzdGFtcChcImNyZWF0ZWRfYXRcIikuZGVmYXVsdE5vdygpLm5vdE51bGwoKSxcbiAgICB1cGRhdGVkQXQ6IHRpbWVzdGFtcChcInVwZGF0ZWRfYXRcIilcbiAgICAgIC5kZWZhdWx0Tm93KClcbiAgICAgIC4kb25VcGRhdGUoKCkgPT4gLyogQF9fUFVSRV9fICovIG5ldyBEYXRlKCkpXG4gICAgICAubm90TnVsbCgpLFxuICB9LFxuICAodGFibGUpID0+IFtpbmRleChcInZlcmlmaWNhdGlvbl9pZGVudGlmaWVyX2lkeFwiKS5vbih0YWJsZS5pZGVudGlmaWVyKV0sXG4pO1xuXG5leHBvcnQgY29uc3QgdXNlclJlbGF0aW9ucyA9IHJlbGF0aW9ucyh1c2VyLCAoeyBtYW55IH0pID0+ICh7XG4gIHNlc3Npb25zOiBtYW55KHNlc3Npb24pLFxuICBhY2NvdW50czogbWFueShhY2NvdW50KSxcbn0pKTtcblxuZXhwb3J0IGNvbnN0IHNlc3Npb25SZWxhdGlvbnMgPSByZWxhdGlvbnMoc2Vzc2lvbiwgKHsgb25lIH0pID0+ICh7XG4gIHVzZXI6IG9uZSh1c2VyLCB7XG4gICAgZmllbGRzOiBbc2Vzc2lvbi51c2VySWRdLFxuICAgIHJlZmVyZW5jZXM6IFt1c2VyLmlkXSxcbiAgfSksXG59KSk7XG5cbmV4cG9ydCBjb25zdCBhY2NvdW50UmVsYXRpb25zID0gcmVsYXRpb25zKGFjY291bnQsICh7IG9uZSB9KSA9PiAoe1xuICB1c2VyOiBvbmUodXNlciwge1xuICAgIGZpZWxkczogW2FjY291bnQudXNlcklkXSxcbiAgICByZWZlcmVuY2VzOiBbdXNlci5pZF0sXG4gIH0pLFxufSkpO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcXFxcc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcXFxcc2VydmVyXFxcXHJlc2VuZC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMva2hhcm8vRG93bmxvYWRzL0V4ZWxmcm9tcGRmL3NlcnZlci9yZXNlbmQudHNcIjtpbXBvcnQgJ2RvdGVudi9jb25maWcnXG5cbmludGVyZmFjZSBFbWFpbFBheWxvYWQge1xuICB0bzogc3RyaW5nXG4gIHN1YmplY3Q6IHN0cmluZ1xuICBodG1sOiBzdHJpbmdcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRFbWFpbCh7IHRvLCBzdWJqZWN0LCBodG1sIH06IEVtYWlsUGF5bG9hZCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBSRVNFTkRfQVBJX0tFWSA9IHByb2Nlc3MuZW52LlJFU0VORF9BUElfS0VZIHx8ICcnXG4gIGNvbnN0IEZST01fQUREUkVTUyA9IHByb2Nlc3MuZW52LlJFU0VORF9GUk9NIHx8ICdFeGNlbGZyb21QREYgPG9uYm9hcmRpbmdAcmVzZW5kLmRldj4nXG5cbiAgaWYgKCFSRVNFTkRfQVBJX0tFWSkge1xuICAgIGNvbnNvbGUubG9nKGBbcmVzZW5kXSBSRVNFTkRfQVBJX0tFWSBub3Qgc2V0IFx1MjAxNCBza2lwcGluZyBlbWFpbCB0byAke3RvfWApXG4gICAgY29uc29sZS5sb2coYFtyZXNlbmRdIFN1YmplY3Q6ICR7c3ViamVjdH1gKVxuICAgIHJldHVyblxuICB9XG5cbiAgY29uc29sZS5sb2coYFtyZXNlbmRdIFNlbmRpbmcgdG8gJHt0b30gZnJvbSAke0ZST01fQUREUkVTU31gKVxuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5yZXNlbmQuY29tL2VtYWlscycsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtSRVNFTkRfQVBJX0tFWX1gLFxuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZnJvbTogRlJPTV9BRERSRVNTLCB0bywgc3ViamVjdCwgaHRtbCB9KSxcbiAgfSlcblxuICBpZiAoIXJlcy5vaykge1xuICAgIGNvbnN0IGVyciA9IGF3YWl0IHJlcy50ZXh0KClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFJlc2VuZCBBUEkgZXJyb3IgJHtyZXMuc3RhdHVzfTogJHtlcnJ9YClcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBbcmVzZW5kXSBFbWFpbCBzZW50IHRvICR7dG99YClcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxca2hhcm9cXFxcRG93bmxvYWRzXFxcXEV4ZWxmcm9tcGRmXFxcXHNlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxca2hhcm9cXFxcRG93bmxvYWRzXFxcXEV4ZWxmcm9tcGRmXFxcXHNlcnZlclxcXFxlbWFpbFRlbXBsYXRlcy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMva2hhcm8vRG93bmxvYWRzL0V4ZWxmcm9tcGRmL3NlcnZlci9lbWFpbFRlbXBsYXRlcy50c1wiO2NvbnN0IEJBU0VfU1RZTEUgPSBgXG4gIDxzdHlsZT5cbiAgICBAaW1wb3J0IHVybCgnaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1JbnRlcjp3Z2h0QDQwMDs1MDA7NjAwOzcwMCZkaXNwbGF5PXN3YXAnKTtcbiAgICAqIHsgYm94LXNpemluZzogYm9yZGVyLWJveDsgbWFyZ2luOiAwOyBwYWRkaW5nOiAwOyB9XG4gICAgYm9keSB7IGJhY2tncm91bmQtY29sb3I6ICNmOWZhZmI7IGZvbnQtZmFtaWx5OiBJbnRlciwgLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCBzYW5zLXNlcmlmOyB9XG4gIDwvc3R5bGU+XG5gXG5cbmZ1bmN0aW9uIHdyYXBwZXIoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGA8IURPQ1RZUEUgaHRtbD5cbjxodG1sIGxhbmc9XCJlblwiPlxuPGhlYWQ+XG4gIDxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiIC8+XG4gIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCIgLz5cbiAgPHRpdGxlPkV4Y2VsZnJvbVBERjwvdGl0bGU+XG4gICR7QkFTRV9TVFlMRX1cbjwvaGVhZD5cbjxib2R5IHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjojZjlmYWZiO3BhZGRpbmc6NDBweCAxNnB4O21hcmdpbjowO1wiPlxuICA8dGFibGUgd2lkdGg9XCIxMDAlXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgc3R5bGU9XCJtYXgtd2lkdGg6NTIwcHg7bWFyZ2luOjAgYXV0bztcIj5cbiAgICA8dHI+XG4gICAgICA8dGQ+XG5cbiAgICAgICAgPCEtLSBIZWFkZXIgLS0+XG4gICAgICAgIDx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206MjRweDt0ZXh0LWFsaWduOmNlbnRlcjtcIj5cbiAgICAgICAgICA8dHI+XG4gICAgICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOjAgMCA4cHg7XCI+XG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPVwiZm9udC1zaXplOjIycHg7Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOiMxNjY1MzQ7bGV0dGVyLXNwYWNpbmc6LTAuNXB4O1wiPlxuICAgICAgICAgICAgICAgIEV4Y2VsPHNwYW4gc3R5bGU9XCJjb2xvcjojMTZhMzRhO1wiPmZyb208L3NwYW4+UERGXG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90YWJsZT5cblxuICAgICAgICA8IS0tIENhcmQgLS0+XG4gICAgICAgIDx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIlxuICAgICAgICAgIHN0eWxlPVwiYmFja2dyb3VuZDojZmZmZmZmO2JvcmRlci1yYWRpdXM6MTZweDtib3JkZXI6MXB4IHNvbGlkICNlNWU3ZWI7b3ZlcmZsb3c6aGlkZGVuO1wiPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDwhLS0gR3JlZW4gdG9wIGJhciAtLT5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cImhlaWdodDo0cHg7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoOTBkZWcsIzE2NjUzNCAwJSwjMTZhMzRhIDUwJSwjMjJjNTVlIDEwMCUpO2Rpc3BsYXk6YmxvY2s7XCI+PC90ZD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6NDBweCA0MHB4IDM2cHg7XCI+XG4gICAgICAgICAgICAgICR7Y29udGVudH1cbiAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90YWJsZT5cblxuICAgICAgICA8IS0tIEZvb3RlciAtLT5cbiAgICAgICAgPHRhYmxlIHdpZHRoPVwiMTAwJVwiIGNlbGxwYWRkaW5nPVwiMFwiIGNlbGxzcGFjaW5nPVwiMFwiIHN0eWxlPVwibWFyZ2luLXRvcDoyNHB4O3RleHQtYWxpZ246Y2VudGVyO1wiPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cImZvbnQtc2l6ZToxMnB4O2NvbG9yOiM5Y2EzYWY7bGluZS1oZWlnaHQ6MS42O1wiPlxuICAgICAgICAgICAgICBFeGNlbGZyb21QREYgJm1kYXNoOyBDb252ZXJ0IFBERnMgdG8gRXhjZWwgaW5zdGFudGx5PGJyLz5cbiAgICAgICAgICAgICAgWW91IHJlY2VpdmVkIHRoaXMgZW1haWwgYmVjYXVzZSBhbiBhY3Rpb24gd2FzIHJlcXVlc3RlZCBvbiB5b3VyIGFjY291bnQuPGJyLz5cbiAgICAgICAgICAgICAgSWYgeW91IGRpZG4ndCByZXF1ZXN0IHRoaXMsIHlvdSBjYW4gc2FmZWx5IGlnbm9yZSB0aGlzIGVtYWlsLlxuICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICA8L3RhYmxlPlxuXG4gICAgICA8L3RkPlxuICAgIDwvdHI+XG4gIDwvdGFibGU+XG48L2JvZHk+XG48L2h0bWw+YFxufVxuXG5mdW5jdGlvbiBjdGFCdXR0b24obGFiZWw6IHN0cmluZywgdXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYFxuICAgIDx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIiBzdHlsZT1cIm1hcmdpbjoyOHB4IDA7XCI+XG4gICAgICA8dHI+XG4gICAgICAgIDx0ZCBhbGlnbj1cImNlbnRlclwiPlxuICAgICAgICAgIDxhIGhyZWY9XCIke3VybH1cIlxuICAgICAgICAgICAgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9jaztwYWRkaW5nOjEzcHggMzJweDtiYWNrZ3JvdW5kOiMxNjY1MzQ7Y29sb3I6I2ZmZmZmZjtcbiAgICAgICAgICAgICAgICAgICBmb250LXNpemU6MTVweDtmb250LXdlaWdodDo2MDA7dGV4dC1kZWNvcmF0aW9uOm5vbmU7Ym9yZGVyLXJhZGl1czo4cHg7XG4gICAgICAgICAgICAgICAgICAgbGV0dGVyLXNwYWNpbmc6MC4xcHg7XCI+XG4gICAgICAgICAgICAke2xhYmVsfVxuICAgICAgICAgIDwvYT5cbiAgICAgICAgPC90ZD5cbiAgICAgIDwvdHI+XG4gICAgPC90YWJsZT5cbiAgYFxufVxuXG5mdW5jdGlvbiBmYWxsYmFja0xpbmsodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYFxuICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOjEycHg7Y29sb3I6IzljYTNhZjttYXJnaW4tdG9wOjIwcHg7d29yZC1icmVhazpicmVhay1hbGw7XCI+XG4gICAgICBCdXR0b24gbm90IHdvcmtpbmc/IENvcHkgYW5kIHBhc3RlIHRoaXMgbGluayBpbnRvIHlvdXIgYnJvd3Nlcjo8YnIvPlxuICAgICAgPGEgaHJlZj1cIiR7dXJsfVwiIHN0eWxlPVwiY29sb3I6IzE2NjUzNDt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO1wiPiR7dXJsfTwvYT5cbiAgICA8L3A+XG4gIGBcbn1cblxuZnVuY3Rpb24gZGl2aWRlcigpOiBzdHJpbmcge1xuICByZXR1cm4gYDxociBzdHlsZT1cImJvcmRlcjpub25lO2JvcmRlci10b3A6MXB4IHNvbGlkICNmM2Y0ZjY7bWFyZ2luOjI0cHggMDtcIiAvPmBcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFBhc3N3b3JkIFJlc2V0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRQYXNzd29yZEVtYWlsKG5hbWU6IHN0cmluZywgcmVzZXRVcmw6IHN0cmluZywgYXBwVXJsID0gJ2h0dHBzOi8vd3d3LmV4Y2VsZnJvbXBkZi5jb20nKTogc3RyaW5nIHtcbiAgY29uc3QgZGlzcGxheU5hbWUgPSBuYW1lIHx8ICd0aGVyZSdcblxuICBjb25zdCBjb250ZW50ID0gYFxuICAgIDwhLS0gSWNvbiAtLT5cbiAgICA8dGFibGUgd2lkdGg9XCIxMDAlXCIgY2VsbHBhZGRpbmc9XCIwXCIgY2VsbHNwYWNpbmc9XCIwXCIgc3R5bGU9XCJtYXJnaW4tYm90dG9tOjI0cHg7XCI+XG4gICAgICA8dHI+XG4gICAgICAgIDx0ZD5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwid2lkdGg6NDhweDtoZWlnaHQ6NDhweDtiYWNrZ3JvdW5kOiNmMGZkZjQ7Ym9yZGVyLXJhZGl1czoxMnB4O1xuICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtcbiAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU6MjRweDtsaW5lLWhlaWdodDo0OHB4O3RleHQtYWxpZ246Y2VudGVyO1wiPlxuICAgICAgICAgICAgXHVEODNEXHVERDEwXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvdGQ+XG4gICAgICA8L3RyPlxuICAgIDwvdGFibGU+XG5cbiAgICA8aDEgc3R5bGU9XCJmb250LXNpemU6MjJweDtmb250LXdlaWdodDo3MDA7Y29sb3I6IzExMTgyNzttYXJnaW46MCAwIDhweDtsZXR0ZXItc3BhY2luZzotMC4zcHg7XCI+XG4gICAgICBSZXNldCB5b3VyIHBhc3N3b3JkXG4gICAgPC9oMT5cbiAgICA8cCBzdHlsZT1cImZvbnQtc2l6ZToxNXB4O2NvbG9yOiM2YjcyODA7bWFyZ2luOjAgMCA0cHg7bGluZS1oZWlnaHQ6MS42O1wiPlxuICAgICAgSGkgJHtkaXNwbGF5TmFtZX0sXG4gICAgPC9wPlxuICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOjE1cHg7Y29sb3I6IzZiNzI4MDttYXJnaW46MDtsaW5lLWhlaWdodDoxLjY7XCI+XG4gICAgICBXZSByZWNlaXZlZCBhIHJlcXVlc3QgdG8gcmVzZXQgdGhlIHBhc3N3b3JkIGZvciB5b3VyIEV4Y2VsZnJvbVBERiBhY2NvdW50LlxuICAgICAgQ2xpY2sgdGhlIGJ1dHRvbiBiZWxvdyB0byBjaG9vc2UgYSBuZXcgcGFzc3dvcmQuXG4gICAgPC9wPlxuXG4gICAgJHtjdGFCdXR0b24oJ1Jlc2V0IFBhc3N3b3JkJywgcmVzZXRVcmwpfVxuXG4gICAgPCEtLSBFeHBpcnkgbm90aWNlIC0tPlxuICAgIDx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIj5cbiAgICAgIDx0cj5cbiAgICAgICAgPHRkIHN0eWxlPVwiYmFja2dyb3VuZDojZmZmYmViO2JvcmRlcjoxcHggc29saWQgI2ZlZjNjNztib3JkZXItcmFkaXVzOjhweDtcbiAgICAgICAgICAgICAgICAgICBwYWRkaW5nOjEycHggMTZweDtcIj5cbiAgICAgICAgICA8cCBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOiM5MjQwMGU7bWFyZ2luOjA7XCI+XG4gICAgICAgICAgICBcdTIzRjEgVGhpcyBsaW5rIGV4cGlyZXMgaW4gPHN0cm9uZz4xIGhvdXI8L3N0cm9uZz4uIElmIGl0IGV4cGlyZXMsIHlvdSBjYW5cbiAgICAgICAgICAgIDxhIGhyZWY9XCIke2FwcFVybH0vZm9yZ290LXBhc3N3b3JkXCIgc3R5bGU9XCJjb2xvcjojMTY2NTM0O2ZvbnQtd2VpZ2h0OjYwMDt0ZXh0LWRlY29yYXRpb246bm9uZTtcIj5cbiAgICAgICAgICAgICAgcmVxdWVzdCBhIG5ldyBvbmVcbiAgICAgICAgICAgIDwvYT4uXG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L3RkPlxuICAgICAgPC90cj5cbiAgICA8L3RhYmxlPlxuXG4gICAgJHtkaXZpZGVyKCl9XG5cbiAgICA8cCBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOiM5Y2EzYWY7bWFyZ2luOjA7bGluZS1oZWlnaHQ6MS42O1wiPlxuICAgICAgRGlkbid0IHJlcXVlc3QgYSBwYXNzd29yZCByZXNldD8gTm8gYWN0aW9uIGlzIG5lZWRlZCBcdTIwMTQgeW91ciBhY2NvdW50IGlzIHNhZmUuXG4gICAgICBTb21lb25lIG1heSBoYXZlIHR5cGVkIHlvdXIgZW1haWwgYWRkcmVzcyBieSBtaXN0YWtlLlxuICAgIDwvcD5cblxuICAgICR7ZmFsbGJhY2tMaW5rKHJlc2V0VXJsKX1cbiAgYFxuXG4gIHJldHVybiB3cmFwcGVyKGNvbnRlbnQpXG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBFbWFpbCBWZXJpZmljYXRpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBmdW5jdGlvbiB2ZXJpZnlFbWFpbFRlbXBsYXRlKG5hbWU6IHN0cmluZywgdmVyaWZ5VXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkaXNwbGF5TmFtZSA9IG5hbWUgfHwgJ3RoZXJlJ1xuXG4gIGNvbnN0IGNvbnRlbnQgPSBgXG4gICAgPCEtLSBJY29uIC0tPlxuICAgIDx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206MjRweDtcIj5cbiAgICAgIDx0cj5cbiAgICAgICAgPHRkPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJ3aWR0aDo0OHB4O2hlaWdodDo0OHB4O2JhY2tncm91bmQ6I2YwZmRmNDtib3JkZXItcmFkaXVzOjEycHg7XG4gICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZToyNHB4O2xpbmUtaGVpZ2h0OjQ4cHg7dGV4dC1hbGlnbjpjZW50ZXI7XCI+XG4gICAgICAgICAgICBcdTI3MDlcdUZFMEZcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC90ZD5cbiAgICAgIDwvdHI+XG4gICAgPC90YWJsZT5cblxuICAgIDxoMSBzdHlsZT1cImZvbnQtc2l6ZToyMnB4O2ZvbnQtd2VpZ2h0OjcwMDtjb2xvcjojMTExODI3O21hcmdpbjowIDAgOHB4O2xldHRlci1zcGFjaW5nOi0wLjNweDtcIj5cbiAgICAgIFZlcmlmeSB5b3VyIGVtYWlsIGFkZHJlc3NcbiAgICA8L2gxPlxuICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOjE1cHg7Y29sb3I6IzZiNzI4MDttYXJnaW46MCAwIDRweDtsaW5lLWhlaWdodDoxLjY7XCI+XG4gICAgICBIaSAke2Rpc3BsYXlOYW1lfSxcbiAgICA8L3A+XG4gICAgPHAgc3R5bGU9XCJmb250LXNpemU6MTVweDtjb2xvcjojNmI3MjgwO21hcmdpbjowO2xpbmUtaGVpZ2h0OjEuNjtcIj5cbiAgICAgIFdlbGNvbWUgdG8gRXhjZWxmcm9tUERGISBQbGVhc2UgdmVyaWZ5IHlvdXIgZW1haWwgYWRkcmVzcyB0byBhY3RpdmF0ZSB5b3VyIGFjY291bnRcbiAgICAgIGFuZCBzdGFydCBjb252ZXJ0aW5nIFBERnMgdG8gRXhjZWwuXG4gICAgPC9wPlxuXG4gICAgJHtjdGFCdXR0b24oJ1ZlcmlmeSBFbWFpbCBBZGRyZXNzJywgdmVyaWZ5VXJsKX1cblxuICAgIDwhLS0gV2hhdCB5b3UgZ2V0IC0tPlxuICAgIDx0YWJsZSB3aWR0aD1cIjEwMCVcIiBjZWxscGFkZGluZz1cIjBcIiBjZWxsc3BhY2luZz1cIjBcIj5cbiAgICAgIDx0cj5cbiAgICAgICAgPHRkIHN0eWxlPVwiYmFja2dyb3VuZDojZjBmZGY0O2JvcmRlcjoxcHggc29saWQgI2RjZmNlNztib3JkZXItcmFkaXVzOjhweDtwYWRkaW5nOjE2cHggMjBweDtcIj5cbiAgICAgICAgICA8cCBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjYwMDtjb2xvcjojMTY2NTM0O21hcmdpbjowIDAgMTBweDtcIj5cbiAgICAgICAgICAgIFdoYXQgeW91IGdldCB3aXRoIEV4Y2VsZnJvbVBERjpcbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPHRhYmxlIGNlbGxwYWRkaW5nPVwiMFwiIGNlbGxzcGFjaW5nPVwiMFwiPlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJmb250LXNpemU6MTNweDtjb2xvcjojMTU4MDNkO3BhZGRpbmc6M3B4IDA7XCI+XHUyNzEzJm5ic3A7Jm5ic3A7Q29udmVydCBQREZzIHRvIEV4Y2VsIGluIHNlY29uZHM8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIHN0eWxlPVwiZm9udC1zaXplOjEzcHg7Y29sb3I6IzE1ODAzZDtwYWRkaW5nOjNweCAwO1wiPlx1MjcxMyZuYnNwOyZuYnNwO0FjY3VyYXRlIHRhYmxlIGRldGVjdGlvbiAmYW1wOyBmb3JtYXR0aW5nPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOiMxNTgwM2Q7cGFkZGluZzozcHggMDtcIj5cdTI3MTMmbmJzcDsmbmJzcDs1IGZyZWUgY29udmVyc2lvbnMgdG8gZ2V0IHN0YXJ0ZWQ8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICA8L3RkPlxuICAgICAgPC90cj5cbiAgICA8L3RhYmxlPlxuXG4gICAgJHtkaXZpZGVyKCl9XG5cbiAgICA8cCBzdHlsZT1cImZvbnQtc2l6ZToxM3B4O2NvbG9yOiM5Y2EzYWY7bWFyZ2luOjA7bGluZS1oZWlnaHQ6MS42O1wiPlxuICAgICAgRGlkbid0IGNyZWF0ZSBhbiBFeGNlbGZyb21QREYgYWNjb3VudD8gWW91IGNhbiBzYWZlbHkgaWdub3JlIHRoaXMgZW1haWwgXHUyMDE0XG4gICAgICBubyBhY2NvdW50IHdpbGwgYmUgY3JlYXRlZCB3aXRob3V0IHZlcmlmaWNhdGlvbi5cbiAgICA8L3A+XG5cbiAgICAke2ZhbGxiYWNrTGluayh2ZXJpZnlVcmwpfVxuICBgXG5cbiAgcmV0dXJuIHdyYXBwZXIoY29udGVudClcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxca2hhcm9cXFxcRG93bmxvYWRzXFxcXEV4ZWxmcm9tcGRmXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxraGFyb1xcXFxEb3dubG9hZHNcXFxcRXhlbGZyb21wZGZcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2toYXJvL0Rvd25sb2Fkcy9FeGVsZnJvbXBkZi92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcclxuaW1wb3J0IG11bHRlciBmcm9tICdtdWx0ZXInXHJcbmltcG9ydCB7IHJhbmRvbVVVSUQsIGNyZWF0ZUhtYWMsIHJhbmRvbUJ5dGVzIH0gZnJvbSAnY3J5cHRvJ1xyXG5pbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tICdodHRwJ1xyXG5pbXBvcnQgeyBjb25maWcgYXMgbG9hZERvdGVudiB9IGZyb20gJ2RvdGVudidcclxuXHJcbi8vIExvYWQgLmVudiBzbyBzZXJ2ZXItc2lkZSB2YXJzIChSMl8qLCBEQVRBQkFTRV9VUkwsIGV0Yy4pIGFyZSBhdmFpbGFibGVcclxuLy8gaW4gdGhlIFZpdGUgcGx1Z2luIG1pZGRsZXdhcmUgXHUyMDE0IFZpdGUgb25seSBhdXRvLWV4cG9zZXMgVklURV8qIHRvIHRoZSBicm93c2VyLlxyXG5sb2FkRG90ZW52KHsgcGF0aDogJy5lbnYnIH0pXHJcbmxvYWREb3RlbnYoeyBwYXRoOiAnLmVudi5sb2NhbCcsIG92ZXJyaWRlOiB0cnVlIH0pXHJcblxyXG5jb25zdCBSQVpPUlBBWV9LRVlfSUQgICAgID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX0lEICAgICB8fCBwcm9jZXNzLmVudi5WSVRFX1JBWk9SUEFZX0tFWV9JRCB8fCAnJ1xyXG5jb25zdCBSQVpPUlBBWV9LRVlfU0VDUkVUID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVCB8fCAnJ1xyXG5cclxuZnVuY3Rpb24gdmFsaWRhdGVSYXpvcnBheUNyZWRlbnRpYWxzKCkge1xyXG4gIGNvbnN0IG1pc3NpbmcgPSBbXHJcbiAgICAhUkFaT1JQQVlfS0VZX0lEICYmICdSQVpPUlBBWV9LRVlfSUQnLFxyXG4gICAgIVJBWk9SUEFZX0tFWV9TRUNSRVQgJiYgJ1JBWk9SUEFZX0tFWV9TRUNSRVQnLFxyXG4gIF0uZmlsdGVyKEJvb2xlYW4pXHJcblxyXG4gIGlmIChtaXNzaW5nLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuIGBSYXpvcnBheSBjcmVkZW50aWFscyBub3QgY29uZmlndXJlZCBvbiBzZXJ2ZXI6IG1pc3NpbmcgJHttaXNzaW5nLmpvaW4oJywgJyl9YFxyXG4gIH1cclxuXHJcbiAgaWYgKCEvXnJ6cF8odGVzdHxsaXZlKV8vLnRlc3QoUkFaT1JQQVlfS0VZX0lEKSkge1xyXG4gICAgcmV0dXJuICdJbnZhbGlkIFJhem9ycGF5IEtleSBJRC4gSXQgbXVzdCBzdGFydCB3aXRoIHJ6cF90ZXN0XyBvciByenBfbGl2ZV8uJ1xyXG4gIH1cclxuXHJcbiAgaWYgKFJBWk9SUEFZX0tFWV9TRUNSRVQuc3RhcnRzV2l0aCgncnpwXycpKSB7XHJcbiAgICByZXR1cm4gJ0ludmFsaWQgUmF6b3JwYXkgS2V5IFNlY3JldC4gWW91IHBhc3RlZCBhIEtleSBJRCBpbnRvIFJBWk9SUEFZX0tFWV9TRUNSRVQ7IHVzZSB0aGUgbWF0Y2hpbmcgc2VjcmV0IGZyb20gUmF6b3JwYXkgRGFzaGJvYXJkLidcclxuICB9XHJcblxyXG4gIHJldHVybiBudWxsXHJcbn1cclxuXHJcbi8vIHBsYW5faWQgZm9ybWF0OiBwcm9fe2N5Y2xlfV9JTlIuIElOUiBhbW91bnRzIGFyZSBpbiBwYWlzZS5cclxuY29uc3QgUExBTl9BTU9VTlRTOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge1xyXG4gIHByb19tb250aGx5X0lOUjogNTAwMDAsICAvLyBcdTIwQjk1MDBcclxuICBwcm9feWVhcmx5X0lOUjogIDM2MDAwMCwgLy8gXHUyMEI5Myw2MDBcclxufVxyXG5cclxuLy8gSHVtYW4tcmVhZGFibGUgZGlzcGxheSBhbW91bnRzIChub3QgeDEwMClcclxuY29uc3QgUExBTl9ESVNQTEFZX0FNT1VOVFM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7XHJcbiAgcHJvX21vbnRobHlfSU5SOiA1MDAsXHJcbiAgcHJvX3llYXJseV9JTlI6ICAzNjAwLFxyXG59XHJcblxyXG5jb25zdCBQTEFOX0NVUlJFTkNJRVM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgcHJvX21vbnRobHlfSU5SOiAnSU5SJyxcclxuICBwcm9feWVhcmx5X0lOUjogICdJTlInLFxyXG59XHJcblxyXG4vLyBCaWxsaW5nIHBlcmlvZCBmb3IgUmF6b3JwYXkgU3Vic2NyaXB0aW9uIHBsYW5cclxuY29uc3QgUExBTl9QRVJJT0Q6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgcHJvX21vbnRobHlfSU5SOiAnbW9udGhseScsXHJcbiAgcHJvX3llYXJseV9JTlI6ICAneWVhcmx5JyxcclxufVxyXG5cclxuY29uc3QgUExBTl9OQU1FUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICBwcm9fbW9udGhseV9JTlI6ICdQcm9mZXNzaW9uYWwgTW9udGhseSAoSU5SKScsXHJcbiAgcHJvX3llYXJseV9JTlI6ICAnUHJvZmVzc2lvbmFsIFllYXJseSAoSU5SKScsXHJcbn1cclxuXHJcbi8vIENhY2hlIG9mIFJhem9ycGF5IHBsYW4gSURzIHdlJ3ZlIGNyZWF0ZWQgKHBsYW5faWQgXHUyMTkyIHJhem9ycGF5X3BsYW5faWQpXHJcbmNvbnN0IHJ6cFBsYW5JZENhY2hlOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cclxuXHJcbi8vIEdldCBvciBjcmVhdGUgYSBSYXpvcnBheSBQbGFuIGZvciBzdWJzY3JpcHRpb24gYmlsbGluZ1xyXG5hc3luYyBmdW5jdGlvbiBnZXRPckNyZWF0ZVJhem9ycGF5UGxhbihwbGFuSWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgaWYgKHJ6cFBsYW5JZENhY2hlW3BsYW5JZF0pIHJldHVybiByenBQbGFuSWRDYWNoZVtwbGFuSWRdXHJcblxyXG4gIGNvbnN0IGFtb3VudCA9IFBMQU5fQU1PVU5UU1twbGFuSWRdXHJcbiAgY29uc3QgY3VycmVuY3kgPSBQTEFOX0NVUlJFTkNJRVNbcGxhbklkXVxyXG4gIGNvbnN0IHBlcmlvZCA9IFBMQU5fUEVSSU9EW3BsYW5JZF1cclxuXHJcbiAgLy8gQ2hlY2sgaWYgd2UgYWxyZWFkeSBoYXZlIGEgcGxhbiBzdG9yZWQgaW4gZW52XHJcbiAgY29uc3QgZW52S2V5ID0gYFJBWk9SUEFZX1BMQU5fSURfJHtwbGFuSWQudG9VcHBlckNhc2UoKX1gXHJcbiAgY29uc3QgZW52UGxhbklkID0gcHJvY2Vzcy5lbnZbZW52S2V5XVxyXG4gIGlmIChlbnZQbGFuSWQpIHtcclxuICAgIHJ6cFBsYW5JZENhY2hlW3BsYW5JZF0gPSBlbnZQbGFuSWRcclxuICAgIHJldHVybiBlbnZQbGFuSWRcclxuICB9XHJcblxyXG4gIC8vIENyZWF0ZSBhIG5ldyBSYXpvcnBheSBwbGFuXHJcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLnJhem9ycGF5LmNvbS92MS9wbGFucycsIHtcclxuICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICBBdXRob3JpemF0aW9uOiBgQmFzaWMgJHtCdWZmZXIuZnJvbShgJHtSQVpPUlBBWV9LRVlfSUR9OiR7UkFaT1JQQVlfS0VZX1NFQ1JFVH1gKS50b1N0cmluZygnYmFzZTY0Jyl9YCxcclxuICAgIH0sXHJcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgIHBlcmlvZDogcGVyaW9kID09PSAneWVhcmx5JyA/ICd5ZWFybHknIDogJ21vbnRobHknLFxyXG4gICAgICBpbnRlcnZhbDogMSxcclxuICAgICAgaXRlbToge1xyXG4gICAgICAgIG5hbWU6IFBMQU5fTkFNRVNbcGxhbklkXSxcclxuICAgICAgICBhbW91bnQsXHJcbiAgICAgICAgY3VycmVuY3ksXHJcbiAgICAgICAgZGVzY3JpcHRpb246IFBMQU5fTkFNRVNbcGxhbklkXSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gIH0pXHJcblxyXG4gIGlmICghcmVzLm9rKSB7XHJcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXMuanNvbigpIGFzIHsgZXJyb3I/OiB7IGRlc2NyaXB0aW9uPzogc3RyaW5nIH0gfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKGVycj8uZXJyb3I/LmRlc2NyaXB0aW9uIHx8ICdGYWlsZWQgdG8gY3JlYXRlIFJhem9ycGF5IHBsYW4nKVxyXG4gIH1cclxuXHJcbiAgY29uc3QgcGxhbiA9IGF3YWl0IHJlcy5qc29uKCkgYXMgeyBpZDogc3RyaW5nIH1cclxuICByenBQbGFuSWRDYWNoZVtwbGFuSWRdID0gcGxhbi5pZFxyXG4gIGNvbnNvbGUubG9nKGBbcmF6b3JwYXldIENyZWF0ZWQgcGxhbiAke3BsYW5JZH0gXHUyMTkyICR7cGxhbi5pZH0gKHNldCAke2VudktleX09JHtwbGFuLmlkfSBpbiAuZW52IHRvIGNhY2hlKWApXHJcbiAgcmV0dXJuIHBsYW4uaWRcclxufVxyXG5cclxuLy8gUmVhZCBmdWxsIHJlcXVlc3QgYm9keSBhcyBhIHN0cmluZ1xyXG5mdW5jdGlvbiByZWFkQm9keShyZXE6IEluY29taW5nTWVzc2FnZSk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGxldCBkYXRhID0gJydcclxuICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHsgZGF0YSArPSBjaHVuayB9KVxyXG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGRhdGEpKVxyXG4gICAgcmVxLm9uKCdlcnJvcicsIHJlamVjdClcclxuICB9KVxyXG59XHJcblxyXG4vLyBEZXYtb25seSBwbHVnaW46IG1vdW50cyBsb2NhbCBBUEkgaGVscGVycyBpbnNpZGUgVml0ZSdzIHNlcnZlci5cclxuZnVuY3Rpb24gbG9jYWxBcGlQbHVnaW4oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICdsb2NhbC1hcGktZGV2JyxcclxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IHtcclxuICAgICAgbWlkZGxld2FyZXM6IHsgdXNlOiAoZm46IChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSwgbmV4dDogKCkgPT4gdm9pZCkgPT4gdm9pZCkgPT4gdm9pZCB9XHJcbiAgICB9KSB7XHJcbiAgICAgIGNvbnN0IHVwbG9hZCA9IG11bHRlcih7IHN0b3JhZ2U6IG11bHRlci5tZW1vcnlTdG9yYWdlKCksIGxpbWl0czogeyBmaWxlU2l6ZTogNTAgKiAxMDI0ICogMTAyNCB9IH0pXHJcblxyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJydcclxuXHJcbiAgICAgICAgLy8gXHUyNTAwXHUyNTAwIFIyIHVwbG9hZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvcjIvdXBsb2FkJykgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgdXBsb2FkLnNpbmdsZSgnZmlsZScpKHJlcSBhcyBuZXZlciwgcmVzIGFzIG5ldmVyLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSAocmVxIGFzIG5ldmVyIGFzIHsgZmlsZT86IEV4cHJlc3MuTXVsdGVyLkZpbGUgfSkuZmlsZVxyXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXHJcbiAgICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05vIGZpbGUgcHJvdmlkZWQnIH0pKVxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7IHVwbG9hZFRvUjIsIGdldFByZXNpZ25lZFVybCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZlci9yMicpXHJcbiAgICAgICAgICAgICAgICBjb25zdCBleHQgPSBmaWxlLm9yaWdpbmFsbmFtZS5zcGxpdCgnLicpLnBvcCgpID8/ICd4bHN4J1xyXG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gYGNvbnZlcnNpb25zLyR7cmFuZG9tVVVJRCgpfS4ke2V4dH1gXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgW3IyL3VwbG9hZF0gdXBsb2FkaW5nICR7ZmlsZS5vcmlnaW5hbG5hbWV9IFx1MjE5MiAke2tleX0gKCR7ZmlsZS5zaXplfSBieXRlcylgKVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgdXBsb2FkVG9SMihrZXksIGZpbGUuYnVmZmVyLCBmaWxlLm1pbWV0eXBlIHx8ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGF3YWl0IGdldFByZXNpZ25lZFVybChrZXkpXHJcbiAgICAgICAgICAgICAgICBjb25zdCBleHBpcmVzQXQgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgMjQgKiA2MCAqIDYwICogMTAwMClcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbcjIvdXBsb2FkXSBzdWNjZXNzIFx1MjE5MiBrZXk9JHtrZXl9YClcclxuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBrZXksIHVybDogZmlsZVVybCwgZXhwaXJlc0F0IH0pKVxyXG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3IyL3VwbG9hZF0nLCBlcnIpXHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnVXBsb2FkIGZhaWxlZCcgfSkpXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1MjUwMFx1MjUwMCBSMiBwcmVzaWduIChyZWZyZXNoIGRvd25sb2FkIFVSTCkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbiAgICAgICAgaWYgKHVybC5zdGFydHNXaXRoKCcvYXBpL3IyL3ByZXNpZ24nKSAmJiByZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gbmV3IFVSTCh1cmwsICdodHRwOi8vbG9jYWxob3N0Jykuc2VhcmNoUGFyYW1zLmdldCgna2V5JykgPz8gJydcclxuICAgICAgICAgICAgaWYgKCFrZXkpIHtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01pc3Npbmcga2V5IHBhcmFtJyB9KSlcclxuICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCB7IGdldFByZXNpZ25lZFVybCB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZlci9yMicpXHJcbiAgICAgICAgICAgIGNvbnN0IHByZXNpZ25lZFVybCA9IGF3YWl0IGdldFByZXNpZ25lZFVybChrZXkpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyB1cmw6IHByZXNpZ25lZFVybCB9KSlcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbcjIvcHJlc2lnbl0nLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1ByZXNpZ24gZmFpbGVkJyB9KSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHUyNTAwXHUyNTAwIFIyIGhlYWx0aCBjaGVjayBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICBpZiAodXJsID09PSAnL2FwaS9yMi9oZWFsdGgnICYmIHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IHVwbG9hZFRvUjIsIGRlbGV0ZUZyb21SMiB9ID0gYXdhaXQgaW1wb3J0KCcuL3NlcnZlci9yMicpXHJcbiAgICAgICAgICAgIGNvbnN0IHRlc3RLZXkgPSBgaGVhbHRoLWNoZWNrLyR7cmFuZG9tVVVJRCgpfS50eHRgXHJcbiAgICAgICAgICAgIGF3YWl0IHVwbG9hZFRvUjIodGVzdEtleSwgQnVmZmVyLmZyb20oJ29rJyksICd0ZXh0L3BsYWluJylcclxuICAgICAgICAgICAgYXdhaXQgZGVsZXRlRnJvbVIyKHRlc3RLZXkpXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6ICdvaycsIGJ1Y2tldDogcHJvY2Vzcy5lbnYuUjJfQlVDS0VUX05BTUUgfSkpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3IyL2hlYWx0aF0nLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdGF0dXM6ICdlcnJvcicsIGVycm9yOiBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycikgfSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1MjUwMFx1MjUwMCBDb252ZXJzaW9uIENSVUQgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbiAgICAgICAgaWYgKHVybC5zdGFydHNXaXRoKCcvYXBpL2NvbnZlcnNpb25zJykpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZHJpenpsZSB9ID0gYXdhaXQgaW1wb3J0KCdkcml6emxlLW9ybS9ub2RlLXBvc3RncmVzJylcclxuICAgICAgICAgICAgY29uc3QgeyBQb29sIH0gPSBhd2FpdCBpbXBvcnQoJ3BnJylcclxuICAgICAgICAgICAgY29uc3QgeyBjb252ZXJzaW9ucyB9ID0gYXdhaXQgaW1wb3J0KCcuL3NyYy9kYi9zY2hlbWEnKVxyXG4gICAgICAgICAgICBjb25zdCB7IGVxLCBkZXNjIH0gPSBhd2FpdCBpbXBvcnQoJ2RyaXp6bGUtb3JtJylcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBvb2wgPSBuZXcgUG9vbCh7IGNvbm5lY3Rpb25TdHJpbmc6IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCwgc3NsOiB7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UgfSB9KVxyXG4gICAgICAgICAgICBjb25zdCBkYiA9IGRyaXp6bGUocG9vbClcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcCBEcml6emxlIGNhbWVsQ2FzZSBrZXlzIFx1MjE5MiBzbmFrZV9jYXNlIGZvciB0aGUgY2xpZW50XHJcbiAgICAgICAgICAgIHR5cGUgRGJSb3cgPSB0eXBlb2YgY29udmVyc2lvbnMuJGluZmVyU2VsZWN0XHJcbiAgICAgICAgICAgIGNvbnN0IHRvU25ha2UgPSAocm93OiBEYlJvdykgPT4gKHtcclxuICAgICAgICAgICAgICBpZDogcm93LmlkLFxyXG4gICAgICAgICAgICAgIHVzZXJfaWQ6IHJvdy51c2VySWQsXHJcbiAgICAgICAgICAgICAgZmlsZV9uYW1lOiByb3cuZmlsZU5hbWUsXHJcbiAgICAgICAgICAgICAgc3RhdHVzOiByb3cuc3RhdHVzLFxyXG4gICAgICAgICAgICAgIHIyX2tleTogcm93LnIyS2V5LFxyXG4gICAgICAgICAgICAgIG91dHB1dF91cmw6IHJvdy5vdXRwdXRVcmwsXHJcbiAgICAgICAgICAgICAgZmlsZV9zaXplOiByb3cuZmlsZVNpemUsXHJcbiAgICAgICAgICAgICAgZXhwaXJlc19hdDogcm93LmV4cGlyZXNBdD8udG9JU09TdHJpbmcoKSA/PyBudWxsLFxyXG4gICAgICAgICAgICAgIGNyZWF0ZWRfYXQ6IHJvdy5jcmVhdGVkQXQ/LnRvSVNPU3RyaW5nKCkgPz8gbnVsbCxcclxuICAgICAgICAgICAgICB1cGRhdGVkX2F0OiByb3cudXBkYXRlZEF0Py50b0lTT1N0cmluZygpID8/IG51bGwsXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcblxyXG4gICAgICAgICAgICAvLyBQT1NUIC9hcGkvY29udmVyc2lvbnMgXHUyMDE0IGNyZWF0ZVxyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ1BPU1QnICYmIHVybCA9PT0gJy9hcGkvY29udmVyc2lvbnMnKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgYm9keSA9IEpTT04ucGFyc2UoYXdhaXQgcmVhZEJvZHkocmVxKSlcclxuICAgICAgICAgICAgICBjb25zdCBpZCA9IHJhbmRvbVVVSUQoKVxyXG4gICAgICAgICAgICAgIGNvbnN0IFtyb3ddID0gYXdhaXQgZGIuaW5zZXJ0KGNvbnZlcnNpb25zKS52YWx1ZXMoe1xyXG4gICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICB1c2VySWQ6IGJvZHkudXNlcl9pZCA/PyBudWxsLFxyXG4gICAgICAgICAgICAgICAgZmlsZU5hbWU6IGJvZHkuZmlsZV9uYW1lLFxyXG4gICAgICAgICAgICAgICAgZmlsZVNpemU6IGJvZHkuZmlsZV9zaXplID8/IG51bGwsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGJvZHkuc3RhdHVzID8/ICdwcm9jZXNzaW5nJyxcclxuICAgICAgICAgICAgICB9KS5yZXR1cm5pbmcoKVxyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkodG9TbmFrZShyb3cpKSlcclxuICAgICAgICAgICAgICBhd2FpdCBwb29sLmVuZCgpXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFBBVENIIC9hcGkvY29udmVyc2lvbnMvOmlkIFx1MjAxNCB1cGRhdGVcclxuICAgICAgICAgICAgY29uc3QgcGF0Y2hNYXRjaCA9IHVybC5tYXRjaCgvXlxcL2FwaVxcL2NvbnZlcnNpb25zXFwvKFteLz9dKykkLylcclxuICAgICAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdQQVRDSCcgJiYgcGF0Y2hNYXRjaCkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKGF3YWl0IHJlYWRCb2R5KHJlcSkpXHJcbiAgICAgICAgICAgICAgY29uc3QgW3Jvd10gPSBhd2FpdCBkYi51cGRhdGUoY29udmVyc2lvbnMpLnNldCh7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGJvZHkuc3RhdHVzLFxyXG4gICAgICAgICAgICAgICAgb3V0cHV0VXJsOiBib2R5Lm91dHB1dF91cmwgPz8gbnVsbCxcclxuICAgICAgICAgICAgICAgIHIyS2V5OiBib2R5LnIyX2tleSA/PyBudWxsLFxyXG4gICAgICAgICAgICAgICAgZXhwaXJlc0F0OiBib2R5LmV4cGlyZXNfYXQgPyBuZXcgRGF0ZShib2R5LmV4cGlyZXNfYXQpIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKSxcclxuICAgICAgICAgICAgICB9KS53aGVyZShlcShjb252ZXJzaW9ucy5pZCwgcGF0Y2hNYXRjaFsxXSkpLnJldHVybmluZygpXHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShyb3cgPyB0b1NuYWtlKHJvdykgOiB7fSkpXHJcbiAgICAgICAgICAgICAgYXdhaXQgcG9vbC5lbmQoKVxyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBHRVQgL2FwaS9jb252ZXJzaW9ucy9jb3VudFxyXG4gICAgICAgICAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ0dFVCcgJiYgdXJsLnN0YXJ0c1dpdGgoJy9hcGkvY29udmVyc2lvbnMvY291bnQnKSkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IG5ldyBVUkwodXJsLCAnaHR0cDovL2xvY2FsaG9zdCcpLnNlYXJjaFBhcmFtcy5nZXQoJ3VzZXJfaWQnKSA/PyAnJ1xyXG4gICAgICAgICAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBkYi5zZWxlY3QoeyBpZDogY29udmVyc2lvbnMuaWQgfSkuZnJvbShjb252ZXJzaW9ucylcclxuICAgICAgICAgICAgICAgIC53aGVyZShlcShjb252ZXJzaW9ucy51c2VySWQsIHVzZXJJZCkpXHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGNvdW50OiByb3dzLmxlbmd0aCB9KSlcclxuICAgICAgICAgICAgICBhd2FpdCBwb29sLmVuZCgpXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEdFVCAvYXBpL2NvbnZlcnNpb25zP3VzZXJfaWQ9Li4uXHJcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IG5ldyBVUkwodXJsLCAnaHR0cDovL2xvY2FsaG9zdCcpLnNlYXJjaFBhcmFtcy5nZXQoJ3VzZXJfaWQnKSA/PyAnJ1xyXG4gICAgICAgICAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBkYi5zZWxlY3QoKS5mcm9tKGNvbnZlcnNpb25zKVxyXG4gICAgICAgICAgICAgICAgLndoZXJlKGVxKGNvbnZlcnNpb25zLnVzZXJJZCwgdXNlcklkKSlcclxuICAgICAgICAgICAgICAgIC5vcmRlckJ5KGRlc2MoY29udmVyc2lvbnMuY3JlYXRlZEF0KSlcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHJvd3MubWFwKHRvU25ha2UpKSlcclxuICAgICAgICAgICAgICBhd2FpdCBwb29sLmVuZCgpXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA1XHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSkpXHJcbiAgICAgICAgICAgIGF3YWl0IHBvb2wuZW5kKClcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbY29udmVyc2lvbnNdJywgZXJyKVxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdEQiBlcnJvcicgfSkpXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1MjUwMFx1MjUwMCBQYXltZW50OiBjcmVhdGUgUmF6b3JwYXkgc3Vic2NyaXB0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gICAgICAgIGlmICh1cmwgPT09ICcvYXBpL3BheW1lbnQvY3JlYXRlLW9yZGVyJyAmJiByZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKGF3YWl0IHJlYWRCb2R5KHJlcSkpXHJcbiAgICAgICAgICAgIGNvbnN0IHBsYW5JZDogc3RyaW5nID0gYm9keS5wbGFuX2lkID8/ICcnXHJcbiAgICAgICAgICAgIGNvbnN0IGFtb3VudCA9IFBMQU5fQU1PVU5UU1twbGFuSWRdXHJcbiAgICAgICAgICAgIGlmICghYW1vdW50KSB7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZGV0YWlsOiBgVW5rbm93biBwbGFuX2lkOiAke3BsYW5JZH1gIH0pKVxyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGNyZWRlbnRpYWxFcnJvciA9IHZhbGlkYXRlUmF6b3JwYXlDcmVkZW50aWFscygpXHJcbiAgICAgICAgICAgIGlmIChjcmVkZW50aWFsRXJyb3IpIHtcclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBkZXRhaWw6IGNyZWRlbnRpYWxFcnJvciB9KSlcclxuICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gR2V0IG9yIGNyZWF0ZSBSYXpvcnBheSBQbGFuIChuZWVkZWQgZm9yIHN1YnNjcmlwdGlvbnMpXHJcbiAgICAgICAgICAgIGxldCByenBQbGFuSWQ6IHN0cmluZ1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIHJ6cFBsYW5JZCA9IGF3YWl0IGdldE9yQ3JlYXRlUmF6b3JwYXlQbGFuKHBsYW5JZClcclxuICAgICAgICAgICAgfSBjYXRjaCAocGxhbkVycikge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1twYXltZW50L2NyZWF0ZS1vcmRlcl0gcGxhbiBjcmVhdGlvbiBmYWlsZWQsIGZhbGxpbmcgYmFjayB0byBvbmUtdGltZSBvcmRlcicsIHBsYW5FcnIpXHJcbiAgICAgICAgICAgICAgcnpwUGxhbklkID0gJydcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgeyBkcml6emxlIH0gPSBhd2FpdCBpbXBvcnQoJ2RyaXp6bGUtb3JtL25vZGUtcG9zdGdyZXMnKVxyXG4gICAgICAgICAgICBjb25zdCB7IFBvb2wgfSA9IGF3YWl0IGltcG9ydCgncGcnKVxyXG4gICAgICAgICAgICBjb25zdCB7IHBheW1lbnRzIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL2RiL3NjaGVtYScpXHJcbiAgICAgICAgICAgIGNvbnN0IHBvb2wgPSBuZXcgUG9vbCh7IGNvbm5lY3Rpb25TdHJpbmc6IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCwgc3NsOiB7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UgfSB9KVxyXG4gICAgICAgICAgICBjb25zdCBkYiA9IGRyaXp6bGUocG9vbClcclxuXHJcbiAgICAgICAgICAgIGlmIChyenBQbGFuSWQpIHtcclxuICAgICAgICAgICAgICAvLyBcdTI1MDBcdTI1MDAgUmF6b3JwYXkgU3Vic2NyaXB0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gICAgICAgICAgICAgIGNvbnN0IHJ6cFJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5yYXpvcnBheS5jb20vdjEvc3Vic2NyaXB0aW9ucycsIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmFzaWMgJHtCdWZmZXIuZnJvbShgJHtSQVpPUlBBWV9LRVlfSUR9OiR7UkFaT1JQQVlfS0VZX1NFQ1JFVH1gKS50b1N0cmluZygnYmFzZTY0Jyl9YCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICAgIHBsYW5faWQ6IHJ6cFBsYW5JZCxcclxuICAgICAgICAgICAgICAgICAgdG90YWxfY291bnQ6IDEyLCAgICAgICAgLy8gbWF4IDEyIGN5Y2xlczsgdXNlciBjYW4gY2FuY2VsIGFueXRpbWVcclxuICAgICAgICAgICAgICAgICAgcXVhbnRpdHk6IDEsXHJcbiAgICAgICAgICAgICAgICAgIGN1c3RvbWVyX25vdGlmeTogMSwgICAgIC8vIFJhem9ycGF5IGVtYWlscyB0aGUgY3VzdG9tZXJcclxuICAgICAgICAgICAgICAgICAgbm90aWZ5X2luZm86IHtcclxuICAgICAgICAgICAgICAgICAgICBub3RpZnlfZW1haWw6IGJvZHkudXNlcl9lbWFpbCA/PyAnJyxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAgIGlmICghcnpwUmVzLm9rKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhd2FpdCByenBSZXMuanNvbigpIGFzIHsgZXJyb3I/OiB7IGRlc2NyaXB0aW9uPzogc3RyaW5nIH0gfVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgcG9vbC5lbmQoKVxyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDJcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBkZXRhaWw6IGVycj8uZXJyb3I/LmRlc2NyaXB0aW9uIHx8ICdSYXpvcnBheSBzdWJzY3JpcHRpb24gY3JlYXRpb24gZmFpbGVkJyB9KSlcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY29uc3Qgc3ViID0gYXdhaXQgcnpwUmVzLmpzb24oKSBhcyB7IGlkOiBzdHJpbmc7IHN0YXR1czogc3RyaW5nOyBzaG9ydF91cmw/OiBzdHJpbmcgfVxyXG5cclxuICAgICAgICAgICAgICBhd2FpdCBkYi5pbnNlcnQocGF5bWVudHMpLnZhbHVlcyh7XHJcbiAgICAgICAgICAgICAgICBpZDogc3ViLmlkLFxyXG4gICAgICAgICAgICAgICAgdXNlcklkOiBib2R5LnVzZXJfaWQgPz8gbnVsbCxcclxuICAgICAgICAgICAgICAgIHVzZXJFbWFpbDogYm9keS51c2VyX2VtYWlsID8/ICcnLFxyXG4gICAgICAgICAgICAgICAgcGxhbklkLFxyXG4gICAgICAgICAgICAgICAgYW1vdW50LFxyXG4gICAgICAgICAgICAgICAgZGlzcGxheUFtb3VudDogUExBTl9ESVNQTEFZX0FNT1VOVFNbcGxhbklkXSxcclxuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBQTEFOX0NVUlJFTkNJRVNbcGxhbklkXSA/PyAnSU5SJyxcclxuICAgICAgICAgICAgICAgIHN0YXR1czogJ2NyZWF0ZWQnLFxyXG4gICAgICAgICAgICAgICAgcGF5bWVudFR5cGU6ICdzdWJzY3JpcHRpb24nLFxyXG4gICAgICAgICAgICAgICAgcmF6b3JwYXlTdWJzY3JpcHRpb25JZDogc3ViLmlkLFxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgYXdhaXQgcG9vbC5lbmQoKVxyXG5cclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3Vic2NyaXB0aW9uJyxcclxuICAgICAgICAgICAgICAgIG9yZGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbl9pZDogc3ViLmlkLFxyXG4gICAgICAgICAgICAgICAgICBrZXlfaWQ6IFJBWk9SUEFZX0tFWV9JRCxcclxuICAgICAgICAgICAgICAgICAgYW1vdW50LFxyXG4gICAgICAgICAgICAgICAgICBjdXJyZW5jeTogUExBTl9DVVJSRU5DSUVTW3BsYW5JZF0gPz8gJ0lOUicsXHJcbiAgICAgICAgICAgICAgICAgIHBsYW5fbmFtZTogUExBTl9OQU1FU1twbGFuSWRdID8/IHBsYW5JZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gXHUyNTAwXHUyNTAwIEZhbGxiYWNrOiBvbmUtdGltZSBvcmRlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICAgICAgICBjb25zdCByenBSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucmF6b3JwYXkuY29tL3YxL29yZGVycycsIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmFzaWMgJHtCdWZmZXIuZnJvbShgJHtSQVpPUlBBWV9LRVlfSUR9OiR7UkFaT1JQQVlfS0VZX1NFQ1JFVH1gKS50b1N0cmluZygnYmFzZTY0Jyl9YCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFtb3VudCwgY3VycmVuY3k6IFBMQU5fQ1VSUkVOQ0lFU1twbGFuSWRdID8/ICdJTlInLCByZWNlaXB0OiByYW5kb21VVUlEKCkgfSksXHJcbiAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgaWYgKCFyenBSZXMub2spIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGF3YWl0IHJ6cFJlcy5qc29uKCkgYXMgeyBlcnJvcj86IHsgZGVzY3JpcHRpb24/OiBzdHJpbmcgfSB9XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBwb29sLmVuZCgpXHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMlxyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGRldGFpbDogZXJyPy5lcnJvcj8uZGVzY3JpcHRpb24gfHwgJ1Jhem9ycGF5IG9yZGVyIGNyZWF0aW9uIGZhaWxlZCcgfSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgcnpwUmVzLmpzb24oKSBhcyB7IGlkOiBzdHJpbmc7IGFtb3VudDogbnVtYmVyOyBjdXJyZW5jeTogc3RyaW5nIH1cclxuXHJcbiAgICAgICAgICAgICAgYXdhaXQgZGIuaW5zZXJ0KHBheW1lbnRzKS52YWx1ZXMoe1xyXG4gICAgICAgICAgICAgICAgaWQ6IG9yZGVyLmlkLFxyXG4gICAgICAgICAgICAgICAgdXNlcklkOiBib2R5LnVzZXJfaWQgPz8gbnVsbCxcclxuICAgICAgICAgICAgICAgIHVzZXJFbWFpbDogYm9keS51c2VyX2VtYWlsID8/ICcnLFxyXG4gICAgICAgICAgICAgICAgcGxhbklkLFxyXG4gICAgICAgICAgICAgICAgYW1vdW50OiBvcmRlci5hbW91bnQsXHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5QW1vdW50OiBQTEFOX0RJU1BMQVlfQU1PVU5UU1twbGFuSWRdLFxyXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IG9yZGVyLmN1cnJlbmN5LFxyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnY3JlYXRlZCcsXHJcbiAgICAgICAgICAgICAgICBwYXltZW50VHlwZTogJ29uZV90aW1lJyxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgIGF3YWl0IHBvb2wuZW5kKClcclxuXHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ29yZGVyJyxcclxuICAgICAgICAgICAgICAgIG9yZGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgIG9yZGVyX2lkOiBvcmRlci5pZCxcclxuICAgICAgICAgICAgICAgICAga2V5X2lkOiBSQVpPUlBBWV9LRVlfSUQsXHJcbiAgICAgICAgICAgICAgICAgIGFtb3VudDogb3JkZXIuYW1vdW50LFxyXG4gICAgICAgICAgICAgICAgICBjdXJyZW5jeTogb3JkZXIuY3VycmVuY3ksXHJcbiAgICAgICAgICAgICAgICAgIHBsYW5fbmFtZTogUExBTl9OQU1FU1twbGFuSWRdID8/IHBsYW5JZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbcGF5bWVudC9jcmVhdGUtb3JkZXJdJywgZXJyKVxyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMFxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZGV0YWlsOiAnT3JkZXIgY3JlYXRpb24gZmFpbGVkJyB9KSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHUyNTAwXHUyNTAwIFBheW1lbnQ6IHZlcmlmeSBzaWduYXR1cmUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbiAgICAgICAgaWYgKHVybCA9PT0gJy9hcGkvcGF5bWVudC92ZXJpZnknICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IEpTT04ucGFyc2UoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMge1xyXG4gICAgICAgICAgICAgIHJhem9ycGF5X29yZGVyX2lkPzogc3RyaW5nXHJcbiAgICAgICAgICAgICAgcmF6b3JwYXlfc3Vic2NyaXB0aW9uX2lkPzogc3RyaW5nXHJcbiAgICAgICAgICAgICAgcmF6b3JwYXlfcGF5bWVudF9pZDogc3RyaW5nXHJcbiAgICAgICAgICAgICAgcmF6b3JwYXlfc2lnbmF0dXJlOiBzdHJpbmdcclxuICAgICAgICAgICAgICBwbGFuX2lkOiBzdHJpbmdcclxuICAgICAgICAgICAgICB1c2VyX2VtYWlsOiBzdHJpbmdcclxuICAgICAgICAgICAgICB1c2VyX2lkPzogc3RyaW5nXHJcbiAgICAgICAgICAgICAgcGF5bWVudF90eXBlPzogc3RyaW5nXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFZlcmlmeSBITUFDOiBzdWJzY3JpcHRpb24gdXNlcyBzdWJzY3JpcHRpb25faWQsIG9yZGVyIHVzZXMgb3JkZXJfaWRcclxuICAgICAgICAgICAgY29uc3Qgc2lnQmFzZSA9IGJvZHkucmF6b3JwYXlfc3Vic2NyaXB0aW9uX2lkXHJcbiAgICAgICAgICAgICAgPyBgJHtib2R5LnJhem9ycGF5X3BheW1lbnRfaWR9fCR7Ym9keS5yYXpvcnBheV9zdWJzY3JpcHRpb25faWR9YFxyXG4gICAgICAgICAgICAgIDogYCR7Ym9keS5yYXpvcnBheV9vcmRlcl9pZH18JHtib2R5LnJhem9ycGF5X3BheW1lbnRfaWR9YFxyXG5cclxuICAgICAgICAgICAgY29uc3QgZXhwZWN0ZWRTaWcgPSBjcmVhdGVIbWFjKCdzaGEyNTYnLCBSQVpPUlBBWV9LRVlfU0VDUkVUKVxyXG4gICAgICAgICAgICAgIC51cGRhdGUoc2lnQmFzZSlcclxuICAgICAgICAgICAgICAuZGlnZXN0KCdoZXgnKVxyXG5cclxuICAgICAgICAgICAgaWYgKGV4cGVjdGVkU2lnICE9PSBib2R5LnJhem9ycGF5X3NpZ25hdHVyZSkge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGRldGFpbDogJ0ludmFsaWQgcGF5bWVudCBzaWduYXR1cmUnIH0pKVxyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCB7IGRyaXp6bGUgfSA9IGF3YWl0IGltcG9ydCgnZHJpenpsZS1vcm0vbm9kZS1wb3N0Z3JlcycpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgUG9vbCB9ID0gYXdhaXQgaW1wb3J0KCdwZycpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgcGF5bWVudHMsIHByb2ZpbGVzIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL2RiL3NjaGVtYScpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgZXEgfSA9IGF3YWl0IGltcG9ydCgnZHJpenpsZS1vcm0nKVxyXG4gICAgICAgICAgICBjb25zdCBwb29sID0gbmV3IFBvb2woeyBjb25uZWN0aW9uU3RyaW5nOiBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwsIHNzbDogeyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlIH0gfSlcclxuICAgICAgICAgICAgY29uc3QgZGIgPSBkcml6emxlKHBvb2wpXHJcblxyXG4gICAgICAgICAgICBjb25zdCByZWNvcmRJZCA9IGJvZHkucmF6b3JwYXlfc3Vic2NyaXB0aW9uX2lkIHx8IGJvZHkucmF6b3JwYXlfb3JkZXJfaWQgfHwgJydcclxuXHJcbiAgICAgICAgICAgIGF3YWl0IGRiLnVwZGF0ZShwYXltZW50cykuc2V0KHtcclxuICAgICAgICAgICAgICBzdGF0dXM6ICdwYWlkJyxcclxuICAgICAgICAgICAgICByYXpvcnBheVBheW1lbnRJZDogYm9keS5yYXpvcnBheV9wYXltZW50X2lkLFxyXG4gICAgICAgICAgICAgIHJhem9ycGF5U2lnbmF0dXJlOiBib2R5LnJhem9ycGF5X3NpZ25hdHVyZSxcclxuICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgIH0pLndoZXJlKGVxKHBheW1lbnRzLmlkLCByZWNvcmRJZCkpXHJcblxyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgbmV4dCByZW5ld2FsIGRhdGVcclxuICAgICAgICAgICAgY29uc3QgcGxhbklkID0gYm9keS5wbGFuX2lkXHJcbiAgICAgICAgICAgIGNvbnN0IGlzWWVhcmx5ID0gcGxhbklkLmluY2x1ZGVzKCd5ZWFybHknKVxyXG4gICAgICAgICAgICBjb25zdCByZW5ld2FsRGF0ZSA9IG5ldyBEYXRlKClcclxuICAgICAgICAgICAgaWYgKGlzWWVhcmx5KSByZW5ld2FsRGF0ZS5zZXRGdWxsWWVhcihyZW5ld2FsRGF0ZS5nZXRGdWxsWWVhcigpICsgMSlcclxuICAgICAgICAgICAgZWxzZSByZW5ld2FsRGF0ZS5zZXRNb250aChyZW5ld2FsRGF0ZS5nZXRNb250aCgpICsgMSlcclxuXHJcbiAgICAgICAgICAgIC8vIFVwc2VydCBwcm9maWxlIHBsYW4gd2l0aCBzdWJzY3JpcHRpb24gaW5mb1xyXG4gICAgICAgICAgICBjb25zdCBiYXNlUGxhbiA9IHBsYW5JZC5zcGxpdCgnXycpWzBdIC8vIGFsd2F5cyAncHJvJ1xyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGF3YWl0IGRiLnNlbGVjdCgpLmZyb20ocHJvZmlsZXMpLndoZXJlKGVxKHByb2ZpbGVzLmlkLCBib2R5LnVzZXJfZW1haWwpKVxyXG4gICAgICAgICAgICBjb25zdCBwcm9maWxlVXBkYXRlID0ge1xyXG4gICAgICAgICAgICAgIHBsYW46IGJhc2VQbGFuLFxyXG4gICAgICAgICAgICAgIHBsYW5JZCxcclxuICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZDogYm9keS5yYXpvcnBheV9zdWJzY3JpcHRpb25faWQgPz8gbnVsbCxcclxuICAgICAgICAgICAgICBzdWJzY3JpcHRpb25TdGF0dXM6ICdhY3RpdmUnLFxyXG4gICAgICAgICAgICAgIHJlbmV3YWxEYXRlLFxyXG4gICAgICAgICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZXhpc3RpbmcubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgIGF3YWl0IGRiLnVwZGF0ZShwcm9maWxlcykuc2V0KHByb2ZpbGVVcGRhdGUpLndoZXJlKGVxKHByb2ZpbGVzLmlkLCBib2R5LnVzZXJfZW1haWwpKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGF3YWl0IGRiLmluc2VydChwcm9maWxlcykudmFsdWVzKHsgaWQ6IGJvZHkudXNlcl9lbWFpbCwgLi4ucHJvZmlsZVVwZGF0ZSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IHBvb2wuZW5kKClcclxuXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBwbGFuOiBiYXNlUGxhbiwgcmVuZXdhbF9kYXRlOiByZW5ld2FsRGF0ZS50b0lTT1N0cmluZygpIH0pKVxyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1twYXltZW50L3ZlcmlmeV0nLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBkZXRhaWw6ICdQYXltZW50IHZlcmlmaWNhdGlvbiBmYWlsZWQnIH0pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcdTI1MDBcdTI1MDAgUHJvZmlsZTogZ2V0IHBsYW4vc3Vic2NyaXB0aW9uIHN0YXR1cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvcHJvZmlsZScpICYmIHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBlbWFpbCA9IG5ldyBVUkwodXJsLCAnaHR0cDovL2xvY2FsaG9zdCcpLnNlYXJjaFBhcmFtcy5nZXQoJ2VtYWlsJykgPz8gJydcclxuICAgICAgICAgICAgaWYgKCFlbWFpbCkge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDAwXHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnZW1haWwgcmVxdWlyZWQnIH0pKVxyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZHJpenpsZSB9ID0gYXdhaXQgaW1wb3J0KCdkcml6emxlLW9ybS9ub2RlLXBvc3RncmVzJylcclxuICAgICAgICAgICAgY29uc3QgeyBQb29sIH0gPSBhd2FpdCBpbXBvcnQoJ3BnJylcclxuICAgICAgICAgICAgY29uc3QgeyBwcm9maWxlcywgcGF5bWVudHMgfSA9IGF3YWl0IGltcG9ydCgnLi9zcmMvZGIvc2NoZW1hJylcclxuICAgICAgICAgICAgY29uc3QgeyBlcSwgZGVzYyB9ID0gYXdhaXQgaW1wb3J0KCdkcml6emxlLW9ybScpXHJcbiAgICAgICAgICAgIGNvbnN0IHBvb2wgPSBuZXcgUG9vbCh7IGNvbm5lY3Rpb25TdHJpbmc6IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCwgc3NsOiB7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UgfSB9KVxyXG4gICAgICAgICAgICBjb25zdCBkYiA9IGRyaXp6bGUocG9vbClcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFtwcm9maWxlXSA9IGF3YWl0IGRiLnNlbGVjdCgpLmZyb20ocHJvZmlsZXMpLndoZXJlKGVxKHByb2ZpbGVzLmlkLCBlbWFpbCkpXHJcbiAgICAgICAgICAgIGNvbnN0IHBheW1lbnRIaXN0b3J5ID0gYXdhaXQgZGIuc2VsZWN0KCkuZnJvbShwYXltZW50cylcclxuICAgICAgICAgICAgICAud2hlcmUoZXEocGF5bWVudHMudXNlckVtYWlsLCBlbWFpbCkpXHJcbiAgICAgICAgICAgICAgLm9yZGVyQnkoZGVzYyhwYXltZW50cy5jcmVhdGVkQXQpKVxyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHBybyBzdGF0dXMgZnJvbSBwYXltZW50cyB0YWJsZSBkaXJlY3RseVxyXG4gICAgICAgICAgICBjb25zdCBwYWlkUGF5bWVudHMgPSBwYXltZW50SGlzdG9yeS5maWx0ZXIocCA9PiBwLnN0YXR1cyA9PT0gJ3BhaWQnKVxyXG4gICAgICAgICAgICBjb25zdCBoYXNQYWlkUGF5bWVudCA9IHBhaWRQYXltZW50cy5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgIGNvbnN0IGxhdGVzdFBhaWRQYXltZW50ID0gcGFpZFBheW1lbnRzWzBdID8/IG51bGxcclxuXHJcbiAgICAgICAgICAgIC8vIEF1dG8tdXBncmFkZSBwcm9maWxlIGluIERCIGlmIHBhaWQgYnV0IHByb2ZpbGUgbm90IHlldCBtYXJrZWQgcHJvXHJcbiAgICAgICAgICAgIGlmIChoYXNQYWlkUGF5bWVudCAmJiBwcm9maWxlICYmIHByb2ZpbGUucGxhbiAhPT0gJ3BybycpIHtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgZGIudXBkYXRlKHByb2ZpbGVzKS5zZXQoe1xyXG4gICAgICAgICAgICAgICAgICBwbGFuOiAncHJvJyxcclxuICAgICAgICAgICAgICAgICAgcGxhbklkOiBsYXRlc3RQYWlkUGF5bWVudD8ucGxhbklkID8/IHByb2ZpbGUucGxhbklkLFxyXG4gICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZDogbGF0ZXN0UGFpZFBheW1lbnQ/LnJhem9ycGF5U3Vic2NyaXB0aW9uSWQgPz8gcHJvZmlsZS5zdWJzY3JpcHRpb25JZCxcclxuICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uU3RhdHVzOiBwcm9maWxlLnN1YnNjcmlwdGlvblN0YXR1cyA/PyAnYWN0aXZlJyxcclxuICAgICAgICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgfSkud2hlcmUoZXEocHJvZmlsZXMuaWQsIGVtYWlsKSlcclxuICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogbm9uLWZhdGFsICovIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYXdhaXQgcG9vbC5lbmQoKVxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICAgICAgICBwcm9maWxlOiBwcm9maWxlID8/IHsgaWQ6IGVtYWlsLCBwbGFuOiAnZnJlZScsIHBsYW5JZDogbnVsbCwgc3Vic2NyaXB0aW9uSWQ6IG51bGwsIHN1YnNjcmlwdGlvblN0YXR1czogbnVsbCwgcmVuZXdhbERhdGU6IG51bGwgfSxcclxuICAgICAgICAgICAgICBoYXNQYWlkUGF5bWVudCxcclxuICAgICAgICAgICAgICBsYXRlc3RQYWlkUGF5bWVudDogbGF0ZXN0UGFpZFBheW1lbnQgPyB7XHJcbiAgICAgICAgICAgICAgICBwbGFuX2lkOiBsYXRlc3RQYWlkUGF5bWVudC5wbGFuSWQsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IGxhdGVzdFBhaWRQYXltZW50LnN0YXR1cyxcclxuICAgICAgICAgICAgICAgIGRpc3BsYXlfYW1vdW50OiBsYXRlc3RQYWlkUGF5bWVudC5kaXNwbGF5QW1vdW50LFxyXG4gICAgICAgICAgICAgICAgYW1vdW50OiBsYXRlc3RQYWlkUGF5bWVudC5hbW91bnQsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogbGF0ZXN0UGFpZFBheW1lbnQuY3VycmVuY3ksXHJcbiAgICAgICAgICAgICAgfSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgcGF5bWVudHM6IHBheW1lbnRIaXN0b3J5Lm1hcChwID0+ICh7XHJcbiAgICAgICAgICAgICAgICBpZDogcC5pZCxcclxuICAgICAgICAgICAgICAgIHBsYW5faWQ6IHAucGxhbklkLFxyXG4gICAgICAgICAgICAgICAgYW1vdW50OiBwLmFtb3VudCxcclxuICAgICAgICAgICAgICAgIGRpc3BsYXlfYW1vdW50OiBwLmRpc3BsYXlBbW91bnQsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogcC5jdXJyZW5jeSxcclxuICAgICAgICAgICAgICAgIHN0YXR1czogcC5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICBwYXltZW50X3R5cGU6IHAucGF5bWVudFR5cGUsXHJcbiAgICAgICAgICAgICAgICByYXpvcnBheV9wYXltZW50X2lkOiBwLnJhem9ycGF5UGF5bWVudElkLFxyXG4gICAgICAgICAgICAgICAgcmF6b3JwYXlfc3Vic2NyaXB0aW9uX2lkOiBwLnJhem9ycGF5U3Vic2NyaXB0aW9uSWQsXHJcbiAgICAgICAgICAgICAgICBjcmVhdGVkX2F0OiBwLmNyZWF0ZWRBdD8udG9JU09TdHJpbmcoKSA/PyBudWxsLFxyXG4gICAgICAgICAgICAgICAgdXBkYXRlZF9hdDogcC51cGRhdGVkQXQ/LnRvSVNPU3RyaW5nKCkgPz8gbnVsbCxcclxuICAgICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1twcm9maWxlXScsIGVycilcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDBcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnRmFpbGVkIHRvIGZldGNoIHByb2ZpbGUnIH0pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcdTI1MDBcdTI1MDAgUGF5bWVudDogY2FuY2VsIHN1YnNjcmlwdGlvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICBpZiAodXJsID09PSAnL2FwaS9wYXltZW50L2NhbmNlbC1zdWJzY3JpcHRpb24nICYmIHJlcS5tZXRob2QgPT09ICdQT1NUJykge1xyXG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKVxyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgYm9keSA9IEpTT04ucGFyc2UoYXdhaXQgcmVhZEJvZHkocmVxKSkgYXMgeyBzdWJzY3JpcHRpb25faWQ6IHN0cmluZzsgdXNlcl9lbWFpbDogc3RyaW5nIH1cclxuICAgICAgICAgICAgY29uc3QgY3JlZGVudGlhbEVycm9yID0gdmFsaWRhdGVSYXpvcnBheUNyZWRlbnRpYWxzKClcclxuICAgICAgICAgICAgaWYgKGNyZWRlbnRpYWxFcnJvcikge1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGRldGFpbDogY3JlZGVudGlhbEVycm9yIH0pKVxyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCByenBSZXMgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9hcGkucmF6b3JwYXkuY29tL3YxL3N1YnNjcmlwdGlvbnMvJHtib2R5LnN1YnNjcmlwdGlvbl9pZH0vY2FuY2VsYCwge1xyXG4gICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQmFzaWMgJHtCdWZmZXIuZnJvbShgJHtSQVpPUlBBWV9LRVlfSUR9OiR7UkFaT1JQQVlfS0VZX1NFQ1JFVH1gKS50b1N0cmluZygnYmFzZTY0Jyl9YCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgY2FuY2VsX2F0X2N5Y2xlX2VuZDogMSB9KSxcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIGlmICghcnpwUmVzLm9rKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgZXJyID0gYXdhaXQgcnpwUmVzLmpzb24oKSBhcyB7IGVycm9yPzogeyBkZXNjcmlwdGlvbj86IHN0cmluZyB9IH1cclxuICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMlxyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBkZXRhaWw6IGVycj8uZXJyb3I/LmRlc2NyaXB0aW9uIHx8ICdDYW5jZWxsYXRpb24gZmFpbGVkJyB9KSlcclxuICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgeyBkcml6emxlIH0gPSBhd2FpdCBpbXBvcnQoJ2RyaXp6bGUtb3JtL25vZGUtcG9zdGdyZXMnKVxyXG4gICAgICAgICAgICBjb25zdCB7IFBvb2wgfSA9IGF3YWl0IGltcG9ydCgncGcnKVxyXG4gICAgICAgICAgICBjb25zdCB7IHByb2ZpbGVzIH0gPSBhd2FpdCBpbXBvcnQoJy4vc3JjL2RiL3NjaGVtYScpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgZXEgfSA9IGF3YWl0IGltcG9ydCgnZHJpenpsZS1vcm0nKVxyXG4gICAgICAgICAgICBjb25zdCBwb29sID0gbmV3IFBvb2woeyBjb25uZWN0aW9uU3RyaW5nOiBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwsIHNzbDogeyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlIH0gfSlcclxuICAgICAgICAgICAgY29uc3QgZGIgPSBkcml6emxlKHBvb2wpXHJcblxyXG4gICAgICAgICAgICBhd2FpdCBkYi51cGRhdGUocHJvZmlsZXMpLnNldCh7IHN1YnNjcmlwdGlvblN0YXR1czogJ2NhbmNlbGxlZCcsIHVwZGF0ZWRBdDogbmV3IERhdGUoKSB9KVxyXG4gICAgICAgICAgICAgIC53aGVyZShlcShwcm9maWxlcy5pZCwgYm9keS51c2VyX2VtYWlsKSlcclxuICAgICAgICAgICAgYXdhaXQgcG9vbC5lbmQoKVxyXG5cclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUgfSkpXHJcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3BheW1lbnQvY2FuY2VsLXN1YnNjcmlwdGlvbl0nLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBkZXRhaWw6ICdDYW5jZWxsYXRpb24gZmFpbGVkJyB9KSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHUyNTAwXHUyNTAwIEZvcmdvdCBwYXNzd29yZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICBpZiAodXJsID09PSAnL2FwaS9hdXRoL2ZvcmdvdC1wYXNzd29yZCcgJiYgcmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpXHJcbiAgICAgICAgICBjb25zdCBib2R5ID0gSlNPTi5wYXJzZShhd2FpdCByZWFkQm9keShyZXEpKSBhcyB7IGVtYWlsPzogc3RyaW5nIH1cclxuICAgICAgICAgIGlmICghYm9keS5lbWFpbCkge1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwMFxyXG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdlbWFpbCBpcyByZXF1aXJlZCcgfSkpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gUmVzcG9uZCBpbW1lZGlhdGVseSB0byBwcmV2ZW50IGVudW1lcmF0aW9uXHJcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMFxyXG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlIH0pKVxyXG5cclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZHJpenpsZSB9ID0gYXdhaXQgaW1wb3J0KCdkcml6emxlLW9ybS9ub2RlLXBvc3RncmVzJylcclxuICAgICAgICAgICAgY29uc3QgeyBQb29sIH0gPSBhd2FpdCBpbXBvcnQoJ3BnJylcclxuICAgICAgICAgICAgY29uc3QgeyBlcSB9ID0gYXdhaXQgaW1wb3J0KCdkcml6emxlLW9ybScpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgdXNlcjogdXNlclRhYmxlLCB2ZXJpZmljYXRpb24gfSA9IGF3YWl0IGltcG9ydCgnLi9hdXRoLXNjaGVtYScpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgc2VuZEVtYWlsIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2VydmVyL3Jlc2VuZCcpXHJcbiAgICAgICAgICAgIGNvbnN0IHsgcmVzZXRQYXNzd29yZEVtYWlsIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2VydmVyL2VtYWlsVGVtcGxhdGVzJylcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBvb2wgPSBuZXcgUG9vbCh7IGNvbm5lY3Rpb25TdHJpbmc6IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTCwgc3NsOiB7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UgfSB9KVxyXG4gICAgICAgICAgICBjb25zdCBkYiA9IGRyaXp6bGUocG9vbClcclxuICAgICAgICAgICAgY29uc3QgZW1haWwgPSBib2R5LmVtYWlsLnRvTG93ZXJDYXNlKCkudHJpbSgpXHJcblxyXG4gICAgICAgICAgICBjb25zdCBbZm91bmRVc2VyXSA9IGF3YWl0IGRiXHJcbiAgICAgICAgICAgICAgLnNlbGVjdCh7IGlkOiB1c2VyVGFibGUuaWQsIG5hbWU6IHVzZXJUYWJsZS5uYW1lIH0pXHJcbiAgICAgICAgICAgICAgLmZyb20odXNlclRhYmxlKVxyXG4gICAgICAgICAgICAgIC53aGVyZShlcSh1c2VyVGFibGUuZW1haWwsIGVtYWlsKSlcclxuICAgICAgICAgICAgICAubGltaXQoMSlcclxuXHJcbiAgICAgICAgICAgIGlmIChmb3VuZFVzZXIpIHtcclxuICAgICAgICAgICAgICBjb25zdCB0b2tlbiA9IHJhbmRvbUJ5dGVzKDMyKS50b1N0cmluZygnaGV4JylcclxuICAgICAgICAgICAgICBjb25zdCBleHBpcmVzQXQgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgNjAgKiA2MCAqIDEwMDApXHJcblxyXG4gICAgICAgICAgICAgIGF3YWl0IGRiLmRlbGV0ZSh2ZXJpZmljYXRpb24pLndoZXJlKGVxKHZlcmlmaWNhdGlvbi5pZGVudGlmaWVyLCBgcmVzZXQtcGFzc3dvcmQ6JHtlbWFpbH1gKSlcclxuICAgICAgICAgICAgICBhd2FpdCBkYi5pbnNlcnQodmVyaWZpY2F0aW9uKS52YWx1ZXMoe1xyXG4gICAgICAgICAgICAgICAgaWQ6IHJhbmRvbVVVSUQoKSxcclxuICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IGByZXNldC1wYXNzd29yZDoke2VtYWlsfWAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogdG9rZW4sXHJcbiAgICAgICAgICAgICAgICBleHBpcmVzQXQsXHJcbiAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgYXBwVXJsID0gcHJvY2Vzcy5lbnYuVklURV9BUFBfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnXHJcbiAgICAgICAgICAgICAgY29uc3QgcmVzZXRVcmwgPSBgJHthcHBVcmx9L3Jlc2V0LXBhc3N3b3JkP3Rva2VuPSR7dG9rZW59YFxyXG4gICAgICAgICAgICAgIGF3YWl0IHNlbmRFbWFpbCh7XHJcbiAgICAgICAgICAgICAgICB0bzogZW1haWwsXHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0OiAnUmVzZXQgeW91ciBFeGNlbGZyb21QREYgcGFzc3dvcmQnLFxyXG4gICAgICAgICAgICAgICAgaHRtbDogcmVzZXRQYXNzd29yZEVtYWlsKGZvdW5kVXNlci5uYW1lLCByZXNldFVybCwgYXBwVXJsKSxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IHBvb2wuZW5kKClcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbZm9yZ290LXBhc3N3b3JkXScsIGVycilcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHUyNTAwXHUyNTAwIFIyIHByZXNpZ24gKHJlZnJlc2ggVVJMIGZvciBleGlzdGluZyBrZXkpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxyXG4gICAgICAgIGlmICh1cmwuc3RhcnRzV2l0aCgnL2FwaS9yMi9wcmVzaWduJykgJiYgcmVxLm1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IG5ldyBVUkwodXJsLCAnaHR0cDovL2xvY2FsaG9zdCcpLnNlYXJjaFBhcmFtcy5nZXQoJ2tleScpXHJcbiAgICAgICAgICAgIGlmICgha2V5KSB7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDBcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdrZXkgaXMgcmVxdWlyZWQnIH0pKVxyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHsgZ2V0UHJlc2lnbmVkVXJsIH0gPSBhd2FpdCBpbXBvcnQoJy4vc2VydmVyL3IyJylcclxuICAgICAgICAgICAgY29uc3QgZmlsZVVybCA9IGF3YWl0IGdldFByZXNpZ25lZFVybChrZXkpXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcclxuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHVybDogZmlsZVVybCB9KSlcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbcjIvcHJlc2lnbl0nLCBlcnIpXHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXHJcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ZhaWxlZCB0byBnZW5lcmF0ZSBVUkwnIH0pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBuZXh0KClcclxuICAgICAgfSlcclxuICAgIH0sXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBsb2NhbEFwaVBsdWdpbigpXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBwcm94eToge1xyXG4gICAgICAvLyAvYXBpL3IyIGlzIGhhbmRsZWQgYnkgbG9jYWxBcGlQbHVnaW4gYWJvdmUgKHNhbWUgcG9ydCkuXHJcbiAgICAgIC8vIEV2ZXJ5dGhpbmcgZWxzZSB1bmRlciAvYXBpIGdvZXMgdG8gdGhlIFB5dGhvbiBiYWNrZW5kLlxyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTUzLjc1LjI1MC4yMjc6ODAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIGJ5cGFzcyhyZXEpIHtcclxuICAgICAgICAgIGNvbnN0IHVybCA9IHJlcS51cmwgfHwgJydcclxuICAgICAgICAgIC8vIExldCB0aGUgbG9jYWwgcGx1Z2luIGhhbmRsZSB0aGVzZSBcdTIwMTQgZG9uJ3QgcHJveHkgdGhlbSB0byBQeXRob24gYmFja2VuZFxyXG4gICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICB1cmwuc3RhcnRzV2l0aCgnL2FwaS9yMicpIHx8XHJcbiAgICAgICAgICAgIHVybC5zdGFydHNXaXRoKCcvYXBpL2NvbnZlcnNpb25zJykgfHxcclxuICAgICAgICAgICAgdXJsLnN0YXJ0c1dpdGgoJy9hcGkvcGF5bWVudCcpIHx8XHJcbiAgICAgICAgICAgIHVybC5zdGFydHNXaXRoKCcvYXBpL3Byb2ZpbGUnKSB8fFxyXG4gICAgICAgICAgICB1cmwuc3RhcnRzV2l0aCgnL2FwaS9hdXRoJylcclxuICAgICAgICAgICkgcmV0dXJuIHVybFxyXG4gICAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQTZTO0FBQUEsRUFDM1M7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUNLO0FBQ1AsU0FBUyxvQkFBb0I7QUFvQjdCLGVBQXNCLFdBQ3BCLEtBQ0EsTUFDQSxhQUNpQjtBQUNqQixRQUFNLEdBQUcsS0FBSyxJQUFJLGlCQUFpQjtBQUFBLElBQ2pDLFFBQVE7QUFBQSxJQUNSLEtBQUs7QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQTtBQUFBLElBRWIsVUFBVSxFQUFFLGNBQWMsUUFBUTtBQUFBLEVBQ3BDLENBQUMsQ0FBQztBQUNGLFNBQU87QUFDVDtBQUdBLGVBQXNCLGdCQUFnQixLQUE4QjtBQUNsRSxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0Es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QUssVUFBVSxFQUFFLE9BQU8sa0JBQWtCLENBQUMsQ0FBQztBQUNwRDtBQUFBLFlBQ0Y7QUFDQSxrQkFBTSxFQUFFLGlCQUFBUCxpQkFBZ0IsSUFBSSxNQUFNO0FBQ2xDLGtCQUFNLFVBQVUsTUFBTUEsaUJBQWdCLEdBQUc7QUFDekMsZ0JBQUksVUFBVSxnQkFBZ0Isa0JBQWtCO0FBQ2hELGdCQUFJLElBQUksS0FBSyxVQUFVLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQztBQUFBLFVBQzFDLFNBQVMsS0FBSztBQUNaLG9CQUFRLE1BQU0sZ0JBQWdCLEdBQUc7QUFDakMsZ0JBQUksYUFBYTtBQUNqQixnQkFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLE9BQU8seUJBQXlCLENBQUMsQ0FBQztBQUFBLFVBQzdEO0FBQ0E7QUFBQSxRQUNGO0FBRUEsYUFBSztBQUFBLE1BQ1AsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLGVBQWUsQ0FBQztBQUFBLEVBQ25DLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQTtBQUFBO0FBQUEsTUFHTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxPQUFPLEtBQUs7QUFDVixnQkFBTSxNQUFNLElBQUksT0FBTztBQUV2QixjQUNFLElBQUksV0FBVyxTQUFTLEtBQ3hCLElBQUksV0FBVyxrQkFBa0IsS0FDakMsSUFBSSxXQUFXLGNBQWMsS0FDN0IsSUFBSSxXQUFXLGNBQWMsS0FDN0IsSUFBSSxXQUFXLFdBQVcsRUFDMUIsUUFBTztBQUNULGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInJlbGF0aW9ucyIsICJwZ1RhYmxlIiwgInRleHQiLCAidGltZXN0YW1wIiwgInVwbG9hZFRvUjIiLCAiZ2V0UHJlc2lnbmVkVXJsIiwgImRlbGV0ZUZyb21SMiIsICJjb252ZXJzaW9ucyIsICJwYXltZW50cyIsICJwcm9maWxlcyIsICJ2ZXJpZmljYXRpb24iLCAic2VuZEVtYWlsIiwgInJlc2V0UGFzc3dvcmRFbWFpbCJdCn0K
