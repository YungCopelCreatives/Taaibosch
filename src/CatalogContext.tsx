/**
 * Loads the live catalogue (products + store settings managed in the dashboard).
 * The shop renders instantly from the built-in starter data, then swaps in the
 * live data. If the API is unreachable it simply keeps the starter data.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Catalog, Product, StoreSettings } from './types';
import { STARTER_PRODUCTS, applyProducts } from './data/products';
import { DEFAULT_SETTINGS, applySettings, normaliseSettings } from './data/store';

interface CatalogState {
  products: Product[];
  settings: StoreSettings;
  loaded: boolean;
  reload: () => Promise<void>;
}

const Ctx = createContext<CatalogState | null>(null);
const CACHE_KEY = 'taaibosch_catalog_v1';

function readCache(): Catalog | null {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function apply(c: Catalog): Catalog {
  const settings = normaliseSettings(c.settings);
  const products = c.products.filter(p => p.active !== false);
  applySettings(settings);
  applyProducts(products);
  return { products, settings };
}

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Catalog>(() => apply(readCache() ?? { products: STARTER_PRODUCTS, settings: DEFAULT_SETTINGS }));
  const [loaded, setLoaded] = useState(false);

  const reload = async () => {
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Catalog;
      if (!Array.isArray(data.products)) throw new Error('bad catalogue');
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      setState(apply(data));
    } catch (e) {
      console.warn('Using built-in catalogue:', e);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { reload(); }, []);

  return <Ctx.Provider value={{ ...state, loaded, reload }}>{children}</Ctx.Provider>;
};

export function useCatalog(): CatalogState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCatalog must be used within CatalogProvider');
  return c;
}
