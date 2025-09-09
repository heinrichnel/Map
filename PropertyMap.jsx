import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { usePropertyMap } from '../../contexts/PropertyMapContext';
import ErrorBoundary from '../common/ErrorBoundary';
import { formatPrice, formatLocation } from '../../utils/DataFormatter';
import GISApiService from '../../services/GISApiService';
import MapController from './MapController';
import GISSettingsPanel from './GISSettingsPanel';
import MapLegend from './MapLegend';
import MapEditorComponent from './MapEditorComponent';
import '../../styles/mapMarkers.css';

// Define default icon with absolute paths
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * PropertyMap component that displays an interactive map with property markers and GIS data overlays
 */
const PropertyMap = ({ onSelectProperty, enabledGisLayers = ['parcels'] }) => {
  const mapRef = useRef(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapCenter, setMapCenter] = useState([25.276987, 55.296249]); // Default to Dubai
  const [mapZoom, setMapZoom] = useState(10);
  const [gisService] = useState(() => new GISApiService());
  const [gisLayers, setGisLayers] = useState(null);
  const [gisLoading, setGisLoading] = useState(false);
  const [gisError, setGisError] = useState(null);
  const [gisInitialized, setGisInitialized] = useState(false);
  const [propertyGisData, setPropertyGisData] = useState(null);
  
  // New state variables for emirates and areas
  const [emiratesBoundaries, setEmiratesBoundaries] = useState(null);
  const [areasBoundaries, setAreasBoundaries] = useState(null);
  const [showEmirates, setShowEmirates] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [currentEmirate, setCurrentEmirate] = useState('Dubai'); // Default to Dubai
  
  // Map editor state
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [editorEnabled, setEditorEnabled] = useState(false);
  
  const {
    searchResults,
    propertyMarkers,
    propertyDetails,
    isLoading,
    error,
    selectProperty,
    loadPropertyMarkers
  } = usePropertyMap();
  
  // Initialize GIS service
  useEffect(() => {
    const initializeGIS = async () => {
      try {
        await gisService.initialize();
        setGisInitialized(true);
      } catch (err) {
        console.error('Failed to initialize GIS service:', err);
        setGisError('GIS API initialization failed. Some features may be limited.');
      }
    };
    
    initializeGIS();
  }, [gisService]);
  
  // Fetch emirates boundaries
  useEffect(() => {
    if (!gisInitialized || !showEmirates) return;
    
    const fetchEmiratesBoundaries = async () => {
      try {
        const data = await gisService.getEmiratesBoundaries();
        setEmiratesBoundaries(data);
      } catch (error) {
        console.error('Error fetching emirates boundaries:', error);
        setGisError('Failed to load emirates boundaries');
      }
    };
    
    fetchEmiratesBoundaries();
  }, [gisService, gisInitialized, showEmirates]);

  // Fetch areas boundaries
  useEffect(() => {
    if (!gisInitialized || !showAreas) return;
    
    const fetchAreasBoundaries = async () => {
      try {
        const data = await gisService.getAreasBoundaries(currentEmirate);
        setAreasBoundaries(data);
      } catch (error) {
        console.error(`Error fetching area boundaries for ${currentEmirate}:`, error);
        setGisError(`Failed to load area boundaries for ${currentEmirate}`);
      }
    };
    
    fetchAreasBoundaries();
  }, [gisService, gisInitialized, showAreas, currentEmirate]);
  
  // Load property markers when map bounds change
  useEffect(() => {
    if (mapBounds && loadPropertyMarkers) {
      const bounds = {
        south: mapBounds[0][0],
        west: mapBounds[0][1],
        north: mapBounds[1][0],
        east: mapBounds[1][1]
      };
      
      const timer = setTimeout(() => {
        loadPropertyMarkers({
          bounds: JSON.stringify(bounds),
          limit: 100
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [mapBounds, loadPropertyMarkers]);
  
  // Update map bounds when property markers change
  useEffect(() => {
    if (!propertyMarkers?.properties || !Array.isArray(propertyMarkers.properties) || 
        propertyMarkers.properties.length === 0 || mapBounds !== null) {
      return;
    }
    
    // Calculate bounds for all properties
    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;
    let validLocationsCount = 0;
    
    propertyMarkers.properties.forEach(property => {
      const lat = property?.location?.lat;
      const lng = property?.location?.lng;
      
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        north = Math.max(north, lat);
        south = Math.min(south, lat);
        east = Math.max(east, lng);
        west = Math.min(west, lng);
        validLocationsCount++;
      }
    });
    
    if (validLocationsCount > 0) {
      setMapBounds([[south, west], [north, east]]);
    }
  }, [propertyMarkers, mapBounds]);
  
  // Fetch GIS data when map bounds change
  useEffect(() => {
    if (!mapBounds || !enabledGisLayers || enabledGisLayers.length === 0 || !gisInitialized) return;
    
    const fetchGisData = async () => {
      try {
        setGisLoading(true);
        setGisError(null);
        
        const bounds = {
          south: mapBounds[0][0],
          west: mapBounds[0][1],
          north: mapBounds[1][0],
          east: mapBounds[1][1]
        };
        
        const timer = setTimeout(async () => {
          const layers = await gisService.getLayers(bounds, enabledGisLayers);
          setGisLayers(layers);
          setGisLoading(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error fetching GIS data:', error);
        setGisError(error.message || 'Failed to load GIS data');
        setGisLoading(false);
      }
    };
    
    fetchGisData();
  }, [mapBounds, gisService, enabledGisLayers, gisInitialized]);
  
  // Fetch property-specific GIS data
  useEffect(() => {
    if (!propertyDetails?.id || !gisInitialized) return;
    
    const fetchPropertyGisData = async () => {
      try {
        const gisData = await gisService.getPropertyGisData(propertyDetails.id);
        setPropertyGisData(gisData);
      } catch (error) {
        console.error('Error fetching property GIS data:', error);
        setPropertyGisData(null);
      }
    };
    
    fetchPropertyGisData();
  }, [propertyDetails, gisService, gisInitialized]);
  
  // Update map center and zoom when a property is selected
  useEffect(() => {
    if (propertyDetails?.location) {
      const lat = propertyDetails.location.lat;
      const lng = propertyDetails.location.lng;
      
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(16);
      }
    }
  }, [propertyDetails]);

  // Function to expose area selection to the popup click handler
  window.showAreasForEmirate = (emirateName) => {
    const event = new CustomEvent('showAreasForEmirate', { detail: emirateName });
    document.dispatchEvent(event);
  };

  // Listen for custom events
  useEffect(() => {
    const handleShowAreas = (event) => {
      const emirateName = event.detail;
      setCurrentEmirate(emirateName);
      setShowAreas(true);
    };
    
    document.addEventListener('showAreasForEmirate', handleShowAreas);
    
    return () => {
      document.removeEventListener('showAreasForEmirate', handleShowAreas);
    };
  }, []);
  
  // Handle marker click
  const handleMarkerClick = useCallback((propertyId) => {
    if (propertyId && typeof selectProperty === 'function') {
      selectProperty(propertyId);
    }
  }, [selectProperty]);

  // Safely format price for marker label
  const safeFormatPrice = (price) => {
    try {
      const formatted = formatPrice(price);
      return typeof formatted === 'string' ? formatted.replace('$', '') : '';
    } catch (error) {
      console.error('Error formatting price for marker label:', error);
      return '';
    }
  };
  
  // Color scheme for emirates (by population)
  const getEmirateColor = (population) => {
    return population > 3000000 ? '#800026' :
           population > 2000000 ? '#BD0026' :
           population > 1000000 ? '#E31A1C' :
           population > 500000  ? '#FC4E2A' :
           population > 200000  ? '#FD8D3C' :
           population > 100000  ? '#FEB24C' :
                                  '#FED976';
  };

  // Color scheme for areas (by average property price)
  const getAreaColor = (avgPrice) => {
    return avgPrice > 2000000 ? '#084c61' :
           avgPrice > 1500000 ? '#0d6e7f' :
           avgPrice > 1000000 ? '#14919b' :
           avgPrice > 750000  ? '#2bb5b8' :
           avgPrice > 500000  ? '#5dd4d5' :
           avgPrice > 300000  ? '#8feaec' :
                                '#c7f9fa';
  };

  // Style function for GeoJSON layers
  const styleGisFeature = useMemo(() => {
    return (feature) => {
      if (!feature || !feature.properties) return {};
      
      // Different styles based on feature type
      switch (feature.properties.type) {
        case 'emirate':
          return {
            color: '#666',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.5,
            fillColor: getEmirateColor(feature.properties.population)
          };
        case 'area':
          return {
            color: '#444',
            weight: 1,
            opacity: 0.7,
            fillOpacity: 0.6,
            fillColor: getAreaColor(feature.properties.avgPrice)
          };
        case 'parcel':
          return {
            color: '#3388ff',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.1,
            fillColor: '#3388ff'
          };
        case 'floodZone':
          return {
            color: '#33a0ff',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.2,
            fillColor: '#33a0ff',
            dashArray: '5, 5'
          };
        case 'zoning':
          const zoningColors = {
            'residential': '#86efac',
            'commercial': '#60a5fa',
            'industrial': '#f97316',
            'agricultural': '#84cc16',
            'mixed': '#a855f7'
          };
          return {
            color: '#666',
            weight: 1,
            opacity: 0.7,
            fillOpacity: 0.4,
            fillColor: zoningColors[feature.properties.zoning?.toLowerCase()] || '#d1d5db'
          };
        case 'building':
          return {
            color: '#777',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6,
            fillColor: '#999'
          };
        default:
          return {
            color: '#666',
            weight: 1,
            opacity: 0.5,
            fillOpacity: 0.2
          };
      }
    };
  }, []);
  
  // Create popup content for GIS features
  const onGisFeatureClick = useCallback((feature, layer) => {
    if (!feature.properties) return;
    
    const props = feature.properties;
    let content = '<div class="gis-popup">';
    
    if (props.title || props.name) {
      content += `<h4 class="font-medium">${props.title || props.name}</h4>`;
    }
    
    // Add properties based on feature type
    if (props.type === 'emirate') {
      content += `
        <p><strong>Emirate:</strong> ${props.name || 'N/A'}</p>
        <p><strong>Population:</strong> ${props.population ? props.population.toLocaleString() : 'N/A'}</p>
        ${props.code ? `<p><strong>Code:</strong> ${props.code}</p>` : ''}
      `;
      
      // Add a button to view areas within this emirate
      if (props.name) {
        content += `
          <button 
            onclick="window.showAreasForEmirate('${props.name}')" 
            class="px-2 py-1 mt-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            View Areas
          </button>
        `;
      }
    } else if (props.type === 'area') {
      content += `
        <p><strong>Area:</strong> ${props.name || 'N/A'}</p>
        <p><strong>Emirate:</strong> ${props.emirate || 'N/A'}</p>
        ${props.propertyCount ? `<p><strong>Properties:</strong> ${props.propertyCount.toLocaleString()}</p>` : ''}
        ${props.avgPrice ? `<p><strong>Avg. Price:</strong> AED ${props.avgPrice.toLocaleString()}</p>` : ''}
      `;
    } else if (props.type === 'parcel') {
      content += `
        <p><strong>Parcel ID:</strong> ${props.id || 'N/A'}</p>
        ${props.area ? `<p><strong>Area:</strong> ${props.area.toLocaleString()} sq ft</p>` : ''}
        ${props.owner ? `<p><strong>Owner:</strong> ${props.owner}</p>` : ''}
      `;
    } else if (props.type === 'zoning') {
      content += `
        <p><strong>Zone:</strong> ${props.zoning || 'N/A'}</p>
        <p><strong>Description:</strong> ${props.description || 'No description available'}</p>
      `;
    } else if (props.type === 'floodZone') {
      content += `
        <p><strong>Zone:</strong> ${props.zoneType || 'N/A'}</p>
        <p><strong>Risk Level:</strong> ${props.riskLevel || 'Unknown'}</p>
      `;
    }
    
    content += '</div>';
    layer.bindPopup(content);
  }, []);

  // Handle map click events for the map editor
  const handleMapClick = useCallback((e) => {
    if (editorEnabled) {
      // Dispatch a custom event for the editor to handle
      const event = new CustomEvent('mapClick', { detail: e });
      document.dispatchEvent(event);
    }
  }, [editorEnabled]);
  
  // Render loading state
  if (isLoading && !searchResults) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-500">Loading map data...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !searchResults) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="bg-red-50 p-4 rounded-md text-red-600 max-w-md">
          <h3 className="font-semibold mb-2">Error loading map</h3>
          <p>{typeof error === 'string' ? error : 'An error occurred while loading the map. Please try again.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare properties for display
  const displayProperties = propertyMarkers?.properties && Array.isArray(propertyMarkers.properties) 
    ? propertyMarkers.properties 
    : searchResults?.properties && Array.isArray(searchResults.properties)
      ? searchResults.properties
      : [];
  const noResults = displayProperties.length === 0 && !isLoading;
  
  return (
    <div className="w-full h-full relative">
      {/* Search Results Overlay */}
      {searchResults && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-lg shadow-md">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span>Loading...</span>
            </div>
          ) : noResults ? (
            <span>No properties found. Try adjusting your filters.</span>
          ) : (
            <span>
              Showing {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'}
              {searchResults.query ? ` for "${searchResults.query}"` : ''}
            </span>
          )}
        </div>
      )}
      
      {/* GIS Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
          gisInitialized ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            gisInitialized ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          GIS {gisInitialized ? 'Online' : 'Connecting...'}
        </div>
      </div>

      {/* Map Editor Toggle Button */}
      <div className="absolute top-4 right-24 z-10">
        <button
          onClick={() => setShowMapEditor(!showMapEditor)}
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
            showMapEditor ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
          }`}
        >
          <div className="w-4 h-4 mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          Edit Map
        </button>
      </div>
      
      {/* Map Editor Component */}
      {showMapEditor && (
        <MapEditorComponent 
          onClose={() => setShowMapEditor(false)} 
          onEnableEditing={(enabled) => setEditorEnabled(enabled)}
        />
      )}
      
      {/* GIS Settings Panel */}
      <GISSettingsPanel 
        enabledLayers={enabledGisLayers}
        onToggleLayer={(layer) => {
          const isEnabled = enabledGisLayers.includes(layer);
          const newLayers = isEnabled 
            ? enabledGisLayers.filter(l => l !== layer) 
            : [...enabledGisLayers, layer];
          onSelectProperty(null, newLayers);
        }}
        gisInitialized={gisInitialized}
        showEmirates={showEmirates}
        onToggleEmirates={setShowEmirates}
        showAreas={showAreas}
        onToggleAreas={setShowAreas}
        currentEmirate={currentEmirate}
        onEmirateChange={setCurrentEmirate}
      />
      
      {/* Map Legend */}
      <MapLegend 
        showEmirates={showEmirates}
        showAreas={showAreas}
      />
      
      {/* Map Container with Error Boundary */}
      <ErrorBoundary 
        errorMessage="Could not load the map. Please refresh the page." 
        showRetry={true}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: '100%', height: '100%' }}
          ref={mapRef}
          zoomControl={false}
          onClick={handleMapClick}
        >
          <ZoomControl position="bottomleft" />
          <MapController 
            bounds={mapBounds}
            center={mapCenter}
            zoom={mapZoom}
          />
          
          {/* Base map layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Emirates boundaries layer */}
          {showEmirates && emiratesBoundaries && emiratesBoundaries.features && (
            <GeoJSON 
              key="emirates-layer"
              data={emiratesBoundaries}
              style={styleGisFeature}
              onEachFeature={(feature, layer) => onGisFeatureClick(feature, layer)}
            />
          )}

          {/* Areas boundaries layer */}
          {showAreas && areasBoundaries && areasBoundaries.features && (
            <GeoJSON 
              key={`areas-layer-${currentEmirate}`}
              data={areasBoundaries}
              style={styleGisFeature}
              onEachFeature={(feature, layer) => onGisFeatureClick(feature, layer)}
            />
          )}
          
          {/* GIS GeoJSON Layers */}
          {gisLayers && gisLayers.layers && Array.isArray(gisLayers.layers) && gisLayers.layers.map(layer => {
            if (!layer.features || !Array.isArray(layer.features) || layer.features.length === 0) {
              return null;
            }
            
            // Only show layer if it's enabled
            if (!enabledGisLayers.includes(layer.type)) {
              return null;
            }
            
            const geoJsonData = {
              type: 'FeatureCollection',
              features: layer.features
            };
            
            return (
              <GeoJSON 
                key={`gis-layer-${layer.type}`}
                data={geoJsonData}
                style={styleGisFeature}
                onEachFeature={(feature, layer) => onGisFeatureClick(feature, layer)}
              />
            );
          })}
          
          {/* Property-specific GIS data for selected property */}
          {propertyDetails && propertyGisData && propertyGisData.parcelData && (
            <GeoJSON 
              data={{
                type: 'Feature',
                properties: {
                  type: 'parcel',
                  id: propertyGisData.gisId,
                  title: `Parcel: ${propertyGisData.gisId}`,
                  zoning: propertyGisData.zoning,
                  floodZone: propertyGisData.floodZone,
                  area: propertyGisData.parcelData.area,
                  perimeter: propertyGisData.parcelData.perimeter,
                  yearBuilt: propertyGisData.parcelData.yearBuilt
                },
                geometry: propertyGisData.parcelData.geometry || {
                  type: 'Polygon',
                  coordinates: [[
                    [propertyDetails.location.lng - 0.0003, propertyDetails.location.lat - 0.0003],
                    [propertyDetails.location.lng + 0.0003, propertyDetails.location.lat - 0.0003],
                    [propertyDetails.location.lng + 0.0003, propertyDetails.location.lat + 0.0003],
                    [propertyDetails.location.lng - 0.0003, propertyDetails.location.lat + 0.0003],
                    [propertyDetails.location.lng - 0.0003, propertyDetails.location.lat - 0.0003]
                  ]]
                }
              }}
              style={{
                color: '#ff3366',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.2,
                fillColor: '#ff3366'
              }}
              onEachFeature={(feature, layer) => onGisFeatureClick(feature, layer)}
            />
          )}
          
          {/* Property markers */}
          {displayProperties.map(property => {
            // Safely check if location exists and has valid lat/lng
            const lat = property?.location?.lat;
            const lng = property?.location?.lng;
            
            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
              return null;
            }
            
            const isSelected = propertyDetails && propertyDetails.id === property.id;
            
            try {
              // Create custom icon
              const markerIcon = new L.DivIcon({
                className: `property-marker ${isSelected ? 'marker-selected' : ''} ${property.type ? `marker-type-${property.type}` : ''} ${property.status ? `marker-status-${property.status}` : ''}`,
                iconSize: isSelected ? [35, 57] : [25, 41],
                iconAnchor: isSelected ? [17, 57] : [12, 41],
                popupAnchor: [1, -34],
                html: property.priceRange || property.price ? 
                  `<div class="property-marker-label">${safeFormatPrice(property.priceRange || property.price)}</div>` : 
                  ''
              });
              
              return (
                <Marker 
                  key={property.id || `property-${lat}-${lng}`} 
                  position={[lat, lng]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => handleMarkerClick(property.id)
                  }}
                >
                  <Popup className="map-popup">
                    <h3>{property.title || 'Property Details'}</h3>
                    <p className="price">
                      {property.price ? formatPrice(property.price) : 'Price on request'}
                      {property.status && <span className="text-xs ml-2">({property.status})</span>}
                    </p>  
                    <p className="address">{property.address || formatLocation(property.location)}</p>
                    <p className="details">
                      {property.bedrooms && `${property.bedrooms} bed`}{property.bedrooms && property.bathrooms && ' · '}
                      {property.bathrooms && `${property.bathrooms} bath`}{(property.bedrooms || property.bathrooms) && property.sqft && ' · '}
                      {property.sqft && `${property.sqft} sq ft`}
                    </p>  
                    <button   
                      className="mt-2 w-full text-center bg-blue-600 text-white px-2 py-1 text-sm rounded hover:bg-blue-700"
                      onClick={(e) => {
                        e.preventDefault();
                        handleMarkerClick(property.id);
                      }}  
                    >
                      View Details
                    </button>  
                  </Popup>  
                </Marker>  
              );  
            } catch (error) {
              console.error('Error rendering marker for property:', property.id, error);
              return null;
            }
          })}  
        </MapContainer>
      </ErrorBoundary>  
    </div>  
  );  
};  

export default PropertyMap;
