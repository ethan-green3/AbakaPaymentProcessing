const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 5, // 5 requests per 10 seconds per IP
    message: "Too many requests, please try again later."
});
app.use(limiter);

// ✅ Test API Route
app.get("/api/pay", (req, res) => {
    res.json({ message: "Pay API is running with full functionality!" });
});

// ✅ Payment Processing (Generates Payment Link)
app.get("/api/process-payment", async (req, res) => {
    try {
        const merchantId = process.env.MERCHANT_ID;
        const privateKey = process.env.PRIVATE_KEY;
        const { order_id, amount, name, email } = req.query;


        if (!order_id || !amount || !name || !email) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const [firstName, lastName = ""] = name.split(" ");
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        // Prepare data payload
        const payload = {
            merchant_id: merchantId,
            key: privateKey,
            action: "pay",
            amount,
            currency: "USD",
            first_name: firstName,
            last_name: lastName,
            email,
            phone: "123456789", // Required
            address: "Customer Address",
            address1: "Suite 100",
            city: "City",
            state: "State",
            zip: "12345",
            country: "US",
            ext_order_id: order_id,
            // 🔥 Add Fake Credit Card Details
            number: "4242424242424242", // Visa test card
            type: "2", // 1 = Amex, 2 = Visa, 3 = Mastercard, 4 = Discover
            month: "12", // Expiry month
            year: "2026", // Expiry year
            cvv: "123", // CVV code
            ip: "123.231.123.209",
            birthday: "1978-03-15"

        };
        
        
        

        const data = Buffer.from(JSON.stringify(payload)).toString("base64");
        const crypto = require("crypto");

        const signString = privateKey + data + privateKey;
        const signature = crypto.createHash("sha1").update(signString, "utf8").digest("base64");

        console.log("[DEBUG] Generated Signature:", signature);
        console.log("[DEBUG] Merchant ID:", merchantId);
        console.log("[DEBUG] Raw Data (Base64):", data);
        console.log("[DEBUG] Signing String:", signString);
        console.log("[DEBUG] Generated Signature:", signature);


        // **Instead of returning a direct link, return an HTML form**
        const abakaUrl = `https://secure.abaka.cc/rest/v2`;

        const formHtml = `
            <html>
            <body onload="document.forms['paymentForm'].submit()">
                <form id="paymentForm" action="${abakaUrl}" method="POST">
                    <input type="hidden" name="data" value="${data}" />
                    <input type="hidden" name="signature" value="${signature}" />
                    <noscript>
                        <button type="submit">Click here to proceed to payment</button>
                    </noscript>
                </form>
            </body>
            </html>
        `;

        res.send(formHtml);
    } catch (error) {
        console.error("[ERROR] Payment processing failed:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

});


// ✅ Webhook for Shopify Payment Updates
app.post("/api/payment-webhook", async (req, res) => {
    try {
        console.log("[INFO] Webhook received from Abaka:", JSON.stringify(req.body, null, 2));

        const { status, result } = req.body;
        if (!result || !result.ext_order_id || !result.status) {
            console.error("[ERROR] Invalid webhook payload:", JSON.stringify(req.body, null, 2));
            return res.status(400).json({ error: "Invalid webhook payload" });
        }

        const orderId = result.ext_order_id;
        const paymentStatus = result.status;
        const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
        const shopifyStore = process.env.SHOPIFY_STORE;

        if (!shopifyAccessToken || !shopifyStore) {
            console.error("[ERROR] Missing Shopify API credentials.");
            return res.status(500).json({ error: "Shopify API credentials missing" });
        }

        console.log(`[INFO] Checking if Order ${orderId} exists in Shopify...`);

        // Validate if the order exists in Shopify
        const orderResponse = await axios.get(
            `https://${shopifyStore}.myshopify.com/admin/api/2024-04/orders/${orderId}.json`,
            {
                headers: { "X-Shopify-Access-Token": shopifyAccessToken }
            }
        );

        if (!orderResponse.data.order) {
            console.error(`[ERROR] Order ${orderId} not found in Shopify.`);
            return res.status(404).json({ error: "Order not found in Shopify" });
        }

        if (paymentStatus === "Approved") {
            console.log(`[INFO] Marking Order ${orderId} as Paid`);

            const shopifyResponse = await axios.post(
                `https://${shopifyStore}.myshopify.com/admin/api/2024-04/orders/${orderId}/transactions.json`,
                {
                    transaction: {
                        kind: "capture",
                        status: "success",
                        amount: result.amount
                    }
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": shopifyAccessToken
                    }
                }
            );

            console.log("[INFO] Shopify API Response:", shopifyResponse.data);
            return res.json({ success: true });
        } else {
            console.warn(`[WARN] Order ${orderId} payment not approved.`);
            return res.json({ success: false, message: "Payment not approved" });
        }
    } catch (error) {
        console.error("[ERROR] Webhook processing failed:", error.response ? error.response.data : error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

module.exports = app;
