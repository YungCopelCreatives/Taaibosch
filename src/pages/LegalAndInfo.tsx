/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Truck, HelpCircle, ArrowRight, MessageCircle, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { WHATSAPP_NUMBER, DELIVERY_FEE } from '../constants';

export const PrivacyPolicy: React.FC = () => (
  <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-4xl mx-auto space-y-12">
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3 text-brand-green-deep">
        <Shield size={20} />
        <span className="text-xs uppercase tracking-[0.2em] font-bold">Security & Trust</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-brand-ink/40 uppercase tracking-widest font-bold">Last Updated: June 18, 2026</p>
    </motion.div>

    <div className="prose prose-stone max-w-none text-brand-ink/80 space-y-8 text-base leading-relaxed">
      <p>
        At <strong>Taaibosch Organics</strong>, we value the trust you place in us when purchasing our artisanal alkaline herbal supplements. This Privacy Policy documents how we process, collect, and protect your personal identification data during your visits and transactions on our digital platforms.
      </p>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">1. Information We Collect</h2>
        <p>
          Unlike conventional automated retailers, we operate a supportive, high-touch ordering model mediated directly through encrypted <strong>WhatsApp Business</strong> terminals. To complete an transaction, we collect:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Personal Coordinates:</strong> Full Legal Name, active South African contact telephone number, and secure delivery address coordinates.</li>
          <li><strong>Courier Choice Specifications:</strong> Designated PEP Store location code, Aramex locker number, or physical delivery address.</li>
          <li><strong>Cart Selection Metatags:</strong> List of items, volumes, and preferred delivery speeds.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">2. How Personal Data is Utilized</h2>
        <p>
          We strictly employ your personal information to facilitate shipping, invoice generation, and communicate individual billing specifications. We do not engage in mailing lists or database reselling.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">3. Encryption & WhatsApp Safety</h2>
        <p>
          Your cart selection is converted to a secure, end-to-end encrypted message string before transmitting to our WhatsApp Business support center. Your residential address and telephone numbers never reside on database servers.
        </p>
      </div>

      <div className="space-y-4 font-serif italic p-6 bg-brand-grey rounded-2xl border border-black/5">
        "Taaibosch Organics is committed to the protection of customer data under the Protection of Personal Information Act (POPIA) of South Africa. We preserve and clean customer logs strictly for delivery compliance."
      </div>
    </div>
  </div>
);

export const DeliveryAndShipping: React.FC = () => (
  <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-4xl mx-auto space-y-12">
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3 text-brand-green-deep">
        <Truck size={20} />
        <span className="text-xs uppercase tracking-[0.2em] font-bold">Fulfillment</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Delivery & Shipping</h1>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-brand-grey rounded-2xl border border-black/5 space-y-3">
        <div className="font-bold text-lg text-brand-ink">The Courier Guy</div>
        <p className="text-xs text-brand-ink/60">Door-to-door delivery. Ideal for metropolitan houses, apartments, and commercial offices.</p>
        <span className="text-[10px] font-bold uppercase bg-brand-green/30 px-2 py-1 rounded">2 - 3 Days</span>
      </div>
      <div className="p-6 bg-brand-grey rounded-2xl border border-black/5 space-y-3">
        <div className="font-bold text-lg text-brand-ink">Aramex Locker</div>
        <p className="text-xs text-brand-ink/60">Contactless pickup from your designated neighborhood Aramex smart locker island.</p>
        <span className="text-[10px] font-bold uppercase bg-brand-green/30 px-2 py-1 rounded">2 - 4 Days</span>
      </div>
      <div className="p-6 bg-brand-grey rounded-2xl border border-black/5 space-y-3">
        <div className="font-bold text-lg text-brand-ink">PAXI (PEP)</div>
        <p className="text-xs text-brand-ink/60">Extremely budget-friendly. Pickup from your nearest local PEP store checkout counter.</p>
        <span className="text-[10px] font-bold uppercase bg-brand-green/30 px-2 py-1 rounded">4 - 7 Days</span>
      </div>
    </div>

    <div className="prose prose-stone max-w-none text-brand-ink/80 space-y-8 text-base leading-relaxed border-t border-black/5 pt-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">Standard Delivery Rates</h2>
        <p>
          We charge a flat fulfillment rate of <strong>R{DELIVERY_FEE}</strong> per package for standard shipments anywhere in South Africa.
        </p>
      </div>

      <div className="bg-brand-green/10 p-6 rounded-3xl border border-brand-green/30 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-green-deep">Free Shipping Condition</h3>
        <p className="text-sm text-brand-ink/80 leading-relaxed">
          Orders containing wellness products with a cart total of <strong>R1000 or more qualify for 100% Free Shipping</strong>. This promotion is automatically applied during checkout when your order exceeds R1000.
        </p>
        <div className="text-[10px] uppercase font-bold text-brand-ink/40 tracking-widest pt-2">
          * Conditions apply: Delivery destinations must reside in South African standard-rate postal code areas. Remote estates / extreme-outlying rural farms may incur a manual surcharge after order verification on WhatsApp.
        </div>
      </div>
    </div>
  </div>
);

