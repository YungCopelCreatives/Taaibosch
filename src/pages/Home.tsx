/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Zap, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { PRODUCTS, WHATSAPP_NUMBER } from '../constants';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { AnimatePresence } from 'motion/react';

export const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const bestSellers = PRODUCTS.filter(p => p.isBestSeller).slice(0, 4);
  const featuredProducts = PRODUCTS.slice(0, 3);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Transition the announcement card slide-in
    const enterTimer = setTimeout(() => {
      setShowPopup(true);
    }, 1000);

    // Auto dismiss after 5 seconds of active presentation
    const exitTimer = setTimeout(() => {
      setShowPopup(false);
    }, 6000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const benefits = [
    { icon: Leaf, title: 'Natural Healing', desc: 'Sourced from the earth, processed with care.' },
    { icon: Zap, title: 'Daily Vitality', desc: 'Fuel your body with essential minerals and vitamins.' },
    { icon: ShieldCheck, title: 'Trustworthy', desc: 'Premium quality, affordable luxury wellness.' },
  ];

  return (
    <div className="">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:min-h-[95vh] pt-32 md:pt-40 flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1920&h=1080" 
            alt="Serene coastal shoreline" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight mb-6">
              A Return to <span className="italic font-serif">Self.</span>
            </h1>
            <p className="text-lg md:text-xl text-brand-ink/60 max-w-2xl mx-auto leading-relaxed">
              Modern herbal wellness for daily vitality and longevity. Carefully selected to support modern lifestyles without compromising authenticity.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/shop" 
              className="px-10 py-4 bg-brand-green-deep text-white rounded-full text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-all flex items-center space-x-2 shadow-lg"
            >
              <span>Shop Collection</span>
              <ArrowRight size={18} />
            </Link>
            <Link 
              to="/about" 
              className="px-10 py-4 bg-white text-brand-green-deep border border-brand-green-moss/20 rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-brand-green-light transition-all shadow-sm"
            >
              Our Story
            </Link>
          </motion.div>
        </div>

        {/* Dynamic & Timed Free Shipping Popup Announcement */}
        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-6 left-6 right-6 md:left-auto md:right-12 z-20 max-w-sm glass p-6 rounded-3xl border border-brand-green-moss/20 shadow-2xl space-y-3 text-left bg-white/90 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-brand-green-deep">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-green-deep animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Fulfillment Alert</span>
                </div>
                <button 
                  onClick={() => setShowPopup(false)}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors text-brand-ink/40 hover:text-brand-ink"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-brand-ink">Orders above R1000 get FREE Delivery!</h4>
                <p className="text-xs text-brand-ink/60 leading-relaxed">
                  Combine your wellness favorites—Free delivery applies automatically across South Africa once your subtotal hits R1000.
                </p>
              </div>
              
              <div className="pt-2 border-t border-black/5 text-[9px] text-brand-ink/40 tracking-wide font-medium flex items-center justify-between">
                <span>* Metro Hub deliveries query. Terms apply.</span>
                <Link to="/delivery-and-shipping" className="underline hover:text-brand-green-deep font-bold text-brand-ink/80 transition-colors">See Conditions</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Benefits Strip */}
      <section className="py-16 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {benefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="p-4 bg-brand-green-light rounded-2xl">
                <benefit.icon size={24} className="text-brand-green-deep" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">{benefit.title}</h3>
              <p className="text-sm text-brand-ink/60 leading-relaxed max-w-[250px]">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 space-y-4 md:space-y-0">
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-ink/40">Featured Collection</h2>
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">Curated for Your Vitality</h3>
          </div>
          <Link to="/shop" className="group flex items-center space-x-2 text-sm font-semibold uppercase tracking-widest hover:text-brand-ink/60 transition-all">
            <span>View All Products</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Brand Message */}
      <section className="py-32 bg-brand-beige overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-serif italic leading-tight">
              "Nature already provides what the body needs to restore, heal, and thrive."
            </h2>
            <div className="w-12 h-px bg-brand-green-moss mx-auto" />
            <p className="text-lg text-brand-ink/60 max-w-2xl mx-auto leading-relaxed">
              Taaibosch Organics was built on a simple belief. In a fast-moving world, we create space for balance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-ink/40 mb-4">Best Sellers</h2>
          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">Our Community Favorites</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Reseller CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-brand-green-deep text-white rounded-[2rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <img 
              src="/assets/general/partner-bg.png" 
              alt="Partner Background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="relative z-10 max-w-2xl space-y-8">
            <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-white/40">Partner With Taaibosch</h2>
            <h3 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Looking to resell our products? Join a growing community.
            </h3>
            <p className="text-lg text-white/60 leading-relaxed">
              Bring natural wellness to more people while growing your own business. We offer premium support and competitive wholesale pricing.
            </p>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hello, I am interested in reselling Taaibosch Organics products.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-3 px-10 py-4 bg-white text-brand-green-deep rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-brand-green-light transition-all shadow-xl"
            >
              <span>Contact Us to Resell</span>
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
