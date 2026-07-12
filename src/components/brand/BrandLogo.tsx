import React from 'react';

interface BrandLogoProps {
  variant?: 'default' | 'white' | 'mark' | 'markWhite';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  isPlatform?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'default',
  size = 'md',
  showText = true,
  className = '',
  isPlatform = false
}) => {
  const isWhite = variant.includes('white');
  const color = isWhite ? '#FFFFFF' : '#4F46E5';
  
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-16'
  };

  const sizeClass = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Inline SVG Logo - Modular "O" Symbol */}
      <svg 
        viewBox="0 0 40 40" 
        className={`${sizeClass} w-auto transition-all duration-300`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M20 4L34 12V28L20 36L6 28V12L20 4Z" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinejoin="round" 
        />
        <path 
          d="M20 12V28M13 16L27 24M13 24L27 16" 
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <circle cx="20" cy="20" r="3.5" fill={color} />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-jakarta font-black leading-none tracking-tight ${size === 'xl' ? 'text-4xl' : size === 'lg' ? 'text-2xl' : 'text-xl'} ${isWhite ? 'text-white' : 'text-slate-900'}`}>
            Tavelya
          </span>
          {isPlatform && (
            <span className={`font-jakarta font-bold text-[10px] uppercase tracking-[0.3em] mt-1 opacity-60 ${isWhite ? 'text-white' : 'text-indigo-600'}`}>
              Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
};
