require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
// Render sẽ tự cấp cổng PORT (thường là 10000), host 0.0.0.0
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
    console.error("Thieu GEMINI_API_KEY trong Environment Variables");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Lấy danh sách origin được phép gọi API
const allowedOrigins = (
    process.env.FRONTEND_ORIGIN || 
    "http://localhost:5500,http://127.0.0.1:5500,https://doanvanduc29092003.github.io"
)
    .split(",")
    .map(origin => origin.trim());

// Cấu hình CORS chi tiết hơn để tránh trình duyệt chặn GitHub Pages
app.use(cors({
    origin: function (origin, callback) {
        // Cho phép các yêu cầu không có origin (như Postman hoặc curl) hoặc thuộc danh sách allowedOrigins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS Policy: Origin khong duoc phep truy cap."));
        }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10kb" }));

// Route kiểm tra trạng thái sức khỏe của Server
app.get("/api/health", (req, res) => {
    res.json({ ok: true, ai: "Google AI Studio", status: "Live" });
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

// Lắng nghe trên 0.0.0.0 để Render dễ dàng định tuyến (Routing)
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server đang chạy thành công tại cổng ${PORT}`);
});