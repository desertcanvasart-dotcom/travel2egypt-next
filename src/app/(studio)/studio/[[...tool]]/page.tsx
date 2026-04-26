/**
 * Sanity Studio is mounted at /studio. This is the only client-rendered
 * portion of the site. Editors log in here to manage content.
 *
 * The Studio UI is a single-page app served as a catch-all route, so the
 * Sanity router handles internal navigation.
 */

'use client';

import { NextStudio } from 'next-sanity/studio';
import config from '../../../../../sanity.config';

export const dynamic = 'force-static';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
