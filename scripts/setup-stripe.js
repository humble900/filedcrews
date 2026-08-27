import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

let stripeKey = process.env.STRIPE_SECRET_KEY || process.argv[2];

if (!stripeKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/STRIPE_SECRET_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) {
    stripeKey = match[1].trim();
  }
}

if (!stripeKey) {
  console.error("\x1b[31m%s\x1b[0m", "Error: STRIPE_SECRET_KEY is required.");
  console.log("Usage: node scripts/setup-stripe.js <your_stripe_secret_key>");
  process.exit(1);
}

const STRIPE_SECRET_KEY = stripeKey;

function stripeRequest(apiPath, method, postData) {
  return new Promise((resolve, reject) => {
    const dataString = postData ? new URLSearchParams(postData).toString() : "";
    const options = {
      hostname: "api.stripe.com",
      port: 443,
      path: apiPath,
      method: method,
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(dataString),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400 || parsed.error) {
            reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (e) => reject(e));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function main() {
  console.log("\x1b[36m%s\x1b[0m", "🚀 Initializing FiledCrews Stripe Products, Pricing & Webhook Configuration...");

  try {
    // 1. Create Growth Plan Product
    console.log("\n📦 Setting up 'FiledCrews Growth Plan' product...");
    const growthProduct = await stripeRequest("/v1/products", "POST", {
      name: "FiledCrews Growth Plan",
      description: "Scale your field operations with up to 10 total staff seats (3 Admin + 7 Crew), live GPS & AI routing.",
      "metadata[project]": "filedcrews",
      "metadata[plan_id]": "growth",
    });
    console.log("\x1b[32m%s\x1b[0m", `✔ Growth Product Created: ${growthProduct.id}`);

    // 2. Create Growth Monthly Price ($495/mo)
    console.log("💳 Setting up Growth Plan monthly price ($495.00/mo)...");
    const growthPrice = await stripeRequest("/v1/prices", "POST", {
      product: growthProduct.id,
      unit_amount: "49500", // $495.00
      currency: "usd",
      "recurring[interval]": "month",
      "metadata[project]": "filedcrews",
      "metadata[plan_id]": "growth",
    });
    console.log("\x1b[32m%s\x1b[0m", `✔ Growth Price Created: ${growthPrice.id} ($495/mo)`);

    // 3. Create Founding Partner Council Product
    console.log("\n📦 Setting up 'FiledCrews Founding Partner Council' product...");
    const vipProduct = await stripeRequest("/v1/products", "POST", {
      name: "FiledCrews Founding Partner Council",
      description: "Permanent locked-in VIP partner charter with 20 included licenses, direct priority access, and white-glove setup.",
      "metadata[project]": "filedcrews",
      "metadata[plan_id]": "founding_partner",
    });
    console.log("\x1b[32m%s\x1b[0m", `✔ Founding Partner Product Created: ${vipProduct.id}`);

    // 4. Create Founding Partner Yearly Price ($2,899/yr)
    console.log("💳 Setting up Founding Partner annual price ($2,899.00/yr)...");
    const vipPrice = await stripeRequest("/v1/prices", "POST", {
      product: vipProduct.id,
      unit_amount: "289900", // $2,899.00
      currency: "usd",
      "recurring[interval]": "year",
      "metadata[project]": "filedcrews",
      "metadata[plan_id]": "founding_partner",
    });
    console.log("\x1b[32m%s\x1b[0m", `✔ Founding Partner Price Created: ${vipPrice.id} ($2,899/yr)`);

    // 5. Register Webhook Endpoint in Stripe
    const webhookUrl = "https://jxvifnggjjmyjefudjuf.supabase.co/functions/v1/stripe_webhook";
    console.log(`\n🔗 Registering Webhook Endpoint in Stripe: ${webhookUrl}...`);
    
    const webhookData = {
      url: webhookUrl,
      "enabled_events[0]": "checkout.session.completed",
      "enabled_events[1]": "customer.subscription.updated",
      "enabled_events[2]": "customer.subscription.deleted",
      "enabled_events[3]": "invoice.payment_succeeded",
      "enabled_events[4]": "invoice.payment_failed",
      "enabled_events[5]": "payment_intent.succeeded",
      "metadata[project]": "filedcrews",
      description: "FiledCrews FSM Subscriptions & Invoice Payments Webhook",
    };

    let webhookEndpoint;
    try {
      webhookEndpoint = await stripeRequest("/v1/webhook_endpoints", "POST", webhookData);
      console.log("\x1b[32m%s\x1b[0m", `✔ Webhook Endpoint Created: ${webhookEndpoint.id}`);
      if (webhookEndpoint.secret) {
        console.log("\x1b[33m%s\x1b[0m", `🔑 Webhook Signing Secret: ${webhookEndpoint.secret}`);
      }
    } catch (whErr) {
      console.log(`ℹ Webhook note: ${whErr.message}`);
    }

    console.log("\n\x1b[32m%s\x1b[0m", "🎉 All FiledCrews Stripe Products, Prices & Webhooks configured successfully!");
    console.log("--------------------------------------------------");
    console.log(`Growth Plan Product ID:          ${growthProduct.id}`);
    console.log(`Growth Plan Price ID:            ${growthPrice.id} ($495/mo)`);
    console.log(`Founding Partner Product ID:     ${vipProduct.id}`);
    console.log(`Founding Partner Price ID:       ${vipPrice.id} ($2,899/yr)`);
    console.log(`Webhook Endpoint:                ${webhookUrl}`);
    console.log("--------------------------------------------------");
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", `\n❌ Stripe Setup Error: ${err.message}`);
    process.exit(1);
  }
}

main();
