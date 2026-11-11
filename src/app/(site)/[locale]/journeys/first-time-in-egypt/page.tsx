import { firstTimeContent } from '@/components/journeys/firstTimeContent';
import { journeyMetadata, journeyPage } from '@/components/journeys/journeyRoute';

import '@/styles/journeys.css';
import '@/styles/home-sales.css';

export const generateMetadata = journeyMetadata('first-time', firstTimeContent);
export default journeyPage('first-time', firstTimeContent);
