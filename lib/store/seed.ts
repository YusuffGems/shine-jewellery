/* ──────────────────────────────────────────────────────────────
   Development seed — PLACEHOLDER DATA ONLY.
   Branches, products, customers, orders and metal rates are demo
   values for building and testing. Nothing here is real SHINE data.
   Deterministic (no random/Date.now) so server & client renders match.
   ────────────────────────────────────────────────────────────── */
import type {
  Badge, Branch, Category, Collection, Database, DiamondDetails, HomeSection, InventoryRecord,
  MediaAsset, MediaFolder, MetalColour, MetalRate, NavItem, Order, PlaceholderKind, Product,
} from "@/types";
import { calculatePrice } from "@/lib/pricing/engine";
import { PRESETS } from "@/lib/theme/tokens";
import { L, round2 } from "@/lib/utils";

const SEED_DATE = "2026-10-01T09:00:00.000Z";
const ADMIN_HASH = "90558040790bdfe340abf2f4c2e808b016a3f209d2ccdba04c17421969b9668a"; // Admin@123
const DEMO_HASH = "656bcb2824cc7fb3a679619615d07ae4f7d7895f99bfba262bca41e9d592c8bb"; // Demo@1234

/* ── Media ─────────────────────────────────────────────────── */
const media: MediaAsset[] = [];
/** url = generated placeholder in /public/media (see tools/media-generator). `generated` marks it "replace me" in Admin. */
function img(id: string, title: string, folder: MediaFolder, placeholder: PlaceholderKind, tags: string[] = [], url = "", generated = true): string {
  media.push({ id, type: "image", title, alt: L(title, title), folder, tags, url, placeholder, generated: generated && !!url, status: "active", sort: media.length, createdAt: SEED_DATE });
  return id;
}
function vid(id: string, title: string, folder: MediaFolder, videoType: MediaAsset["videoType"], posterId?: string, url = ""): string {
  media.push({ id, type: "video", title, alt: L(title, title), folder, tags: ["video"], url, placeholder: "video", posterId, generated: !!url, autoplay: true, muted: true, loop: true, controls: false, videoType, status: "active", sort: media.length, createdAt: SEED_DATE });
  return id;
}

const M = "/media";
// Brand — the client's own logo (not a placeholder)
img("m-logo", "SHINE logo — for light backgrounds", "Homepage", "campaign", ["brand", "logo"], `${M}/brand/shine-logo-horizontal.png`, false);
img("m-logo-light", "SHINE logo — for dark backgrounds", "Homepage", "campaign", ["brand", "logo"], `${M}/brand/shine-logo-horizontal-light.png`, false);
img("m-logo-stacked", "SHINE logo — stacked", "Homepage", "campaign", ["brand", "logo"], `${M}/brand/shine-logo-stacked.png`, false);
img("m-logo-original", "SHINE logo — original artwork", "Homepage", "campaign", ["brand", "logo"], `${M}/brand/shine-logo-original.jpg`, false);
img("m-favicon", "SHINE favicon", "Homepage", "campaign", ["brand"], `${M}/brand/favicon.png`, false);
const heroImg = img("m-hero", "Hero campaign — desktop", "Homepage", "campaign", ["hero"], `${M}/campaigns/hero.webp`);
const heroMobile = img("m-hero-mobile", "Hero campaign — mobile", "Homepage", "campaign", ["hero"], `${M}/campaigns/hero-mobile.webp`);
const heroVideo = vid("v-hero", "Hero film", "Videos", "Hero", undefined, `${M}/videos/hero_main.mp4`);
const diamondStory = img("m-diamond-story", "Diamond story", "Campaigns", "campaign", [], `${M}/campaigns/diamond-story.webp`);
const goldStory = img("m-gold-story", "Gold story", "Campaigns", "campaign", [], `${M}/campaigns/gold-story.webp`);
const editorial = img("m-editorial", "Editorial campaign", "Campaigns", "campaign", [], `${M}/campaigns/editorial.webp`);
const craftImg = img("m-craft", "Craftsmanship", "Campaigns", "campaign", [], `${M}/campaigns/craft.webp`);
const craftVideo = vid("v-craft", "Craftsmanship film", "Videos", "Craftsmanship", craftImg, `${M}/videos/craft.mp4`);
const persoImg = img("m-perso", "Personalisation", "Campaigns", "campaign", [], `${M}/campaigns/personalisation.webp`);
const storyVideoPoster = img("m-video-story", "Video story poster", "Campaigns", "campaign", [], `${M}/campaigns/video-story.webp`);
const storyVideo = vid("v-story", "Brand video story", "Videos", "Editorial", storyVideoPoster, `${M}/videos/story.mp4`);
const megaJewellery = img("m-mega-jewellery", "Mega menu feature — Jewellery", "Banners", "campaign", [], `${M}/banners/mega-jewellery.webp`);
const megaCollections = img("m-mega-collections", "Mega menu feature — Collections", "Banners", "collection", [], `${M}/banners/mega-collections.webp`);
const promoGifts = img("m-promo-gifts", "Promotional banner — Gifts", "Banners", "campaign", ["promo"], `${M}/collections/gifts.webp`);
const promoBridal = img("m-promo-bridal", "Promotional banner — Bridal", "Banners", "campaign", ["promo"], `${M}/collections/bridal.webp`);
const promoDiamond = img("m-promo-diamond", "Promotional banner — Diamonds", "Banners", "campaign", ["promo"], `${M}/collections/diamond-stories.webp`);
for (let i = 1; i <= 6; i++) img(`m-social-${i}`, `Social tile ${String(i).padStart(2, "0")}`, "Social", "campaign", ["social"], `${M}/social/social-${i}.webp`);

