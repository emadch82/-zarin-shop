import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 8005;

// ─── In-memory data store ────────────────────────────────────────────
const DB = { sabt: new Map(), chat_messages: new Map() };

// ─── Seed 13 products ────────────────────────────────────────────────
const PRODUCTS = [
  { _id: "p1", name: "گوشی سامسونگ Galaxy A54", english_name: "Samsung Galaxy A54", price: 18900000, discount_price: 15990000, rating: 4.5, category: "گوشی موبایل", brand: "سامسونگ", description: "گوشی هوشمند با صفحه نمایش ۶.۴ اینچ Super AMOLED و دوربین ۵۰ مگاپیکسل", stock: 12, tags: ["سامسونگ", "galaxy", "a54", "5g", "amoled"], specifications: [{ label: "صفحه نمایش", value: "۶.۴ اینچ Super AMOLED" }, { label: "دوربین", value: "۵۰ مگاپیکسل" }], images: [], created_at: Date.now() },
  { _id: "p2", name: "هدفون بی‌سیم JBL Tune 770NC", english_name: "JBL Tune 770NC", price: 5800000, discount_price: 0, rating: 4.3, category: "هدفون", brand: "JBL", description: "هدفون بی‌سیم با قابلیت حذف نویز فعال و ۳۰ ساعت پخش", stock: 8, tags: ["jbl", "tune", "770nc", "wireless", "noise cancelling"], specifications: [{ label: "نوع", value: "بی‌سیم" }, { label: "باتری", value: "۳۰ ساعت" }], images: [], created_at: Date.now() },
  { _id: "p3", name: "هندزفری بلوتوث شیائومی Buds 4", english_name: "Xiaomi Buds 4", price: 3200000, discount_price: 2700000, rating: 4.2, category: "هدفون", brand: "شیائومی", description: "هندزفری بی‌سیم با کیفیت صدای Hi-Fi و ۳۶ ساعت پخش", stock: 25, tags: ["شیائومی", "buds 4", "wireless", "earphone", "hi-fi"], specifications: [{ label: "نوع", value: "بی‌سیم" }, { label: "باتری", value: "۳۶ ساعت" }], images: [], created_at: Date.now() },
  { _id: "p4", name: "لپتاپ ایسوس ZenBook 14", english_name: "ASUS ZenBook 14", price: 45900000, discount_price: 0, rating: 4.7, category: "لپتاپ", brand: "ایسوس", description: "لپتاپ باریک و سبک با پردازنده Core i7 و ۱۶GB رم", stock: 4, tags: ["asus", "zenbook 14", "i7", "laptop", "ultrabook"], specifications: [{ label: "پردازنده", value: "Core i7" }, { label: "رم", value: "۱۶GB" }], images: [], created_at: Date.now() },
  { _id: "p5", name: "لپتاپ لنوو IdeaPad 5", english_name: "Lenovo IdeaPad 5", price: 28500000, discount_price: 0, rating: 4.1, category: "لپتاپ", brand: "لنوو", description: "لپتاپ با پردازنده Ryzen 5 و ۸GB رم مناسب برای کارهای روزمره", stock: 6, tags: ["lenovo", "ideapad 5", "ryzen 5", "laptop"], specifications: [{ label: "پردازنده", value: "Ryzen 5" }, { label: "رم", value: "۸GB" }], images: [], created_at: Date.now() },
  { _id: "p6", name: "تبلت سامسونگ Tab S9 FE", english_name: "Samsung Tab S9 FE", price: 18900000, discount_price: 0, rating: 4.4, category: "تبلت", brand: "سامسونگ", description: "تبلت ۱۰.۹ اینچی با قلم S Pen و صفحه نمایش TFT", stock: 10, tags: ["سامسونگ", "tab s9 fe", "tablet", "spen"], specifications: [{ label: "صفحه", value: "۱۰.۹ اینچ" }, { label: "قلم", value: "S Pen" }], images: [], created_at: Date.now() },
  { _id: "p7", name: "گوشی اپل iPhone 15", english_name: "Apple iPhone 15", price: 65900000, discount_price: 59900000, rating: 4.8, category: "گوشی موبایل", brand: "اپل", description: "گوشی هوشمند اپل با تراشه A16 Bionic و دوربین ۴۸ مگاپیکسل", stock: 3, tags: ["apple", "iphone 15", "a16", "ios"], specifications: [{ label: "تراشه", value: "A16 Bionic" }, { label: "دوربین", value: "۴۸ مگاپیکسل" }], images: [], created_at: Date.now() },
  { _id: "p8", name: "گوشی شیائومی Redmi Note 13", english_name: "Xiaomi Redmi Note 13", price: 12500000, discount_price: 10990000, rating: 4.3, category: "گوشی موبایل", brand: "شیائومی", description: "گوشی با صفحه نمایش ۶.۶۷ اینچ AMOLED و دوربین ۱۰۸ مگاپیکسل", stock: 18, tags: ["شیائومی", "redmi note 13", "amoled", "108mp"], specifications: [{ label: "صفحه", value: "۶.۶۷ اینچ AMOLED" }, { label: "دوربین", value: "۱۰۸ مگاپیکسل" }], images: [], created_at: Date.now() },
  { _id: "p9", name: "هدفون سونی WH-1000XM5", english_name: "Sony WH-1000XM5", price: 12500000, discount_price: 0, rating: 4.9, category: "هدفون", brand: "سونی", description: "هدفون حرفه‌ای بی‌سیم با حذف نویز پیشرفته و ۳۰ ساعت پخش", stock: 2, tags: ["sony", "wh-1000xm5", "noise cancelling", "wireless"], specifications: [{ label: "نوع", value: "بی‌سیم" }, { label: "حذف نویز", value: "فعال" }], images: [], created_at: Date.now() },
  { _id: "p10", name: "پاوربانک شیائومی ۲۰۰۰۰ میلی‌آمپر", english_name: "Xiaomi Power Bank 20000mAh", price: 1950000, discount_price: 1590000, rating: 4.0, category: "لوازم جانبی", brand: "شیائومی", description: "پاوربانک ۲۰۰۰۰ میلی‌آمپری با دو پورت USB", stock: 30, tags: ["شیائومی", "power bank", "20000mah", "charger"], specifications: [{ label: "ظرفیت", value: "۲۰۰۰۰ میلی‌آمپر" }, { label: "پورت", value: "۲ عدد USB" }], images: [], created_at: Date.now() },
  { _id: "p11", name: "ساعت هوشمند سامسونگ Galaxy Watch 6", english_name: "Samsung Galaxy Watch 6", price: 16500000, discount_price: 0, rating: 4.5, category: "ساعت هوشمند", brand: "سامسونگ", description: "ساعت هوشمند با صفحه نمایش Super AMOLED و قابلیت اندازه‌گیری سلامتی", stock: 7, tags: ["سامسونگ", "galaxy watch 6", "smartwatch", "wearable"], specifications: [{ label: "صفحه", value: "Super AMOLED" }, { label: "سلامتی", value: "ضربان قلب، اکسیژن خون" }], images: [], created_at: Date.now() },
  { _id: "p12", name: "تبلت اپل iPad 10.9", english_name: "Apple iPad 10.9", price: 29900000, discount_price: 0, rating: 4.6, category: "تبلت", brand: "اپل", description: "تبلت اپل با تراشه A14 Bionic و صفحه نمایش Liquid Retina", stock: 5, tags: ["apple", "ipad", "a14", "tablet", "retina"], specifications: [{ label: "تراشه", value: "A14 Bionic" }, { label: "صفحه", value: "Liquid Retina" }], images: [], created_at: Date.now() },
  { _id: "p13", name: "گوشی سامسونگ Galaxy S24", english_name: "Samsung Galaxy S24", price: 48900000, discount_price: 44900000, rating: 4.7, category: "گوشی موبایل", brand: "سامسونگ", description: "گوشی پرچمدار با تراشه Exynos 2400 و دوربین ۵۰ مگاپیکسل", stock: 0, tags: ["سامسونگ", "galaxy s24", "exynos", "5g", "flagship"], specifications: [{ label: "تراشه", value: "Exynos 2400" }, { label: "دوربین", value: "۵۰ مگاپیکسل" }], images: [], created_at: Date.now() },
];
function seed() {
  if (DB.sabt.size > 0) return;
  for (const p of PRODUCTS) DB.sabt.set(p._id, { ...p });
  console.log(`Seeded ${PRODUCTS.length} products into 'sabt'.`);
}

