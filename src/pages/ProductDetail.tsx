/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Heart, ShoppingCart, ArrowLeft, Plus, Minus, Share2, Leaf, ShieldCheck, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS, WHATSAPP_NUMBER } from '../constants';
import { useCart } from '../CartContext';
import { ProductCard } from '../components/ProductCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>('benefits');

  const product = PRODUCTS.find(p => p.id === id);
  const isWishlisted = wishlist.includes(id || '');
  const productSlug = product?.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') || '';

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
  }, [id]);

  if (!product) {
    return (
      <div className="pt-32 pb-24 px-6 text-center">
        <h2 className="text-2xl font-medium mb-4">Product not found</h2>
        <Link to="/shop" className="text-brand-ink underline">Back to Shop</Link>
      </div>
    );
  }

  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const sections = [
    { id: 'benefits', title: 'Benefits', content: product.benefits || [] },
    { id: 'ingredients', title: 'Ingredients', content: product.ingredients || [] },
    { id: 'usage', title: 'Usage', content: [product.usage] },
    { id: 'who', title: "Who it's for", content: [product.whoItsFor] },
  ];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const handleWhatsAppOrder = () => {
    const message = `Hello, I'm interested in ordering ${quantity} x ${product.name} (R${product.price * quantity}).`;
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="pt-12 pb-24 px-6 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink transition-all mb-12"
      >
        <ArrowLeft size={16} />
        <span>Go Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
        {/* Gallery */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-[2rem] overflow-hidden bg-brand-grey"
          >
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-brand-grey opacity-40 hover:opacity-100 transition-all cursor-pointer">
                <img src={`/assets/products/gallery/${productSlug}-${i}.png`} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-brand-ink/40">{product.category}</p>
              <div className="flex items-center space-x-4">
                <button onClick={() => toggleWishlist(product.id)} className={cn("p-2 rounded-full transition-all", isWishlisted ? "text-red-500 bg-red-50" : "text-brand-ink/40 hover:text-brand-ink bg-brand-grey")}>
                  <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
                <button className="p-2 rounded-full text-brand-ink/40 hover:text-brand-ink bg-brand-grey transition-all">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">{product.name}</h1>
            {product.headline && <p className="text-lg font-medium text-brand-ink/80 italic">{product.headline}</p>}
            <p className="text-2xl font-medium">R{product.price}</p>
          </div>

          <div className="space-y-4">
            {product.hook && <p className="text-sm font-bold uppercase tracking-widest text-brand-ink/60">{product.hook}</p>}
            <p className="text-brand-ink/60 leading-relaxed text-lg">
              {product.summary}
            </p>
            {product.whyPeopleChooseIt && (
              <div className="bg-brand-grey p-6 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-widest">Why people choose it</h4>
                <p className="text-sm text-brand-ink/60 leading-relaxed">{product.whyPeopleChooseIt}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {product.healthGoals.map(goal => (
              <span key={goal} className="px-4 py-2 bg-brand-green text-brand-ink/80 text-[10px] font-bold uppercase tracking-widest rounded-full">
                Best for: {goal}
              </span>
            ))}
          </div>

          <div className="space-y-6 pt-6 border-t border-black/5">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-6">
                <div className="flex items-center bg-brand-grey rounded-full p-1">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-3 hover:bg-white rounded-full transition-all"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-3 hover:bg-white rounded-full transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="flex-grow py-5 bg-brand-grey text-brand-ink border border-brand-ink/10 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-brand-ink hover:text-white transition-all flex items-center justify-center space-x-3"
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </button>
              </div>
              <button 
                onClick={handleWhatsAppOrder}
                className="w-full py-5 bg-[#25D366] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center space-x-3"
              >
                <MessageCircle size={20} fill="currentColor" />
                <span>Order via WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Trust Builders */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-black/5">
            <div className="flex flex-col items-center text-center space-y-2">
              <Leaf size={20} className="text-brand-ink/40" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/60">Natural Ingredients</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck size={20} className="text-brand-ink/40" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/60">No Additives</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Heart size={20} className="text-brand-ink/40" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/60">Trusted Community</span>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-2 pt-10">
            {sections.map(section => (
              <div key={section.id} className="border-b border-black/5 last:border-0">
                <button 
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full py-6 flex items-center justify-between text-left group"
                >
                  <span className="text-sm font-bold uppercase tracking-widest group-hover:text-brand-ink/60 transition-all">{section.title}</span>
                  {expandedSection === section.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 space-y-4">
                        {section.content.map((item, idx) => (
                          <p key={idx} className="text-sm text-brand-ink/60 leading-relaxed flex items-start space-x-3">
                            {section.content.length > 1 && <span className="w-1.5 h-1.5 bg-brand-ink/20 rounded-full mt-1.5 flex-shrink-0" />}
                            <span>{item}</span>
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-12">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold tracking-tight">People also bought</h3>
            <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink transition-all">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
