/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Truck, HelpCircle, ArrowRight, MessageCircle, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER, DELIVERY_FEE, EMAIL, FREE_DELIVERY_THRESHOLD, whatsappLink } from '../constants';
import { usePageMeta } from '../lib/usePageMeta';

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
      <p className="text-sm text-brand-ink/40 uppercase tracking-widest font-bold">Last Updated: October 2026</p>
    </motion.div>

    <div className="prose prose-stone max-w-none text-brand-ink/80 space-y-8 text-base leading-relaxed">
      <p>
        At <strong>Taaibosch Organics</strong>, we value the trust you place in us when purchasing our artisanal alkaline herbal supplements. This Privacy Policy documents how we process, collect, and protect your personal identification data during your visits and transactions on our digital platforms.
      </p>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">1. Information We Collect</h2>
        <p>When you place an order (online or on WhatsApp) we collect only what we need to fulfil it:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Contact details:</strong> your name, South African mobile number and email address.</li>
          <li><strong>Delivery details:</strong> your street address, Aramex locker or PAXI / PEP store.</li>
          <li><strong>Order details:</strong> the products, quantities and amount paid, and your order reference.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">2. Card Payments</h2>
        <p>
          Card payments are processed by <strong>Yoco</strong>, a PCI DSS-compliant South African payment provider. You enter your card
          details on Yoco's secure payment page; Taaibosch Organics never sees or stores your card number. Yoco shares only a payment
          confirmation and your order reference with us.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">3. How We Use and Share Your Information</h2>
        <p>
          We use your details to process payment, pack and deliver your order, send your receipt and tracking updates, and answer your
          questions. We share delivery details only with the courier you choose (The Courier Guy, Aramex or PAXI). We do not sell your
          information or add you to marketing lists without your consent.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-brand-ink">4. Storage, Retention and Your Rights</h2>
        <p>
          Order records are stored securely and kept only as long as needed for delivery, returns, and tax and accounting requirements.
          Your saved checkout details on this device stay in your own browser and can be cleared at any time. Under POPIA you may ask to
          see, correct or delete your personal information: email <strong>{EMAIL}</strong>.
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
          * Conditions apply: Delivery destinations must reside in South African standard-rate postal code areas. Very remote addresses may need an alternative courier; if so we'll contact you before dispatch and refund the difference or any amount you choose to cancel.
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
          <div className="font-semibold text-lg text-brand-ink">Pay Securely Online</div>
          <p className="text-sm text-brand-ink/60">
            Review your order and pay by card on Yoco's secure payment page. You're brought straight back to a confirmation page and
            receive an emailed receipt with your order reference. Prefer EFT? Choose "Order via WhatsApp" at checkout and we'll send
            you our banking details from <strong>{WHATSAPP_NUMBER}</strong>.
          </p>
        </div>
      </div>

      <div className="flex space-x-6 relative">
        <div className="w-12 h-12 rounded-full bg-brand-green-deep text-white flex items-center justify-center font-bold text-lg shadow-md z-10">4</div>
        <div className="space-y-2 flex-grow">
          <div className="font-semibold text-lg text-brand-ink">Packed with Care & Dispatched</div>
          <p className="text-sm text-brand-ink/60">
            As soon as your payment is confirmed your order is packed and handed to your chosen courier. The courier issues a tracking
            link once they collect it, and we send it to your phone by WhatsApp or SMS (your choice at checkout) so you can follow it to
            your door, locker or PEP store.
          </p>
        </div>
      </div>
    </div>

    <div className="p-8 bg-brand-grey border border-black/5 rounded-[2rem] space-y-4">
      <h3 className="font-bold text-lg">Order Safely. Heal Naturally.</h3>
      <p className="text-sm text-brand-ink/60 leading-relaxed">
        Card details are handled only by Yoco and never reach us. And you still get a real person: message us on WhatsApp any time to ask about combinations and correct intake.
      </p>
      <a 
        href={whatsappLink()}
        className="inline-flex items-center space-x-2 text-xs font-bold text-brand-green-deep hover:underline uppercase tracking-wider"
      >
        <span>Ask a Question on WhatsApp</span>
        <ArrowRight size={14} />
      </a>
    </div>
  </div>
);


