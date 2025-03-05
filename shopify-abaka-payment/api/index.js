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

async function getShopifyOrder(orderId) {
    try {
        console.log("[DEBUG] Raw order_id received:", orderId); // 🔍 Log input

        // Ensure order ID is a number
        const numericOrderId = parseInt(orderId, 10);
        if (isNaN(numericOrderId)) {
            throw new Error("Invalid order ID format. Must be a number.");
        }

        console.log("[DEBUG] Converted order_id:", numericOrderId); // 🔍 Log converted ID

        const response = await axios.get(
            `https://lockoutsupplements.myshopify.com/admin/api/2024-04/orders/${numericOrderId}.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("[DEBUG] Shopify Order Response:", response.data); // 🔥 Debugging
        return response.data.order;
    } catch (error) {
        console.error("[ERROR] Shopify API request failed:", error.response?.data || error.message);
        return null;
    }
}





// ✅ Payment Processing (Generates Payment Link)
app.get("/api/process-payment", async (req, res) => {
    try {
        console.log("[DEBUG] Received Query Params:", req.query); // 🔥 Log incoming query params

        const { order_id, amount } = req.query;

        // Ensure order_id is valid
        if (!order_id || isNaN(parseInt(order_id, 10))) {
            console.error("[ERROR] Invalid or missing order_id:", order_id);
            return res.status(400).json({ error: "Invalid or missing order_id." });
        }

        console.log("[DEBUG] Fetching order from Shopify for order_id:", order_id);
        const order = await getShopifyOrder(order_id);

        if (!order) {
            console.error("[ERROR] Order not found in Shopify for ID:", order_id);
            return res.status(404).json({ error: "Order not found in Shopify." });
        }

        // Extract customer details with debugging logs
        const firstName = order.customer?.first_name || "N/A";
        const lastName = order.customer?.last_name || "N/A";
        const email = order.customer?.email || "N/A";
        const phone = order.customer?.phone || "123456789";
        const address = order.shipping_address?.address1 || order.billing_address?.address1 || "N/A";
        const city = order.shipping_address?.city || order.billing_address?.city || "N/A";
        const state = order.shipping_address?.province || order.billing_address?.province || "N/A";
        const zip = order.shipping_address?.zip || order.billing_address?.zip || "N/A";
        const country = order.shipping_address?.country_code || order.billing_address?.country_code || "US";

        console.log("[DEBUG] Customer Details Extracted:", { firstName, lastName, email, phone, address, city, state, zip, country });

        // Abaka Payload
        const payload = {
            merchant_id: process.env.MERCHANT_ID,
            key: process.env.PRIVATE_KEY,
            action: "pay",
            amount,
            currency: "USD",
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            address,
            city,
            state,
            zip,
            country,
            ext_order_id: order_id,
            number: "4242424242424242",  // Fake test card
            type: "2",                   // Visa
            month: "12",
            year: "2026",
            cvv: "123"
        };

        console.log("[DEBUG] Sending Payment Request to Abaka with Payload:", payload);

        // Send payment request to Abaka
        const abakaResponse = await axios.post("https://secure.abaka.cc/rest/v2", payload);
        
        console.log("[DEBUG] Abaka Response Received:", abakaResponse.data);
        return res.json(abakaResponse.data);

    } catch (error) {
        console.error("[ERROR] Processing payment failed:", error.response?.data || error.message);
        return res.status(500).json({ error: "Internal Server Error" });
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
