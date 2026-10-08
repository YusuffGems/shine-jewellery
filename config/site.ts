export const SITE = {
  name: "SHINE Gold & Diamonds",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  description: "Gold and diamond jewellery in Qatar — rings, earrings, necklaces, bangles, bullion and personalised pieces.",
  country: "QA",
  currency: "QAR",
  timezone: "Asia/Qatar",
  dataMode: (process.env.NEXT_PUBLIC_DATA_MODE || "mock") as "mock" | "api",
} as const;

export const APPOINTMENT_SERVICES = [
  "Jewellery Consultation",
  "Diamond Consultation",
  "Engagement Consultation",
  "Custom Design",
  "Personalisation",
  "Repair",
  "Cleaning",
  "Collection Viewing",
] as const;

export const PERSONALISATION_TYPES = ["Engraving", "Name Jewellery", "Custom Jewellery", "Custom Design"] as const;
