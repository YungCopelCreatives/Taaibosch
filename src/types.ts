/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Categories and health goals are editable in the dashboard (Settings > Shop filters). */
export type Category = string;
export type HealthGoal = string;

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  healthGoals: HealthGoal[];
  image: string;
  images?: string[];
  summary: string;
  headline?: string;
  hook?: string;
  whyPeopleChooseIt?: string;
  benefits?: string[];
  ingredients: string[];
  usage: string;
  whoItsFor: string;
  isBestSeller?: boolean;
  isTrending?: boolean;
  /** Hidden products are kept in the dashboard but not shown in the shop. */
  active?: boolean;
  /** null/undefined = stock not tracked. 0 = sold out. */
  stock?: number | null;
  sortOrder?: number;
}

export const isInStock = (p: Pick<Product, 'stock'>) => p.stock === null || p.stock === undefined || p.stock > 0;

export interface CourierSetting {
  id: Courier;
  label: string;
  kind: string;
  eta: string;
  enabled: boolean;
}

/** Everything the team can change in Dashboard > Settings. */
export interface StoreSettings {
  whatsappNumber: string;
  email: string;
  location: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  couriers: CourierSetting[];
  categories: string[];
  healthGoals: string[];
  announcement: { enabled: boolean; title: string; text: string };
  lowStockThreshold: number;
}

export interface Catalog {
  products: Product[];
  settings: StoreSettings;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Courier = 'Aramex' | 'The Courier Guy' | 'PAXI';

/** How the customer wants their tracking link once the parcel is sent out. */
export type TrackingChannel = 'whatsapp' | 'sms' | 'both';

export interface DeliveryDetails {
  courier: Courier;
  fullName: string;
  contactNumber: string;
  email: string;
  trackingVia?: TrackingChannel;
  address?: string;
  lockerName?: string;
  pepStore?: string;
}

/** What the browser sends to /api/checkout. Prices are never trusted from here. */
export interface CheckoutRequest {
  items: { id: string; quantity: number }[];
  delivery: DeliveryDetails;
}

export interface CheckoutResponse {
  orderRef: string;
  redirectUrl: string;
}

export interface OrderLine {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type FulfilmentStatus = 'new' | 'packing' | 'dispatched' | 'delivered' | 'cancelled';

export interface AdminOrder {
  ref: string;
  status: OrderStatus;
  fulfilment: FulfilmentStatus;
  /** Courier tracking link (or waybill number), added after the parcel is sent out. */
  trackingNumber?: string;
  /** When/how the team last sent the tracking link to the customer. */
  trackingSentAt?: string;
  trackingSentVia?: string;
  adminNotes?: string;
  checkoutId?: string;
  paymentId?: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  delivery: DeliveryDetails;
  createdAt: string;
  paidAt?: string;
  updatedAt?: string;
}

export type AdminRole = 'owner' | 'manager' | 'fulfilment';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  jobTitle?: string;
  phone?: string;
  onboarded: boolean;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminReview extends Review {
  approved: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  preview: string;
  image: string;
  topics: string[];
  date?: string;
  author?: string;
  content?: string;
}

export interface WikiArticle {
  slug: string;
  name: string;
  botanicalName: string;
  family: string;
  nativeRegion: string;
  primaryUses: string[];
  constituents: string[];
  synergy: string;
  introduction: string;
  traditionalUse: string;
  scientificInsights: string;
  therapeuticAesthetics: string; // Detail on skin, gut or vitality
  associatedProducts: string[]; // Product IDs
  image: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