/* ── Categories ────────────────────────────────────────────── */
const catDefs: [string, string, string][] = [
  ["gold-jewellery", "Gold Jewellery", "مجوهرات ذهبية"],
  ["diamond-jewellery", "Diamond Jewellery", "مجوهرات الألماس"],
  ["silver-jewellery", "Silver Jewellery", "مجوهرات فضية"],
  ["platinum-jewellery", "Platinum Jewellery", "مجوهرات البلاتين"],
  ["gold-bars", "Gold Bars", "سبائك ذهب"],
  ["silver-bars", "Silver Bars", "سبائك فضة"],
  ["gold-coins", "Gold Coins", "عملات ذهبية"],
  ["silver-coins", "Silver Coins", "عملات فضية"],
  ["rings", "Rings", "خواتم"],
  ["engagement-rings", "Engagement Rings", "خواتم الخطوبة"],
  ["earrings", "Earrings", "أقراط"],
  ["necklaces", "Necklaces", "قلائد"],
  ["bracelets", "Bracelets", "أساور"],
  ["bangles", "Bangles", "غوايش"],
  ["pendants", "Pendants", "معلقات"],
  ["gemstones", "Gemstones", "أحجار كريمة"],
  ["personalised", "Personalised Jewellery", "مجوهرات مخصصة"],
  ["wedding", "Wedding", "الزفاف"],
  ["gifting", "Gifting", "الهدايا"],
];
const categories: Category[] = catDefs.map(([slug, en, ar], i) => ({
  id: `cat-${slug}`,
  slug,
  name: L(en, ar),
  description: L(`Discover ${en.toLowerCase()} crafted with care.`, `اكتشف ${ar} المصنوعة بعناية.`),
  mediaId: img(`m-cat-${slug}`, `Category — ${en}`, "Collections", "category", [], `${M}/categories/${slug}.webp`),
  sort: i,
  active: true,
}));

/* ── Collections ───────────────────────────────────────────── */
const colDefs: [string, string, string, string, string][] = [
  ["the-shine-edit", "The Shine Edit", "مختارات شاين", "Our most-loved pieces, edited for the season.", "قطعنا الأكثر حباً، مختارة لهذا الموسم."],
  ["everyday-elegance", "Everyday Elegance", "أناقة كل يوم", "Light, refined jewellery made to be worn daily.", "مجوهرات خفيفة وراقية للارتداء اليومي."],
  ["bridal", "Bridal", "العروس", "Heirloom pieces for the most important day.", "قطع خالدة لأهم يوم في حياتك."],
  ["engagement", "Engagement", "الخطوبة", "Diamonds chosen for a lifetime promise.", "ألماس مختار لوعد يدوم مدى الحياة."],
  ["timeless-gold", "Timeless Gold", "ذهب خالد", "Pure gold, classic forms, enduring value.", "ذهب نقي، أشكال كلاسيكية، قيمة دائمة."],
  ["diamond-stories", "Diamond Stories", "حكايات الألماس", "Every stone, a story of light.", "كل حجر حكاية من الضوء."],
  ["modern-classics", "Modern Classics", "كلاسيكيات عصرية", "Clean lines with a contemporary edge.", "خطوط نقية بلمسة معاصرة."],
  ["gifts", "Gifts", "هدايا", "Thoughtful pieces for every occasion.", "قطع مدروسة لكل مناسبة."],
];
const collections: Collection[] = colDefs.map(([slug, en, ar, den, dar], i) => ({
  id: `col-${slug}`,
  slug,
  name: L(en, ar),
  description: L(den, dar),
  heroMediaId: img(`m-col-${slug}`, `Collection hero — ${en}`, "Collections", "collection", [], `${M}/collections/${slug}.webp`),
  thumbnailId: `m-col-${slug}`,
  seo: { title: `${en} | SHINE Gold & Diamonds`, description: den },
  sort: i,
  active: true,
}));

/* ── Metal rates (DEMO — not live) ─────────────────────────── */
const rates: MetalRate[] = [
  { id: "gold-24k", metal: "gold", purity: "24K", label: L("Gold 24K", "ذهب عيار 24"), ratePerGram: 390, updatedAt: SEED_DATE, source: "Demo seed — connect live provider", status: "demo" },
  { id: "gold-22k", metal: "gold", purity: "22K", label: L("Gold 22K", "ذهب عيار 22"), ratePerGram: 360, updatedAt: SEED_DATE, source: "Demo seed — connect live provider", status: "demo" },
  { id: "gold-21k", metal: "gold", purity: "21K", label: L("Gold 21K", "ذهب عيار 21"), ratePerGram: 343, updatedAt: SEED_DATE, source: "Demo seed — connect live provider", status: "demo" },
  { id: "gold-18k", metal: "gold", purity: "18K", label: L("Gold 18K", "ذهب عيار 18"), ratePerGram: 295, updatedAt: SEED_DATE, source: "Demo seed — connect live provider", status: "demo" },
  { id: "silver-999", metal: "silver", purity: "999", label: L("Silver 999", "فضة 999"), ratePerGram: 4.2, updatedAt: SEED_DATE, source: "Demo seed — connect live provider", status: "demo" },
  { id: "platinum-999", metal: "platinum", purity: "999", label: L("Platinum 999", "بلاتين 999"), ratePerGram: 130, updatedAt: SEED_DATE, source: "Demo seed — connect live provider", status: "demo" },
];

/* ── Products ──────────────────────────────────────────────── */
type Spec = {
  en: string; ar: string; type?: "jewellery" | "bullion"; cats: string[]; cols: string[]; rate: string; colour: MetalColour;
  w: number; mc: [Product["makingChargeType"], number]; wastage?: number; stone?: number; diamond?: DiamondDetails;
  badges?: Badge[]; occ: string[]; gender?: Product["gender"]; sizes?: string[]; premium?: number; video?: boolean;
};
const D = (carat: number, shape: string, colour: string, clarity: string, pieces: number, value: number): DiamondDetails => ({ carat, shape, colour, clarity, pieces, value });

