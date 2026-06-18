/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Clock, Calendar, Bookmark, FileText, ChevronRight, Share2, CornerDownRight, HelpCircle, Heart } from 'lucide-react';
import { WIKI_ARTICLES, EXPANDED_BLOG_POSTS } from '../data/wikiData';
import { PRODUCTS } from '../constants';

export const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const post = EXPANDED_BLOG_POSTS.find(p => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <div className="pt-40 pb-24 text-center max-w-md mx-auto space-y-6 px-6">
        <h2 className="text-2xl font-bold">Article Not Found</h2>
        <p className="text-brand-ink/60">The requested wellness blog could not be found under our journals.</p>
        <Link to="/blog" className="inline-flex items-center space-x-2 text-brand-green-deep hover:underline font-bold uppercase tracking-widest text-xs">
          <ArrowLeft size={16} />
          <span>Back to Blog</span>
        </Link>
      </div>
    );
  }

  // Intercept standard HTML Link clicks inside the blog body (for Wikipedia wiki links, products, etc.)
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/')) {
        e.preventDefault();
        navigate(href);
      }
    }
  };

  // Find related products mentioned in associated tags
  const relatedProducts = PRODUCTS.slice(0, 3); // Fallback: bestsellers

  return (
    <article className="pt-32 lg:pt-40 pb-24 px-6 max-w-4xl mx-auto space-y-12">
      {/* Back to Blog */}
      <Link 
        to="/blog" 
        className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-ink transition-all mt-4"
      >
        <ArrowLeft size={14} />
        <span>Taaibosch Journals</span>
      </Link>

      {/* Main Blog Header */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {post.topics.map(topic => (
            <span key={topic} className="text-[10px] uppercase tracking-[0.2em] font-bold bg-brand-green-moss/10 text-brand-green-deep px-3 py-1 rounded-full">{topic}</span>
          ))}
        </div>
        
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight text-brand-ink max-w-3xl">
          {post.title}
        </h1>

        <div className="flex items-center space-x-6 border-y border-black/5 py-4 text-xs font-medium text-brand-ink/50 uppercase tracking-widest">
          <div className="flex items-center space-x-2">
            <Calendar size={14} />
            <span>{post.date || 'June 18, 2026'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={14} />
            <span>5 Min Read</span>
          </div>
          <span className="hidden sm:inline border-l border-black/10 pl-6 text-brand-green-deep font-bold">
            By {post.author || 'Taaibosch Editorial'}
          </span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden bg-brand-grey shadow-md">
        <img 
          src={post.image} 
          alt={post.title} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200';
          }}
        />
      </div>

      {/* Editorial Content */}
      <div 
        onClick={handleContentClick}
        className="prose prose-stone max-w-none text-brand-ink/80 text-base md:text-lg leading-relaxed space-y-6 blog-body"
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />

      {/* Recommended Herbals */}
      <div className="border-t border-black/5 pt-16 mt-16 space-y-8">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-ink/40">Highly Associated Botanicals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-brand-grey/50 p-8 rounded-3xl border border-black/5">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Knowledge Discovery</h4>
            <p className="text-sm text-brand-ink/60 leading-relaxed">
              Our articles link directly to our extensive herbal Wiki monographs. Hover over linked terms inside the blog to understand their botanical taxonomy and scientific safety classifications.
            </p>
            <div className="flex space-x-4">
              <Link to="/shop" className="text-xs font-bold uppercase tracking-widest text-brand-green-deep hover:underline">Explore Apothecary</Link>
            </div>
          </div>
          <div className="space-y-4 border-t sm:border-t-0 sm:border-l border-black/5 sm:pl-8 pt-4 sm:pt-0 flex flex-col justify-center">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">Scientific Notice</div>
            <p className="text-xs text-brand-ink/50 leading-relaxed">
              Herbal supplement statements are shared strictly for educational enlightenment and have not been evaluated by SAHPRA. Not intended to diagnose or substitute guidance from registered general medical practitioners.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

export const WikiPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const article = slug ? WIKI_ARTICLES[slug] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article) {
    return (
      <div className="pt-40 pb-24 text-center max-w-md mx-auto space-y-6 px-6">
        <h2 className="text-2xl font-bold">Monograph Not Found</h2>
        <p className="text-brand-ink/60">The requested botanical term is not currently cataloged inside our Wiki database.</p>
        <Link to="/blog" className="inline-flex items-center space-x-2 text-brand-green-deep hover:underline font-bold uppercase tracking-widest text-xs">
          <ArrowLeft size={16} />
          <span>Back to Journals</span>
        </Link>
      </div>
    );
  }

  // Find products associated with this wiki article
  const associatedProducts = PRODUCTS.filter(p => article.associatedProducts.includes(p.id));

  return (
    <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-7xl mx-auto space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-brand-ink/40">
        <Link to="/blog" className="hover:text-brand-ink">Journals</Link>
        <ChevronRight size={12} />
        <span className="text-brand-ink/20">Wiki Database</span>
        <ChevronRight size={12} />
        <span className="text-brand-ink">{article.name}</span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left 2 Columns: Wikipedia Article Structure */}
        <div className="lg:col-span-2 space-y-12">
          {/* Article Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 text-[10px] uppercase font-bold tracking-[0.2em] bg-brand-green-moss text-white px-3 py-1 rounded">
              <BookOpen size={10} />
              <span>Taaibosch Botanical Wiki</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-brand-ink">{article.name}</h1>
            <p className="text-brand-ink/40 font-mono text-sm uppercase italic">Taxon ID: {article.botanicalName}</p>
          </div>

          <div className="bg-brand-grey p-6 rounded-2xl border border-black/5 text-sm leading-relaxed text-brand-ink/70">
            <span className="font-bold text-brand-ink uppercase">Introductory Abstract:</span> {article.introduction}
          </div>

          {/* Table of Contents - Wiki Style */}
          <div className="p-6 border border-black/5 rounded-2xl bg-white max-w-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-widest text-brand-ink/40 flex items-center space-x-2">
              <FileText size={12} />
              <span>Table of Contents</span>
            </h4>
            <ul className="text-xs space-y-2 font-medium text-brand-ink/60">
              <li className="flex items-center space-x-2 hover:text-brand-green-deep"><ChevronRight size={10} /> <a href="#traditional-medicinal-uses">1. Classical Traditional Use</a></li>
              <li className="flex items-center space-x-2 hover:text-brand-green-deep"><ChevronRight size={10} /> <a href="#modern-scientific-insights">2. Modern Scientific Insights & Phytosecretions</a></li>
              <li className="flex items-center space-x-2 hover:text-brand-green-deep"><ChevronRight size={10} /> <a href="#therapeutic-aesthetics">3. Targeted Body & Skin Restoration</a></li>
              <li className="flex items-center space-x-2 hover:text-brand-green-deep"><ChevronRight size={10} /> <a href="#synergy-formulations">4. Chemical Synergy & Complementary Herbs</a></li>
            </ul>
          </div>

          {/* Section 1: Traditional Uses */}
          <section id="traditional-medicinal-uses" className="space-y-4 border-t border-black/5 pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-brand-ink flex items-center space-x-3">
              <span className="font-mono text-base text-brand-green-deep">1.</span>
              <span>Classical Traditional Use</span>
            </h2>
            <p className="text-base text-brand-ink/70 leading-relaxed whitespace-pre-line">
              {article.traditionalUse}
            </p>
          </section>

          {/* Section 2: Scientific Insights */}
          <section id="modern-scientific-insights" className="space-y-4 border-t border-black/5 pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-brand-ink flex items-center space-x-3">
              <span className="font-mono text-base text-brand-green-deep">2.</span>
              <span>Modern Scientific Insights & Phytosecretions</span>
            </h2>
            <p className="text-base text-brand-ink/70 leading-relaxed whitespace-pre-line">
              {article.scientificInsights}
            </p>
          </section>

          {/* Section 3: Therapeutic Aesthetics */}
          <section id="therapeutic-aesthetics" className="space-y-4 border-t border-black/5 pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-brand-ink flex items-center space-x-3">
              <span className="font-mono text-base text-brand-green-deep">3.</span>
              <span>Targeted Body & Skin Restoration</span>
            </h2>
            <p className="text-base text-brand-ink/70 leading-relaxed whitespace-pre-line">
              {article.therapeuticAesthetics}
            </p>
          </section>

          {/* Section 4: Synergy Formulations */}
          <section id="synergy-formulations" className="space-y-4 border-t border-black/5 pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-brand-ink flex items-center space-x-3">
              <span className="font-mono text-base text-brand-green-deep">4.</span>
              <span>Chemical Synergy & Complementary Herbs</span>
            </h2>
            <p className="text-base text-brand-ink/70 leading-relaxed whitespace-pre-line">
              {article.synergy}
            </p>
          </section>
        </div>

        {/* Right 1 Column: Wikipedia-Style Taxonomy Box & Products */}
        <div className="space-y-8">
          {/* Infobox */}
          <div className="bg-brand-grey border border-black/5 rounded-[2rem] p-8 space-y-6 text-sm">
            <div className="space-y-2 text-center pb-4 border-b border-black/10">
              <h3 className="font-bold text-lg leading-tight text-brand-ink">{article.name}</h3>
              <p className="text-xs text-brand-ink/40 font-mono italic">Botanical Profile Sheet</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between border-b border-black/5 py-1">
                <span className="text-brand-ink/40 font-medium">Botanical Name:</span>
                <span className="font-mono text-xs italic font-bold text-right pl-4">{article.botanicalName}</span>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1">
                <span className="text-brand-ink/40 font-medium">Family:</span>
                <span className="font-semibold text-right">{article.family}</span>
              </div>
              <div className="flex justify-between border-b border-black/5 py-1">
                <span className="text-brand-ink/40 font-medium">Native Range:</span>
                <span className="font-medium text-xs text-right pl-4">{article.nativeRegion}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-brand-ink/40 font-medium text-xs uppercase tracking-widest block">Primary Constituents</span>
              <div className="flex flex-wrap gap-1.5">
                {article.constituents.map(chem => (
                  <span key={chem} className="text-[10px] font-bold bg-white px-2.5 py-1 rounded border border-black/5">{chem}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-brand-ink/40 font-medium text-xs uppercase tracking-widest block">Primary Therapeutic Actions</span>
              <ul className="space-y-1 text-xs font-semibold text-brand-ink/70 list-disc pl-4">
                {article.primaryUses.map(use => (
                  <li key={use}>{use}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Associated Product integration */}
          {associatedProducts.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-brand-ink/40">Associated Preparations</h4>
              <div className="space-y-3">
                {associatedProducts.map(p => (
                  <Link 
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="flex items-center space-x-4 p-4 bg-white hover:bg-brand-grey border border-black/5 rounded-2xl transition-all group"
                  >
                    <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl border border-black/5" />
                    <div className="flex-grow">
                      <h5 className="font-medium text-sm group-hover:underline leading-snug">{p.name}</h5>
                      <p className="text-[10px] text-brand-ink/40 uppercase tracking-widest font-bold mt-0.5">{p.category}</p>
                      <p className="text-xs font-bold mt-0.5 text-brand-green-deep">R{p.price}</p>
                    </div>
                    <ChevronRight size={16} className="text-brand-ink/20 group-hover:text-brand-ink transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
