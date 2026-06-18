/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { EMAIL, LOCATION, WHATSAPP_NUMBER, BLOG_POSTS } from '../constants';

export const About: React.FC = () => (
  <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-4xl mx-auto space-y-24">
    <section className="space-y-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-ink/40">Our Story</h2>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">A Return to Self.</h1>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="aspect-video rounded-[2rem] overflow-hidden bg-brand-grey"
      >
        <img src="/assets/general/about-bg.png" alt="About Taaibosch" className="w-full h-full object-cover" />
      </motion.div>

      <div className="space-y-8 text-lg md:text-xl text-brand-ink/60 leading-relaxed text-left max-w-2xl mx-auto">
        <p>
          Taaibosch Organics was built on a simple belief — that nature already provides what the body needs to restore, heal, and thrive.
        </p>
        <p>
          In a fast-moving world, we create space for balance. Our products are carefully selected to support modern lifestyles without compromising authenticity.
        </p>
        <p className="font-serif italic text-brand-ink">
          This is not just wellness. This is a return to self.
        </p>
      </div>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-24 border-t border-black/5">
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold tracking-tight">Our Philosophy</h3>
        <p className="text-brand-ink/60 leading-relaxed">
          We believe in affordable luxury wellness. Everyone deserves access to premium, natural healing without the premium price tag.
        </p>
      </div>
      <div className="space-y-6">
        <h3 className="text-2xl font-semibold tracking-tight">Our Quality</h3>
        <p className="text-brand-ink/60 leading-relaxed">
          Every product in our collection is sourced with the utmost care, ensuring that you receive the purest form of nature's bounty.
        </p>
      </div>
    </section>
  </div>
);

export const Contact: React.FC = () => (
  <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
      <div className="space-y-12">
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-ink/40">Contact Us</h2>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">Get in Touch</h1>
          <p className="text-brand-ink/60 leading-relaxed text-lg max-w-md">
            Have questions about our products or your order? We're here to help you on your wellness journey.
          </p>
        </div>

        <div className="space-y-8">
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-6 p-8 bg-brand-grey rounded-[2rem] hover:bg-brand-ink hover:text-white transition-all group"
          >
            <div className="p-4 bg-white rounded-2xl text-brand-ink group-hover:bg-white/10 group-hover:text-white transition-all">
              <MessageCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest">WhatsApp</h4>
              <p className="text-lg font-medium">{WHATSAPP_NUMBER}</p>
            </div>
          </a>

          <a 
            href={`mailto:${EMAIL}`}
            className="flex items-center space-x-6 p-8 bg-brand-grey rounded-[2rem] hover:bg-brand-ink hover:text-white transition-all group"
          >
            <div className="p-4 bg-white rounded-2xl text-brand-ink group-hover:bg-white/10 group-hover:text-white transition-all">
              <Mail size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest">Email</h4>
              <p className="text-lg font-medium">{EMAIL}</p>
            </div>
          </a>

          <div className="flex items-center space-x-6 p-8 bg-brand-grey rounded-[2rem]">
            <div className="p-4 bg-white rounded-2xl text-brand-ink">
              <MapPin size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-widest">Location</h4>
              <p className="text-lg font-medium">{LOCATION}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-beige rounded-[3rem] p-12 md:p-20 flex flex-col justify-center space-y-8">
        <h3 className="text-3xl font-semibold tracking-tight">Partner With Taaibosch</h3>
        <p className="text-brand-ink/60 leading-relaxed text-lg">
          Looking to resell our products? Join a growing community bringing natural wellness to more people.
        </p>
        <a 
          href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hello, I am interested in reselling Taaibosch Organics products.`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-between px-10 py-5 bg-brand-ink text-white rounded-full text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <span>Contact Us to Resell</span>
          <ArrowRight size={20} />
        </a>
      </div>
    </div>
  </div>
);

export const Blog: React.FC = () => (
  <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-7xl mx-auto">
    <div className="space-y-4 mb-16">
      <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-ink/40">Wellness Blog</h2>
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">Herbal Education</h1>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {BLOG_POSTS.map((post, idx) => (
        <Link key={post.id} to={`/blog/${post.id}`} className="block">
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="group cursor-pointer space-y-6"
          >
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-brand-grey">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="space-y-4 text-left">
              <div className="flex flex-wrap gap-2">
                {post.topics.map(topic => (
                  <span key={topic} className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">{topic}</span>
                ))}
              </div>
              <h3 className="text-xl font-semibold tracking-tight group-hover:text-brand-green-deep leading-tight transition-colors">{post.title}</h3>
              <p className="text-sm text-brand-ink/60 leading-relaxed line-clamp-2">{post.preview}</p>
              <span className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-brand-ink hover:opacity-80 transition-all">
                <span>Read Article</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </motion.article>
        </Link>
      ))}
    </div>
  </div>
);