const specs: Spec[] = [
  { en: "Solitaire Diamond Ring", ar: "خاتم سوليتير ألماس", cats: ["diamond-jewellery", "rings", "engagement-rings"], cols: ["engagement", "diamond-stories", "the-shine-edit"], rate: "gold-18k", colour: "White", w: 3.2, mc: ["perGram", 45], wastage: 4, diamond: D(0.5, "Round", "F", "VS1", 1, 6800), badges: ["BESTSELLER"], occ: ["Engagement", "Anniversary"], sizes: ["48", "50", "52", "54", "56"], video: true },
  { en: "Halo Diamond Ring", ar: "خاتم هالو ألماس", cats: ["diamond-jewellery", "rings", "engagement-rings"], cols: ["engagement", "bridal"], rate: "gold-18k", colour: "Rose", w: 3.8, mc: ["perGram", 48], wastage: 4, diamond: D(0.72, "Oval", "G", "VS2", 19, 7900), badges: ["NEW"], occ: ["Engagement", "Wedding"], sizes: ["48", "50", "52", "54"] },
  { en: "Eternity Band", ar: "خاتم الأبدية", cats: ["diamond-jewellery", "rings", "wedding"], cols: ["bridal", "modern-classics"], rate: "gold-18k", colour: "Yellow", w: 2.9, mc: ["perGram", 42], wastage: 3, diamond: D(1.0, "Round", "G", "SI1", 22, 6200), occ: ["Wedding", "Anniversary"], sizes: ["48", "50", "52", "54", "56", "58"] },
  { en: "Pavé Twist Ring", ar: "خاتم ملتف مرصع", cats: ["diamond-jewellery", "rings"], cols: ["modern-classics", "everyday-elegance"], rate: "gold-18k", colour: "Yellow", w: 2.4, mc: ["perGram", 40], wastage: 3, diamond: D(0.18, "Round", "H", "SI1", 14, 1450), badges: ["TRENDING"], occ: ["Everyday"], sizes: ["50", "52", "54"] },
  { en: "Classic 21K Gold Band", ar: "خاتم ذهب كلاسيكي عيار 21", cats: ["gold-jewellery", "rings"], cols: ["timeless-gold", "everyday-elegance"], rate: "gold-21k", colour: "Yellow", w: 4.5, mc: ["perGram", 18], wastage: 5, occ: ["Everyday", "Wedding"], gender: "Unisex", sizes: ["52", "54", "56", "58", "60", "62"] },
  { en: "Signet Ring", ar: "خاتم الختم", cats: ["gold-jewellery", "rings"], cols: ["modern-classics"], rate: "gold-21k", colour: "Yellow", w: 7.1, mc: ["perGram", 20], wastage: 5, occ: ["Everyday", "Gifting"], gender: "Men", sizes: ["58", "60", "62", "64"], badges: ["EXCLUSIVE"] },
  { en: "Diamond Stud Earrings", ar: "أقراط ألماس", cats: ["diamond-jewellery", "earrings"], cols: ["everyday-elegance", "diamond-stories", "gifts"], rate: "gold-18k", colour: "White", w: 1.6, mc: ["fixed", 420], wastage: 3, diamond: D(0.4, "Round", "G", "VS2", 2, 4200), badges: ["BESTSELLER"], occ: ["Everyday", "Gifting"], video: true },
  { en: "Drop Diamond Earrings", ar: "أقراط ألماس متدلية", cats: ["diamond-jewellery", "earrings"], cols: ["bridal", "diamond-stories"], rate: "gold-18k", colour: "Rose", w: 4.4, mc: ["perGram", 46], wastage: 4, diamond: D(1.1, "Pear", "F", "VS1", 26, 9800), badges: ["LIMITED"], occ: ["Wedding", "Anniversary"] },
  { en: "Gold Hoop Earrings", ar: "أقراط ذهب دائرية", cats: ["gold-jewellery", "earrings"], cols: ["timeless-gold", "everyday-elegance"], rate: "gold-22k", colour: "Yellow", w: 5.2, mc: ["perGram", 16], wastage: 5, occ: ["Everyday"], badges: ["NEW"] },
  { en: "Filigree Jhumka Earrings", ar: "أقراط فيليغري", cats: ["gold-jewellery", "earrings", "wedding"], cols: ["bridal", "timeless-gold"], rate: "gold-22k", colour: "Yellow", w: 11.8, mc: ["percent", 12], wastage: 6, occ: ["Wedding"] },
  { en: "Diamond Tennis Necklace", ar: "قلادة تنس ألماس", cats: ["diamond-jewellery", "necklaces"], cols: ["diamond-stories", "the-shine-edit"], rate: "gold-18k", colour: "White", w: 14.6, mc: ["perGram", 52], wastage: 4, diamond: D(4.2, "Round", "G", "VS2", 64, 31500), badges: ["EXCLUSIVE"], occ: ["Wedding", "Anniversary"], video: true },
  { en: "Layered Gold Chain", ar: "سلسلة ذهب متعددة الطبقات", cats: ["gold-jewellery", "necklaces"], cols: ["everyday-elegance", "modern-classics"], rate: "gold-21k", colour: "Yellow", w: 9.3, mc: ["perGram", 17], wastage: 5, occ: ["Everyday", "Gifting"], badges: ["TRENDING"] },
  { en: "Bridal Gold Necklace Set", ar: "طقم قلادة ذهب للعروس", cats: ["gold-jewellery", "necklaces", "wedding"], cols: ["bridal", "timeless-gold"], rate: "gold-22k", colour: "Yellow", w: 48.5, mc: ["percent", 14], wastage: 7, stone: 1800, occ: ["Wedding"], badges: ["EXCLUSIVE"] },
  { en: "Emerald Pendant", ar: "معلق زمرد", cats: ["gemstones", "pendants", "gold-jewellery"], cols: ["the-shine-edit", "gifts"], rate: "gold-18k", colour: "Yellow", w: 2.6, mc: ["fixed", 380], wastage: 3, stone: 2400, diamond: D(0.12, "Round", "G", "SI1", 12, 960), occ: ["Gifting", "Anniversary"] },
  { en: "Initial Pendant", ar: "معلق الحرف الأول", cats: ["personalised", "pendants", "gold-jewellery", "gifting"], cols: ["gifts", "everyday-elegance"], rate: "gold-21k", colour: "Yellow", w: 2.1, mc: ["fixed", 260], wastage: 4, occ: ["Gifting", "Everyday"], badges: ["NEW"] },
  { en: "Name Necklace", ar: "قلادة بالاسم", cats: ["personalised", "necklaces", "gold-jewellery", "gifting"], cols: ["gifts"], rate: "gold-18k", colour: "Rose", w: 3.4, mc: ["fixed", 340], wastage: 4, occ: ["Gifting"] },
  { en: "Diamond Line Bracelet", ar: "سوار ألماس", cats: ["diamond-jewellery", "bracelets"], cols: ["diamond-stories", "modern-classics"], rate: "gold-18k", colour: "White", w: 8.2, mc: ["perGram", 48], wastage: 4, diamond: D(2.0, "Round", "H", "VS2", 40, 15800), badges: ["BESTSELLER"], occ: ["Anniversary", "Gifting"] },
  { en: "Chain Link Bracelet", ar: "سوار سلسلة", cats: ["gold-jewellery", "bracelets"], cols: ["modern-classics", "everyday-elegance"], rate: "gold-21k", colour: "Yellow", w: 12.4, mc: ["perGram", 16], wastage: 5, occ: ["Everyday"], gender: "Unisex" },
  { en: "Engraved Gold Bangle", ar: "غويشة ذهب منقوشة", cats: ["gold-jewellery", "bangles"], cols: ["timeless-gold", "bridal"], rate: "gold-22k", colour: "Yellow", w: 18.7, mc: ["percent", 10], wastage: 6, occ: ["Wedding", "Everyday"], sizes: ["2.4", "2.6", "2.8"] },
  { en: "Slim Diamond Bangle", ar: "غويشة ألماس رفيعة", cats: ["diamond-jewellery", "bangles"], cols: ["the-shine-edit", "modern-classics"], rate: "gold-18k", colour: "Rose", w: 9.6, mc: ["perGram", 44], wastage: 4, diamond: D(0.6, "Round", "G", "VS2", 30, 5200), occ: ["Anniversary"], sizes: ["2.4", "2.6", "2.8"], badges: ["NEW"] },
  { en: "Platinum Couple Band", ar: "خاتم بلاتين للأزواج", cats: ["platinum-jewellery", "rings", "wedding"], cols: ["bridal", "modern-classics"], rate: "platinum-999", colour: "White", w: 6.0, mc: ["perGram", 55], wastage: 3, occ: ["Wedding"], gender: "Unisex", sizes: ["50", "54", "58", "62"] },
  { en: "Sterling Silver Cuff", ar: "سوار فضة", cats: ["silver-jewellery", "bracelets"], cols: ["modern-classics", "gifts"], rate: "silver-999", colour: "White", w: 24, mc: ["fixed", 180], wastage: 2, occ: ["Everyday", "Gifting"] },
  { en: "Gold Bar 10g 24K", ar: "سبيكة ذهب 10 غرام عيار 24", type: "bullion", cats: ["gold-bars"], cols: [], rate: "gold-24k", colour: "Yellow", w: 10, mc: ["fixed", 0], premium: 85, occ: ["Gifting"], gender: "Unisex" },
  { en: "Gold Coin 8g 22K", ar: "عملة ذهب 8 غرام عيار 22", type: "bullion", cats: ["gold-coins", "gifting"], cols: ["gifts"], rate: "gold-22k", colour: "Yellow", w: 8, mc: ["fixed", 0], premium: 70, occ: ["Gifting"], gender: "Unisex" },
  { en: "Silver Bar 100g", ar: "سبيكة فضة 100 غرام", type: "bullion", cats: ["silver-bars"], cols: [], rate: "silver-999", colour: "White", w: 100, mc: ["fixed", 0], premium: 35, occ: ["Gifting"], gender: "Unisex" },
  { en: "Silver Coin 31.1g", ar: "عملة فضة 31.1 غرام", type: "bullion", cats: ["silver-coins"], cols: ["gifts"], rate: "silver-999", colour: "White", w: 31.1, mc: ["fixed", 0], premium: 22, occ: ["Gifting"], gender: "Unisex" },
];