// ─── WebSocket client stores ─────────────────────────────────────────
const userConns = new Map();
const adminConns = new Set();

// ─── Express setup ───────────────────────────────────────────────────
const app = express();
const server = createServer(app);
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", products: DB.sabt.size, version: "1.0.0" });
});

// Serve dist/
const distDir = join(__dirname, "dist");
app.use("/assets", express.static(join(distDir, "assets")));
app.use(express.static(distDir, { index: "index.html" }));
app.get("/{*path}", (_req, res) => {
  res.sendFile(join(distDir, "index.html"));
});

// ─── WebSocket server ────────────────────────────────────────────────
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const url = req.url || "";

  const userMatch = url.match(/^\/ws\/user\/([^/]+)(?:\/([^/]+))?$/);
  if (userMatch) {
    handleUserWs(ws, userMatch[1], userMatch[2] || userMatch[1]);
    return;
  }
  if (url === "/ws/admin") {
    handleAdminWs(ws);
    return;
  }
  ws.close(4004, "Unknown path");
});

function handleUserWs(ws, userId, userName) {
  userConns.set(userId, ws);

  // Send history
  const history = [];
  for (const m of DB.chat_messages.values()) {
    if (m.user_id === userId) history.push(m);
  }
  ws.send(JSON.stringify({ type: "history", messages: history }));

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const text = (data.text || "").trim();
      if (!text) return;
      const ts = Date.now();
      const doc = {
        user_id: userId,
        user_name: userName || userId,
        text,
        timestamp: ts,
        is_admin: false,
        mid: `u_${userId}_${ts}`,
      };
      DB.chat_messages.set(doc.mid, doc);
      // Confirm to user
      ws.send(JSON.stringify({ type: "new_message", message: doc }));
      // Notify admins
      for (const aws of adminConns) {
        try { aws.send(JSON.stringify({ type: "user_message", message: doc })); }
        catch { adminConns.delete(aws); }
      }
    } catch { /* ignore malformed */ }
  });

  const cleanup = () => userConns.delete(userId);
  ws.on("close", cleanup);
  ws.on("error", cleanup);
}

