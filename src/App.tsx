/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronsDown, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import module1Img from './assets/module1.png';
import heroImg from './assets/hero.png';
import module2Img from './assets/module2.png';
import eyeVid from './assets/eye.mp4';

function Navbar() {
  const [scrollState, setScrollState] = useState('top');

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const heroHeight = window.innerHeight;
      
      if (y < 100) {
        setScrollState('top');
      } else if (y >= 100 && y < heroHeight - 100) {
        setScrollState('hero');
      } else {
        setScrollState('past');
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  let navClasses = 'opacity-0 -translate-y-4 pointer-events-none';
  if (scrollState === 'hero') {
    navClasses = 'opacity-100 translate-y-0';
  } else if (scrollState === 'past') {
    navClasses = 'opacity-0 translate-y-4 pointer-events-none';
  }

  return (
    <nav 
      className={`fixed top-0 left-0 z-50 p-8 md:p-12 transition-all duration-[2000ms] ease-out ${navClasses}`}
    >
      <div className="font-headline font-light tracking-[0.2em] uppercase text-xs md:text-sm lg:text-base text-on-background opacity-80">
        Ivelin Kozarev
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-surface">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img 
          alt="Intense close-up of a human face with deep expression, high contrast grainy film texture, dramatic teal and orange light leaks." 
          className="w-full h-full object-cover grayscale opacity-60 animate-slow-drift" 
          src={module1Img}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-secondary/10"></div>
        <div className="grainy-overlay"></div>
      </div>
      <div className="relative z-10 text-center px-6 mix-blend-screen">
        <h1 className="font-headline text-[5rem] md:text-[8rem] font-black tracking-tighter text-[#D9CBB3] leading-none mb-4">
          <span className="inline-block animate-cinematic-reveal">The</span>{' '}
          <span className="inline-block animate-cinematic-reveal animation-delay-400">Craft</span>
        </h1>
        <p className="font-body text-xl md:text-2xl font-light tracking-[0.2em] text-[#D9CBB3] uppercase opacity-60 animate-cinematic-reveal animation-delay-800">
          The Human Resonance of AI
        </p>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-slow-pulse">
        <ChevronsDown className="w-8 h-8 stroke-[1] text-[#D9CBB3] opacity-50" />
      </div>
    </section>
  );
}

function ModuleOne() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative min-h-screen bg-background py-32 px-12 md:px-24">
      <div className="max-w-[1600px] mx-auto asymmetric-grid gap-24 items-center">
        <div className="relative group overflow-hidden">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full"></div>
          <div className="relative overflow-hidden aspect-[3/4] bg-black">
            {/* Base Grayscale Image */}
            <img 
              alt="Cinematic grainy portrait of a woman talking into a classic broadcast microphone." 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" 
              src={heroImg}
              referrerPolicy="no-referrer"
            />
            
            {/* Main Color Reveal Image - Uniform Opacity Fade */}
            <motion.img 
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1.05 : 1
              }}
              transition={{ 
                opacity: { duration: isHovered ? 8 : 6, ease: [0.1, 0.9, 0.2, 1] },
                scale: { duration: isHovered ? 12 : 10, ease: "easeOut" }
              }}
              alt="Cinematic grainy portrait of a woman talking into a classic broadcast microphone, glowing electric teal highlights on her skin." 
              className="absolute inset-0 w-full h-full object-cover" 
              src={heroImg}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-secondary/10 mix-blend-overlay pointer-events-none"></div>
            <div className="grainy-overlay pointer-events-none"></div>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-label text-secondary text-[10px] tracking-[0.3em] uppercase mb-8 block opacity-80">Module 01</span>
          <h2 className="font-headline text-5xl md:text-7xl font-light leading-tight text-on-surface mb-8">
            Skylar:<br/>The Art of <span className="italic text-primary text-glow-warm">Conversation</span>
          </h2>
          <p className="font-body text-lg leading-relaxed text-on-surface-variant max-w-md mb-16 font-light">
            The AI partner for sales coaches. We elevate the art of conversation through immersive AI role-plays and deep analysis, refining the bridge between practice and mastery. Every simulation is designed to forge real-world resonance.
          </p>
          <div>
            <a 
              href="https://app.getskylar.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group inline-flex items-center gap-6 font-label text-xs tracking-[0.2em] uppercase text-on-surface border-b-[0.5px] border-outline-variant pb-3 hover:text-primary hover:border-primary transition-all duration-700"
            >
              <motion.div
                animate={{ x: isHovered ? -20 : 0 }}
                transition={{ duration: 3, ease: [0.1, 0.9, 0.2, 1] }}
              >
                <ArrowLeft className="w-4 h-4 stroke-[1]" />
              </motion.div>
              <motion.span
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ duration: 3, ease: [0.1, 0.9, 0.2, 1] }}
              >
                Explore Resonance
              </motion.span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModuleTwo() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative min-h-screen bg-surface py-32 px-12 md:px-24">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
        <div className="order-2 md:order-1 flex flex-col justify-center md:items-end md:text-right">
          <span className="font-label text-secondary text-[10px] tracking-[0.3em] uppercase mb-8 block opacity-80">Module 02</span>
          <h2 className="font-headline text-5xl md:text-7xl font-light leading-tight text-on-surface mb-8">
            Describy:<br/>The Art of <span className="italic text-secondary text-glow-cool">Listening</span>
          </h2>
          <p className="font-body text-lg leading-relaxed text-on-surface-variant max-w-md mb-16 font-light">
            To hear what is unsaid. We conduct deep user interviews through AI, mapping the micro-textures of human intent to uncover hidden truths. The silent observation that transforms raw feedback into profound understanding.
          </p>
          <div>
            <a 
              href="https://www.getdescriby.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group inline-flex items-center gap-6 font-label text-xs tracking-[0.2em] uppercase text-on-surface border-b-[0.5px] border-outline-variant pb-3 hover:text-secondary hover:border-secondary transition-all duration-700"
            >
              <motion.span
                animate={{ x: isHovered ? -4 : 0 }}
                transition={{ duration: 3, ease: [0.1, 0.9, 0.2, 1] }}
              >
                View Observations
              </motion.span>
              <motion.div
                animate={{ x: isHovered ? 20 : 0 }}
                transition={{ duration: 3, ease: [0.1, 0.9, 0.2, 1] }}
              >
                <ArrowRight className="w-4 h-4 stroke-[1]" />
              </motion.div>
            </a>
          </div>
        </div>
        <div className="relative group order-1 md:order-2 overflow-hidden">
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
          <div className="relative overflow-hidden aspect-[4/5] bg-black">
            {/* Base Grayscale Image */}
            <img 
              alt="Close-up of human hands holding a worn leather journal." 
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" 
              src={module2Img}
              referrerPolicy="no-referrer"
            />

            {/* Main Color Reveal Image - Uniform Opacity Fade */}
            <motion.img 
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1.05 : 1
              }}
              transition={{ 
                opacity: { duration: isHovered ? 8 : 6, ease: [0.1, 0.9, 0.2, 1] },
                scale: { duration: isHovered ? 12 : 10, ease: "easeOut" }
              }}
              alt="Close-up of human hands holding a worn leather journal, sunlight through a window creating sharp shadows and grainy sunset orange light." 
              className="absolute inset-0 w-full h-full object-cover" 
              src={module2Img}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-primary/5 mix-blend-overlay pointer-events-none"></div>
            <div className="grainy-overlay pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Closer() {
  return (
    <section className="relative h-[614px] bg-background flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-60">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover grayscale animate-slow-drift" 
          src={eyeVid}
        />
      </div>
      {/* Top edge fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-transparent"></div>
      {/* Bottom edge fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
      <div className="grainy-overlay"></div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full min-h-[400px] flex items-end bg-background">
      <div className="flex flex-col justify-between items-start px-12 pb-16 w-full">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-24">
          <div className="font-headline font-black text-6xl md:text-8xl text-on-background opacity-10 leading-none select-none">
            THE CRAFT
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-8">
              <a className="font-headline text-sm tracking-widest uppercase text-on-background opacity-60 hover:text-secondary hover:tracking-[0.2em] transition-all duration-500" href="#">Instagram</a>
              <a className="font-headline text-sm tracking-widest uppercase text-on-background opacity-60 hover:text-secondary hover:tracking-[0.2em] transition-all duration-500" href="#">Vimeo</a>
              <a className="font-headline text-sm tracking-widest uppercase text-on-background opacity-60 hover:text-secondary hover:tracking-[0.2em] transition-all duration-500" href="#">Journal</a>
            </div>
          </div>
        </div>
        <div className="w-full flex justify-between items-center border-t-[0.5px] border-outline-variant/50 pt-8">
          <p className="font-headline text-[10px] tracking-[0.2em] uppercase text-on-surface/40">
            © 2026 Ivelin Kozarev. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-slow-pulse"></span>
            <span className="font-label text-[10px] tracking-[0.3em] uppercase opacity-30">System Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative">
        <Hero />
        <ModuleOne />
        <ModuleTwo />
        <Closer />
      </main>
      <Footer />
    </div>
  );
}
