import https from "node:https";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.argv[2];

if (!STRIPE_SECRET_KEY) {
  console.error("\x1b[31m%s\x1b[0m", "Error: STRIPE_SECRET_KEY is required.");
  console.log("Usage: node scripts/setup-stripe.js <your_stripe_secret_key>");
  console.log("Example: node scripts/setup-stripe.js sk_live_51NbWV9FZhZJMbj6L...");
  process.exit(1);
}

function stripeRequest(path, method, postData) {
  return new Promise((resolve, reject) => {
    const dataString = postData ? new URLSearchParams(postData).toString() : "";
    const options = {
      hostname: "api.stripe.com",
      port: 443,
      path: path,
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
  console.log("\x1b[36m%s\x1b[0m", "🚀 Initializing FiledCrews Stripe Products & Pricing Setup...");

  try {
    // 1. Create Growth Plan Product
    console.log("\n📦 Creating 'FiledCrews Growth Plan' product...");
    const growthProduct = await stripeRequest("/v1/products", "POST", {
      name: "FiledCrews Growth Plan",
      description: "Scale your field operations with up to 10 total staff seats (3 Admin + 7 Crew), live GPS & AI routing.",
      "metadata[project]": "filedcrews",
      "metadata[plan_id]": "growth",
    });
    console.log("\x1b[32m%s\x1b[0m", `✔ Growth Product Created: ${growthProduct.id}`);

    // 2. Create Growth Monthly Price ($495/mo)
    console.log("💳 Creating Growth Plan monthly price ($495.00/mo)...");
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
    console.log("\n📦 Creating 'FiledCrews Founding Partner Council' product...");
    const vipProduct = await stripeRequest("/v1/products", "POST", {
      name: "FiledCrews Founding Partner Council",
      description: "Permanent locked-in VIP partner charter with 20 included licenses, direct priority access, and white-glove setup.",
      "metadata[project]": "filedcrews",
      "metadata[plan_id]": "founding_partner",
    });
    console.log("\x1b[32m%s\x1b[0m", `✔ Founding Partner Product Created: ${vipProduct.id}`);

    // 4. Create Founding Partner Yearly Price ($2,899/yr)
    console.log("💳 Creating Founding Partner annual price ($2,899.00/yr)...");
    const vipPrice = await stripeRequest("/v1/prices", "POST", {
      product: vipProduct.id,
      unit_amount: "289900", // $2,899.00
      currency: "usd",
      "recurring[interval]": "year",
      "metadata[project]": "filedcrews",
      "metadata[plan_id]": "founding_partner",
    });
    console.log("\x1b[32m%s\x1b[0m", `✔ Founding Partner Price Created: ${vipPrice.id} ($2,899/yr)`);

    console.log("\n\x1b[32m%s\x1b[0m", "🎉 All FiledCrews Stripe Products & Prices have been created successfully on your Stripe Account!");
    console.log("--------------------------------------------------");
    console.log(`Growth Plan Product ID:          ${growthProduct.id}`);
    console.log(`Growth Plan Price ID:            ${growthPrice.id} ($495/mo)`);
    console.log(`Founding Partner Product ID:     ${vipProduct.id}`);
    console.log(`Founding Partner Price ID:       ${vipPrice.id} ($2,899/yr)`);
    console.log("--------------------------------------------------");
    console.log("Project metadata isolation (`project: 'filedcrews'`) is active on all objects.");
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", `\n❌ Stripe Setup Error: ${err.message}`);
    process.exit(1);
  }
}

main();
