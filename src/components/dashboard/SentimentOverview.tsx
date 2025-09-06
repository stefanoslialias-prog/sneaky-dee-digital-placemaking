
import React from 'react';
import PartnerOverview from './PartnerOverview';

interface SentimentOverviewProps {
  selectedPartner?: string;
}

const SentimentOverview: React.FC<SentimentOverviewProps> = ({ selectedPartner }) => {
  return <PartnerOverview selectedPartner={selectedPartner} />;
};

export default SentimentOverview;
