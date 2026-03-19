/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Filter, ChevronDown, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS } from '../constants';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Category, HealthGoal } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Shop: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedGoals, setSelectedGoals] = useState<HealthGoal[]>([]);
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<'Popular' | 'Price low-high' | 'Price high-low'>('Popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const categories: (Category | 'All')[] = ['All', 'Capsules', 'Seamoss', 'Herbal', 'Raw', 'Gel'];
  const healthGoals: HealthGoal[] = ['Immunity', 'Energy', 'Detox', 'Skin', 'Hormonal balance', 'Metabolism', 'Thyroid', 'Digestion', 'Cleansing', 'Respiratory', 'Vitality', 'Relaxation', 'Sleep', 'Heart', 'Nutrition', 'Stress'];

  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedGoals.length > 0) {
      result = result.filter(p => selectedGoals.some(goal => p.healthGoals.includes(goal)));
    }

    result = result.filter(p => p.price <= priceRange);

    if (sortBy === 'Price low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Popular') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [selectedCategory, selectedGoals, priceRange, sortBy]);

  const toggleGoal = (goal: HealthGoal) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const FilterContent = () => (
    <div className="space-y-12">
      <div className="space-y-6">
        <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Category</h4>
        <div className="flex flex-col space-y-3">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "text-left text-sm font-medium transition-all hover:translate-x-1",
                selectedCategory === cat ? "text-brand-ink" : "text-brand-ink/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Health Goals</h4>
        <div className="flex flex-wrap gap-2">
          {healthGoals.map(goal => (
            <button 
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium transition-all border",
                selectedGoals.includes(goal) 
                  ? "bg-brand-ink text-white border-brand-ink" 
                  : "bg-white text-brand-ink/60 border-black/5 hover:border-brand-ink/20"
              )}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Price Range</h4>
          <span className="text-xs font-bold">Up to R{priceRange}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1000" 
          step="50"
          value={priceRange}
          onChange={(e) => setPriceRange(parseInt(e.target.value))}
          className="w-full accent-brand-ink"
        />
      </div>

      <button 
        onClick={() => {
          setSelectedCategory('All');
          setSelectedGoals([]);
          setPriceRange(1000);
          setSortBy('Popular');
        }}
        className="w-full py-4 text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink transition-all"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <div className="pt-12 pb-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start justify-between mb-12 space-y-8 md:space-y-0">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Shop All</h1>
          <p className="text-brand-ink/60 text-sm max-w-md leading-relaxed">
            Explore our curated collection of premium herbal wellness products.
          </p>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-brand-grey px-6 py-4 pr-12 rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none w-full"
            >
              <option value="Popular">Sort: Popular</option>
              <option value="Price low-high">Price: Low to High</option>
              <option value="Price high-low">Price: High to Low</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-ink/40" />
          </div>

          <button 
            onClick={() => setIsFilterOpen(true)}
            className="md:hidden p-4 bg-brand-grey rounded-2xl"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-32 h-fit">
          <FilterContent />
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-6 bg-brand-grey rounded-[2rem]">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-brand-ink/20">
                <Search size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium">No products found</h3>
                <p className="text-brand-ink/40 text-sm">Try adjusting your filters to find what you're looking for.</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedGoals([]);
                  setPriceRange(1000);
                }}
                className="px-8 py-3 bg-brand-ink text-white rounded-full text-xs font-bold uppercase tracking-widest"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm z-[70] bg-white p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-medium tracking-tight">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-brand-grey rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <FilterContent />
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="mt-12 w-full py-4 bg-brand-ink text-white rounded-2xl text-xs font-bold uppercase tracking-widest"
              >
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
