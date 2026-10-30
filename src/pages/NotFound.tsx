import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';
import { usePageMeta } from '../lib/usePageMeta';

export const NotFound: React.FC = () => {
  usePageMeta('Page not found');
  return (
    <div className="pt-40 pb-24 px-6 text-center max-w-xl mx-auto space-y-8">
      <div className="w-20 h-20 bg-brand-green-light rounded-full flex items-center justify-center mx-auto text-brand-green-deep">
        <Leaf size={36} />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">This page has wandered off</h1>
        <p className="text-brand-ink/60">The link may be old or mistyped. Let's get you back to something good.</p>
      </div>
      <Link to="/shop" className="inline-flex items-center gap-3 px-10 py-4 bg-brand-green-deep text-white rounded-full text-sm font-bold uppercase tracking-widest hover:opacity-90">
        Browse the shop <ArrowRight size={18} />
      </Link>
    </div>
  );
};
