
import React from 'react';
import PartnerLocations from './PartnerLocations';

interface LocationMapProps {
  selectedPartner?: string;
  onPartnerSelect?: (partnerId: string | undefined) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({ selectedPartner, onPartnerSelect }) => {
  return <PartnerLocations selectedPartner={selectedPartner} onPartnerSelect={onPartnerSelect} />;
};

export default LocationMap;
