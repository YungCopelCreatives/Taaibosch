/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, CartItem } from './types';
import { PRODUCTS } from './data/products';
import { useCatalog } from './CatalogContext';
import { isInStock } from './types';
import { MAX_QTY_PER_ITEM } from './data/store';

interface CartToast {
  id: number;
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  toast: CartToast | null;
  dismissToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) – cart still works for this visit */
  }
};

/** Re-sync saved carts with the live catalogue so stale prices/names never linger. */
const hydrateCart = (saved: { id: string; quantity: number }[]): CartItem[] =>
  saved.flatMap(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product || !isInStock(product)) return [];
    const max = typeof product.stock === 'number' ? Math.min(product.stock, MAX_QTY_PER_ITEM) : MAX_QTY_PER_ITEM;
    return [{ ...product, quantity: Math.min(max, Math.max(1, item.quantity)) }];
  });

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => hydrateCart(read('taaibosch_cart', [])));
  const [wishlist, setWishlist] = useState<string[]>(() => read('taaibosch_wishlist', []));
  const [toast, setToast] = useState<CartToast | null>(null);
  const toastTimer = useRef<number>();
  const { products } = useCatalog();

  // When live dashboard data arrives (new prices, sold-out items), refresh the cart.
  useEffect(() => {
    setCart(prev => hydrateCart(prev.map(({ id, quantity }) => ({ id, quantity }))));
  }, [products]);

  useEffect(() => write('taaibosch_cart', cart.map(({ id, quantity }) => ({ id, quantity }))), [cart]);
  useEffect(() => write('taaibosch_wishlist', wishlist), [wishlist]);

  const dismissToast = useCallback(() => setToast(null), []);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: Math.min(MAX_QTY_PER_ITEM, item.quantity + quantity) } : item,
        );
      }
      return [...prev, { ...product, quantity: Math.min(MAX_QTY_PER_ITEM, quantity) }];
    });
    setToast({ id: Date.now(), product, quantity });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1 || quantity > MAX_QTY_PER_ITEM) return;
    setCart(prev => prev.map(item => (item.id === productId ? { ...item, quantity } : item)));
  };

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = (productId: string) =>
    setWishlist(prev => (prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]));

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, wishlist, toggleWishlist, toast, dismissToast }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