function handleAdminWs(ws) {
  adminConns.add(ws);

  // Group all messages by user
  const usersMap = new Map();
  for (const m of DB.chat_messages.values()) {
    const uid = m.user_id;
    if (!usersMap.has(uid)) {
      usersMap.set(uid, { user_id: uid, user_name: m.user_name || uid, messages: [], unread: 0 });
    }
    const u = usersMap.get(uid);
    u.messages.push(m);
    if (!m.is_admin) u.unread++;
  }
  ws.send(JSON.stringify({ type: "init", users: [...usersMap.values()] }));

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type !== "admin_reply") return;
      const msg = data.message || {};
      const targetUser = msg.user_id;
      const text = (msg.text || "").trim();
      if (!text || !targetUser) return;
      const ts = Date.now();
      const doc = {
        user_id: targetUser,
        user_name: msg.user_name || "ادمین",
        text,
        timestamp: ts,
        is_admin: true,
        mid: `a_${targetUser}_${ts}`,
      };
      DB.chat_messages.set(doc.mid, doc);
      // Confirm to admin
      ws.send(JSON.stringify({ type: "new_reply", message: doc }));
      // Deliver to user if online
      if (userConns.has(targetUser)) {
        try { userConns.get(targetUser).send(JSON.stringify({ type: "admin_reply", message: doc })); }
        catch { /* user disconnected */ }
      }
    } catch { /* ignore malformed */ }
  });

  const cleanup = () => adminConns.delete(ws);
  ws.on("close", cleanup);
  ws.on("error", cleanup);
}

// ─── Start ───────────────────────────────────────────────────────────
seed();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
