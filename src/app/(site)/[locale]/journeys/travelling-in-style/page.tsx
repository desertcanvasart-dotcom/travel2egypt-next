import { travellingInStyleContent } from '@/components/journeys/travellingInStyleContent';
import { journeyMetadata, journeyPage } from '@/components/journeys/journeyRoute';

import '@/styles/journeys.css';
import '@/styles/home-sales.css';

export const generateMetadata = journeyMetadata('style', travellingInStyleContent);
export default journeyPage('style', travellingInStyleContent);
