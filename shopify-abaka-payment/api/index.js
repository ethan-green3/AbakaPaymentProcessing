const express = require("express");
const app = express();

app.use(express.json());

app.get("/pay", (req, res) => {
    res.json({ message: "Pay API is working!" });
});

module.exports = app;