const products: Product[] = specs.map((s, i) => {
  const n = String(i + 1).padStart(3, "0");
  const slug = s.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const imageIds = [
    img(`m-p${n}-1`, `${s.en} — studio`, "Products", "product", [slug], `${M}/products/${n}-1.webp`),
    img(`m-p${n}-2`, `${s.en} — detail`, "Products", "product", [slug], `${M}/products/${n}-2.webp`),
    img(`m-p${n}-3`, `${s.en} — gift styling`, "Products", "product", [slug], `${M}/products/${n}-3.webp`),
  ];
  const videoIds = [vid(`v-p${n}`, `${s.en} — product video`, "Videos", "Product", imageIds[0], `${M}/videos/product-${n}.mp4`)];
  const isBullion = s.type === "bullion";
  return {
    id: `prd-${n}`,
    slug,
    sku: `DEMO-${n}`,
    name: L(s.en, s.ar),
    description: L(
      `Sample product for development. ${s.en} in ${s.colour.toLowerCase()} ${s.rate.replace("-", " ").toUpperCase()}. Replace with the final catalogue description.`,
      `منتج تجريبي لأغراض التطوير. ${s.ar}. استبدل هذا الوصف بالوصف النهائي من الكتالوج.`,
    ),
    type: isBullion ? "bullion" : "jewellery",
    categoryIds: s.cats.map((c) => `cat-${c}`),
    collectionIds: s.cols.map((c) => `col-${c}`),
    metal: s.rate.startsWith("gold") ? "gold" : s.rate.startsWith("silver") ? "silver" : "platinum",
    rateId: s.rate,
    metalColour: s.colour,
    netWeight: s.w,
    grossWeight: round2(s.w + (s.diamond ? s.diamond.carat * 0.2 : 0) + (s.stone ? 0.3 : 0)),
    makingChargeType: s.mc[0],
    makingCharge: s.mc[1],
    wastagePercent: s.wastage ?? 0,
    stoneValue: s.stone ?? 0,
    stoneDetails: s.stone ? "Sample coloured gemstone" : undefined,
    diamond: s.diamond,
    premium: s.premium ?? 0,
    otherCharges: 0,
    discountPercent: 0,
    certificateNo: s.diamond ? `SAMPLE-CERT-${n}` : undefined,
    badges: s.badges ?? [],
    occasions: s.occ,
    gender: s.gender ?? "Women",
    sizes: s.sizes ?? [],
    imageIds,
    videoIds,
    status: "active",
    popularity: 100 - ((i * 37) % 100),
    seo: { title: `${s.en} | SHINE Gold & Diamonds`, description: `${s.en} — SHINE Gold & Diamonds, Qatar.` },
    createdAt: new Date(Date.parse(SEED_DATE) - i * 86_400_000).toISOString(),
  };
});

