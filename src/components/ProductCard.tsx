/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const isWishlisted = wishlist.includes(product.id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-brand-grey mb-4">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isBestSeller && (
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-sm flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span>High Demand</span>
            </span>
          )}
          {product.isTrending && (
            <span className="px-3 py-1 bg-brand-green-deep text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-sm">
              Frequently Ordered
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={() => toggleWishlist(product.id)}
          className={cn(
            "absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all duration-300",
            isWishlisted ? "bg-red-50 text-red-500" : "bg-white/90 text-brand-ink/40 hover:text-brand-green-deep"
          )}
        >
          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        {/* Quick Add Button (Desktop) */}
        <button 
          onClick={() => addToCart(product)}
          className="absolute bottom-4 right-4 p-3 bg-brand-green-deep text-white rounded-full translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center shadow-lg"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-grow">
        <div className="flex items-start justify-between mb-1">
          <Link to={`/product/${product.id}`} className="hover:underline">
            <h3 className="text-sm font-medium tracking-tight text-brand-ink/80">{product.name}</h3>
          </Link>
        </div>
        <p className="text-xs text-brand-ink/40 mb-2 uppercase tracking-widest font-medium">{product.category}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {product.healthGoals.slice(0, 2).map(goal => (
            <span key={goal} className="px-2 py-0.5 bg-brand-green-moss/20 text-brand-green-deep text-[8px] font-bold uppercase tracking-widest rounded-full">
              Best for: {goal}
            </span>
          ))}
        </div>
        <p className="text-sm font-semibold">R{product.price}</p>
      </div>

      {/* Add to Cart (Mobile) */}
      <button 
        onClick={() => addToCart(product)}
        className="mt-4 w-full py-3 bg-brand-grey text-brand-green-deep text-xs font-semibold uppercase tracking-widest rounded-xl hover:bg-brand-green-deep hover:text-white transition-all md:hidden flex items-center justify-center space-x-2"
      >
        <ShoppingCart size={14} />
        <span>Add to Cart</span>
      </button>
    </motion.div>
  );
};