const LegalShell: React.FC<{ icon: React.ElementType; eyebrow: string; title: string; children: React.ReactNode }> = ({ icon: Icon, eyebrow, title, children }) => {
  usePageMeta(title);
  return (
    <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-4xl mx-auto space-y-12">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center space-x-3 text-brand-green-deep">
          <Icon size={20} />
          <span className="text-xs uppercase tracking-[0.2em] font-bold">{eyebrow}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-brand-ink/40 uppercase tracking-widest font-bold">Last Updated: October 2026</p>
      </motion.div>
      <div className="max-w-none text-brand-ink/80 space-y-8 text-base leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-brand-ink [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  );
};

export const ReturnsAndRefunds: React.FC = () => (
  <LegalShell icon={RefreshCw} eyebrow="Customer Care" title="Returns & Refunds">
    <p>
      We want you to love your order. Because our products are consumable wellness items, we follow the South African Consumer
      Protection Act (CPA) with a few hygiene-related conditions explained below.
    </p>
    <section className="space-y-4">
      <h2>Damaged, incorrect or defective items</h2>
      <p>
        If anything arrives damaged, leaks, is not what you ordered or is defective, let us know within <strong>7 days</strong> of
        delivery with your order reference and a photo. We'll replace it or refund you in full, including delivery costs.
      </p>
    </section>
    <section className="space-y-4">
      <h2>Changed your mind</h2>
      <p>
        Unopened products in their original sealed packaging can be returned within <strong>7 days</strong> of delivery. For health and
        safety reasons we can't accept opened capsules, gels or loose herbs unless they are faulty. Return delivery costs are for your
        account in this case.
      </p>
    </section>
    <section className="space-y-4">
      <h2>Cancelling an order</h2>
      <p>
        You can cancel for a full refund any time before your order is dispatched. Message us on WhatsApp or email with your order
        reference.
      </p>
    </section>
    <section className="space-y-4">
      <h2>How refunds are paid</h2>
      <p>
        Card payments are refunded to the same card through Yoco, usually within 5–10 working days depending on your bank. EFT payments
        are refunded to the account you paid from.
      </p>
    </section>
    <div className="p-6 bg-brand-green-light rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <p className="text-sm">Need help with an order? Email <strong>{EMAIL}</strong> or message us.</p>
      <a href={whatsappLink('Hi Taaibosch, I need help with a return for order ')} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-2 text-xs font-bold text-brand-green-deep uppercase tracking-wider hover:underline">
        <MessageCircle size={14} /> WhatsApp us
      </a>
    </div>
  </LegalShell>
);

export const TermsOfSale: React.FC = () => (
  <LegalShell icon={Shield} eyebrow="Legal" title="Terms of Sale">
    <p>
      These terms apply to purchases from Taaibosch Organics ("we", "us") through this website and WhatsApp. By placing an order you
      agree to them.
    </p>
    <section className="space-y-4">
      <h2>1. Prices and payment</h2>
      <p>
        All prices are in South African Rand (ZAR). Delivery is a flat R{DELIVERY_FEE} and free on orders of R{FREE_DELIVERY_THRESHOLD} or more. Online card payments are processed securely by Yoco. Your order is
        confirmed once payment is received; you'll get an email with your order reference.
      </p>
    </section>
    <section className="space-y-4">
      <h2>2. Availability</h2>
      <p>
        Products are subject to availability. If an item you paid for is out of stock we'll contact you to offer a replacement, a wait
        for restock, or a full refund for that item.
      </p>
    </section>
    <section className="space-y-4">
      <h2>3. Delivery</h2>
      <p>
        We deliver within South Africa via The Courier Guy, Aramex lockers and PAXI. Delivery times are estimates from the courier and
        start once your order is dispatched. See <Link to="/delivery-and-shipping" className="underline">Delivery & Shipping</Link>.
      </p>
    </section>
    <section className="space-y-4">
      <h2>4. Returns and refunds</h2>
      <p>See our <Link to="/returns" className="underline">Returns & Refunds</Link> policy.</p>
    </section>
    <section className="space-y-4">
      <h2>5. Health information</h2>
      <p>
        Our products are botanical supplements. Information on this site is for general education and has not been evaluated by
        SAHPRA. Products are not intended to diagnose, treat, cure or prevent any disease. Consult a registered healthcare practitioner
        before use, especially if you are pregnant, breastfeeding, taking medication or have a medical condition.
      </p>
    </section>
    <section className="space-y-4">
      <h2>6. Contact</h2>
      <p>Taaibosch Organics · Hout Bay, Cape Town · {EMAIL} · {WHATSAPP_NUMBER}</p>
    </section>
  </LegalShell>
);
