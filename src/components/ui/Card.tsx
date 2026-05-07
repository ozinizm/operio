import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`bg-white border border-border rounded-[2rem] shadow-soft overflow-hidden transition-all duration-300 ${className}`}>
      {!noPadding ? <div className="p-6 lg:p-8">{children}</div> : children}
    </div>
  );
}

export function CardHeader({ title, action, className = '' }: { title: string, action?: React.ReactNode, className?: string }) {
  return (
    <div className={`flex items-center justify-between p-6 lg:p-8 pb-0 ${className}`}>
      <h3 className="font-jakarta font-bold text-xl text-text-high tracking-tight">{title}</h3>
      {action && <div className="flex items-center">{action}</div>}
    </div>
  );
}
