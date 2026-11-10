import { desertAndQuietContent } from '@/components/journeys/desertAndQuietContent';
import { journeyMetadata, journeyPage } from '@/components/journeys/journeyRoute';

import '@/styles/journeys.css';
import '@/styles/home-sales.css';

export const generateMetadata = journeyMetadata('desert', desertAndQuietContent);
export default journeyPage('desert', desertAndQuietContent);
