import { useState, useEffect, useMemo, useCallback, useRef, MouseEvent, FormEvent } from "react";
import { 
  ShoppingBag, 
  ShoppingCart, 
  Search, 
  Filter, 
  Tag, 
  Trash2, 
  Plus, 
  Minus, 
  Heart, 
  Info, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  CreditCard, 
  CheckCircle, 
  Truck, 
  MapPin, 
  User, 
  Star, 

  Sparkles,
  ArrowUpDown,
  Home,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
  Phone,
  Package,
  HeartCrack,
  HelpCircle,
  Eye,
  Sun,
  Moon,
  Shield,
  Lock,
  Settings,
  TrendingUp,
  Coins,
  MessageSquare,
  Percent,
  Edit,
  PlusCircle,
  Wallet,
  LogOut,
  Users,
  History,
  Smartphone,
  Send,
  Key,
  RefreshCw,
  UserPlus,
  Award,
  Upload,
  ShieldAlert,
  ShieldCheck,
  Image,
  Mail,
  FolderTree,
  TicketPercent,
  MessageCircle,
  Bell,
  BellDot,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleLogin as GoogleLoginBtn } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
// Backend API base URL
const API_BASE = "";

// ─── Security: XSS Sanitization Utilities ─────────────────────────────────
const SANITIZE_RE = /[&<>"'`/]/g;
const SANITIZE_MAP: Record<string, string> = {
  "&": "&amp;", "<": "&lt;", ">": "&gt;",
  '"': "&quot;", "'": "&#x27;", "`": "&#x60;", "/": "&#x2F;"
};
function sanitize(t: string | undefined | null): string {
  if (!t) return "";
  return String(t).replace(SANITIZE_RE, ch => SANITIZE_MAP[ch] || ch);
}
function safeUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("javascript:") || url.startsWith("data:text/html")) return "";
  return url;
}
function imgFallbackUrl(title: string, w = 400, h = 300, iconType = "package"): string {
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
}

// ─── SEO: Dynamic meta helpers ────────────────────────────────────────────
const SEO_DEFAULTS = {
  title: "فروشگاه دیجیتال زرین‌بوم | مرجع تخصصی گجت‌ها، موبایل و لپ‌تاپ",
  description: "فروشگاه زرین‌بوم؛ بزرگترین مرجع گجت‌ها، ساعت‌های هوشمند، لپ‌تاپ‌های مهندسی و گوشی‌های پرچمدار با اصالت کالا، ارسال رایگان و سریع همراه با گارانتی طلایی معتبر.",
  image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&h=630&q=80"
};
const SEO_TABS: Record<string, { title: string; description: string }> = {
  shop:     { title: "فروشگاه زرین‌بوم | خرید آنلاین گوشی، لپ‌تاپ، گجت", description: "بهترین قیمت‌های روز گوشی موبایل، لپ‌تاپ گیمینگ، ساعت هوشمند و هدفون با گارانتی معتبر و ارسال رایگان." },
  wishlist: { title: "علاقه‌مندی‌های من | فروشگاه زرین‌بوم", description: "محصولات مورد علاقه خود را در لیست علاقه‌مندی‌های فروشگاه زرین‌بوم ذخیره کنید." },
  orders:   { title: "سفارش‌های من | فروشگاه زرین‌بوم", description: "پیگیری وضعیت سفارش‌های ثبت شده در فروشگاه زرین‌بوم." },
  about:    { title: "درباره ما | فروشگاه زرین‌بوم", description: "آشنایی با فروشگاه زرین‌بوم، تیم حرفه‌ای و خدمات پس از فروش." },
  admin:    { title: "پنل مدیریت | فروشگاه زرین‌بوم", description: "داشبورد مدیریت فروشگاه زرین‌بوم." },
  profile:  { title: "پروفایل کاربری | فروشگاه زرین‌بوم", description: "مدیریت حساب کاربری، موجودی کیف پول و اطلاعات شخصی در فروشگاه زرین‌بوم." }
};

function updateMeta(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(name.startsWith("og:") ? "property" : "name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

// Interfaces and Mock Data
interface ZarinUser {
  id: string; // Email or admin
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: "admin" | "customer";
  walletBalance: number;
  avatarUrl?: string;
  createdAt: string;
  status?: "active" | "suspended";
}

interface WalletTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number; // positive for credit, negative for debit
  type: "deposit" | "purchase" | "admin_adjustment" | "refund";
  description: string;
  date: string;
}

interface OtpRecord {
  id: string;
  phone: string;
  code: string;
  expiresAt: number;
  isUsed: boolean;
  createdAt: string;
}

interface Review {
  id: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  avatarUrl?: string;
  adminReply?: string;
}

interface Product {
  id: string;
  title: string;
  englishTitle: string;
  price: number;
  discountPrice?: number;
  rating: number;
  category: string;
  brand: string;
  imageColor: string;
  imagePattern: string;
  iconType: string;
  imageUrl?: string;
  images?: string[];
  description: string;
  specs: { label: string; value: string }[];
  stock: number;
  tags: string[];
  reviews: Review[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Coupon {
  code: string;
  discountPercent: number;
  minSpend: number;
}

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  shippingInfo: {
    fullName: string;
    phone: string;
    city: string;
    postalCode: string;
    address: string;
  };
  paymentMethod: string;
  status: "pending" | "preparing" | "shipped" | "delivered";
  trackingNumber: string;
  discountApplied: number;
}

interface FlyingCartAnimation {
  id: string;
  imageUrl?: string;
  iconType?: string;
  imageColor?: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface CartNotification {
  id: string;
  productTitle: string;
  imageUrl?: string;
  iconType?: string;
  imageColor?: string;
  quantity: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isAdmin: boolean;
  read: boolean;
  targetUserId?: string;
}

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  type: "message" | "product" | "order" | "info";
  targetUserId?: string;
}

const CATEGORIES = [
  { id: "all", name: "همه دسته‌بندی‌ها" },
  { id: "phones", name: "گوشی موبایل و تبلت" },
  { id: "laptops", name: "لپ‌تاپ و کامپیوتر" },
  { id: "audio", name: "تجهیزات صوتی و هدفون" },
  { id: "accessories", name: "لوازم جانبی دیجیتال" },
  { id: "wearables", name: "ساعت هوشمند و گجت" }
];

const CATEGORY_SPEC_LABELS: Record<string, string[]> = {
  phones: ["پردازنده دستگاه", "حافظه رم سیستم", "ظرفیت ذخیره‌سازی", "ابعاد صفحه نمایش"],
  laptops: ["کارت گرافیک مجزا", "پردازنده اصلی محاسباتی", "حافظه رم موثر", "کیفیت و رزولوشن صفحه"],
  audio: ["کدک ارتباط صوتی", "سیستم کنترل نویز فعال", "طول شارژدهی باتری", "پاسخ فرکانس مانیتورینگ"],
  accessories: ["درگاه‌های ارتباطی", "سیستم ایمنی دستگاه", "تکنولوژی و بازده جریان", "قابلیت شخصی‌سازی"],
  wearables: ["متریال ساخت بدنه", "مقاومت ساختار در آب", "پردازشگر سخت‌افزاری", "تکنولوژی صفحه نمایش"]
};

const COMPACT_ITEMS: [string, string, string, number, number, string, string, string[], string[]][] = [
  // --- PHONES (15 Products) ---
  [
    "p1", "گوشی سامسونگ Galaxy S24 Ultra", "Samsung Galaxy S24 Ultra 5G", 68500000, 64900000, "phones",
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 3 for Galaxy", "۱۲ گیگابایت LPDDR5X", "۲۵۶ گیگابایت فوق سریع UFS 4.0", "6.8\" Dynamic AMOLED 2X 120Hz"],
    ["پرچمدار تیتانیومی", "هوش هوایی AI", "زوم ۱۰۰ برابری"]
  ],
  [
    "p2", "گوشی آیفون 15 Pro Max", "Apple iPhone 15 Pro Max", 84000000, 79900000, "phones",
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    ["Apple A17 Pro (3 نانومتری)", "۸ گیگابایت مجتمع", "۲۵۶ گیگابایت نسل جدید", "6.7\" Super Retina XDR ProMotion"],
    ["فریم تیتانیومی", "دکمه اکشن اختصاصی", "دوربین پریسکوپ ۵ برابر"]
  ],
  [
    "p3", "گوشی گوگل Pixel 8 Pro", "Google Pixel 8 Pro 5G", 48000000, 45500000, "phones",
    "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=800&q=80",
    ["Google Tensor G3 هوش زنده", "۱۲ گیگابایت LPDDR5X", "۱۲۸ گیگابایت پرسرعت", "6.7\" LTPO OLED Super Actua"],
    ["دوربین تراز اول گوگل", "هوش مصنوعی Magic Eraser", "۷ سال پشتیبانی آپدیت"]
  ],
  [
    "p4", "گوشی شیائومی 14 Ultra", "Xiaomi 14 Ultra flagship", 58000000, 54900000, "phones",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 3 عالی", "۱۶ گیگابایت حافظه موثر", "۵۱۲ گیگابایت UFS 4.0", "6.73\" LTPO AMOLED C8 WQHD+"],
    ["لنز فوق حرفه‌ای Leica", "سنسور بزرگ ۱ اینچی", "شارژ سریع ۹۰ واتی داخل جعبه"]
  ],
  [
    "p5", "گوشی وان پلاس 12 5G", "OnePlus 12 Dual-SIM 5G", 42000000, 39500000, "phones",
    "https://images.unsplash.com/photo-1565630916779-e303be97b6f5?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 3 خنک", "۱۶ گیگابایت LPDDR5X", "۲۵۶ گیگابایت نسل ۴", "6.82\" 2K Oriental AMOLED 120Hz"],
    ["شارژر ۱۰۰ وات سوپرشارژ", "باتری غول‌آسا ۵۴۰۰", "سیستم دوربین کالیبره Hasselblad"]
  ],
  [
    "p6", "تبلت اپل آیپد پرو M4", "Apple iPad Pro M4 Ultra Thin", 82000000, 78000000, "phones",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
    ["تراشه فوق العاده قدرتمند Apple M4", "۸ گیگابایت یکپارچه پهنای بالا", "۲۵۶ گیگابایت پرسرعت", "11\" Tandem Ultra Retina XDR OLED"],
    ["باریک‌ترین گجت اپل", "صفحه بی‌بدیل تندم اولد", "پشتیبانی از مداد پرو جدید"]
  ],
  [
    "p7", "تبلت سامسونگ Galaxy Tab S9 Ultra", "Samsung Galaxy Tab S9 Ultra 256GB", 64000000, 59900000, "phones",
    "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 2 for Galaxy", "۱۲ گیگابایت رم پویا", "۲۵۶ گیگابایت نسل ۴", "14.6\" Dynamic AMOLED 2X 120Hz"],
    ["غول طراحی دیجیتال", "ضدآب کامل IP68", "سایز فوق بزرگ ۱۴.۶ اینچ"]
  ],
  [
    "p8", "گوشی ناتینگ فون Nothing Phone 2", "Nothing Phone (2) Premium Glass", 32000000, 29900000, "phones",
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8+ Gen 1 بهینه", "۱۲ گیگابایت رم عریض", "۲۵۶ گیگابایت کارآمد", "6.7\" Flexible OLED LTPO"],
    ["طراحی شیشه‌ای شفاف", "رابط نوری منحصر به فرد Glyph", "رابط کاربری فوق‌روان Nothing OS"]
  ],
  [
    "p9", "گوشی تاشدنی سامسونگ Galaxy Z Fold 6", "Samsung Galaxy Z Fold 6 5G", 115000000, 109000000, "phones",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 3 تاشو", "۱۲ گیگابایت رم پیشرفته", "۵۱۲ گیگابایت UFS 4.0", "7.6\" Foldable QXGA+ Dynamic AMOLED 2X"],
    ["تکنولوژی برتر تاشو", "هوش هوایی ارتقایافته Fold AI", "نمایشگر دو عمیق بی‌پایان"]
  ],
  [
    "p10", "گوشی سامسونگ Galaxy Z Flip 6", "Samsung Galaxy Z Flip 6 5G", 56000000, 52500000, "phones",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 3 فشرده", "۱۲ گیگابایت رم عالی", "۲۵۶ گیگابایت فوق سریع", "6.7\" Dynamic 2X + Dynamic Flex Window"],
    ["بسیار جیبی و شیک", "نمایشگر بیرونی کارآمد", "بدنه آلومینیومی تقویت شده"]
  ],
  [
    "p11", "گوشی گیمینگ ایسوس ROG Phone 8 Pro", "ASUS ROG Phone 8 Pro Edition", 65000000, 61000000, "phones",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 3 با خنک‌کننده", "۱۶ گیگابایت حافظه سنگین", "۵۱۲ گیگابایت نسل ۴", "6.78\" Samsung Flexible LTPO AMOLED 165Hz"],
    ["پادشاه گیمینگ جهان", "تریگرهای لمسی AirTrigger", "سیستم خنک‌کننده فعال داخلی"]
  ],
  [
    "p12", "گوشی سونی Xperia 1 VI", "Sony Xperia 1 VI Premium Cinema", 59000000, 56000000, "phones",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 3 کالیبره", "۱۲ گیگابایت کوالکام", "۲۵۶ گیگابایت ظرفیت", "6.5\" 19.5:9 Bravia Tuning OLED 120Hz"],
    ["تنظیم تصویر سینمایی", "زوم اپتیکال واقعی پیوسته", "صدای جک ۳.۵ میلی‌متری های‌فای"]
  ],
  [
    "p13", "گوشی میان‌رده سامسونگ Galaxy A55", "Samsung Galaxy A55 5G mid", 21000000, 19800000, "phones",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    ["Exynos 1480 با گرافیک AMD", "۸ گیگابایت سرعت بالا", "۲۵۶ گیگابایت حافظه", "6.6\" Super AMOLED 120Hz"],
    ["پرفروش‌ترین میان‌رده", "فریم فلزی با روکش گوریلا گلس", "باتری عالی ۵۰۰۰ میلی آمپر"]
  ],
  [
    "p14", "گوشی شیائومی Poco F6 Pro", "Xiaomi Poco F6 Pro high-spec", 24500000, 22900000, "phones",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    ["Snapdragon 8 Gen 2 پرقدرت", "۱۲ گیگابایت رم عالی", "۵۱۲ گیگابایت کارآمد", "6.67\" WQHD+ Flow AMOLED 120Hz"],
    ["ارزش خرید فوق العاده", "شارژر فوق العاده ۱۲۰ واتی", "فریم آلومینیومی مستحکم"]
  ],
  [
    "p15", "تبلت اپل آیپد ایر M2", "Apple iPad Air M2 11-inch", 34000000, 31900000, "phones",
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
    ["تراشه پرسرعت Apple M2", "۸ گیگابایت رم پهنا بالا", "۱۲۸ گیگابایت دیسک سیستم", "11\" Liquid Retina IPS Display"],
    ["طراحی باریک و سبک جدید", "سازگار با مجیک کیبورد", "سنسور اثرانگشت تاچ‌آیدی بالای بدنه"]
  ],

  // --- LAPTOPS (15 Products) ---
  [
    "p16", "لپ‌تاپ گیمینگ ایسوس Zephyrus G16", "ASUS ROG Zephyrus G16 OLED", 132000000, 125000000, "laptops",
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    ["NVIDIA RTX 4070 (8GB GDDR6)", "Intel Core Ultra 9 185H (شانزده هسته)", "۳۲ گیگابایت DDR5 دوکاناله ۷۴۰۰", "16\" 2.5K OLED 240Hz ROG Nebula"],
    ["شاهکار مهندسی", "ROG Nebula", "نمایشگر OLED"]
  ],
  [
    "p17", "لپ‌تاپ پرچمدار مک‌بوک پرو ۱۶ اینچی ام۳", "Apple MacBook Pro 16\" M3 Max", 165000000, 158000000, "laptops",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    ["Apple 40-Core GPU سنگین", "Apple M3 Max (۱۶ هسته پردازشی)", "۴۸ گیگابایت حافظه رم یکپارچه", "16.2\" Liquid Retina XDR 120Hz Liquid Pro"],
    ["رندرساز انقلابی", "حفظ باتری بی‌نظیر ۲۲ ساعته", "رنگ خاکستری فضایی جدید Space Black"]
  ],
  [
    "p18", "مانیتور تخصصی اپل مدل Studio Display 5K", "Apple Studio Display 27\" 5K Retina", 118000000, 112000000, "laptops",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    ["پردازش تصویر با تراشه A13 داخلی", "پشتیبانی کامل از کارت‌های مک و ویندوز", "شش بلندگوی های‌فای استریو یکپارچه", "27\" 5K Retina Display 5120x2880"],
    ["نمایشگر استودیویی ۵K", "کالیبراسیون صنعتی رنگ", "وب‌کم فوق‌عریض با ردیابی سنتر استیج"]
  ],
  [
    "p19", "لپ‌تاپ دل مدل Dell XPS 15 9530", "Dell XPS 15 9530 Creator Edition", 110000000, 104900000, "laptops",
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
    ["NVIDIA RTX 4060 (8GB GDDR6)", "Intel Core i9-13900H (نسل فوق قدرتمند)", "۳۲ گیگابایت DDR5 دو مسیره", "15.6\" 3.5K OLED InfinityEdge لمسی"],
    ["لپ‌تاپ تولید محتوای ارشد", "حاشیه صفحه فوق‌نازک بی‌نهایت", "جنس بدنه فیبرکربن مقاوم ضدخش"]
  ],
  [
    "p20", "لپ‌تاپ لمسی تاشو اچ‌پی Spectre x360", "HP Spectre x360 Premium Touch-Convertible", 78000000, 74500000, "laptops",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    ["Intel Iris Xe Graphics بهینه‌سازی", "Intel Core Ultra 7 155H کواکسل", "۱۶ گیگابایت حافظه LPDDR5X", "14\" 2.8K OLED 120Hz چرخش ۳۶۰ درجه"],
    ["مهندسی شیک بدنه", "قلم لمسی هوشمند همراه جعبه", "لولای منعطف چرخشی تاشونده"]
  ],
  [
    "p21", "لپ‌تاپ مهندسی لنوو مدل Legion Pro 7i", "Lenovo Legion Pro 7i Game-AI Engine", 105000000, 99900000, "laptops",
    "https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?auto=format&fit=crop&w=800&q=80",
    ["NVIDIA RTX 4080 (12GB GDDR6X)", "Intel Core i9-14900HX ارشد سنگین", "۳۲ گیگابایت حافظه رم دوکاناله ۵۶۰۰", "16\" WQXGA IPS 240Hz کالیبره کارخانه‌ای"],
    ["کارت گرافیک قدرتمند RTX 4080", "سیستم خنک‌کننده اتاقک حرارتی", "شاسی آلومینیومی با نورپردازی RGB"]
  ],
  [
    "p22", "لپ‌تاپ باریک اپل مک‌بوک ایر ۱۳ اینچی ام۳", "Apple MacBook Air 13\" M3", 58000000, 54900000, "laptops",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    ["Apple 10-Core GPU پربازده", "Apple M3 (پردازنده محاسباتی ۸ هسته)", "۱۶ گیگابایت حافظه یکپارچه عالی", "13.6\" Liquid Retina ۵۰۰ نیتی"],
    ["طراحی فوق العاده نازک بی صدا", "بدون فن داخلی با هیت‌سینک", "طول عمر باتری فوق العاده ۱۸ ساعته"]
  ],
  [
    "p23", "دو کارت لپ‌تاپ ایسوس Zenbook DUO صفحه دوگانه", "ASUS Zenbook DUO OLED Dual-Touch", 94000000, 89900000, "laptops",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    ["Intel Arc Graphics رقیب سرسخت", "Intel Core Ultra 9 185H مجتمع", "۳۲ گیگابایت LPDDR5X پرطنین", "2x 14\" 3K 120Hz OLED دو صفحه لمسی"],
    ["انقلاب دو صفحه‌نمایش", "کیبورد مغناطیسی بلوتوثی جداشونده", "پایه تاشو ایستایی ارگونومیکی پشت"]
  ],
  [
    "p24", "غول تجهیزات بازی ریزر مدل Razer Blade 16", "Razer Blade 16 UHD+ Dual Mode", 148000000, 139000000, "laptops",
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80",
    ["NVIDIA RTX 4080 (12GB GDDR6X)", "Intel Core i9-14900HX ۲۴ هسته‌ای", "۳۲ گیگابایت حافظه سرعت بالای رم", "16\" Dual-Mode Mini-LED UHD+ 120Hz / FH+ 240Hz"],
    ["صفحه نمایش منحصربفرد دبل مود", "کیس آلومینیومی یکپارچه انودایز", "تاییدیه گیمر فوق لوکس ریزر"]
  ],
  [
    "p25", "لپ‌تاپ لمسی مایکروسافت Surface Laptop 7", "Microsoft Surface Laptop 7 Snapdragon", 62000000, 58900000, "laptops",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    ["Qualcomm Adreno GPU بهینه", "Snapdragon X Elite (تراشه جدید هوش مصنوعی)", "۱۶ گیگابایت حافظه رم LPDDR5X", "13.8\" PixelSense 120Hz HDR لمسی"],
    ["معماری نوین آرم ویندوزی", "بهترین عمر باطری ویندوز ۲۰ساعته", "کیبورد تمام پارچه آلکانترا درجه‌یک"]
  ],
  [
    "p26", "کامپیوتر همه‌کاره اپل آی‌مک ۲۴ اینچی", "Apple iMac 24\" Retina 4.5K M3", 74000000, 69900000, "laptops",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    ["Apple 10-Core GPU صیقلی", "Apple M3 (پردازنده محاسباتی ۸ هسته)", "۸ گیگابایت حافظه یکپارچه", "24\" 4.5K Retina Display 4480x2520"],
    ["سیستم رومیزی همه‌کاره باریک", "تکنولوژی رنگ‌های بی نظیر درخشان", "همراه با مجیک کیبورد و مجیک ماوس اصل"]
  ],
  [
    "p27", "لپ‌تاپ اداری جان‌سخت لنوو ThinkPad X1 Carbon", "Lenovo ThinkPad X1 Carbon Gen 12", 98000000, 93000000, "laptops",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    ["Intel Graphics با پردازنده هوش مصنوعی", "Intel Core Ultra 7 155U کارآمد پویا", "۳۲ گیگابایت رم LPDDR5X مجتمع", "14\" 2.8K OLED Anti-Glare ضد بازتاب"],
    ["کربن نسل ۱۲ ممتاز نشنال", "سخت‌افزار امنیتی تراشه پیشرفته", "کیبورد کلاسیک ارگونومیک بی‌مانند"]
  ],
  [
    "p28", "لپ‌تاپ گیمینگ ایسر Predator Helios 16", "Acer Predator Helios 16 High-End", 82000000, 77500000, "laptops",
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
    ["NVIDIA RTX 4075 (8GB VRAM)", "Intel Core i7-14700HX قدرتمند", "۱۶ گیگابایت رم با فرآیند ۵۶۰۰ هرتز", "16\" WQXGA IPS 240Hz ۵۰۰ نیتی ایده آل"],
    ["قدرت خروجی گرافیک بالا", "کیبورد اختصاصی آراف‌اف گیم پلی", "سیستم خروج حرارت پروانه‌ای پیشتاز"]
  ],
  [
    "p29", "ابرلپ‌تاپ مخصوص بازی ام‌اس‌آی Raider GE78", "MSI Raider GE78 HX Smart Engine", 138000000, 129500000, "laptops",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    ["NVIDIA RTX 4080 (12GB GDDR6X)", "Intel Core i9-14900HX ارشد چندوظیفه‌ای", "۶۴ گیگابایت حافظه غول‌آمران رم دبل", "17\" QHD+ IPS 240Hz عالی عریض فوق‌عادی"],
    ["شاسی فوق لوکس گیمینگ رده بالا", "نورپردازی کیبورد استیل‌سریز عالی", "اسپیکرهای چهارگانه داینامیکی پرطنین"]
  ],
  [
    "p30", "سرور رومیزی اپل مک استودیو اِم۲", "Apple Mac Studio M2 Ultra Extreme", 188000000, 179000000, "laptops",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    ["Apple 76-Core GPU بی‌همتای رندرینگ", "Apple M2 Ultra (۲۴ هسته پردازشی فوق غول)", "۶۴ گیگابایت حافظه یکپارچه پهن بازده", "قابلیت خروجی همزمان به ۸ نمایشگر رده ۸K"],
    ["قوی‌ترین سیستم استودیویی جهان", "درگاه‌های چندگانه تاندربولت پرسرعت", "خنک‌کننده آلیاژ مس بی‌صدا"]
  ],

  // --- AUDIO (15 Products) ---
  [
    "p31", "هدفون بی‌سیم حذف نویز سونی WH-1000XM5", "Sony WH-1000XM5 Premium Headset", 18900000, 17200000, "audio",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    ["LDAC, AAC, SBC بلوتوث ۵.۲", "دو پردازنده مستقل هوشمند با ۸ میکروفون پیشرفته", "تا ۴۰ ساعت پخش مستمر بی‌سیم صوتی", "4Hz - 40,000Hz (طنین استودیویی بم تا زیر)"],
    ["پوشش فیلتر نویز", "Hi-Res Premium", "۴۰ ساعت باتری ممتاز"]
  ],
  [
    "p32", "هندزفری بی‌سیم صوتی اپل ایرپاد پرو ۲", "Apple AirPods Pro 2 Lightning USB-C", 11800000, 10900000, "audio",
    "https://images.unsplash.com/photo-1588449668338-d151688c2471?auto=format&fit=crop&w=800&q=80",
    ["تراشه پردازشی اختصاصی Apple H2", "سیستم تطبیقی پیشرفته هوش نویز فعال", "تا ۶ ساعت مداوم هر شارژ (۳۰ ساعت با کیس)", "درایور سفارش بیس شفاف با اعوجاج صفر درصد"],
    ["پادشاه هدفون‌های بی‌سیم توگوشی", "پشتیبانی کامل از ردیابی سر زنده", "آلارم اسپیکر کیس یابنده شارژر"]
  ],
  [
    "p33", "هدفون لوکس حذف نویز بوز QuietComfort", "Bose QuietComfort Ultra Over-Ear", 21500000, 19800000, "audio",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    ["سیستم انحصاری درایورهای بم کالیبره", "حذف نویز فعال ممتاز گرید پیشتاز بوز", "۲۴ ساعت کارکرد مستمر باتری سریع", "صدای فیزیکی محیطی سه‌بعدی بی‌نقص Immersive Aud"],
    ["برترین راحتی قرارگیری روی سر", "تکنولوژی شخصی‌سازی صدا CustomTune", "هدبند و بالشتک‌های چرمی ارگانیک عالی"]
  ],
  [
    "p34", "هدفون استودیویی سنهایزر مدل Momentum 4", "Sennheiser Momentum 4 audiophile", 16800000, 15200000, "audio",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    ["درایور صوتی ۴۲ میلی‌متری مانیتورینگ", "سیستم کنترل نویز تطبیقی فعال هایبرید", "بی‌رقیب در باتری با ۶۰ ساعت نگهداری شارژ", "6Hz - 22,000Hz (کیفیت صدای خالص موسیقی)"],
    ["امضای صدای ویژه سنهایزر", "کنترل لمسی بسیار دقیق بدنه", "قابلیت خاموش‌کردن هوشمند سنسور سر"]
  ],
  [
    "p35", "هدفون لوکس آلومینیومی اپل ایرپاد مکس", "Apple AirPods Max Smart Wireless", 29500000, 27900000, "audio",
    "https://images.unsplash.com/photo-1588449668338-d151688c2471?auto=format&fit=crop&w=800&q=80",
    ["دو تراشه قدرتمند Apple H1 در هر گوشی", "سیستم آکوستیک باز بی عیب و نقص با فیلتر نویز", "۲۰ ساعت شارژدهی سینک کامل سه‌بعدی", "تولید همگن عمیق امواج صوتی سراسری"],
    ["کلوپ لوکس طراحی اپل واچ", "بدنه آلومینیومی آنودایز شده هواپیما", "محفظه توری با بافت خنک‌کننده سر"]
  ],
  [
    "p36", "میکروفون مرجع تولید محتوا شور Shure SM7B", "Shure SM7B Vocal Studio Microphone", 22000000, 20500000, "audio",
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
    ["الگوی قطبی کاردیوئید یک سویه تفکیک پادکست", "سیستم ایزوله‌سازی داخلی شوک پنوماتیک ضربه", "بدون نیاز به پاپ‌فیلتر بیرونی با فوم ضدباد", "50Hz - 20,000Hz (صدای طبیعی رویایی گرم گوینده)"],
    ["استاندارد یوتیوب و پادکست جهان", "بدنه تمام فلزی بسیار سنگین مقاوم", "سیستم خنثی‌ساز نویزهای الترومغناطیس"]
  ],
  [
    "p37", "اسپیکر چمدانی پرقدرت جی‌بی‌ال Boombox 3", "JBL Boombox 3 WiFi Portal Multi-Room", 28500000, 25900000, "audio",
    "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
    ["پخش وای‌فای ۲۴ بیت و بلوتوث نسل ۵.۳", "سیستم صوتی سه طرفه با ساب‌ووفر اختصاصی قدرتمند", "۲۴ ساعت بازی مکرر با قابلیت پاوربانک شدن خروجی", "JBL Original Pro Sound با حجم بیس تکان‌دهنده"],
    ["ضدآب کامل در استخر IP67", "پشتیبانی دالبی اتموس Dolby Atmos", "دستگیره فلزی تمام آلیاژی بالانس"]
  ],
  [
    "p38", "اسپیکر خانگی مرجع صوتی مارشال مدل Woburn III", "Marshall Woburn III Home Bluetooth Speaker", 34000000, 31500000, "audio",
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    ["رابط ورودی بلوتوث ۵.۲ و پورت ارشد HDMI", "سیستم صوتی استریو سه جهته با امپلی‌فایرهای کواکس", "پخش مستقیم برق شهری با توان اعجاب‌آمیز صوتی", "پاسخ فرکانس بی‌رقیب تفکیک سبک‌های راک و جاز"],
    ["طراحی کلاسیک عتیقه انگلیسی", "پیچ‌ها و دکمه‌های کنترلی برنجی لوکس", "بدنه از چرم گیاهی بازیافتی دوستدار محیط"]
  ],
  [
    "p39", "هندزفری نویز کنسلینگ سونی WF-1000XM5", "Sony WF-1000XM5 wireless earbuds", 12200000, 11300000, "audio",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    ["Hi-Res Audio Wireless با تکنولوژی ال‌دک", "پردازنده یکپارچه انحصاری Sony V2 هوش نویز", "تا ۳۶ ساعت باتری پشتیبان به همراه کیس شارژ", "درایورهای باکیفیت جدید Dynamic Driver X"],
    ["بسیار سبک‌ترین طراحی ارگونومیک سونی", "میکروفون استثنایی انتقال صدای زنده", "پدهای عایق مفاصل فومی گوش"]
  ],
  [
    "p40", "هدفون مانیتورینگ آدیو تکنیکا ATH-M50x", "Audio-Technica ATH-M50x Professional Studio", 9800000, 8900000, "audio",
    "https://images.unsplash.com/photo-1484755560695-a4c7300c5c29?auto=format&fit=crop&w=800&q=80",
    ["درایورهای با قطر ۴۵ میلی‌متر مغناطیسی نسل قوی", "طراحی آکوستیک استودیویی پشت بسته عایق صوتی", "صدای خالص مسطح مانیتورینگ بدون دستکاری مصنوعی", "سیم پیچ آلومینیوم با روکش مس تایید صلاحیت شده"],
    ["استاندارد اول استودیوهای ضبط صدا", "قابلیت چرخش ۹۰ درجه گوشی‌های مانیتور", "دوام بی نظیر در برابر فرسودگی مداوم"]
  ],
  [
    "p41", "اسپیکر هوشمند سینمایی سونوس Era 300", "Sonos Era 300 Smart Dolby Atmos Speaker", 24000000, 22500000, "audio",
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    ["وای‌فای، بلوتوث و ورودی کابل مبدل AUX", "شش درایور صوتی شامل توییترهای زاویه‌دار پالس", "کالیبراسیون هوشمند فوق‌دقیق اتاق Trueplay با گوشی", "سیستم پخش فراگیر دالبی اتموس ایده آل سینمایی"],
    ["طراحی بیضی شکل مینی‌مال لوکس", "پشتیبانی دستیار صوتی الکسا یکپارچه", "کنترل لمسی خازنی تاچ پنل بالایی"]
  ],
  [
    "p42", "هدفون مرجع آهنگسازی بیرداینامیک DT 990 Pro", "Beyerdynamic DT 990 Pro Studio Open-Back", 8500000, 7900000, "audio",
    "https://images.unsplash.com/photo-1484755560695-a4c7300c5c29?auto=format&fit=crop&w=800&q=80",
    ["آمپدانس بالا ۲۵۰ اهم کدرینگ ویژه کارت صدا", "طراحی بدنه آکوستیک باز با تفکیک ابعاد فرکانس", "فرکانس پاسخ‌دهی بسیار خطی تفکیک سازها و وکال", "5Hz - 35,000Hz (دقت مرجع میکس و مسترینگ فوق حرفه‌ای)"],
    ["ساخت اصیل باکیفیت آلمان", "پدهای مخملی فوق نرم قابل تعویض", "کابل فنری باکیفیت ترانسپورتر"]
  ],
  [
    "p43", "هندزفری جدید سامسونگ Galaxy Buds 3 Pro", "Samsung Galaxy Buds 3 Pro AI Premium", 10500000, 9600000, "audio",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    ["فناوری پخش ۲۴ بیت فوقِ صوتی سامسونگ", "سیستم مانیتورینگ تطبیقی صوتی زنده با هوش کمکی", "تقویت فرکانس‌های بم با سیستم درایور دوال امپ", "۳۰ ساعت مداوم همراه کیس بهینه مغناطیسی"],
    ["بدنه مینی مال با پرتو نوری زنده", "مقاومت بالا در تعریق ورزشی IP57", "شکل‌دهی پرتو متمرکز میکروفون برای مکالمه"]
  ],
  [
    "p44", "اسپیکر مانیتورینگ لوکس دوپلت مدل دِویالت Phantom ۲", "Devialet Phantom II 95dB Wireless Compact", 89000000, 84000000, "audio",
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    ["اتصال چندگانه بلوتوث و وای‌فای و اپتیکال نوری", "سیستم اختراع شده سه‌برابری خنثی کننده فیزیکی لرزش بیس", "توان کلی صوتی اعجاب‌آور ۳۵۰ وات مداوم دیجیتالی", "18Hz - 21,000Hz (بسیار عمیق‌ترین صدای بم مینیاتوری دنیا)"],
    ["شاهکار طراحی و مهندسی صوتی فرانسه", "سیستم پخش ارگانیک کروی متوازن", "پوشش بدنه صیقلی تمام سفید برفی مات"]
  ],
  [
    "p57", "مانیتور گیمینگ رده‌بالا ایسوس ROG Swift OLED", "ASUS ROG Swift OLED PG32UCDM Gaming Monitor", 68000000, 63500000, "accessories",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    ["پنل باکیفیت نسل سوم QD-OLED فوق‌العاده", "سرعت واکنش تصویر باورنکردنی ۰.۰۳ میلی‌ثانیه GTG", "فرکانس بازخوانی حرکت تصویر زنده ۲۴۰ هرتز", "رزولوشن 4K UHD با وضوح تصویر فوق‌العاده"],
    ["مانیتور گیمینگ رده‌بالا ایسوس", "پنل باکیفیت نسل سوم OLED", "نرخ بروزرسانی بسیار روان ۲۴۰ هرتز"]
  ],
  [
    "p58", "رادیاتور خنک‌کننده مایع پردازنده کورسیر", "Corsair iCUE Link H150i LCD Liquid CPU Cooler", 14500000, 12900000, "accessories",
    "https://images.unsplash.com/photo-1601524909162-be87252be365?auto=format&fit=crop&w=800&q=80",
    ["سه فن ۱۲۰ میلی‌متری بی صدا", "صفحه نمایش IPS LCD دایره‌ای ۲.۱ اینچی شخصی‌سازی", "سازگاری کامل با سوکت‌های جدید اینتل و ای‌ام‌دی", "کنترل هوشمند سرعت چرخش با نرم‌افزار iCUE"],
    ["خنک‌کنندگی فوق‌العاده بالا ممتد", "صفحه نمایش LCD با رزولوشن ایده آل", "نورپردازی RGB خیره‌کننده آدرس‌پذیر"]
  ],
  [
    "p59", "منبع تغذیه کامپیوتر ایسوس ROG Thor 1200W", "ASUS ROG Thor 1200W Platinum II Power Supply", 18500000, 16900000, "accessories",
    "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    ["گواهینامه راندمان مصرف انرژی 80Plus Platinum", "صفحه نمایش OLED نشان‌دهنده مصرف هارد آنلاین", "فن بزرگ هیت‌سینک حرارتی ROG خنک و ساکت", "کابل‌های کاملاً ماژولار با روکش‌های بافته شده باکیفیت"],
    ["تغذیه پایدار قطعات پرچمدار سیستم", "نمایشگر مصرف لحظه‌ای انرژی قطعات", "کارت گارانتی معتبر ۱۰ ساله فنی"]
  ],
  [
    "p60", "وبکم الگاتو Elgato Facecam Pro", "Elgato Facecam Pro 4K UHD Webcam", 15200000, 13800000, "accessories",
    "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=800&q=80",
    ["لنز شیشه‌ای ممتاز ۴K با فوکوس خودکار اختصاصی", "سنسور بزرگ و باکیفیت تصویر Sony Starvis 1/1.8\"", "پایه چند منظوره با قابلیت تنظیم در زوایای دلخواه", "اتصال فوق سریع با کابل مجزای USB-C 3.0"],
    ["کامل‌ترین کیفیت برای استریم و ویدئو کنفرانس", "سنسور با پردازش نور خودکار بدون نویز", "نرم‌افزار کنترل زاویه کادر Camera Hub"]
  ],
  [
    "p61", "ساعت هوشمند اپل واچ اولترا ۲ بدنه تیتانیوم", "Apple Watch Ultra 2 GPS + Cellular", 48500000, 45900000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["تیتانیوم فضایی گرید ۵ با یاقوت محافظ صفحه", "تا ۱۰۰ متر غواص اقیانوسی و مجهز به عمق‌سنج", "S9 SiP دبل اشاره روان ضربه دو بار دست", "Retina OLED درخشندگی باورنکردنی ۳۰۰۰ نیت"],
    ["تیتانیوم نظامی سخت‌ساز", "غواصی تخصصی اتوماتیک", "صفحه روشنایی ۳۰۰۰ نیت آفتاب زنده"]
  ],
  [
    "p62", "ساعت جان‌سخت سامسونگ Galaxy Watch Ultra", "Samsung Galaxy Watch Ultra LTE 47mm", 31500000, 28900000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["بدنه تمام تیتانیوم گرید هوافضا با کریستال شیشه یاقوت", "تا عمق ۱۰۰ متر مقاومت اقیانوسی IP68 به همراه شیر تخلیه", "Exynos W1000 (تراشه جدید ۳ نانومتری پنج هسته‌ای)", "Super AMOLED ۳۰۰۰ نیتی مجهز به حالت شب تمام قرمز صفحه"],
    ["پرچمدار ساعتهای هوشمند سامسونگ", "مسیریابی ردیابی پیشرفته کمپ مسیرهای کوهستانی", "کلید فیزیکی اکشن نارنجی بغل بدنه"]
  ],
  [
    "p63", "ساعت ورزشی حرفه‌ای گارمین مدل Fenix 7X Pro", "Garmin Fenix 7X Pro Sapphire Solar Precision", 42500000, 39900000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["تکنولوژی یاقوت شارژ خورشیدی بدنه مکرر مانیتور", "پایداری خیره‌کننده ۳۷ روزه باتری در حین ردیابی دقیق", "چراغ‌قوه پرنور ال‌ای‌دی زنده بغل قاب ساعت ایمنی", "پایش ضربان اکیومولیشن و سطح اکسیژن عضلات در صعود"],
    ["برترین ساعت ورزشی و ماجراجویی سخت کوهستان", "مسیریاب نقشه توپوگرافی کوهستانی جهان پیش ردیف", "بدنه تیتانیومی مقاوم در ضربه سنگ‌های کوهستان"]
  ],
  [
    "p64", "ساعت هوشمند اپل واچ ۹ بدنه آلومینیومی", "Apple Watch Series 9 GPS 45mm", 19800000, 18200000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["آلومینیوم تصفیه ۱۰۰٪ با روکش مرغوب", "مقاومت در آب تا ۵۰ متر شنای استخر", "Apple S9 SiP فوق العاده روان ضربه‌ دست", "صفحه نمایش رتینا با روشنایی ۲۰۰۰ نیت"],
    ["پرفروش ترین ساعت هوشمند دنیا", "سنسور سنجش پایش غلظت اکسیژن خون", "پردازشگر تشخیص افتادن و تصادفات شدید"]
  ],
  [
    "p65", "ساعت کلاسیک هوشمند سامسونگ Watch 6 Classic", "Samsung Galaxy Watch 6 Classic LTE 47mm", 14500000, 12900000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["بدنه تمام استیل ضدزنگ داربست با شیشه یاقوت", "مقاومت بالا در آب و خاک استاندارد IP68 نشنال", "Exynos W930 دو هسته‌ای سرعت عملکرد روان", "صفحه نمایش سوپر آمولد شفاف دور چرخشی"],
    ["رینگ زیبای مکانیکی در رادار گرد چرخشی", "سنجش فشارخون و تست نوار قلب ECG", "همراه بند چرمی ترکیبی ارگانیک"]
  ],
  [
    "p66", "ساعت کلاسیک شیک هوآوی مدل Watch GT 4", "Huawei Watch GT 4 Premium Stainless Steel", 11800000, 10500000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["بدنه استیل محکم با طراحی زاویه‌دار هشت‌ضلعی", "مقاومت ۵ اتمسفر فشار آب اقیانوسی شنا", "سیستم‌عامل روان انحصاری HarmonyOS", "عمر فوق العاده باتری ۱۴ روزه مداوم"],
    ["کامل‌ترین ساعت شیک مجلسی", "سنسور اصلاح شده ضربان قلب TruSeen 5.5+", "پشتیبانی عالی اعلانات فارسی چت گوشی"]
  ],
  [
    "p67", "مچ‌بند تندرستی پیشرفته فیت‌بیت شیاردار", "Fitbit Charge 6 Health Tracker Tracker", 7800000, 6900000, "wearables",
    "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80",
    ["فیبر کربن قالب سبک بدنه به همراه سنسورهای مچ", "مقاومت کامل تعریق هوازی پیست دویدن شنا", "موقعیت‌یاب جی‌پی‌اس فعال بدنه مستقل", "صفحه نمایش لمسی امولد با تراکم روشنایی عالی"],
    ["تخصصی پایش قلب و استرس", "همکاری کامل با کیف پول گوگل و نقشه گام", "طول عمر باتری ۷ روزه کامل مکرر پایش"]
  ],
  [
    "p68", "حلقه هوشمند تندرستی اورا رینگ نسل سوم", "Oura Ring Gen 3 Heritage Edition Gold", 21500000, 19500000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["تیتانیوم فوق سبک با ابکاری طلای واقعی شیک", "مقاومت بالا در آب تا عمق ۱۰۰ متر شستشو حمام", "سنسورهای نوری مادون قرمز مانیتورینگ انگشت دست", "پایش دقیق مراحل خواب عمیق خواب موثر بدنه"],
    ["ظریف ترین تکنولوژی پایش زیستی", "وزن بی نظیر سبک ۴ گرمی همانند انگشتر", "تحلیل میزان آمادگی روزانه بدن در صبح"]
  ],
  [
    "p69", "ساعت هوشمند گوگل پیکسل واچ Google Pixel Watch 2", "Google Pixel Watch 2 Active GPS", 16800000, 14900000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["بدنه تمام آلومینیوم بازیافت ممتاز با گوریلا گلس ۵", "مقاومت فشار ۵ اتمسفر استخر شنای تفریحی", "پردازنده پرسرعت کوالکام Snapdragon W5+ Gen 1", "سیستم‌عامل روان و پیشرفته Wear OS 4 اورجینال"],
    ["یکپارچگی عالی با سنسورهای تخصصی فیت‌بیت", "سنسورهای پایش سلامت پیشرفته گوگل", "پاسخ سریع با دستیار صوتی هوشمند گوگل"]
  ],
  [
    "p70", "ساعت تناسب‌ اندام گارمین مدل Venu 3 GPS", "Garmin Venu 3 GPS Wellness Active", 22500000, 20400000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["فولد استیل قاب بیرونی با بند نرم ورزشی سیلیکونی", "مقاومت فشار ۵ اتمسفر مایعات تعریق بالا استاندارد", "شارژدهی باتری فوق العاده ۱۴ روز با صفحه هوشمند", "صفحه نمایش لمسی درخشان AMOLED کالیبره عالی"],
    ["مربی صوتی اختصاصی پیشرفته روی ساعت", "سنسور پایش کامل چرت‌های روزانه و خواب", "پشتیبانی تماس مکالمه بلندگو مستقیم مچ"]
  ],
  [
    "p71", "ساعت مینی‌مال لوکس هوشمند امازفیت مدل GTR 4", "Amazfit GTR 4 Vintage Smartwatch Sport", 8400000, 7500000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["آلومینیوم تیره کوره شده فشرده با فریم استیل دور", "مقاومت شنای استخر با قابلیت تشخیص خودکار حرکت ورزشی", "باتری قوی با نگهداری شارژ ۱۴ روزه کامل مکرر", "ردیاب ماهواره‌ای دومسیره قطار ردیابی پیشرفته کمپ"],
    ["یک مینی‌مال با ارزش خرید بسیار بالا", "دارای بیش از ۱۵۰ حالت ورزشی تخصصی", "سنجش شبانه‌روزی ضربان و استرس و اکسیژن"]
  ],
  [
    "p72", "خلوص پایش مچ‌بند تندرستی هوپ Whoop Strap 4.0", "Whoop Strap 4.0 Professional Athletic Band", 12900000, 11500000, "wearables",
    "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80",
    ["بدون هیچگونه صفحه نمایش جهت تمرکز کامل ورزشکار", "مقاومت کامل ضد آب دوش گرفتن و تعریق فوق العاده بالا", "پک باتری کشویی بیسیم شارژر روی مچ دست حین حرکت", "ردیابی ۵ بار در ثانیه معیار زیستی کالیبره خستگی ماهیچه"],
    ["ساعت انتخابی برترین ورزشکاران المپیک", "بند کشباف فیبر نساجی پیشرفته سوپراستار", "تحلیل دقیق استرس فشاری عضلات در برنامه"]
  ],
  [
    "p73", "ساعت هوشمند ورزشی کاسیو G-Shock مدل H2000", "Casio G-Shock G-Squad GBD-H2000 Resistant", 18500000, 16900000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["بدنه جان‌سخت رزین بایومس با محافظ های فیبر کربنی", "تا ۲۰۰ متر مقاومت بی نظیر در برابر فشارهای غواصی سنگین", "شارژ خورشیدی با اتصال کمکی پورت شارژ هوشمند کاسیو", "جی‌پی‌اس مستقل ردیابی مسیر گام به گام کوهستان"],
    ["افسانه‌ای از دپارتمان ضد ضربه کاسیو", "سنسور تحلیل میزان سرعت پرش گام‌ها", "همکاری با سنسورهای مانیتورینگ شرکت پلار"]
  ],
  [
    "p74", "ساعت هوشمند روان وان‌پلاس واچ ۲ بدنه استیل", "OnePlus Watch 2 Dual-Engine architecture", 13800000, 12500000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["استیل صیقلی فشرده با روکش یاقوت مقاوم برآمده", "مقاومت بالای استاندارد نظامی MIL-STD-810H بدنه", "معماری دو تراشه با مغز همکار WearOS پویا فست استور", "باطری باکیفیت و دوام عالی ۱۰۰ ساعته عملکرد هوشمند"],
    ["معماری هوشمندانه با دو پردازنده مستقل", "سیستم مکان‌یابی فوق العاده دقیق با دو فرکانس", "سازگاری بالا با گوشی‌های پر سرعت نوین"]
  ],
  [
    "p75", "ساعت غول تیتانیومی سونتو Suunto Vertical", "Suunto Vertical Titanium Solar Wilderness Navigation", 38000000, 34900000, "wearables",
    "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
    ["تیتانیوم آبکاری شده گرید ارشد به همراه کریستال یاقوت", "تا ۱۰۰ متر مقاومت اقیانوسی غواصی به همراه بارومتر هواشناسی", "شارژر خورشیدی پانل لبه بیرونی شیشه بهینه باتری", "تا ۸۵ ساعت مکرر پیست ردیابی جی پی اس چند کاناله زنده"],
    ["طراحی و ساخت دست‌ساز کشور فنلاند مرغوب", "نقشه‌های آفلاین کامفورت مسیرهای تفریحی جهان", "بوق لرزان هشدار هوا طوفان و افت فشار اتمسفر"]
  ]
];

const PRODUCT_UNIQUE_IMAGES: Record<string, string> = {
  // --- PHONES & TABLETS (p1-p15) ---
  "p1": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
  "p2": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
  "p3": "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=800&q=80",
  "p4": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
  "p5": "https://images.unsplash.com/photo-1565630916779-e303be97b6f5?auto=format&fit=crop&w=800&q=80",
  "p6": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
  "p7": "https://images.unsplash.com/photo-1574757134407-775cf4f4eeff?auto=format&fit=crop&w=800&q=80",
  "p8": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
  "p9": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
  "p10": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
  "p11": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  "p12": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
  "p13": "https://images.unsplash.com/photo-1523206489230-c012cdd4b2b4?auto=format&fit=crop&w=800&q=80",
  "p14": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
  "p15": "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80",

  // --- LAPTOPS (p16-p30) ---
  "p16": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
  "p17": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  "p18": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
  "p19": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
  "p20": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
  "p21": "https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?auto=format&fit=crop&w=800&q=80",
  "p22": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
  "p23": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
  "p24": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
  "p25": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
  "p26": "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
  "p27": "https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=800&q=80",
  "p28": "https://images.unsplash.com/photo-1555532538-dcdbd01d373d?auto=format&fit=crop&w=800&q=80",
  "p29": "https://images.unsplash.com/photo-1625842268584-8f329044b541?auto=format&fit=crop&w=800&q=80",
  "p30": "https://images.unsplash.com/photo-1515248137880-45e105b710e0?auto=format&fit=crop&w=800&q=80",

  // --- AUDIO (p31-p45) ---
  "p31": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  "p32": "https://images.unsplash.com/photo-1588449668338-d151688c2471?auto=format&fit=crop&w=800&q=80",
  "p33": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
  "p34": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
  "p35": "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&w=800&q=80",
  "p36": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
  "p37": "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80",
  "p38": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
  "p39": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
  "p40": "https://images.unsplash.com/photo-1484755560695-a4c7300c5c29?auto=format&fit=crop&w=800&q=80",
  "p41": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80",
  "p42": "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?auto=format&fit=crop&w=800&q=80",
  "p43": "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80",
  "p44": "https://images.unsplash.com/photo-1524282745852-6fc2271df052?auto=format&fit=crop&w=800&q=80",
  "p45": "https://images.unsplash.com/photo-1612441804231-77a36b284856?auto=format&fit=crop&w=800&q=80",

  // --- ACCESSORIES (p46-p60) ---
  "p46": "https://images.unsplash.com/photo-1626958390898-162d3577f593?auto=format&fit=crop&w=800&q=80",
  "p47": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
  "p48": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
  "p49": "https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?auto=format&fit=crop&w=800&q=80",
  "p50": "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
  "p51": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
  "p52": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  "p53": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
  "p54": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80",
  "p55": "https://images.unsplash.com/photo-1622445262465-2481c8575328?auto=format&fit=crop&w=800&q=80",
  "p56": "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=800&q=80",
  "p57": "https://images.unsplash.com/photo-1527443195091-1ef21b7510ee?auto=format&fit=crop&w=800&q=80",
  "p58": "https://images.unsplash.com/photo-1601524909162-be87252be365?auto=format&fit=crop&w=800&q=80",
  "p59": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
  "p60": "https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=800&q=80",

  // --- WEARABLES (p61-p75) ---
  "p61": "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=800&q=80",
  "p62": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
  "p63": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  "p64": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80",
  "p65": "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=800&q=80",
  "p66": "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80",
  "p67": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=800&q=80",
  "p68": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
  "p69": "https://images.unsplash.com/photo-1461141353564-b26129cf90b2?auto=format&fit=crop&w=800&q=80",
  "p70": "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80",
  "p71": "https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&w=800&q=80",
  "p72": "https://images.unsplash.com/photo-1510017808666-f762a3e8774d?auto=format&fit=crop&w=800&q=80",
  "p73": "https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=800&q=80",
  "p74": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
  "p75": "https://images.unsplash.com/photo-1434056886845-dac89ffee9b3?auto=format&fit=crop&w=800&q=80"
};

const DEFAULT_BRAND_MAP: Record<string, string[]> = {
  phones: ["apple", "samsung", "xiaomi", "huawei"],
  laptops: ["lenovo", "hp", "dell", "asus", "apple_lap"],
  audio: ["sony", "jbl", "bose"],
  accessories: ["anker", "baseus"],
  wearables: ["amazfit", "samsung_w", "apple_w"]
};

const INITIAL_PRODUCTS: Product[] = COMPACT_ITEMS.map((p, idx) => {
  
  // Assign gradients & patterns based on index
  const gradients = [
    "from-slate-900 to-slate-950",
    "from-zinc-800 to-zinc-950",
    "from-amber-900 to-amber-950",
    "from-amber-900 to-emerald-950",
    "from-purple-900 to-amber-950",
    "from-stone-800 to-stone-950",
    "from-amber-900 to-amber-950"
  ];
  const imageColor = gradients[idx % gradients.length];
  const imagePattern = "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]";
  
  // Determine icon types
  let iconType = "watch";
  if (p[5] === "phones") iconType = "smartphone";
  else if (p[5] === "laptops") iconType = "laptop";
  else if (p[5] === "audio") iconType = "headphones";
  else if (p[5] === "accessories") iconType = "speaker";

  // Construct label-value specs arrays using compact arrays
  const labels = CATEGORY_SPEC_LABELS[p[5]] || ["مشخصات اصلی", "حافظه و بدنه", "قدرت و تغذیه", "رابط اتصالات"];
  const specs = p[7].map((val, valIdx) => ({
    label: labels[valIdx] || "ویژگی",
    value: val
  }));

  // Assign descriptive fallback sentences in Persian if empty
  const description = `بهترین گزینش فنی و کاربردی در دسته‌بندی خود. این محصول اصل، اصالت برند ارجینال را حفظ کرده و مجهز به آخرین فناوری‌های روز دنیا و استانداردهای جهانی کیفی است؛ محصولی است که با خدمات گارانتی معتبر و پشتیبانی کامل ارائه می‌شود.`;

  // Pre-generate professional Persian reviews based on the item index
  const userNames1 = ["پوریا نجفی", "شایان علوی", "المیرا صادقی", "بهنام حیدری", "مهرشاد کرمی", "مریم زاهدی"];
  const userNames2 = ["زهرا کیانی", "امیرحسین راد", "مونا شفیعی", "کامران مرادی", "رویا محمودی", "احسان رضوانی"];
  const dates = ["۱۴۰۶/۰۲/۱۵", "۱۴۰۶/۰۲/۲۴", "۱۴۰۶/۰۳/۰۴", "۱۴۰۶/۰۳/۱۲", "۱۴۰۶/۰۳/۱۹"];
  
  const reviews = [
    {
      id: `r-${p[0]}-1`,
      userName: userNames1[idx % userNames1.length],
      rating: 5,
      comment: "از خریدش کاملاً راضی هستم. عملکردش دقیقاً شبیه برترین نقدهای بین‌المللی است و بسته‌بندی عالی بود.",
      date: dates[idx % dates.length],
      avatarUrl: ""
    },
    {
      id: `r-${p[0]}-2`,
      userName: userNames2[idx % userNames2.length],
      rating: idx % 2 === 0 ? 5 : 4,
      comment: "سرعت تحویل‌ دهی بسیار بالا بود و قیمت بسیار مناسب‌ تری نسبت به فروشگاه‌ های فیزیکی سنتی داره، مطمئن و عالی.",
      date: dates[(idx + 1) % dates.length],
      avatarUrl: ""
    }
  ];

  const avgRating = parseFloat((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1));

  return {
    id: p[0],
    title: p[1],
    englishTitle: p[2],
    price: p[3],
    discountPrice: p[4] > 0 ? p[4] : undefined,
    rating: avgRating,
    category: p[5],
    brand: (DEFAULT_BRAND_MAP[p[5]] || [""])[idx % ((DEFAULT_BRAND_MAP[p[5]] || [""]).length)],
    imageColor,
    imagePattern,
    iconType,
    imageUrl: PRODUCT_UNIQUE_IMAGES[p[0]] || p[6],
    description,
    specs,
    stock: idx % 7 === 0 ? 0 : idx % 5 === 0 ? 1 : idx % 3 === 0 ? 2 : 3 + (idx % 12),
    tags: p[8],
    reviews
  };
});

const VALID_COUPONS: Coupon[] = [
  { code: "ZARIN", discountPercent: 15, minSpend: 1000000 },
  { code: "YALDA", discountPercent: 30, minSpend: 3000000 },
  { code: "WELCOME", discountPercent: 10, minSpend: 0 },
];

interface HeroDealConsoleProps {
  products: Product[];
  onOpenProduct: (product: Product) => void;
  isDarkMode: boolean;
  toPersianNum: (val: number | string) => string;
  playInteractionChime: (type: "button" | "success" | "item-add") => void;
}

function CountdownTimer({ toPersianNum, isDarkMode }: { toPersianNum: (v: number | string) => string; isDarkMode: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 45, seconds: 30 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours: h, minutes: m, seconds: s });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-2.5 font-mono text-xs font-bold leading-none tabular-nums">
      <div className="flex flex-col items-center">
        <span className={`w-8 text-center py-1 rounded text-xs ${isDarkMode ? "bg-slate-800 text-amber-400 font-bold border border-white/5" : "bg-amber-500 text-white font-bold"}`}>
          {toPersianNum(timeLeft.seconds.toString().padStart(2, "0"))}
        </span>
        <span className="text-[8px] text-slate-400 mt-1 font-sans">ثانیه</span>
      </div>
      <span className="text-amber-500 font-bold self-center -mt-3">:</span>
      <div className="flex flex-col items-center">
        <span className={`w-8 text-center py-1 rounded text-xs ${isDarkMode ? "bg-slate-800 text-amber-400 font-bold border border-white/5" : "bg-amber-500 text-white font-bold"}`}>
          {toPersianNum(timeLeft.minutes.toString().padStart(2, "0"))}
        </span>
        <span className="text-[8px] text-slate-400 mt-1 font-sans">دقیقه</span>
      </div>
      <span className="text-amber-500 font-bold self-center -mt-3">:</span>
      <div className="flex flex-col items-center">
        <span className={`w-8 text-center py-1 rounded text-xs ${isDarkMode ? "bg-slate-800 text-amber-400 font-bold border border-white/5" : "bg-amber-500 text-white font-bold"}`}>
          {toPersianNum(timeLeft.hours.toString().padStart(2, "0"))}
        </span>
          <span className="text-[8px] text-slate-400 mt-1 font-sans">ساعت</span>
        </div>
      </div>
  );
}

function HeroDealConsole({ products, onOpenProduct, isDarkMode, toPersianNum, playInteractionChime }: HeroDealConsoleProps) {
  const dealProductIds = ["p1", "p16", "p31", "p61"];
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-slide every 6 seconds
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % dealProductIds.length);
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [dealProductIds.length]);

  // Fetch target active product object
  const activeProductId = dealProductIds[activeIndex];
  const featured = products.find(p => p.id === activeProductId) || products[0];

  if (!featured) return null;

  const currentPrice = featured.discountPrice || featured.price;
  const originalPrice = featured.price;
  const saving = originalPrice - currentPrice;

  // Custom curated spec points for high-quality display based on product
  const getCustomDealSpecs = (id: string): string[] => {
    switch (id) {
      case "p1":
        return ["هوش مصنوعی Galaxy AI", "۲۵۶ گیگابایت حافظه فوق‌سریع", "دوربین ۲۰۰ مگاپیکسلی حرفه‌ای"];
      case "p16":
        return ["نمایشگر تخصصی OLED 240Hz", "تراشه پرچمدار Core Ultra 9", "بیس گیمینگ حرفه‌ای RTX 4070"];
      case "p31":
        return ["حذف نویز فعال ANC هوشمند", "عمر باتری ۳۰ ساعته با شارژ موثر", "کیفیت صدای مگابیس Hi-Res"];
      case "p61":
        return ["بدنه تیتانیوم گرید ۵ نظامی", "صد در صد ضدآب غواصی ۱۰۰ متر", "GPS دو فرکانسه فوق‌العاده دقیق"];
      default:
        return ["کیفیت ساخت فوق‌العاده", "قیمت استثنایی بازار کالا", "گارانتی طلایی معتبر کشوری"];
    }
  };

  const currentSpecs = getCustomDealSpecs(featured.id);

  // Manual sliders
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev - 1 + dealProductIds.length) % dealProductIds.length);
    playInteractionChime("button");
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev + 1) % dealProductIds.length);
    playInteractionChime("button");
  };

  return (
    <>
      {/* ===== MOBILE VERSION ===== */}
      <div className="block sm:hidden relative w-full rounded-2xl p-4 overflow-hidden border shadow-xl bg-slate-900/40 border-white/10 shadow-amber-500/5">
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10 w-full">
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[9px] font-black text-rose-500 tracking-wide">پیشنهاد شگفت‌انگیز ویژه زرین‌کالا_</span>
          </div>
          <div className="flex items-center gap-1">
            {dealProductIds.map((id, index) => (
              <button key={id} onClick={() => { setActiveIndex(index); playInteractionChime("button"); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-3 bg-amber-500" : "w-1 bg-slate-500/30 hover:bg-amber-500/40"}`}
                title={`پیشنهاد شماره ${toPersianNum(index + 1)}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 items-start mb-3 relative">
          <button onClick={handlePrev}
            className="absolute right-[-10px] z-20 p-1 rounded-full border shadow-sm bg-slate-800/80 border-white/5 text-slate-300 scale-90 active:scale-75 cursor-pointer opacity-70">
            <ChevronRight className="w-3 h-3" />
          </button>
          <button onClick={handleNext}
            className="absolute left-[-10px] z-20 p-1 rounded-full border shadow-sm bg-slate-800/80 border-white/5 text-slate-300 scale-90 active:scale-75 cursor-pointer opacity-70">
            <ChevronLeft className="w-3 h-3" />
          </button>

          <img src={safeUrl(featured.imageUrl) || imgFallbackUrl(featured.title, 200, 200, featured.iconType)}
            alt={sanitize(featured.title)} referrerPolicy="no-referrer"
            onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(featured.title, 200, 200, featured.iconType); } else { e.currentTarget.style.display = "none"; } }}
            className="w-16 h-16 object-contain rounded-lg p-1 shrink-0 bg-slate-950/80 border border-white/5"
          />
          <div className="flex-grow min-w-0 text-right space-y-0.5">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[8px] font-black leading-none px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                {toPersianNum(featured.rating)} ★
              </span>
              <h4 className="text-[11px] font-black truncate max-w-[100px] text-slate-100">{featured.title}</h4>
            </div>
            <p className="text-[8px] font-mono text-slate-400 tracking-wide truncate uppercase">{featured.englishTitle}</p>
            <div className="flex flex-wrap gap-1 pt-0.5 justify-start">
              {currentSpecs.map((s, i) => (
                <span key={i} className="text-[7px] px-1 py-0.5 rounded font-black border bg-slate-800/60 text-slate-300 border-white/5">{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] font-black mb-2">
          <span className="text-amber-500">گارانتی ۱۸ ماهه</span>
          <span className="text-rose-500">فقط {toPersianNum(3 + (activeIndex * 2))} عدد</span>
        </div>

        <div className="p-2 rounded-xl flex items-center justify-between gap-1 border mb-2 bg-slate-950/40 border-white/5">
          <div className="flex items-center gap-1 text-amber-500 text-[10px] font-black">
            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
            <span>زمان:</span>
          </div>
          <CountdownTimer toPersianNum={toPersianNum} isDarkMode={isDarkMode} />
        </div>

        <div className="flex items-center justify-between border-t pt-2 border-slate-700/20 gap-2">
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-slate-400 font-black line-through">{toPersianNum(originalPrice.toLocaleString())} تومان</span>
            <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
              <span className="text-[13px] font-black">{toPersianNum(currentPrice.toLocaleString())}</span>
              <span className="text-[8px]">تومان</span>
            </span>
            <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded-md mt-0.5 inline-block w-max">
              تخفیف: {toPersianNum(saving.toLocaleString())} تومان
            </span>
          </div>
          <button onClick={() => { onOpenProduct(featured); playInteractionChime("button"); }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-amber-500/10 flex items-center gap-1 shrink-0">
            <span>مشاهده</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ===== DESKTOP VERSION ===== */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden sm:block relative w-full sm:rounded-3xl p-6 overflow-hidden border shadow-xl bg-slate-900/40 border-white/10 shadow-amber-500/5 sm:backdrop-blur-xl"
      >
        {/* Dynamic Laser Sweep Effect */}
        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40 sm:group-hover:animate-shine pointer-events-none" />

        {/* Decorative Light Glows */}
        <div className={`absolute -right-20 -top-20 w-44 h-44 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700 ${isDarkMode ? "bg-amber-500" : "bg-amber-400"}`} />
        
        {/* Header Info Block */}
        <div className="flex items-center justify-between gap-2 mb-4 relative z-10 w-full">
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-black text-rose-500 tracking-wide">پیشنهاد شگفت‌انگیز ویژه زرین‌کالا_</span>
          </div>
          <div className="flex items-center gap-1">
            {dealProductIds.map((id, index) => (
              <button key={id} onClick={() => { setActiveIndex(index); playInteractionChime("button"); }}
                className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? "w-4 bg-amber-500" : "w-1.5 bg-slate-500/30 hover:bg-amber-500/40"}`}
                title={`پیشنهاد شماره ${toPersianNum(index + 1)}`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-4 items-center mb-5 relative">
            <button onClick={handlePrev}
              className={`absolute right-[-15px] z-20 p-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all scale-90 active:scale-75 cursor-pointer opacity-30 sm:group-hover:opacity-100 ${isDarkMode ? "bg-slate-800/80 border-white/5 text-slate-300 hover:text-white" : "bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleNext}
              className={`absolute left-[-15px] z-20 p-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all scale-90 active:scale-75 cursor-pointer opacity-30 sm:group-hover:opacity-100 ${isDarkMode ? "bg-slate-800/80 border-white/5 text-slate-300 hover:text-white" : "bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="relative shrink-0 sm:group-hover:scale-105 transition-transform duration-500 px-4">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-xl blur-md opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500" />
              <img src={safeUrl(featured.imageUrl) || imgFallbackUrl(featured.title, 200, 200, featured.iconType)}
                alt={sanitize(featured.title)} referrerPolicy="no-referrer"
                onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(featured.title, 200, 200, featured.iconType); } else { e.currentTarget.style.display = "none"; } }}
                className="w-24 h-24 object-contain rounded-xl p-1.5 relative z-10 border transition-all bg-slate-950/80 border-white/5"
              />
            </div>

            <div className="space-y-1.5 flex-grow min-w-0 text-right pr-1 pl-2">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[9.5px] font-black leading-none px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                  {toPersianNum(featured.rating)} ★
                </span>
                <h4 className="text-sm font-black truncate text-slate-100">{featured.title}</h4>
              </div>
              <p className="text-[9.5px] font-mono text-slate-400 tracking-wide truncate uppercase">{featured.englishTitle}</p>
              <div className="flex flex-wrap gap-1 pt-1 justify-start">
                {currentSpecs.map((s, i) => (
                  <span key={i} className="text-[8.5px] px-1.5 py-0.5 rounded font-black border bg-slate-800/60 text-slate-300 border-white/5">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-5 text-right relative">
            <div className="flex justify-between text-[10px] font-black">
              <span className="text-amber-500">تضمین اصالت طلایی و گارانتی ۱۸ ماهه</span>
              <span className="text-rose-500 flex items-center gap-1">
                فقط {toPersianNum(3 + (activeIndex * 2))} عدد باقی مانده در انبار!
              </span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800/80" : "bg-slate-100"}`}>
              <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" style={{ width: `${35 + activeIndex * 15}%` }} />
            </div>
          </div>

          <div className={`p-3 rounded-xl flex items-center justify-between gap-1 border mb-5 ${isDarkMode ? "bg-slate-950/40 border-white/5" : "bg-amber-500/5 border-amber-500/10"}`}>
            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-black">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>زمان باقیمانده برای ثبت سفارش:</span>
            </div>
            <CountdownTimer toPersianNum={toPersianNum} isDarkMode={isDarkMode} />
          </div>

          <div className="flex items-center justify-between border-t pt-4 border-slate-700/20 gap-2">
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-black line-through">{toPersianNum(originalPrice.toLocaleString())} تومان</span>
              <span className="text-sm font-black text-emerald-500 flex items-center gap-1">
                <span className="text-base font-black">{toPersianNum(currentPrice.toLocaleString())}</span>
                <span className="text-[10px]">تومان</span>
              </span>
              <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md mt-0.5 inline-block w-max">
                تخفیف ویژه: {toPersianNum(saving.toLocaleString())} تومان
              </span>
            </div>
            <button onClick={() => { onOpenProduct(featured); playInteractionChime("button"); }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 text-center flex items-center gap-1.5 shrink-0">
              <span>مشاهده</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// -------------------------------------------------------------
// Component-based Safe Avatar with robust failure fallback
// -------------------------------------------------------------
function SafeUserAvatar({ user, sizeClass = "w-20 h-20 rounded-2xl text-xl" }: { user: ZarinUser | null; sizeClass?: string }) {
  const [imgError, setImgError] = useState(false);

  // If user has an avatarUrl and it is not blank nor includes unsplash nor had an image loading error
  const isBroken = !user?.avatarUrl || user.avatarUrl.includes("unsplash.com") || user.avatarUrl.includes("invalid") || imgError;
  
  if (user?.avatarUrl && !isBroken) {
    return (
      <img 
        src={safeUrl(user.avatarUrl)} 
        alt={sanitize(user.fullName)}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClass} object-cover border border-amber-500/30 shadow-lg bg-slate-900 inline-block`}
      />
    );
  }

  // Fallback to beautiful default profile vector silhouette icon
  return (
    <div className={`${sizeClass} flex items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/60 shadow-lg text-amber-500 inline-flex shrink-0`}>
      <User className="w-1/2 h-1/2 text-amber-400" />
    </div>
  );
}

export default function App() {
  // --- AUTHENTICATION & WALLET STATES ---
  const [users, setUsers] = useState<ZarinUser[]>(() => {
    const saved = localStorage.getItem("zarin_users");
    if (saved) {
      try {
        const parsed: ZarinUser[] = JSON.parse(saved);
        // Clear legacy unsplash broken avatars to cleanly use default vector avatars
        return parsed.map(u => ({
          ...u,
          avatarUrl: (u.avatarUrl && u.avatarUrl.includes("unsplash.com")) ? "" : u.avatarUrl
        }));
      } catch (e) {
        // Fallback
      }
    }
    const defaultUsers: ZarinUser[] = [
      {
        id: "admin",
        username: "admin",
        fullName: "مدیر ارشد زرین‌کالا",
        email: "admin@zarin.com",
        phone: "09120000000",
        password: "admin",
        role: "admin",
        walletBalance: 0,
        status: "active",
        createdAt: "2026-05-27",
        avatarUrl: ""
      },
      {
        id: "emadch121@gmail.com",
        username: "emad",
        fullName: "عماد احمدی",
        email: "emadch121@gmail.com",
        phone: "09121234567",
        password: "user",
        role: "customer",
        walletBalance: 45000000,
        status: "active",
        createdAt: "2026-05-27",
        avatarUrl: ""
      }
    ];
    localStorage.setItem("zarin_users", JSON.stringify(defaultUsers));
    return defaultUsers;
  });

  const [currentUser, setCurrentUser] = useState<ZarinUser | null>(() => {
    const saved = localStorage.getItem("zarin_current_user");
    if (saved) {
      try {
        const parsed: ZarinUser = JSON.parse(saved);
        // Smoothly clean out old unsplash avatars for user
        if (parsed.avatarUrl && parsed.avatarUrl.includes("unsplash.com")) {
          parsed.avatarUrl = "";
        }
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return null;
  });

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem("zarin_wallet_transactions");
    if (saved) return JSON.parse(saved);
    const defaults: WalletTransaction[] = [
      {
        id: "tx_init_1",
        userId: "emadch121@gmail.com",
        userName: "عماد احمدی",
        amount: 45000000,
        type: "deposit",
        description: "شارژ اولیه هدیه عضویت باشگاه زرین‌پلاس",
        date: "2026-05-27T08:15:30Z"
      }
    ];
    localStorage.setItem("zarin_wallet_transactions", JSON.stringify(defaults));
    return defaults;
  });

  const [otpRecords, setOtpRecords] = useState<OtpRecord[]>(() => {
    const saved = localStorage.getItem("zarin_otp_records");
    return saved ? JSON.parse(saved) : [];
  });

  // Login UI temporary states
  const [loginMode, setLoginMode] = useState<"login" | "signup" | "forgot">("login");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup form
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });
  const [signupError, setSignupError] = useState("");

  // Forgot Password flow
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotSentCode, setForgotSentCode] = useState("");
  const [forgotCodeInput, setForgotCodeInput] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Google Simulation & Custom Input states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [selectedProfileAvatar, setSelectedProfileAvatar] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Unified interactive bank payment flow states
  const [activeBankFlow, setActiveBankFlow] = useState<"order" | "wallet" | null>(null);
  const [walletRechargeAmount, setWalletRechargeAmount] = useState<number | null>(null);

  const [openExpirySelect, setOpenExpirySelect] = useState<"month" | "year" | null>(null);

  // Profile management tab states
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [chargeAmountInput, setChargeAmountInput] = useState("");
  const [isChargingOpen, setIsChargingOpen] = useState(false);

  // Helper file handler for Profile picture upload converting to Base64 (auto-saves)
  const handleProfileFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("لطفاً فقط فایل تصویر معتبر انتخاب کنید.", "error");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      showToast("حجم تصویر خیلی بالاست. حداکثر حجم ۳۰ مگابایت.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && currentUser) {
        const newAvatarUrl = e.target.result as string;
        setSelectedProfileAvatar(newAvatarUrl);
        const modified = { ...currentUser, avatarUrl: newAvatarUrl };
        setCurrentUser(modified);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? modified : u));
        setProducts(prev => prev.map(p => ({
          ...p,
          reviews: p.reviews.map(r => {
            if (r.userId === currentUser.id || (!r.userId && r.userName === currentUser.fullName)) {
              return { ...r, avatarUrl: newAvatarUrl };
            }
            return r;
          })
        })));
        setSelectedProduct(prev => prev ? {
          ...prev,
          reviews: prev.reviews.map(r => {
            if (r.userId === currentUser.id || (!r.userId && r.userName === currentUser.fullName)) {
              return { ...r, avatarUrl: newAvatarUrl };
            }
            return r;
          })
        } : null);
        playInteractionChime("success");
        showToast("تصویر پروفایل با موفقیت ذخیره شد.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (currentUser) {
      setSelectedProfileAvatar(currentUser.avatarUrl || "");
    }
  }, [currentUser?.id, currentUser?.avatarUrl]);

  // Admin user management states
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [adminSelectedUser, setAdminSelectedUser] = useState<ZarinUser | null>(null);
  const [adminAdjustAmount, setAdminAdjustAmount] = useState("");
  const [adminAdjustNote, setAdminAdjustNote] = useState("تعدیل دستی موجودی توسط مدیریت");
  const [adminUserFilterType, setAdminUserFilterType] = useState<"all" | "active" | "suspended" | "admin">("all");

  // Navigation & Tab State: 'shop' | 'wishlist' | 'orders' | 'about' | 'admin' | 'profile'
  const [activeTab, setActiveTab] = useState<"shop" | "wishlist" | "orders" | "about" | "admin" | "profile">("shop");
  
  // Auto scroll to top smoothly when tab changes so user doesn't get lost scrolled down
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);
  
  // Redirect admin to dashboard on mount
  useEffect(() => {
    if (currentUser?.role === "admin") {
      setActiveTab("admin");
      setIsAdminLoggedIn(true);
    }
  }, [currentUser]);

  // ─── SEO: Dynamic meta tags per tab ────────────────────────────────────────
  useEffect(() => {
    const seo = SEO_TABS[activeTab] || SEO_DEFAULTS;
    document.title = sanitize(seo.title);
    updateMeta("description", sanitize(seo.description));
    updateMeta("og:title", sanitize(seo.title));
    updateMeta("og:description", sanitize(seo.description));
    updateMeta("og:image", SEO_DEFAULTS.image);
    updateMeta("twitter:title", sanitize(seo.title));
    updateMeta("twitter:description", sanitize(seo.description));
    updateMeta("twitter:image", SEO_DEFAULTS.image);
    // Update og:url to current page
    updateMeta("og:url", window.location.href);
  }, [activeTab]);

  // ─── SEO: Block admin pages from indexing ──────────────────────────────────
  useEffect(() => {
    const adminPages = ["admin"];
    const content = adminPages.includes(activeTab) ? "noindex, nofollow" : "index, follow, max-image-preview:large";
    const existing = document.querySelector('meta[name="robots"]');
    if (existing) existing.setAttribute("content", content);
  }, [activeTab]);

  // ─── SEO: Inject BreadcrumbList structured data ──────────────────────────
  useEffect(() => {
    const existing = document.getElementById("ld-breadcrumb");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "ld-breadcrumb";
    script.type = "application/ld+json";
    const crumbs = [
      { "@type": "ListItem", position: 1, name: "خانه", item: "https://zarinboom.com/" }
    ];
    if (activeTab !== "shop") {
      const tabNames: Record<string, string> = { wishlist: "علاقه‌مندی‌ها", orders: "سفارش‌ها", about: "درباره ما", admin: "مدیریت", profile: "پروفایل" };
      crumbs.push({ "@type": "ListItem", position: 2, name: tabNames[activeTab] || activeTab, item: `https://zarinboom.com/${activeTab}` });
    }
    script.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs });
    document.head.appendChild(script);
    return () => { const el = document.getElementById("ld-breadcrumb"); if (el) el.remove(); };
  }, [activeTab]);

  // Custom Coupons list state
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem("zarin_coupons");
    return saved ? JSON.parse(saved) : VALID_COUPONS;
  });

  // Admin section states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem("zarin_admin_logged") === "true";
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminSubTab, setAdminSubTab] = useState<"dashboard" | "products" | "categories" | "orders" | "coupons" | "reviews" | "users" | "messages">("dashboard");

  // Admin Product Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState<{
    id: string;
    title: string;
    englishTitle: string;
    price: number;
    discountPrice?: number;
    rating: number;
    category: string;
    brand: string;
    imageColor: string;
    imagePattern: string;
    iconType: string;
    imageUrl?: string;
    images?: string[];
    description: string;
    specs: { label: string; value: string }[];
    stock: number;
    tags: string[];
    reviews: Review[];
  }>({
    id: "",
    title: "",
    englishTitle: "",
    price: 0,
    discountPrice: undefined,
    rating: 5,
    category: "phones",
    brand: "",
    imageColor: "from-slate-800 to-slate-950",
    imagePattern: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
    iconType: "watch",
    imageUrl: "",
    images: [],
    description: "",
    specs: [],
    stock: 1,
    tags: [],
    reviews: []
  });

  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [newTag, setNewTag] = useState("");
  const [productImageIndex, setProductImageIndex] = useState(0);
  const [editingImageIndex, setEditingImageIndex] = useState(0);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  // Dynamic Categories state with auto migration logic
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(() => {
    const saved = localStorage.getItem("zarin_categories");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasOldCategories = parsed.some((c: any) => ["digital", "home", "fashion", "culture"].includes(c.id));
        if (hasOldCategories) {
          const freshCats = CATEGORIES.filter(c => c.id !== "all");
          localStorage.setItem("zarin_categories", JSON.stringify(freshCats));
          return freshCats;
        }
        return parsed;
      } catch (e) {
        // Fallback on JSON error
      }
    }
    const freshCats = CATEGORIES.filter(c => c.id !== "all");
    localStorage.setItem("zarin_categories", JSON.stringify(freshCats));
    return freshCats;
  });

  // Admin search/filters for Products SubTab
  const [adminProductSearch, setAdminProductSearch] = useState("");
  const [adminProductCategory, setAdminProductCategory] = useState("all");
  const [adminProductStockFilter, setAdminProductStockFilter] = useState<"all" | "instock" | "outofstock" | "lowstock">("all");
  const [adminSortBy, setAdminSortBy] = useState<"title-asc" | "price-desc" | "price-asc" | "stock-desc" | "stock-asc">("title-asc");

  // Admin categories CRUD states
  const [catFormName, setCatFormName] = useState("");
  const [catFormId, setCatFormId] = useState("");
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catEditingName, setCatEditingName] = useState("");
  
  // Category delete delegation modal state
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteMigrationTargetId, setDeleteMigrationTargetId] = useState("");
  
  // Dynamic categories expanded viewing inside Category tab
  const [expandedCatProductsId, setExpandedCatProductsId] = useState<string | null>(null);

  // Subcategories (brands) state - persisted to localStorage
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; parentId: string }[]>(() => {
    const saved = localStorage.getItem("zarin_subcategories");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const defaults = [
      { id: "apple", name: "اپل", parentId: "phones" },
      { id: "samsung", name: "سامسونگ", parentId: "phones" },
      { id: "xiaomi", name: "شیائومی", parentId: "phones" },
      { id: "huawei", name: "هواوی", parentId: "phones" },
      { id: "lenovo", name: "لنوو", parentId: "laptops" },
      { id: "hp", name: "اچ‌پی", parentId: "laptops" },
      { id: "dell", name: "دل", parentId: "laptops" },
      { id: "asus", name: "ایسوس", parentId: "laptops" },
      { id: "apple_lap", name: "اپل (مک‌بوک)", parentId: "laptops" },
      { id: "sony", name: "سونی", parentId: "audio" },
      { id: "jbl", name: "جی‌بی‌ال", parentId: "audio" },
      { id: "bose", name: "بوز", parentId: "audio" },
      { id: "anker", name: "انکر", parentId: "accessories" },
      { id: "baseus", name: "بیسوس", parentId: "accessories" },
      { id: "amazfit", name: "امیزفیت", parentId: "wearables" },
      { id: "samsung_w", name: "سامسونگ (گلکسی واچ)", parentId: "wearables" },
      { id: "apple_w", name: "اپل (واچ)", parentId: "wearables" },
    ];
    localStorage.setItem("zarin_subcategories", JSON.stringify(defaults));
    return defaults;
  });

  // Admin subcategory CRUD states
  const [brandFormName, setBrandFormName] = useState("");
  const [brandFormParent, setBrandFormParent] = useState("");
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingBrandName, setEditingBrandName] = useState("");
  const [expandedBrandProducts, setExpandedBrandProducts] = useState<string | null>(null);
  const [editingBrandProdId, setEditingBrandProdId] = useState<string | null>(null);
  const [editingBrandProdTitle, setEditingBrandProdTitle] = useState("");
  const [editingBrandProdPrice, setEditingBrandProdPrice] = useState("");
  const [editingBrandProdStock, setEditingBrandProdStock] = useState("");
  const [addBrandProdTitle, setAddBrandProdTitle] = useState("");
  const [addBrandProdPrice, setAddBrandProdPrice] = useState("");
  const [addBrandProdStock, setAddBrandProdStock] = useState("");
  // Brand expand/collapse for products tab
  const [expandedProdBrands, setExpandedProdBrands] = useState<string[]>([]);
  // Custom admin dropdown state
  const [adminOpenDropdown, setAdminOpenDropdown] = useState<string | null>(null);

  // Admin Coupons state
  const [couponForm, setCouponForm] = useState<Coupon>({
    code: "",
    discountPercent: 10,
    minSpend: 0
  });

  // Products, Wishlist & Selection
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("zarin_products");
    if (saved) {
      try {
        let parsed: Product[] = JSON.parse(saved);
        const hasOldCategories = parsed.some((p: any) => ["digital", "home", "fashion", "culture"].includes(p.category));
        if (hasOldCategories || parsed.length < 50) {
          localStorage.setItem("zarin_products", JSON.stringify(INITIAL_PRODUCTS));
          return INITIAL_PRODUCTS;
        }
        // Fill in missing imageUrl from the static map
        const fbImgs = Object.values(PRODUCT_UNIQUE_IMAGES);
        parsed = parsed.map((p, i) => {
          const brands = DEFAULT_BRAND_MAP[p.category] || [];
          return {
            ...p,
            brand: p.brand || brands[i % brands.length] || "",
            imageUrl: p.imageUrl || PRODUCT_UNIQUE_IMAGES[p.id] || fbImgs[i % fbImgs.length]
          };
        });
        localStorage.setItem("zarin_products", JSON.stringify(parsed));
        return parsed;
      } catch (e) {
        // Fallback
      }
    }
    localStorage.setItem("zarin_products", JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  });

  // ─── SEO: ItemList structured data for product grid ────────────────────────
  useEffect(() => {
    const existing = document.getElementById("ld-itemlist");
    if (existing) existing.remove();
    if (activeTab !== "shop" || products.length === 0) return;
    const script = document.createElement("script");
    script.id = "ld-itemlist";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: sanitize(p.title),
          sku: p.id,
          offers: {
            "@type": "Offer",
            priceCurrency: "IRR",
            price: p.discountPrice || p.price,
            availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        }
      }))
    });
    document.head.appendChild(script);
    return () => { const el = document.getElementById("ld-itemlist"); if (el) el.remove(); };
  }, [activeTab, products]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ─── SEO: Inject Product structured data when detail modal is open ─────────
  useEffect(() => {
    const existing = document.getElementById("ld-product");
    if (existing) existing.remove();
    if (!selectedProduct) return;
    const script = document.createElement("script");
    script.id = "ld-product";
    script.type = "application/ld+json";
    const catName = categories.find(c => c.id === selectedProduct.category)?.name || selectedProduct.category;
    const productData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: sanitize(selectedProduct.title),
      alternateName: sanitize(selectedProduct.englishTitle),
      description: sanitize(selectedProduct.description),
      image: selectedProduct.images?.length ? selectedProduct.images : (selectedProduct.imageUrl || SEO_DEFAULTS.image),
      sku: selectedProduct.id,
      category: sanitize(catName),
      offers: {
        "@type": "Offer",
        priceCurrency: "IRR",
        price: selectedProduct.discountPrice || selectedProduct.price,
        priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        itemCondition: "https://schema.org/NewCondition",
        availability: selectedProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "فروشگاه زرین‌بوم" }
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: selectedProduct.rating,
        reviewCount: selectedProduct.reviews.length,
        bestRating: 5
      },
      brand: { "@type": "Brand", name: sanitize(selectedProduct.englishTitle.split(" ")[0] || "ZarinBoom") }
    };
    if (selectedProduct.reviews.length > 0) {
      productData.review = selectedProduct.reviews.slice(0, 5).map(r => ({
        "@type": "Review",
        author: { "@type": "Person", name: sanitize(r.userName) },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        reviewBody: sanitize(r.comment).slice(0, 500),
        datePublished: r.date
      }));
    }
    script.textContent = JSON.stringify(productData);
    document.head.appendChild(script);
    return () => { const el = document.getElementById("ld-product"); if (el) el.remove(); };
  }, [selectedProduct, categories]);

  const reviewsEndRef = useRef<HTMLDivElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [scrollToReview, setScrollToReview] = useState(0);
  useEffect(() => {
    if (scrollToReview > 0 && reviewsEndRef.current) {
      reviewsEndRef.current.scrollTo({ top: 0, behavior: "smooth" });
      setScrollToReview(0);
    }
  }, [scrollToReview]);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("zarin_wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  // Searching & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price-asc" | "price-desc" | "discount">("rating");
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number>(200000000);

  // Track hot searches / popular interaction terms dynamically
  const [hotSearches, setHotSearches] = useState<Array<{ term: string; count: number; countType: 'search' | 'view'; emoji?: string }>>(() => {
    const saved = localStorage.getItem("zarin_hot_searches");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 4);
        }
      } catch (e) {
        // Fallback
      }
    }
    return [];
  });

  const recordInteraction = useCallback((term: string, countType: 'search' | 'view') => {
    if (!term || term.trim().length < 2) return;
    const cleanTerm = term.trim().slice(0, 30);
    setHotSearches(prev => {
      const idx = prev.findIndex(item => item.term.toLowerCase() === cleanTerm.toLowerCase());
      let updated = [...prev];
      if (idx !== -1) {
        updated[idx] = { 
          ...updated[idx], 
          count: updated[idx].count + 1,
          countType
        };
      } else {
        let emoji = "🔍";
        if (cleanTerm.includes("ساعت") || cleanTerm.includes("سنج")) emoji = "⌚";
        else if (cleanTerm.includes("هدفون") || cleanTerm.includes("هدست")) emoji = "🎧";
        else if (cleanTerm.includes("بلندگو") || cleanTerm.includes("اسپیکر") || cleanTerm.includes("صدا")) emoji = "🔊";
        else if (cleanTerm.includes("گوشی") || cleanTerm.includes("موبایل") || cleanTerm.includes("تلفن")) emoji = "📱";
        else if (cleanTerm.includes("ماگ") || cleanTerm.includes("لیوان")) emoji = "🥛";
        else if (cleanTerm.includes("میکروفون") || cleanTerm.includes("ضبط")) emoji = "🎙️";
        else if (cleanTerm.includes("لپ") || cleanTerm.includes("کامپیوتر")) emoji = "💻";
        else if (cleanTerm.includes("پاوربانک") || cleanTerm.includes("باتری")) emoji = "🔋";
        else if (cleanTerm.includes("کفش") || cleanTerm.includes("کتونی")) emoji = "👟";
        else if (cleanTerm.includes("عینک")) emoji = "🕶️";
        else if (cleanTerm.includes("قهوه") || cleanTerm.includes("دم")) emoji = "☕";

        updated.push({ term: cleanTerm, count: 1, countType, emoji });
      }
      
      updated.sort((a, b) => b.count - a.count);
      const sliced = updated.slice(0, 4);
      localStorage.setItem("zarin_hot_searches", JSON.stringify(sliced));
      return sliced;
    });
  }, []);

  // Record Search queries with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const delayDebounceFn = setTimeout(() => {
      recordInteraction(searchQuery, 'search');
    }, 400); // Faster reaction (400ms instead of 1200ms)
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, recordInteraction]);

  // Record opens/details interaction
  useEffect(() => {
    if (selectedProduct) {
      // Use the first 3 words of the product title as the term representing the product viewed
      const words = selectedProduct.title.split(" ").slice(0, 3).join(" ");
      recordInteraction(words, 'view');
    }
  }, [selectedProduct, recordInteraction]);

  // Dynamic maximum price calculation matching the active category or admin catalog additions
  const maxPriceInCategory = useMemo(() => {
    const catProducts = selectedCategory === "all"
      ? products
      : products.filter(p => p.category === selectedCategory);
    if (catProducts.length === 0) return 200000000;
    return Math.max(...catProducts.map(p => p.discountPrice || p.price));
  }, [products, selectedCategory]);

  const minPriceInCategory = useMemo(() => {
    const catProducts = selectedCategory === "all"
      ? products
      : products.filter(p => p.category === selectedCategory);
    if (catProducts.length === 0) return 0;
    return Math.min(...catProducts.map(p => p.discountPrice || p.price));
  }, [products, selectedCategory]);

  useEffect(() => {
    setPriceRange(maxPriceInCategory);
  }, [maxPriceInCategory]);

  useEffect(() => {
    setSelectedBrand("");
  }, [selectedCategory]);

  // Cart & checkout
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("zarin_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Shopping Cart animations & dynamic notification states
  const [cartPulse, setCartPulse] = useState(false);
  const [cartNotification, setCartNotification] = useState<CartNotification | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((message: string, type: ToastMessage["type"] = "info") => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  
  // Chat system
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [adminChatReply, setAdminChatReply] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [handoffTicketId, setHandoffTicketId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSessionChoice, setChatSessionChoice] = useState<"continue" | "new" | null>(null);
  const firstChatOpen = useRef(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, aiTyping]);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);
  const adminWsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const userId = currentUser?.id || "guest";
    if (userId === "admin") return; // admin uses own WS
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/ws/user/${userId}/${currentUser?.username || "guest"}`;
    const ws = new WebSocket(url);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "history") {
        const loaded: ChatMessage[] = (data.messages || []).map((m: any) => ({
          id: m.mid || `m_${m.timestamp}`,
          userId: m.is_admin ? "admin" : m.user_id,
          userName: m.is_admin ? "پشتیبانی" : (m.user_name || m.user_id),
          text: m.text,
          timestamp: m.timestamp,
          isAdmin: !!m.is_admin,
          read: true,
          targetUserId: m.is_admin ? m.user_id : undefined,
        }));
        setChatHistory(loaded);
      } else if (data.type === "admin_reply") {
        const m = data.message;
        const msg: ChatMessage = {
          id: m.mid || `a_${m.timestamp}`,
          userId: "admin",
          userName: "پشتیبانی",
          text: m.text,
          timestamp: m.timestamp,
          isAdmin: true,
          read: true,
          targetUserId: m.user_id,
        };
        setMessages(prev => [...prev, msg]);
        addNotification("پاسخ پشتیبانی", m.text, "info", m.user_id);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("پاسخ پشتیبانی زرین‌کالا", { body: m.text, icon: "/product.png" });
        }
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [currentUser]);

  // Admin WebSocket connection
  useEffect(() => {
    if (currentUser?.id !== "admin") return;
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/admin`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "init") {
        // Load existing user messages into local state
        for (const u of (data.users || [])) {
          for (const m of (u.messages || [])) {
            const msg: ChatMessage = {
              id: m.mid || `m_${m.timestamp}`,
              userId: m.is_admin ? "admin" : m.user_id,
              userName: m.is_admin ? "پشتیبانی" : (m.user_name || m.user_id),
              text: m.text,
              timestamp: m.timestamp,
              isAdmin: !!m.is_admin,
              read: !m.is_admin,
              targetUserId: m.is_admin ? m.user_id : undefined,
            };
            setMessages(prev => {
              if (prev.some(p => p.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        }
      } else if (data.type === "user_message") {
        const m = data.message;
        const msg: ChatMessage = {
          id: m.mid || `m_${m.timestamp}`,
          userId: m.user_id,
          userName: m.user_name || m.user_id,
          text: m.text,
          timestamp: m.timestamp,
          isAdmin: false,
          read: false,
        };
        setMessages(prev => [...prev, msg]);
        addNotification("پیام جدید از کاربر", `${m.user_name}: ${m.text}`, "message");
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("پیام جدید از کاربر", { body: `${m.user_name}: ${m.text}`, icon: "/product.png" });
        }
      }
    };
    adminWsRef.current = ws;
    return () => ws.close();
  }, [currentUser]);

  const unreadMessages = messages.filter(m => !m.isAdmin && !m.read).length;
  const userUnreadMessages = messages.filter(m => m.isAdmin && m.targetUserId === (currentUser?.id || "guest") && !m.read).length;
  
  // System notifications (in-app)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  const addNotification = useCallback((title: string, body: string, type: AppNotification["type"], targetUserId?: string) => {
    const notif: AppNotification = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title, body, timestamp: Date.now(), read: false, type, targetUserId
    };
    setNotifications(prev => [notif, ...prev]);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/product.png" });
    }
  }, []);

  // User-side notification tracking
  const userNotifCount = notifications.filter(n => n.targetUserId === (currentUser?.id || "guest") && !n.read).length;
  const [showUserNotifs, setShowUserNotifs] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  // Coupons
  const [couponCode, setCouponCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  // Checkout Stage & Form Details
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "form" | "bank" | "success">("idle");
  const [checkoutSubStep, setCheckoutSubStep] = useState<number>(1);
  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    postalCode: "",
    address: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Bank gateway simulation
  const [bankTimer, setBankTimer] = useState(8);
  const [isTransactionDone, setIsTransactionDone] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [payMethod, setPayMethod] = useState<"wallet" | "bank" | "cod" | null>(null);

  // Interactive payment gateway states (Shaparak / ZarinBank)
  const [payCardNumber, setPayCardNumber] = useState("");
  const [payCvv2, setPayCvv2] = useState("");
  const [payMonth, setPayMonth] = useState("");
  const [payYear, setPayYear] = useState("");
  const [payCaptcha, setPayCaptcha] = useState("");
  const [payCaptchaValue, setPayCaptchaValue] = useState("");
  const [payPin, setPayPin] = useState("");
  const [payOtpSentCode, setPayOtpSentCode] = useState("");
  const [payOtpCountdown, setPayOtpCountdown] = useState(0);
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});
  const [isPayProcessing, setIsPayProcessing] = useState(false);
  const [bankSessionTimer, setBankSessionTimer] = useState(600); // 10 minutes session length
  const [showOtpNotification, setShowOtpNotification] = useState(false); // SMS Notification simulation

  // Past Orders List
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("zarin_orders");
    return saved ? JSON.parse(saved) : [];
  });
  const [trackingSearchCode, setTrackingSearchCode] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  // ─── Backend API Chat ──────────────────────────────────────────────────
  const sendChatMessage = useCallback(async (userMessage: string): Promise<void> => {
    const userId = currentUser?.id || "guest";
    const userName = currentUser?.fullName || currentUser?.username || "guest";
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "user_message", user_id: userId, user_name: userName, text: userMessage }));
    }
  }, [currentUser]);

  // User Review Temp State
  const [tempReview, setTempReview] = useState({ rating: 5, comment: "", userName: "" });
  const [reviewError, setReviewError] = useState("");
  const [adminReplyInput, setAdminReplyInput] = useState("");
  const [replyingToReview, setReplyingToReview] = useState<{ pId: string; reviewId: string } | null>(null);

  // Edit own review state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState<number>(5);
  const [editingComment, setEditingComment] = useState<string>("");

  // Admin notification modal
  const [notifTargetUser, setNotifTargetUser] = useState<{ id: string; name: string } | null>(null);
  const [notifMessageText, setNotifMessageText] = useState("");

  // Dark / Light / Cozy Vintage Theme Customizer
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Persistence helpers
  useEffect(() => {
    localStorage.setItem("zarin_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("zarin_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("zarin_current_user");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("zarin_wallet_transactions", JSON.stringify(walletTransactions));
  }, [walletTransactions]);

  useEffect(() => {
    localStorage.setItem("zarin_otp_records", JSON.stringify(otpRecords));
  }, [otpRecords]);

  useEffect(() => {
    localStorage.setItem("zarin_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("zarin_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("zarin_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("zarin_orders", JSON.stringify(orders));
  }, [orders]);

  // Reset detail image index when selected product changes
  useEffect(() => {
    setDetailImageIndex(0);
  }, [selectedProduct]);

  // Auto slideshow for product images
  useEffect(() => {
    if (activeTab !== "shop") return;
    const interval = setInterval(() => {
      setEditingImageIndex(prev => {
        const maxLen = products.reduce((max, p) => Math.max(max, p.images?.length || 0), 0);
        return maxLen > 0 ? (prev + 1) % maxLen : 0;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, products]);

  useEffect(() => {
    localStorage.setItem("zarin_coupons", JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem("zarin_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("zarin_subcategories", JSON.stringify(subcategories));
  }, [subcategories]);

  // Auto-dismiss cart add notifications
  useEffect(() => {
    if (!cartNotification) return;
    const timer = setTimeout(() => {
      setCartNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [cartNotification?.id]);

  // Audio synthesizer for golden chime
  const playInteractionChime = (toneType: "button" | "success" | "item-add") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = "sine";
      osc2.type = "sine";

      if (toneType === "success") {
        // High pleasant double octave ring
        osc.frequency.setValueAtTime(528, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 Major third
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      } else if (toneType === "item-add") {
        // Dynamic up-sweep
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        osc2.frequency.setValueAtTime(660, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      } else {
        // Soft click
        osc.frequency.setValueAtTime(330, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      }

      osc.connect(gainNode);
      if (toneType !== "button") {
        osc2.connect(gainNode);
      }
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      if (toneType !== "button") osc2.start();
      
      osc.stop(audioCtx.currentTime + 1.2);
      if (toneType !== "button") osc2.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      // Audio block fallback
    }
  };

  // Convert numbers to Persian digits beautifully
  const toPersianNum = (num: number | string): string => {
    const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    let cleanStr = String(num);
    // Format if large number to have comma separators (e.g. 1000000 -> 1,000,000)
    if (typeof num === "number") {
      cleanStr = num.toLocaleString("en-US");
    }
    return cleanStr.replace(/[0-9]/g, function (w) {
      return id[+w];
    });
  };

  // Convert Persian digits to English digits
  const toEnglishDigits = (str: string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/[۰-۹]/g, w => String(persianDigits.indexOf(w)));
  };

  // Maps any category ID & title dynamically to a beautiful emoji, soft gradient background, and active border styling
  const getCategoryEmojiAndGradient = (id: string, name: string) => {
    const lowerId = id.toLowerCase();
    const nameStr = name.toLowerCase();
    
    if (lowerId === "all") {
      return { 
        emoji: "✨", 
        gradient: "from-amber-500/10 to-amber-600/10 text-amber-500", 
        border: "border-amber-500/30",
        bgHover: "hover:bg-amber-500/10",
        bulletColor: "bg-amber-500"
      };
    }
    if (lowerId.includes("digit") || lowerId.includes("tech") || lowerId.includes("phone")) {
      return { 
        emoji: "💻", 
        gradient: "from-amber-500/10 to-yellow-500/10 text-amber-400", 
        border: "border-amber-500/20",
        bgHover: "hover:bg-amber-500/10",
        bulletColor: "bg-amber-400"
      };
    }
    if (lowerId.includes("home") || lowerId.includes("decor") || lowerId.includes("light") || nameStr.includes("دکور") || nameStr.includes("خانه")) {
      return { 
        emoji: "💡", 
        gradient: "from-yellow-500/10 to-amber-500/10 text-yellow-400", 
        border: "border-yellow-500/20",
        bgHover: "hover:bg-yellow-500/10",
        bulletColor: "bg-yellow-400"
      };
    }
    if (lowerId.includes("fashion") || lowerId.includes("style") || lowerId.includes("wear") || lowerId.includes("access") || nameStr.includes("پوشاک") || nameStr.includes("اکسسوری")) {
      return { 
        emoji: "🕶️", 
        gradient: "from-rose-500/10 to-pink-500/10 text-rose-400", 
        border: "border-rose-500/20",
        bgHover: "hover:bg-rose-500/10",
        bulletColor: "bg-rose-400"
      };
    }
    if (lowerId.includes("cultur") || lowerId.includes("book") || lowerId.includes("write") || nameStr.includes("فرهنگ") || nameStr.includes("کتاب")) {
      return { 
        emoji: "📚", 
        gradient: "from-emerald-500/10 to-teal-500/10 text-emerald-400", 
        border: "border-emerald-500/20",
        bgHover: "hover:bg-emerald-500/10",
        bulletColor: "bg-emerald-400"
      };
    }
    if (lowerId.includes("kitchen") || lowerId.includes("cook") || nameStr.includes("آشپز")) {
      return { 
        emoji: "🍳", 
        gradient: "from-orange-500/10 to-red-500/10 text-orange-400", 
        border: "border-orange-500/20",
        bgHover: "hover:bg-orange-500/10",
        bulletColor: "bg-orange-400"
      };
    }
    
    // Smooth deterministic fallback colors and random beautiful emojis for newly created dynamic categories
    const emojis = ["📦", "🎁", "🛍️", "🔖", "💎", "⭐", "⚡", "🔮", "🍀"];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const emoji = emojis[hash % emojis.length];
    
    const gradients = [
      "from-purple-500/10 to-amber-500/10 text-purple-400",
      "from-amber-500/10 to-amber-500/10 text-amber-400",
      "from-fuchsia-500/10 to-pink-500/10 text-fuchsia-400",
      "from-violet-500/10 to-purple-500/10 text-violet-400"
    ];
    const borderColors = [
      "border-purple-500/20",
      "border-amber-500/20",
      "border-fuchsia-500/20",
      "border-violet-500/20"
    ];
    const bulletColors = [
      "bg-purple-400",
      "bg-amber-400",
      "bg-fuchsia-400",
      "bg-violet-400"
    ];

    return { 
      emoji, 
      gradient: gradients[hash % gradients.length],
      border: borderColors[hash % borderColors.length],
      bgHover: "hover:bg-fuchsia-500/10",
      bulletColor: bulletColors[hash % bulletColors.length]
    };
  };

  // Wishlist controls
  const toggleWishlist = (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    playInteractionChime("button");
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // Cart actions
  const addToCart = (product: Product, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Check stock limit
    const existing = cart.find(item => item.product.id === product.id);
    if (existing && existing.quantity >= product.stock) {
      showToast(`موجودی کالا محدود به ${toPersianNum(product.stock)} عدد می‌باشد.`, "warning");
      return;
    }

    // 1. Trigger bouncy cartPulse feedback indicator
    setCartPulse(true);
    setTimeout(() => {
      setCartPulse(false);
    }, 550);
    
    // 2. Set beautiful Toast Notification with count update
    const currentQtyInCart = (existing ? existing.quantity : 0) + 1;
    setCartNotification({
      id: Math.random().toString(),
      productTitle: product.title,
      imageUrl: product.imageUrl,
      iconType: product.iconType,
      imageColor: product.imageColor,
      quantity: currentQtyInCart
    });

    playInteractionChime("item-add");
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id: string, change: number) => {
    playInteractionChime("button");
    setCart(prev => {
      const mapped = prev.map(item => {
        if (item.product.id === id) {
          const newQty = item.quantity + change;
          // Check stock limit for increase
          if (change > 0 && newQty > item.product.stock) {
            showToast(`حداکثر موجودی قابل خرید: ${toPersianNum(item.product.stock)} عدد.`, "warning");
            return item;
          }
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      });
      return mapped.filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: string) => {
    playInteractionChime("button");
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  // Math totals
  const cartSubtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.discountPrice || item.product.price;
    return sum + (basePrice * item.quantity);
  }, 0);

  const discountValue = activeCoupon ? (cartSubtotal * activeCoupon.discountPercent / 100) : 0;
  const deliveryFee = cartSubtotal > 3000000 || cartSubtotal === 0 ? 0 : 49000;
  const cartTotal = cartSubtotal - discountValue + deliveryFee;

  // Coupon application logic
  const handleApplyCoupon = () => {
    const match = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (!match) {
      setCouponError("کد تخفیف معتبر نیست یا منقضی شده است.");
      setCouponSuccess("");
      playInteractionChime("button");
      return;
    }
    if (cartSubtotal < match.minSpend) {
      setCouponError(`حداقل خرید برای استفاده از این کد ${toPersianNum(match.minSpend)} تومان است.`);
      setCouponSuccess("");
      playInteractionChime("button");
      return;
    }
    setActiveCoupon(match);
    setCouponError("");
    setCouponSuccess(`تبریک! تخفیف ${toPersianNum(match.discountPercent)}٪ با موفقیت روی سبد خرید شما اعمال شد.`);
    playInteractionChime("success");
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    setCouponSuccess("");
    setCouponCode("");
    playInteractionChime("button");
  };

  // Product Filter, Range and Sorting Mechanics (Memoized for high performance rendering & SEO compatibility)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.englishTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // If the user has typed a search query, bypass/remove other active filters (category, price) so all search results are displayed globally!
      if (searchQuery.trim() !== "") {
        return matchesSearch;
      }

      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesBrand = selectedBrand === "" || p.brand === selectedBrand;
      const finalPrice = p.discountPrice || p.price;
      const matchesPrice = finalPrice <= priceRange;
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    }).sort((a, b) => {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;

      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "discount") {
        const discA = a.discountPrice ? (a.price - a.discountPrice) : 0;
        const discB = b.discountPrice ? (b.price - b.discountPrice) : 0;
        return discB - discA;
      }
      return 0;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, priceRange, sortBy]);

  // Auto-scroll for category pills — stops on manual scroll
  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    let ticking: number;
    let active = true;
    const onScroll = () => { active = false; };
    el.addEventListener("scroll", onScroll, { once: true });
    const step = () => {
      if (!active) return;
      el.scrollBy({ left: 0.6 });
      if (el.scrollLeft <= 0 && el.scrollWidth > el.clientWidth) {
        el.scrollLeft = el.scrollWidth;
      }
      ticking = requestAnimationFrame(step);
    };
    ticking = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(ticking); el.removeEventListener("scroll", onScroll); };
  }, []);

  // Review submission
  const handleAddReview = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!tempReview.comment.trim()) {
      setReviewError("لطفا متن نظر خود را وارد کنید.");
      return;
    }
    if (tempReview.comment.trim().length > 2000) {
      setReviewError("متن نظر نمی‌تواند بیش از ۲۰۰۰ کاراکتر باشد.");
      return;
    }
    if (tempReview.userName.trim().length > 100) {
      setReviewError("نام کاربری نمی‌تواند بیش از ۱۰۰ کاراکتر باشد.");
      return;
    }
    const userNameToUse = tempReview.userName.trim() || currentUser?.fullName || "کاربر مهمان";

    const newReview: Review = {
      id: "rev_" + Date.now(),
      userId: currentUser?.id,
      userName: sanitize(userNameToUse).slice(0, 100),
      rating: Math.min(5, Math.max(1, tempReview.rating)),
      comment: sanitize(tempReview.comment).slice(0, 2000),
      date: "۱۴۰۶/۰۳/۰۶",
      avatarUrl: currentUser ? currentUser.avatarUrl : undefined
    };

    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct.id) {
        const updatedReviews = [newReview, ...p.reviews];
        // calculate new mean rating
        const sum = updatedReviews.reduce((acc, current) => acc + current.rating, 0);
        const nextRating = parseFloat((sum / updatedReviews.length).toFixed(1));
        return {
          ...p,
          reviews: updatedReviews,
          rating: nextRating
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setSelectedProduct(prev => prev ? {
      ...prev,
      reviews: [newReview, ...prev.reviews],
      rating: parseFloat(((prev.reviews.reduce((acc, r) => acc + r.rating, 0) + tempReview.rating) / (prev.reviews.length + 1)).toFixed(1))
    } : null);

    setTempReview({ rating: 5, comment: "", userName: "" });
    setReviewError("");
    setScrollToReview(prev => prev + 1);
    playInteractionChime("success");
  };

  // Delete own review
  const handleDeleteReview = (revId: string) => {
    if (!selectedProduct || !currentUser) return;
    // Verify ownership
    const targetReview = selectedProduct.reviews.find(r => r.id === revId);
    if (!targetReview) return;
    if (targetReview.userId !== currentUser.id && targetReview.userName !== currentUser.fullName) {
      showToast("شما نمی‌توانید نظر دیگران را حذف کنید.", "error");
      return;
    }
    setConfirmDialog({
      message: "آیا از حذف نظر خود مطمئن هستید؟",
      onConfirm: () => {
        setConfirmDialog(null);
        const updatedProducts = products.map(p => {
          if (p.id === selectedProduct.id) {
            const remaining = p.reviews.filter(r => r.id !== revId);
            const sum = remaining.reduce((acc, r) => acc + r.rating, 0);
            const nextRating = remaining.length > 0 ? parseFloat((sum / remaining.length).toFixed(1)) : 0;
            return { ...p, reviews: remaining, rating: nextRating };
          }
          return p;
        });
        setProducts(updatedProducts);
        setSelectedProduct(prev => prev ? {
          ...prev,
          reviews: prev.reviews.filter(r => r.id !== revId),
          rating: (() => {
            const remaining = prev.reviews.filter(r => r.id !== revId);
            if (remaining.length === 0) return 0;
            const sum = remaining.reduce((acc, r) => acc + r.rating, 0);
            return parseFloat((sum / remaining.length).toFixed(1));
          })()
        } : null);
        playInteractionChime("button");
      }
    });
  };

  // Edit own review
  const handleSaveEditReview = (revId: string) => {
    if (!selectedProduct || !currentUser) return;
    if (!editingComment.trim()) return;
    // Verify ownership
    const targetReview = selectedProduct.reviews.find(r => r.id === revId);
    if (!targetReview) return;
    if (targetReview.userId !== currentUser.id && targetReview.userName !== currentUser.fullName) {
      showToast("شما نمی‌توانید نظر دیگران را ویرایش کنید.", "error");
      setEditingReviewId(null);
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct.id) {
        const updatedReviews = p.reviews.map(r =>
          r.id === revId ? { ...r, rating: editingRating, comment: editingComment.trim() } : r
        );
        const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const nextRating = parseFloat((sum / updatedReviews.length).toFixed(1));
        return { ...p, reviews: updatedReviews, rating: nextRating };
      }
      return p;
    });

    setProducts(updatedProducts);
    setSelectedProduct(prev => prev ? {
      ...prev,
      reviews: prev.reviews.map(r => r.id === revId ? { ...r, rating: editingRating, comment: editingComment.trim() } : r),
      rating: (() => {
        const updated = prev.reviews.map(r => r.id === revId ? { ...r, rating: editingRating, comment: editingComment.trim() } : r);
        const sum = updated.reduce((acc, r) => acc + r.rating, 0);
        return parseFloat((sum / updated.length).toFixed(1));
      })()
    } : null);

    setEditingReviewId(null);
    playInteractionChime("success");
  };

  // Form validations for Checkout stage
  const validateSubStep = (stepNum: number) => {
    const errors: Record<string, string> = {};
    if (stepNum === 1) {
      if (!shippingForm.fullName.trim()) errors.fullName = "نام و نام خانوادگی تحویل‌گیرنده اجباری است.";
      if (!shippingForm.phone.trim()) {
        errors.phone = "شماره همراه صحیح اجباری است.";
      } else if (!/^09\d{9}$/.test(shippingForm.phone.trim())) {
        errors.phone = "قالب شماره همراه اشتباه است (مانند: ۰۹۱۲۳۴۵۶۷۸۹).";
      }
    } else if (stepNum === 2) {
      if (!shippingForm.city.trim()) errors.city = "نام شهر مقصد اجباری است.";
      if (!shippingForm.postalCode.trim()) {
        errors.postalCode = "کد پستی ۱۰ رقمی الزامی است.";
      } else if (!/^\d{10}$/.test(shippingForm.postalCode.trim())) {
        errors.postalCode = "کد پستی باید دقیقا ۱۰ رقم عددی باشد.";
      }
      if (!shippingForm.address.trim()) errors.address = "آدرس پستی کاملی وارد کنید.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!shippingForm.fullName.trim()) errors.fullName = "نام و نام خانوادگی تحویل‌گیرنده اجباری است.";
    if (!shippingForm.phone.trim()) {
      errors.phone = "شماره همراه صحیح اجباری است.";
    } else if (!/^09\d{9}$/.test(shippingForm.phone.trim())) {
      errors.phone = "قالب شماره همراه اشتباه است (مانند: ۰۹۱۲۳۴۵۶۷۸۹).";
    }
    if (!shippingForm.city.trim()) errors.city = "نام شهر مقصد اجباری است.";
    if (!shippingForm.postalCode.trim()) {
      errors.postalCode = "کد پستی ۱۰ رقمی الزامی است.";
    } else if (!/^\d{10}$/.test(shippingForm.postalCode.trim())) {
      errors.postalCode = "کد پستی باید دقیقا ۱۰ رقم عددی باشد.";
    }
    if (!shippingForm.address.trim()) errors.address = "آدرس پستی کاملی وارد کنید.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep("form");
    setCheckoutSubStep(1);
    setFormErrors({});
    setIsCartOpen(false);
    playInteractionChime("button");
  };

  const handleSubmitShipping = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (paymentMethod === "online") {
        setCheckoutStep("bank");
        // Reset interactive bank states
        setPayCardNumber("");
        setPayCvv2("");
        setPayMonth("");
        setPayYear("");
        setPayPin("");
        setPayOtpSentCode("");
        setPayOtpCountdown(0);
        setPayErrors({});
        setIsPayProcessing(false);
        setBankSessionTimer(600); // 10 minutes
        generateNewCaptcha();
        playInteractionChime("success");
      } else {
        // Cash on delivery - order registered immediately
        registerNewOrder("cod");
      }
    }
  };

  const generateNewCaptcha = () => {
    const num = Math.floor(1000 + Math.random() * 9000).toString();
    setPayCaptchaValue(num);
    setPayCaptcha("");
  };

  const registerNewOrder = (method: "online" | "cod" | "wallet") => {
    const orderId = "ZRN-" + Math.floor(100000 + Math.random() * 900000);
    const orderTracking = "IR-" + Math.floor(100000000 + Math.random() * 900000000);
    
    let faDate = "۱۴۰۶/۰۳/۰۶";
    try {
      faDate = new Date().toLocaleDateString("fa-IR");
    } catch (e) {}

    const newOrder: Order = {
      id: orderId,
      date: faDate,
      items: [...cart],
      total: cartTotal,
      shippingInfo: { ...shippingForm },
      paymentMethod: method === "online" ? "درگاه بانکی شتاب (پرداخت برخط)" : method === "wallet" ? "کیف پول زرین‌کالا" : "پرداخت در محل هنگام تحویل",
      status: "preparing",
      trackingNumber: orderTracking,
      discountApplied: discountValue
    };

    // Deduct stock levels from original catalog products list
    const updatedProducts = products.map(item => {
      const orderedItem = cart.find(cartIt => cartIt.product.id === item.id);
      if (orderedItem) {
        return {
          ...item,
          stock: Math.max(0, item.stock - orderedItem.quantity)
        };
      }
      return item;
    });
    setProducts(updatedProducts);

    if (method === "wallet") {
      const walletTx: WalletTransaction = {
        id: "TXN-W-" + Date.now(),
        userId: currentUser?.id || "",
        userName: currentUser?.fullName || "",
        type: "purchase",
        amount: cartTotal,
        date: new Date().toLocaleDateString("fa-IR"),
        description: `پرداخت خرید از کیف پول - سفارش ${orderId}`,
      };
      setWalletTransactions(prev => [walletTx, ...prev]);
    }
    setOrders(prev => [newOrder, ...prev]);
    setLastPlacedOrder(newOrder);
    setCart([]);
    setActiveCoupon(null);
    setCouponCode("");
    setCheckoutStep("idle");
    setCheckoutSubStep(1);
    if (method === "cod") {
      showToast("سفارش شما ثبت شد. پرداخت درب منزل هنگام تحویل انجام می‌شود.", "success");
    } else if (method === "wallet") {
      showToast("پرداخت با کیف پول زرین‌کالا با موفقیت انجام شد.", "success");
    } else {
      showToast("پرداخت با کارت بانکی با موفقیت انجام شد. سفارش شما ثبت گردید.", "success");
    }
    setActiveTab("orders");
    playInteractionChime("success");
    return newOrder;
  };

  const handleRequestOtp = () => {
    const rawCard = payCardNumber.replace(/\D/g, "");
    if (rawCard.length < 6) {
      setPayErrors(prev => ({ ...prev, cardNumber: "برای درخواست رمز پویا، ابتدا حداقل ۶ رقم اول شماره کارت خود را وارد کنید." }));
      playInteractionChime("button");
      return;
    }

    setPayErrors(prev => {
      const copy = { ...prev };
      delete copy.cardNumber;
      delete copy.pin;
      return copy;
    });

    const generatedCode = Math.floor(10000 + Math.random() * 90000).toString();
    setPayOtpSentCode(generatedCode);
    setPayOtpCountdown(120);
    setShowOtpNotification(true);
    console.log(`[OTP Payment] کد تایید پرداخت شما: ${generatedCode}`);
    playInteractionChime("success");

    setTimeout(() => {
      setShowOtpNotification(false);
    }, 10000);
  };

  const handleCompletePayment = (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const rawCard = payCardNumber.replace(/\D/g, "");
    if (rawCard.length !== 16) {
      errors.cardNumber = "شماره کارت باید ۱۶ رقم کامل باشد.";
    }

    if (payCvv2.trim().length < 3 || payCvv2.trim().length > 4) {
      errors.cvv2 = "کد CVV2 باید ۳ یا ۴ رقم باشد.";
    }

    if (!payMonth || parseInt(payMonth) < 1 || parseInt(payMonth) > 12) {
      errors.month = "ماه انقضاء نامعتبر است.";
    }

    if (!payYear || parseInt(payYear) < 5 || parseInt(payYear) > 15) {
      errors.year = "سال انقضاء نامعتبر است.";
    }

    if (payCaptcha.trim() !== payCaptchaValue) {
      errors.captcha = "کد امنیتی تصویر نادرست است.";
      generateNewCaptcha();
    }

    if (!payPin.trim()) {
      errors.pin = "کد رمز دوم (پویا) الزامی است.";
    } else if (payOtpSentCode && payPin.trim() !== payOtpSentCode) {
      errors.pin = "رمز پویای وارد شده اشتباه است.";
    }

    setPayErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsPayProcessing(true);
      playInteractionChime("success");
      setTimeout(() => {
        setIsPayProcessing(false);
        if (activeBankFlow === "wallet") {
          const rechargeAmt = walletRechargeAmount || 0;
          handleRechargeWallet(rechargeAmt);
          setWalletRechargeAmount(null);
          setActiveBankFlow(null);
          setCheckoutStep("idle");
        } else {
          registerNewOrder("online");
        }
        // Auto redirect to orders page after payment
        setTimeout(() => {
          if (activeBankFlow !== "wallet" && lastPlacedOrder) {
            setActiveTab("orders");
            setTrackingSearchCode(lastPlacedOrder.id);
            setTrackedOrder(lastPlacedOrder);
          }
        }, 2000);
      }, 1500);
    } else {
      playInteractionChime("button");
    }
  };

  // Interactive payment session countdown
  useEffect(() => {
    let interval: any;
    if (checkoutStep === "bank") {
      interval = setInterval(() => {
        setBankSessionTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCheckoutStep("idle");
            playInteractionChime("button");
            showToast("زمان نشست امن پرداخت به پایان رسید. لطفاً مجدداً تلاش نمایید.", "error");
            return 600;
          }
          return prev - 1;
        });

        setPayOtpCountdown(prev => {
          if (prev > 0) {
            return prev - 1;
          }
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [checkoutStep]);

  // Order Search Tracker function
  const handleSearchTrackingCode = () => {
    playInteractionChime("button");
    const found = orders.find(o => 
      o.id.toUpperCase() === trackingSearchCode.trim().toUpperCase() || 
      o.trackingNumber === trackingSearchCode.trim()
    );
    if (found) {
      setTrackedOrder(found);
    } else {
      setTrackedOrder(null);
      showToast("سفارشی با این کد رهگیری یا شناسه سفارش یافت نشد.", "error");
    }
  };

  // Helper icon renderer for digital catalog
  const renderProductIcon = (iconName: string, sizeClass = "w-10 h-10") => {
    switch(iconName) {
      case "headphones": return <span className={`text-slate-200 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg></span>;
      case "watch": return <span className={`text-amber-300 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="7"/><path d="M12 9v3l1.5 1.5"/><path d="M16.51 5.49 18 2h-4v2c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V2H4l1.49 3.49"/><path d="m18 22-1.49-3.49c.51-.51.81-1.21.81-1.99V14c0-1.1-.9-2-2-2H8v2c0 1.1-.9 2-2 2v2.51l1.49 3.49"/></svg></span>;
      case "coffee": return <span className={`text-amber-200 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 2h-1a1 1 0 0 0-1 1v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V3a1 1 0 0 0-1-1H2"/><path d="M15 6h4a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-4"/><path d="M14 18h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2"/></svg></span>;
      case "speaker": return <span className={`text-amber-200 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="12" height="20" x="6" y="2" rx="2" ry="2"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="14" r="4"/></svg></span>;
      case "cup": return <span className={`text-teal-300 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="14" y1="2" y2="2"/></svg></span>;
      case "backpack": return <span className={`text-emerald-300 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 20V10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9 6V4a3 3 0 0 1 6 0v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 10h8"/></svg></span>;
      case "bulb": return <span className={`text-pink-300 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .5 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg></span>;
      case "book": return <span className={`text-amber-400 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/><path d="M6 14h10"/></svg></span>;
      case "smartphone": return <span className={`text-amber-300 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg></span>;
      case "laptop": return <span className={`text-amber-300 ${sizeClass}`}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="18" height="12" x="3" y="3" rx="2"/><path d="M2 21h20"/><path d="M6 17v-2h12v2"/></svg></span>;
      default: return <Package className={`text-slate-200 ${sizeClass}`} />;
    }
  };

  // Helper avatar renderer with elegant Persian initials or beautiful default icon
  const renderUserAvatar = (user: ZarinUser, sizeClass = "w-20 h-20 rounded-2xl text-xl") => {
    return <SafeUserAvatar user={user} sizeClass={sizeClass} />;
  };

  // Helper function to render store products grid with customized column classes
  const renderStoreProductGrid = (colsClass = "grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6") => {
    if (filteredProducts.length === 0) {
      return (
        <div className={`p-16 rounded-3xl border text-center space-y-4 transition-all duration-300 hover:border-amber-500/20 ${
          isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200"
        }`}>
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <HeartCrack className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">هیچ محصولی با معیارهای انتخاب مطابقت ندارد</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            لطفا فیلترها را پاک کنید، سقف قیمت خود را افزایش دهید یا عبارت جستجو دیگری را امتحان فرمایید.
          </p>
          <button 
            type="button"
            onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setPriceRange(15000000); }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg hover:shadow-amber-500/20"
          >
            حذف تمام فیلترها
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Unified elegant filter card — search, categories, price, sort, count, chips */}
        <div className={`mb-5 rounded-2xl border ${
          isDarkMode ? "bg-slate-900/70 border-white/5" : "bg-white/90 border-slate-200 shadow-sm"
        }`}>
          {/* Row 1: Search */}
          <div className={`px-4 py-2.5 flex items-center gap-2.5 border-b ${
            isDarkMode ? "border-white/5" : "border-slate-100"
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              aria-label="جستجو در کالاها"
              placeholder="جستجو در کالاهای زرین‌کالا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.slice(0, 200))}
              className={`flex-1 text-xs outline-none bg-transparent font-bold placeholder:font-normal ${
                isDarkMode ? "text-slate-100 placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"
              }`}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-rose-500 text-xs cursor-pointer shrink-0">✕</button>
            )}
            <span className={`text-[10px] font-black font-mono mr-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              <span className="text-amber-500">{toPersianNum(filteredProducts.length)}</span> کالا
            </span>
          </div>

          {/* Row 2: Category pills */}
          <div className={`px-4 sm:px-5 py-2 sm:py-3 border-b ${
            isDarkMode ? "border-white/5" : "border-slate-100"
          }`}>
            <div ref={catScrollRef} className="flex gap-1.5 sm:gap-2.5 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
              {[{ id: "all", name: "همه" }, ...categories].map(cat => {
                const { emoji } = getCategoryEmojiAndGradient(cat.id, cat.name);
                const isCatSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isCatSelected
                        ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm"
                        : isDarkMode ? "bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2b: Brand pills */}
          {selectedCategory !== "all" && (() => {
            const availableBrands = subcategories.filter(s => s.parentId === selectedCategory);
            if (availableBrands.length === 0) return null;
            return (
              <div className={`px-4 sm:px-5 py-2 border-b ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                  <button type="button" onClick={() => setSelectedBrand("")}
                    className={`shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer ${
                      selectedBrand === ""
                        ? "bg-sky-500 border-sky-500 text-white"
                        : isDarkMode ? "bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-700/40" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    همه برندها
                  </button>
                  {availableBrands.map(b => (
                    <button key={b.id} type="button" onClick={() => setSelectedBrand(b.id)}
                      className={`shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        selectedBrand === b.id
                          ? "bg-sky-500 border-sky-500 text-white"
                          : isDarkMode ? "bg-slate-800/40 border-white/5 text-slate-400 hover:bg-slate-700/40 hover:text-slate-200" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Row 3: Price + Sort */}
          <div className={`px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b ${
            isDarkMode ? "border-white/5" : "border-slate-100"
          }`}>
            <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-[160px]">
              <span className="text-[9.5px] text-slate-400 font-bold shrink-0">💰 بودجه:</span>
              <div className="flex-1 min-w-0">
                <input
                  type="range"
                  min={minPriceInCategory === maxPriceInCategory ? 0 : minPriceInCategory}
                  max={maxPriceInCategory}
                  value={priceRange > maxPriceInCategory ? maxPriceInCategory : priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-5 range-track"
                />
              </div>
              <span className="hidden sm:inline text-lg font-black text-amber-500 font-mono shrink-0 whitespace-nowrap leading-none">
                {priceRange >= maxPriceInCategory ? "بدون محدودیت" : `${toPersianNum(priceRange)}`}
              </span>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto sm:gap-1.5 self-start sm:self-auto relative">
              <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] text-slate-400 font-bold shrink-0">⚡</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={`text-[10px] font-bold py-1.5 px-3 rounded-xl border outline-none cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${
                    sortBy !== "rating"
                      ? "bg-amber-500 border-amber-500 text-slate-950"
                      : isDarkMode
                        ? "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                  <span>{{
                    rating: "پیش‌فرض",
                    "price-asc": "ارزان‌ترین",
                    "price-desc": "گران‌ترین",
                    discount: "بیشترین تخفیف",
                  }[sortBy]}</span>
                </button>
                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                    <div className={`absolute top-full left-0 mt-1 z-50 min-w-[130px] rounded-xl border shadow-lg overflow-hidden ${
                      isDarkMode ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
                    }`}>
                      {([
                        { value: "rating", label: "پیش‌فرض" },
                        { value: "price-asc", label: "ارزان‌ترین" },
                        { value: "price-desc", label: "گران‌ترین" },
                        { value: "discount", label: "بیشترین تخفیف" },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setSortBy(opt.value as any); setIsSortOpen(false); }}
                          className={`w-full text-right px-3 py-2 text-[10px] font-bold transition-colors cursor-pointer ${
                            sortBy === opt.value
                              ? "bg-amber-500/15 text-amber-500"
                              : isDarkMode
                                ? "text-slate-300 hover:bg-slate-700"
                                : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              </div>
              <span className="sm:hidden text-lg font-black text-amber-500 font-mono whitespace-nowrap leading-none">
                {priceRange >= maxPriceInCategory ? "بدون محدودیت" : `${toPersianNum(priceRange)}`}
              </span>
            </div>
          </div>

          {/* Row 4: Active chips + clear all (only if filters active) */}
          {(selectedCategory !== "all" || searchQuery || priceRange < maxPriceInCategory || sortBy !== "rating") && (
            <div className={`px-4 py-2 flex items-center gap-2 flex-wrap ${
              isDarkMode ? "bg-slate-950/20" : "bg-slate-50/50"
            }`}>
              {selectedCategory !== "all" && (
                <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold">
                  {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
                  <button type="button" onClick={() => setSelectedCategory("all")} className="cursor-pointer leading-none">✕</button>
                </span>
              )}
              {searchQuery && (
                <span className="text-[9px] bg-sky-500/10 text-sky-500 border border-sky-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold">
                  "{sanitize(searchQuery)}"
                  <button type="button" onClick={() => setSearchQuery("")} className="cursor-pointer leading-none">✕</button>
                </span>
              )}
              {priceRange < maxPriceInCategory && (
                <span className="text-[9px] bg-violet-500/10 text-violet-500 border border-violet-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold">
                  تا {toPersianNum(priceRange)} ت
                  <button type="button" onClick={() => setPriceRange(maxPriceInCategory)} className="cursor-pointer leading-none">✕</button>
                </span>
              )}
              {sortBy !== "rating" && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold">
                  {
                    sortBy === "price-asc" ? "ارزان‌ترین" :
                    sortBy === "price-desc" ? "گران‌ترین" :
                    sortBy === "discount" ? "بیشترین تخفیف" : ""
                  }
                  <button type="button" onClick={() => setSortBy("rating")} className="cursor-pointer leading-none">✕</button>
                </span>
              )}
              <button
                type="button"
                onClick={() => { setSelectedCategory("all"); setSearchQuery(""); setPriceRange(maxPriceInCategory); setSortBy("rating"); }}
                className="text-[9px] text-rose-400 hover:text-rose-500 font-bold mr-auto cursor-pointer transition-colors"
              >
                پاک کردن همه
              </button>
            </div>
          )}
        </div>
        <div className={`grid ${colsClass}`}>
        {filteredProducts.map(p => {
          const hasDiscount = p.discountPrice !== undefined && p.discountPrice > 0;
          const finalPrice = p.discountPrice || p.price;
          const isWishlisted = wishlist.includes(p.id);
          const pct = hasDiscount ? Math.round(((p.price - p.discountPrice!) / p.price) * 100) : 0;

          return (
            <div
              key={p.id}
              itemScope itemType="https://schema.org/Product"
              onClick={() => { setSelectedProduct(p); playInteractionChime("button"); }}
              className={`group relative rounded-xl border overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1.5 ${
                isDarkMode
                  ? "bg-slate-900/60 border-white/[0.06] hover:border-amber-500/25 shadow-sm shadow-black/20 hover:shadow-lg hover:shadow-amber-500/5"
                  : "bg-white border-slate-200/80 hover:border-amber-400/50 shadow-sm hover:shadow-lg hover:shadow-amber-500/10"
              }`}
            >
              {/* ── Image area ── */}
              <div className={`relative overflow-hidden flex items-center justify-center bg-gradient-to-br ${p.imageColor} ${p.imagePattern} ${
                colsClass.includes("sm:grid-cols-2") ? "h-36" : "h-44 sm:h-48"
              }`}>

                {/* Multi-image viewer */}
                {p.images && p.images.length > 0 ? (
                  <div className="absolute inset-0 w-full h-full" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 z-11" />
                    <div className="relative w-full h-full">
                      {(p.images || []).map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={safeUrl(img)}
                          alt={sanitize(p.title)}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(p.title, 400, 300, p.iconType); } else { e.currentTarget.style.display = "none"; } }}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-10 ${imgIdx === editingImageIndex ? "opacity-100" : "opacity-0"}`}
                        />
                      ))}
                      {p.images && p.images.length > 1 && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setEditingImageIndex(prev => prev > 0 ? prev - 1 : (p.images?.length || 1) - 1); }}
                            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-5 h-5 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer transition-all">
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingImageIndex(prev => prev < (p.images?.length || 1) - 1 ? prev + 1 : 0); }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-5 h-5 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer transition-all">
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  ) : p.imageUrl ? (
                  <div className="absolute inset-0 w-full h-full transition-all duration-500 group-hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 z-11" />
                    <img src={safeUrl(p.imageUrl)} alt={sanitize(p.title)} loading="lazy" referrerPolicy="no-referrer"
                      onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(p.title, 400, 300, p.iconType); } else { e.currentTarget.style.display = "none"; } }}
                      className="absolute inset-0 w-full h-full object-cover z-10" />
                  </div>
                ) : null}
              </div>

              {/* Image dots */}
                {p.images && p.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
                    {p.images.map((_, dotIdx) => (
                      <span key={dotIdx} className={`w-1.5 h-1.5 rounded-full transition-all ${dotIdx === editingImageIndex ? "bg-amber-400 w-3" : "bg-white/30"}`} />
                    ))}
                  </div>
                )}

                {/* Tags */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-10">
                  {p.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 bg-slate-950/70 backdrop-blur-md rounded-md text-[8px] font-semibold text-amber-300 border border-amber-500/15 tracking-wide">
                      {sanitize(tag)}
                    </span>
                  ))}
                </div>

                {/* Wishlist */}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id, e); }}
                  className={`absolute top-2.5 left-2.5 p-1.5 rounded-xl backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer z-10 ${
                    isWishlisted
                      ? "bg-rose-500 text-white scale-110 shadow-rose-500/30"
                      : "bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}>
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                </button>

                {/* Cart qty badge */}
                {(() => {
                  const q = cart.find(it => it.product.id === p.id)?.quantity || 0;
                  return q > 0 ? (
                    <div className="absolute top-12 left-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded-lg shadow-lg flex items-center gap-1 z-10 font-mono">
                      <ShoppingCart className="w-2.5 h-2.5 fill-slate-950" />
                      <span>{toPersianNum(q)}</span>
                    </div>
                  ) : null;
                })()}

                {/* Hover overlay (decorative only) */}
                <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-500/20 scale-90 group-hover:scale-100 transition-transform duration-300 pointer-events-none">
                    <Eye className="w-3.5 h-3.5" />
                    مشاهده
                  </span>
                </div>

              {/* ── Info area ── */}
              <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 flex-1">

                {/* Category + discount */}
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[8px] sm:text-[9px] font-semibold tracking-wide border ${
                    isDarkMode
                      ? "bg-amber-500/8 text-amber-400/80 border-amber-500/15"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {(() => { const f = categories.find(c => c.id === p.category); return f ? f.name : "سایر"; })()}
                    {p.brand && (() => { const b = subcategories.find(s => s.id === p.brand); return b ? <><span className="text-slate-500 mx-0.5">•</span><span className="text-[9px]">{b.name}</span></> : null; })()}
                  </span>
                  {hasDiscount && (
                    <span className="bg-rose-500/10 text-rose-500 text-[7px] sm:text-[8px] font-semibold px-1.5 py-[2px] rounded-md border border-rose-500/15">
                      {toPersianNum(pct)}٪
                    </span>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-0.5">
                  <h3 className={`text-[12px] sm:text-sm font-bold leading-snug transition-colors line-clamp-2 ${
                    isDarkMode ? "text-slate-100 group-hover:text-amber-400" : "text-slate-800 group-hover:text-amber-600"
                  }`}>
                    <span itemProp="name">{sanitize(p.title)}</span>
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wide uppercase truncate">
                    <span itemProp="alternateName">{sanitize(p.englishTitle)}</span>
                  </p>
                </div>

                {/* Rating + stock */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[10px] sm:text-[11px] font-bold">{toPersianNum(p.rating)}</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400">({toPersianNum(p.reviews.length)})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className={`text-[9px] sm:text-[10px] font-bold ${p.stock > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {p.stock > 0 ? `${toPersianNum(p.stock)}` : "ناموجود"}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className={`h-px ${isDarkMode ? "bg-white/5" : "bg-slate-100"}`} />

                {/* Price + cart */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    {hasDiscount && (
                      <span className="text-[9px] sm:text-[10px] text-slate-400 line-through font-mono">{toPersianNum(p.price)}</span>
                    )}
                    <span className="text-[13px] sm:text-sm font-bold text-amber-500 tracking-tight font-mono leading-tight" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                      <meta itemProp="priceCurrency" content="IRR" />
                      <span itemProp="price" className="hidden">{finalPrice}</span>
                      {toPersianNum(finalPrice)}
                      <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 mr-0.5">ت</span>
                      <meta itemProp="availability" content={p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
                    </span>
                  </div>

                  {/* Cart incrementer */}
                  {(() => {
                    const itemInCart = cart.find(it => it.product.id === p.id);
                    if (itemInCart && itemInCart.quantity > 0) {
                      return (
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={(e) => { e.stopPropagation(); updateCartQuantity(p.id, -1); playInteractionChime("button"); }}
                            className="w-6 h-6 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md cursor-pointer transition-all active:scale-90">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-black min-w-[18px] text-center font-mono text-amber-500">{toPersianNum(itemInCart.quantity)}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); addToCart(p, e); }}
                            className="w-6 h-6 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md cursor-pointer transition-all active:scale-90">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button type="button" onClick={(e) => { e.stopPropagation(); addToCart(p, e); }}
                        className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-all shadow-sm hover:shadow-md hover:shadow-amber-500/20 active:scale-90 hover:scale-105 cursor-pointer shrink-0">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>
    );
  };

  // --- CORE CUSTOM AUTH & WALLET ACTIONS ---
  
  // 1. LOGIN HANDLER
  const handleUserLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    const cleanUsername = loginUsername.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError("لطفا نام کاربری و رمز عبور را وارد نمایید.");
      return;
    }

    // Strict user/admin intent rule check:
    if (cleanUsername === "admin" && cleanPassword === "admin") {
      const adminAcc = users.find(u => u.role === "admin") || {
        id: "admin",
        username: "admin",
        fullName: "مدیر ارشد زرین‌کالا",
        email: "admin@zarin.com",
        phone: "09120000000",
        password: "admin",
        role: "admin",
        walletBalance: 0,
        status: "active",
        createdAt: "2026-05-27"
      };

      if (!users.some(u => u.role === "admin")) {
        setUsers(prev => [adminAcc as ZarinUser, ...prev]);
      }

      setCurrentUser(adminAcc as ZarinUser);
      setIsAdminLoggedIn(true);
      sessionStorage.setItem("zarin_admin_logged", "true");
      setActiveTab("admin");
      playInteractionChime("success");
      return;
    }

    const found = users.find(u => 
      (u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanUsername.toLowerCase())
    );

    if (!found) {
      setLoginError("حساب کاربری یافت نشد. می‌توانید ثبت‌نام کنید.");
      return;
    }

    if (found.password !== cleanPassword) {
      setLoginError("کلمه عبور وارد شده نادرست است.");
      return;
    }

    if (found.status === "suspended") {
      setLoginError("حساب کاربری شما تعلیق شده است. جهت فعال‌سازی مجدد با پشتیبانی تماس بگیرید.");
      return;
    }

    setCurrentUser(found);
    if (found.role === "admin") {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem("zarin_admin_logged", "true");
      setActiveTab("admin");
    } else {
      setActiveTab("shop");
    }
    playInteractionChime("success");
  };

  // 2. SIGNUP HANDLER
  const handleUserSignup = (e: FormEvent) => {
    e.preventDefault();
    setSignupError("");

    const { fullName, username, email, phone, password } = signupForm;

    if (!fullName.trim() || !username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setSignupError("پر کردن تمامی فیلدهای فرم ثبت‌نام الزامی است.");
      return;
    }

    if (username.trim().length < 3) {
      setSignupError("نام کاربری باید حداقل ۳ کاراکتر باشد.");
      return;
    }

    if (!email.trim().includes("@") || !email.trim().includes(".")) {
      setSignupError("فرمت آدرس ایمیل وارد شده نامعتبر است.");
      return;
    }

    if (!/^09\d{9}$/.test(phone.trim())) {
      setSignupError("شماره همراه باید ۱۱ رقم و با ۰۹ شروع شود (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }

    if (password.trim().length < 4) {
      setSignupError("کلمه عبور باید دست‌کم ۴ کاراکتر باشد.");
      return;
    }

    const isDupEmail = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    const isDupUser = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
    
    if (isDupEmail) {
      setSignupError("این آدرس ایمیل قبلا در سیستم ثبت شده است.");
      return;
    }

    if (isDupUser) {
      setSignupError("این نام کاربری قبلا توسط کاربر دیگری انتخاب شده است.");
      return;
    }

    if (fullName.trim().length > 100 || username.trim().length > 50) {
      setSignupError("نام یا نام کاربری بسیار طولانی است.");
      return;
    }
    const welcomeAmount = 15000000;
    const newUser: ZarinUser = {
      id: sanitize(email.trim().toLowerCase()),
      fullName: sanitize(fullName.trim()).slice(0, 100),
      username: sanitize(username.trim().toLowerCase()).slice(0, 50),
      email: sanitize(email.trim().toLowerCase()),
      phone: sanitize(phone.trim()).slice(0, 20),
      password: password.trim(),
      role: "customer",
      walletBalance: welcomeAmount,
      avatarUrl: "",
      createdAt: new Date().toISOString().split("T")[0],
      status: "active"
    };

    const newTx: WalletTransaction = {
      id: "tx_" + Date.now(),
      userId: newUser.id,
      userName: newUser.fullName,
      amount: welcomeAmount,
      type: "deposit",
      description: "هدیه خوش‌آمدگویی و افتتاح حساب طلایی زرین‌کالا",
      date: new Date().toISOString()
    };

    setUsers(prev => [newUser, ...prev]);
    setWalletTransactions(prev => [newTx, ...prev]);
    setCurrentUser(newUser);
    setActiveTab("shop");
    playInteractionChime("item-add");
      showToast("ثبت‌نام با موفقیت انجام شد! هدیه ۱۵,۰۰۰,۰۰۰ ریالی به کیف پول واریز گردید.", "success");
  };

  // 3. GOOGLE OAUTH — real credential handler
  const handleGoogleCredential = (credential: string) => {
    if (!credential) return;
    setIsGoogleLoading(true);
    try {
      const decoded: any = jwtDecode(credential);
      const email: string = decoded.email || "";
      const fullName: string = decoded.name || decoded.email?.split("@")[0] || "";
      const googleAvatar: string = decoded.picture || "";
      const emailClean = email.trim().toLowerCase();
      const existing = users.find(u => u.email.toLowerCase() === emailClean);
      if (existing) {
        if (existing.status === "suspended") {
          setIsGoogleLoading(false);
          showToast("این حساب کاربری تعلیق شده است. جهت فعال‌سازی با پشتیبانی تماس بگیرید.", "error");
          return;
        }
        setCurrentUser(existing);
        setActiveTab("shop");
        playInteractionChime("success");
        showToast(`خوش آمدید، ${existing.fullName}!`, "success");
      } else {
        const giftBalance = 25000000;
        const newUser: ZarinUser = {
          id: emailClean,
          fullName: fullName,
          username: emailClean.split("@")[0],
          email: emailClean,
          phone: "",
          role: "customer",
          walletBalance: giftBalance,
          createdAt: new Date().toISOString().split("T")[0],
          status: "active",
          avatarUrl: googleAvatar,
        };
        const newTx: WalletTransaction = {
          id: "tx_" + Date.now(),
          userId: newUser.id,
          userName: newUser.fullName,
          amount: giftBalance,
          type: "deposit",
          description: "هدیه عضویت طلایی — ورود با گوگل",
          date: new Date().toISOString()
        };
        setUsers(prev => [newUser, ...prev]);
        setWalletTransactions(prev => [newTx, ...prev]);
        setCurrentUser(newUser);
        setActiveTab("shop");
        playInteractionChime("success");
        showToast(`خوش آمدید، ${fullName}! حساب کاربری با گوگل ساخته شد و ۲۵,۰۰۰,۰۰۰ ریال هدیه به کیف پول افزوده شد.`, "success");
      }
    } catch {
      showToast("خطا در پردازش ورود گوگل. لطفاً دوباره تلاش کنید.", "error");
    }
    setIsGoogleLoading(false);
  };

  // 4. REQUEST OTP VERIFICATION FOR PASSWORD CHANGE
  const handleRequestForgotOtp = (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    const phoneClean = forgotPhone.trim();
    if (!phoneClean || !/^09\d{9}$/.test(phoneClean)) {
      setForgotError("لطفا شماره همراه معتبر ۱۱ رقمی وارد نمایید (مثال: 09121234567).");
      return;
    }

    const matchedUser = users.find(u => u.phone.trim() === phoneClean);
    if (!matchedUser) {
      setForgotError("شماره همراه وارد شده در سامانه وجود ندارد.");
      return;
    }

    // Generate random OTP
    const code = String(Math.floor(10000 + Math.random() * 90000));
    setForgotSentCode(code);
    setForgotStep(2);
    setForgotMessage(`کد تایید ۵ رقمی بازیابی شبیه‌سازی شد.`);
    playInteractionChime("success");

    // Show OTP in console for simulation
    console.log(`[OTP Forgot Password] کد تایید بازیابی رمز عبور شما: ${code}`);
  };

  // 5. VERIFY OTP AND PERFORM PERSISTENT PASSWORD CHANGE
  const handleVerifyOtpAndChangePassword = (e: FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");

    const codeClean = forgotCodeInput.trim();
    const passClean = forgotNewPassword.trim();
    const confirmClean = forgotConfirmPassword.trim();

    if (!codeClean) {
      setForgotError("لطفا کد تایید ۵ رقمی ارسال شده را وارد نمایید.");
      return;
    }

    if (codeClean !== forgotSentCode) {
      setForgotError("کد تایید OTP وارد شده نادرست یا مغایر است.");
      return;
    }

    if (!passClean || passClean.length < 4) {
      setForgotError("کلمه عبور جدید باید حداقل حاوی ۴ کاراکتر باشد.");
      return;
    }

    if (passClean !== confirmClean) {
      setForgotError("تکرار کلمه عبور جدید با کلمه عبور وارد شده مطابقت ندارد.");
      return;
    }

    const phoneClean = forgotPhone.trim();
    const matchedUser = users.find(u => u.phone.trim() === phoneClean);
    if (!matchedUser) {
      setForgotError("حساب کاربری یافت نشد.");
      return;
    }

    // Map to updated users state with actual password change
    const updatedUsers = users.map(u => {
      if (u.phone.trim() === phoneClean) {
        return {
          ...u,
          password: passClean
        };
      }
      return u;
    });

    setUsers(updatedUsers);

    // Deep merge for currentUser to login securely with updated state
    const updatedUser = {
      ...matchedUser,
      password: passClean
    };

    setCurrentUser(updatedUser);
    setActiveTab("shop");
    playInteractionChime("success");
      showToast(`رمز عبور با موفقیت تغییر یافت. خوش آمدید، ${updatedUser.fullName}!`, "success");

    // Reset Workflow details
    setForgotPhone("");
    setForgotSentCode("");
    setForgotCodeInput("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotStep(1);
    setLoginMode("login");
  };

  // 6. LOGOUT HANDLER
  const handleUserLogout = () => {
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem("zarin_admin_logged");
    localStorage.removeItem("zarin_current_user");
    setActiveTab("shop");
    setLoginUsername("");
    setLoginPassword("");
    setLoginMode("login");
    playInteractionChime("button");
  };

  // 7. USER PROFILE UPDATE HANDLER
  const handleUpdateProfile = (e: FormEvent, updatedData: Partial<ZarinUser>) => {
    e.preventDefault();
    setProfileSuccessMsg("");

    if (!currentUser) return;

    if (updatedData.email && updatedData.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const isDup = users.some(u => u.email.toLowerCase() === updatedData.email!.toLowerCase());
      if (isDup) {
        showToast("این ایمیل قبلاً ثبت شده است.", "error");
        return;
      }
    }

    const modified = {
      ...currentUser,
      ...updatedData
    };

    // Sync reviews when name or avatar changes
    const nameChanged = updatedData.fullName && updatedData.fullName !== currentUser.fullName;
    const avatarChanged = "avatarUrl" in updatedData && updatedData.avatarUrl !== currentUser.avatarUrl;
    if (nameChanged || avatarChanged) {
      setProducts(prev => prev.map(p => ({
        ...p,
        reviews: p.reviews.map(r => {
          if (r.userId === currentUser.id || (!r.userId && r.userName === currentUser.fullName)) {
            return {
              ...r,
              ...(nameChanged ? { userName: modified.fullName } : {}),
              ...(avatarChanged ? { avatarUrl: modified.avatarUrl } : {})
            };
          }
          return r;
        })
      })));
      setSelectedProduct(prev => prev ? {
        ...prev,
        reviews: prev.reviews.map(r => {
          if (r.userId === currentUser.id || (!r.userId && r.userName === currentUser.fullName)) {
            return {
              ...r,
              ...(nameChanged ? { userName: modified.fullName } : {}),
              ...(avatarChanged ? { avatarUrl: modified.avatarUrl } : {})
            };
          }
          return r;
        })
      } : null);
    }

    setUsers(prev => prev.map(u => u.id === currentUser.id ? modified : u));
    setCurrentUser(modified);
    setProfileSuccessMsg("پروفایل شما با موفقیت بروزرسانی شد.");
    playInteractionChime("success");
    setTimeout(() => setProfileSuccessMsg(""), 4000);
  };

  // 8. WALLET RECHARGE HANDLER
  const handleStartWalletRecharge = (amount: number) => {
    if (!currentUser) {
      showToast("برای افزایش موجودی کیف پول ابتدا وارد حساب خود شوید.", "error");
      return;
    }
    if (amount <= 0 || isNaN(amount)) {
      showToast("مبلغ وارد شده برای شارژ کیف پول نامعتبر است.", "error");
      return;
    }

    setWalletRechargeAmount(amount);
    setActiveBankFlow("wallet");
    setCheckoutStep("bank");
    setBankSessionTimer(600); // 10 minutes secure connection

    // Clear previous card details to enforce fresh entries
    setPayCardNumber("");
    setPayCvv2("");
    setPayMonth("");
    setPayYear("");
    setPayPin("");
    setPayErrors({});
    setIsPayProcessing(false);
    setShowOtpNotification(false);
    setPayOtpSentCode("");
    setPayOtpCountdown(0);

    generateNewCaptcha();
    playInteractionChime("button");
  };

  const handleRechargeWallet = (amount: number) => {
    if (!currentUser) return;
    if (amount <= 0) return;

    const modifiedUser = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + amount
    };

    const newTx: WalletTransaction = {
      id: "tx_recharge_" + Date.now(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      amount: amount,
      type: "deposit",
      description: "شارژ آنلاین کیف پول از درگاه شتاب بانکی",
      date: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => u.id === currentUser.id ? modifiedUser : u));
    setCurrentUser(modifiedUser);
    setWalletTransactions(prev => [newTx, ...prev]);
    setIsChargingOpen(false);
    setChargeAmountInput("");
    playInteractionChime("success");
      showToast(`کیف پول به مبلغ ${toPersianNum(amount.toLocaleString())} ریال شارژ شد.`, "success");
  };

  // 9. DEDUCT / ADJUST BALANCE
  const handleAdminAdjustBalance = (userId: string, targetAmount: number, note: string) => {
    const userToAdjust = users.find(u => u.id === userId);
    if (!userToAdjust) return;

    const nextBalance = Math.max(0, userToAdjust.walletBalance + targetAmount);
    
    const modifiedUser = {
      ...userToAdjust,
      walletBalance: nextBalance
    };

    const newTx: WalletTransaction = {
      id: "tx_adjust_" + Date.now(),
      userId: userId,
      userName: userToAdjust.fullName,
      amount: targetAmount,
      type: "admin_adjustment",
      description: note || "تعدیل دستی مدیریت",
      date: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => u.id === userId ? modifiedUser : u));
    setWalletTransactions(prev => [newTx, ...prev]);
    playInteractionChime("success");
  };

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-500 fa-dir overflow-y-auto select-none ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-zinc-50 text-slate-900"
      }`} dir="rtl">
        {/* Particle/Grid ambient background accent */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-yellow-500/10 blur-[120px]" />
        </div>

        <div className="w-full max-w-md relative z-10 py-6">
          <div className="text-center mb-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex p-3.5 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-3xl text-slate-950 shadow-lg shadow-amber-500/20 mb-3"
            >
              <ShoppingBag className="w-8 h-8" />
            </motion.div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent tracking-tight">
              {loginMode === "signup" ? "صفحه ثبت نام زرین‌کالا" : "صفحه ورود زرین‌کالا"}
            </h1>
          </div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md transition-all duration-300 ${
              isDarkMode ? "bg-slate-900/80 border-white/5 shadow-amber-500/5" : "bg-white border-slate-200/80 shadow-slate-200"
            }`}
          >
            {/* TAB-LIKE HEADER (Not applicable when in Forgot Password) */}
            {loginMode !== "forgot" && (
              <div className={`flex p-1 rounded-2xl mb-6 ${isDarkMode ? "bg-black/30" : "bg-slate-100"}`}>
                <button
                  type="button"
                  onClick={() => { setLoginMode("login"); setLoginError(""); setSignupError(""); playInteractionChime("button"); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    loginMode === "login" 
                      ? "bg-amber-500 text-slate-950 font-black shadow-md" 
                      : `text-slate-400 hover:${isDarkMode ? "text-white" : "text-slate-900"}`
                  }`}
                >
                  ورود به حساب
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode("signup"); setLoginError(""); setSignupError(""); playInteractionChime("button"); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    loginMode === "signup" 
                      ? "bg-amber-500 text-slate-950 font-black shadow-md" 
                      : `text-slate-400 hover:${isDarkMode ? "text-white" : "text-slate-900"}`
                  }`}
                >
                  ثبت‌نام
                </button>
              </div>
            )}

            {/* A: LOGIN MODE */}
            {loginMode === "login" && (
              <form onSubmit={handleUserLogin} className="space-y-3">
                <div className="space-y-1">
                  <div className="relative">
                      <input
                          type="text"
                          className={`w-full pr-10 pl-3 py-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDarkMode ? "bg-slate-950 border border-white/5 text-slate-100" : "bg-slate-50 border border-slate-200 text-slate-900"
                          }`}
                          placeholder="نام کاربری یا اکانت ایمیل"
                          value={loginUsername}
                          onChange={(e) => { setLoginUsername(e.target.value); setLoginError(""); }}
                        />
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="password"
                      className={`w-full pr-10 pl-3 py-3 text-xs rounded-2xl outline-none focus:ring-1 focus:ring-amber-500 tracking-wide text-right ${
                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                      }`}
                      placeholder="رمز عبور"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex ps-3 p-0.5">
                    <button
                      type="button"
                      onClick={() => { setLoginMode("forgot"); setForgotError(""); setForgotMessage(""); playInteractionChime("button"); }}
                      className="text-[10px] text-amber-500 hover:text-amber-400 font-bold transition-all cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/10 hover:border-amber-500/20"
                    >
                      <Key className="w-3 h-3 inline -mt-0.5 me-1" />
                      فراموشی رمز
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-2xl text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 mt-2 bg-gradient-to-tr from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-amber-500/10"
                >
                  ورود امن به سایت
                </button>
              </form>
            )}

            {/* C: FORGOT PASSWORD (STEPPED HIGH-FIDELITY OTP FLOW) */}
            {loginMode === "forgot" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-slate-500/10 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <h3 className="text-xs font-black text-amber-500">بازیابی امن کلمه عبور با OTP</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLoginMode("login"); setForgotStep(1); playInteractionChime("button"); }}
                    className="text-[10px] text-slate-400 hover:text-slate-100 cursor-pointer border border-white/5 bg-white/5 px-2.5 py-1 rounded-lg transition-all"
                  >
                    بازگشت به ورود
                  </button>
                </div>

                {forgotStep === 1 ? (
                  <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                    <p className={`text-[10.5px] leading-relaxed font-light ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      شماره تلفن همراه خود را وارد کنید تا کد OTP یکبار مصرف ۵ رقمی شبیه‌سازی شده برایتان ارسال گردد.
                    </p>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">شماره تلفن همراه ثبت شده:</label>
                      <div className="relative">
                        <input
                          type="text"
                          className={`w-full pr-10 pl-3 py-2.5 text-xs rounded-2xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-left ${
                            isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                          placeholder="شماره تلفن همراه ثبت شده"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
                        />
                        <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-tr from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>ارسال پیامکی کد اعتبارسنجی OTP</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpAndChangePassword} className="space-y-4">

                    {/* OTP input */}
                    <div className="space-y-1">
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={5}
                          className={`w-full px-3 py-2.5 text-center text-sm font-mono font-extrabold tracking-[0.5em] rounded-2xl outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDarkMode ? "bg-slate-950 text-amber-400 border border-white/5" : "bg-slate-50 border-slate-200 text-zinc-850"
                          }`}
                          placeholder="کد ۵ رقمی OTP"
                          value={forgotCodeInput}
                          onChange={(e) => setForgotCodeInput(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">کلمه عبور جدید:</label>
                      <input
                        type="password"
                        className={`w-full px-3 py-2.5 text-xs rounded-2xl outline-none focus:ring-1 focus:ring-amber-500 tracking-wide ${
                          isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                        placeholder="کلمه عبور جدید"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                      />
                    </div>

                    {/* Repeat Password */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">تکرار کلمه عبور جدید:</label>
                      <input
                        type="password"
                        className={`w-full px-3 py-2.5 text-xs rounded-2xl outline-none focus:ring-1 focus:ring-amber-500 tracking-wide ${
                          isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                        }`}
                        placeholder="تکرار کلمه عبور جدید"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setForgotStep(1); playInteractionChime("button"); }}
                        className="flex-1 py-2.5 rounded-xl border border-white/5 bg-white/5 text-slate-300 text-[10px] font-bold hover:bg-white/10 transition-all cursor-pointer"
                      >
                        دریافت مجدد کد
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-[10.5px] font-black rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/5"
                      >
                        تغییر رمز و ورود
                      </button>
                    </div>
                  </form>
                )}

                {forgotError && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-2xl text-[11px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotMessage && (
                  <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-2 text-[10px] rounded-xl leading-relaxed">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{forgotMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* B: SIGNUP MODE */}
            {loginMode === "signup" && (
              <form onSubmit={handleUserSignup} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <input
                      type="text"
                      className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                      }`}
                      placeholder="نام کامل شما"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 tracking-wide ${
                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                      }`}
                      placeholder="نام کاربری"
                      value={signupForm.username}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full pr-9 pl-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 tracking-wide text-right ${
                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                      }`}
                      placeholder="تلفن همراه (جهت دریافت OTP)"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="email"
                      className={`w-full pr-10 pl-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 tracking-wide text-right ${
                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                      }`}
                      placeholder="لطفا ایمیل خود را وارد نمایید"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="password"
                      className={`w-full pr-10 pl-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 tracking-wide text-right ${
                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                      }`}
                      placeholder="انتخاب کلمه عبور"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {signupError && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-2.5 rounded-xl text-[10.5px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-gradient-to-tr from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-amber-500/10"
                >
                  ثبت‌نام و شارژ اولیه هدیه عضویت
                </button>
              </form>
            )}

            {/* SEPARATOR + GUEST + GOOGLE */}
            {loginMode !== "forgot" && (
              <>
                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-slate-500/10" />
                </div>

                {/* GUEST LOGIN — only for login mode */}
                {loginMode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    const guestUser: ZarinUser = {
                      id: "guest",
                      username: "guest",
                      fullName: "کاربر مهمان",
                      email: "guest@zarinasa.com",
                      phone: "09000000000",
                      role: "customer" as const,
                      walletBalance: 0,
                      avatarUrl: "",
                      createdAt: new Date().toISOString(),
                      status: "active" as const
                    };
                    setCurrentUser(guestUser);
                    localStorage.removeItem("zarin_current_user");
                    playInteractionChime("success");
                  }}
                  className="w-full py-2.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 hover:text-white transition-all text-xxs font-black rounded-2xl cursor-pointer flex items-center justify-center gap-1.5 border border-white/5 mb-2"
                >
                  <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>ورود به عنوان مهمان</span>
                </button>
                )}

                {/* GOOGLE LOGIN */}
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                  <div className="w-full flex justify-center">
                    <GoogleLoginBtn
                      onSuccess={(res) => { if (res.credential) handleGoogleCredential(res.credential); }}
                      onError={() => showToast("خطا در ورود با گوگل. لطفاً دوباره تلاش کنید.", "error")}
                      theme={isDarkMode ? "filled_black" : "outline"}
                      size="large"
                      shape="rectangular"
                      text="signin_with"
                      logo_alignment="center"
                    />
                  </div>
                )}
              </>
            )}

          </motion.div>
          
          <div className="text-center mt-6">
            <button
              onClick={() => { setIsDarkMode(!isDarkMode); playInteractionChime("button"); }}
              className={`p-2 rounded-full cursor-pointer hover:bg-slate-500/10 text-xs font-bold transition-all ${
                isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {isDarkMode ? "🌙 حالت تاریک فعال است (کلیک برای روشن)" : "☀️ حالت روشن فعال است (کلیک برای تاریک)"}
            </button>
          </div>



        </div>
      </div>
    );
  }

  // --- CUSTOM ADMIN DROPDOWN RENDERER ---
  const renderAdminSelect = (
    id: string,
    value: string,
    onChange: (val: string) => void,
    options: { value: string; label: string }[],
    placeholder: string,
    isDarkMode: boolean,
    btnClass = ""
  ) => {
    const isOpen = adminOpenDropdown === id;
    const selected = options.find(o => o.value === value);
    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setAdminOpenDropdown(isOpen ? null : id); }}
          className={`w-full pr-3 pl-9 py-2 text-xs rounded-xl outline-none cursor-pointer transition-all duration-200 h-9 bg-transparent border flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${btnClass} ${
            isDarkMode
              ? `bg-slate-950/80 text-slate-100 border-white/10 hover:border-amber-500/30 ${isOpen ? "border-amber-500/60 ring-1 ring-amber-500/20" : ""}`
              : `bg-white text-slate-950 border-slate-300 hover:border-amber-500/30 ${isOpen ? "border-amber-500/60 ring-1 ring-amber-500/20" : ""}`
          }`}
        >
          <span className={`truncate ml-2 ${selected ? "" : "opacity-50"}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-all duration-300 ${isOpen ? "rotate-180 text-amber-500" : "text-slate-400"}`} />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAdminOpenDropdown(null)} />
            <div className={`absolute z-50 left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl shadow-amber-500/5 overflow-hidden max-h-48 overflow-y-auto ${
              isDarkMode ? "bg-slate-800/95 backdrop-blur-xl border-white/10" : "bg-white/95 backdrop-blur-xl border-slate-200"
            }`}>
              {options.length === 0 ? (
                <div className="px-3 py-2.5 text-[10px] text-slate-500 text-center">موردی یافت نشد</div>
              ) : (
                <div className="py-1">
                  {options.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={(e) => { e.preventDefault(); onChange(opt.value); setAdminOpenDropdown(null); }}
                      className={`w-full px-3.5 py-2.5 text-[11px] text-right transition-all duration-100 flex items-center justify-between gap-2 ${
                        opt.value === value
                          ? isDarkMode ? "bg-amber-500/12 text-amber-400 font-extrabold" : "bg-amber-500/8 text-amber-600 font-bold"
                          : isDarkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {opt.value === value && (
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // --- STANDARD APPLICATION VIEWPORT ---
  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-500 fa-dir select-none ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-zinc-50 text-slate-900"
    }`} dir="rtl" role="document" itemScope itemType="https://schema.org/WebPage">



      {/* 2. CHIEF HEADER COMPONENT */}
      {activeTab !== "admin" && (
        <header role="banner" className={`sticky top-0 z-40 transition-all duration-300 shadow-xl border-b backdrop-blur-md ${
          isDarkMode ? "bg-slate-950/95 border-white/5" : "bg-white/95 border-slate-200"
        }`}>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 min-h-[4rem] sm:min-h-[5rem] py-2 lg:py-0 flex items-center justify-between gap-1.5 sm:gap-4 flex-nowrap">
            
            {/* Right Section: Brand Logo */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <span className="p-1.5 sm:p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-950 shadow-md transform hover:rotate-12 transition-transform">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6" />
              </span>
              <div>
                <h1 className="text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent font-sans tracking-tight">
                  فروشگاه آنلاین زرین‌کالا
                </h1>
                <p className={`text-[9px] sm:text-[10px] font-medium leading-none hidden md:block ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  تجربه مجلل و سریع خریدی امن و معتبر
                </p>
              </div>
            </div>

            {/* Center Tabs: Desktop Navigation */}
            <nav role="navigation" aria-label="ناوبری اصلی دسکتاپ" className="hidden lg:flex items-center gap-0.5 p-1 rounded-xl">
              {currentUser?.id !== "guest" && (
                <>
              <button onClick={() => { setActiveTab("shop"); playInteractionChime("button"); }}
                className={`tab-nav ${activeTab === "shop" ? "active" : ""}`}>
                <ShoppingBag className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
                <span>فروشگاه</span>
              </button>
              <button onClick={() => { setActiveTab("wishlist"); playInteractionChime("button"); }}
                className={`tab-nav ${activeTab === "wishlist" ? "active" : ""} relative`}>
                <Heart className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
                <span>علاقه‌مندی‌ها</span>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white min-w-4 h-4 text-[9px] flex items-center justify-center rounded-full px-1 font-mono">{toPersianNum(wishlist.length)}</span>
                )}
              </button>
              <button onClick={() => { setActiveTab("orders"); playInteractionChime("button"); }}
                className={`tab-nav ${activeTab === "orders" ? "active" : ""}`}>
                <Package className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
                <span>سفارش‌ها</span>
                {orders.length > 0 && (
                  <span className="badge badge-amber text-[9px]">{toPersianNum(orders.length)}</span>
                )}
              </button>
              <button onClick={() => { setActiveTab("about"); playInteractionChime("button"); }}
                className={`tab-nav ${activeTab === "about" ? "active" : ""}`}>
                <HelpCircle className="w-3.5 h-3.5 lg:w-5 lg:h-5" />
                <span>درباره ما</span>
              </button>
              <button onClick={() => { setActiveTab("profile"); playInteractionChime("button"); }}
                className={`tab-nav ${activeTab === "profile" ? "active" : ""}`}>
                <div className="w-3.5 h-3.5 lg:w-5 lg:h-5 rounded-full overflow-hidden flex items-center justify-center border border-amber-500/30">
                  <SafeUserAvatar user={currentUser} sizeClass="w-full h-full" />
                </div>
                <span>پروفایل</span>
              </button>
                </>
              )}
            </nav>

            {/* Left Actions: Theme Toggle, Cart Button */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              {/* Dark & Light Presets */}
              <button 
                onClick={() => { setIsDarkMode(!isDarkMode); playInteractionChime("button"); }}
                title="تغییر تم دیداری"
                className={`p-2 sm:p-2.5 border rounded-xl sm:rounded-2xl transition-all hover:scale-110 hover:shadow-lg hover:shadow-amber-500/10 active:scale-90 cursor-pointer ${
                  isDarkMode ? "bg-white/5 border-white/5 text-amber-300" : "bg-slate-100 border-slate-200 text-amber-600"
                }`}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setShowUserNotifs(prev => !prev)}
                title="اعلان‌ها"
                className={`relative p-2 sm:p-2.5 border rounded-xl sm:rounded-2xl transition-all hover:scale-110 hover:shadow-lg active:scale-90 cursor-pointer ${
                  isDarkMode ? "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Bell className="w-4 h-4" />
                {userNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center shadow-lg shadow-rose-500/30">
                    {toPersianNum(userNotifCount)}
                  </span>
                )}
              </button>

              {/* Guest about + logout buttons */}
              {currentUser?.id === "guest" && (
                <>
              <button
                onClick={() => { setActiveTab("about"); playInteractionChime("button"); }}
                title="درباره ما"
                className={`hidden sm:block p-2.5 border rounded-2xl transition-all hover:scale-110 hover:shadow-lg hover:shadow-amber-500/10 active:scale-90 cursor-pointer ${
                  isDarkMode ? "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleUserLogout}
                title="خروج از حساب"
                className={`p-2.5 border rounded-2xl transition-all hover:scale-110 hover:shadow-lg active:scale-90 cursor-pointer ${
                  isDarkMode ? "bg-rose-500/10 border-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
                </>
              )}

              {/* Logout button */}
              {currentUser?.id !== "guest" && currentUser && (
              <button
                onClick={handleUserLogout}
                title="خروج از حساب"
                className={`p-2.5 border rounded-2xl transition-all hover:scale-110 hover:shadow-lg active:scale-90 cursor-pointer ${
                  isDarkMode ? "bg-rose-500/10 border-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
              )}

              {/* Main Cart Dropdown / Sidebar launcher button */}
              {currentUser?.id !== "guest" && (
              <motion.button 
                id="cart_trigger_btn"
                onClick={() => { setIsCartOpen(true); playInteractionChime("button"); }}
                animate={cartPulse ? { scale: [1, 1.25, 0.9, 1.08, 1], rotate: [0, -6, 6, -3, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 ${
                  isDarkMode 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20" 
                    : "bg-amber-500 text-slate-950 border-amber-500/30 hover:bg-amber-405 hover:bg-amber-400"
                }`}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs font-black hidden sm:inline">سبد خرید شما</span>
                <motion.span 
                  key={cart.reduce((s, it) => s + it.quantity, 0)}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className={`min-w-5 h-5 sm:min-w-6 sm:h-6 text-[10px] sm:text-xs text-center font-bold flex items-center justify-center rounded-lg sm:rounded-xl ${
                    isDarkMode ? "bg-amber-400 text-slate-950 shadow-md" : "bg-slate-950 text-amber-400"
                  }`}
                >
                  {toPersianNum(cart.reduce((s, it) => s + it.quantity, 0))}
                </motion.span>
              </motion.button>
              )}

            </div>
          </div>
        </header>
      )}

      {/* User Notification Panel */}
      {showUserNotifs && (
        <div className={`fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[999] rounded-2xl border shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
        }`} dir="rtl">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-black">اعلان‌ها</span>
            <button onClick={() => setShowUserNotifs(false)} className="p-1 hover:bg-white/5 rounded-lg cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto cust-scroll">
            {notifications.filter(n => n.targetUserId === (currentUser?.id || "guest")).length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-8">هیچ اعلانی وجود ندارد</p>
            ) : (
              notifications.filter(n => n.targetUserId === (currentUser?.id || "guest")).map(n => (
                <div
                  key={n.id}
                  onClick={() => setNotifications(prev => prev.map(p => p.id === n.id ? { ...p, read: true } : p))}
                  className={`p-3 border-b border-white/5 text-xs cursor-pointer transition-all hover:bg-white/5 ${
                    !n.read ? "bg-amber-500/5 border-r-2 border-r-amber-500" : ""
                  }`}
                >
                  <strong className="block text-amber-400 mb-0.5">{n.title}</strong>
                  <p className="text-slate-400">{n.body}</p>
                  <span className="text-[8px] opacity-50 mt-1 block">{toPersianNum(new Date(n.timestamp).toLocaleString("fa-IR"))}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MOBILE BAR NAVIGATION (Bottom Bar helper) */}
      <nav role="navigation" aria-label="ناوبری موبایل" className={`lg:hidden fixed bottom-1 left-4 right-4 z-50 rounded-2xl border backdrop-blur-lg flex justify-around py-2.5 shadow-2xl transition-all duration-300 ${
        isDarkMode ? "bg-slate-950/90 border-white/5 shadow-black/80" : "bg-white/95 border-slate-200/85 shadow-slate-200"
      }`}>
        {currentUser?.role === "admin" ? (
          <>
        <button 
          onClick={() => { setActiveTab("admin"); setAdminSubTab("dashboard"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "admin" && adminSubTab === "dashboard" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <Shield className="w-5 h-5" />
          <span>داشبورد</span>
        </button>
        <button 
          onClick={() => { setActiveTab("admin"); setAdminSubTab("categories"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "admin" && adminSubTab === "categories" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <FolderTree className="w-5 h-5" />
          <span>دسته‌بندی</span>
        </button>
        <button 
          onClick={() => { setActiveTab("admin"); setAdminSubTab("orders"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "admin" && adminSubTab === "orders" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>سفارش‌ها</span>
        </button>
        <button 
          onClick={() => { setActiveTab("admin"); setAdminSubTab("users"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "admin" && adminSubTab === "users" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <Users className="w-5 h-5" />
          <span>کاربران</span>
        </button>
        <button 
          onClick={() => { setActiveTab("admin"); setAdminSubTab("coupons"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "admin" && adminSubTab === "coupons" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <TicketPercent className="w-5 h-5" />
          <span>کوپن‌ها</span>
        </button>
          </>
        ) : currentUser?.id !== "guest" ? (
          <>
        <button 
          onClick={() => { setActiveTab("shop"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "shop" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>ویترین</span>
        </button>
        <button 
          onClick={() => { setActiveTab("wishlist"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all relative hover:scale-110 hover:text-amber-400/80 ${activeTab === "wishlist" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <Heart className="w-5 h-5" />
          <span>محبوب‌ها</span>
          {wishlist.length > 0 && <span className="absolute top-0 right-4 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{toPersianNum(wishlist.length)}</span>}
        </button>
        <button 
          onClick={() => { setActiveTab("orders"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "orders" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <Package className="w-5 h-5" />
          <span>سفارش‌ها</span>
        </button>
        <button 
          onClick={() => { setActiveTab("profile"); playInteractionChime("button"); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all hover:scale-110 hover:text-amber-400/80 ${activeTab === "profile" ? "text-amber-400 scale-105" : "text-slate-400"}`}
        >
          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-amber-500/30">
            <SafeUserAvatar user={currentUser} sizeClass="w-full h-full" />
          </div>
          <span>حساب من</span>
        </button>
          </>
        ) : null}
      </nav>

      {/* 3. CORE ROUTING & TAB PANEL VIEW CONTAINERS */}
      <main role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full mb-20 lg:mb-6">
        
        {/* TAB 1: SHOWCASE STOREFRONT VIEW */}
        {activeTab === "shop" && (
          <div className="space-y-8">
            
            {/* Elegant Hero Banner */}
            <div className={`p-6 sm:p-8 lg:p-10 rounded-3xl relative overflow-hidden border shadow-2xl ${
              isDarkMode 
                ? "bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 border-white/5 shadow-amber-500/5" 
                : "bg-gradient-to-br from-amber-50 via-amber-100/30 to-orange-100/60 border-amber-900/10 shadow-orange-500/5"
            }`}>
              
              {/* Injecting our custom inline styles for keyframe animations */}
              <style>{`
                @keyframes shineSweep {
                  0% { left: -100%; top: -100%; }
                  100% { left: 150%; top: 150%; }
                }
                .glitter-sweep {
                  position: absolute;
                  width: 150%;
                  height: 150%;
                  background: linear-gradient(135deg, transparent 40%, rgba(251, 191, 36, 0.1) 50%, transparent 60%);
                  animation: shineSweep 4.5s infinite linear;
                  pointer-events: none;
                }
                @media (max-width: 639px) {
                  .glitter-sweep { animation: none; display: none; }
                }
                @keyframes bannerSpinSlow {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .banner-spin-slow {
                  animation: bannerSpinSlow 12s linear infinite;
                }
                @keyframes glowPulse {
                  0%, 100% { opacity: 0.1; transform: scale(1); }
                  50% { opacity: 0.25; transform: scale(1.15); }
                }
                .glow-pulse {
                  animation: glowPulse 5s ease-in-out infinite;
                }
                @media (max-width: 639px) {
                  .glow-pulse { animation: none; }
                }
                input[type="range"].range-track {
                  -webkit-appearance: none;
                  appearance: none;
                  background: transparent;
                  cursor: pointer;
                }
                input[type="range"].range-track::-webkit-slider-runnable-track {
                  height: 6px;
                  border-radius: 999px;
                  background: rgba(251, 191, 36, 0.15);
                  border: 1px solid rgba(251, 191, 36, 0.1);
                }
                input[type="range"].range-track::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #fbbf24, #f59e0b);
                  border: 2px solid rgba(251, 191, 36, 0.3);
                  box-shadow: 0 0 12px rgba(251, 191, 36, 0.3);
                  margin-top: -7px;
                  cursor: pointer;
                  transition: all 0.15s ease;
                }
                input[type="range"].range-track::-webkit-slider-thumb:hover {
                  transform: scale(1.15);
                  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
                }
                input[type="range"].range-track::-moz-range-track {
                  height: 6px;
                  border-radius: 999px;
                  background: rgba(251, 191, 36, 0.15);
                  border: 1px solid rgba(251, 191, 36, 0.1);
                }
                input[type="range"].range-track::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #fbbf24, #f59e0b);
                  border: 2px solid rgba(251, 191, 36, 0.3);
                  box-shadow: 0 0 12px rgba(251, 191, 36, 0.3);
                  cursor: pointer;
                }
              `}</style>

              {/* Glowing Background Orbs & Effects */}
              <div className="absolute inset-0 opacity-15 pointer-events-none z-0">
                <svg className="w-full h-full text-amber-500" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="bannpattern_new" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="15" r="1.2" fill="currentColor"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#bannpattern_new)" />
                </svg>
              </div>

              {/* Background Ambient Orbs */}
              <div className="hidden sm:block absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none glow-pulse" />
              <div className="hidden sm:block absolute -right-20 -top-20 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none glow-pulse" />
              <div className="glitter-sweep" />

              {/* Responsive Grid Setup */}
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* 1. RIGHT SIDE: TITLE, SUBTEXT & MAIN EXPLORE CTAs (col-span-12 on mobile, col-span-7 on large desktop) */}
                <div className="lg:col-span-7 space-y-6 text-right flex flex-col items-start select-none">
                  
                  {/* Dynamic Glowing Banner Badge */}
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className={`px-3.5 py-1.5 text-[10.5px] font-black rounded-full border tracking-wide uppercase inline-flex items-center gap-2 transition-all cursor-pointer ${
                      isDarkMode ? "bg-amber-400/10 border-amber-400/20 text-amber-400 shadow-amber-400/5 shadow-md" : "bg-amber-500/10 border-amber-500/30 text-amber-800"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    جشنواره فناوری و هوشمندی زرین‌کالا
                  </motion.span>
                  
                  {/* Spectacular Big Display Heading */}
                  <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-tight font-black text-right max-w-2xl">
                    درگاه فناوری روز؛ <br/>
                    <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                      بزرگترین مرجع گجت‌ها
                    </span>{" "}
                    و تجهیزات دیجیتال
                  </h2>
                  
                  {/* Smooth Breathable Sub-Paragraph */}
                  <p className={`text-xs sm:text-sm leading-relaxed max-w-xl font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                    انتخاب مدرن‌ترین و برترین برندهای دنیای تکنولوژی. با کیفیت‌ترین گوشی‌‌های پرچمدار، لپ‌تاپ‌های قدرتمند مهندسی، هدفون‌های استودیویی حذف نویز و ساعت‌های هوشمند ورزشی اورجینال همراه با بهترین قیمت بازار و گارانتی معتبر کشور.
                  </p>

                  {/* Primary Explorer Navigation Buttons */}
                  <div className="pt-2 flex flex-wrap gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedCategory("phones"); playInteractionChime("button"); }}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-2xl cursor-pointer transition-all shadow-lg shadow-amber-500/15 flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      گوشی موبایل و تبلت
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedCategory("laptops"); playInteractionChime("button"); }}
                      className={`px-5 py-3 border rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        isDarkMode 
                          ? "bg-white/5 border-white/5 text-slate-200 hover:bg-white/10" 
                          : "bg-white border-slate-250 text-slate-700 hover:bg-slate-50 shadow-sm"
                      }`}
                    >
                      <span>لپ‌تاپ و کامپیوتر</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>

                  {/* Trust Badges row for aesthetic layout balance */}
                  <div className="pt-6 border-t border-slate-500/10 w-full flex flex-wrap gap-4 sm:gap-6 text-[10.5px] font-bold text-slate-400 text-right">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>تضمین ۱۰۰٪ اصالت کالا</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>ارسال سریع و سراسری بیمه شده</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>۷ روز مهلت تست اختصاصی</span>
                    </div>
                  </div>

                </div>

                {/* 2. LEFT SIDE: DYNAMIC DEALS GLASS CABINET CONSOLE (col-span-12 on mobile, col-span-5 on desktop) */}
                <div className="lg:col-span-5 w-full flex justify-center items-center">
                  <HeroDealConsole 
                    products={INITIAL_PRODUCTS}
                    onOpenProduct={setSelectedProduct}
                    isDarkMode={isDarkMode}
                    toPersianNum={toPersianNum}
                    playInteractionChime={playInteractionChime}
                  />
                </div>

              </div>

            </div>

            {/* Unified Exploration Core Desk (Ultra-Premium, Interactive and Responsive across Devices) */}
            <div className="space-y-6">
              
              {/* LARGE DESKTOP VIEW */}
              <div className="hidden xl:block">
                {renderStoreProductGrid("grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6")}
              </div>


              {/* TABLET VIEW */}
              <div className="hidden md:block xl:hidden">
                {renderStoreProductGrid("grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6")}
              </div>


              {/* MOBILE VIEW */}
              <div className="block md:hidden space-y-5">
                {renderStoreProductGrid("grid-cols-1 sm:grid-cols-2 gap-4")}
              </div>

              </div>

            </div>
        )}

        {/* TAB 2: WISHLIST BANNER */}
         {activeTab === "wishlist" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-rose-500 fill-current" />
                <h2 className="text-xl font-bold whitespace-nowrap flex-shrink-0">علاقه‌مندی‌های شما</h2>
              </div>
              <span className="text-xs text-slate-400 block pr-9">محصولاتی که مایل به خرید آنها در آینده نزدیک هستید</span>
            </div>

            {wishlist.length === 0 ? (
              <div className={`p-16 rounded-3xl border text-center space-y-4 transition-all duration-300 hover:border-amber-500/20 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200"}`}>
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">لیست علاقه‌مندی‌ها خالی است</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  با فشردن دکمه قلب کوچک روی هر کالا در ویترین مغازه، می‌توانید محصولات مدنظرتان را این‌جا ذخیره کنید.
                </p>
                <button 
                  onClick={() => setActiveTab("shop")}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg hover:shadow-amber-500/20"
                >
                  بازگشت به مغازه
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => wishlist.includes(p.id)).map(p => {
                  const hasDiscount = p.discountPrice !== undefined && p.discountPrice > 0;
                  const finalPrice = p.discountPrice || p.price;
                  const isWishlisted = wishlist.includes(p.id);
                  const orderCount = orders.reduce((sum, o) => sum + o.items.filter(it => it.product.id === p.id).reduce((q, it) => q + it.quantity, 0), 0);
                  return (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); playInteractionChime("button"); }}
                    className={`group relative rounded-xl border overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1.5 ${
                      isDarkMode
                        ? "bg-slate-900/60 border-white/[0.06] hover:border-amber-500/25 shadow-sm shadow-black/20 hover:shadow-lg hover:shadow-amber-500/5"
                        : "bg-white border-slate-200/80 hover:border-amber-400/50 shadow-sm hover:shadow-lg hover:shadow-amber-500/10"
                    }`}
                  >
                    {/* Image area */}
                    <div className={`relative overflow-hidden flex items-center justify-center bg-gradient-to-br ${p.imageColor} h-44 sm:h-48`}>
                      {p.images && p.images.length > 0 ? (
                        <div className="absolute inset-0 w-full h-full" onClick={(e) => e.stopPropagation()}>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 z-11" />
                          <div className="relative w-full h-full">
                            {(p.images || []).map((img, imgIdx) => (
                              <img key={imgIdx} src={safeUrl(img)} alt={sanitize(p.title)} loading="lazy" referrerPolicy="no-referrer"
                                onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(p.title, 400, 300, p.iconType); } else { e.currentTarget.style.display = "none"; } }}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-10 ${imgIdx === editingImageIndex ? "opacity-100" : "opacity-0"}`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : p.imageUrl ? (
                        <div className="absolute inset-0 w-full h-full transition-all duration-500 group-hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 z-11" />
                          <img src={safeUrl(p.imageUrl)} alt={sanitize(p.title)} loading="lazy" referrerPolicy="no-referrer"
                            onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(p.title, 400, 300, p.iconType); } else { e.currentTarget.style.display = "none"; } }}
                            className="absolute inset-0 w-full h-full object-cover z-10" />
                        </div>
                      ) : (
                        <div className="transform group-hover:scale-110 transition-transform duration-500 text-slate-100/60 z-1">
                          {renderProductIcon(p.iconType, "w-16 h-16")}
                        </div>
                      )}

                      {/* Wishlist heart button */}
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id, e); }}
                        className={`absolute top-2.5 left-2.5 p-1.5 rounded-xl backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer z-10 ${
                          isWishlisted
                            ? "bg-rose-500 text-white scale-110 shadow-rose-500/30"
                            : "bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900"
                        }`}>
                        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    {/* Info area */}
                    <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 flex-1">
                      {/* Category badge */}
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[8px] sm:text-[9px] font-semibold tracking-wide border ${
                          isDarkMode
                            ? "bg-amber-500/8 text-amber-400/80 border-amber-500/15"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {(() => { const f = categories.find(c => c.id === p.category); return f ? f.name : "سایر"; })()}
                        </span>
                        {hasDiscount && (
                          <span className="bg-rose-500/10 text-rose-500 text-[7px] sm:text-[8px] font-semibold px-1.5 py-[2px] rounded-md border border-rose-500/15">
                            {toPersianNum(Math.round(((p.price - p.discountPrice!) / p.price) * 100))}٪
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`text-[12px] sm:text-sm font-bold leading-snug transition-colors line-clamp-2 ${
                        isDarkMode ? "text-slate-100 group-hover:text-amber-400" : "text-slate-800 group-hover:text-amber-600"
                      }`}>
                        {sanitize(p.title)}
                      </h3>

                      {/* Rating + orders */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] sm:text-[11px] font-bold">{toPersianNum(p.rating)}</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400">({toPersianNum(p.reviews.length)})</span>
                        </div>
                        {orderCount > 0 && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-1">
                            <ShoppingCart className="w-2.5 h-2.5" />
                            {toPersianNum(orderCount)} سفارش
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div className={`h-px ${isDarkMode ? "bg-white/5" : "bg-slate-100"}`} />

                      {/* Price + add to cart */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          {hasDiscount && (
                            <span className="text-[9px] sm:text-[10px] text-slate-400 line-through font-mono">{toPersianNum(p.price)}</span>
                          )}
                          <span className="text-[13px] sm:text-sm font-bold text-amber-500 tracking-tight font-mono leading-tight">
                            {toPersianNum(finalPrice)}
                            <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 mr-0.5">ت</span>
                          </span>
                        </div>

                        {/* Cart incrementer */}
                        {(() => {
                          const itemInCart = cart.find(it => it.product.id === p.id);
                          if (itemInCart && itemInCart.quantity > 0) {
                            return (
                              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); updateCartQuantity(p.id, -1); playInteractionChime("button"); }}
                                  className="w-6 h-6 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md cursor-pointer transition-all active:scale-90">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-[11px] font-black min-w-[18px] text-center font-mono text-amber-500">{toPersianNum(itemInCart.quantity)}</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); addToCart(p, e); }}
                                  className="w-6 h-6 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md cursor-pointer transition-all active:scale-90">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button type="button" onClick={(e) => { e.stopPropagation(); addToCart(p, e); }}
                              className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-all shadow-sm hover:shadow-md hover:shadow-amber-500/20 active:scale-90 hover:scale-105 cursor-pointer shrink-0">
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAST ORDERS & TRACKING VIEW */}
        {activeTab === "orders" && currentUser?.id !== "guest" && (
          <div className="space-y-8">
            
            {/* Real-time Tracking Box */}
            <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"} space-y-5`}>
              <div className="flex items-center gap-2.5">
                <Truck className="w-6 h-6 text-amber-500" />
                <div>
                  <h2 className="text-lg font-bold">سامانه رهگیری هوشمند مرسوله</h2>
                  <p className="text-xs text-slate-400">کد رهگیری پستی یا شناسه فاکتور ممهور خود را در بخش زیر وارد نمایید</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text"
                  placeholder="مثال: IR-62319082  یا  ZRN-23498"
                  value={trackingSearchCode}
                  onChange={(e) => setTrackingSearchCode(e.target.value)}
                  className={`flex-grow px-4 py-3 text-xs rounded-2xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-wider ${
                    isDarkMode ? "bg-slate-950 text-slate-100 border-white/5" : "bg-slate-50 border border-slate-200"
                  }`}
                />
                <button 
                  onClick={handleSearchTrackingCode}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-2xl cursor-pointer shrink-0"
                >
                  رهگیری مرسوله
                </button>
              </div>

              {/* Show Tracked Order Visual Timeline */}
              {trackedOrder && (
                <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200"} space-y-6 mt-4`}>
                  
                  {/* Status header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">گیرنده:</span> <span className="font-bold text-amber-400">{sanitize(trackedOrder.shippingInfo.fullName)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">شناسه سفارش:</span> <span className="font-mono font-bold">{trackedOrder.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">کد رهگیری پست:</span> <span className="font-mono text-xs bg-amber-500/10 px-2 py-0.5 rounded-md text-amber-500 font-bold">{trackedOrder.trackingNumber}</span>
                    </div>
                  </div>

                  {/* Flow Steps graphical representation */}
                  <div className="grid grid-cols-4 gap-2 relative mt-2 text-center text-[10px] font-bold">
                    
                    {/* Background track bar */}
                    <div className="absolute top-3.5 inset-x-1/8 h-1 bg-slate-800 z-0">
                      <div className={`h-full bg-amber-500 transition-all`} style={{
                        width: trackedOrder.status === "preparing" ? "33%" : trackedOrder.status === "shipped" ? "66%" : "100%"
                      }} />
                    </div>

                    {/* Step 1: Pinned */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                      <span className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center"><Check className="w-4 h-4" /></span>
                      <span className="text-amber-500">ثبت فاکتور</span>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        ["preparing", "shipped", "delivered"].includes(trackedOrder.status) 
                          ? "bg-amber-500 text-slate-950" 
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        <Clock className="w-4 h-4" />
                      </span>
                      <span className={["preparing", "shipped", "delivered"].includes(trackedOrder.status) ? "text-amber-500" : "text-slate-400"}>در حال آماده‌سازی</span>
                    </div>

                    {/* Step 3: Shipped */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        ["shipped", "delivered"].includes(trackedOrder.status) 
                          ? "bg-amber-500 text-slate-950" 
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        <Truck className="w-4 h-4" />
                      </span>
                      <span className={["shipped", "delivered"].includes(trackedOrder.status) ? "text-amber-500" : "text-slate-400"}>تحویل به اداره پست</span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        trackedOrder.status === "delivered" 
                          ? "bg-emerald-500 text-slate-950" 
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                      <span className={trackedOrder.status === "delivered" ? "text-emerald-500" : "text-slate-400"}>تحویل نهایی</span>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* List of Past Orders */}
            <div className="space-y-4">
              <h2 className="text-lg font-black">تاریخچه سفارش‌های شما</h2>
              
              {orders.length === 0 ? (
                <div className={`p-12 rounded-3xl border text-center space-y-3 ${isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200"}`}>
                  <p className="text-xs text-slate-400">تاکنون سفارشی از طرف شما در مرورگر ثبت نگردیده است.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div 
                      key={order.id} 
                      className={`p-5 rounded-3xl border transition-all duration-300 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 ${
                        isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
                        <div className="space-y-1">
                          <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">تحت پردازش</span>
                          <h4 className="text-xs font-bold text-slate-400 mt-1">شناسه سفارش: <span className="font-mono text-slate-200">{order.id}</span></h4>
                        </div>
                        <div className="text-left">
                          <span className="text-xxs text-slate-400 font-mono tracking-wider">{order.date}</span>
                          <p className="text-sm font-black text-amber-500 font-mono">{toPersianNum(order.total)} تومان</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Summary of items */}
                        <div className="md:col-span-2 space-y-2">
                          <span className="text-[10px] text-slate-500 block">اقلام تحویلی فاکتور:</span>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((it, idx) => (
                              <div 
                                key={idx} 
                                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-2 border ${
                                  isDarkMode ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200"
                                }`}
                              >
                                {renderProductIcon(it.product.iconType, "w-4.5 h-4.5")}
                                <span>{it.product.title}</span>
                                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-1.5 rounded">
                                  {toPersianNum(it.quantity)} عدد
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick Action to copy tracking number or reload tracking status */}
                        <div className="flex flex-col justify-end items-end gap-2 text-left">
                          <button 
                            onClick={() => {
                              setTrackingSearchCode(order.id);
                              setTrackedOrder(order);
                              playInteractionChime("button");
                              // scroll smoothly to timeline tracker view
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold rounded-xl md:w-auto cursor-pointer"
                          >
                            رهگیری فوری روی نمودار
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: ABOUT THE BRAND */}
          {activeTab === "about" && (
          <div className="max-w-3xl mx-auto space-y-8">
            
            <div className={`p-8 rounded-3xl border space-y-6 shadow-2xl ${
              isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"
            }`}>
              
              <div className="border-b border-white/5 pb-4">
                <h2 className="text-2xl font-black text-amber-400">فروشگاه زنجیره‌ای زرین‌کالا</h2>
                <p className="text-xs text-slate-400 mt-1">همام صنف صنایع نوآورانه و تجارت دیجیتال</p>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-300 font-light text-justify">
                <p>
                  فروشگاه اینترنتی <span className="font-bold text-amber-200">زرین‌کالا</span> با به کارگیری فناوری‌های نوپای جهانی و جلب مشارکت برترین طراحان صنایع دستی بومی ایران، یک سازه تجارت الکترونیک فاخر را پدید آورده است که در آن شیک‌ترین وسایل دکوراسیون، برترین هدفون‌ها و ابزارهای صوتی تراز اول، و دست‌سازهای گرانبها در کنار هم قرار گرفته‌اند.
                </p>
                <p>
                  محصولات الکترونیکی ما همگی پیش از بسته‌بندی نهایی در انبار تدارکات آزمایش، تایید سلامت شده و همراه با کارت تضمین کتبی برای مشتریان گرامی ارسال می‌گردد.
                </p>
              </div>

              {/* Unique Features Bento Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-500/10 pt-6">
                
                <div className="p-4 bg-black/15 rounded-2xl border border-white/5 text-center space-y-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/30">
                  <span className="inline-block p-2 bg-amber-500/10 rounded-xl text-amber-400"><Truck className="w-5 h-5 mx-auto" /></span>
                  <h4 className="text-xs font-bold text-slate-200">ارسال برق‌آسا</h4>
                  <p className="text-[10px] text-slate-400">پردازش و ارسال به پست طی کمتر از ۱۲ ساعت کاری</p>
                </div>

                <div className="p-4 bg-black/15 rounded-2xl border border-white/5 text-center space-y-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30">
                  <span className="inline-block p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><CheckCircle className="w-5 h-5 mx-auto" /></span>
                  <h4 className="text-xs font-bold text-slate-200">اصالت کالا</h4>
                  <p className="text-[10px] text-slate-400">تضمین ۱۰۰٪ اصالت و بازگشت تمام هزینه در صورت تناقض</p>
                </div>

                <div className="p-4 bg-black/15 rounded-2xl border border-white/5 text-center space-y-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/30">
                  <span className="inline-block p-2 bg-amber-500/10 rounded-xl text-amber-400"><Phone className="w-5 h-5 mx-auto" /></span>
                  <h4 className="text-xs font-bold text-slate-200">پشتیبانی ممتاز</h4>
                  <p className="text-[10px] text-slate-400">پاسخ‌دهی ۲۴ ساعته تیکت‌ها و خط تلفن اختصاصی</p>
                </div>

              </div>

            </div>

          </div>
        )}
 
        {/* TAB 4.5: PERSONAL CLIENT PROFILE & HOT DIGITAL WALLET */}
        {activeTab === "profile" && currentUser && currentUser?.id !== "guest" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {currentUser.id === "guest" && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 text-amber-500 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold leading-relaxed shadow-lg">
                <span className="text-right">⚠️ شما هم‌اکنون به عنوان کاربر مهمان وارد این بخش شده‌اید. برای افزایش اعتبار کیف پول، سفارش کالا و مدیریت تراکنش‌ها، لطفاً به صورت حقیقی در سامانه ثبت نام کنید.</span>
                <button
                  onClick={handleUserLogout}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl duration-150 active:scale-95 shrink-0 transition-all text-[10px] cursor-pointer"
                >
                  ایجاد حساب حقیقی من
                </button>
              </div>
            )}
            
            {/* 1. Header Hero Card info */}
            <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-2xl transition-all duration-300 hover:shadow-amber-500/10 hover:border-amber-500/20 ${
              isDarkMode 
                ? "bg-gradient-to-r from-slate-900 via-neutral-900 to-slate-900 border-white/5" 
                : "bg-gradient-to-r from-amber-50 to-amber-100/40 border-slate-200"
            }`}>
              <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
              
              <div className="relative">
                {renderUserAvatar(currentUser, "w-20 h-20 rounded-2xl text-2xl font-black")}
                <span className="absolute -bottom-1 -left-1 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md animate-pulse">✓ آنلاین</span>
              </div>

              <div className="text-center md:text-right space-y-1.5 flex-1 p-1">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h2 className="text-xl font-black">{sanitize(currentUser.fullName)}</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    currentUser.id === "guest"
                      ? "bg-slate-550/20 text-slate-400 border border-slate-700"
                      : currentUser.role === "admin" 
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                        : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  }`}>
                    {currentUser.id === "guest" ? "کاربر آزمایشی مهمان" : currentUser.role === "admin" ? "مدیر ارشد سامانه" : "مشتری وفادار (عضو گلد زرین‌کالا)"}
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  عضویت از تاریخ: <strong className="font-mono text-amber-500">{toPersianNum(currentUser.createdAt || "۱۴۰۵-۰۳-۰۷")}</strong> | شناسه کاربری: <strong className="font-mono">{sanitize(currentUser.username)}</strong>
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-[11px] text-slate-400">
                  <span>📨 {sanitize(currentUser.email)}</span>
                  <span>📱 {toPersianNum(currentUser.phone || "---")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-end">
                <button
                  onClick={handleUserLogout}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/10 cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج کاربری</span>
                </button>
              </div>
            </div>

            {/* 2. Core Bento Grid dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* A: HOT DIGITAL WALLET PANEL */}
              <div className={`lg:col-span-2 p-6 rounded-3xl border space-y-6 shadow-xl ${
                isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center justify-between border-b border-slate-500/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <Wallet className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-100">کیف پول الکترونیکی هوشمند</h3>
                      <p className="text-[10px] text-slate-400">درگاه اختصاصی شارژ، برداشت و پرداخت آنلاین سفارش‌ها</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">سیستم شتاب فعال</span>
                </div>

                {/* Wallet visual gold card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white relative overflow-hidden shadow-lg border border-emerald-500/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-emerald-500/20">
                  <div className="absolute -top-10 -left-10 w-44 h-44 bg-white/5 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl" />
                  
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] opacity-75 font-semibold text-emerald-100">رصید و موجودی کل ولت شما:</span>
                      <h4 className="text-2xl sm:text-3xl font-black tracking-wide flex items-baseline gap-1.5">
                        {toPersianNum(currentUser.walletBalance.toLocaleString())}
                        <span className="text-xs font-bold text-emerald-200">ریال</span>
                      </h4>
                    </div>
                    <span className="bg-white/15 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest text-emerald-100 font-mono">GOLD VIP WALLET</span>
                  </div>

                  <div className="mt-8 flex justify-between items-end text-xs font-mono opacity-80">
                    <div>
                      <span className="text-[9px] block opacity-60">دارنده ولت:</span>
                      <span className="font-bold">{sanitize(currentUser.fullName)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] block opacity-60 text-left">مدت اعتبار:</span>
                      <span className="font-bold">نامحدود (عضویت ابدی)</span>
                    </div>
                  </div>
                </div>

                {/* In-Line Charge form */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-200">➕ شارژ سریع کیف پول:</h4>
                  
                  {/* Preset amounts block buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[2000000, 5000000, 10000000, 20000000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleStartWalletRecharge(amt)}
                        className={`py-2 px-1 text-[11px] rounded-xl border font-bold text-center cursor-pointer transition-all active:scale-95 ${
                          isDarkMode 
                            ? "bg-slate-950 border-white/5 hover:border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5" 
                            : "bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700"
                        }`}
                      >
                        + {toPersianNum((amt / 1000000).toString())} م تومان
                        </button>
                      ))}
                  </div>

                  {/* Custom manual charging input representation */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        className={`w-full pr-10 pl-16 py-3 text-xs font-bold rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 ${
                          isDarkMode ? "bg-slate-950 border border-white/5 text-slate-100" : "bg-slate-100 border border-slate-200 text-slate-900"
                        }`}
                        placeholder="مبلغ دلخواه را به ریال وارد کنید... (مثال: ۵۰۰۰۰۰۰)"
                        value={chargeAmountInput}
                        onChange={(e) => setChargeAmountInput(e.target.value)}
                      />
                      <Coins className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">ریال</span>
                    </div>
                    <button
                      onClick={() => {
                        const num = Number(chargeAmountInput);
                        if (!num || num <= 0) {
                          showToast("مبلغ نامعتبر است.", "error");
                          return;
                        }
                        handleStartWalletRecharge(num);
                      }}
                      className="px-6 py-3 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                    >
                      پرداخت و شارژ
                    </button>
                  </div>
                </div>

                {/* Wallet Transactions list */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-1.5 border-t border-slate-500/10 pt-4">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black text-slate-200">تاریخچه تراکنش‌های مالی اخیر شما:</h4>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/5">
                    <table className="w-full text-right text-xs">
                      <thead className={`text-[10px] font-bold ${isDarkMode ? "bg-black/40 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                        <tr>
                          <th className="p-3">توضیحات تراکنش</th>
                          <th className="p-3">تاریخ پرداخت</th>
                          <th className="p-3">نوع تراکنش</th>
                          <th className="p-3 text-left">مبلغ (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {walletTransactions.filter(tx => tx.userId === currentUser.id).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 tracking-wide text-[10.5px]">هیچ تراکنش مالی در حساب شما یافت نشد.</td>
                          </tr>
                        ) : (
                          walletTransactions
                            .filter(tx => tx.userId === currentUser.id)
                            .slice(0, 8)
                            .map(tx => (
                              <tr key={tx.id} className="hover:bg-white/5 transition-all text-[11px]">
                                <td className="p-3">
                                  <span className="font-semibold block text-slate-200">{tx.description}</span>
                                  <span className="font-mono text-[9px] text-slate-500">کد رهگیری: {tx.id}</span>
                                </td>
                                <td className="p-3 font-mono text-slate-400 text-[10px]">
                                  {toPersianNum(new Date(tx.date).toLocaleDateString("fa-IR"))}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                    tx.type === "deposit" || tx.amount > 0 
                                      ? "bg-emerald-500/10 text-emerald-400" 
                                      : "bg-rose-500/10 text-rose-400"
                                  }`}>
                                    {tx.type === "deposit" || tx.amount > 0 ? "واریز" : "خرید از فروشگاه"}
                                  </span>
                                </td>
                                <td className={`p-3 text-left font-mono font-bold ${
                                  tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                                }`}>
                                  {tx.amount > 0 ? "＋" : "－"}{toPersianNum(Math.abs(tx.amount).toLocaleString())}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* B: SETTINGS & CLIENT BIO CARD */}
              <div className="space-y-6">
                
                {/* Profile Edit Card */}
                <div className={`p-6 rounded-3xl border space-y-4 shadow-xl ${
                  isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"
                }`}>
                  <h3 className="text-xs font-black text-slate-100 border-b border-white/5 pb-2.5">🛠️ تنظیمات اطلاعات و تصویر پروفایل</h3>
                  
                  {/* High fidelity Avatar selection container */}
                  <div className="space-y-4">
                    <label className="text-[10px] text-slate-400 font-bold block">تصویر پروفایل شما:</label>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                      {/* Live preview */}
                      <div className="shrink-0 flex flex-col items-center gap-2">
                        {selectedProfileAvatar ? (
                          <div className="relative group">
                            <img 
                              src={selectedProfileAvatar} 
                              alt="avatar preview"
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-lg bg-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => { setSelectedProfileAvatar(""); playInteractionChime("button"); }}
                              className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-450 transition"
                              title="حذف تصویر"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/65 text-slate-500 text-lg">
                            <User className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                        {selectedProfileAvatar && (
                          <button
                            type="button"
                            onClick={() => { setSelectedProfileAvatar(""); playInteractionChime("button"); }}
                            className="text-[10px] text-rose-400 hover:text-rose-450 font-bold transition"
                          >
                            حذف تصویر
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5 text-center sm:text-right">
                        <span className="text-xs font-black text-amber-500 block">بارگذاری تصویر پروفایل دلخواه و رسمی</span>
                        <span className="text-[10px] text-slate-300 block leading-relaxed font-light">
                          جهت حفظ ظاهر شیک و رسمی پروفایل کاربری خود در باشگاه مشتریان زرین‌کالا، لطفاً یک تصویر واقعی، پرسپکتیو پرسنلی یا رسمی با کادربندی مربعی آپلود کنید.
                        </span>
                      </div>
                    </div>

                    {/* Drag & Drop Local Avatar Upload Area */}
                    <div className="space-y-2 mt-2">
                        <span className="text-[9px] text-slate-400 font-bold block">یا بارگذاری تصویر دلخواه خود (Drag & Drop یا کلیک):</span>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleProfileFileChange(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => {
                            const fileInput = document.getElementById("profile_file_upload_input");
                            if (fileInput) fileInput.click();
                          }}
                          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-1.5 ${
                            isDragOver 
                              ? "border-amber-500 bg-amber-500/10 scale-102" 
                              : isDarkMode 
                                ? "border-white/10 bg-slate-950/40 hover:border-amber-500/30 hover:bg-amber-500/5" 
                                : "border-slate-300 bg-slate-50 hover:border-amber-500/40 hover:bg-amber-50/20"
                          }`}
                        >
                          <input 
                            id="profile_file_upload_input"
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleProfileFileChange(e.target.files[0]);
                              }
                            }}
                          />
                          <Upload className="w-5 h-5 text-amber-500 animate-pulse-slow" />
                          <span className="text-[10px] font-bold text-slate-200">فایل تصویر خود را به اینجا بکشید یا برای انتخاب فایل کلیک کنید</span>
                          <span className="text-[8.5px] text-slate-500">فرمت‌های رایج تصویر (JPG, PNG) • حداکثر ۳۰ مگابایت</span>
                        </div>
                      </div>

                      {/* Restore Default Vector Silhouette button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedProfileAvatar(""); playInteractionChime("button"); }}
                          className={`w-full py-2.5 px-4 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            !selectedProfileAvatar 
                              ? "bg-amber-500/15 border-amber-500/20 text-amber-400 shadow-sm" 
                              : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>حذف تصویر و بازگشت به آیکون پیش‌فرض (بدون تصویر شخصی)</span>
                        </button>
                      </div>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      const targetFirstName = (e.currentTarget.elements.namedItem("editFirstName") as HTMLInputElement).value;
                      const targetLastName = (e.currentTarget.elements.namedItem("editLastName") as HTMLInputElement).value;
                      const targetEmail = (e.currentTarget.elements.namedItem("editEmail") as HTMLInputElement).value;
                      const targetPhone = (e.currentTarget.elements.namedItem("editPhone") as HTMLInputElement).value;
                      
                      if (!targetFirstName.trim() || !targetEmail.trim() || !targetPhone.trim()) {
                        showToast("فیلدها نمی‌توانند خالی باشند.", "warning");
                        return;
                      }
                      const combinedName = targetFirstName.trim() + (targetLastName.trim() ? " " + targetLastName.trim() : "");
                      handleUpdateProfile(e, { fullName: combinedName, email: targetEmail, phone: targetPhone, avatarUrl: selectedProfileAvatar });
                    }}
                    className="space-y-3.5 pt-2 border-t border-white/5"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">نام:</label>
                        <input
                          type="text"
                          name="editFirstName"
                          className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDarkMode ? "bg-slate-950 border border-white/5 text-slate-100" : "bg-slate-50 border border-slate-200"
                          }`}
                          defaultValue={(() => {
                            const parts = currentUser.fullName.trim().split(" ");
                            return parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
                          })()}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">نام خانوادگی:</label>
                        <input
                          type="text"
                          name="editLastName"
                          className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDarkMode ? "bg-slate-950 border border-white/5 text-slate-100" : "bg-slate-50 border border-slate-200"
                          }`}
                          defaultValue={(() => {
                            const parts = currentUser.fullName.trim().split(" ");
                            return parts.length > 1 ? parts.slice(-1)[0] : "";
                          })()}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">پست الکترونیکی:</label>
                      <input
                        type="email"
                        name="editEmail"
                        className={`w-full px-3 py-2 text-xs font-mono rounded-xl outline-none focus:ring-1 focus:ring-amber-500 text-left ${
                          isDarkMode ? "bg-slate-950 border border-white/5 text-slate-100" : "bg-slate-50 border border-slate-200"
                        }`}
                        defaultValue={currentUser.email}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">شماره تلفن همراه:</label>
                      <input
                        type="text"
                        name="editPhone"
                        className={`w-full px-3 py-2 text-xs font-mono rounded-xl outline-none focus:ring-1 focus:ring-amber-500 text-left ${
                          isDarkMode ? "bg-slate-950 border border-white/5 text-slate-100" : "bg-slate-50 border border-slate-200"
                        }`}
                        defaultValue={currentUser.phone}
                      />
                    </div>

                    {profileSuccessMsg && (
                      <div className="text-emerald-500 bg-emerald-500/10 p-2.5 rounded-xl text-[10px] leading-relaxed flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>{profileSuccessMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      ذخیره اطلاعات جدید
                    </button>
                  </form>
                </div>

                {/* Loyalty Tier Box */}
                <div className={`p-6 rounded-3xl border text-center space-y-3 shadow-xl ${
                  isDarkMode ? "bg-slate-900 border-white/5 text-slate-300" : "bg-gradient-to-tr from-amber-500/5 to-yellow-600/10 border-amber-500/20 text-slate-800"
                }`}>
                  <div className="inline-block p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                    <Award className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black">امتیاز باشگاه مشتریان زرین‌کالا</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-light">
                      شما با انجام خریدهای بیشتر از سایت زرین‌کالا تا سقف ۵٪ امتیاز تخفیف طلایی کسب می‌کنید و به زودی به سطح پلاتینیوم ارتقا می‌یابید!
                    </p>
                  </div>
                  <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-xs text-amber-400 font-bold">
                    مجموع سفارشات فعال: {toPersianNum(orders.length)}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

         {/* TAB 5: COMPREHENSIVE ADMIN PANEL */}
         {activeTab === "admin" && (
           <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* ADMIN LOGIN LOCK GATES */}
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="glass-card p-7 text-center space-y-5"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl mx-auto flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/10">
                    <Lock className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-100">درگاه ورود به پنل مدیریت</h2>
                    <p className="text-[11px] text-slate-500">رمز عبور امنیتی را وارد کنید</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (adminPasswordInput === "1234") {
                        setIsAdminLoggedIn(true);
                        sessionStorage.setItem("zarin_admin_logged", "true");
                        setAdminPasswordInput("");
                        setAdminLoginError("");
                        playInteractionChime("success");
                      } else {
                        setAdminLoginError("رمز عبور وارد شده اشتباه است (رمز پیش‌فرض: ۱۲۳۴)");
                        playInteractionChime("button");
                      }
                    }} 
                    className="space-y-3.5 text-right"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-semibold">رمز عبور پنل مدیریت:</label>
                      <input 
                        type="password"
                        placeholder="••••••••"
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        className="elegant-input text-center font-mono tracking-widest"
                        autoFocus
                      />
                    </div>

                    {adminLoginError && (
                      <p className="text-center text-[10px] text-rose-500 font-semibold flex items-center gap-1.5 justify-center">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{adminLoginError}</span>
                      </p>
                    )}

                    <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-[10px] text-amber-300/80 leading-relaxed text-center font-medium">
                      رمز پیش‌فرض: <span className="font-mono bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md text-[11px] font-bold">1234</span>
                    </div>

                    <button 
                      type="submit"
                      className="btn-primary w-full py-3 text-xs"
                    >
                      <Shield className="w-4 h-4" />
                      <span>ورود به پنل مدیریت</span>
                    </button>
                  </form>
                </motion.div>
              </div>
            ) : (
              
              /* LOGGED IN ADMIN CORE VIEW */
              <div className="space-y-6 text-right" dir="rtl">
                
                {/* Admin Page Header */}
                <div className="glass-card py-3 px-4 md:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                    <div className="flex items-center justify-between gap-1 md:gap-3.5 shrink-0 w-full lg:w-auto">
                      <div className="flex items-center gap-2 md:gap-3.5">
                        <span className="p-2 md:p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                          <Settings className="w-5 h-5" />
                        </span>
                        <h2 className="text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent whitespace-nowrap">پنل ادمین زرین‌کالا</h2>
                      </div>
                      <button onClick={handleUserLogout}
                        className="lg:hidden px-2 md:px-3.5 py-1.5 md:py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                        <LogOut className="w-3.5 h-3.5" />
                        <span>خروج</span>
                      </button>
                    </div>
                    <div className="hidden lg:flex flex-nowrap items-center gap-1 flex-1 min-w-0 overflow-x-auto">
                       {[
                        { key: "dashboard", icon: TrendingUp, label: "داشبورد و آمار فروش" },
                        { key: "categories", icon: Tag, label: `دسته‌بندی‌ها و کالاها (${toPersianNum(categories.length)})` },
                        { key: "orders", icon: ShoppingCart, label: `سفارش‌ها و فاکتورها (${toPersianNum(orders.length)})` },
                        { key: "coupons", icon: Percent, label: `کدهای تخفیف (${toPersianNum(coupons.length)})` },
                        { key: "reviews", icon: MessageSquare, label: `نظرات همراهان (${toPersianNum(products.reduce((acc, p) => acc + p.reviews.length, 0))})` },
                        { key: "messages", icon: MessageCircle, label: `پیام‌ها (${toPersianNum(unreadMessages)})` },
                        { key: "users", icon: Users, label: `مدیریت کاربران (${toPersianNum(users.length)})` },
                      ].map((item) => {
                        const key = item.key as "dashboard" | "categories" | "orders" | "coupons" | "reviews" | "messages" | "users";
                        const Icon = item.icon;
                        const label = item.label;
                        return (
                        <button key={key} onClick={() => { setAdminSubTab(key); playInteractionChime("button"); }}
                          className={`tab-nav ${adminSubTab === key ? "active" : ""}`}>
                          <Icon className="w-3 h-3" />
                          <span>{label}</span>
                        </button>
                      );
                      })
                    }
                    </div>
                    <button onClick={handleUserLogout}
                      className="hidden lg:flex px-2.5 md:px-3.5 py-1.5 md:py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl cursor-pointer transition-all items-center gap-1.5 shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج</span>
                    </button>
                  </div>
                </div>

                {/* SUB TAB VIEW 1: BUSINESS ANALYTICS DASHBOARD */}
                {adminSubTab === "dashboard" && (
                  <div className="space-y-6">
                    
                    {/* Metrics Bento Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <div className={`glass-card p-4.5 text-right space-y-1`}>
                        <div className="flex justify-between items-center text-slate-400 pb-2">
                          <span className="text-[11px] font-bold">مجموع ناخالص فروش ناخالص</span>
                          <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0"><Coins className="w-4 h-4" /></span>
                        </div>
                        <h4 className="text-xl font-mono font-black text-slate-100">{toPersianNum(orders.reduce((sum, o) => sum + o.total, 0))} تومان</h4>
                        <p className="text-[9px] text-emerald-500 font-medium">سفارش‌های نهایی پرداخت‌شده آنلاین</p>
                      </div>

                      <div className={`glass-card p-4.5 text-right space-y-1`}>
                        <div className="flex justify-between items-center text-slate-400 pb-2">
                          <span className="text-[11px] font-bold">تعداد کل سفارش‌های دریافتی</span>
                          <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0"><ShoppingCart className="w-4 h-4" /></span>
                        </div>
                        <h4 className="text-xl font-mono font-black text-slate-100">{toPersianNum(orders.length)} سفارش ثبت‌شده</h4>
                        <p className="text-[9px] text-slate-400">فاکتورهای نیازمند پردازش و تحویل</p>
                      </div>

                      <div className={`glass-card p-4.5 text-right space-y-1`}>
                        <div className="flex justify-between items-center text-slate-400 pb-2">
                          <span className="text-[11px] font-bold">متوسط ارزش سبد پرداختی فاکتورها</span>
                          <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0"><CreditCard className="w-4 h-4" /></span>
                        </div>
                        <h4 className="text-xl font-mono font-black text-slate-100">
                          {toPersianNum(orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0)} تومان
                        </h4>
                        <p className="text-[9px] text-slate-400">میانگین پرداختی بابت هر تراکنش</p>
                      </div>

                      <div className={`glass-card p-4.5 text-right space-y-1`}>
                        <div className="flex justify-between items-center text-slate-400 pb-2">
                          <span className="text-[11px] font-bold">کمبودهای جزئی کالا در انبار</span>
                          <span className="p-2 bg-rose-500/10 text-rose-500 rounded-xl shrink-0"><AlertCircle className="w-4 h-4" /></span>
                        </div>
                        <h4 className="text-xl font-black text-rose-500">
                          {toPersianNum(products.filter(p => p.stock <= 2).length)} قلم بحرانی
                        </h4>
                        <p className="text-[9px] text-rose-400 font-bold">موجودی رو به اتمام (کمتر از ۲ عدد)</p>
                      </div>

                    </div>

                    {/* Chart Dashboard and low stock alerts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Premium SVG Line/Gradients Chart */}
                      <div className="lg:col-span-2 glass-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <h4 className="text-xs font-bold text-slate-300">نمودار فروش ماهانه</h4>
                            <p className="text-[10px] text-slate-500">مجموع دریافتی‌ها بر اساس سفارش‌های واقعی</p>
                          </div>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md font-bold">تراکنش‌های موفق</span>
                        </div>

                        {(() => {
                          const persianMonths = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

                          const dayData: Record<string, { year: number; month: number; day: number; total: number; count: number }> = {};

                          orders.forEach(order => {
                            const engDate = toEnglishDigits(order.date);
                            const parts = engDate.split("/");
                            if (parts.length < 3) return;
                            const y = parseInt(parts[0]);
                            const m = parseInt(parts[1]);
                            const d = parseInt(parts[2]);
                            const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                            if (!dayData[key]) dayData[key] = { year: y, month: m, day: d, total: 0, count: 0 };
                            dayData[key].total += order.total;
                            dayData[key].count += 1;
                          });

                          const sorted = Object.values(dayData).sort((a, b) =>
                            a.year !== b.year ? a.year - b.year :
                            a.month !== b.month ? a.month - b.month :
                            a.day - b.day
                          );

                          const display = sorted.length > 30 ? sorted.slice(-30) : sorted;

                          const svgW = 500, svgH = 220;
                          const padL = 40, padR = 10, padT = 20, padB = 30;
                          const chartW = svgW - padL - padR;
                          const chartH = svgH - padT - padB;
                          const maxVal = Math.max(...display.map(d => d.total), 1);
                          const numPts = display.length;
                          const barW = Math.min(chartW / Math.max(numPts, 1) * 0.7, 36);
                          const barGap = numPts > 0 ? chartW / numPts : 0;

                          // Create unique gradient IDs per bar for variety
                          const gradColors = [
                            ["#f59e0b","#d97706"],
                            ["#10b981","#059669"],
                            ["#3b82f6","#1d4ed8"],
                            ["#8b5cf6","#6d28d9"],
                            ["#ec4899","#be185d"],
                          ];

                          return (
                        <div className="h-56 w-full relative pt-4">
                          {display.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold">هنوز سفارشی ثبت نشده است</div>
                          ) : (
                          <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
                            <defs>
                              {display.map((_, i) => (
                                <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={gradColors[i % gradColors.length][0]} stopOpacity="0.9" />
                                  <stop offset="100%" stopColor={gradColors[i % gradColors.length][1]} stopOpacity="0.6" />
                                </linearGradient>
                              ))}
                              <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                            </defs>
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                              const y = padT + chartH * (1 - ratio);
                              return (
                                <g key={i}>
                                  <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4" />
                                  <text x={padL - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                                    {toPersianNum(Math.round(maxVal * ratio).toLocaleString())}
                                  </text>
                                </g>
                              );
                            })}
                            {/* Baseline */}
                            <line x1={padL} y1={svgH - padB} x2={svgW - padR} y2={svgH - padB} stroke="#334155" strokeWidth="1.5" />
                            {/* Bars */}
                            {display.map((d, i) => {
                              const barH = Math.max((d.total / maxVal) * chartH, 2);
                              const x = padL + barGap * i + (barGap - barW) / 2;
                              const y = svgH - padB - barH;
                              return (
                                <g key={i}>
                                  <rect x={x} y={y} width={barW} height={barH} rx="4" fill={`url(#bg${i})`} filter="url(#barGlow)" />
                                  <rect x={x} y={y} width={barW} height={barH} rx="4" fill="none" stroke={gradColors[i % gradColors.length][0]} strokeWidth="0.5" strokeOpacity="0.4" />
                                  <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill={gradColors[i % gradColors.length][0]} fontSize="6" fontFamily="monospace" fontWeight="bold">
                                    {toPersianNum(Math.round(d.total).toLocaleString())}
                                  </text>
                                </g>
                              );
                            })}
                            {/* Day labels */}
                            {display.map((d, i) => {
                              const x = padL + barGap * i + barGap / 2;
                              const labelStep = Math.max(1, Math.floor(numPts / 6));
                              if (i % labelStep !== 0 && i !== numPts - 1) return null;
                              return (
                                <text key={i} x={x} y={svgH - 6} textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="sans-serif">
                                  {toPersianNum(String(d.day))} {persianMonths[d.month - 1]}
                                </text>
                              );
                            })}
                          </svg>
                          )}
                        </div>
                          );
                        })()}
                      </div>

                      {/* Side Panel: Low stock items list & Quick Action */}
                      <div className={`glass-card p-5 space-y-4`}>
                        <h4 className="text-xs font-black flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-500" />کمبود در موجودی انبارها</h4>
                        
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {products.filter(p => p.stock <= 3).length === 0 ? (
                            <p className="text-xxs text-slate-500 text-center py-8">وضعیت تمامی انبارهای کالاها عالی است.</p>
                          ) : (
                            products.filter(p => p.stock <= 3).map((p) => (
                              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-black/15 border border-white/5 text-xxs">
                                <div className="flex items-center gap-2">
                                  {renderProductIcon(p.iconType, "w-6 h-6 shrink-0")}
                                  <div className="min-w-0">
                                    <h5 className="font-bold truncate max-w-[120px]">{sanitize(p.title)}</h5>
                                    <span className="text-[9px] text-slate-500 block uppercase font-mono">{p.id}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xxs font-bold px-2 py-0.5 rounded-lg block leading-none ${p.stock === 0 ? "bg-rose-500/10 text-rose-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                                    {p.stock === 0 ? "ناموجود" : `موجودی: ${toPersianNum(p.stock)}`}
                                  </span>
                                  <button 
                                    onClick={() => {
                                      setAdminSubTab("categories");
                                      setEditingProduct(p);
                                      setProductForm({ ...p });
                                      playInteractionChime("button");
                                    }}
                                    className="text-[9px] text-amber-500 hover:underline mt-1 block cursor-pointer"
                                  >
                                    تامین موجودی انبار
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="bg-amber-500/10 p-3 rounded-xl text-[10px] text-amber-400 leading-relaxed text-justify">
                          نکته مدیریت: کاهش موجودی هر قلم کالا به کمتر از ۳ عدد، به سیستم هوشمند هشدار زنجیره تامین اعلان وضعیت بحرانی ارسال می‌کند.
                        </div>
                      </div>

                    </div>

                    {/* Unread Messages Card */}
                    <div className={`glass-card p-5 ${unreadMessages > 0 ? "ring-1 ring-amber-500/30" : ""}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl shrink-0"><MessageCircle className="w-4 h-4" /></span>
                          <h4 className="text-xs font-bold text-slate-300">پیام‌های کاربران</h4>
                        </div>
                        <button onClick={() => setAdminSubTab("messages")} className="text-[9px] text-amber-500 hover:underline cursor-pointer">مشاهده همه</button>
                      </div>
                      {unreadMessages > 0 ? (
                        <div className="space-y-2">
                          {[...messages].filter(m => !m.isAdmin && !m.read).slice(0, 3).map(msg => (
                            <div key={msg.id} className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                <MessageCircle className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-300 truncate">{msg.userName}</p>
                                <p className="text-[9px] text-slate-400 truncate">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                          {unreadMessages > 3 && (
                            <button onClick={() => setAdminSubTab("messages")} className="w-full text-[9px] text-amber-500 hover:underline cursor-pointer text-center">
                              {toPersianNum(unreadMessages - 3)} پیام نخوانده دیگر...
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 text-center py-4">همه پیام‌ها خوانده شده است</p>
                      )}
                    </div>

                    {/* Sales category progress distribution */}
                    <div className={`glass-card p-5`}>
                      <h4 className="text-xs font-black text-slate-200 mb-4 text-right">تفکیک توزیع کالا</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 text-xs">
                        {(() => {
                          const totalProducts = products.length;
                          return categories.map(cat => {
                            const count = products.filter(p => p.category === cat.id).length;
                            const ratio = totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0;
                            return (
                            <div key={cat.id} className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                              <span className="text-slate-400 font-bold">{cat.name}</span>
                              <div className="flex justify-between font-mono text-xxs items-center text-slate-400">
                                <span>سهم از کالاها</span>
                                <span className="font-bold text-slate-200">{toPersianNum(ratio)}٪</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${ratio}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 block">{toPersianNum(count)} قلم کالا</span>
                            </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                  </div>
                )}

                {/* SUB TAB VIEW 2: PRODUCT CRUD INVENTORY */}
                {/* CREATE OR EDIT PRODUCT FORM PORTAL (shared between all admin tabs) */}
                {(isAddingProduct || editingProduct) && (
                  <>
                    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`glass-card w-full max-w-3xl max-h-[85vh] overflow-y-auto p-5 sm:p-6`}
                      >
                        <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-500/10">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                              {isAddingProduct ? (
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              )}
                            </div>
                            <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                              {isAddingProduct ? "محصول جدید به ویترین" : `ویرایش: ${editingProduct?.title}`}
                            </h3>
                          </div>
                          <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!productForm.title.trim()) { showToast("عنوان کالا الزامی است.", "warning"); return; }
                            if (productForm.title.trim().length > 200) { showToast("عنوان کالا بسیار طولانی است.", "warning"); return; }
                            if (productForm.englishTitle.trim().length > 200) { showToast("عنوان انگلیسی بسیار طولانی است.", "warning"); return; }
                            if (productForm.price <= 0) { showToast("قیمت معتبر تومانی را تعیین کنید.", "warning"); return; }
                            if (productForm.price > 999999999) { showToast("قیمت بسیار بالا است.", "warning"); return; }
                            if (productForm.description.length > 5000) { showToast("توضیحات بسیار طولانی است.", "warning"); return; }

                            const sanitizedForm = {
                              ...productForm,
                              title: sanitize(productForm.title.trim()).slice(0, 200),
                              englishTitle: sanitize(productForm.englishTitle.trim()).slice(0, 200),
                              description: sanitize(productForm.description.trim()).slice(0, 5000),
                              specs: productForm.specs.map(s => ({ label: sanitize(s.label.trim()).slice(0, 50), value: sanitize(s.value.trim()).slice(0, 100) })),
                              images: (productForm.images || []).slice(0, 6),
                              tags: productForm.tags.slice(0, 10),
                              reviews: productForm.reviews,
                            };

                            if (editingProduct) {
                              setProducts(prev => prev.map(item => item.id === editingProduct.id ? { ...sanitizedForm, id: item.id } : item));
                              showToast(`کالای «${sanitizedForm.title}» با موفقیت ویرایش شد.`, "success");
                              setEditingProduct(null);
                            } else {
                              setProducts(prev => [...prev, sanitizedForm]);
                              showToast(`کالای «${sanitizedForm.title}» با موفقیت به فروشگاه اضافه شد.`, "success");
                              addNotification("محصول جدید اضافه شد", `${sanitizedForm.title} با قیمت ${toPersianNum(sanitizedForm.discountPrice || sanitizedForm.price)} تومان`, "product");
                              setIsAddingProduct(false);
                            }
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                            
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">عنوان فارسی کالا:</label>
                              <input 
                                type="text"
                                placeholder="مثلا: تلویزیون مانیتور هوشمند رز"
                                value={productForm.title}
                                onChange={(e) => setProductForm(p => ({ ...p, title: e.target.value }))}
                                className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                                  isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                                }`}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">عنوان انگلیسی (یا شناسه SKU انگلیسی):</label>
                              <input 
                                type="text"
                                placeholder="مثلا: Zarin Smart Screen X5"
                                value={productForm.englishTitle}
                                onChange={(e) => setProductForm(p => ({ ...p, englishTitle: e.target.value }))}
                                className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-wide ${
                                  isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                                }`}
                              />
                            </div>

                            <div className="space-y-1 col-span-1 sm:col-span-2">
                              <label className="text-[10px] text-slate-400 font-bold flex items-center gap-2">
                                <Image className="w-3 h-3" />
                                تصاویر کالا
                                <span className="text-[9px] font-mono text-slate-500">{(productForm.images || []).length} عدد</span>
                              </label>
                              <div className={`p-3 rounded-2xl border-2 border-dashed transition-colors relative ${(productForm.images || []).length > 0 ? (isDarkMode ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50") : (isDarkMode ? "border-slate-600 hover:border-amber-500/40" : "border-slate-300 hover:border-amber-400")}`}>
                                <div className="flex flex-wrap gap-2.5 min-h-[80px]">
                                  {(productForm.images || []).map((img, imgIdx) => (
                                    <div key={imgIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 group shrink-0 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer"
                                      style={{ borderColor: productForm.imageUrl === img ? '#f59e0b' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}
                                      onClick={() => setProductForm(p => ({ ...p, imageUrl: img }))}
                                    >
                                      <img src={img} alt={`تصویر ${imgIdx + 1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                      {productForm.imageUrl === img && (
                                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg z-10">
                                          <Star className="w-3 h-3 text-slate-950 fill-current" />
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setProductForm(p => {
                                          const newImages = (p.images || []).filter((_, i) => i !== imgIdx);
                                          return { ...p, images: newImages, imageUrl: p.imageUrl === img ? (newImages[0] || "") : p.imageUrl };
                                        }); }}
                                        className={`absolute top-0.5 right-0.5 w-5 h-5 bg-rose-500/90 hover:bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer z-10 ${productForm.imageUrl === img ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                      {productForm.imageUrl === img && (
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent py-1">
                                          <span className="text-[8px] text-amber-400 font-bold block text-center">اصلی</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 mt-2 border-t border-dashed border-white/5 pt-2">
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed cursor-pointer transition-all hover:bg-white/5 ${isDarkMode ? 'border-slate-600 hover:border-amber-500/50' : 'border-slate-300 hover:border-amber-400'}">
                                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[9px] text-slate-500 font-bold">انتخاب عکس</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (!file.type.startsWith("image/")) { showToast("لطفاً فقط فایل تصویر انتخاب کنید.", "error"); return; }
                                        if (file.size > 5 * 1024 * 1024) { showToast("حداکثر حجم ۵ مگابایت.", "error"); return; }
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          if (ev.target?.result) {
                                            const url = ev.target.result as string;
                                            if (!(productForm.imageUrl)) {
                                              setProductForm(p => ({ ...p, images: [url], imageUrl: url }));
                                            } else {
                                              setProductForm(p => ({ ...p, images: [...(p.images || []), url] }));
                                            }
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                  <div className="flex-1 flex gap-1">
                                    <input
                                      type="text"
                                      placeholder="لینک مستقیم عکس..."
                                      className={`flex-1 px-2.5 py-1.5 text-[10px] rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-mono ${
                                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/10" : "bg-white border text-slate-950 border-slate-200"
                                      }`}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          const input = e.currentTarget;
                                          const url = input.value.trim();
                                          if (url) {
                                            if (!productForm.imageUrl) {
                                              setProductForm(p => ({ ...p, images: [...(p.images || []), url], imageUrl: url }));
                                            } else {
                                              setProductForm(p => ({ ...p, images: [...(p.images || []), url] }));
                                            }
                                            input.value = "";
                                          }
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        const container = e.currentTarget.closest('.flex-1');
                                        const input = container?.parentElement?.querySelector('input[type="text"]') as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                          const url = input.value.trim();
                                          if (!productForm.imageUrl) {
                                            setProductForm(p => ({ ...p, images: [...(p.images || []), url], imageUrl: url }));
                                          } else {
                                            setProductForm(p => ({ ...p, images: [...(p.images || []), url] }));
                                          }
                                          input.value = "";
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer shrink-0 transition-all active:scale-95"
                                    >
                                      افزودن
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">قیمت پایه (تومان):</label>
                              <input 
                                type="number"
                                placeholder="مثال: 1200000"
                                value={productForm.price || ""}
                                onChange={(e) => setProductForm(p => ({ ...p, price: Number(e.target.value) }))}
                                className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono ${
                                  isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-955 border-slate-200"
                                }`}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">قیمت تخفیف‌دار ویژه (اختیاری - تومان):</label>
                              <input 
                                type="number"
                                placeholder="مثال: 950000"
                                value={productForm.discountPrice || ""}
                                onChange={(e) => setProductForm(p => ({ ...p, discountPrice: e.target.value ? Number(e.target.value) : undefined }))}
                                className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono ${
                                  isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-955 border-slate-200"
                                }`}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">دسته بندی کالا:</label>
                              {renderAdminSelect(
                                "pf_cat",
                                productForm.category,
                                (val) => setProductForm(p => ({ ...p, category: val, brand: "" })),
                                categories.map(cat => ({ value: cat.id, label: cat.name })),
                                "دسته‌بندی را انتخاب کنید",
                                isDarkMode
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">برند:</label>
                              {renderAdminSelect(
                                "pf_brand",
                                productForm.brand,
                                (val) => setProductForm(p => ({ ...p, brand: val })),
                                [{ value: "", label: "بدون برند" }, ...subcategories.filter(s => s.parentId === productForm.category).map(sub => ({ value: sub.id, label: sub.name }))],
                                "برند را انتخاب کنید",
                                isDarkMode
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">موجودی اولیه انبار:</label>
                              <input 
                                type="number"
                                placeholder="تعداد موجود در کاتالوگ"
                                value={productForm.stock}
                                onChange={(e) => setProductForm(p => ({ ...p, stock: Number(e.target.value) }))}
                                className={`w-full px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono ${
                                  isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-955 border-slate-200"
                                }`}
                              />
                            </div>

                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">نماد گرافیکی کالا (آیکون):</label>
                              {renderAdminSelect(
                                "pf_icon",
                                productForm.iconType,
                                (val) => setProductForm(p => ({ ...p, iconType: val })),
                                [
                                  { value: "headphones", label: "🎧 هدفون صوتی" },
                                  { value: "watch", label: "⌚ ساعت هوشمند" },
                                  { value: "coffee", label: "☕ قهوه‌ساز و باریستا" },
                                  { value: "speaker", label: "🔊 اسپیکر و هورن" },
                                  { value: "cup", label: "🍵 فنجان و ماگ" },
                                  { value: "backpack", label: "🎒 کوله‌پشتی و مفرغ" },
                                  { value: "bulb", label: "💡 چراغ خواب دکوری" },
                                  { value: "book", label: "📔 دفتر چرمی ترنج" },
                                  { value: "package", label: "📦 جعبه و پکیج همگانی" },
                                ],
                                "انتخاب آیکون",
                                isDarkMode
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">رنگ پس‌زمینه کارت (گرادیان Tailwind):</label>
                              {renderAdminSelect(
                                "pf_color",
                                productForm.imageColor,
                                (val) => setProductForm(p => ({ ...p, imageColor: val })),
                                [
                                  { value: "from-slate-800 to-slate-950", label: "تاریک متالیک" },
                                  { value: "from-amber-800 to-amber-950", label: "نیلی کهکشانی" },
                                  { value: "from-amber-700 to-amber-950", label: "فیروزه‌ای بومی" },
                                  { value: "from-emerald-700 to-stone-950", label: "زبرجدی خنک" },
                                  { value: "from-amber-600 to-amber-950", label: "طلایی سنتی" },
                                  { value: "from-stone-800 to-amber-950", label: "قهوه‌ای باریستا" },
                                  { value: "from-rose-800 to-amber-950", label: "شفق سرخرنگ" },
                                  { value: "from-violet-800 to-fuchsia-950", label: "ارغوانی ممتاز" },
                                ],
                                "انتخاب رنگ",
                                isDarkMode
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold block">نگار پس‌زمینه کارت (الگو):</label>
                              {renderAdminSelect(
                                "pf_pattern",
                                productForm.imagePattern,
                                (val) => setProductForm(p => ({ ...p, imagePattern: val })),
                                [
                                  { value: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]", label: "تابش کروی مرکزگر" },
                                  { value: "bg-[conic-gradient(at_top,_var(--tw-gradient-stops))]", label: "الگوی مخروطی پروانه‌ای" },
                                  { value: "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))]", label: "منحنی بیضی زیرین" },
                                  { value: "bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))]", label: "تابش کروی فوقانی" },
                                  { value: "bg-[linear-gradient(to_bottom_right,_var(--tw-gradient-stops))]", label: "گرادیان خطی اوریب" },
                                  { value: "bg-[linear-gradient(135deg,_var(--tw-gradient-stops))]", label: "خطوط مدرن زاویه‌دار" },
                                ],
                                "انتخاب الگو",
                                isDarkMode
                              )}
                            </div>

                          </div>

                          {/* Dynamic Specification Bento Area */}
                          <div className={`card-compact p-4 space-y-3`}>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              <span className="text-[10px] text-slate-400 font-black">مشخصات فنی کالا</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                              {productForm.specs.map((item, idx) => (
                                <span key={idx} className="bg-amber-500/10 border border-amber-500/10 text-amber-500 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                  <span>{item.label}: <strong className="text-slate-200">{item.value}</strong></span>
                                  <button 
                                    type="button" 
                                    onClick={() => setProductForm(p => ({ ...p, specs: p.specs.filter((_, i) => i !== idx) }))}
                                    className="hover:text-rose-400 cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <input 
                                type="text"
                                placeholder="نام مشخصه (مثلا: درگاه اتصال)"
                                value={newSpecLabel}
                                onChange={(e) => setNewSpecLabel(e.target.value)}
                                className={`elegant-input flex-grow`}
                              />
                              <input 
                                type="text"
                                placeholder="مقدار آن (مثلا: USB Type C)"
                                value={newSpecValue}
                                onChange={(e) => setNewSpecValue(e.target.value)}
                                className={`elegant-input flex-grow`}
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  if (!newSpecLabel.trim() || !newSpecValue.trim()) return;
                                  setProductForm(p => ({ ...p, specs: [...p.specs, { label: newSpecLabel, value: newSpecValue }] }));
                                  setNewSpecLabel("");
                                  setNewSpecValue("");
                                  playInteractionChime("button");
                                }}
                                className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 cursor-pointer text-center shrink-0"
                              >
                                درج مشخصه
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Custom tags adding */}
                          <div className={`card-compact p-4 space-y-3`}>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                              <span className="text-[10px] text-slate-400 font-black">برچسب‌ها و تگ‌ها</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                              {productForm.tags.map((tg, idx) => (
                                <span key={idx} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <span>{tg}</span>
                                  <button 
                                    type="button" 
                                    className="hover:text-rose-600 cursor-pointer text-xs"
                                    onClick={() => setProductForm(p => ({ ...p, tags: p.tags.filter((_, i) => i !== idx) }))}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="تگ جدید (مثلا: ارسال رایگان)"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                className={`elegant-input flex-grow`}
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const cleanedTag = sanitize(newTag.trim()).slice(0, 50);
                                  if (!cleanedTag) return;
                                  if (productForm.tags.includes(cleanedTag)) return;
                                  setProductForm(p => ({ ...p, tags: [...p.tags, cleanedTag] }));
                                  setNewTag("");
                                  playInteractionChime("button");
                                }}
                                className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 cursor-pointer shrink-0"
                              >
                                افزودن تگ
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1 text-right">
                            <label className="text-[10px] text-slate-400 font-bold block">توضیحات معرفی کالا:</label>
                            <textarea 
                              rows={3}
                              placeholder="توضیحات کامل برای نمایش در صفحه جزئیات کالا..."
                              value={productForm.description}
                              onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                              className={`w-full p-2.5 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                                isDarkMode ? "bg-slate-800/60 text-slate-100 border border-white/5 focus:border-amber-500/30" : "bg-slate-50 border text-slate-950 border-slate-200"
                              }`}
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-2 border-t border-slate-500/10">
                            <button 
                              type="button"
                              onClick={() => {
                                setIsAddingProduct(false);
                                setEditingProduct(null);
                                playInteractionChime("button");
                              }}
                              className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-all hover:bg-white/10 active:scale-95"
                            >
                              انصراف
                            </button>
                            <button 
                              type="submit"
                              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:from-amber-400 hover:to-amber-500 cursor-pointer transition-all active:scale-95"
                            >
                              {isAddingProduct ? "ثبت و درج در فروشگاه" : "ذخیره تغییرات"}
                            </button>
                          </div>
                          </form>
                          </motion.div>
                        </div>
                      </>
                    )}

                    {/* ADVANCED ADMIN PRODUCTS FILTER BAR */}
                {(isAddingProduct || editingProduct) && (
                    <div className="space-y-6">
                      {!(isAddingProduct || editingProduct) && (
                        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200 shadow"} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right`}>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">جستجوی کالا (نام، شناسه یا مدل انگلیسی):</label>
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder="جستجو کنید..."
                              value={adminProductSearch}
                              onChange={(e) => setAdminProductSearch(e.target.value)}
                              className={`w-full px-4 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 transition-all font-medium ${
                                isDarkMode ? "bg-slate-950 text-slate-100 border-none" : "bg-slate-50 border text-slate-950 border-slate-200"
                              }`}
                            />
                            {adminProductSearch && (
                              <button 
                                onClick={() => setAdminProductSearch("")}
                                className="absolute left-2 top-2 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">فیلتر گروه دسته‌بندی کالاها:</label>
                          {renderAdminSelect(
                            "filter_cat",
                            adminProductCategory,
                            (val) => setAdminProductCategory(val),
                            [{ value: "all", label: "همه دسته‌بندی‌ها" }, ...categories.map(cat => ({ value: cat.id, label: cat.name }))],
                            "همه دسته‌بندی‌ها",
                            isDarkMode
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">فیلتر وضعیت موجودی انبار:</label>
                          {renderAdminSelect(
                            "filter_stock",
                            adminProductStockFilter,
                            (val) => setAdminProductStockFilter(val as any),
                            [
                              { value: "all", label: "مشاهده کل انبار (همه)" },
                              { value: "instock", label: "کالاهای موجود" },
                              { value: "outofstock", label: "کالاهای اتمام موجودی" },
                              { value: "lowstock", label: "کالاهای رو به اتمام (کمتر از ۳ عدد)" },
                            ],
                            "همه",
                            isDarkMode
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold block">مرتب‌سازی بر اساس معیار تجاری:</label>
                          {renderAdminSelect(
                            "filter_sort",
                            adminSortBy,
                            (val) => setAdminSortBy(val as any),
                            [
                              { value: "title-asc", label: "عنوان کالا (صعودی)" },
                              { value: "price-desc", label: "بیشترین قیمت تجاری" },
                              { value: "price-asc", label: "کمترین قیمت تجاری" },
                              { value: "stock-desc", label: "بیشترین موجودی انبار" },
                              { value: "stock-asc", label: "کمترین موجودی انبار" },
                            ],
                            "مرتب‌سازی",
                            isDarkMode
                          )}
                        </div>
                      </div>
                    )}

                    {/* Products organized by Category → Brand hierarchy */}
                    <div className="space-y-3">
                      {(() => {
                        const filteredAll = products.filter(p => {
                          const matchesSearch = p.title.toLowerCase().includes(adminProductSearch.toLowerCase()) || 
                                                p.englishTitle.toLowerCase().includes(adminProductSearch.toLowerCase()) ||
                                                p.id.toLowerCase().includes(adminProductSearch.toLowerCase());
                          const matchesAdminCat = adminProductCategory === "all" || p.category === adminProductCategory;
                          const matchesStock = adminProductStockFilter === "all" ? true :
                                               adminProductStockFilter === "instock" ? p.stock > 0 :
                                               adminProductStockFilter === "outofstock" ? p.stock === 0 :
                                               p.stock <= 3;
                          return matchesSearch && matchesAdminCat && matchesStock;
                        }).sort((a, b) => {
                          if (adminSortBy === "title-asc") return a.title.localeCompare(b.title, "fa");
                          if (adminSortBy === "price-desc") return (b.discountPrice || b.price) - (a.discountPrice || a.price);
                          if (adminSortBy === "price-asc") return (a.discountPrice || a.price) - (b.discountPrice || b.price);
                          if (adminSortBy === "stock-desc") return b.stock - a.stock;
                          if (adminSortBy === "stock-asc") return a.stock - b.stock;
                          return 0;
                        });

                        const hasAny = categories.some(c => filteredAll.some(p => p.category === c.id));
                        if (!hasAny) {
                          return (
                            <div className="p-10 text-center text-slate-400 font-bold leading-relaxed rounded-2xl border border-dashed border-white/10">
                              📭 هیچ کالایی با مشخصات و فیلترهای انتخاب شده یافت نشد.
                            </div>
                          );
                        }

                        return categories.map(cat => {
                          const catProds = filteredAll.filter(p => p.category === cat.id);
                          if (catProds.length === 0) return null;
                          const catBrands = subcategories.filter(s => s.parentId === cat.id);
                          const unbranded = catProds.filter(p => !p.brand);
                          const { emoji } = getCategoryEmojiAndGradient(cat.id, cat.name);

                          return (
                            <div key={cat.id} className={`rounded-2xl border overflow-hidden ${isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"}`}>
                              <div className={`flex items-center justify-between px-4 py-2.5 ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}>
                                <div className="flex items-center gap-2">
                                  <span>{emoji}</span>
                                  <span className="text-xs font-black text-slate-300">{cat.name}</span>
                                  <span className="text-[10px] text-slate-500 font-bold">({catProds.length} کالا)</span>
                                </div>
                              </div>
                              <div className="p-3 space-y-2">
                                {/* Products without brand */}
                                {unbranded.length > 0 && (
                                  <div>
                                    <div className="text-[8px] text-slate-500 font-bold mb-1">بدون برند ({unbranded.length})</div>
                                    {unbranded.map(prod => (
                                      <div key={prod.id} className="flex items-center justify-between bg-black/20 px-2.5 py-1.5 rounded-lg mb-1">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${prod.imageColor} shrink-0 flex items-center justify-center`}>
                                            {renderProductIcon(prod.iconType, "w-3.5 h-3.5")}
                                          </div>
                                          <span className="text-[9px] text-slate-200 font-medium truncate max-w-[100px]">{sanitize(prod.title)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input type="number" value={prod.price}
                                            onChange={(e) => setProducts(prev => prev.map(item => item.id === prod.id ? { ...item, price: Number(e.target.value) } : item))}
                                            className="w-16 px-1 py-0.5 text-[8px] rounded bg-slate-950 text-slate-100 border border-white/5 text-center outline-none" />
                                          <div className="flex items-center gap-0.5 border border-white/5 rounded bg-black/30 px-1 font-mono">
                                            <button onClick={() => { setProducts(prev => prev.map(item => item.id === prod.id ? { ...item, stock: Math.max(0, item.stock - 1) } : item)); playInteractionChime("button"); }} className="w-4 h-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold text-[8px]">-</button>
                                            <span className={`px-1 text-[8px] font-bold min-w-[30px] text-center ${prod.stock === 0 ? "text-rose-500" : prod.stock <= 3 ? "text-yellow-500" : "text-emerald-500"}`}>{toPersianNum(prod.stock)}</span>
                                            <button onClick={() => { setProducts(prev => prev.map(item => item.id === prod.id ? { ...item, stock: item.stock + 1 } : item)); playInteractionChime("button"); }} className="w-4 h-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center justify-center font-bold text-[8px]">+</button>
                                          </div>
                                          <button onClick={() => { setEditingProduct(prod); setProductForm({ ...prod }); setIsAddingProduct(false); }} className="text-[7px] text-amber-500 px-1 hover:bg-white/5 rounded">ویرایش</button>
                                          <button onClick={() => { setConfirmDialog({ message: `حذف "${prod.title}"؟`, onConfirm: () => { setConfirmDialog(null); setProducts(prev => prev.filter(item => item.id !== prod.id)); playInteractionChime("button"); } }); }} className="text-[7px] text-rose-500 px-1 hover:bg-white/5 rounded">حذف</button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Products by brand */}
                                {catBrands.map(brand => {
                                  const brandProds = catProds.filter(p => p.brand === brand.id);
                                  if (brandProds.length === 0) return null;
                                  const isExpanded = expandedProdBrands.includes(brand.id);
                                  return (
                                    <div key={brand.id}>
                                      <div className="flex items-center justify-between mb-1">
                                        {editingBrandId === brand.id ? (
                                          <div className="flex items-center gap-1">
                                            <input type="text" value={editingBrandName} onChange={(e) => setEditingBrandName(e.target.value)} className="px-1.5 py-0.5 text-[8px] rounded bg-slate-950 text-slate-100 border border-amber-500 w-24 outline-none" />
                                            <button onClick={() => { if (!editingBrandName.trim()) return; setSubcategories(prev => prev.map(s => s.id === brand.id ? { ...s, name: editingBrandName.trim() } : s)); setEditingBrandId(null); playInteractionChime("success"); }} className="text-[7px] text-emerald-500 font-bold px-1">ذخیره</button>
                                            <button onClick={() => setEditingBrandId(null)} className="text-[7px] text-slate-500 px-1">لغو</button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => {
                                                setExpandedProdBrands(prev =>
                                                  prev.includes(brand.id) ? prev.filter(id => id !== brand.id) : [...prev, brand.id]
                                                );
                                                playInteractionChime("button");
                                              }}
                                              className="text-[8px] text-slate-500 hover:text-slate-200 w-4 h-4 flex items-center justify-center rounded transition-colors"
                                            >
                                              {isExpanded ? "▼" : "▶"}
                                            </button>
                                            <span className="text-[9px] text-sky-500 font-bold">{brand.name} ({brandProds.length})</span>
                                            <button onClick={() => { setEditingBrandId(brand.id); setEditingBrandName(brand.name); }} className="text-[7px] text-amber-500 px-1 hover:bg-white/5 rounded">ویرایش</button>
                                            <button onClick={() => setConfirmDialog({ message: `آیا برند "${brand.name}" حذف شود؟`, onConfirm: () => { setConfirmDialog(null); setSubcategories(prev => prev.filter(s => s.id !== brand.id)); setProducts(prev => prev.map(p => p.brand === brand.id ? { ...p, brand: "" } : p)); playInteractionChime("success"); } })} className="text-[7px] text-rose-500 px-1 hover:bg-white/5 rounded">حذف</button>
                                          </div>
                                        )}
                                        {!isExpanded && (
                                          <span className="text-[7px] text-slate-600">{brandProds.length} کالا</span>
                                        )}
                                      </div>
                                      {isExpanded && (
                                        <>
                                          {brandProds.map(prod => (
                                            <div key={prod.id} className="flex items-center justify-between bg-black/20 px-2.5 py-1.5 rounded-lg mb-1">
                                              <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${prod.imageColor} shrink-0 flex items-center justify-center`}>
                                                  {renderProductIcon(prod.iconType, "w-3.5 h-3.5")}
                                                </div>
                                                <span className="text-[9px] text-slate-200 font-medium truncate max-w-[100px]">{sanitize(prod.title)}</span>
                                                <span className="text-[8px] text-emerald-500 font-bold">{prod.price.toLocaleString()}</span>
                                                <span className={`text-[8px] font-bold ${prod.stock === 0 ? "text-rose-500" : prod.stock <= 3 ? "text-yellow-500" : "text-sky-400"}`}>{prod.stock > 0 ? `${toPersianNum(prod.stock)}عدد` : "ناموجود"}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                <button onClick={() => { setEditingProduct(prod); setProductForm({ ...prod }); setIsAddingProduct(false); }} className="text-[7px] text-amber-500 px-1 hover:bg-white/5 rounded">ویرایش</button>
                                                <button onClick={() => { setConfirmDialog({ message: `حذف "${prod.title}"؟`, onConfirm: () => { setConfirmDialog(null); setProducts(prev => prev.filter(item => item.id !== prod.id)); playInteractionChime("button"); } }); }} className="text-[7px] text-rose-500 px-1 hover:bg-white/5 rounded">حذف</button>
                                              </div>
                                            </div>
                                          ))}
                                          {/* Add product for this brand */}
                                          <button onClick={() => {
                                            setProductForm({
                                              id: "p_" + Date.now(), title: "", englishTitle: "", price: 0,
                                              discountPrice: undefined, rating: 5, category: cat.id, brand: brand.id,
                                              imageColor: "from-slate-800 to-slate-950",
                                              imagePattern: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
                                              iconType: "watch", imageUrl: "", images: [], description: "",
                                              specs: [], stock: 10, tags: [], reviews: []
                                            });
                                            setIsAddingProduct(true);
                                            playInteractionChime("button");
                                          }} className="w-full mt-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded-lg cursor-pointer border border-dashed border-amber-500/30 hover:border-amber-500/50 transition-all">
                                            + افزودن کالا به برند {brand.name}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                                {/* Add brand form */}
                                <div className="flex items-center gap-1 pr-2 pt-1">
                                  <input type="text" placeholder="نام برند جدید..." value={brandFormParent === cat.id ? brandFormName : ""}
                                    onChange={(e) => { setBrandFormName(e.target.value); setBrandFormParent(cat.id); }}
                                    className="flex-1 px-1.5 py-1 text-[8px] rounded outline-none bg-slate-950 text-slate-100 border border-white/5" />
                                  <button onClick={() => {
                                    if (!brandFormName.trim() || brandFormParent !== cat.id) return;
                                    const brandId = brandFormName.trim().toLowerCase().replace(/\s+/g, "_");
                                    if (subcategories.some(s => s.id === brandId && s.parentId === cat.id)) { showToast("این برند قبلاً ثبت شده.", "warning"); return; }
                                    setSubcategories(prev => [...prev, { id: brandId, name: brandFormName.trim(), parentId: cat.id }]);
                                    setBrandFormName(""); setBrandFormParent(""); playInteractionChime("success");
                                  }} className="px-2 py-1 bg-amber-500 text-slate-950 text-[8px] font-bold rounded-lg cursor-pointer hover:bg-amber-400 shrink-0">+برند</button>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                  </div>
                )}

                {/* SUB TAB VIEW: CATEGORIES MANAGEMENT */}
                {adminSubTab === "categories" && (
                  <div className="space-y-5 animate-fade-slide-up text-right" dir="rtl">

                    {/* Product Search & Filter Bar */}
                    <div className="glass-card p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">جستجوی کالا:</label>
                        <div className="relative">
                          <input type="text" placeholder="نام، شناسه یا مدل..." value={adminProductSearch}
                            onChange={(e) => setAdminProductSearch(e.target.value)}
                            className="elegant-input pl-7" />
                          {adminProductSearch && (
                            <button onClick={() => setAdminProductSearch("")}
                              className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">دسته‌بندی:</label>
                        {renderAdminSelect("cat_filter", adminProductCategory, (val) => setAdminProductCategory(val),
                          [{ value: "all", label: "همه دسته‌بندی‌ها" }, ...categories.map(cat => ({ value: cat.id, label: cat.name }))],
                          "همه", isDarkMode)}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">موجودی:</label>
                        {renderAdminSelect("stock_filter", adminProductStockFilter, (val) => setAdminProductStockFilter(val as any), [
                          { value: "all", label: "همه" },
                          { value: "instock", label: "کالاهای موجود" },
                          { value: "outofstock", label: "ناموجود" },
                          { value: "lowstock", label: "کمتر از ۳ عدد" },
                        ], "همه", isDarkMode)}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">مرتب‌سازی:</label>
                        {renderAdminSelect("sort_filter", adminSortBy, (val) => setAdminSortBy(val as any), [
                          { value: "title-asc", label: "عنوان کالا" },
                          { value: "price-desc", label: "بیشترین قیمت" },
                          { value: "price-asc", label: "کمترین قیمت" },
                          { value: "stock-desc", label: "بیشترین موجودی" },
                          { value: "stock-asc", label: "کمترین موجودی" },
                        ], "مرتب‌سازی", isDarkMode)}
                      </div>
                    </div>

                    <div className="space-y-6">
                      
                      {/* Full-width Create New Category Form */}
                      <div className="w-full space-y-4 text-right">
                        <div className="flex items-center gap-2 pb-3">
                          <PlusCircle className="w-5 h-5 text-amber-500" />
                          <h3 className="text-xs font-black text-slate-200">افزودن دسته‌بندی تجاری جدید</h3>
                        </div>

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmedName = catFormName.trim();
                            const trimmedId = catFormId.trim().toLowerCase().replace(/\s+/g, "-");

                            if (!trimmedName) {
                              showToast("نام دسته‌بندی الزامی است.", "warning");
                              return;
                            }
                            if (!trimmedId) {
                              showToast("شناسه یکتا (کد دسته‌بندی) الزامی است.", "warning");
                              return;
                            }
                            if (categories.some(c => c.id === trimmedId || c.name.toLowerCase() === trimmedName.toLowerCase())) {
                              showToast("دسته‌بندی با این نام یا شناسه از قبل وجود دارد.", "error");
                              return;
                            }

                            setCategories(prev => [...prev, { id: trimmedId, name: trimmedName }]);
                            setCatFormName("");
                            setCatFormId("");
                            playInteractionChime("success");
                          }}
                          className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 text-right w-full"
                        >
                          <div className="space-y-1 w-full lg:flex-1 min-w-0">
                            <input 
                              type="text"
                              placeholder="نام فارسی دسته‌بندی - مثال: قطعات جانبی پرمیوم"
                              value={catFormName}
                              onChange={(e) => {
                                setCatFormName(e.target.value);
                              }}
                              className={`w-full px-4 py-2.5 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 transition-all border ${
                                isDarkMode ? "bg-slate-950 text-slate-100 border-slate-700/50" : "bg-slate-50 text-slate-950 border-slate-200"
                              }`}
                            />
                          </div>

                          <div className="space-y-1 w-full lg:flex-1 min-w-0">
                            <input 
                              type="text"
                              placeholder="شناسه انگلیسی (ID یکتا) - فقط حروف کوچک، عدد و خط تیره"
                              value={catFormId}
                              onChange={(e) => setCatFormId(e.target.value.toLowerCase().replace(/[^a-z0-0-_]/g, ""))}
                              className={`w-full px-4 py-2.5 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono transition-all text-right border ${
                                isDarkMode ? "bg-slate-950 text-slate-100 border-slate-700/50" : "bg-slate-50 text-slate-950 border-slate-200"
                              }`}
                            />
                          </div>

                          <button 
                            type="submit"
                            className="w-full lg:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <PlusCircle className="w-4.5 h-4.5" />
                            <span>ثبت و استقرار دسته‌بندی</span>
                          </button>
                        </form>
                      </div>

                      {/* Full-width Category List Board */}
                      <div className="w-full space-y-4 text-right">
                        
                        {/* Migration / Safe Delete Dialog Context */}
                        {catToDelete && (
                          <div className="p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-4 animate-in fade-in duration-200 text-right">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-amber-500" />
                              <h4 className="text-xs font-black text-amber-400">انتقال امن محصولات دسته‌بندی: {catToDelete.name}</h4>
                            </div>
                            <p className="text-xxs text-slate-300 leading-relaxed text-right">
                              دسته‌بندی <strong className="text-amber-400">«{catToDelete.name}»</strong> شامل <strong className="text-amber-400">{toPersianNum(products.filter(p => p.category === catToDelete.id).length)}</strong> کالا می‌باشد. جهت حفظ موجودی کل، لطفاً مشخص کنید کالاهای موجود در این گروه به کدام گروه جدید منتقل شوند:
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 items-end text-right">
                              <div className="flex-grow space-y-1 block text-right w-full">
                                <label className="text-[10px] text-slate-400 font-bold block pb-1">انتخاب دسته‌بندی مقصد ادغام:</label>
                                {renderAdminSelect(
                                  "merge_cat",
                                  deleteMigrationTargetId,
                                  (val) => setDeleteMigrationTargetId(val),
                                  [{ value: "", label: "-- یک دسته‌بندی را انتخاب کنید --" }, ...categories.filter(c => c.id !== catToDelete.id).map(c => ({ value: c.id, label: c.name }))],
                                  "انتخاب کنید",
                                  isDarkMode
                                )}
                              </div>

                              <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                                <button 
                                  onClick={() => {
                                    if (!deleteMigrationTargetId) {
                                      showToast("لطفاً ابتدا دسته‌بندی مقصد را مشخص کنید.", "warning");
                                      return;
                                    }
                                    
                                    // 1. Migrate products
                                    setProducts(prev => prev.map(p => p.category === catToDelete.id ? { ...p, category: deleteMigrationTargetId } : p));
                                    
                                    // 2. Delete the category
                                    setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
                                    
                                    // Reset deletion states
                                    setCatToDelete(null);
                                    setDeleteMigrationTargetId("");
                                    playInteractionChime("success");
                                    showToast("محصولات منتقل شدند و دسته‌بندی قبلی منحل گردید.", "success");
                                  }}
                                  className="px-5 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer hover:bg-amber-400 shrink-0"
                                >
                                  تایید انتقال و انحلال گروه
                                </button>
                                <button 
                                  onClick={() => { setCatToDelete(null); setDeleteMigrationTargetId(""); playInteractionChime("button"); }}
                                  className="px-4 py-2 bg-white/5 border border-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                                >
                                  لغو
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {categories.length === 0 ? (
                          <div className={`glass-card p-10 text-center space-y-2`}>
                            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
                            <h4 className="text-sm font-black text-slate-300 font-sans">هیچ دسته‌بندی تجاری ثبت نشده است</h4>
                            <p className="text-xxs text-slate-500 font-sans">جهت سازمان‌دهی کاتالوگ فروشگاه، یک دسته‌بندی جدید در فرم کناری ایجاد کنید.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                            {categories.map((cat, idx) => {
                              const relatedProducts = products.filter(p => p.category === cat.id);
                              const isExpanded = expandedCatProductsId === cat.id;

                              return (
                                <div key={cat.id} className={`p-5 rounded-2xl border bg-slate-900/40 relative flex flex-col justify-between gap-4 border-slate-800 transition-all ${isExpanded ? "md:col-span-2 border-amber-500/20 bg-amber-500/[0.01]" : ""}`}>
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <div className="space-y-1 text-right">
                                        {catEditingId === cat.id ? (
                                          <div className="flex gap-2 items-center text-right">
                                            <input 
                                              type="text"
                                              value={catEditingName}
                                              onChange={(e) => setCatEditingName(e.target.value)}
                                              className="px-2.5 py-1 text-xs rounded-lg outline-none bg-slate-950 text-slate-100 border border-amber-500 w-44 font-black"
                                            />
                                            <button 
                                              onClick={() => {
                                                if (!catEditingName.trim()) return;
                                                setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: catEditingName.trim() } : c));
                                                setCatEditingId(null);
                                                playInteractionChime("success");
                                              }}
                                              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded"
                                            >
                                              ذخیره
                                            </button>
                                            <button 
                                              onClick={() => setCatEditingId(null)}
                                              className="px-2 py-1 bg-white/5 text-slate-400 text-[10px] text-center rounded"
                                            >
                                              انصراف
                                            </button>
                                          </div>
                                        ) : (
                                          <h4 className="text-xs sm:text-sm font-black text-slate-200">{cat.name}</h4>
                                        )}
                                        <p className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider text-right">{cat.id}</p>
                                      </div>

                                      <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-700/30 text-[10px] text-slate-400 font-bold font-sans">
                                        📚 {toPersianNum(relatedProducts.length)} کالا
                                      </span>
                                    </div>
                                  </div>

                                  {/* Expand Products Section for this Category */}
                                  {isExpanded && (
                                    <div className="border-t border-white/5 mt-2 pt-4 space-y-3 animate-in fade-in duration-300 text-right">
                                      <div className="flex justify-between items-center pb-1 text-right">
                                        <h5 className="text-[11px] font-black text-slate-300 font-sans">کالاهای موجود در گروه «{cat.name}»:</h5>
                                        <span className="text-[10px] text-slate-400 font-sans">تغییر موجودی، قیمت و گروه به صورت آنی:</span>
                                      </div>

                                      {relatedProducts.length === 0 ? (
                                        <p className="text-[10px] text-slate-500 p-4 text-center">📭 هیچ کالایی در این دسته‌بندی هنوز فرود نیامده است.</p>
                                      ) : (
                                          <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40 max-h-72 overflow-y-auto w-full">
                                          <table className="elegant-table text-[10px]">
                                            <thead>
                                              <tr>
                                                <th>شناسه</th>
                                                <th>عنوان محصول</th>
                                                <th>موجودی</th>
                                                <th>قیمت (تومان)</th>
                                                <th className="text-center">تغییر دسته</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {relatedProducts.map(p => (
                                                <tr key={p.id}>
                                                  <td className="text-[9px] font-bold text-slate-500">{p.id}</td>
                                                  <td className="font-medium text-slate-200 min-w-[120px] max-w-xs truncate">{sanitize(p.title)}</td>
                                                  <td className="p-2">
                                                    <div className="flex items-center gap-1">
                                                      <button 
                                                        onClick={() => {
                                                          setProducts(prev => prev.map(item => item.id === p.id ? { ...item, stock: Math.max(0, item.stock - 1) } : item));
                                                        }}
                                                        className="w-4.5 h-4.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded font-black flex items-center justify-center text-[10px]"
                                                      >
                                                        -
                                                      </button>
                                                      <span className="w-8 text-center text-slate-200 font-bold">{toPersianNum(p.stock)}</span>
                                                      <button 
                                                        onClick={() => {
                                                          setProducts(prev => prev.map(item => item.id === p.id ? { ...item, stock: item.stock + 1 } : item));
                                                        }}
                                                        className="w-4.5 h-4.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded font-black flex items-center justify-center text-[10px]"
                                                      >
                                                        +
                                                      </button>
                                                    </div>
                                                  </td>
                                                  <td className="p-2">
                                                    <input 
                                                      type="number"
                                                      value={p.price}
                                                      onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setProducts(prev => prev.map(item => item.id === p.id ? { ...item, price: val } : item));
                                                      }}
                                                      className="w-20 px-1.5 py-0.5 bg-black/40 text-slate-100 text-[10px] border border-white/5 rounded text-center focus:outline-none"
                                                    />
                                                  </td>
                                                    <td className="p-2 font-sans text-center">
                                                      {renderAdminSelect(
                                                        "inline_cat_" + p.id,
                                                        p.category,
                                                        (val) => { setProducts(prev => prev.map(item => item.id === p.id ? { ...item, category: val } : item)); playInteractionChime("success"); },
                                                        categories.map(c => ({ value: c.id, label: c.name })),
                                                        "دسته",
                                                        isDarkMode,
                                                        "!h-6 !text-[9px] !py-0 !px-2"
                                                      )}
                                                    </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => {
                                          setExpandedCatProductsId(isExpanded ? null : cat.id);
                                          playInteractionChime("button");
                                        }}
                                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-[10px] rounded-lg cursor-pointer font-bold"
                                      >
                                        {isExpanded ? "بستن لیست" : "مشاهده کالاها"}
                                      </button>
                                      
                                      <button 
                                        onClick={() => {
                                          setCatEditingId(cat.id);
                                          setCatEditingName(cat.name);
                                          playInteractionChime("button");
                                        }}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] rounded-lg cursor-pointer"
                                      >
                                        ویرایش عنوان
                                      </button>
                                    </div>

                                    <button 
                                      onClick={() => {
                                        if (relatedProducts.length > 0) {
                                          setCatToDelete(cat);
                                          setDeleteMigrationTargetId("");
                                          playInteractionChime("button");
                                        } else {
                                          setConfirmDialog({
                                            message: `آیا از حذف دسته‌بندی خالی ${cat.name} مطمئن هستید؟`,
                                            onConfirm: () => {
                                              setConfirmDialog(null);
                                              setCategories(prev => prev.filter(c => c.id !== cat.id));
                                              playInteractionChime("success");
                                            }
                                          });
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] rounded-lg cursor-pointer font-bold"
                                    >
                                      حذف گروه
                                    </button>
                                  </div>

                                  {/* Brand/subcategory management */}
                                  <div className="border-t border-white/5 pt-3 mt-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] text-slate-500 font-bold">برندهای این دسته</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      {(() => {
                                        const brands = subcategories.filter(s => s.parentId === cat.id);
                                        return brands.length === 0 ? (
                                          <p className="text-[9px] text-slate-500">هیچ برندی تعریف نشده</p>
                                        ) : (
                                          brands.map(sub => {
                                            const brandProds = products.filter(p => p.brand === sub.id);
                                            return (
                                              <div key={sub.id} className="bg-black/20 px-3 py-1.5 rounded-lg">
                                                {editingBrandId === sub.id ? (
                                                  <div className="flex gap-1.5 items-center">
                                                    <input
                                                      type="text"
                                                      value={editingBrandName}
                                                      onChange={(e) => setEditingBrandName(e.target.value)}
                                                      className="px-2 py-0.5 text-[10px] rounded bg-slate-950 text-slate-100 border border-amber-500 w-28 outline-none"
                                                    />
                                                    <button
                                                      onClick={() => {
                                                        if (!editingBrandName.trim()) return;
                                                        setSubcategories(prev => prev.map(s => s.id === sub.id ? { ...s, name: editingBrandName.trim() } : s));
                                                        setEditingBrandId(null);
                                                        playInteractionChime("success");
                                                      }}
                                                      className="text-[9px] text-emerald-500 font-bold px-1.5 py-0.5"
                                                    >
                                                      ذخیره
                                                    </button>
                                                    <button
                                                      onClick={() => setEditingBrandId(null)}
                                                      className="text-[9px] text-slate-500 px-1.5 py-0.5"
                                                    >
                                                      لغو
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-1.5">
                                                        <button
                                                          onClick={() => {
                                                            setExpandedBrandProducts(prev => {
                                                              const next = prev === sub.id ? null : sub.id;
                                                              if (next) { setAddBrandProdTitle(""); setAddBrandProdPrice(""); setAddBrandProdStock(""); }
                                                              return next;
                                                            });
                                                            playInteractionChime("button");
                                                          }}
                                                          className="text-[9px] text-slate-400 hover:text-slate-200"
                                                        >
                                                          {expandedBrandProducts === sub.id ? "▼" : "▶"}
                                                        </button>
                                                        <span className="text-[10px] text-slate-300 font-bold">{sub.name}</span>
                                                        <span className="text-[8px] text-slate-500">({brandProds.length})</span>
                                                      </div>
                                                      {expandedBrandProducts === sub.id ? (
                                                        <div className="flex gap-1.5">
                                                          <button
                                                            onClick={() => { setEditingBrandId(sub.id); setEditingBrandName(sub.name); }}
                                                            className="text-[9px] text-amber-500 px-1.5 py-0.5 rounded hover:bg-white/5"
                                                          >
                                                            ویرایش
                                                          </button>
                                                          <button
                                                            onClick={() => {
                                                              setConfirmDialog({
                                                                message: `آیا برند "${sub.name}" حذف شود؟`,
                                                                onConfirm: () => {
                                                                  setConfirmDialog(null);
                                                                  setSubcategories(prev => prev.filter(s => s.id !== sub.id));
                                                                  setProducts(prev => prev.map(p => p.brand === sub.id ? { ...p, brand: "" } : p));
                                                                  playInteractionChime("success");
                                                                }
                                                              });
                                                            }}
                                                            className="text-[9px] text-rose-500 px-1.5 py-0.5 rounded hover:bg-white/5"
                                                          >
                                                            حذف
                                                          </button>
                                                        </div>
                                                      ) : (
                                                        <span className="text-[7px] text-slate-600">{brandProds.length} کالا</span>
                                                      )}
                                                    </div>
                                                    {expandedBrandProducts === sub.id && (
                                                      <div className="mt-2 pr-2 space-y-1 border-r border-white/10 mr-1">
                                                        {brandProds.length === 0 ? (
                                                          <p className="text-[8px] text-slate-500 py-1">هیچ کالایی برای این برند ثبت نشده</p>
                                                        ) : (
                                                          brandProds.map(prod => (
                                                            <div key={prod.id} className="flex items-center justify-between bg-black/30 px-2 py-1 rounded">
                                                          <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] text-slate-200 font-medium truncate max-w-[80px]">{prod.title}</span>
                                                            <span className="text-[7px] text-emerald-500 font-bold">{prod.price.toLocaleString()}</span>
                                                            <span className={`text-[7px] ${prod.stock > 0 ? 'text-sky-400' : 'text-rose-400'}`}>{prod.stock > 0 ? `${prod.stock}عدد` : 'ناموجود'}</span>
                                                          </div>
                                                          <div className="flex gap-1">
                                                            <button
                                                              onClick={() => {
                                                                setEditingProduct(prod);
                                                                setProductForm({ ...prod });
                                                                setIsAddingProduct(false);
                                                              }}
                                                              className="text-[7px] text-amber-500 px-1 hover:bg-white/5 rounded"
                                                            >
                                                              ویرایش
                                                            </button>
                                                            <button
                                                              onClick={() => {
                                                                setConfirmDialog({
                                                                  message: `آیا کالای "${prod.title}" حذف شود؟`,
                                                                  onConfirm: () => {
                                                                    setConfirmDialog(null);
                                                                    setProducts(prev => prev.filter(p => p.id !== prod.id));
                                                                    playInteractionChime("success");
                                                                  }
                                                                });
                                                              }}
                                                              className="text-[7px] text-rose-500 px-1 hover:bg-white/5 rounded"
                                                            >
                                                              حذف
                                                            </button>
                                                          </div>
                                                            </div>
                                                          ))
                                                        )}
                                                        <button onClick={() => {
                                                          setProductForm({
                                                            id: "p_" + Date.now(),
                                                            title: "",
                                                            englishTitle: "",
                                                            price: 0,
                                                            discountPrice: undefined,
                                                            rating: 5,
                                                            category: cat.id,
                                                            brand: sub.id,
                                                            imageColor: "from-slate-800 to-slate-950",
                                                            imagePattern: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
                                                            iconType: "watch",
                                                            imageUrl: "",
                                                            images: [],
                                                            description: "",
                                                            specs: [],
                                                            stock: 10,
                                                            tags: [],
                                                            reviews: []
                                                          });
                                                          setIsAddingProduct(true);
                                                          playInteractionChime("button");
                                                        }} className="w-full mt-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded-lg cursor-pointer border border-dashed border-amber-500/30 hover:border-amber-500/50 transition-all">
                                                          + افزودن کالا به برند {sub.name}
                                                        </button>
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            );
                                          })
                                        );
                                      })()}
                                    </div>
                                    <div className="flex gap-1.5 mt-2">
                                      <input
                                        type="text"
                                        placeholder="نام برند جدید..."
                                        value={brandFormParent === cat.id ? brandFormName : ""}
                                        onChange={(e) => { setBrandFormName(e.target.value); setBrandFormParent(cat.id); }}
                                        className="flex-1 px-2 py-1 text-[10px] rounded-lg outline-none bg-slate-950 text-slate-100 border border-white/5"
                                      />
                                      <button
                                        onClick={() => {
                                          if (!brandFormName.trim() || brandFormParent !== cat.id) return;
                                          const brandId = brandFormName.trim().toLowerCase().replace(/\s+/g, "_");
                                          if (subcategories.some(s => s.id === brandId && s.parentId === cat.id)) {
                                            showToast("این برند قبلاً ثبت شده.", "warning");
                                            return;
                                          }
                                          setSubcategories(prev => [...prev, { id: brandId, name: brandFormName.trim(), parentId: cat.id }]);
                                          setBrandFormName("");
                                          setBrandFormParent("");
                                          playInteractionChime("success");
                                        }}
                                        className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-amber-400 shrink-0"
                                      >
                                        افزودن
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* SUB TAB VIEW 3: INCOMING ORDER STATUS MONITOR */}
                {adminSubTab === "orders" && (
                  <div className="space-y-6">

                    <div className="space-y-4">
                      {orders.length === 0 ? (
                        <div className={`glass-card p-10 text-center space-y-2`}>
                          <p className="text-xs text-slate-400">تاکنون فاکتور یا سفارشی پستی در بازار ثبت نگردیده است.</p>
                        </div>
                      ) : (
                        orders.map((order) => {
                          return (
                            <div 
                              key={order.id}
                              className={`p-4 md:p-6 rounded-3xl border transition-all duration-300 ${
                                isDarkMode 
                                  ? "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/30 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5" 
                                  : "bg-white border-slate-200 shadow-md hover:shadow-lg hover:shadow-amber-500/5"
                              } space-y-5 text-xs`}
                            >
                              {/* Order Metadata Block Header */}
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-500/10 pb-4">
                                <div className="space-y-1.5 text-right">
                                  <h5 className="font-extrabold text-sm flex items-center gap-2 justify-start">
                                    <span>سفارش: <strong className="font-mono text-amber-500 text-base">{order.id}</strong></span>
                                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                                      order.status === "delivered" 
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                                        : order.status === "shipped" 
                                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
                                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse"
                                    }`}>
                                      {order.status === "pending" ? "منتظر تایید" :
                                       order.status === "preparing" ? "در انبار آماده‌سازی" :
                                       order.status === "shipped" ? "تحویل داده شده به مأمور پست" : "تحویل نهایی مشتری"}
                                    </span>
                                  </h5>
                                  <p className="text-[10px] md:text-[11px] text-slate-500 flex items-center gap-1.5">
                                    <span>مورخ ثبت: {order.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600/40 inline-block"></span>
                                    <span>تسویه از طریق: {order.paymentMethod}</span>
                                  </p>
                                </div>

                                <div className="text-left font-mono font-bold text-sm md:text-base">
                                  <span className="text-slate-500 text-[10px] md:text-[11px] font-normal">مبلغ کل فاکتور: </span>
                                  <strong className="text-emerald-400 text-lg md:text-xl">{toPersianNum(order.total)}</strong>
                                  <span className="text-[10px] text-slate-500 mr-1">تومان</span>
                                </div>
                              </div>

                              {/* Order Status Visual Progress */}
                              <div className="hidden md:flex items-center gap-0 py-1">
                                {[
                                  { key: "pending", label: "ثبت سفارش" },
                                  { key: "preparing", label: "آماده‌سازی" },
                                  { key: "shipped", label: "ارسال به پست" },
                                  { key: "delivered", label: "تحویل نهایی" },
                                ].map((step, si) => {
                                  const steps = ["pending", "preparing", "shipped", "delivered"];
                                  const currentIdx = steps.indexOf(order.status);
                                  const stepIdx = steps.indexOf(step.key);
                                  const done = stepIdx <= currentIdx;
                                  const isLast = si === 3;
                                  return (
                                    <div key={step.key} className="flex items-center flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                                          done ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-500 border border-slate-700/50"
                                        }`}>
                                          {done ? "✓" : si + 1}
                                        </span>
                                        <span className={`text-[9px] font-bold ${done ? "text-amber-400" : "text-slate-600"}`}>
                                          {step.label}
                                        </span>
                                      </div>
                                      {!isLast && (
                                        <div className={`flex-1 h-px mx-2 ${done ? "bg-amber-500/40" : "bg-slate-700/30"}`} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Order items and client data bento grid splits */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 text-right">
                                
                                {/* Client shipment coordinates column (Md: 5/12) */}
                                <div className="md:col-span-12 lg:col-span-5 p-4 md:p-5 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-600/20 space-y-3 text-right">
                                  <h6 className="font-black text-[10px] md:text-[11px] text-slate-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" />اطلاعات گیرنده و آدرس مرسوله:</h6>
                                  <div className="space-y-2 text-xs md:text-[11px] font-medium leading-relaxed">
                                    <p className="flex items-center gap-2"><span className="text-slate-500 w-20 shrink-0">نام کامل:</span> <strong>{sanitize(order.shippingInfo.fullName)}</strong></p>

                                    <p className="flex items-center gap-2"><span className="text-slate-500 w-20 shrink-0">موبایل:</span> <strong className="font-mono">{sanitize(order.shippingInfo.phone)}</strong></p>

                                    <p className="flex items-center gap-2"><span className="text-slate-500 w-20 shrink-0">کدپستی:</span> <strong className="font-mono">{sanitize(order.shippingInfo.postalCode)}</strong></p>

                                    <p className="flex items-center gap-2"><span className="text-slate-500 w-20 shrink-0">استان/شهر:</span> <strong>{sanitize(order.shippingInfo.city)}</strong></p>

                                    <p className="flex items-start gap-2"><span className="text-slate-500 w-20 shrink-0 mt-0.5">نشانی:</span> <span className="text-slate-300 leading-relaxed">{sanitize(order.shippingInfo.address)}</span></p>
                                  </div>
                                </div>

                                {/* Items structured listing (Md: 7/12) */}
                                <div className="md:col-span-12 lg:col-span-7 space-y-3">
                                  <div className="grid grid-cols-1 gap-2 md:gap-3">
                                    {order.items.map((it, itemIdx) => (
                                      <div key={itemIdx} className="p-3 md:p-4 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-600/15 hover:border-amber-500/20 transition-all flex gap-3 items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                          {renderProductIcon(it.product.iconType, "w-7 h-7 md:w-9 md:h-9 shrink-0")}
                                          <div className="min-w-0">
                                            <h6 className="font-bold text-[12px] md:text-sm truncate max-w-[200px] md:max-w-[350px]">{it.product.title}</h6>
                                            <span className="text-[10px] text-slate-500 font-mono tracking-wide">{it.product.englishTitle}</span>
                                          </div>
                                        </div>
                                        <span className="bg-amber-500/15 text-amber-400 px-3.5 py-1.5 rounded-lg font-bold font-mono shrink-0 text-[12px] md:text-sm">
                                          {toPersianNum(it.quantity)} عدد
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Admin Change Order Processing Status */}
                                  <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-r from-amber-500/8 to-amber-500/3 border border-amber-500/15 space-y-2.5">
                                    <div className="flex items-center gap-2.5 w-full">
                                      <span className="text-[10.5px] md:text-[11px] text-slate-400 font-bold shrink-0">کد مرسوله:</span>
                                      <input 
                                        type="text" 
                                        value={order.trackingNumber} 
                                        onChange={(e) => {
                                          const nextNum = e.target.value;
                                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, trackingNumber: nextNum } : o));
                                        }}
                                        className={`px-2.5 md:px-3 py-1.5 md:py-2 font-mono text-[11px] md:text-xs rounded-lg tracking-wider font-bold w-full max-w-[160px] transition-all focus:ring-2 focus:ring-amber-500/30 ${
                                          isDarkMode ? "bg-slate-950 text-amber-400 border border-slate-700/50" : "bg-white border text-amber-600 border-slate-200"
                                        }`}
                                      />
                                    </div>
                                    <div className="flex gap-1.5 w-full justify-start flex-nowrap md:flex-wrap">
                                      <button 
                                        onClick={() => {
                                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "preparing" } : o));
                                          playInteractionChime("button");
                                        }}
                                        className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black cursor-pointer whitespace-nowrap transition-all hover:scale-105 active:scale-95 ${
                                          order.status === "preparing" 
                                            ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" 
                                            : "bg-white/5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-slate-700/20"
                                        }`}
                                      >
                                        <span className="md:hidden">آماده‌سازی</span>
                                        <span className="hidden md:inline">آماده‌سازی</span>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "shipped" } : o));
                                          playInteractionChime("success");
                                        }}
                                        className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black cursor-pointer whitespace-nowrap transition-all hover:scale-105 active:scale-95 ${
                                          order.status === "shipped" 
                                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
                                            : "bg-white/5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-slate-700/20"
                                        }`}
                                      >
                                        <span className="md:hidden">ارسال به پست</span>
                                        <span className="hidden md:inline">ارسال به پست</span>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "delivered" } : o));
                                          playInteractionChime("success");
                                        }}
                                        className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black cursor-pointer whitespace-nowrap transition-all hover:scale-105 active:scale-95 ${
                                          order.status === "delivered" 
                                            ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                                            : "bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-slate-700/20"
                                        }`}
                                      >
                                        <span className="md:hidden">تحویل خریدار</span>
                                        <span className="hidden md:inline">تحویل خریدار</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                              </div>

                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>
                )}

                {/* SUB TAB VIEW 4: PROMO COUPONS MANAGER */}
                {adminSubTab === "coupons" && (
                  <div className="space-y-6">

                    <div className="space-y-6">
                      
                      {/* Form row */}
                      <div className="w-full space-y-4 text-right">
                        <h5 className="font-extrabold text-xs text-amber-500">فرم افزودن کد کوپن تخفیف:</h5>
                        
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!couponForm.code.trim()) { showToast("کد تخفیف نمی‌تواند خالی باشد.", "warning"); return; }
                            const match = coupons.find(c => c.code.trim().toUpperCase() === couponForm.code.trim().toUpperCase());
                            if (match) { showToast("این کد تخفیف قبلاً ایجاد شده است.", "error"); return; }

                            setCoupons(prev => [couponForm, ...prev]);
                            setCouponForm({ code: "", discountPercent: 10, minSpend: 0 });
                            playInteractionChime("success");
                          }}
                          className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 w-full"
                        >
                          <div className="space-y-1 w-full lg:flex-1">
                            <label className="text-[10px] text-slate-400 font-bold block">کد کوپن (حروف انگلیسی یونیک):</label>
                            <input 
                              type="text"
                              placeholder="مثال: WINTER70"
                              value={couponForm.code}
                              onChange={(e) => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                              className={`elegant-input uppercase font-mono tracking-wider`}
                            />
                          </div>

                          <div className="space-y-1 w-full lg:w-40">
                            <label className="text-[10px] text-slate-400 font-bold block">درصد تخفیف:</label>
                            <input 
                              type="number"
                              min={5}
                              max={95}
                              placeholder="20"
                              value={couponForm.discountPercent}
                              onChange={(e) => setCouponForm(p => ({ ...p, discountPercent: Number(e.target.value) }))}
                              className={`elegant-input font-mono`}
                            />
                          </div>

                          <div className="space-y-1 w-full lg:flex-1">
                            <label className="text-[10px] text-slate-400 font-bold block">حداقل خرید (تومان):</label>
                            <input 
                              type="number"
                              placeholder="مثال: ۱۰۰۰۰۰"
                              value={couponForm.minSpend || ""}
                              onChange={(e) => setCouponForm(p => ({ ...p, minSpend: Number(e.target.value) }))}
                              className={`elegant-input font-mono`}
                            />
                          </div>

                          <button 
                            type="submit"
                            className="w-full lg:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md cursor-pointer shrink-0"
                          >
                            درج و راه‌اندازی کمپین
                          </button>
                        </form>
                      </div>

                      {/* Table row */}
                      <div className="w-full space-y-3">
                        <h5 className="font-extrabold text-xs text-slate-300 text-right">کمپین‌های تخفیفی فعال کدهای وفاداری:</h5>
                        
                        <div className="overflow-x-auto rounded-3xl border border-white/5">
                          <table className="w-full text-right text-xs">
                            <thead className={`text-[10.5px] text-slate-400 border-b border-white/5 ${isDarkMode ? "bg-slate-950" : "bg-slate-100"}`}>
                              <tr>
                                <th className="p-3">کد کوپن</th>
                                <th className="p-3">نسبت کسر تخفیف</th>
                                <th className="p-3">حداقل خرید فعال‌کننده</th>
                                <th className="p-3 text-center">انحلال</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {coupons.map((c) => (
                                <tr key={c.code} className="hover:bg-black/10 transition-colors">
                                  <td className="p-3 font-mono font-black text-amber-500 tracking-wider">
                                    {c.code}
                                  </td>
                                  <td className="p-3 font-bold">
                                    {toPersianNum(c.discountPercent)}٪ تخفیف کل
                                  </td>
                                  <td className="p-3 font-mono font-bold">
                                    {c.minSpend === 0 ? "بدون محدودیت" : `${toPersianNum(c.minSpend)} تومان`}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button 
                                      onClick={() => {
                                        setConfirmDialog({
                                          message: `آیا واقعا می‌خواهید کد تخفیف فعال ${c.code} را منحل کنید؟`,
                                          onConfirm: () => {
                                            setConfirmDialog(null);
                                            setCoupons(prev => prev.filter(it => it.code !== c.code));
                                            playInteractionChime("button");
                                          }
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:scale-101 transition-all text-[10px] font-black rounded-lg cursor-pointer"
                                    >
                                      ابطال موقت
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* SUB TAB VIEW 6: STATE-OF-THE-ART USER ACCOUNT & COIN FLOW MANAGEMENT */}
                {adminSubTab === "users" && (
                  <div className="space-y-6 text-right">

                    {/* Toggle between Users and Reviews on mobile */}
                    <div className="lg:hidden flex gap-2 pb-1">
                      <button onClick={() => setAdminSubTab("users")}
                        className={`tab-nav ${adminSubTab === "users" ? "active" : ""}`}>
                        <Users className="w-3.5 h-3.5" />
                        <span>مدیریت کاربران</span>
                      </button>
                      <button onClick={() => setAdminSubTab("reviews")}
                        className={`tab-nav ${(adminSubTab as "dashboard" | "products" | "categories" | "orders" | "coupons" | "reviews" | "users" | "messages") === "reviews" ? "active" : ""}`}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>نظرات همراهان</span>
                      </button>
                    </div>

                    <div className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-xl font-bold mb-4 w-fit flex items-center gap-2">
                      <span>موجودی در گردش ولت‌ها: {toPersianNum(users.reduce((acc, u) => acc + u.walletBalance, 0).toLocaleString())} ریال</span>
                      <button type="button" onClick={() => { setNotifTargetUser({ id: "all", name: "همه کاربران" }); setNotifMessageText(""); }}
                        className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg text-[9px] font-bold cursor-pointer transition-all flex items-center gap-1 mr-2"
                      >
                        <Bell className="w-3 h-3" />
                        ارسال نوتیفیکیشن به همه
                      </button>
                    </div>

                    {/* Dynamic user statistic cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/15 p-4 rounded-2xl border border-white/5 text-center">
                        <span className="text-slate-400 text-[10px] block">کل اشخاص ثبت‌شده</span>
                        <strong className="text-lg font-black text-amber-500 font-mono">{toPersianNum(users.length)} نفر</strong>
                      </div>
                      <div className="bg-black/15 p-4 rounded-2xl border border-white/5 text-center">
                        <span className="text-slate-400 text-[10px] block">خریداران فعال</span>
                        <strong className="text-lg font-black text-emerald-400 font-mono">{toPersianNum(users.filter(u => u.status !== "suspended").length)} نفر</strong>
                      </div>
                      <div className="bg-black/15 p-4 rounded-2xl border border-white/5 text-center">
                        <span className="text-slate-400 text-[10px] block">حساب‌های تعلیق‌شده</span>
                        <strong className="text-lg font-black text-rose-500 font-mono">{toPersianNum(users.filter(u => u.status === "suspended").length)} نفر</strong>
                      </div>
                      <div className="bg-black/15 p-4 rounded-2xl border border-white/5 text-center">
                        <span className="text-slate-400 text-[10px] block">تعداد مدیران کل</span>
                        <strong className="text-lg font-black text-amber-400 font-mono">{toPersianNum(users.filter(u => u.role === "admin").length)} نفر</strong>
                      </div>
                    </div>

                    {/* User Grid Filter Control Header */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="relative w-full sm:w-80">
                        <input
                          type="text"
                          className={`w-full pr-10 pl-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500 ${
                            isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200 text-slate-900"
                          }`}
                          placeholder="جستجوی نام، تلفن یا آدرس ایمیل..."
                          value={adminUserSearch}
                          onChange={(e) => setAdminUserSearch(e.target.value)}
                        />
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>

                      <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {(["all", "active", "suspended", "admin"] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => { setAdminUserFilterType(type); playInteractionChime("button"); }}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                              adminUserFilterType === type 
                                ? "bg-amber-500 text-slate-950 font-black shadow-sm" 
                                : `bg-white/5 hover:${isDarkMode ? "bg-white/10" : "bg-slate-100"} text-slate-400`
                            }`}
                          >
                            {type === "all" ? "همگی کاربران" : type === "active" ? "فعال" : type === "suspended" ? "تعلیق‌شده" : "مدیران ارشد"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* User accounts block layout list */}
                    <div className="space-y-4">
                      {users.filter(u => {
                        // Filter Search
                        const q = adminUserSearch.trim().toLowerCase();
                        const matchesQuery = q === "" || 
                          u.fullName.toLowerCase().includes(q) || 
                          u.username.toLowerCase().includes(q) || 
                          u.email.toLowerCase().includes(q) || 
                          (u.phone && u.phone.includes(q));

                        // Filter Tab type
                        const filterMatch = adminUserFilterType === "all" ||
                          (adminUserFilterType === "active" && u.status !== "suspended") ||
                          (adminUserFilterType === "suspended" && u.status === "suspended") ||
                          (adminUserFilterType === "admin" && u.role === "admin");

                        return matchesQuery && filterMatch;
                      }).length === 0 ? (
                        <div className="p-10 border border-dashed border-slate-500/10 rounded-2xl text-center text-slate-400 text-xs">
                          هیچ کاربری با معیارهای جستجو یا فیلتر فوق در بانک اطلاعاتی یافت نشد.
                        </div>
                      ) : (
                        users.filter(u => {
                          const q = adminUserSearch.trim().toLowerCase();
                          const matchesQuery = q === "" || 
                            u.fullName.toLowerCase().includes(q) || 
                            u.username.toLowerCase().includes(q) || 
                            u.email.toLowerCase().includes(q) || 
                            (u.phone && u.phone.includes(q));

                          const filterMatch = adminUserFilterType === "all" ||
                            (adminUserFilterType === "active" && u.status !== "suspended") ||
                            (adminUserFilterType === "suspended" && u.status === "suspended") ||
                            (adminUserFilterType === "admin" && u.role === "admin");

                          return matchesQuery && filterMatch;
                        }).map(user => (
                          <div 
                            key={user.id} 
                            className={`p-5 rounded-3xl border transition-all ${
                              isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200 shadow"
                            } hover:border-amber-500/30 space-y-4`}
                          >
                            {/* User main info */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-500/10 pb-3">
                              <div className="flex items-center gap-3">
                                {renderUserAvatar(user, "w-12 h-12 rounded-xl text-lg font-extrabold")}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-extrabold text-sm text-slate-100">{user.fullName}</h5>
                                    <span className="text-[9px] font-mono text-slate-400">@{user.username}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-400">
                                    <span>ایمیل: <strong className="font-mono text-slate-300">{user.email}</strong></span>
                                    {user.phone && <span>همراه: <strong className="font-mono text-slate-300">{toPersianNum(user.phone)}</strong></span>}
                                    <span>تاریخ عضویت: <strong className="font-mono">{toPersianNum(user.createdAt || "---")}</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* Badges / Quick toggles */}
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  user.status === "suspended" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}>
                                  {user.status === "suspended" ? "تعلیق تعامل" : "خدمت‌رسانی فعال"}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  user.role === "admin" ? "bg-purple-500/10 text-purple-400" : "bg-amber-500/10 text-amber-550"
                                }`}>
                                  {user.role === "admin" ? "مدیر کل" : "خریدار"}
                                </span>
                              </div>
                            </div>

                            {/* Actions block side-by-side */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              
                              {/* LEFT COLUMN: WALLET BALANCE & RECHARGE ENGINE */}
                              {user.role !== "admin" && (
                              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/10 p-4 rounded-2xl border border-white/5">
                                
                                <div className="sm:col-span-4 space-y-1">
                                  <span className="text-[10px] text-slate-400 block font-bold">موجودی فعلی ولت:</span>
                                  <span className="text-sm font-black text-emerald-400 font-mono tracking-wide">
                                    {toPersianNum(user.walletBalance.toLocaleString())} <span className="text-[10px]">ریال</span>
                                  </span>
                                </div>

                                <div className="sm:col-span-8 flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                                  <div className="relative w-full">
                                    <input 
                                      type="number"
                                      placeholder="مبلغ موازنه... (منفی کسر می‌کند)"
                                      id={`adjust_input_${user.id}`}
                                      className="w-full text-xs font-bold py-2 pr-9 pl-3 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-slate-950 border border-white/5"
                                    />
                                    <Coins className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-amber-500" />
                                  </div>

                                  <input 
                                    type="text"
                                    placeholder="یادداشت دلیل..."
                                    id={`adjust_note_${user.id}`}
                                    className="w-full sm:w-36 text-xs py-2 px-2.5 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-slate-950 border border-white/5"
                                  />

                                  <button
                                    onClick={() => {
                                      const inpEl = document.getElementById(`adjust_input_${user.id}`) as HTMLInputElement;
                                      const noteEl = document.getElementById(`adjust_note_${user.id}`) as HTMLInputElement;
                                      if (!inpEl) return;
                                      const value = Number(inpEl.value);
                                      if (value === 0) {
                                        showToast("مبلغ نمی‌تواند صفر باشد.", "warning");
                                        return;
                                      }
                                      handleAdminAdjustBalance(user.id, value, noteEl.value || "تعدیل انضباطی مدیریت ارشد");
                                      inpEl.value = "";
                                      noteEl.value = "";
                                    }}
                                    className="px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-black rounded-xl cursor-pointer transition-all shrink-0 w-full sm:w-auto text-center"
                                  >
                                    ثبت تراکنش
                                  </button>
                                </div>

                              </div>
                              )}

                              {/* RIGHT COLUMN: DISCIPLINARY / PRIVILEGE MANAGEMENT PANEL */}
                              <div className={`${user.role === "admin" ? "md:col-span-12" : "md:col-span-4"} flex gap-2 justify-end w-full`}>
                                
                                {/* Suspend or activate user */}
                                {user.username !== "admin" ? (
                                  <button
                                    onClick={() => {
                                      const isSus = user.status === "suspended";
                                      const nextStatus = isSus ? "active" : "suspended";
                                      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
                                      playInteractionChime("button");
                                      showToast(isSus ? `کاربر ${user.fullName} مجدداً فعال گردید.` : `کاربر ${user.fullName} به حالت تعلیق درآمد.`, isSus ? "success" : "warning");
                                    }}
                                    className={`px-3.5 py-2 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all flex-grow text-center ${
                                      user.status === "suspended"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-400 border border-rose-500/15 hover:bg-rose-500/20"
                                    }`}
                                  >
                                    {user.status === "suspended" ? "فعال‌سازی مجدد حساب" : "تعلیق موقت حساب"}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500">عدم تعلیق حساب ریشه ادمین</span>
                                )}

                                {/* Promote to admin or demote to user */}
                                {user.username !== "admin" && (
                                  <button
                                    onClick={() => {
                                      const nextRole = user.role === "admin" ? "customer" : "admin";
                                      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: nextRole } : u));
                                      playInteractionChime("success");
                                      showToast(`سطح دسترسی کاربر ${user.fullName} به ${nextRole === "admin" ? "مدیر ارشد" : "مشتری عادی"} تغییر یافت.`, "success");
                                    }}
                                    className="px-3 py-2 bg-amber-500/10 hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 text-[10.5px] rounded-xl font-bold cursor-pointer transition-all text-center"
                                  >
                                    {user.role === "admin" ? "عزل از مدیریت" : "تنفیذ به ادمین"}
                                  </button>
                                )}

                                {/* Delete user */}
                                {user.username !== "admin" && (
                                  <button
                                    onClick={() => {
                                      setConfirmDialog({
                                        message: `آیا واقعا می‌خواهید کاربر "${user.fullName}" را حذف کنید؟ این عمل غیرقابل بازگشت است.`,
                                        onConfirm: () => {
                                          setConfirmDialog(null);
                                          setUsers(prev => prev.filter(u => u.id !== user.id));
                                          if (currentUser?.id === user.id) {
                                            setCurrentUser(null);
                                          }
                                          playInteractionChime("button");
                                        }
                                      });
                                    }}
                                    className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 text-[10.5px] rounded-xl font-bold cursor-pointer transition-all text-center"
                                  >
                                    حذف کاربر
                                  </button>
                                )}

                                {/* Send notification */}
                                {user.username !== "admin" && (
                                  <button
                                    onClick={() => { setNotifTargetUser({ id: user.id, name: user.fullName }); setNotifMessageText(""); }}
                                    className="px-3 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/20 text-[10.5px] rounded-xl font-bold cursor-pointer transition-all text-center"
                                    title="ارسال نوتیفیکیشن به کاربر"
                                  >
                                    <Bell className="w-3.5 h-3.5 inline-block ml-1" />
                                    ارسال نوتیفیکیشن
                                  </button>
                                )}

                              </div>

                            </div>

                          </div>
                        ))
                      )}
                    </div>

                  </div>
                )}
  
                 {/* SUB TAB VIEW 5: USER REVIEWS MODERATION PANEL */}
                 {adminSubTab === "reviews" && (
                  <div className="space-y-6 text-right">
                    {/* Back toggle to users on mobile */}
                    <div className="lg:hidden flex gap-2 pb-1">
                      <button onClick={() => setAdminSubTab("users")}
                        className={`tab-nav active`}>
                        <Users className="w-3.5 h-3.5" />
                        <span>مدیریت کاربران</span>
                      </button>
                      <button onClick={() => setAdminSubTab("reviews")}
                        className={`tab-nav active`}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>نظرات همراهان</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {products.reduce<Array<{ pId: string; pTitle: string; rev: Review }>>((acc, p) => {
                        p.reviews.forEach(r => acc.push({ pId: p.id, pTitle: p.title, rev: r }));
                        return acc;
                      }, []).length === 0 ? (
                        <div className={`glass-card p-10 text-center space-y-2`}>
                          <p className="text-xs text-slate-400">تاکنون دیدگاه یا بازخوردی در ویترین کالاها به تحریر در نیامده است.</p>
                        </div>
                      ) : (
                        products.reduce<Array<{ pId: string; pTitle: string; rev: Review }>>((acc, p) => {
                          p.reviews.forEach(r => acc.push({ pId: p.id, pTitle: p.title, rev: r }));
                          return acc;
                        }, []).map((entry, idx) => (
                          <div 
                            key={idx}
                            className={`p-4.5 rounded-3xl border ${
                              isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-200 shadow"
                            } space-y-3 text-xs`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-500/10 pb-2">
                              <div className="space-y-1 text-right">
                                <span className="bg-amber-500/10 text-amber-505 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  برای محصول: {entry.pTitle}
                                </span>
                                <h5 className="font-extrabold text-slate-300 mt-1">
                                  فرستنده: <strong className="text-amber-400">{sanitize(entry.rev.userName)}</strong>
                                </h5>
                              </div>

                              <div className="flex gap-2 items-center">
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, stIdx) => (
                                    <Star key={stIdx} className={`w-3.5 h-3.5 ${stIdx < entry.rev.rating ? "text-amber-400 fill-amber-300" : "text-slate-705"}`} />
                                  ))}
                                </div>
                                <span className="text-slate-500 font-mono text-[10px]">{entry.rev.date}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 items-start justify-between">
                                <p className="text-slate-300/95 leading-relaxed font-light text-justify max-w-xl">
                                &ldquo;{sanitize(entry.rev.comment)}&rdquo;
                              </p>

                              {entry.rev.adminReply && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl w-full max-w-xl text-right">
                                  <span className="text-[9px] text-emerald-400 font-black flex items-center gap-1 mb-1">
                                    <Shield className="w-3 h-3" /> پاسخ مدیریت:
                                  </span>
                                  <p className="text-[11px] text-slate-300 leading-relaxed">&ldquo;{sanitize(entry.rev.adminReply)}&rdquo;</p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 items-center w-full">
                                {replyingToReview?.pId === entry.pId && replyingToReview?.reviewId === entry.rev.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (!adminReplyInput.trim()) return;
                                      setProducts(prev => prev.map(p => {
                                        if (p.id === entry.pId) {
                                          return {
                                            ...p,
                                            reviews: p.reviews.map(r => r.id === entry.rev.id ? { ...r, adminReply: adminReplyInput.trim() } : r)
                                          };
                                        }
                                        return p;
                                      }));
                                      setAdminReplyInput("");
                                      setReplyingToReview(null);
                                      playInteractionChime("success");
                                    }}
                                    className="flex gap-2 w-full"
                                  >
                                    <input
                                      type="text"
                                      value={adminReplyInput}
                                      onChange={(e) => setAdminReplyInput(e.target.value)}
                                      placeholder="متن پاسخ مدیریت..."
                                      className={`flex-1 px-3 py-1.5 text-xs rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 ${
                                        isDarkMode ? "bg-slate-950 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200"
                                      }`}
                                      autoFocus
                                    />
                                    <button type="submit" className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-black rounded-xl cursor-pointer">ارسال</button>
                                    <button type="button" onClick={() => setReplyingToReview(null)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-[10px] rounded-xl cursor-pointer">انصراف</button>
                                  </form>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setReplyingToReview({ pId: entry.pId, reviewId: entry.rev.id });
                                      setAdminReplyInput(entry.rev.adminReply || "");
                                      playInteractionChime("button");
                                    }}
                                    className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[10px] font-black rounded-xl cursor-pointer"
                                  >
                                    {entry.rev.adminReply ? "ویرایش پاسخ" : "پاسخ مدیریت"}
                                  </button>
                                )}

                                <button 
                                  onClick={() => {
                                    setConfirmDialog({
                                      message: "آیا واقعا می‌خواهید این نظر ارسالی را حذف فیزیکی کنید؟",
                                      onConfirm: () => {
                                        setConfirmDialog(null);
                                        setProducts(prev => prev.map(p => {
                                          if (p.id === entry.pId) {
                                            return {
                                              ...p,
                                              reviews: p.reviews.filter(r => r.id !== entry.rev.id)
                                            };
                                          }
                                          return p;
                                        }));
                                        playInteractionChime("button");
                                      }
                                    });
                                  }}
                                  className="px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[10px] font-black rounded-xl hover:scale-101 duration-200 cursor-pointer"
                                >
                                  حذف نهایی نظر
                                </button>
                              </div>
                            </div>

                          </div>
                        ))
                      )}
                    </div>

                  </div>
                )}

                {/* SUB TAB VIEW 6: ADMIN MESSAGES PANEL */}
                {adminSubTab === "messages" && (
                  <div className="space-y-6 text-right">
                    <div className="flex items-center gap-2.5 px-1">
                      <MessageCircle className="w-4.5 h-4.5 text-amber-400" />
                      <h3 className="text-xs md:text-sm font-black text-transparent bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text">مدیریت پیام‌های کاربران</h3>
                    </div>
                    <div className="glass-card overflow-hidden">
                      {messages.length === 0 ? (
                        <p className="text-slate-500 text-xs text-center py-8">هیچ پیامی ارسال نشده است</p>
                      ) : (
                        <div className="flex flex-col sm:flex-row h-[32rem]">
                          {/* User list sidebar */}
                          <div className={`sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-l overflow-y-auto ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                            {[...new Set(messages.filter(m => !m.isAdmin).map(m => m.userId))].map(uid => {
                              const userMsgs = messages.filter(m => m.userId === uid || (m.isAdmin && m.targetUserId === uid));
                              const lastMsg = userMsgs[userMsgs.length - 1];
                              const unread = userMsgs.filter(m => !m.isAdmin && !m.read).length;
                              const userName = userMsgs.find(m => m.userId === uid)?.userName || uid;
                              const userInfo = users.find(u => u.id === uid);
                              return (
                                <button key={uid} type="button" onClick={() => setSelectedChatUserId(selectedChatUserId === uid ? null : uid)}
                                  className={`w-full text-right p-3 transition-all border-b cursor-pointer ${isDarkMode ? "border-white/5" : "border-slate-100"} ${selectedChatUserId === uid ? (isDarkMode ? "bg-amber-500/10" : "bg-amber-50") : "hover:bg-white/5"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    {userInfo ? renderUserAvatar(userInfo, "w-7 h-7 rounded-lg text-[9px] font-bold shrink-0") : (
                                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                                        {userName.charAt(0)}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] font-bold truncate">{userName}</div>
                                      {lastMsg && <div className="text-[8px] text-slate-500 truncate">{lastMsg.text}</div>}
                                    </div>
                                    {unread > 0 && (
                                      <span className="w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                                        {toPersianNum(unread)}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {/* Chat view */}
                          <div className="flex-1 flex flex-col">
                            {selectedChatUserId ? (
                              <>
                                {/* Conversation header */}
                                <div className={`p-3 border-b text-[11px] font-bold flex items-center gap-2 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                                  <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="truncate">{messages.find(m => m.userId === selectedChatUserId)?.userName || selectedChatUserId}</span>
                                </div>
                                {/* Messages list */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-2 cust-scroll" style={{ scrollBehavior: "smooth" }}>
                                  {messages.filter(m => m.userId === selectedChatUserId || (m.isAdmin && m.targetUserId === selectedChatUserId) || (m.userId === "ai_assistant" && m.targetUserId === selectedChatUserId)).map(msg => (
                                    <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : msg.userId === "ai_assistant" ? "justify-start" : "justify-end"}`}>
                                      <div className={`max-w-[80%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                                        msg.isAdmin
                                          ? "bg-emerald-500/10 text-emerald-200 rounded-tr-sm"
                                          : msg.userId === "ai_assistant"
                                          ? "bg-purple-500/10 text-purple-200 rounded-tr-sm"
                                          : "bg-amber-500/10 text-amber-200 rounded-tl-sm"
                                      }`}>
                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                        <span className="text-[8px] opacity-50 mt-1 block">
                                          {msg.isAdmin ? "مدیر" : msg.userId === "ai_assistant" ? "دستیار هوشمند" : msg.userName} • {toPersianNum(new Date(msg.timestamp).toLocaleString("fa-IR"))}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* Reply input */}
                                <div className={`p-3 border-t flex gap-2 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                                  <input
                                    type="text"
                                    value={adminChatReply}
                                    onChange={e => setAdminChatReply(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter" && adminChatReply.trim()) {
                                        const replyText = adminChatReply.trim();
                                        const targetUserId = selectedChatUserId;
                                        const msg = {
                                          text: replyText, user_id: targetUserId,
                                          timestamp: Date.now(), is_admin: true,
                                          user_name: "مدیر زرین‌کالا",
                                        };
                                        setMessages(prev => [...prev, {
                                          id: Date.now().toString(),
                                          userId: "admin",
                                          userName: "مدیر زرین‌کالا",
                                          text: replyText,
                                          timestamp: Date.now(),
                                          isAdmin: true,
                                          read: true,
                                          targetUserId: targetUserId
                                        }]);
                                        setAdminChatReply("");
                                        if (adminWsRef.current && adminWsRef.current.readyState === WebSocket.OPEN) {
                                          adminWsRef.current.send(JSON.stringify({ type: "admin_reply", message: msg }));
                                        }
                                        if (targetUserId) {
                                          addNotification("پاسخ ادمین", "مدیر زرین‌کالا به شما پاسخ داد", "message", targetUserId);
                                        }
                                        playInteractionChime("success");
                                      }
                                    }}
                                    placeholder="پاسخ به این کاربر..."
                                    className="flex-1 px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-slate-950 text-slate-100 border border-white/5"
                                  />
                                  <button
                                    onClick={() => {
                                      if (!adminChatReply.trim()) return;
                                      const replyText = adminChatReply.trim();
                                      const targetUserId = selectedChatUserId;
                                      const msg = {
                                        text: replyText, user_id: targetUserId,
                                        timestamp: Date.now(), is_admin: true,
                                        user_name: "مدیر زرین‌کالا",
                                      };
                                      setMessages(prev => [...prev, {
                                        id: Date.now().toString(),
                                        userId: "admin",
                                        userName: "مدیر زرین‌کالا",
                                        text: replyText,
                                        timestamp: Date.now(),
                                        isAdmin: true,
                                        read: true,
                                        targetUserId: targetUserId
                                      }]);
                                      setAdminChatReply("");
                                      if (adminWsRef.current && adminWsRef.current.readyState === WebSocket.OPEN) {
                                        adminWsRef.current.send(JSON.stringify({ type: "admin_reply", message: msg }));
                                      }
                                      if (targetUserId) {
                                        addNotification("پاسخ ادمین", "مدیر زرین‌کالا به شما پاسخ داد", "message", targetUserId);
                                      }
                                      playInteractionChime("success");
                                    }}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    ارسال
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                                یک کاربر را برای مشاهده پیام‌ها انتخاب کنید
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* 4. PRODUCT DETAIL SLIDESHOW MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-6"
            onClick={() => setSelectedProduct(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"}`}
            >
              {/* Image area */}
              <div className="relative w-full h-56 sm:h-[22rem] bg-gradient-to-br from-slate-800 to-slate-950 overflow-hidden">
                {/* Close button */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 z-30 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm shadow-lg"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
                {!selectedProduct.imageUrl && (!selectedProduct.images || selectedProduct.images.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderProductIcon(selectedProduct.iconType, "w-24 h-24 sm:w-32 sm:h-32 text-slate-700")}
                </div>
                )}
                {/* Always show icon as fallback behind images */}
                {selectedProduct.imageUrl && (!selectedProduct.images || selectedProduct.images.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {renderProductIcon(selectedProduct.iconType, "w-24 h-24 sm:w-32 sm:h-32 text-slate-700")}
                </div>
                )}
                {(selectedProduct.images || []).length > 0 ? (
                  <>
                    {(selectedProduct.images || []).map((img, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={safeUrl(img)}
                        alt={sanitize(selectedProduct.title)}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(selectedProduct.title + " " + (imgIdx + 1), 600, 400, selectedProduct.iconType); } else { e.currentTarget.style.display = "none"; } }}
                        className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${imgIdx === detailImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                      />
                    ))}
                    {(selectedProduct.images || []).length > 1 && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-10" />
                        <button
                          onClick={() => setDetailImageIndex(prev => prev > 0 ? prev - 1 : (selectedProduct.images?.length || 1) - 1)}
                          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 backdrop-blur-sm"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDetailImageIndex(prev => prev < (selectedProduct.images?.length || 1) - 1 ? prev + 1 : 0)}
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 backdrop-blur-sm"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                          {(selectedProduct.images || []).map((_, dotIdx) => (
                            <span key={dotIdx} className={`w-2 h-2 rounded-full transition-all cursor-pointer ${dotIdx === detailImageIndex ? "bg-amber-400 w-5" : "bg-white/40 hover:bg-white/60"}`}
                              onClick={() => setDetailImageIndex(dotIdx)}
                            />
                          ))}
                        </div>
                        <div className="absolute top-3 left-3 z-20">
                          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-black text-amber-400 font-mono">
                            {detailImageIndex + 1} / {(selectedProduct.images || []).length}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                ) : selectedProduct.imageUrl ? (
                  <img
                    src={safeUrl(selectedProduct.imageUrl)}
                    alt={sanitize(selectedProduct.title)}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = imgFallbackUrl(selectedProduct.title, 600, 400, selectedProduct.iconType); } else { e.currentTarget.style.display = "none"; } }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : null}
              </div>

              {/* Product info */}
              <div className="p-4 sm:p-5" dir="rtl">
                {/* Header: title + price below */}
                <div className="mb-2">
                  <h2 className="text-base sm:text-lg font-black truncate">{selectedProduct.title}</h2>
                  <p className="text-[11px] text-slate-400 truncate mb-2">{selectedProduct.englishTitle}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono">{toPersianNum(selectedProduct.discountPrice || selectedProduct.price)}</span>
                    <span className="text-[10px] text-slate-400">تومان</span>
                    {selectedProduct.discountPrice && (
                      <span className="text-[10px] text-slate-500 line-through font-mono mr-1">{toPersianNum(selectedProduct.price)}</span>
                    )}
                  </div>
                </div>
                    {(() => {
                      const detailOrderCount = orders.reduce((sum, o) => sum + o.items.filter(it => it.product.id === selectedProduct.id).reduce((q, it) => q + it.quantity, 0), 0);
                      return detailOrderCount > 0 ? (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <ShoppingCart className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-400">{toPersianNum(detailOrderCount)} سفارش ثبت شده</span>
                        </div>
                          ) : null;
                    })()}

                {/* Quick action buttons row */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={(e) => { addToCart(selectedProduct, e); setSelectedProduct(null); }}
                    disabled={selectedProduct.stock === 0}
                    className="flex-1 py-2.5 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-[11px] font-black rounded-xl transition-all active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>افزودن به سبد خرید</span>
                  </button>
                  <button
                    onClick={(e) => { toggleWishlist(selectedProduct.id, e); }}
                    className={`p-2.5 rounded-xl border transition-all active:scale-90 cursor-pointer shrink-0 ${
                      wishlist.includes(selectedProduct.id)
                        ? "bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10"
                        : isDarkMode ? "bg-white/5 border-white/10 text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-500"
                    }`}
                    title={wishlist.includes(selectedProduct.id) ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
                  >
                    <Heart className={`w-4.5 h-4.5 ${wishlist.includes(selectedProduct.id) ? "fill-rose-400" : ""}`} />
                  </button>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className={`mb-3 p-3 rounded-2xl text-xs leading-relaxed ${isDarkMode ? "bg-slate-800/40 text-slate-300" : "bg-slate-50 text-slate-600"}`}>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}

                {/* Specs as inline chips */}
                {(selectedProduct.specs || []).length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduct.specs.map((spec, sIdx) => (
                        <span key={sIdx} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${isDarkMode ? "bg-slate-800/60 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                          <span className="text-slate-400">{spec.label}:</span>
                          <span>{spec.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {(selectedProduct.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {selectedProduct.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 bg-amber-500/8 text-amber-400 text-[9px] font-black rounded-lg border border-amber-500/15">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Reviews section */}
                {(selectedProduct.reviews || []).length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[11px] font-black text-slate-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        نظرات کاربران ({toPersianNum(selectedProduct.reviews.length)})
                      </h3>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-black text-amber-400">{toPersianNum(selectedProduct.rating)}</span>
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      </div>
                    </div>
                    <div ref={reviewsEndRef} className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedProduct.reviews.map((rev) => {
                        const isOwnReview = currentUser && (rev.userId === currentUser.id || rev.userName === currentUser.fullName);
                        const isEditing = editingReviewId === rev.id;
                        return (
                        <div key={rev.id} className={`p-3 rounded-2xl ${isDarkMode ? "bg-slate-800/40" : "bg-slate-50"}`}>
                          {isEditing && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-bold shrink-0">امتیاز:</span>
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setEditingRating(s)}
                                      className="p-0.5 cursor-pointer transition-all active:scale-110"
                                    >
                                      <Star className={`w-4 h-4 ${s <= editingRating ? "text-amber-500 fill-amber-500" : "text-slate-600"}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea
                                value={editingComment}
                                onChange={(e) => setEditingComment(e.target.value)}
                                rows={2}
                                className={`w-full px-3 py-2 text-[11px] rounded-xl outline-none focus:ring-1 focus:ring-amber-500 resize-none ${
                                  isDarkMode ? "bg-slate-950 text-slate-200 border border-white/5" : "bg-white border border-slate-200 text-slate-700"
                                }`}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditReview(rev.id)}
                                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-black rounded-xl cursor-pointer"
                                >
                                  ذخیره
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingReviewId(null)}
                                  className="px-3 py-1.5 bg-white/5 text-slate-400 text-[10px] rounded-xl cursor-pointer"
                                >
                                  انصراف
                                </button>
                              </div>
                            </div>
                          )}
                          {!isEditing && (
                          <div className="flex items-start gap-2.5 mb-1.5">
                            <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border ${isDarkMode ? "border-white/10" : "border-slate-200"}`}>
                              {(() => {
                                const avatarSrc = isOwnReview && currentUser?.avatarUrl ? currentUser.avatarUrl : rev.avatarUrl;
                                return avatarSrc ? (
                                  <img src={safeUrl(avatarSrc)} alt={sanitize(rev.userName)} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-amber-400" />
                                );
                              })()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold break-words">{sanitize(rev.userName)}</span>
                                <div className="flex items-center justify-between gap-2">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? "text-amber-500 fill-amber-500" : "text-slate-600"}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{sanitize(rev.comment)}</p>
                              {rev.adminReply && (
                                <div className={`mt-2 pr-3 border-r-2 text-[10px] ${isDarkMode ? "border-amber-500/30 text-amber-300/70" : "border-amber-400/40 text-amber-700/70"}`}>
                                  <span className="font-bold text-amber-500 block text-[9px] mb-0.5">پاسخ مدیریت:</span>
                                  <p>{sanitize(rev.adminReply)}</p>
                                </div>
                              )}
                              {isOwnReview && (
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingReviewId(rev.id);
                                      setEditingRating(rev.rating);
                                      setEditingComment(rev.comment);
                                    }}
                                    className="text-[9px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit className="w-3 h-3" />
                                    ویرایش
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="text-[9px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    حذف
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                  </div>
                )}

                {/* Add review form */}
                <form onSubmit={handleAddReview} className="mb-3">
                  <h3 className="text-[11px] font-black text-slate-400 flex items-center gap-1.5 mb-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    ثبت نظر شما
                  </h3>
                  <div className={`p-3 rounded-2xl space-y-2.5 ${isDarkMode ? "bg-slate-800/30" : "bg-slate-50"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">امتیاز:</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setTempReview(prev => ({ ...prev, rating: s }))}
                            className="p-0.5 cursor-pointer transition-all active:scale-110"
                          >
                            <Star className={`w-5 h-5 ${s <= tempReview.rating ? "text-amber-500 fill-amber-500" : "text-slate-600 hover:text-amber-500/50"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={tempReview.comment}
                      onChange={(e) => setTempReview(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="نظر خود را درباره این محصول بنویسید..."
                      rows={2}
                      className={`w-full px-3 py-2 text-[11px] rounded-xl outline-none focus:ring-1 focus:ring-amber-500 resize-none ${
                        isDarkMode ? "bg-slate-950 text-slate-200 border border-white/5" : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    />
                    {reviewError && (
                      <p className="text-[9px] text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {reviewError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-xl transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      ثبت نظر و امتیاز
                    </button>
                  </div>
                </form>

                {/* Bottom info row */}
                <div className={`flex items-center gap-3 pt-2.5 border-t text-[11px] ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-black text-amber-400 ml-0.5">{toPersianNum(selectedProduct.rating)}</span>
                  </div>
                  <span className={`font-black ${selectedProduct.stock > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {selectedProduct.stock > 0 ? `${toPersianNum(selectedProduct.stock)} عدد در انبار` : "ناموجود"}
                  </span>
                  <span className="text-slate-500">{categories.find(c => c.id === selectedProduct.category)?.name || "سایر"}{selectedProduct.brand && (() => { const b = subcategories.find(s => s.id === selectedProduct.brand); return b ? ` • ${b.name}` : null; })()}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SIDEBAR SHOPPING CART DRAWERS */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2 } }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            
            {/* Backdrop cover */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Cart sidebar body */}
            <motion.div 
              initial={{ x: "100%", opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.95 }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className={`relative z-10 w-full max-w-md h-full flex flex-col justify-between shadow-2xl p-6 ${
                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
              }`}
            >
              
              {/* Header inside drawer */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-500/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-black">سبد خرید شما</h3>
                  <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold">
                    {toPersianNum(cart.reduce((s, it) => s + it.quantity, 0))} کالا
                  </span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items scroll rail */}
              <div className="flex-grow overflow-y-auto py-4 space-y-4 pr-1">
                {cart.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center space-y-3 text-center">
                    <ShoppingBag className="w-12 h-12 text-slate-600 animate-bounce" />
                    <p className="text-sm font-bold text-slate-400">سبد خرید شما در حال حاضر خالی است</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-lg"
                    >
                      شروع خرید از ویترین
                    </button>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <motion.div 
                      key={item.product.id || idx}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.25) }}
                      className={`p-3 rounded-2xl border flex gap-3 items-center justify-between ${
                        isDarkMode ? "bg-slate-900 border-white/5" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br ${item.product.imageColor}`}>
                        {renderProductIcon(item.product.iconType, "w-7 h-7")}
                      </div>

                      <div className="flex-grow min-w-0 space-y-1">
                        <h4 className="text-xs font-bold leading-tight truncate">{item.product.title}</h4>
                        <span className="text-[10px] text-slate-500 block">واحد: {toPersianNum(item.product.discountPrice || item.product.price)} ت</span>
                        <span className="text-xs font-black text-amber-500 font-mono">
                          {toPersianNum((item.product.discountPrice || item.product.price) * item.quantity)} تومان
                        </span>
                      </div>

                      {/* Quantity switcher */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5 border border-white/5 text-[11px] font-mono">
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, 1)}
                            className="p-1 hover:text-amber-400 text-slate-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-slate-100 min-w-4 text-center">{toPersianNum(item.quantity)}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.product.id, -1)}
                            className="p-1 hover:text-rose-400 text-slate-400"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف
                        </button>
                      </div>

                    </motion.div>
                  ))
                )}
              </div>

              {/* Coupon code and Summary Footer inside Cart */}
              {cart.length > 0 && (
                <div className="border-t border-slate-500/10 pt-4 space-y-4">
                  
                  {/* Shipping goal check progress bar */}
                  {(() => {
                    const freeShippingLimit = 3000000;
                    const diff = freeShippingLimit - cartSubtotal;
                    const percent = Math.min((cartSubtotal / freeShippingLimit) * 100, 100);
                    return (
                      <div className={`p-3.5 rounded-2xl border text-[11px] space-y-2 leading-relaxed text-right ${
                        isDarkMode ? "bg-slate-900/40 border-white/5" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="flex justify-between font-bold items-center">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-amber-500" />
                            وضعیت ارسال مرسوله:
                          </span>
                          {diff > 0 ? (
                            <span className="text-amber-500 font-extrabold">
                              {toPersianNum(diff.toLocaleString())} تومان تا ارسال رایگان
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-extrabold flex items-center gap-1 text-[11.5px]">
                              🎉 مرسوله رایگان واگذار گردید!
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 relative overflow-hidden">
                          <motion.div 
                            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                            layout
                          />
                        </div>
                        {diff > 0 && (
                          <span className="text-[10px] text-slate-500 block">ارسال با بیمه زرین‌کالا فقط ۴۹,۰۰۰ تومان می‌باشد. بالای ۳ میلیون تومان کاملاً رایگان است.</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Coupon layout */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold">کد تخفیف اختصاصی داری؟ </span>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="کد را وارد کن..."
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!activeCoupon}
                        className={`text-xs px-3 py-2 outline-none rounded-xl font-mono tracking-widest uppercase flex-grow text-center ${
                          isDarkMode ? "bg-slate-900 border-white/5 text-slate-100" : "bg-slate-100 border-slate-200 border text-slate-950"
                        }`}
                      />
                      {activeCoupon ? (
                        <button 
                          onClick={handleRemoveCoupon}
                          className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-black rounded-xl cursor-pointer"
                        >
                          ابطال کد
                        </button>
                      ) : (
                        <button 
                          onClick={handleApplyCoupon}
                          className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl cursor-pointer hover:bg-amber-400 transition-colors"
                        >
                          اعمال
                        </button>
                      )}
                    </div>

                    {/* Pre-defined active coupon badges */}
                    {!activeCoupon && (
                      <div className="flex flex-wrap items-center gap-2 mt-1 bg-slate-900/20 p-2 rounded-xl border border-white/5 justify-start">
                        <span className="text-[9px] text-slate-400 font-bold">کدهای پیشنهادی:</span>
                        <button 
                          type="button" 
                          onClick={() => { setCouponCode("WELCOME"); playInteractionChime("button"); }}
                          className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-400/20 text-amber-500 text-[9.5px] font-black rounded-lg border border-amber-500/20 transition-all cursor-pointer"
                        >
                          WELCOME (%۱۰)
                        </button>
                        <button 
                          type="button" 
                          disabled={cartSubtotal < 1000000}
                          onClick={() => { setCouponCode("ZARIN"); playInteractionChime("button"); }}
                          className={`px-2 py-0.5 text-[9.5px] font-black rounded-lg border transition-all cursor-pointer ${
                            cartSubtotal >= 1000000 
                              ? "bg-amber-500/10 hover:bg-amber-400/20 text-amber-500 border-amber-500/20" 
                              : "bg-slate-800 text-slate-500 border-white/5 opacity-50"
                          }`}
                        >
                          ZARIN (%۱۵)
                        </button>
                        <button 
                          type="button" 
                          disabled={cartSubtotal < 3000000}
                          onClick={() => { setCouponCode("YALDA"); playInteractionChime("button"); }}
                          className={`px-2 py-0.5 text-[9.5px] font-black rounded-lg border transition-all cursor-pointer ${
                            cartSubtotal >= 3000000 
                              ? "bg-amber-500/10 hover:bg-amber-400/20 text-amber-500 border-amber-500/20" 
                              : "bg-slate-800 text-slate-500 border-white/5 opacity-50"
                          }`}
                        >
                          YALDA (%۳۰)
                        </button>
                      </div>
                    )}

                    {couponError && <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{couponError}</p>}
                    {couponSuccess && <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-1"><Check className="w-3 h-3" />{couponSuccess}</p>}
                  </div>
 
                   {/* Pricing math receipt block */}
                   <div className={`p-4 rounded-2xl text-xs space-y-2.5 ${isDarkMode ? "bg-slate-900/60" : "bg-slate-55"}`}>
                     <div className="flex justify-between">
                       <span className="text-slate-400">جمع کل اقلام:</span>
                       <span className="font-mono font-bold text-slate-300">{toPersianNum(cartSubtotal.toLocaleString())} ت</span>
                     </div>
                     {discountValue > 0 && (
                       <div className="flex justify-between text-rose-500">
                         <span>کسر تخفیف ({toPersianNum(activeCoupon?.discountPercent || 0)}٪):</span>
                         <span className="font-mono font-bold">-{toPersianNum(discountValue.toLocaleString())} ت</span>
                       </div>
                     )}
                     <div className="flex justify-between">
                       <span className="text-slate-400">هزینه ارسال مرسوله:</span>
                       <span className="font-mono font-bold text-slate-300">
                         {deliveryFee === 0 ? "رایگان" : `${toPersianNum(deliveryFee.toLocaleString())} ت`}
                       </span>
                     </div>
                     <div className="border-t border-slate-500/10 pt-2.5 flex justify-between text-sm">
                       <span className="font-extrabold text-slate-200">مجموع کل پرداختی فاکتور:</span>
                       <span className="font-sans font-black text-amber-500 leading-none text-base">
                         {toPersianNum(cartTotal.toLocaleString())} تومان
                       </span>
                     </div>
                   </div>
 
                   {/* Checkout Stage Trigger */}
                   <button 
                     id="checkout_starter_btn"
                     onClick={handleStartCheckout}
                     className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer shadow-amber-500/5 hover:shadow-amber-500/10 transition-all font-semibold"
                   >
                     <CreditCard className="w-5 h-5 animate-pulse" />
                     <span>تکمیل روند خرید و ثبت نهایی آدرس</span>
                     </button>
                       </div>
                      )}

                 </motion.div>
               </motion.div>
              )}
      </AnimatePresence>

      {/* 6. CONVEX SHIELD FOR CHECKOUT FLOW AND SIMULATED WIDGETS */}
      <AnimatePresence>
        {checkoutStep !== "idle" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCheckoutStep("idle")}/>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-h-[88vh] sm:max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 sm:p-8 ${
                checkoutStep === 'form' ? 'max-w-4xl' : 'max-w-2xl'
              } ${
                isDarkMode ? "bg-slate-900 text-slate-100 border-white/5" : "bg-white text-slate-900 border-slate-200"
              }`}
            >
              
              {/* Close Checkout process */}
              <button 
                onClick={() => setCheckoutStep("idle")}
                className="absolute top-4 left-4 p-1.5 bg-slate-950/10 hover:bg-slate-500/10 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Progress Steps header */}
              <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-6">
                <CreditCard className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-[17px] font-black">روند ثبت سفارش و تایید نشانی پستی</h3>
                  <p className="text-xxs text-slate-400">بخش نهایی تسویه حساب سبد خرید شما</p>
                </div>
              </div>

              {/* STEP A: SHIPMENT DATA ENTRY FORM */}
              {checkoutStep === "form" && (
                <div className="space-y-4">
                  {/* Modern Step Wizard Indicator */}
                  <div className="flex items-center justify-between gap-1 mb-6 pb-4 border-b border-white/5 text-[10px] sm:text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full font-bold font-mono text-[10px] sm:text-xs ${
                        checkoutSubStep === 1 
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold" 
                          : "bg-emerald-500 text-slate-950"
                      }`}>
                        {checkoutSubStep > 1 ? "✓" : "۱"}
                      </span>
                      <span className={`${checkoutSubStep === 1 ? "text-amber-400 font-extrabold" : "text-slate-400"}`}>گیرنده مرسوله</span>
                    </div>
                    <div className="h-px bg-slate-800 flex-grow mx-2" />
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full font-bold font-mono text-[10px] sm:text-xs ${
                        checkoutSubStep === 2 
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold" 
                          : checkoutSubStep > 2 
                          ? "bg-emerald-500 text-slate-950" 
                          : "bg-slate-800 text-slate-500"
                      }`}>
                        {checkoutSubStep > 2 ? "✓" : "۲"}
                      </span>
                      <span className={`${checkoutSubStep === 2 ? "text-amber-400 font-extrabold" : "text-slate-500"}`}>نشانی ارسال</span>
                    </div>
                    <div className="h-px bg-slate-800 flex-grow mx-2" />
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full font-bold font-mono text-[10px] sm:text-xs ${
                        checkoutSubStep === 3 
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold" 
                          : "bg-slate-800 text-slate-500"
                      }`}>
                        ۳
                      </span>
                      <span className={`${checkoutSubStep === 3 ? "text-amber-400 font-extrabold" : "text-slate-500"}`}>تسویه و تایید</span>
                    </div>
                  </div>

                  {/* STEP CONTENT BASED ON checkoutSubStep */}
                  {checkoutSubStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[11px] leading-relaxed text-amber-200">
                        لطفاً مشخصات فرد تحویل‌گیرنده را با دقت وارد نمایید. هماهنگی ارسال از طریق شماره همراه فوق انجام خواهد شد.
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <input 
                            type="text" 
                            placeholder="نام و نام خانوادگی تحویل‌گیرنده"
                            value={shippingForm.fullName}
                            onChange={(e) => {
                              setShippingForm(p => ({ ...p, fullName: e.target.value }));
                              if (formErrors.fullName) setFormErrors(p => ({ ...p, fullName: "" }));
                            }}
                            className={`w-full px-4 py-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                              isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                            }`}
                          />
                          {formErrors.fullName && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.fullName}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <input 
                            type="tel" 
                            placeholder="شماره تلفن همراه (جهت هماهنگی ارسال)"
                          value={shippingForm.phone}
                            onChange={(e) => {
                              setShippingForm(p => ({ ...p, phone: e.target.value }));
                              if (formErrors.phone) setFormErrors(p => ({ ...p, phone: "" }));
                            }}
                            className={`w-full px-4 py-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-wider text-right ${
                              isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                            }`}
                          />
                          {formErrors.phone && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.phone}</p>}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-500/10 gap-3 mt-6">
                        <button 
                          type="button" 
                          onClick={() => setCheckoutStep("idle")}
                          className="px-5 py-2.5 bg-white/5 border border-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                          انصراف
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (validateSubStep(1)) {
                              setCheckoutSubStep(2);
                              playInteractionChime("button");
                            }
                          }}
                          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
                        >
                          <span>ثبت و مرحله بعد (نشانی ارسال) ←</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {checkoutSubStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <input 
                              type="text" 
                              placeholder="استان و شهر مقصد"
                              value={shippingForm.city}
                              onChange={(e) => {
                                setShippingForm(p => ({ ...p, city: e.target.value }));
                                if (formErrors.city) setFormErrors(p => ({ ...p, city: "" }));
                              }}
                              className={`w-full px-4 py-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                              }`}
                            />
                            {formErrors.city && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.city}</p>}
                          </div>

                          <div className="space-y-1.5">
                            <input 
                              type="text" 
                              placeholder="کد پستی ده رقمی"
                              value={shippingForm.postalCode}
                              onChange={(e) => {
                                setShippingForm(p => ({ ...p, postalCode: e.target.value }));
                                if (formErrors.postalCode) setFormErrors(p => ({ ...p, postalCode: "" }));
                              }}
                              className={`w-full px-4 py-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-wider ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <textarea 
                            placeholder="آدرس پستی کامل"
                            value={shippingForm.address}
                            onChange={(e) => {
                              setShippingForm(p => ({ ...p, address: e.target.value }));
                              if (formErrors.address) setFormErrors(p => ({ ...p, address: "" }));
                            }}
                            className={`w-full px-4 py-3 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 resize-none ${
                              isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                            }`}
                            rows={3}
                          />
                          {formErrors.address && <p className="text-[10px] text-rose-500 font-bold mt-1">{formErrors.address}</p>}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-500/10 gap-3 mt-6">
                        <button 
                          type="button" 
                          onClick={() => { setCheckoutSubStep(1); setFormErrors({}); }}
                          className="px-5 py-2.5 bg-white/5 border border-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                          → بازگشت به مرحله قبل
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (validateSubStep(2)) {
                              setCheckoutSubStep(3);
                              playInteractionChime("button");
                            }
                          }}
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-lg shadow-amber-500/10 transition-all hover:scale-105 active:scale-95"
                        >
                          <span>مرحله بعد (انتخاب روش پرداخت) ←</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {checkoutSubStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[11px] leading-relaxed text-amber-200">
                        روش پرداخت دلخواه خود را انتخاب کنید:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPayMethod("wallet")}
                          className={`p-5 rounded-2xl border text-right transition-all cursor-pointer space-y-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 ${
                            payMethod === "wallet" ? "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/30" : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                          }`}
                        >
                          <Wallet className="w-8 h-8 text-amber-500 mx-auto" />
                          <div className="text-center space-y-1">
                            <span className="block text-xs font-black text-amber-400">کیف پول زرین‌کالا</span>
                            <span className="block text-[10px] text-slate-400">موجودی: {toPersianNum((currentUser?.walletBalance || 0).toLocaleString())} ریال</span>
                            {(currentUser?.walletBalance || 0) >= cartTotal ? (
                              <span className="block text-[9px] text-emerald-500 font-bold">کارمزد ندارد</span>
                            ) : (
                              <span className="block text-[9px] text-rose-500 font-bold">موجودی کافی نیست</span>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayMethod("bank")}
                          className={`p-5 rounded-2xl border text-right transition-all cursor-pointer space-y-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 ${
                            payMethod === "bank" ? "border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/30" : "border-slate-500/20 bg-slate-800/50 hover:bg-slate-700/50"
                          }`}
                        >
                          <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="text-center space-y-1">
                            <span className="block text-xs font-black text-slate-200">کارت بانکی شتاب</span>
                            <span className="block text-[10px] text-slate-400">پرداخت برخط با درگاه شاپرک</span>
                            <span className="block text-[9px] text-slate-500">کارمزد: ۰.۵٪</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayMethod("cod")}
                          className={`p-5 rounded-2xl border text-right transition-all cursor-pointer space-y-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 ${
                            payMethod === "cod" ? "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                          }`}
                        >
                          <Truck className="w-8 h-8 text-emerald-500 mx-auto" />
                          <div className="text-center space-y-1">
                            <span className="block text-xs font-black text-emerald-400">پرداخت درب منزل</span>
                            <span className="block text-[10px] text-slate-400">نقدی هنگام تحویل کالا</span>
                            <span className="block text-[9px] text-emerald-500 font-bold">بدون کارمزد</span>
                          </div>
                        </button>
                      </div>
                      <div className="flex justify-between pt-4 border-t border-slate-500/10 gap-3 mt-2">
                        <button 
                          type="button" 
                          onClick={() => { setCheckoutSubStep(2); setFormErrors({}); }}
                          className="px-5 py-2.5 bg-white/5 border border-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                          → بازگشت به نشانی ارسال
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (!payMethod) {
                              showToast("لطفاً یک روش پرداخت انتخاب کنید.", "warning");
                              return;
                            }
                            if (payMethod === "wallet") {
                              if ((currentUser?.walletBalance || 0) >= cartTotal) {
                                const updatedUsers = users.map(u =>
                                  u.id === currentUser?.id ? { ...u, walletBalance: u.walletBalance - cartTotal } : u
                                );
                                setUsers(updatedUsers);
                                setCurrentUser(prev => prev ? { ...prev, walletBalance: (prev.walletBalance || 0) - cartTotal } : prev);
                                registerNewOrder("wallet");
                              } else {
                                showToast("موجودی کیف پول شما کافی نیست.", "error");
                              }
                            } else if (payMethod === "cod") {
                              registerNewOrder("cod");
                            } else {
                              setCheckoutStep("bank");
                              setPayCardNumber("");
                              setPayCvv2("");
                              setPayMonth("");
                              setPayYear("");
                              setPayPin("");
                              setPayOtpSentCode("");
                              setPayOtpCountdown(0);
                              setPayErrors({});
                              setIsPayProcessing(false);
                              setBankSessionTimer(600);
                              generateNewCaptcha();
                              playInteractionChime("success");
                            }
                          }}
                          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer shadow-lg shadow-emerald-500/10 transition-all hover:scale-105 active:scale-95"
                        >
                          <span>تایید و ادامه</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
                )}

              {/* STEP B: COZY BANK PAYMENT GATEWAY SIMULATION SCREEN (Desktop) */}
              {checkoutStep === "bank" && (
                <div className="hidden lg:block space-y-6 text-right animate-fade-in">

                  <>
                  {/* SMS OTP Notification Simulation Banner */}
                  <AnimatePresence>
                    {showOtpNotification && payOtpSentCode && (
                      <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold leading-relaxed flex items-center justify-between text-right shadow-lg backdrop-blur-md mb-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-1.5 rounded-lg bg-amber-405 text-slate-950 text-base animate-bounce">💬</span>
                          <div>
                            <span className="text-[10px] text-amber-500 uppercase font-black tracking-wider block">سامانه فرستنده رمز پویا (شتاب)</span>
                            <span>رمز دوم یک‌بار مصرف شما: <strong className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-white/5">{toPersianNum(payOtpSentCode)}</strong> می‌باشد. اعتبار: ۱۲۰ ثانیه.</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowOtpNotification(false)}
                          className="px-2 py-1 text-[10px] bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
                        >
                          تایید دریافت
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fact sheet details */}
                  <div className={`p-5 rounded-3xl space-y-3 text-xs border ${isDarkMode ? "bg-slate-950 border-white/5 shadow-2xl" : "bg-slate-50 border-slate-200 shadow-md"}`}>
                    
                    {activeBankFlow === "wallet" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-500/10 pb-2.5">
                          <span className="text-sm font-black text-amber-550 flex items-center gap-1.5">
                            <Wallet className="w-5 h-5" />
                            فکت‌شیت افزایش موجودی کیف پول
                          </span>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-black px-2.5 py-0.5 rounded-full">
                            سریع و آنی
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-450 leading-relaxed text-right">
                          شما در حال افزایش موجودی کیف پول الکترونیکی خود به صورت آنی و مستقیم از طریق شبکه شتاب هستید.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-500/10 pb-2.5">
                          <span className="text-sm font-black text-amber-550 flex items-center gap-1.5">
                            <ShoppingCart className="w-5 h-5" />
                            فکت‌شیت جزئیات تسویه حساب خرید
                          </span>
                        </div>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-400">
                              <span>• {item.product.title} ( تعداد: {toPersianNum(item.quantity)} )</span>
                              <span className="font-mono">{toPersianNum((item.product.discountPrice || item.product.price) * item.quantity)} تومان</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PANEL: RECEIPT DETAILS & VIRTUAL CREDIT CARD (col-span-12 on small, 5 on lg) */}
                    <div className="lg:col-span-5 w-full space-y-4">
                      
                      {/* Total Amount Highlight Card */}
                      <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                        <div className="flex justify-between items-center font-black text-xs sm:text-sm mb-2">
                          <span>کل مبلغ نهایی پرداخت:</span>
                          <span className="text-emerald-400 font-mono text-xs sm:text-sm text-left">
                            {activeBankFlow === "wallet" 
                              ? `${toPersianNum((walletRechargeAmount || 0).toLocaleString())} ریال (${toPersianNum(((walletRechargeAmount || 0) / 10).toLocaleString())} تومان)`
                              : `${toPersianNum(cartTotal)} تومان (${toPersianNum(cartTotal * 10)} ریال)`
                            }
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 text-[11px] text-slate-400 border-t border-slate-500/10">
                          <div className="flex justify-between">
                            <span>پذیرنده وبسایت:</span>
                            <span className="font-bold text-amber-500">شرکت تجارت الکترونیک زرین‌کالا</span>
                          </div>
                          <div className="flex justify-between">
                            <span>شماره شناسایی ترمینال خرید:</span>
                            <span className="font-mono text-slate-300">TRM-8894103</span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Virtual Card Preview Block */}
                      {(() => {
                        const prefix = payCardNumber.replace(/\D/g, "").slice(0, 6);
                        let bankName = "کارت شتاب بانکی";
                        let bankBg = "from-slate-800 via-slate-850 to-slate-900 shadow-slate-950/40 border border-white/5 text-slate-100";
                        let bankLogo = "💳";
                        
                        if (prefix.startsWith("603799") || prefix.startsWith("603770")) {
                          bankName = "بانک ملی ایران";
                          bankBg = "from-amber-800 via-amber-950 to-amber-900 shadow-amber-500/10 border border-white/5 text-white";
                          bankLogo = "🏛️";
                        } else if (prefix.startsWith("610433")) {
                          bankName = "بانک ملت";
                          bankBg = "from-rose-950 via-neutral-900 to-red-900 shadow-red-500/10 border border-white/5 text-white";
                          bankLogo = "🔴";
                        } else if (prefix.startsWith("621986")) {
                          bankName = "بانک سامان";
                          bankBg = "from-amber-950 via-slate-900 to-amber-900 shadow-amber-400/10 border border-white/5 text-white";
                          bankLogo = "🌊";
                        } else if (prefix.startsWith("502229")) {
                          bankName = "بانک پاسارگاد";
                          bankBg = "from-neutral-850 via-neutral-950 to-yellow-600 bg-black/80 shadow-yellow-500/5 border border-amber-500/20 text-amber-100";
                          bankLogo = "🦁";
                        } else if (prefix.startsWith("622106")) {
                          bankName = "بانک پارسیان";
                          bankBg = "from-red-950 via-amber-950 to-slate-900 shadow-amber-500/5 border border-amber-500/15 text-yellow-105";
                          bankLogo = "⚜️";
                        } else if (prefix.startsWith("627353")) {
                          bankName = "بانک تجارت";
                          bankBg = "from-amber-950 via-slate-900 to-amber-900 shadow-amber-400/10 border border-white/5 text-white";
                          bankLogo = "💎";
                        } else if (prefix.startsWith("589210")) {
                          bankName = "بانک سپه";
                          bankBg = "from-amber-900 via-yellow-950 to-amber-950 shadow-emerald-500/5 border border-amber-500/15 text-yellow-50";
                          bankLogo = "🛡️";
                        }

                        const cleanCard = payCardNumber.replace(/\D/g, "").slice(0, 16);
                        let formattedCard = "";
                        for (let i = 0; i < 16; i++) {
                          if (i > 0 && i % 4 === 0) formattedCard += "   ";
                          formattedCard += cleanCard[i] || "•";
                        }

                        return (
                          <motion.div 
                            layout
                            className={`w-full p-6 rounded-3xl bg-gradient-to-tr ${bankBg} relative overflow-hidden flex flex-col justify-between aspect-[1.6/1] shadow-xl`}
                          >
                            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                            
                            <div className="flex items-center justify-between relative z-1">
                              <span className="text-[11px] font-black tracking-wide bg-white/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                                <span>{bankLogo}</span>
                                <span>{bankName}</span>
                              </span>
                              <span className="text-[10px] font-mono tracking-widest text-slate-400 font-extrabold uppercase ml-1">Zarin-Asa Pay</span>
                            </div>

                            <div className="w-10 h-7.5 bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 rounded-lg shadow-inner flex flex-col justify-between p-1 mt-4 relative z-1 overflow-hidden opacity-90">
                              <div className="border border-amber-950/20 w-full h-0 z-1" />
                              <div className="border border-amber-950/20 w-full h-0 z-1" />
                            </div>

                            <div dir="ltr" className="text-center font-mono text-base sm:text-lg font-black tracking-widest text-[15px] sm:text-[17px] my-3 select-all relative z-1 block drop-shadow-md">
                              {toPersianNum(formattedCard)}
                            </div>

                            <div className="flex items-end justify-between relative z-1 text-xs">
                              <div className="space-y-0.5 text-right">
                                <span className="text-[8px] text-slate-450 uppercase font-black block">دارنده نهایی کارت</span>
                                <span className="font-extrabold text-[11px]">{currentUser?.fullName || shippingForm.fullName || "کاربر گرامی"}</span>
                              </div>
                              <div className="flex gap-4">
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] text-slate-450 uppercase font-black block">CVV2</span>
                                  <span className="font-mono font-bold text-[11px]">{toPersianNum(payCvv2 || "•••")}</span>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] text-slate-450 uppercase font-black block">انقضاء</span>
                                  <span className="font-mono font-bold text-[11px]">
                                    {payMonth ? toPersianNum(payMonth) : "••"}
                                    <span>/</span>
                                    {payYear ? toPersianNum(payYear) : "••"}
                                  </span>
                                </div>
                              </div>
                            </div>
                      </motion.div>
                        );
                      })()}


                    </div>

                    {/* RIGHT PANEL: INTERACTIVE FORM HANDLER (col-span-12 on small, 7 on lg) */}
                    <form onSubmit={handleCompletePayment} className="lg:col-span-7 w-full space-y-4">
                      
                      <div className="space-y-3">

                        {/* Card Number Field */}
                        <div className="space-y-1">
                          <div className="relative">
                            <input 
                              type="text"
                              maxLength={25}
                              inputMode="numeric"
                              value={payCardNumber}
                              onChange={(e) => {
                                const pure = e.target.value.replace(/\D/g, "").slice(0, 16);
                                const parts = [];
                                for (let i = 0; i < pure.length; i += 4) {
                                  parts.push(pure.slice(i, i + 4));
                                }
                                setPayCardNumber(parts.join(" - "));
                              }}
                              placeholder="لطفا شماره کارت خود را وارد نمایید"
                              dir="ltr"
                              className={`w-full px-3.5 py-2 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest select-all text-ellipsis overflow-hidden whitespace-nowrap text-xs text-right ${
                                isDarkMode ? "bg-slate-950 text-slate-100 placeholder-slate-700 placeholder:text-[10px]" : "bg-slate-50 border text-slate-950 border-slate-200 placeholder-slate-400 placeholder:text-[10px]"
                              }`}
                            />
                            {!payCardNumber && <CreditCard className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />}
                          </div>
                          {payErrors.cardNumber && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.cardNumber}</p>}
                        </div>

                        {/* Two Columns: CVV2 & Expiry */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          <div className="space-y-1">
                            <input 
                              type="password"
                              maxLength={4}
                              inputMode="numeric"
                              value={payCvv2}
                                                            onChange={(e) => setPayCvv2(e.target.value.replace(/\D/g, ""))}
                              placeholder="کد امنیتی کارت"
                              className={`w-full px-3.5 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-left ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                              }`}
                            />
                            {payErrors.cvv2 && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.cvv2}</p>}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block">تاریخ انقضاء</label>
                            <div className="flex gap-2">
                              {/* Month Selector */}
                              <div className="relative flex-1 z-10">
                                <button 
                                  type="button"
                                  onClick={() => setOpenExpirySelect(openExpirySelect === "month" ? null : "month")}
                                  className={`w-full flex items-center justify-between transition-all duration-200 pl-7 pr-3 py-2.5 text-xs font-bold rounded-2xl outline-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer ${
                                    isDarkMode ? "bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 border border-white/10" : "bg-gradient-to-b from-white to-slate-50 text-slate-800 border border-slate-200"
                                  } ${payMonth ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                                >
                                  <span>{payMonth ? toPersianNum(payMonth) : "ماه"}</span>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${openExpirySelect === "month" ? "rotate-180 text-amber-500" : ""}`} />
                                </button>
                                <AnimatePresence>
                                  {openExpirySelect === "month" && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setOpenExpirySelect(null)} />
                                      <motion.div 
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute left-0 top-full mt-1.5 w-full z-40 rounded-2xl border-2 shadow-2xl overflow-hidden ${
                                          isDarkMode ? "bg-slate-900 border-amber-500/20 shadow-black/70" : "bg-white border-amber-500/20 shadow-amber-500/5"
                                        }`}
                                        dir="rtl"
                                      >
                                        <div className="max-h-44 overflow-y-auto cust-scroll" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(251,191,36,0.3) transparent" }}>
                                          {Array.from({ length: 12 }).map((_, mIdx) => {
                                            const val = (mIdx + 1).toString().padStart(2, "0");
                                            const active = payMonth === val;
                                            return (
                                              <button
                                                key={val}
                                                type="button"
                                                onClick={() => { setPayMonth(val); setOpenExpirySelect(null); }}
                                                className={`w-full text-right px-4 py-2.5 text-xs font-bold transition-all duration-100 cursor-pointer ${
                                                  active
                                                    ? "bg-amber-500/15 text-amber-500"
                                                    : isDarkMode
                                                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                                                      : "text-slate-600 hover:bg-amber-500/5 hover:text-slate-900"
                                                }`}
                                              >
                                                {toPersianNum(val)}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                              
                              {/* Year Selector */}
                              <div className="relative flex-1 z-10">
                                <button 
                                  type="button"
                                  onClick={() => setOpenExpirySelect(openExpirySelect === "year" ? null : "year")}
                                  className={`w-full flex items-center justify-between transition-all duration-200 pl-7 pr-3 py-2.5 text-xs font-bold rounded-2xl outline-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer ${
                                    isDarkMode ? "bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 border border-white/10" : "bg-gradient-to-b from-white to-slate-50 text-slate-800 border border-slate-200"
                                  } ${payYear ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                                >
                                  <span>{payYear ? `۱۴${toPersianNum(payYear)}` : "سال"}</span>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${openExpirySelect === "year" ? "rotate-180 text-amber-500" : ""}`} />
                                </button>
                                <AnimatePresence>
                                  {openExpirySelect === "year" && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setOpenExpirySelect(null)} />
                                      <motion.div 
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute left-0 top-full mt-1.5 w-full z-40 rounded-2xl border-2 shadow-2xl overflow-hidden ${
                                          isDarkMode ? "bg-slate-900 border-amber-500/20 shadow-black/70" : "bg-white border-amber-500/20 shadow-amber-500/5"
                                        }`}
                                        dir="rtl"
                                      >
                                        <div className="max-h-44 overflow-y-auto cust-scroll" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(251,191,36,0.3) transparent" }}>
                                          {Array.from({ length: 11 }).map((_, yIdx) => {
                                            const val = (yIdx + 5).toString().padStart(2, "0");
                                            const active = payYear === val;
                                            return (
                                              <button
                                                key={val}
                                                type="button"
                                                onClick={() => { setPayYear(val); setOpenExpirySelect(null); }}
                                                className={`w-full text-right px-4 py-2.5 text-xs font-bold transition-all duration-100 cursor-pointer ${
                                                  active
                                                    ? "bg-amber-500/15 text-amber-500"
                                                    : isDarkMode
                                                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                                                      : "text-slate-600 hover:bg-amber-500/5 hover:text-slate-900"
                                                }`}
                                              >
                                                ۱۴{toPersianNum(val)}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            {(payErrors.month || payErrors.year) && <p className="text-[10px] text-rose-500 font-extrabold">تاریخ انقضاء نادرست است.</p>}
                          </div>

                        </div>

                        {/* Interactive Captcha Verification Field */}
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            
                            <input 
                              type="text"
                              maxLength={4}
                              inputMode="numeric"
                              value={payCaptcha}
                              onChange={(e) => setPayCaptcha(e.target.value.replace(/\D/g, ""))}
                              placeholder="کد امنیتی تصویر روبرو"
                              className={`flex-grow px-3.5 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-center ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                              }`}
                            />

                            {/* Captcha representation graphic decoration */}
                            <div className="bg-emerald-500/10 p-1 rounded-xl flex items-center justify-center gap-2 select-none shrink-0 border border-emerald-500/20 h-9 px-4 relative overflow-hidden">
                              <span className="font-mono text-sm font-black tracking-widest text-emerald-400 italic skew-x-12 select-none">
                                {toPersianNum(payCaptchaValue)}
                              </span>
                              
                              {/* Refresh Captcha Button */}
                              <button 
                                type="button" 
                                onClick={() => { generateNewCaptcha(); playInteractionChime("button"); }}
                                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white shrink-0 transition-colors cursor-pointer"
                                title="تولید بارکد امنیتی جدید"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                          {payErrors.captcha && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.captcha}</p>}
                        </div>

                        {/* SMS Interactive Dynamic Pin (رمز پویا) Field */}
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            
                            <input 
                              type="password"
                              maxLength={6}
                              inputMode="numeric"
                              value={payPin}
                                                            onChange={(e) => setPayPin(e.target.value.replace(/\D/g, ""))}
                              placeholder="رمز دوم یک‌بار مصرف (رمز پویا)"
                              className={`flex-grow px-3.5 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-left ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 border text-slate-950 border-slate-200"
                              }`}
                            />

                            {/* Interactive Dynamic Code Requester */}
                            <button 
                              type="button"
                              disabled={payOtpCountdown > 0}
                              onClick={handleRequestOtp}
                              className={`px-4 py-2 text-xs font-black rounded-xl shrink-0 transition-all cursor-pointer ${
                                payOtpCountdown > 0 
                                  ? "bg-slate-800 text-slate-400 border border-white/5" 
                                  : "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-550 hover:scale-101"
                              }`}
                            >
                              {payOtpCountdown > 0 
                                ? `ارسال مجدد (${toPersianNum(payOtpCountdown)}ث)` 
                                : "درخواست رمز پویا"}
                            </button>

                          </div>
                          {payErrors.pin && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.pin}</p>}
                        </div>

                        {/* Active Session Warning Card */}
                        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200"} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold">زمان باقیمانده اتصال به درگاه شاپرک:</span>
                          </div>
                          
                          {(() => {
                            const minutes = Math.floor(bankSessionTimer / 60);
                            const seconds = bankSessionTimer % 60;
                            const formattedSessionTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                            return (
                              <span className="font-mono text-rose-400 font-black text-sm bg-rose-500/10 px-2.5 py-1 rounded-xl tracking-wider">
                                {toPersianNum(formattedSessionTime)}
                              </span>
                            );
                          })()}
                        </div>

                        

                      </div>

                      {/* Gateway control buttons */}
                      <div className="flex justify-end pt-3 border-t border-slate-500/10 gap-3 mt-4">
                        <button 
                          type="button" 
                          onClick={() => { setCheckoutStep("form"); playInteractionChime("button"); }}
                          className="px-5 py-2 bg-white/5 border border-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          انصراف و تصحیح نشانی
                        </button>
                        
                        <button 
                          type="submit"
                          disabled={isPayProcessing}
                          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-98 disabled:opacity-50 transition-all min-w-[120px]"
                        >
                          {isPayProcessing ? (
                            <>
                              <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                              <span>در حال تراکنش...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4.5 h-4.5" />
                              <span>پرداخت نهایی و تسویه</span>
                            </>
                          )}
                        </button>
                      </div>

                    </form>

                  </div>
                  </>
                </div>
              )}

              {/* STEP B: COZY BANK PAYMENT GATEWAY SIMULATION SCREEN (Mobile) */}
              {checkoutStep === "bank" && (
                <div className="lg:hidden space-y-6 text-right animate-fade-in">
                  <>
                  {/* SMS OTP Notification Simulation Banner */}
                  <AnimatePresence>
                    {showOtpNotification && payOtpSentCode && (
                      <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold leading-relaxed flex items-center justify-between text-right shadow-lg backdrop-blur-md mb-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-1.5 rounded-lg bg-amber-405 text-slate-950 text-base animate-bounce">💬</span>
                          <div>
                            <span className="text-[10px] text-amber-500 uppercase font-black tracking-wider block">سامانه فرستنده رمز پویا (شتاب)</span>
                            <span>رمز دوم یک‌بار مصرف شما: <strong className="font-mono text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-white/5">{toPersianNum(payOtpSentCode)}</strong> می‌باشد. اعتبار: ۱۲۰ ثانیه.</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowOtpNotification(false)}
                          className="px-2 py-1 text-[10px] bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
                        >
                          تایید دریافت
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col gap-6 items-start">
                    
                    {/* LEFT PANEL */}
                    <div className="w-full space-y-4">
                      
                      {/* Total Amount Highlight Card */}
                      <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                        <div className="flex justify-between items-center font-black text-xs sm:text-sm mb-2">
                          <span>کل مبلغ نهایی پرداخت:</span>
                          <span className="text-emerald-400 font-mono text-xs sm:text-sm text-left">
                            {activeBankFlow === "wallet" 
                              ? `${toPersianNum((walletRechargeAmount || 0).toLocaleString())} ریال (${toPersianNum(((walletRechargeAmount || 0) / 10).toLocaleString())} تومان)`
                              : `${toPersianNum(cartTotal)} تومان (${toPersianNum(cartTotal * 10)} ریال)`
                            }
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 text-[11px] text-slate-400 border-t border-slate-500/10">
                          <div className="flex justify-between">
                            <span>پذیرنده وبسایت:</span>
                            <span className="font-bold text-amber-500">شرکت تجارت الکترونیک زرین‌کالا</span>
                          </div>
                          <div className="flex justify-between">
                            <span>شماره شناسایی ترمینال خرید:</span>
                            <span className="font-mono text-slate-300">TRM-8894103</span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Virtual Card Preview Block */}
                      {(() => {
                        const prefix = payCardNumber.replace(/\D/g, "").slice(0, 6);
                        let bankName = "زرین‌بانک شتاب";
                        let bankBg = "from-slate-800 via-slate-850 to-slate-900 shadow-slate-950/40 border border-white/5 text-slate-100";
                        let bankLogo = "💳";
                        
                        if (prefix.startsWith("603799")) {
                          bankName = "بانک ملی ایران";
                          bankBg = "from-amber-800 via-amber-950 to-amber-900 shadow-amber-500/10 border border-white/5 text-white";
                          bankLogo = "🏛️";
                        } else if (prefix.startsWith("610433")) {
                          bankName = "بانک ملت";
                          bankBg = "from-rose-950 via-neutral-900 to-red-900 shadow-red-500/10 border border-white/5 text-white";
                          bankLogo = "🔴";
                        } else if (prefix.startsWith("621986")) {
                          bankName = "بانک سامان";
                          bankBg = "from-amber-950 via-slate-900 to-amber-900 shadow-amber-400/10 border border-white/5 text-white";
                          bankLogo = "🌊";
                        } else if (prefix.startsWith("502229")) {
                          bankName = "بانک پاسارگاد";
                          bankBg = "from-neutral-850 via-neutral-950 to-yellow-600 bg-black/80 shadow-yellow-500/5 border border-amber-500/20 text-amber-100";
                          bankLogo = "🦁";
                        } else if (prefix.startsWith("622106")) {
                          bankName = "بانک پارسیان";
                          bankBg = "from-red-950 via-amber-950 to-slate-900 shadow-amber-500/5 border border-amber-500/15 text-yellow-105";
                          bankLogo = "⚜️";
                        } else if (prefix.startsWith("627353")) {
                          bankName = "بانک تجارت";
                          bankBg = "from-amber-950 via-slate-900 to-amber-900 shadow-amber-400/10 border border-white/5 text-white";
                          bankLogo = "💎";
                        } else if (prefix.startsWith("589210")) {
                          bankName = "بانک سپه";
                          bankBg = "from-amber-900 via-yellow-950 to-amber-950 shadow-emerald-500/5 border border-amber-500/15 text-yellow-50";
                          bankLogo = "🛡️";
                        }

                        const cleanCard = payCardNumber.replace(/\D/g, "").slice(0, 16);
                        let formattedCard = "";
                        for (let i = 0; i < 16; i++) {
                          if (i > 0 && i % 4 === 0) formattedCard += "   ";
                          formattedCard += cleanCard[i] || "•";
                        }

                        return (
                          <motion.div 
                            layout
                            className={`w-full p-6 rounded-3xl bg-gradient-to-tr ${bankBg} relative overflow-hidden flex flex-col justify-between aspect-[1.6/1] shadow-xl`}
                          >
                            <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                            
                            <div className="flex items-center justify-between relative z-1">
                              <span className="text-[11px] font-black tracking-wide bg-white/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                                <span>{bankLogo}</span>
                                <span>{bankName}</span>
                              </span>
                              <span className="text-[10px] font-mono tracking-widest text-slate-400 font-extrabold uppercase ml-1">Zarin-Asa Pay</span>
                            </div>

                            <div className="w-10 h-7.5 bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 rounded-lg shadow-inner flex flex-col justify-between p-1 mt-4 relative z-1 overflow-hidden opacity-90">
                              <div className="border border-amber-950/20 w-full h-0 z-1" />
                              <div className="border border-amber-950/20 w-full h-0 z-1" />
                            </div>

                            <div dir="ltr" className="text-center font-mono text-base sm:text-lg font-black tracking-widest text-[15px] sm:text-[17px] my-3 select-all relative z-1 block drop-shadow-md">
                              {toPersianNum(formattedCard)}
                            </div>

                            <div className="flex items-end justify-between relative z-1 text-xs">
                              <div className="space-y-0.5 text-right">
                                <span className="text-[8px] text-slate-400 uppercase font-black block">دارنده نهایی کارت</span>
                                <span className="font-extrabold text-[11px]">{shippingForm.fullName || "کاربر گرامی"}</span>
                              </div>
                              <div className="flex gap-4">
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] text-slate-400 uppercase font-black block">CVV2</span>
                                  <span className="font-mono font-bold text-[11px]">{toPersianNum(payCvv2 || "•••")}</span>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-[8px] text-slate-400 uppercase font-black block">انقضاء</span>
                                  <span className="font-mono font-bold text-[11px]">
                                    {payMonth ? toPersianNum(payMonth) : "••"}
                                    <span>/</span>
                                    {payYear ? toPersianNum(payYear) : "••"}
                                  </span>
                                </div>
                              </div>
                            </div>

                          </motion.div>
                        );
                      })()}

                    </div>

                    {/* RIGHT PANEL: INTERACTIVE FORM HANDLER */}
                    <form onSubmit={handleCompletePayment} className="w-full space-y-4">
                      
                      <div className="space-y-3">

                        {/* Card Number Field */}
                        <div className="space-y-1">
                          <div className="relative">
                            <input 
                              type="text"
                              maxLength={25}
                              inputMode="numeric"
                              value={payCardNumber}
                              onChange={(e) => {
                                const pure = e.target.value.replace(/\D/g, "").slice(0, 16);
                                const parts = [];
                                for (let i = 0; i < pure.length; i += 4) {
                                  parts.push(pure.slice(i, i + 4));
                                }
                                setPayCardNumber(parts.join(" - "));
                              }}
                              placeholder="لطفا شماره کارت خود را وارد نمایید"
                              dir="ltr"
                              className={`w-full px-3.5 py-2 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest select-all text-ellipsis overflow-hidden whitespace-nowrap text-xs text-right ${
                                isDarkMode ? "bg-slate-950 text-slate-100 placeholder-slate-700 placeholder:text-[10px]" : "bg-slate-50 text-slate-950 border border-slate-200 placeholder-slate-400 placeholder:text-[10px]"
                              }`}
                            />
                            {!payCardNumber && <CreditCard className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />}
                          </div>
                          {payErrors.cardNumber && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.cardNumber}</p>}
                        </div>

                        {/* Two Columns: CVV2 & Expiry */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          <div className="space-y-1">
                            <input 
                              type="password"
                              maxLength={4}
                              inputMode="numeric"
                              value={payCvv2}
                                                            onChange={(e) => setPayCvv2(e.target.value.replace(/\D/g, ""))}
                              placeholder="کد امنیتی کارت"
                              className={`w-full px-3.5 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-left ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950 border border-slate-200"
                              }`}
                            />
                            {payErrors.cvv2 && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.cvv2}</p>}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold block">تاریخ انقضاء</label>
                            <div className="flex gap-2 relative z-10">
                              <div className="relative flex-1">
                                <button 
                                  type="button"
                                  onClick={() => setOpenExpirySelect(openExpirySelect === "month" ? null : "month")}
                                  className={`w-full flex items-center justify-between transition-all duration-200 pl-7 pr-3 py-2.5 text-xs font-bold rounded-2xl outline-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer ${
                                    isDarkMode ? "bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 border border-white/10" : "bg-gradient-to-b from-white to-slate-50 text-slate-800 border border-slate-200"
                                  } ${payMonth ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                                >
                                  <span>{payMonth ? toPersianNum(payMonth) : "ماه"}</span>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${openExpirySelect === "month" ? "rotate-180 text-amber-500" : ""}`} />
                                </button>
                                <AnimatePresence>
                                  {openExpirySelect === "month" && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setOpenExpirySelect(null)} />
                                      <motion.div 
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute left-0 top-full mt-1.5 w-full z-40 rounded-2xl border-2 shadow-2xl overflow-hidden ${
                                          isDarkMode ? "bg-slate-900 border-amber-500/20 shadow-black/70" : "bg-white border-amber-500/20 shadow-amber-500/5"
                                        }`}
                                        dir="rtl"
                                      >
                                        <div className="max-h-44 overflow-y-auto cust-scroll" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(251,191,36,0.3) transparent" }}>
                                          {Array.from({ length: 12 }).map((_, mIdx) => {
                                            const val = (mIdx + 1).toString().padStart(2, "0");
                                            const active = payMonth === val;
                                            return (
                                              <button
                                                key={val}
                                                type="button"
                                                onClick={() => { setPayMonth(val); setOpenExpirySelect(null); }}
                                                className={`w-full text-right px-4 py-2.5 text-xs font-bold transition-all duration-100 cursor-pointer ${
                                                  active
                                                    ? "bg-amber-500/15 text-amber-500"
                                                    : isDarkMode
                                                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                                                      : "text-slate-600 hover:bg-amber-500/5 hover:text-slate-900"
                                                }`}
                                              >
                                                {toPersianNum(val)}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                              
                              <div className="relative flex-1">
                                <button 
                                  type="button"
                                  onClick={() => setOpenExpirySelect(openExpirySelect === "year" ? null : "year")}
                                  className={`w-full flex items-center justify-between transition-all duration-200 pl-7 pr-3 py-2.5 text-xs font-bold rounded-2xl outline-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer ${
                                    isDarkMode ? "bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 border border-white/10" : "bg-gradient-to-b from-white to-slate-50 text-slate-800 border border-slate-200"
                                  } ${payYear ? "" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}
                                >
                                  <span>{payYear ? `۱۴${toPersianNum(payYear)}` : "سال"}</span>
                                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${openExpirySelect === "year" ? "rotate-180 text-amber-500" : ""}`} />
                                </button>
                                <AnimatePresence>
                                  {openExpirySelect === "year" && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setOpenExpirySelect(null)} />
                                      <motion.div 
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute left-0 top-full mt-1.5 w-full z-40 rounded-2xl border-2 shadow-2xl overflow-hidden ${
                                          isDarkMode ? "bg-slate-900 border-amber-500/20 shadow-black/70" : "bg-white border-amber-500/20 shadow-amber-500/5"
                                        }`}
                                        dir="rtl"
                                      >
                                        <div className="max-h-44 overflow-y-auto cust-scroll" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(251,191,36,0.3) transparent" }}>
                                          {Array.from({ length: 11 }).map((_, yIdx) => {
                                            const val = (yIdx + 5).toString().padStart(2, "0");
                                            const active = payYear === val;
                                            return (
                                              <button
                                                key={val}
                                                type="button"
                                                onClick={() => { setPayYear(val); setOpenExpirySelect(null); }}
                                                className={`w-full text-right px-4 py-2.5 text-xs font-bold transition-all duration-100 cursor-pointer ${
                                                  active
                                                    ? "bg-amber-500/15 text-amber-500"
                                                    : isDarkMode
                                                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                                                      : "text-slate-600 hover:bg-amber-500/5 hover:text-slate-900"
                                                }`}
                                              >
                                                ۱۴{toPersianNum(val)}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            {(payErrors.month || payErrors.year) && <p className="text-[10px] text-rose-500 font-extrabold">تاریخ انقضاء نادرست است.</p>}
                          </div>

                        </div>

                        {/* Interactive Captcha Verification Field */}
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            
                            <input 
                              type="text"
                              maxLength={4}
                              inputMode="numeric"
                              value={payCaptcha}
                              onChange={(e) => setPayCaptcha(e.target.value.replace(/\D/g, ""))}
                              placeholder="کد امنیتی تصویر روبرو"
                              className={`flex-grow px-3.5 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-center ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950 border border-slate-200"
                              }`}
                            />

                            <div className="bg-emerald-500/10 p-1 rounded-xl flex items-center justify-center gap-2 select-none shrink-0 border border-emerald-500/20 h-10 px-4 relative overflow-hidden">
                              <span className="font-mono text-sm font-black tracking-widest text-emerald-400 italic skew-x-12 select-none">
                                {toPersianNum(payCaptchaValue)}
                              </span>
                              <button 
                                type="button" 
                                onClick={() => { generateNewCaptcha(); playInteractionChime("button"); }}
                                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white shrink-0 transition-colors cursor-pointer"
                                title="تولید بارکد امنیتی جدید"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>
                          {payErrors.captcha && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.captcha}</p>}
                        </div>

                        {/* SMS Interactive Dynamic Pin Field */}
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            
                            <input 
                              type="password"
                              maxLength={6}
                              inputMode="numeric"
                              value={payPin}
                                                            onChange={(e) => setPayPin(e.target.value.replace(/\D/g, ""))}
                              placeholder="رمز دوم یک‌بار مصرف (رمز پویا)"
                              className={`flex-grow px-3.5 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono tracking-widest text-left ${
                                isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950 border border-slate-200"
                              }`}
                            />

                            <button 
                              type="button"
                              disabled={payOtpCountdown > 0}
                              onClick={handleRequestOtp}
                              className={`px-4 py-2 text-xs font-black rounded-xl shrink-0 transition-all cursor-pointer ${
                                payOtpCountdown > 0 
                                  ? "bg-slate-800 text-slate-400 border border-white/5" 
                                  : "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-550 hover:scale-101"
                              }`}
                            >
                              {payOtpCountdown > 0 
                                ? `ارسال مجدد (${toPersianNum(payOtpCountdown)}ث)` 
                                : "درخواست رمز پویا"}
                            </button>

                          </div>
                          {payErrors.pin && <p className="text-[10px] text-rose-500 font-extrabold">{payErrors.pin}</p>}
                        </div>

                        {/* Active Session Warning Card */}
                        <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200"} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold">زمان باقیمانده اتصال به درگاه شاپرک:</span>
                          </div>
                          
                          {(() => {
                            const minutes = Math.floor(bankSessionTimer / 60);
                            const seconds = bankSessionTimer % 60;
                            const formattedSessionTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                            return (
                              <span className="font-mono text-rose-400 font-black text-sm bg-rose-500/10 px-2.5 py-1 rounded-xl tracking-wider">
                                {toPersianNum(formattedSessionTime)}
                              </span>
                            );
                          })()}
                        </div>

                        

                      </div>

                      {/* Gateway control buttons */}
                      <div className="flex justify-end pt-3 border-t border-slate-500/10 gap-3 mt-4">
                        <button 
                          type="button" 
                          onClick={() => { setCheckoutStep("form"); playInteractionChime("button"); }}
                          className="px-5 py-2 bg-white/5 border border-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          انصراف و تصحیح نشانی
                        </button>
                        
                        <button 
                          type="submit"
                          disabled={isPayProcessing}
                          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-98 disabled:opacity-50 transition-all min-w-[120px]"
                        >
                          {isPayProcessing ? (
                            <>
                              <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                              <span>در حال تراکنش...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4.5 h-4.5" />
                              <span>پرداخت نهایی و تسویه</span>
                            </>
                          )}
                        </button>
                      </div>

                    </form>

                  </div>
                  </>
                </div>
              )}

              {/* STEP C: PURCHASE TRANSACTION SUCCESS RECEIPT SCREEN */}
              {checkoutStep === "success" && lastPlacedOrder && (
                <div className="space-y-6 py-4">
                  
                  {/* Celebration header */}
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle className="w-8 h-8 fill-current text-slate-900" />
                    </div>
                    <h3 className="text-xl font-black text-emerald-400">تراکنش با موفقیت به اتمام رسید!</h3>
                    <p className="text-xs text-slate-400">کالاهای ارزشمند شما ثبت و حواله انبار آن‌ها برای فردا امضا گردید.</p>
                  </div>

                  {/* Fact sheet display */}
                  <div className={`p-5 rounded-2xl space-y-3.5 text-xs ${isDarkMode ? "bg-slate-950" : "bg-slate-50 border"}`}>
                    
                    <div className="flex justify-between border-b pb-2 border-slate-500/10">
                      <span className="text-slate-400">شناسه سفارش ثبت‌شده:</span>
                      <span className="font-mono font-bold text-slate-100">{lastPlacedOrder.id}</span>
                    </div>

                    <div className="flex justify-between border-b pb-2 border-slate-500/10">
                      <span className="text-slate-400">شماره رهگیری پستی مرسوله:</span>
                      <span className="font-mono font-bold text-amber-400">{lastPlacedOrder.trackingNumber}</span>
                    </div>

                    <div className="flex justify-between border-b pb-2 border-slate-500/10">
                      <span className="text-slate-400">تحویل‌گیرنده:</span>
                      <span className="font-bold text-slate-100">{sanitize(lastPlacedOrder.shippingInfo.fullName)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">جمع نهایی پرداختی:</span>
                      <span className="font-mono font-bold text-emerald-400">{toPersianNum(lastPlacedOrder.total)} تومان</span>
                    </div>

                  </div>

                  <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-400 leading-relaxed text-center">
                    سفارش شما ثبت شد! شماره رهگیری مرسوله پستی را جهت ورود به تابلوی پیگیری سفارش‌های بالای صفحه به یاد بسپارید.
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button 
                      onClick={() => {
                        setCheckoutStep("idle");
                        setActiveTab("orders");
                        setTrackingSearchCode(lastPlacedOrder.id);
                        setTrackedOrder(lastPlacedOrder);
                        playInteractionChime("success");
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-amber-550/10 flex items-center justify-center gap-2"
                    >
                      <span>انتقال به صفحه سفارشات و رهگیری زنده روی نقشه</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setCheckoutStep("idle"); setActiveTab("shop"); playInteractionChime("button"); }}
                      className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      بازگشت به ویترین فروشگاه
                    </button>
                  </div>

                </div>
              )}

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* 7. HIGHLY POLISHED COSMIC FOOTER */}
      {!isAdminLoggedIn && (
      <footer role="contentinfo" className={`border-t py-6 text-xs transition-colors duration-300 ${
        isDarkMode ? "bg-slate-950 border-white/5 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <h4 onClick={() => { setActiveTab("about"); playInteractionChime("button"); }} className="font-black text-amber-500 cursor-pointer hover:text-amber-300 transition-colors text-sm">فروشگاه بزرگ زرین‌کالا</h4>
        </div>
      </footer>
      )}

      {/* 8. INTERACTIVE FLY-TO-CART TOAST NOTIFICATION */}
      <AnimatePresence>
        {cartNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[9999] p-3 sm:p-4 rounded-2xl shadow-2xl border flex items-center gap-2 sm:gap-4 flex-row backdrop-blur-xl sm:w-max sm:max-w-md overflow-hidden ${
              isDarkMode 
                ? "bg-slate-900/95 border-amber-500/30 shadow-amber-500/5 text-slate-100" 
                : "bg-white/95 border-amber-500/30 shadow-slate-950/10 text-slate-900"
            }`}
          >
            {/* Bounce scale icon indicators representing addition feedback */}
            <motion.div 
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br relative ${cartNotification.imageColor || "from-amber-400 to-orange-500"}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {renderProductIcon(cartNotification.iconType || "package", "w-5 h-5 sm:w-7 sm:h-7 text-white")}
              </div>
              {cartNotification.imageUrl ? (
                <img src={safeUrl(cartNotification.imageUrl)} alt={sanitize(cartNotification.productTitle)} className="w-7 h-7 sm:w-9 sm:h-9 object-contain relative" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              ) : null}
            </motion.div>

            <div className="space-y-0.5 text-right min-w-0 flex-1">
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-amber-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                افزوده شد_
              </span>

              <h4 className={`text-[10px] sm:text-xs font-black leading-tight mt-0.5 sm:mt-1 line-clamp-2 sm:max-w-sm ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                {cartNotification.productTitle}
              </h4>

              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                {/* Dynamic Counter Box */}
                  <span className="text-[9px] sm:text-[10px] bg-amber-500/10 text-amber-500 font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="hidden sm:inline">تعداد در سبد:</span>
                  <motion.span 
                    key={cartNotification.quantity}
                    initial={{ scale: 1.4, color: "#f59e0b" }}
                    animate={{ scale: 1, color: isDarkMode ? "#f59e0b" : "#b45309" }}
                    className="font-black font-mono text-[10px] sm:text-[11px]"
                  >
                    {toPersianNum(cartNotification.quantity)}
                  </motion.span>
                  <span>عدد</span>
                </span>
                
                <span className="text-[8px] sm:text-[9px] text-slate-400 hidden sm:inline">
                  (رویت در سبد بزرگ کالا)
                </span>
              </div>
            </div>

            {/* Manual Dismiss button */}
            <button
              onClick={() => setCartNotification(null)}
              className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0 self-start"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9. CONFIRM DIALOG */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`relative z-10 p-6 rounded-3xl border shadow-2xl max-w-sm w-full text-center space-y-4 ${
                isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-rose-400" />
              </div>
              <p className={`text-sm font-bold leading-relaxed ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{confirmDialog.message}</p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 ${
                    isDarkMode ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-black rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                >
                  تایید حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* 10. TOAST NOTIFICATION STACK */}
      <div aria-live="polite" aria-atomic="true" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2.5 w-max max-w-[90vw] pointer-events-none" dir="rtl">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
              className={`pointer-events-auto relative overflow-hidden px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl text-sm font-bold ${
                toast.type === "success" ? "bg-emerald-500/90 border-emerald-400/30 text-white shadow-emerald-500/20" :
                toast.type === "error" ? "bg-rose-500/90 border-rose-400/30 text-white shadow-rose-500/20" :
                toast.type === "warning" ? "bg-amber-500/90 border-amber-400/30 text-slate-950 shadow-amber-500/20" :
                "bg-slate-800/90 border-slate-600/30 text-slate-100 shadow-slate-800/20"
              }`}
            >
              <span className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${
                toast.type === "success" ? "bg-white/15" :
                toast.type === "error" ? "bg-white/15" :
                toast.type === "warning" ? "bg-slate-950/15" :
                "bg-white/10"
              }`}>
                {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> :
                 toast.type === "error" ? <AlertCircle className="w-4 h-4" /> :
                 toast.type === "warning" ? <AlertCircle className="w-4 h-4" /> :
                 <Info className="w-4 h-4" />}
              </span>
              <span className="text-[13px]">{toast.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0 mr-1">
                <X className="w-3 h-3" />
              </button>
              <div
                className={`absolute bottom-0 left-0 h-0.5 rounded-full ${
                  toast.type === "success" ? "bg-white/40" :
                  toast.type === "error" ? "bg-white/40" :
                  toast.type === "warning" ? "bg-slate-950/30" :
                  "bg-white/20"
                }`}
                style={{
                  animation: "shrink 4s linear forwards",
                  width: "100%"
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CHAT WIDGET - only for non-admin users */}
      {!isAdminLoggedIn && (
        <>
          {/* Floating chat button */}
          <button
            onClick={() => {
              setShowChat(prev => {
                if (!prev && firstChatOpen.current) {
                  firstChatOpen.current = false;
                  const greeting: ChatMessage = {
                    id: Date.now().toString(),
                    userId: "admin",
                    userName: "پشتیبانی زرین‌کالا",
                    text: "سلام دوست عزیز! به فروشگاه زرین‌کالا خوش آمدی! چه کمکی از دستم بر میاد خوشحال میشم بتونم کمکتون کنم 🤗",
                    timestamp: Date.now(),
                    isAdmin: true,
                    read: true,
                    targetUserId: currentUser?.id || "guest"
                  };
                  setTimeout(() => setMessages(prev => [...prev, greeting]), 300);
                }
                return !prev;
              });
              if (showChat && userUnreadMessages > 0) { setMessages(prev => prev.map(m => (m.userId === (currentUser?.id || "guest") && !m.isAdmin) ? { ...m, read: true } : m)); }
              playInteractionChime("button");
            }}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="چت با پشتیبانی"
          >
            {showChat ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            {userUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5.5 h-5.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg shadow-rose-500/30">
                {toPersianNum(userUnreadMessages)}
              </span>
            )}
          </button>

          {/* Chat panel */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`fixed bottom-24 right-4 sm:right-6 z-[9999] w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border overflow-hidden ${
                  isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
                }`}
                dir="rtl"
              >
                {/* Header */}
                <div className="bg-gradient-to-l from-amber-500 to-amber-600 p-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-slate-950" />
                  <span className="text-xs font-black text-slate-950">چت با پشتیبانی زرین‌کالا</span>
                </div>
                {/* Messages */}
                <div className="h-64 overflow-y-auto p-3 space-y-2 cust-scroll" style={{ scrollBehavior: "smooth" }}>
                  {(() => {
                    if (chatHistory.length > 0 && chatSessionChoice === null) {
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                          <MessageCircle className="w-8 h-8 text-amber-400 mb-3 opacity-60" />
                          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            یک گفتگوی قبلی از شما یافت شد.
                            <br />آیا می‌خواهید آن را ادامه دهید یا گفتگوی جدیدی شروع کنید؟
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setMessages(prev => {
                                  const existingIds = new Set(prev.map(p => p.id));
                                  return [...prev, ...chatHistory.filter(l => !existingIds.has(l.id))];
                                });
                                setChatSessionChoice("continue");
                              }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-all"
                            >
                              ادامه گفتگوی قبلی
                            </button>
                            <button
                              onClick={() => {
                                setChatHistory([]);
                                setChatSessionChoice("new");
                              }}
                              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all"
                            >
                              شروع گفتگوی جدید
                            </button>
                          </div>
                        </div>
                      );
                    }
                    const chatMsgs = messages.filter(m => m.userId === (currentUser?.id || "guest") || (m.isAdmin && m.targetUserId === (currentUser?.id || "guest")) || (m.userId === "ai_assistant" && m.targetUserId === (currentUser?.id || "guest")));
                    return chatMsgs.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-8">پیامی وجود ندارد. اولین پیام را شما بنویسید!</p>
                    ) : (
                      chatMsgs.map(msg => (
                        <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : msg.userId === "ai_assistant" ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.isAdmin
                              ? isDarkMode ? "bg-emerald-500/20 text-emerald-200 rounded-tr-sm" : "bg-emerald-500/10 text-emerald-800 rounded-tr-sm"
                              : msg.userId === "ai_assistant"
                              ? isDarkMode ? "bg-purple-500/20 text-purple-200 rounded-tr-sm" : "bg-purple-500/10 text-purple-800 rounded-tr-sm"
                              : isDarkMode ? "bg-amber-500/20 text-amber-200 rounded-tl-sm" : "bg-amber-500/10 text-amber-800 rounded-tl-sm"
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <span className="text-[8px] opacity-50 mt-1.5 block">
                              {msg.isAdmin ? "پشتیبانی" : msg.userId === "ai_assistant" ? "دستیار هوشمند" : msg.userName} • {toPersianNum(new Date(msg.timestamp).toLocaleString("fa-IR"))}
                            </span>
                          </div>
                        </div>
                      ))
                    );
                  })()}
                  {aiTyping && (
                    <div className="flex justify-start">
                      <div className={`max-w-[85%] p-3 rounded-2xl rounded-tr-sm ${isDarkMode ? "bg-purple-500/20" : "bg-purple-500/10"}`}>
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Input */}
                <div className={`p-3 border-t flex gap-2 ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && chatInput.trim() && !aiTyping) {
                        const text = chatInput.trim();
                        const newMsg: ChatMessage = {
                          id: Date.now().toString(),
                          userId: currentUser?.id || "guest",
                          userName: currentUser?.fullName || currentUser?.username || "کاربر مهمان",
                          text,
                          timestamp: Date.now(),
                          isAdmin: false,
                          read: false
                        };
                        setMessages(prev => [...prev, newMsg]);
                        addNotification("پیام جدید از کاربر", newMsg.userName + ": " + newMsg.text, "message");
                        setChatInput("");
                        playInteractionChime("success");
                        sendChatMessage(text);
                      }
                    }}
                    placeholder="پیام خود را بنویسید..."
                    className={`flex-1 px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-amber-500 ${
                      isDarkMode ? "bg-slate-800 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200"
                    }`}
                  />
                  <button
                    onClick={() => {
                      if (!chatInput.trim() || aiTyping) return;
                      const text = chatInput.trim();
                      const newMsg: ChatMessage = {
                        id: Date.now().toString(),
                        userId: currentUser?.id || "guest",
                        userName: currentUser?.fullName || currentUser?.username || "کاربر مهمان",
                        text,
                        timestamp: Date.now(),
                        isAdmin: false,
                        read: false
                      };
                      setMessages(prev => [...prev, newMsg]);
                      addNotification("پیام جدید از کاربر", newMsg.userName + ": " + newMsg.text, "message");
                      setChatInput("");
                      playInteractionChime("success");
                      sendChatMessage(text);
                    }}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* NOTIFICATION SEND MODAL (admin) */}
      <AnimatePresence>
        {notifTargetUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setNotifTargetUser(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl border shadow-2xl p-5 ${isDarkMode ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"}`}
              dir="rtl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black">ارسال نوتیفیکیشن به {notifTargetUser.name}</h3>
              </div>
              <textarea
                value={notifMessageText}
                onChange={e => setNotifMessageText(e.target.value)}
                placeholder="متن پیام..."
                rows={3}
                className={`w-full text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 resize-none ${isDarkMode ? "bg-slate-800 text-slate-100 border border-white/5" : "bg-slate-50 border border-slate-200"}`}
              />
              <div className="flex gap-2 mt-3 justify-end">
                <button type="button" onClick={() => setNotifTargetUser(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"
                >
                  انصراف
                </button>
                <button type="button" onClick={() => {
                  if (!notifMessageText.trim()) return;
                  if (notifTargetUser.id === "all") {
                    users.filter(u => u.username !== "admin").forEach(u => {
                      addNotification(`پیام مدیریت به ${u.fullName}`, notifMessageText.trim(), "info");
                    });
                    if ("Notification" in window && Notification.permission === "granted") {
                      new Notification("پیام مدیریت زرین‌کالا به همه کاربران", { body: notifMessageText.trim(), icon: "/product.png" });
                    }
                    showToast(`نوتیفیکیشن برای همه کاربران (${toPersianNum(users.filter(u => u.username !== "admin").length)} نفر) ارسال شد.`, "success");
                  } else {
                    addNotification("پیام مدیریت", notifMessageText.trim(), "info");
                    if ("Notification" in window && Notification.permission === "granted") {
                      new Notification("پیام مدیریت زرین‌کالا", { body: notifMessageText.trim(), icon: "/product.png" });
                    }
                    showToast(`نوتیفیکیشن برای ${notifTargetUser.name} ارسال شد.`, "success");
                  }
                  setNotifTargetUser(null);
                  setNotifMessageText("");
                  playInteractionChime("success");
                }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5 inline-block ml-1" />
                  ارسال نوتیفیکیشن
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast progress bar keyframes */}
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      <style>{`.cust-scroll::-webkit-scrollbar { width: 4px; } .cust-scroll::-webkit-scrollbar-track { background: transparent; } .cust-scroll::-webkit-scrollbar-thumb { background: rgba(251,191,36,0.3); border-radius: 999px; }`}</style>
    </div>
  );
}
