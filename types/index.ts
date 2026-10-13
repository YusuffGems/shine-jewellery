/* ──────────────────────────────────────────────────────────────
    SHINE Gold & Diamonds — domain types
    Mirrors prisma/schema.prisma so the mock layer and the future
    API return the same shapes.
    ────────────────────────────────────────────────────────────── */

  export type Lang = "en" | "ar";
  export type Localized = { en: string; ar: string };

  /* ── Media ─────────────────────────────────────────────────── */
  export type MediaType = "image" | "video";
  export type MediaFolder =
    | "Homepage" | "Products" | "Collections" | "Campaigns" | "Banners"
    | "Videos" | "Showrooms" | "Blog" | "Social" | "Certificates";

  export type PlaceholderKind = "product" | "collection" | "campaign" | "video" | "showroom" | "category";

export interface MediaAsset {
  id: string;
  type: MediaType;
  title: string;
  alt: Localized;
  caption?: string;
  description?: string;
  folder: MediaFolder;
  tags: string[];
  /** Empty url = render the elegant placeholder */
  url: string;
  mobileUrl?: string;
  posterId?: string;
  placeholder: PlaceholderKind;
  /** true = generated sample placeholder, still to be replaced with real photography/film */
  generated?: boolean;
  focalX?: number;
  focalY?: number;
  mime?: string;
  size?: number;
  /** video flags */
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  videoType?: "Hero" | "Product" | "Collection" | "Campaign" | "Editorial" | "Showroom" | "Craftsmanship" | "Social";
  status: "active" | "archived";
  sort: number;
  createdAt: string;
}

  /* ── Catalogue ─────────────────────────────────────────────── */
  export interface Seo { title: string; description: string }

  export interface Category {
    id: string;
    slug: string;
    name: Localized;
    description: Localized;
    parentId?: string;
    mediaId?: string;
    sort: number;
    active: boolean;
  }

  export interface Collection {
    id: string;
    slug: string;
    name: Localized;
    description: Localized;
    heroMediaId?: string;
    heroVideoId?: string;
    thumbnailId?: string;
    seo: Seo;
    sort: number;
    active: boolean;
  }

  export type Metal = "gold" | "silver" | "platinum";
  export type MetalColour = "Yellow" | "White" | "Rose" | "Two-tone";
  export type Badge = "NEW" | "BESTSELLER" | "EXCLUSIVE" | "LIMITED" | "TRENDING";
  export type MakingChargeType = "percent" | "perGram" | "fixed";

  export interface DiamondDetails {
    carat: number;
    shape: string;
    colour: string;
    clarity: string;
    pieces: number;
    value: number;
  }

  export interface Product {
    id: string;
    slug: string;
    sku: string;
    name: Localized;
    description: Localized;
    type: "jewellery" | "bullion";
    categoryIds: string[];
    collectionIds: string[];
    metal: Metal;
    rateId: string;
    metalColour: MetalColour;
    netWeight: number;
    grossWeight: number;
    makingChargeType: MakingChargeType;
    makingCharge: number;
    wastagePercent: number;
    stoneValue: number;
    stoneDetails?: string;
    diamond?: DiamondDetails;
    premium: number;
    otherCharges: number;
    discountPercent: number;
    certificateNo?: string;
    badges: Badge[];
    occasions: string[];
    gender: "Women" | "Men" | "Unisex" | "Kids";
    sizes: string[];
    imageIds: string[];
    videoIds: string[];
    status: "active" | "draft";
    popularity: number;
    seo: Seo;
    createdAt: string;
    /** Last time this product's details were saved in Admin */
    updatedAt?: string;
  }

  /* ── Metal rates ──────────────────────────────────────────── */
  export interface MetalRate {
    id: string;
    metal: Metal;
    purity: string;
    label: Localized;
    ratePerGram: number;
    updatedAt: string;
    source: string;
    status: "live" | "manual" | "demo" | "stale";
  }
  export interface MetalRateHistory { id: string; rateId: string; ratePerGram: number; at: string; by: string }

  /* ── Branches / inventory ─────────────────────────────────── */
  export interface Branch {
    id: string;
    name: Localized;
    address: Localized;
    zone: string;
    area: string;
    city: string;
    landmark: string;
    phone: string;
    whatsapp: string;
    mapUrl: string;
    lat?: number;
    lng?: number;
    hours: Localized;
    imageIds: string[];
    videoId?: string;
    services: string[];
    active: boolean;
    sort: number;
  }

  export interface InventoryRecord {
    id: string;
    productId: string;
    branchId: string;
    total: number;
    reserved: number;
    sold: number;
    returned: number;
    damaged: number;
    transferred: number;
  }

  export interface InventoryTransaction {
    id: string;
    productId: string;
    branchId: string;
    kind: "adjust" | "reserve" | "release" | "sale" | "return" | "damage" | "transfer-in" | "transfer-out";
    qty: number;
    note: string;
    at: string;
    by: string;
  }

  /* ── Customers / commerce ─────────────────────────────────── */
  export interface Address {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    building: string;
    street: string;
    zone: string;
    area: string;
    city: string;
    landmark: string;
    directions: string;
    country: string;
  }

  export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    addresses: Address[];
    createdAt: string;
    isDemo?: boolean;
  }

  export interface CartItem {
    key: string;
    productId: string;
    qty: number;
    size?: string;
    engraving?: string;
  }

  export interface PriceBreakdown {
    metalRate: number;
    metalValue: number;
    makingCharge: number;
    wastage: number;
    stoneValue: number;
    diamondValue: number;
    premium: number;
    otherCharges: number;
    subtotal: number;
    discount: number;
    taxRate: number;
    tax: number;
    total: number;
  }

  export type OrderStatus =
    | "pending_payment" | "paid" | "confirmed" | "processing" | "shipped"
    | "ready_for_pickup" | "delivered" | "cancelled" | "refunded" | "payment_failed";

  export interface OrderItem {
    productId: string;
    sku: string;
    name: Localized;
    qty: number;
    size?: string;
    engraving?: string;
    unitPrice: number;
    /** price snapshot — old orders never recalculate */
    snapshot: PriceBreakdown;
    rateSnapshot: { rateId: string; ratePerGram: number; at: string };
    branchId: string;
  }

  export interface Order {
    id: string;
    number: string;
    customerId: string;
    customerName: string;
    email: string;
    phone: string;
    items: OrderItem[];
    subtotal: number;
    couponCode?: string;
    couponDiscount: number;
    deliveryFee: number;
    tax: number;
    total: number;
    fulfilment: "delivery" | "pickup";
    address?: Address;
    pickupBranchId?: string;
    status: OrderStatus;
    payment: { provider: string; status: "pending" | "succeeded" | "failed" | "refunded"; reference: string; idempotencyKey: string };
    history: { status: OrderStatus; at: string; note: string }[];
    createdAt: string;
    isDemo?: boolean;
  }

  export interface Coupon {
    id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    minSubtotal: number;
    usageLimit: number;
    used: number;
    active: boolean;
  }

  export interface Review {
    id: string;
    productId: string;
    name: string;
    rating: number;
    text: string;
    approved: boolean;
    createdAt: string;
  }

  export interface Appointment {
    id: string;
    branchId: string;
    service: string;
    date: string;
    time: string;
    name: string;
    phone: string;
    email: string;
    notes: string;
    productId?: string;
    customerId?: string;
    status: "requested" | "confirmed" | "completed" | "cancelled";
    createdAt: string;
  }

  export interface PersonalisationRequest {
    id: string;
    type: "Engraving" | "Name Jewellery" | "Custom Jewellery" | "Custom Design";
    text: string;
    notes: string;
    referenceMediaId?: string;
    name: string;
    phone: string;
    email: string;
    customerId?: string;
    status: "new" | "in_review" | "quoted" | "closed";
    createdAt: string;
  }

  /* ── CMS ──────────────────────────────────────────────────── */
  export type HomeSectionType =
    | "hero" | "categories" | "featuredCollection" | "newArrivals" | "bestSellers"
    | "diamondStory" | "goldStory" | "editorial" | "videoStory" | "personalisation"
    | "showrooms" | "craftsmanship" | "testimonials" | "social" | "newsletter";

  export interface HomeSection {
    id: string;
    type: HomeSectionType;
    enabled: boolean;
    eyebrow: Localized;
    title: Localized;
    body: Localized;
    ctaLabel: Localized;
    ctaHref: string;
    mediaId?: string;
    mobileMediaId?: string;
    videoId?: string;
    collectionId?: string;
  }

  export interface NavLink { label: Localized; href: string }
  export interface NavColumn { title: Localized; links: NavLink[] }
  export interface NavItem {
    id: string;
    label: Localized;
    href: string;
    columns: NavColumn[];
    featuredMediaId?: string;
    featuredTitle?: Localized;
    featuredHref?: string;
    sort: number;
    active: boolean;
  }

  export interface CmsPage { id: string; slug: string; title: Localized; body: Localized; seo: Seo; active: boolean }
  export interface Faq { id: string; question: Localized; answer: Localized; sort: number; active: boolean }
  export interface Testimonial { id: string; name: string; text: Localized; sort: number; active: boolean }
  export interface SocialLink { id: string; platform: "Instagram" | "Facebook" | "TikTok" | "YouTube" | "X" | "WhatsApp" | "LinkedIn"; url: string; active: boolean; sort: number }

  /** Promotional banner — shown on the homepage, listing pages or product pages. All media is replaceable. */
  export interface PromoBanner {
    id: string;
    title: Localized;
    subtitle: Localized;
    ctaLabel: Localized;
    ctaHref: string;
    mediaId?: string;
    mobileMediaId?: string;
    videoId?: string;
    placement: "home" | "listing" | "product";
    tone: "dark" | "light";
    active: boolean;
    sort: number;
  }

  export interface Cms {
    announcement: Localized;
    sections: HomeSection[];
    navigation: NavItem[];
    pages: CmsPage[];
    faqs: Faq[];
    testimonials: Testimonial[];
    footerAbout: Localized;
  }

  /* ── Theme ────────────────────────────────────────────────── */
  export interface ThemeTokens {
    brandName: string;
    tagline: string;
    logoMediaId?: string;
    logoDarkMediaId?: string;
    faviconMediaId?: string;
    colorPrimary: string;
    colorSecondary: string;
    colorAccent: string;
    colorGold: string;
    colorBackground: string;
    colorSurface: string;
    colorText: string;
    colorMuted: string;
    colorBorder: string;
    colorSuccess: string;
    colorWarning: string;
    colorError: string;
    fontHeading: string;
    fontBody: string;
    fontArabic: string;
    headingWeight: number;
    bodyWeight: number;
    letterSpacing: number;
    buttonStyle: "solid" | "outline" | "gold";
    buttonRadius: number;
    buttonHeight: number;
    buttonUppercase: boolean;
    cardRadius: number;
    cardShadow: "none" | "soft" | "lifted";
    cardBorder: boolean;
    cardHover: "zoom" | "lift" | "swap" | "none";
    imageRatio: "1/1" | "4/5" | "3/4";
    headerStyle: "centered" | "left";
    headerSticky: boolean;
    headerTransparent: boolean;
    announcementEnabled: boolean;
    logoSize: number;
    navSpacing: number;
    footerBackground: string;
    footerText: string;
    footerColumns: 3 | 4;
    footerSocial: boolean;
    footerNewsletter: boolean;
    gridColumns: 2 | 3 | 4;
    quickView: boolean;
    wishlistOnCard: boolean;
    inputRadius: number;
    containerWidth: number;
    pagePadding: number;
    sectionSpacing: number;
    radius: number;
    animationSpeed: number;
  }

  export interface Theme {
    id: string;
    name: string;
    preset: boolean;
    tokens: ThemeTokens;
    draft?: ThemeTokens;
    updatedAt: string;
  }

  /* ── Admin / security ─────────────────────────────────────── */
  export type Role =
    | "SUPER_ADMIN" | "ADMIN" | "BRANCH_MANAGER" | "INVENTORY_MANAGER"
    | "SALES_MANAGER" | "CONTENT_MANAGER" | "CUSTOMER";

  export interface AdminUser {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    branchId?: string;
    active: boolean;
    lastLoginAt?: string;
    failedAttempts: number;
    lockedUntil?: string;
  }

  export interface LoginHistory { id: string; email: string; success: boolean; at: string; area: "admin" | "customer" }

  export interface AuditLog {
    id: string;
    user: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue?: string;
    newValue?: string;
    ip: string;
    at: string;
  }

  export interface NotificationEntry {
    id: string;
    channel: "email" | "sms" | "whatsapp" | "push";
    event: string;
    to: string;
    message: string;
    at: string;
    status: "queued" | "sent";
  }

  export interface AnalyticsEvent { id: string; event: string; data: Record<string, string | number>; at: string }

  export interface Settings {
    storeName: string;
    currency: "QAR";
    timezone: "Asia/Qatar";
    taxRate: number;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    whatsapp: string;
    supportEmail: string;
    supportPhone: string;
    activeThemeId: string;
    priceLockMinutes: number;
    lowStockThreshold: number;
  }

  export interface Session {
    lang: Lang;
    customerId?: string;
    adminId?: string;
    adminExpiresAt?: string;
    cart: CartItem[];
    couponCode?: string;
    wishlist: string[];
    compare: string[];
    recentlyViewed: string[];
    previewThemeId?: string;
    /** Customer-facing light/dark switch in the header */
    appearance: "light" | "dark";
    adminAppearance: "light" | "dark";
  }

  export type Translations = Record<Lang, Record<string, string>>;

  export interface Database {
    version: number;
    settings: Settings;
    media: MediaAsset[];
    categories: Category[];
    collections: Collection[];
    products: Product[];
    rates: MetalRate[];
    rateHistory: MetalRateHistory[];
    branches: Branch[];
    inventory: InventoryRecord[];
    inventoryTx: InventoryTransaction[];
    customers: Customer[];
    orders: Order[];
    coupons: Coupon[];
    reviews: Review[];
    appointments: Appointment[];
    personalisation: PersonalisationRequest[];
    cms: Cms;
    social: SocialLink[];
    banners: PromoBanner[];
    themes: Theme[];
    adminUsers: AdminUser[];
    loginHistory: LoginHistory[];
    audit: AuditLog[];
    notifications: NotificationEntry[];
    analytics: AnalyticsEvent[];
    translations: Translations;
    session: Session;
  }