const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/api/payment-webhook", async (req, res) => {
    try {
        console.log("[INFO] Webhook received from Abaka:", req.body);

        const { status, result } = req.body;

        if (!result || !result.ext_order_id || !result.status) {
            return res.status(400).json({ error: "Invalid webhook payload" });
        }

        const orderId = result.ext_order_id; // Shopify Order ID
        const paymentStatus = result.status; // Expected: "Approved"

        if (paymentStatus === "Approved") {
            console.log(`[INFO] Marking Order ${orderId} as Paid`);

            // Shopify API to create a transaction (mark order as paid)
            const shopifyResponse = await axios.post(
                `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2023-01/orders/${orderId}/transactions.json`,
                {
                    transaction: {
                        kind: "sale",
                        status: "success",
                        amount: result.amount
                    }
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN
                    }
                }
            );

            console.log("[INFO] Shopify order updated:", shopifyResponse.data);
            return res.json({ success: true });
        } else {
            console.log(`[WARN] Order ${orderId} payment not approved.`);
            return res.json({ success: false, message: "Payment not approved" });
        }
    } catch (error) {
        console.error("[ERROR] Webhook processing failed:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = app;
