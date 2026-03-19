/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { WHATSAPP_NUMBER } from '../constants';

export const WhatsAppButton: React.FC = () => {
  const handleWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`;
    window.open(url, '_blank');
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleWhatsApp}
      className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 p-4 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
    >
      <MessageCircle size={24} fill="currentColor" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 whitespace-nowrap text-sm font-medium">
        Chat with us
      </span>
    </motion.button>
  );
};
