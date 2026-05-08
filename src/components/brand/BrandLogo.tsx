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
  const getLogoSrc = () => {
    switch (variant) {
      case 'white':
        return '/brand/operio-logo-white.svg';
      case 'mark':
        return '/brand/operio-mark.svg';
      case 'markWhite':
        return '/brand/operio-mark-white.svg';
      case 'default':
      default:
        return '/brand/operio-logo.svg';
    }
  };

  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-16'
  };

  const logoSrc = getLogoSrc();
  const isMarkOnly = variant.startsWith('mark') || !showText;

  // If showText is true but we are using the full logo SVG, 
  // it already has the text. If showText is false, we should use the mark SVG.
  // However, the variant 'mark' already implies no text.
  
  const finalSrc = isMarkOnly ? (variant.includes('White') ? '/brand/operio-mark-white.svg' : '/brand/operio-mark.svg') : logoSrc;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={finalSrc} 
        alt="Operio Logo" 
        className={`${sizes[size]} w-auto object-contain transition-all duration-300`}
      />
      {showText && isPlatform && (
        <span className={`font-jakarta font-bold text-sm tracking-widest uppercase opacity-70 ${variant.includes('white') ? 'text-white' : 'text-text-medium'}`}>
          Platform
        </span>
      )}
    </div>
  );
};