/* ── Branches (placeholders — add real showrooms in Admin) ─── */
const branches: Branch[] = [1, 2, 3].map((n) => {
  const id = String(n).padStart(2, "0");
  return {
    id: `br-${id}`,
    name: L(`Branch ${id}`, `الفرع ${id}`),
    address: L(`Placeholder address for Branch ${id} — update in Admin › Showrooms`, `عنوان مؤقت للفرع ${id} — حدّثه من لوحة الإدارة`),
    zone: `Zone ${id}`,
    area: "Area — TBC",
    city: "Doha",
    landmark: "Landmark — TBC",
    phone: "",
    whatsapp: "",
    mapUrl: "",
    hours: L("Sat–Thu 10:00–22:00 · Fri 16:00–22:00 (placeholder)", "السبت–الخميس 10:00–22:00 · الجمعة 16:00–22:00 (مؤقت)"),
    imageIds: [img(`m-branch-${id}`, `Branch ${id} interior`, "Showrooms", "showroom", [], `${M}/showrooms/branch-${id}.webp`)],
    services: ["Jewellery Consultation", "Diamond Consultation", "Custom Design", "Repair", "Cleaning"],
    active: true,
    sort: n,
  };
});

/* ── Inventory ─────────────────────────────────────────────── */
const inventory: InventoryRecord[] = [];
products.forEach((p, i) => {
  branches.forEach((b, j) => {
    const total = (i + j * 3) % 7 === 0 ? 0 : ((i * 5 + j * 7) % 9) + 1;
    inventory.push({ id: `inv-${p.id}-${b.id}`, productId: p.id, branchId: b.id, total, reserved: 0, sold: 0, returned: 0, damaged: 0, transferred: 0 });
  });
});

/* ── Demo orders (for dashboard charts) ───────────────────── */
const orderStatuses: Order["status"][] = ["delivered", "delivered", "shipped", "confirmed", "paid", "ready_for_pickup", "delivered", "processing", "delivered", "refunded"];
const orders: Order[] = orderStatuses.map((status, i) => {
  const p = products[(i * 3) % products.length];
  const rate = rates.find((r) => r.id === p.rateId)!;
  const snap = calculatePrice(p, rate, 0);
  const qty = 1 + (i % 2);
  const at = new Date(Date.parse("2026-10-06T12:00:00.000Z") - i * 1.4 * 86_400_000).toISOString();
  const subtotal = round2(snap.total * qty);
  const custId = `cus-demo-${String((i % 3) + 1).padStart(2, "0")}`;
  return {
    id: `ord-demo-${i + 1}`,
    number: `SGD-DEMO-${String(1001 + i)}`,
    customerId: custId,
    customerName: `Demo Customer ${String((i % 3) + 1).padStart(2, "0")}`,
    email: `demo${(i % 3) + 1}@example.com`,
    phone: "",
    items: [{ productId: p.id, sku: p.sku, name: p.name, qty, unitPrice: snap.total, snapshot: snap, rateSnapshot: { rateId: rate.id, ratePerGram: rate.ratePerGram, at }, branchId: branches[i % 3].id }],
    subtotal,
    couponDiscount: 0,
    deliveryFee: 0,
    tax: 0,
    total: subtotal,
    fulfilment: i % 3 === 2 ? "pickup" : "delivery",
    pickupBranchId: i % 3 === 2 ? branches[i % 3].id : undefined,
    status,
    payment: { provider: "mock", status: status === "refunded" ? "refunded" : "succeeded", reference: `MOCK-${1001 + i}`, idempotencyKey: `seed-${i}` },
    history: [{ status: "pending_payment", at, note: "Demo order" }, { status, at, note: "Demo status" }],
    createdAt: at,
    isDemo: true,
  };
});
for (const o of orders) {
  if (o.status === "refunded") continue;
  for (const it of o.items) {
    const rec = inventory.find((r) => r.productId === it.productId && r.branchId === it.branchId);
    if (rec) { rec.total += it.qty; rec.sold += it.qty; }
  }
}