export const OrderingProcess: React.FC = () => (
  <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-4xl mx-auto space-y-12">
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center space-x-3 text-brand-green-deep">
        <HelpCircle size={20} />
        <span className="text-xs uppercase tracking-[0.2em] font-bold">Step-by-Step Guide</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Ordering Process</h1>
      <p className="text-brand-ink/60 text-lg">
        How Taaibosch combines physical natural care with structured digital convenience.
      </p>
    </motion.div>

    <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-green/20">
      <div className="flex space-x-6 relative">
        <div className="w-12 h-12 rounded-full bg-brand-green-deep text-white flex items-center justify-center font-bold text-lg shadow-md z-10">1</div>
        <div className="space-y-2 flex-grow">
          <div className="font-semibold text-lg text-brand-ink">Select & Cart Your Herbal Routine</div>
          <p className="text-sm text-brand-ink/60">
            Browse our clinical range of capsules, sea moss gels, and raw herbs. Add items to your Cart and adjust quantities based on your current health goals.
          </p>
        </div>
      </div>

      <div className="flex space-x-6 relative">
        <div className="w-12 h-12 rounded-full bg-brand-green-deep text-white flex items-center justify-center font-bold text-lg shadow-md z-10">2</div>
        <div className="space-y-2 flex-grow">
          <div className="font-semibold text-lg text-brand-ink">Provision Shipping Details & Select Courier</div>
          <p className="text-sm text-brand-ink/60">
            Designate your preferred courier method (The Courier Guy, Aramex, or budget-friendly PAXI). Enter your full name, contact line, and localized delivery point coordinates.
          </p>
        </div>
      </div>

      <div className="flex space-x-6 relative">
        <div className="w-12 h-12 rounded-full bg-brand-green-deep text-white flex items-center justify-center font-bold text-lg shadow-md z-10">3</div>
        <div className="space-y-2 flex-grow">
          <div className="font-semibold text-lg text-brand-ink">Secure WhatsApp Handshake</div>
          <p className="text-sm text-brand-ink/60">
            Clicking checkout automatically compiles your cart selections and coordinates into an encrypted WhatsApp text. The app opens your WhatsApp terminal (on mobile or web) to send the order directly to our customer support desk: <strong>{WHATSAPP_NUMBER}</strong>.
          </p>
        </div>
      </div>

      <div className="flex space-x-6 relative">
        <div className="w-12 h-12 rounded-full bg-brand-green-deep text-white flex items-center justify-center font-bold text-lg shadow-md z-10">4</div>
        <div className="space-y-2 flex-grow">
          <div className="font-semibold text-lg text-brand-ink">Manual Payment (EFT / Deposit) & Dispatch</div>
          <p className="text-sm text-brand-ink/60">
            Our support desk verifies stock availability and shares our manual banking coordinates. Provide a copy of your EFT payment receipt via chat. Your package is prepared, packed with care, and dispatched with a live tracking link.
          </p>
        </div>
      </div>
    </div>

    <div className="p-8 bg-brand-grey border border-black/5 rounded-[2rem] space-y-4">
      <h3 className="font-bold text-lg">Order Safely. Heal Naturally.</h3>
      <p className="text-sm text-brand-ink/60 leading-relaxed">
        Our WhatsApp method ensures your personal addresses are never stored in a high-risk cloud database. You receive a human relationship with our herbalists, allowing you to ask questions about combinations and correct intake.
      </p>
      <a 
        href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
        className="inline-flex items-center space-x-2 text-xs font-bold text-brand-green-deep hover:underline uppercase tracking-wider"
      >
        <span>Ask a Question on WhatsApp</span>
        <ArrowRight size={14} />
      </a>
    </div>
  </div>
);
