// Vercel Serverless Function: POST /api/score
// Nhận ảnh trưng bày + prompt từ app, gọi Claude bằng khóa lưu trên máy chủ (không lộ ra trình duyệt).
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Chỉ hỗ trợ POST" });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Máy chủ chưa cấu hình ANTHROPIC_API_KEY" });

  const code = process.env.APP_ACCESS_CODE;
  if (code && req.headers["x-access-code"] !== code) {
    return res.status(401).json({ error: "Sai hoặc thiếu mật khẩu. Nhập mật khẩu đồng bộ ở tab Cài đặt." });
  }

  const { prompt, image, media_type } = req.body || {};
  if (typeof prompt !== "string" || !prompt || prompt.length > 6000 || typeof image !== "string" || !image) {
    return res.status(400).json({ error: "Thiếu prompt hoặc ảnh" });
  }
  const mt = ["image/jpeg", "image/png", "image/webp"].includes(media_type) ? media_type : "image/jpeg";

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mt, data: image } },
          { type: "text", text: prompt }
        ] }]
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j && j.error && j.error.message) || "Lỗi từ API Anthropic" });
    const text = (j.content || []).map(c => c.text || "").join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return res.status(502).json({ error: "AI không trả về kết quả hợp lệ" });
    return res.status(200).json({ result: JSON.parse(m[0]) });
  } catch (e) {
    return res.status(502).json({ error: "Không gọi được API Anthropic" });
  }
}
