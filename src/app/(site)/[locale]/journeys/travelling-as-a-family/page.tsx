import { familyContent } from '@/components/journeys/familyContent';
import { journeyMetadata, journeyPage } from '@/components/journeys/journeyRoute';

import '@/styles/journeys.css';
import '@/styles/home-sales.css';

export const generateMetadata = journeyMetadata('family', familyContent);
export default journeyPage('family', familyContent);