/* ── CMS ───────────────────────────────────────────────────── */
const S = (id: string, type: HomeSection["type"], o: Partial<HomeSection>): HomeSection => ({
  id, type, enabled: true, eyebrow: L(""), title: L(""), body: L(""), ctaLabel: L(""), ctaHref: "", ...o,
});
const sections: HomeSection[] = [
  S("sec-hero", "hero", { eyebrow: L("New Season", "الموسم الجديد"), title: L("Light, Made Precious", "ضوءٌ يصبح ثميناً"), body: L("Gold and diamond jewellery crafted for the moments that stay with you.", "مجوهرات من الذهب والألماس صُنعت للحظات التي تبقى معك."), ctaLabel: L("Discover the Collection", "اكتشف المجموعة"), ctaHref: "/collections/the-shine-edit", mediaId: heroImg, mobileMediaId: heroMobile, videoId: heroVideo }),
  S("sec-categories", "categories", { eyebrow: L("Explore", "استكشف"), title: L("Shop by Category", "تسوّق حسب الفئة") }),
  S("sec-featured", "featuredCollection", { eyebrow: L("Featured Collection", "مجموعة مميزة"), title: L("Diamond Stories", "حكايات الألماس"), body: L("Brilliance in every facet — pieces designed to catch the light of Doha evenings.", "بريق في كل وجه — قطع صُممت لتلتقط أضواء أمسيات الدوحة."), ctaLabel: L("Explore Collection", "استكشف المجموعة"), ctaHref: "/collections/diamond-stories", collectionId: "col-diamond-stories", videoId: vid("v-featured", "Diamond Stories film", "Videos", "Collection", undefined, `${M}/videos/dimond-nekles.mp4`) }),  S("sec-new", "newArrivals", { eyebrow: L("Just In", "وصل حديثاً"), title: L("New Arrivals", "وصل حديثاً"), ctaLabel: L("View all", "عرض الكل"), ctaHref: "/collections/all?sort=new" }),
  S("sec-best", "bestSellers", { eyebrow: L("Most Loved", "الأكثر حباً"), title: L("Best Sellers", "الأكثر مبيعاً"), ctaLabel: L("View all", "عرض الكل"), ctaHref: "/collections/all?sort=best" }),
  S("sec-diamond", "diamondStory", { eyebrow: L("The Diamond Story", "حكاية الألماس"), title: L("Chosen for brilliance, certified for trust", "مختار لبريقه، موثّق لثقتك"), body: L("Each diamond is selected for cut, colour and clarity, and supplied with its certificate details.", "يُختار كل ألماس بعناية لقطعه ولونه ونقائه، ويرافقه تفاصيل شهادته."), ctaLabel: L("Shop Diamonds", "تسوق الألماس"), ctaHref: "/collections/diamond-jewellery", mediaId: diamondStory }),
  S("sec-gold", "goldStory", { eyebrow: L("The Gold Story", "حكاية الذهب"), title: L("Pure gold, priced transparently", "ذهب نقي بتسعير شفاف"), body: L("Prices follow the daily metal rate, with making charges shown clearly on every piece.", "تتبع الأسعار سعر المعدن اليومي، مع عرض أجور الصياغة بوضوح على كل قطعة."), ctaLabel: L("Today's Gold Rate", "سعر الذهب اليوم"), ctaHref: "/gold-rate", mediaId: goldStory }),
  S("sec-editorial", "editorial", { eyebrow: L("Editorial", "مقالة"), title: L("The Art of Layering", "فن التنسيق"), body: L("Stack, mix and wear your gold your way.", "نسّقي ذهبك على طريقتك."), ctaLabel: L("Read the Edit", "اقرأ المزيد"), ctaHref: "/collections/everyday-elegance", mediaId: editorial }),
  S("sec-video", "videoStory", { eyebrow: L("Film", "فيلم"), title: L("Crafted in Light", "مصنوع من الضوء"), body: L("A short film on how a SHINE piece comes to life.", "فيلم قصير عن كيف تولد قطعة شاين."), mediaId: storyVideoPoster, videoId: storyVideo }),
  S("sec-perso", "personalisation", { eyebrow: L("Made For You", "صُنع لك"), title: L("Personalised Jewellery", "مجوهرات مخصصة"), body: L("Engrave a date, a name, or design something entirely your own with our artisans.", "انقش تاريخاً أو اسماً، أو صمّم قطعتك الخاصة مع حرفيينا."), ctaLabel: L("Start Personalising", "ابدأ التخصيص"), ctaHref: "/personalise", mediaId: persoImg }),
  S("sec-showrooms", "showrooms", { eyebrow: L("Visit Us", "زورونا"), title: L("Our Showrooms", "صالات العرض"), body: L("Experience SHINE in person across Qatar.", "اختبر شاين شخصياً في قطر."), ctaLabel: L("Book an Appointment", "احجز موعداً"), ctaHref: "/appointment" }),
  S("sec-craft", "craftsmanship", { eyebrow: L("Craftsmanship", "الحِرفية"), title: L("Hands that shape heirlooms", "أيادٍ تصنع الإرث"), body: L("From sketch to final polish, each piece passes through skilled hands and careful inspection.", "من الرسم إلى التلميع النهائي، تمر كل قطعة بأيادٍ ماهرة وفحص دقيق."), mediaId: craftImg, videoId: craftVideo }),
  S("sec-testimonials", "testimonials", { eyebrow: L("Kind Words", "كلمات طيبة"), title: L("From our clients", "من عملائنا") }),
  S("sec-social", "social", { eyebrow: L("Follow", "تابعنا"), title: L("SHINE on Social", "شاين على وسائل التواصل") }),
  S("sec-newsletter", "newsletter", { eyebrow: L("Stay in touch", "ابقَ على تواصل"), title: L("First to know", "كن أول من يعرف"), body: L("New collections, private previews and gold-rate alerts.", "مجموعات جديدة، عروض خاصة وتنبيهات بسعر الذهب."), ctaLabel: L("Subscribe", "اشترك") }),
];

