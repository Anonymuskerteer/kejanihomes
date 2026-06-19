import prop1 from "@/assets/prop-1.jpg";
import prop2 from "@/assets/prop-2.jpg";
import prop3 from "@/assets/prop-3.jpg";
import prop4 from "@/assets/prop-4.jpg";
import prop5 from "@/assets/prop-5.jpg";
import prop6 from "@/assets/prop-6.jpg";

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

export interface Property {
  id: string;
  title: string;
  description: string;
  rent: number;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  county: string;
  town: string;
  estate: string;
  furnished: boolean;
  available: boolean;
  cover: string;
  gallery: string[];
  amenities: string[];
  postedAt: string;
  views: number;
  saves: number;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  landlord: { name: string; phone: string; whatsapp: string; email: string };
}

const ALL_IMAGES = [prop1, prop2, prop3, prop4, prop5, prop6];

export const PROPERTIES: Property[] = [
  {
    id: "p-001",
    title: "Sunlit 2BR Apartment in Kilimani",
    description:
      "Bright and spacious 2 bedroom apartment with a modern kitchen, balcony views, secure parking and 24/7 water supply. Walking distance to Yaya Centre and major matatu routes.",
    rent: 65000,
    type: "Two Bedroom",
    bedrooms: 2,
    bathrooms: 2,
    county: "Nairobi",
    town: "Nairobi",
    estate: "Kilimani",
    furnished: false,
    available: true,
    cover: prop1,
    gallery: [prop1, prop4, prop5, prop6],
    amenities: ["Parking", "Backup water", "CCTV", "Lift", "Balcony", "Borehole"],
    postedAt: "2025-06-02",
    views: 1284,
    saves: 92,
    rating: 4.6,
    reviewsCount: 28,
    verified: true,
    landlord: { name: "Wanjiru Properties", phone: "+254700000001", whatsapp: "+254700000001", email: "info@wanjiruprop.co.ke" },
  },
  {
    id: "p-002",
    title: "Cozy Bedsitter near Kenyatta University",
    description:
      "Affordable, well-finished bedsitter perfect for students or young professionals. Includes a fitted kitchenette, hot shower and reliable security.",
    rent: 8500,
    type: "Bedsitter",
    bedrooms: 0,
    bathrooms: 1,
    county: "Kiambu",
    town: "Ruiru",
    estate: "Kahawa Wendani",
    furnished: true,
    available: true,
    cover: prop2,
    gallery: [prop2, prop5],
    amenities: ["Wi-Fi", "Hot shower", "CCTV", "Caretaker"],
    postedAt: "2025-06-10",
    views: 612,
    saves: 41,
    rating: 4.3,
    reviewsCount: 14,
    verified: true,
    landlord: { name: "James Kamau", phone: "+254700000002", whatsapp: "+254700000002", email: "j.kamau@example.com" },
  },
  {
    id: "p-003",
    title: "Modern 4BR Maisonette in Syokimau",
    description:
      "Elegant family maisonette in a gated community with manicured gardens, ample parking and proximity to SGR station. Includes DSQ.",
    rent: 120000,
    type: "Maisonette",
    bedrooms: 4,
    bathrooms: 4,
    county: "Machakos",
    town: "Syokimau",
    estate: "Gateway Park",
    furnished: false,
    available: true,
    cover: prop3,
    gallery: [prop3, prop1, prop4, prop6],
    amenities: ["Gated", "DSQ", "Borehole", "Solar", "Garden", "Parking"],
    postedAt: "2025-05-20",
    views: 2104,
    saves: 188,
    rating: 4.8,
    reviewsCount: 41,
    verified: true,
    landlord: { name: "Gateway Realty", phone: "+254700000003", whatsapp: "+254700000003", email: "hello@gatewayrealty.co.ke" },
  },
  {
    id: "p-004",
    title: "Stylish 1BR in Westlands",
    description:
      "Beautifully designed one bedroom apartment in the heart of Westlands. Walk to Sarit Centre, restaurants and nightlife.",
    rent: 45000,
    type: "One Bedroom",
    bedrooms: 1,
    bathrooms: 1,
    county: "Nairobi",
    town: "Nairobi",
    estate: "Westlands",
    furnished: true,
    available: true,
    cover: prop4,
    gallery: [prop4, prop1, prop5],
    amenities: ["Wi-Fi", "Gym", "Lift", "CCTV", "Backup power"],
    postedAt: "2025-06-12",
    views: 980,
    saves: 76,
    rating: 4.5,
    reviewsCount: 22,
    verified: false,
    landlord: { name: "Urban Nest", phone: "+254700000004", whatsapp: "+254700000004", email: "stay@urbannest.co.ke" },
  },
  {
    id: "p-005",
    title: "Spacious 3BR Apartment in Nyali",
    description:
      "Ocean-breeze 3 bedroom apartment with a swimming pool, gym and 24-hour security. Minutes from Nyali City Mall and the beach.",
    rent: 85000,
    type: "Three Bedroom",
    bedrooms: 3,
    bathrooms: 3,
    county: "Mombasa",
    town: "Mombasa",
    estate: "Nyali",
    furnished: false,
    available: true,
    cover: prop6,
    gallery: [prop6, prop1, prop4],
    amenities: ["Pool", "Gym", "Sea breeze", "Parking", "CCTV"],
    postedAt: "2025-06-01",
    views: 1543,
    saves: 121,
    rating: 4.7,
    reviewsCount: 33,
    verified: true,
    landlord: { name: "Coastline Homes", phone: "+254700000005", whatsapp: "+254700000005", email: "info@coastlinehomes.co.ke" },
  },
  {
    id: "p-006",
    title: "Affordable Single Room in Ruaka",
    description:
      "Neat single room with shared amenities. Ideal for budget-conscious tenants. Close to Two Rivers Mall and CBD via Northern Bypass.",
    rent: 5500,
    type: "Single Room",
    bedrooms: 0,
    bathrooms: 1,
    county: "Kiambu",
    town: "Ruaka",
    estate: "Banana",
    furnished: false,
    available: true,
    cover: prop5,
    gallery: [prop5, prop2],
    amenities: ["Water", "Security", "Caretaker"],
    postedAt: "2025-06-14",
    views: 305,
    saves: 18,
    rating: 4.1,
    reviewsCount: 7,
    verified: false,
    landlord: { name: "Mama Njeri", phone: "+254700000006", whatsapp: "+254700000006", email: "njeri@example.com" },
  },
  {
    id: "p-007",
    title: "Executive Studio in Lavington",
    description:
      "Compact yet luxurious studio with floor-to-ceiling windows, a rooftop lounge and concierge service.",
    rent: 38000,
    type: "Studio",
    bedrooms: 0,
    bathrooms: 1,
    county: "Nairobi",
    town: "Nairobi",
    estate: "Lavington",
    furnished: true,
    available: true,
    cover: prop5,
    gallery: [prop5, prop1, prop4],
    amenities: ["Wi-Fi", "Concierge", "Rooftop", "Gym", "Lift"],
    postedAt: "2025-06-05",
    views: 712,
    saves: 58,
    rating: 4.4,
    reviewsCount: 16,
    verified: true,
    landlord: { name: "Sky Living", phone: "+254700000007", whatsapp: "+254700000007", email: "hello@skyliving.co.ke" },
  },
  {
    id: "p-008",
    title: "Family House in Karen",
    description:
      "Standalone 4 bedroom house on half an acre, with mature gardens, a gazebo and staff quarters. Quiet, leafy neighbourhood.",
    rent: 220000,
    type: "House",
    bedrooms: 4,
    bathrooms: 5,
    county: "Nairobi",
    town: "Nairobi",
    estate: "Karen",
    furnished: false,
    available: true,
    cover: prop3,
    gallery: [prop3, prop1, prop4, prop6],
    amenities: ["Garden", "Garage", "Borehole", "Solar", "Staff quarters"],
    postedAt: "2025-05-15",
    views: 1820,
    saves: 142,
    rating: 4.9,
    reviewsCount: 19,
    verified: true,
    landlord: { name: "Karen Estates", phone: "+254700000008", whatsapp: "+254700000008", email: "lease@karenestates.co.ke" },
  },
];

export const COUNTIES = Array.from(new Set(PROPERTIES.map((p) => p.county))).sort();
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

export function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);
}

export function getProperty(id: string) {
  return PROPERTIES.find((p) => p.id === id);
}

export const POPULAR_LOCATIONS = [
  { name: "Kilimani", county: "Nairobi", count: 124, img: ALL_IMAGES[0] },
  { name: "Westlands", county: "Nairobi", count: 98, img: ALL_IMAGES[3] },
  { name: "Syokimau", county: "Machakos", count: 76, img: ALL_IMAGES[2] },
  { name: "Nyali", county: "Mombasa", count: 64, img: ALL_IMAGES[5] },
  { name: "Ruaka", county: "Kiambu", count: 58, img: ALL_IMAGES[4] },
  { name: "Karen", county: "Nairobi", count: 42, img: ALL_IMAGES[2] },
];
