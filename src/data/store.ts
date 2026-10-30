/**
 * Store-wide settings. These are the defaults; the live values come from
 * Dashboard > Settings and are applied at start-up via applySettings().
 * The exported `let` bindings update everywhere they're imported (ES modules
 * keep live bindings), so existing components pick up dashboard changes.
 */

import type { CourierSetting, StoreSettings } from '../types';

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: '+27645022066',
  email: 'taaiboschorganics@gmail.com',
  location: 'Cape Town, Baviaans Kloof, Hout Bay, South Africa',
  deliveryFee: 150,
  freeDeliveryThreshold: 1000,
  couriers: [
    { id: 'The Courier Guy', label: 'The Courier Guy', kind: 'Door-to-door', eta: '2 – 3 working days', enabled: true },
    { id: 'Aramex', label: 'Aramex Locker', kind: 'Smart locker pickup', eta: '2 – 4 working days', enabled: true },
    { id: 'PAXI', label: 'PAXI (PEP)', kind: 'PEP store pickup', eta: '4 – 7 working days', enabled: true },
  ],
  categories: ['Capsules', 'Seamoss', 'Raw', 'Gel'],
  healthGoals: ['Immunity', 'Energy', 'Detox', 'Skin', 'Hormonal balance', 'Metabolism', 'Thyroid', 'Digestion', 'Cleansing', 'Respiratory', 'Vitality', 'Relaxation', 'Sleep', 'Heart', 'Nutrition', 'Stress', 'Blood'],
  announcement: {
    enabled: true,
    title: 'Orders above R1000 get FREE Delivery!',
    text: 'Combine your wellness favourites. Free delivery applies automatically across South Africa once your subtotal reaches R1000.',
  },
  lowStockThreshold: 5,
};

/** Merge saved settings over defaults so new fields always have a value. */
export function normaliseSettings(saved: Partial<StoreSettings> | null | undefined): StoreSettings {
  const s = { ...DEFAULT_SETTINGS, ...(saved ?? {}) } as StoreSettings;
  s.couriers = DEFAULT_SETTINGS.couriers.map(def => ({ ...def, ...(saved?.couriers?.find(c => c.id === def.id) ?? {}) }));
  s.announcement = { ...DEFAULT_SETTINGS.announcement, ...(saved?.announcement ?? {}) };
  s.deliveryFee = Math.max(0, Number(s.deliveryFee) || 0);
  s.freeDeliveryThreshold = Math.max(0, Number(s.freeDeliveryThreshold) || 0);
  return s;
}

export let WHATSAPP_NUMBER = DEFAULT_SETTINGS.whatsappNumber;
export let EMAIL = DEFAULT_SETTINGS.email;
export let LOCATION = DEFAULT_SETTINGS.location;
/** Flat delivery fee in Rand. */
export let DELIVERY_FEE = DEFAULT_SETTINGS.deliveryFee;
/** Orders with a product subtotal at or above this amount (Rand) ship free (0 = never free). */
export let FREE_DELIVERY_THRESHOLD = DEFAULT_SETTINGS.freeDeliveryThreshold;
/** Couriers currently offered at checkout. */
export let COURIERS: CourierSetting[] = DEFAULT_SETTINGS.couriers.filter(c => c.enabled);
export let ALL_COURIERS: CourierSetting[] = DEFAULT_SETTINGS.couriers;
export let CATEGORIES: string[] = DEFAULT_SETTINGS.categories;
export let HEALTH_GOALS: string[] = DEFAULT_SETTINGS.healthGoals;
export let ANNOUNCEMENT = DEFAULT_SETTINGS.announcement;

/** Max units of a single product per order (guards against typos and abuse). */
export const MAX_QTY_PER_ITEM = 20;

export function applySettings(s: StoreSettings) {
  WHATSAPP_NUMBER = s.whatsappNumber;
  EMAIL = s.email;
  LOCATION = s.location;
  DELIVERY_FEE = s.deliveryFee;
  FREE_DELIVERY_THRESHOLD = s.freeDeliveryThreshold;
  ALL_COURIERS = s.couriers;
  COURIERS = s.couriers.filter(c => c.enabled);
  CATEGORIES = s.categories;
  HEALTH_GOALS = s.healthGoals;
  ANNOUNCEMENT = s.announcement;
}

export function deliveryFeeFor(
  subtotal: number,
  s: Pick<StoreSettings, 'deliveryFee' | 'freeDeliveryThreshold'> = { deliveryFee: DELIVERY_FEE, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD },
): number {
  return s.freeDeliveryThreshold > 0 && subtotal >= s.freeDeliveryThreshold ? 0 : s.deliveryFee;
}

export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
