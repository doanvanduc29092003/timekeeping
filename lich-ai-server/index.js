const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: [
        "https://doanvanduc29092003.github.io"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());