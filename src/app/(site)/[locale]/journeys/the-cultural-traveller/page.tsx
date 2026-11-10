import { culturalTravellerContent } from '@/components/journeys/culturalTravellerContent';
import { journeyMetadata, journeyPage } from '@/components/journeys/journeyRoute';

import '@/styles/journeys.css';
import '@/styles/home-sales.css';

export const generateMetadata = journeyMetadata('cultural', culturalTravellerContent);
export default journeyPage('cultural', culturalTravellerContent);
