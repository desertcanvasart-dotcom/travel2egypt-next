'use client';

import { usePathname } from '@/i18n/navigation';
import { WHATSAPP_LINK } from '@/lib/concierge/constants';

import { LeadButton } from './leads/LeadProvider';

/**
 * Sticky two-button bar on phones (owner spec, 2026-11-08): WhatsApp and Get
 * itinerary. English pages only; hidden on the concierge page, where the chat
 * itself is the call to action. The WhatsApp click is recorded by the global
 * whatsapp_click listener (Analytics.tsx).
 */
export function MobileLeadBar() {
  const pathname = usePathname();
  if (pathname.startsWith('/plan-your-tour')) return null;
  return (
    <div className="t2e-leadbar" role="region" aria-label="Contact us">
      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="t2e-leadbar-wa">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
        </svg>
        WhatsApp
      </a>
      <LeadButton source="mobile_bar" className="t2e-leadbar-cta">
        Get itinerary
      </LeadButton>
    </div>
  );
}