const link = (en: string, ar: string, href: string) => ({ label: L(en, ar), href });
const nav = (id: string, en: string, ar: string, href: string, sort: number, extra: Partial<NavItem> = {}): NavItem => ({ id, label: L(en, ar), href, columns: [], sort, active: true, ...extra });
const navigation: NavItem[] = [
  nav("nav-jewellery", "Jewellery", "المجوهرات", "/collections/all", 0, {
    columns: [
      { title: L("Shop by Category", "تسوق حسب الفئة"), links: [link("Rings", "خواتم", "/collections/rings"), link("Earrings", "أقراط", "/collections/earrings"), link("Necklaces", "قلائد", "/collections/necklaces"), link("Bracelets", "أساور", "/collections/bracelets"), link("Bangles", "غوايش", "/collections/bangles"), link("Pendants", "معلقات", "/collections/pendants")] },
      { title: L("Shop by Occasion", "تسوق حسب المناسبة"), links: [link("Everyday", "يومي", "/collections/all?occasion=Everyday"), link("Wedding", "زفاف", "/collections/wedding"), link("Engagement", "خطوبة", "/collections/engagement"), link("Anniversary", "ذكرى سنوية", "/collections/all?occasion=Anniversary"), link("Gifting", "هدايا", "/collections/gifting")] },
      { title: L("Shop by Collection", "تسوق حسب المجموعة"), links: [link("The Shine Edit", "مختارات شاين", "/collections/the-shine-edit"), link("Everyday Elegance", "أناقة كل يوم", "/collections/everyday-elegance"), link("Bridal", "العروس", "/collections/bridal"), link("Modern Classics", "كلاسيكيات عصرية", "/collections/modern-classics")] },
    ],
    featuredMediaId: megaJewellery, featuredTitle: L("The Shine Edit", "مختارات شاين"), featuredHref: "/collections/the-shine-edit",
  }),
  nav("nav-gold", "Gold", "الذهب", "/collections/gold-jewellery", 1, {
    columns: [
      { title: L("Gold Jewellery", "مجوهرات ذهبية"), links: [link("All Gold", "كل الذهب", "/collections/gold-jewellery"), link("Timeless Gold", "ذهب خالد", "/collections/timeless-gold"), link("Bangles", "غوايش", "/collections/bangles")] },
      { title: L("Bullion", "السبائك"), links: [link("Gold Bars", "سبائك ذهب", "/collections/gold-bars"), link("Gold Coins", "عملات ذهبية", "/collections/gold-coins"), link("Today's Rate", "سعر اليوم", "/gold-rate")] },
    ],
  }),
  nav("nav-diamond", "Diamond", "الألماس", "/collections/diamond-jewellery", 2),
  nav("nav-platinum", "Platinum", "البلاتين", "/collections/platinum-jewellery", 3),
  nav("nav-silver", "Silver", "الفضة", "/collections/silver-jewellery", 4),
  nav("nav-rings", "Rings", "خواتم", "/collections/rings", 5),
  nav("nav-earrings", "Earrings", "أقراط", "/collections/earrings", 6),
  nav("nav-necklaces", "Necklaces", "قلائد", "/collections/necklaces", 7),
  nav("nav-bracelets", "Bracelets", "أساور", "/collections/bracelets", 8),
  nav("nav-bangles", "Bangles", "غوايش", "/collections/bangles", 9),
  nav("nav-collections", "Collections", "المجموعات", "/collections/all", 10, {
    columns: [{ title: L("Collections", "المجموعات"), links: colDefs.map(([slug, en, ar]) => link(en, ar, `/collections/${slug}`)) }],
    featuredMediaId: megaCollections, featuredTitle: L("Diamond Stories", "حكايات الألماس"), featuredHref: "/collections/diamond-stories",
  }),
  nav("nav-gifting", "Gifting", "الهدايا", "/collections/gifting", 11),
  nav("nav-personalised", "Personalised", "مخصص", "/personalise", 12),
  nav("nav-showrooms", "Showrooms", "صالات العرض", "/showrooms", 13),
];

