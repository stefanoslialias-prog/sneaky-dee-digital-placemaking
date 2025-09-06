
import React from 'react';
import PartnerLocations from './PartnerLocations';

interface LocationMapProps {
  selectedPartner?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ selectedPartner }) => {
  return <PartnerLocations selectedPartner={selectedPartner} />;
};

export default LocationMap;
