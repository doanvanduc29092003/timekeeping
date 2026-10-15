
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

// Các website được phép gọi API
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:5500,http://127.0.0.1:5500"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Cho phép công cụ gọi API không có Origin,
      // ví dụ curl hoặc kiểm tra health từ server.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin không được phép: " + origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json({ limit: "10kb" }));

// Khởi tạo Gemini khi có API key
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY.trim()
    })
  : null;

// Kiểm tra server
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Timekeeping AI backend is running"
  });
});

// Kiểm tra tình trạng backend và cấu hình
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(ai),
    service: "Timekeeping AI"
  });
});

// Chat với Gemini
app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "Server chưa cấu hình GEMINI_API_KEY."
      });
    }

    const message = req.body?.message;

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
          "Bạn là trợ lý AI của website chấm công. " +
          "Trả lời bằng tiếng Việt, thân thiện và dễ hiểu. " +
          "Hỗ trợ kiến thức chung, máy tính, lập trình " +
          "và hướng dẫn sử dụng website. " +
          "Chỉ đưa ra dữ liệu chấm công khi dữ liệu đó " +
          "được người dùng cung cấp; không tự bịa giờ công."
      }
    });

    const reply = result.text;

    if (!reply) {
      return res.status(502).json({
        error: "Gemini không trả về nội dung. Vui lòng thử lại."
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error(
      "Gemini API error:",
      error.status || "",
      error.message || error
    );

    return res.status(500).json({
      error:
        "Không gọi được Gemini. Hãy kiểm tra API key, " +
        "quyền truy cập model và hạn mức API."
    });
  }
});

// Báo lỗi JSON không hợp lệ
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Dữ liệu JSON không hợp lệ."
    });
  }

  if (err.message?.startsWith("Origin không được phép:")) {
    return res.status(403).json({
      error: "Website này chưa được cho phép gọi API."
    });
  }

  console.error("Server error:", err.message || err);

  return res.status(500).json({
    error: "Lỗi máy chủ."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Timekeeping AI server đang chạy tại cổng ${PORT}`);
  console.log(`Gemini API key configured: ${Boolean(ai)}`);
});
