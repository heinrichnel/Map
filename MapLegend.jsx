import React from 'react';
import PropTypes from 'prop-types';
import { usePropertyMap } from '../../contexts/PropertyMapContext';

/**
 * Map Legend component to display color coding information
 */
const MapLegend = ({
  showEmirates = false,
  showAreas = false
}) => {
  const { emiratesColors } = usePropertyMap();

  if (!showEmirates && !showAreas) {
    return (
      <div className="absolute left-4 bottom-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-medium mb-2">Property Types</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-blue-500 inline-block mr-2"></span>
            <span>Residential</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block mr-2"></span>
            <span>Commercial</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-orange-500 inline-block mr-2"></span>
            <span>Industrial</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-lime-500 inline-block mr-2"></span>
            <span>Land</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-gray-500 inline-block mr-2"></span>
            <span>Sold/Rented</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-4 bottom-4 z-10 bg-white rounded-lg shadow-lg p-3">
      {/* Title */}
      <h4 className="text-sm font-medium mb-2">Legend</h4>

      {/* Emirates Colors */}
      {showEmirates && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Emirates</h5>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(emiratesColors).map(([emirate, color]) => (
              <div key={emirate} className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-sm inline-block mr-1" 
                  style={{ backgroundColor: color }}
                ></span>
                <span className="truncate">{emirate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas Colors */}
      {showAreas && (
        <div className="mb-2">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Areas (by Property Density)</h5>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-sm inline-block mr-1 bg-[#e5f5e0]"></span>
              <span>Low Density</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-sm inline-block mr-1 bg-[#74c476]"></span>
              <span>Medium Density</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-sm inline-block mr-1 bg-[#006d2c]"></span>
              <span>High Density</span>
            </div>    
          </div>    
        </div>    
      )}    

      {/* GIS Layers */}
      <div>    
        <h5 className="text-xs font-medium text-gray-700 mb-1">GIS Layers</h5>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block mr-1"></span>
            <span>Schools</span>
          </div>    
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block mr-1"></span>
            <span>Hospitals</span>
          </div>    
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#8b5cf6] inline-block mr-1"></span>
            <span>Metro Stations</span>
          </div>    
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#ec4899] inline-block mr-1"></span>
            <span>Bus Stops</span>
          </div>    
        </div>    
      </div>    
    </div>    
  );    
};    

MapLegend.propTypes = {
  showEmirates: PropTypes.bool,
  showAreas: PropTypes.bool
};    

export default MapLegend;
