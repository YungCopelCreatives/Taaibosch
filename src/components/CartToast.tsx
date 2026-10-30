import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';

/** Confirms "added to cart" so shoppers aren't left guessing. */
export const CartToast: React.FC = () => {
  const { toast, dismissToast, cartCount } = useCart();
  const { pathname } = useLocation();
  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return null;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed z-[105] left-4 right-4 bottom-28 md:left-auto md:right-28 md:bottom-8 md:w-96 glass bg-white/95 rounded-3xl shadow-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
        >
          <img src={toast.product.image} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover bg-brand-grey flex-shrink-0" />
          <div className="flex-grow min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-green-deep whitespace-nowrap">
              <Check size={12} strokeWidth={3} /> Added to cart
            </p>
            <p className="text-sm font-medium truncate">
              {toast.quantity > 1 ? `${toast.quantity} × ` : ''}{toast.product.name}
            </p>
          </div>
          <Link
            to="/cart"
            onClick={dismissToast}
            className="flex-shrink-0 whitespace-nowrap px-4 py-2.5 bg-brand-green-deep text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
          >
            View cart<span className="hidden sm:inline"> ({cartCount})</span>
          </Link>
          <button onClick={dismissToast} aria-label="Dismiss" className="p-1 text-brand-ink/30 hover:text-brand-ink">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
