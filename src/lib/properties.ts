// Domain types and helpers. Real data now lives in Lovable Cloud.

export type PropertyType =
  | "Bedsitter"
  | "Studio"
  | "Single Room"
  | "One Bedroom"
  | "Two Bedroom"
  | "Three Bedroom"
  | "Maisonette"
  | "Apartment"
  | "House";

export const PROPERTY_TYPES: PropertyType[] = [
  "Bedsitter",
  "Studio",
  "Single Room",
  "One Bedroom",
  "Two Bedroom",
  "Three Bedroom",
  "Maisonette",
  "Apartment",
  "House",
];

// Counties — Mwea sits in Kirinyaga, so it leads the list (default focus).
export const COUNTIES = [
  "Kirinyaga",
  "Nairobi",
  "Kiambu",
  "Machakos",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Uasin Gishu",
  "Kajiado",
  "Nyeri",
  "Murang'a",
  "Embu",
  "Meru",
  "Kakamega",
  "Bungoma",
  "Trans Nzoia",
  "Kilifi",
  "Kwale",
  "Garissa",
  "Laikipia",
];

export const POPULAR_TOWNS = [
  "Mwea",
  "Kerugoya",
  "Wanguru",
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
];

export const COMMON_AMENITIES = [
  "Wi-Fi",
  "Parking",
  "Borehole",
  "Backup water",
  "CCTV",
  "Caretaker",
  "Hot shower",
  "Balcony",
  "Lift",
  "Gym",
  "Pool",
  "Garden",
  "Gated",
  "Solar",
  "Backup power",
  "DSQ",
];

export interface PropertyRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  property_type: string;
  listing_type: string;
  price_kes: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  county: string;
  town: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  images: string[];
  contact_phone: string | null;
  contact_email: string | null;
  status: string; // "pending" | "approved" | "rejected"
  rejection_reason: string | null;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment: string;
  photos: string[];
  is_approved: boolean;
  created_at: string;
}

export function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);
}

// Default map centre = Mwea, Kirinyaga
export const DEFAULT_MAP_CENTER: [number, number] = [-0.6906, 37.3573];
