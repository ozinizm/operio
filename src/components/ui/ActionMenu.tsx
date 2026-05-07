import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  iconSize?: number;
}

const MENU_WIDTH = 192; // 12rem / w-48
const MENU_ITEM_H = 40;
const MENU_PADDING = 8;

/**
 * Reusable three-dot action dropdown menu.
 * Renders via React portal so it is never clipped by overflow:hidden parents.
 * Positioning: smart — opens below the button if there is enough space,
 * otherwise opens above. Aligns to right edge of button.
 */
export function ActionMenu({ items, iconSize = 4 }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
  const btnRef = useRef<HTMLButtonElement>(null);

  const calcPosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuHeight = items.length * MENU_ITEM_H + MENU_PADDING * 2;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;

    const left = Math.min(
      rect.right - MENU_WIDTH,
      window.innerWidth - MENU_WIDTH - 8
    );

    setCoords({
      top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: Math.max(8, left),
      openUp,
    });
  }, [items.length]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    calcPosition();
    setOpen(prev => !prev);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const menu = open ? (
    <div
      role="menu"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: MENU_WIDTH,
        zIndex: 99999,
      }}
      className="bg-surface border border-border rounded-2xl shadow-modal py-1 animate-in zoom-in-95 duration-100"
      onMouseDown={e => e.stopPropagation()}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          role="menuitem"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            item.onClick();
          }}
          disabled={item.disabled}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            item.variant === 'danger'
              ? 'text-red-600 hover:bg-red-50'
              : 'text-text-high hover:bg-surface-dim'
          }`}
        >
          {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-2 hover:bg-surface-dim rounded-lg text-text-body hover:text-text-high transition-colors flex-shrink-0"
        aria-label="İşlemler"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className={`w-${iconSize} h-${iconSize}`} />
      </button>

      {open && createPortal(menu, document.body)}
    </>
  );
}