export function createSeed(): Database {
  return {
    version: 2,
    settings: {
      storeName: "SHINE Gold & Diamonds",
      currency: "QAR",
      timezone: "Asia/Qatar",
      taxRate: 0,
      deliveryFee: 25,
      freeDeliveryThreshold: 500,
      whatsapp: "",
      supportEmail: "",
      supportPhone: "",
      activeThemeId: "theme-signature",
      priceLockMinutes: 15,
      lowStockThreshold: 2,
    },
    media: structuredClone(media),
    categories: structuredClone(categories),
    collections: structuredClone(collections),
    products: structuredClone(products),
    rates: structuredClone(rates),
    rateHistory: rates.map((r) => ({ id: `rh-${r.id}`, rateId: r.id, ratePerGram: r.ratePerGram, at: SEED_DATE, by: "seed" })),
    branches: structuredClone(branches),
    inventory: structuredClone(inventory),
    inventoryTx: [],
    customers: [1, 2, 3].map((n) => ({ id: `cus-demo-0${n}`, name: `Demo Customer 0${n}`, email: `demo${n}@example.com`, phone: "", passwordHash: DEMO_HASH, addresses: [], createdAt: SEED_DATE, isDemo: true })),
    orders: structuredClone(orders),
    coupons: [
      { id: "cp-1", code: "WELCOME5", type: "percent", value: 5, minSubtotal: 300, usageLimit: 0, used: 0, active: true },
      { id: "cp-2", code: "DEMO100", type: "fixed", value: 100, minSubtotal: 1500, usageLimit: 50, used: 0, active: true },
    ],
    reviews: [
      { id: "rv-1", productId: "prd-001", name: "Demo Reviewer", rating: 5, text: "Sample review text for layout testing.", approved: true, createdAt: SEED_DATE },
      { id: "rv-2", productId: "prd-007", name: "Demo Reviewer", rating: 4, text: "Sample review awaiting moderation.", approved: false, createdAt: SEED_DATE },
    ],
    appointments: [],
    personalisation: [],
    cms: {
      announcement: L("Free delivery across Qatar", "توصيل مجاني في جميع أنحاء قطر"),
      sections,
      navigation,
      pages: [
        { id: "pg-about", slug: "about", title: L("About SHINE", "عن شاين"), body: L("Placeholder about page. Replace with the SHINE Gold & Diamonds brand story from Admin › CMS › Pages.", "صفحة تعريفية مؤقتة. استبدلها بقصة علامة شاين من لوحة الإدارة."), seo: { title: "About | SHINE", description: "About SHINE Gold & Diamonds" }, active: true },
        { id: "pg-shipping", slug: "shipping", title: L("Delivery & Pickup", "التوصيل والاستلام"), body: L("Placeholder delivery policy. Edit in Admin.", "سياسة توصيل مؤقتة. عدّلها من لوحة الإدارة."), seo: { title: "Delivery | SHINE", description: "" }, active: true },
        { id: "pg-returns", slug: "returns", title: L("Returns & Exchanges", "الإرجاع والاستبدال"), body: L("Placeholder returns policy. Edit in Admin.", "سياسة إرجاع مؤقتة. عدّلها من لوحة الإدارة."), seo: { title: "Returns | SHINE", description: "" }, active: true },
        { id: "pg-privacy", slug: "privacy", title: L("Privacy Policy", "سياسة الخصوصية"), body: L("Placeholder privacy policy. Edit in Admin.", "سياسة خصوصية مؤقتة. عدّلها من لوحة الإدارة."), seo: { title: "Privacy | SHINE", description: "" }, active: true },
      ],
      faqs: [
        { id: "fq-1", question: L("How are gold prices calculated?", "كيف تُحسب أسعار الذهب؟"), answer: L("Price = metal weight × today's rate + making charges + stones, with any discounts and taxes applied. The breakdown is shown on every product.", "السعر = وزن المعدن × سعر اليوم + أجور الصياغة + الأحجار، مع تطبيق الخصومات والضرائب. يظهر التفصيل في كل منتج."), sort: 0, active: true },
        { id: "fq-2", question: L("Can I collect my order from a showroom?", "هل يمكنني استلام طلبي من صالة العرض؟"), answer: L("Yes — choose Pickup at checkout and select your preferred showroom.", "نعم — اختر الاستلام عند الدفع وحدد صالة العرض المفضلة."), sort: 1, active: true },
      ],
      testimonials: [
        { id: "ts-1", name: "Client name (placeholder)", text: L("Placeholder testimonial — add real client words from Admin.", "شهادة مؤقتة — أضف كلمات العملاء الحقيقية من لوحة الإدارة."), sort: 0, active: true },
        { id: "ts-2", name: "Client name (placeholder)", text: L("Placeholder testimonial for layout.", "شهادة مؤقتة للتصميم."), sort: 1, active: true },
        { id: "ts-3", name: "Client name (placeholder)", text: L("Placeholder testimonial for layout.", "شهادة مؤقتة للتصميم."), sort: 2, active: true },
      ],
      footerAbout: L("Gold and diamond jewellery, crafted for Qatar.", "مجوهرات الذهب والألماس، مصنوعة لقطر."),
    },
    banners: [
      { id: "bn-gifts", title: L("Gifts that shine", "هدايا تتألق"), subtitle: L("Sample promotion — edit or replace in Admin › Banners.", "عرض تجريبي — عدّله أو استبدله من لوحة الإدارة › اللافتات."), ctaLabel: L("Shop gifts", "تسوّق الهدايا"), ctaHref: "/collections/gifts", mediaId: promoGifts, placement: "home", tone: "light", active: true, sort: 0 },
      { id: "bn-bridal", title: L("The Bridal Edit", "مختارات العروس"), subtitle: L("Heirloom gold and diamonds for the big day.", "ذهب وألماس خالد لليوم الكبير."), ctaLabel: L("Explore bridal", "استكشف مجموعة العروس"), ctaHref: "/collections/bridal", mediaId: promoBridal, placement: "listing", tone: "dark", active: true, sort: 1 },
      { id: "bn-diamond", title: L("Certified diamonds", "ألماس موثّق"), subtitle: L("Book a private diamond consultation in a showroom near you.", "احجز استشارة ألماس خاصة في أقرب صالة عرض."), ctaLabel: L("Book appointment", "احجز موعداً"), ctaHref: "/appointment", mediaId: promoDiamond, placement: "product", tone: "dark", active: true, sort: 2 },
    ],
    social: (["Instagram", "Facebook", "TikTok", "YouTube", "X", "WhatsApp"] as const).map((platform, i) => ({ id: `so-${i}`, platform, url: "", active: true, sort: i })),
    themes: PRESETS.map((p) => ({ id: p.id, name: p.name, preset: true, tokens: structuredClone(p.tokens), updatedAt: SEED_DATE })),
    adminUsers: [
      { id: "adm-1", name: "Super Admin (demo)", email: "admin@shine.demo", passwordHash: ADMIN_HASH, role: "SUPER_ADMIN", active: true, failedAttempts: 0 },
      { id: "adm-2", name: "Content Manager (demo)", email: "content@shine.demo", passwordHash: ADMIN_HASH, role: "CONTENT_MANAGER", active: true, failedAttempts: 0 },
      { id: "adm-3", name: "Branch 01 Manager (demo)", email: "branch@shine.demo", passwordHash: ADMIN_HASH, role: "BRANCH_MANAGER", branchId: "br-01", active: true, failedAttempts: 0 },
    ],
    loginHistory: [],
    audit: [],
    notifications: [],
    analytics: [],
    translations: { en: {}, ar: {} },
    session: { lang: "en", cart: [], wishlist: [], compare: [], recentlyViewed: [], appearance: "light", adminAppearance: "light" },
  };
}

/** Read-only seed snapshot used by server components (SEO metadata, sitemap). */
export const SEED = createSeed();
