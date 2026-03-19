/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, Truck, MapPin, Phone, User, MessageCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import { DELIVERY_FEE, WHATSAPP_NUMBER, PRODUCTS } from '../constants';
import { Courier, DeliveryDetails } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, addToCart, clearCart } = useCart();
  const [step, setStep] = useState<'cart' | 'delivery' | 'details'>('cart');
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    courier: 'The Courier Guy',
    fullName: '',
    contactNumber: '',
    address: '',
    lockerName: '',
    pepStore: ''
  });

  const wellnessGoal = 600;
  const remainingForGoal = Math.max(0, wellnessGoal - cartTotal);

  const totalPayable = cartTotal + DELIVERY_FEE;

  const handleWhatsAppCheckout = () => {
    let detailsStr = `Full Name: ${deliveryDetails.fullName}\nContact: ${deliveryDetails.contactNumber}\n`;
    
    if (deliveryDetails.courier === 'The Courier Guy') {
      detailsStr += `Address: ${deliveryDetails.address}`;
    } else if (deliveryDetails.courier === 'Aramex') {
      detailsStr += `Aramex Locker: ${deliveryDetails.lockerName}`;
    } else if (deliveryDetails.courier === 'PAXI') {
      detailsStr += `PEP Store: ${deliveryDetails.pepStore}`;
    }

    const productsStr = cart.map(item => `- ${item.name} x${item.quantity} (R${item.price * item.quantity})`).join('\n');
    
    const message = `Hello, I would like to place an order:

Products:
${productsStr}

Subtotal: R${cartTotal}
Delivery Fee: R${DELIVERY_FEE}
Total Payable: R${totalPayable}

Delivery Method: ${deliveryDetails.courier}

Delivery Details:
${detailsStr}

Thank you.`;

    const url = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="pt-40 pb-24 px-6 text-center max-w-xl mx-auto space-y-8">
        <div className="w-24 h-24 bg-brand-grey rounded-full flex items-center justify-center mx-auto text-brand-ink/20">
          <Truck size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
          <p className="text-brand-ink/60 leading-relaxed">
            Looks like you haven't added any wellness products to your cart yet.
          </p>
        </div>
        <Link 
          to="/shop" 
          className="inline-flex items-center space-x-3 px-10 py-4 bg-brand-ink text-white rounded-full text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <span>Start Shopping</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left Column: Flow */}
        <div className="flex-grow space-y-12">
          {/* Progress Bar */}
          <div className="flex items-center space-x-4 mb-12">
            {['cart', 'delivery', 'details'].map((s, idx) => (
              <React.Fragment key={s}>
                <div className={cn(
                  "flex items-center space-x-2",
                  step === s ? "text-brand-ink" : "text-brand-ink/20"
                )}>
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                    step === s ? "border-brand-ink bg-brand-ink text-white" : "border-brand-ink/20"
                  )}>{idx + 1}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold">{s}</span>
                </div>
                {idx < 2 && <div className="w-8 h-px bg-brand-ink/10" />}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 'cart' && (
              <motion.div 
                key="cart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <h2 className="text-2xl font-semibold tracking-tight">Review Your Cart</h2>
                <div className="space-y-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center space-x-6 p-4 bg-brand-grey rounded-2xl group">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                      <div className="flex-grow">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-xs text-brand-ink/40 uppercase tracking-widest font-bold">{item.category}</p>
                        <p className="text-sm font-bold mt-1">R{item.price}</p>
                      </div>
                      <div className="flex items-center bg-white rounded-full p-1">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-brand-grey rounded-full transition-all">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-brand-grey rounded-full transition-all">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-3 text-brand-ink/20 hover:text-red-500 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setStep('delivery')}
                  className="w-full py-5 bg-brand-ink text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center space-x-3"
                >
                  <span>Continue to Delivery</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 'delivery' && (
              <motion.div 
                key="delivery"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold tracking-tight">Select Delivery Method</h2>
                  <button onClick={() => setStep('cart')} className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink">Back</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['Aramex', 'The Courier Guy', 'PAXI'] as Courier[]).map(c => (
                    <button 
                      key={c}
                      onClick={() => setDeliveryDetails({ ...deliveryDetails, courier: c })}
                      className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all space-y-4",
                        deliveryDetails.courier === c ? "border-brand-ink bg-brand-grey" : "border-black/5 hover:border-brand-ink/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        deliveryDetails.courier === c ? "bg-brand-ink text-white" : "bg-brand-grey text-brand-ink/40"
                      )}>
                        <Truck size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{c}</h4>
                        <p className="text-[10px] text-brand-ink/40 uppercase tracking-widest font-bold mt-1">
                          {c === 'Aramex' ? 'Locker Delivery' : c === 'PAXI' ? 'PEP Store Pickup' : 'Door-to-Door'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-8 bg-brand-green/30 rounded-2xl border border-brand-green">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Delivery Note</h4>
                  <p className="text-sm text-brand-ink/60 leading-relaxed">
                    {deliveryDetails.courier === 'Aramex' && 'Select your nearest Aramex pickup locker in the next step.'}
                    {deliveryDetails.courier === 'The Courier Guy' && 'Ensure accurate delivery details for smooth door-to-door delivery.'}
                    {deliveryDetails.courier === 'PAXI' && 'Select your nearest PEP pickup point in the next step.'}
                  </p>
                </div>

                <button 
                  onClick={() => setStep('details')}
                  className="w-full py-5 bg-brand-ink text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center space-x-3"
                >
                  <span>Enter Delivery Details</span>
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold tracking-tight">Delivery Details</h2>
                  <button onClick={() => setStep('delivery')} className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink">Back</button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={18} />
                        <input 
                          type="text" 
                          placeholder="John Doe"
                          className="w-full pl-12 pr-4 py-4 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-ink transition-all"
                          value={deliveryDetails.fullName}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={18} />
                        <input 
                          type="tel" 
                          placeholder="064 502 2066"
                          className="w-full pl-12 pr-4 py-4 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-ink transition-all"
                          value={deliveryDetails.contactNumber}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, contactNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {deliveryDetails.courier === 'The Courier Guy' && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Full Delivery Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 text-brand-ink/20" size={18} />
                        <textarea 
                          placeholder="Street, Suburb, City, Postal Code"
                          rows={3}
                          className="w-full pl-12 pr-4 py-4 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-ink transition-all resize-none"
                          value={deliveryDetails.address}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {deliveryDetails.courier === 'Aramex' && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Aramex Locker Name</label>
                      <div className="relative">
                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={18} />
                        <input 
                          type="text" 
                          placeholder="Select your nearest Aramex pickup locker"
                          className="w-full pl-12 pr-4 py-4 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-ink transition-all"
                          value={deliveryDetails.lockerName}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, lockerName: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {deliveryDetails.courier === 'PAXI' && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">PEP Store Name/Code</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/20" size={18} />
                        <input 
                          type="text" 
                          placeholder="Select your nearest PEP pickup point"
                          className="w-full pl-12 pr-4 py-4 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-brand-ink transition-all"
                          value={deliveryDetails.pepStore}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, pepStore: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleWhatsAppCheckout}
                  disabled={!deliveryDetails.fullName || !deliveryDetails.contactNumber}
                  className="w-full py-5 bg-[#25D366] text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle size={20} fill="currentColor" />
                  <span>Place Order via WhatsApp</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="bg-brand-grey rounded-[2rem] p-8 sticky top-32 space-y-8">
            <h3 className="text-xl font-semibold tracking-tight">Order Summary</h3>

            {remainingForGoal > 0 ? (
              <div className="bg-brand-green/20 p-4 rounded-2xl border border-brand-green/30 flex items-center space-x-3">
                <Sparkles size={18} className="text-brand-green flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/80">
                  You’re R{remainingForGoal} away from better wellness
                </p>
              </div>
            ) : (
              <div className="bg-brand-green/20 p-4 rounded-2xl border border-brand-green/30 flex items-center space-x-3">
                <Sparkles size={18} className="text-brand-green flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/80">
                  Wellness goal reached!
                </p>
              </div>
            )}

            {/* Upsell */}
            {!cart.some(item => item.id === 'sea-moss-elderberry-combo') && (
              <div className="bg-white p-6 rounded-2xl border border-black/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest">Complete the routine</h4>
                  <span className="text-[10px] bg-brand-green px-2 py-1 rounded-full font-bold">SAVE R50</span>
                </div>
                <p className="text-sm text-brand-ink/80 font-medium">Add Sea Moss + Elderberry combo for R400</p>
                <button 
                  onClick={() => {
                    const combo = PRODUCTS.find(p => p.id === 'sea-moss-elderberry-combo');
                    if (combo) addToCart(combo);
                  }}
                  className="w-full py-3 bg-brand-ink text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  Add to Order
                </button>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-ink/40">Subtotal</span>
                <span className="font-bold">R{cartTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-ink/40">Delivery Fee</span>
                <span className="font-bold">R{DELIVERY_FEE}</span>
              </div>
              <div className="h-px bg-black/5" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total Payable</span>
                <span className="font-bold">R{totalPayable}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 space-y-4">
              <div className="flex items-center space-x-3 text-brand-ink/40">
                <Truck size={18} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Delivery Info</span>
              </div>
              <p className="text-xs text-brand-ink/60 leading-relaxed">
                We offer flat-rate delivery across South Africa via Aramex, The Courier Guy, and PAXI.
              </p>
            </div>

            <p className="text-[10px] text-center text-brand-ink/40 uppercase tracking-widest font-bold">
              Secure WhatsApp Checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
