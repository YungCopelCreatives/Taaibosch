/**
 * The live catalogue (products + store settings) with a short in-memory cache.
 * If the database is unreachable (e.g. a paused free Supabase project) the shop
 * keeps working from the last good copy, or the starter catalogue.
 */

import { db } from './db';
import { STARTER_PRODUCTS } from '../src/data/products';
import { normaliseSettings } from '../src/data/store';
import type { Catalog } from '../src/types';

const TTL_MS = 30_000;
let cache: { at: number; value: Catalog } | null = null;

export function invalidateCatalog() {
  cache = null;
}

export async function getCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    const [products, settings] = await Promise.all([db().listProducts(), db().getSettings()]);
    const value: Catalog = {
      products: products.length ? products : STARTER_PRODUCTS.map((p, i) => ({ ...p, active: true, stock: null, sortOrder: i })),
      settings: normaliseSettings(settings),
    };
    cache = { at: Date.now(), value };
    return value;
  } catch (e) {
    console.error('[catalog] falling back', e);
    return cache?.value ?? { products: STARTER_PRODUCTS, settings: normaliseSettings(null) };
  }
}

/** What shoppers see: hidden products removed. */
export async function getPublicCatalog(): Promise<Catalog> {
  const c = await getCatalog();
  return { settings: c.settings, products: c.products.filter(p => p.active !== false) };
}

/** Copy the starter products into the database the first time the dashboard opens. */
export async function seedProductsIfEmpty(): Promise<boolean> {
  const existing = await db().listProducts();
  if (existing.length) return false;
  for (const [i, p] of STARTER_PRODUCTS.entries()) await db().saveProduct({ ...p, active: true, stock: null, sortOrder: i });
  invalidateCatalog();
  return true;
}
