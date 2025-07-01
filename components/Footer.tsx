
import React from 'react';

export const Footer: React.FC = React.memo(() => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-900/50 border-t border-slate-700/50 mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-slate-400 text-xs sm:text-sm">
        <p>&copy; {currentYear} Multi-Agent Projektový Orchestrátor. Všetky práva vyhradené.</p>
        <p className="mt-1">Powered by Gemini API & React.</p>
      </div>
    </footer>
  );
});
