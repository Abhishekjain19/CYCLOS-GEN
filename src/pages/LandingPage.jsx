import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import WhatWeDoSection from '../components/WhatWeDoSection';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />
      <main>
        <HeroSection />
        <WhatWeDoSection />
      </main>
      <Footer />
    </motion.div>
  );
}
