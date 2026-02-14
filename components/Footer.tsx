import React from 'react';

export const Footer: React.FC = React.memo(() => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-white/10 bg-slate-950/50 backdrop-blur">
      <div className="container mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-5 text-center text-xs text-slate-400 sm:text-sm">
        <p>&copy; {currentYear} Multi-Agent Projektový Orchestrátor. Všetky práva vyhradené.</p>
        <p className="text-slate-500">Built for modern product teams • Gemini API • React.</p>
      </div>
    </footer>
  );
});
