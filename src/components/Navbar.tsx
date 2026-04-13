/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingCart, Home, Store, Info, Phone, X, Menu, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import { PRODUCTS } from '../constants';
import { Product } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { cartCount, wishlist } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if scrolled past threshold for glass effect
      setIsScrolled(currentScrollY > 20);

      // Determine visibility (show on scroll up, hide on scroll down)
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const filteredProducts = searchQuery.trim() 
    ? PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Shop', path: '/shop', icon: Store },
    { name: 'Blog', path: '/blog', icon: BookOpen },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone },
  ];

  return (
    <>
      {/* Desktop Navbar - Floating Islands */}
      <div className={cn(
        "fixed top-6 left-0 right-0 z-50 hidden lg:block transition-all duration-500",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo Island */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 flex items-center"
          >
            <Link to="/" className="flex items-center">
              <img src="/assets/logo.png" alt="Taaibosch Organics" className="h-8 w-auto" />
            </Link>
          </motion.div>

          {/* Nav Links Island */}
          <div className="glass px-2 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 flex items-center">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300",
                  location.pathname === link.path 
                    ? "bg-brand-ink text-white shadow-md" 
                    : "text-brand-ink/40 hover:text-brand-ink hover:bg-brand-grey/50"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions Island */}
          <div className="glass px-2 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 flex items-center space-x-1">
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="p-3 hover:bg-brand-grey rounded-full transition-colors text-brand-ink/60 hover:text-brand-ink"
            >
              <Search size={18} />
            </button>
            <Link 
              to="/wishlist" 
              className="p-3 hover:bg-brand-grey rounded-full transition-colors relative text-brand-ink/60 hover:text-brand-ink"
            >
              <Heart size={18} />
              {wishlist.length > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-ink rounded-full" />
              )}
            </Link>
            <Link 
              to="/cart" 
              className="p-3 bg-brand-ink text-white rounded-full transition-transform hover:scale-105 relative"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-brand-ink text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Top Header - Floating Island */}
      <div className={cn(
        "fixed top-4 left-4 right-4 z-50 transition-all duration-500 lg:hidden",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"
      )}>
        <div className="glass px-4 py-3 rounded-2xl shadow-lg border border-black/5 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/assets/logo.png" alt="Taaibosch Organics" className="h-6 w-auto" />
          </Link>
          <div className="flex items-center space-x-2">
            <Link to="/wishlist" className="relative p-2 text-brand-ink/60">
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-ink rounded-full" />
              )}
            </Link>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 bg-brand-ink text-white rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm lg:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm z-[120] bg-white lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-black/5">
                <span className="font-semibold tracking-tight">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-brand-grey rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto py-8 px-6 space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-ink/40">Navigation</p>
                  <div className="grid grid-cols-1 gap-2">
                    {navLinks.map(link => (
                      <Link 
                        key={link.path}
                        to={link.path}
                        className={cn(
                          "flex items-center space-x-4 p-4 rounded-2xl transition-all",
                          location.pathname === link.path ? "bg-brand-ink text-white" : "hover:bg-brand-grey"
                        )}
                      >
                        <link.icon size={20} />
                        <span className="font-medium">{link.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-ink/40">Account & Shopping</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Link to="/wishlist" className="flex items-center space-x-4 p-4 hover:bg-brand-grey rounded-2xl transition-all">
                      <Heart size={20} />
                      <span className="font-medium">Wishlist</span>
                    </Link>
                    <Link to="/cart" className="flex items-center space-x-4 p-4 hover:bg-brand-grey rounded-2xl transition-all">
                      <ShoppingCart size={20} />
                      <span className="font-medium">My Cart</span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-black/5 bg-brand-grey/30">
                <p className="text-xs text-brand-ink/40 mb-4 font-medium">Connect with us</p>
                <div className="flex space-x-4">
                  <a href="#" className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform">
                    <Phone size={18} />
                  </a>
                  <a href="#" className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform">
                    <Info size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navbar - Floating Island */}
      <nav className="fixed bottom-6 left-6 right-6 z-[100] lg:hidden">
        <div className="glass px-2 py-3 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 flex items-center justify-around">
          {navLinks.filter(link => !['About', 'Contact'].includes(link.name)).map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={cn(
                "flex flex-col items-center p-3 rounded-2xl transition-all duration-300",
                location.pathname === link.path ? "bg-brand-ink text-white shadow-lg scale-105" : "text-brand-ink/40"
              )}
            >
              <link.icon size={22} />
            </Link>
          ))}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center p-3 text-brand-ink/40 hover:text-brand-ink transition-all duration-300"
          >
            <Search size={22} />
          </button>
          <Link 
            to="/cart"
            className={cn(
              "flex flex-col items-center p-3 relative rounded-2xl transition-all duration-300",
              location.pathname === '/cart' ? "bg-brand-ink text-white shadow-lg scale-105" : "text-brand-ink/40"
            )}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-white text-brand-ink text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="max-w-3xl mx-auto w-full px-6 pt-20">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-medium tracking-tight">Search</h2>
                <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-brand-grey rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="relative">
                <input 
                  autoFocus
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full text-2xl py-4 border-b border-brand-ink/10 focus:outline-none focus:border-brand-ink transition-colors bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-ink/40" size={24} />
              </div>

              <div className="mt-12">
                {searchQuery.trim() === '' ? (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-brand-ink/40 mb-6 font-semibold">Quick Links</p>
                    <div className="flex flex-wrap gap-3">
                      {['Seamoss', 'Capsules', 'Immunity', 'Energy'].map(tag => (
                        <button 
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="px-4 py-2 bg-brand-grey rounded-full text-sm hover:bg-brand-ink hover:text-white transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-xs uppercase tracking-widest text-brand-ink/40 font-semibold">Suggestions</p>
                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredProducts.map(product => (
                          <Link 
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center space-x-4 p-4 hover:bg-brand-grey rounded-2xl transition-all group"
                          >
                            <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl" />
                            <div>
                              <h4 className="font-medium group-hover:underline">{product.name}</h4>
                              <p className="text-sm text-brand-ink/60">R{product.price}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-brand-ink/60 italic">No products found matching "{searchQuery}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
