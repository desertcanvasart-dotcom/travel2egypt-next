'use client';

import type { ReactNode } from 'react';

import { track } from '@/lib/analytics';

/** WhatsApp link that records `contact {method: whatsapp, location}`. */
export function TrackedWhatsApp({
  href,
  aria,
  location,
  className,
  children,
}: {
  href: string;
  aria?: string;
  location: 'header' | 'mobile_menu' | 'footer_band' | 'footer';
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      onClick={() => track('contact', { method: 'whatsapp', location })}
    >
      {children}
    </a>
  );
}
