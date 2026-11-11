import { comingBackContent } from '@/components/journeys/comingBackContent';
import { journeyMetadata, journeyPage } from '@/components/journeys/journeyRoute';

import '@/styles/journeys.css';
import '@/styles/home-sales.css';

export const generateMetadata = journeyMetadata('coming-back', comingBackContent);
export default journeyPage('coming-back', comingBackContent);
