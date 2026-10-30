/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { About, Contact, Blog } from './pages/OtherPages';
import { BlogPostDetail, WikiPage } from './pages/BlogAndWiki';
import { PrivacyPolicy, DeliveryAndShipping, OrderingProcess, ReturnsAndRefunds, TermsOfSale } from './pages/LegalAndInfo';
import { CheckoutSuccess, CheckoutNotCompleted } from './pages/CheckoutResult';
import { NotFound } from './pages/NotFound';
import { CartToast } from './components/CartToast';
import { CartProvider } from './CartContext';
import { CatalogProvider, useCatalog } from './CatalogContext';

// The dashboard is loaded only when someone visits /admin, so shoppers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'));
import { motion, AnimatePresence } from 'motion/react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <CatalogProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <Root />
        </Router>
      </CartProvider>
    </CatalogProvider>
  );
}

function Root() {
  const { pathname } = useLocation();
  useCatalog(); // re-render the whole shop when dashboard data arrives

  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-brand-green-light" />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
        <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pb-24 md:pb-0">
        <Routes>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/shop" element={<PageWrapper><Shop /></PageWrapper>} />
          <Route path="/product/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
          <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
          <Route path="/blog" element={<PageWrapper><Blog /></PageWrapper>} />
          <Route path="/blog/:id" element={<PageWrapper><BlogPostDetail /></PageWrapper>} />
          <Route path="/wiki/:slug" element={<PageWrapper><WikiPage /></PageWrapper>} />
          <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
          <Route path="/delivery-and-shipping" element={<PageWrapper><DeliveryAndShipping /></PageWrapper>} />
          <Route path="/ordering-process" element={<PageWrapper><OrderingProcess /></PageWrapper>} />
          <Route path="/returns" element={<PageWrapper><ReturnsAndRefunds /></PageWrapper>} />
          <Route path="/terms" element={<PageWrapper><TermsOfSale /></PageWrapper>} />
          <Route path="/checkout/success" element={<PageWrapper><CheckoutSuccess /></PageWrapper>} />
          <Route path="/checkout/cancelled" element={<PageWrapper><CheckoutNotCompleted reason="cancelled" /></PageWrapper>} />
          <Route path="/checkout/failed" element={<PageWrapper><CheckoutNotCompleted reason="failed" /></PageWrapper>} />
          <Route path="/wishlist" element={<PageWrapper><Shop /></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
      <CartToast />
    </div>
  );
}
