/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { whatsappLink } from '../constants';
import { useCart } from '../CartContext';

export const WhatsAppButton: React.FC = () => {
  const { pathname } = useLocation();
  const { toast } = useCart();
  // Checkout has its own WhatsApp option; the bubble would cover the Pay button on phones.
  if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return null;
  // Step aside on phones while the "added to cart" toast is showing.
  const hideOnMobile = toast ? 'max-md:hidden' : '';

  return (
    <motion.a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`${hideOnMobile} fixed bottom-28 right-6 md:bottom-8 md:right-8 z-40 p-4 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group`}
    >
      <MessageCircle size={24} fill="currentColor" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 whitespace-nowrap text-sm font-medium">
        Chat with us
      </span>
    </motion.a>
  );
};
