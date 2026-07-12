import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`min-w-0 max-w-full bg-white border border-border rounded-3xl md:rounded-[2rem] shadow-soft overflow-hidden transition-all duration-300 ${className}`}>
      {!noPadding ? <div className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</div> : children}
    </div>
  );
}

export function CardHeader({ title, action, className = '' }: { title: string, action?: React.ReactNode, className?: string }) {
  return (
    <div className={`min-w-0 flex items-center justify-between p-4 sm:p-6 lg:p-8 pb-0 ${className}`}>
      <h3 className="min-w-0 font-jakarta font-bold text-lg sm:text-xl text-text-high tracking-tight break-words">{title}</h3>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
