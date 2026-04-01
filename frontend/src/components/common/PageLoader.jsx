import React from 'react';
import { motion } from 'framer-motion';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-ink flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 bg-accent-500 rounded-2xl shadow-accent-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <motion.div
            className="absolute -inset-1 rounded-2xl border-2 border-accent-400 opacity-60"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-1 h-1 rounded-full bg-accent-400"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
