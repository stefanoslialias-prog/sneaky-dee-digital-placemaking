import React from 'react';
import PartnerVisitors from './PartnerVisitors';

interface VisitorTrackingProps {
  selectedPartner?: string;
}

const VisitorTracking: React.FC<VisitorTrackingProps> = ({ selectedPartner }) => {
  return <PartnerVisitors selectedPartner={selectedPartner} />;
};

export default VisitorTracking;
