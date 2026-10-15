
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
    console.error("Thieu GEMINI_API_KEY trong file .env");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const allowedOrigins = (
    process.env.FRONTEND_ORIGIN || "http://localhost:5500"
)
    .split(",")
    .map(origin => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
    res.json({ ok: true, ai: "Google AI Studio" });
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body || {};

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Vui lòng nhập câu hỏi."
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                error: "Câu hỏi tối đa 2000 ký tự."
            });
        }

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message.trim(),
            config: {
                systemInstruction:
                    "Bạn là trợ lý AI thông minh, thân thiện. " +
                    "Trả lời bằng tiếng Việt, dễ hiểu, rõ ràng. " +
                    "Hỗ trợ kiến thức chung, máy tính, lập trình " +
                    "và hướng dẫn sử dụng website. " +
                    "Không tự bịa lịch làm việc hoặc giờ công khi " +
                    "chưa được cung cấp dữ liệu."
            }
        });

        res.json({
            reply: result.text || "AI chưa có câu trả lời."
        });
    } catch (error) {
        console.error("Gemini API error:", error.message);

        res.status(500).json({
            error:
                "Không gọi được Gemini. Hãy kiểm tra API key, " +
                "model và hạn mức sử dụng."
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `Gemini server dang chay tai http://localhost:${PORT}`
    );
});
