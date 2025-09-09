import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import PropTypes from 'prop-types';

/**
 * MapController component to handle map view updates
 * Extracted to its own file to improve code organization and prevent re-renders
 */
const MapController = ({ bounds, center, zoom }) => {
  const map = useMap();
  
  // Update map view when center or zoom changes
  useEffect(() => {
    if (center && zoom && Array.isArray(center) && center.length === 2) {
      const [lat, lng] = center;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        map.setView(center, zoom);
      }
    }
  }, [map, center, zoom]);
  
  // Fit bounds when bounds change
  useEffect(() => {
    if (bounds && Array.isArray(bounds) && bounds.length === 2) {
      // Validate bounds structure
      const isValidBounds = bounds.every(coord => 
        Array.isArray(coord) && 
        coord.length === 2 && 
        typeof coord[0] === 'number' && 
        typeof coord[1] === 'number' &&
        !isNaN(coord[0]) && 
        !isNaN(coord[1])
      );    
      
      if (isValidBounds) {
        try {
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    }
  }, [map, bounds]);
  
  return null;
};    

MapController.propTypes = {
  bounds: PropTypes.array,
  center: PropTypes.array,
  zoom: PropTypes.number
};    

export default MapController;
