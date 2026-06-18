/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail, MapPin, ArrowRight } from 'lucide-react';
import { EMAIL, LOCATION, WHATSAPP_NUMBER } from '../constants';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-grey pt-20 pb-24 md:pb-12 px-6 border-t border-black/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
        <div className="space-y-6">
          <Link to="/" className="flex items-center">
            <img src="/assets/ORGANIC STORE LOGO.svg" alt="Taaibosch Organics" className="h-10 w-auto" />
          </Link>
          <p className="text-sm text-brand-ink/60 leading-relaxed max-w-xs">
            A modern herbal wellness brand focused on natural healing, daily vitality, and longevity.
          </p>
          <div className="flex space-x-4">
            <a href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full hover:bg-brand-green-deep hover:text-white transition-all shadow-sm">
              <MessageCircle size={18} />
            </a>
            <a href={`mailto:${EMAIL}`} className="p-2 bg-white rounded-full hover:bg-brand-green-deep hover:text-white transition-all shadow-sm">
              <Mail size={18} />
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Quick Links</h4>
          <ul className="space-y-3">
            {['Home', 'Shop', 'About', 'Contact', 'Blog'].map(item => (
              <li key={item}>
                <Link to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className="text-xs font-semibold hover:text-[#2D3627] transition-all uppercase tracking-wider block">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Fulfillment & Policy</h4>
          <ul className="space-y-3 text-xs font-medium">
            <li>
              <Link to="/ordering-process" className="hover:underline transition-all block">Ordering Process</Link>
            </li>
            <li>
              <Link to="/delivery-and-shipping" className="hover:underline transition-all block">Delivery & Shipping</Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:underline transition-all block">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/wiki/chondrus-crispus" className="text-brand-green-deep hover:underline transition-all font-semibold block">Wiki: Irish Moss (Sea Moss)</Link>
            </li>
            <li>
              <Link to="/wiki/annona-muricata" className="text-brand-green-deep hover:underline transition-all font-semibold block">Wiki: Soursop (Graviola)</Link>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Contact Info</h4>
          <ul className="space-y-4">
            <li className="flex items-start space-x-3 text-sm text-brand-ink/60">
              <MapPin size={18} className="mt-0.5 flex-shrink-0" />
              <span>{LOCATION}</span>
            </li>
            <li className="flex items-center space-x-3 text-sm text-brand-ink/60">
              <Mail size={18} className="flex-shrink-0" />
              <span>{EMAIL}</span>
            </li>
            <li className="flex items-center space-x-3 text-sm text-brand-ink/60">
              <MessageCircle size={18} className="flex-shrink-0" />
              <span>{WHATSAPP_NUMBER}</span>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Partner With Us</h4>
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <h5 className="font-medium">Partner With Taaibosch</h5>
            <p className="text-xs text-brand-ink/60 leading-relaxed">
              Looking to resell our products? Join a growing community bringing natural wellness to more people.
            </p>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hello, I am interested in reselling Taaibosch Organics products.`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full py-3 px-4 bg-brand-green-deep text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-md"
            >
              <span>Contact Us to Resell</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <p className="text-[10px] uppercase tracking-widest font-medium text-brand-ink/40">
          © {currentYear} Taaibosch Organics. All rights reserved.
        </p>
        <p className="text-[10px] uppercase tracking-widest font-medium text-brand-ink/40">
          Designed by Yung Copel Creative Agency
        </p>
      </div>
    </footer>
  );
};
