import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import PropTypes from 'prop-types';
import { usePropertyMap } from '../../contexts/PropertyMapContext';
import { formatPrice, formatArea } from '../../utils/DataFormatter';
import MapLegend from './MapLegend';
import GISSettingsPanel from './GISSettingsPanel';
import GoogleMapsApiService from '../../services/GoogleMapsApiService';
import '../../styles/mapMarkers.css';

// Default center point (Dubai)
const DEFAULT_CENTER = { lat: 25.2048, lng: 55.2708 };
const DEFAULT_ZOOM = 11;

// Default map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  scaleControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  mapTypeControlOptions: {
    style: 2, // DROPDOWN_MENU
    position: 3 // RIGHT_TOP
  }
};

/**
 * PropertyGoogleMap component for displaying property locations on Google Maps
 */
const PropertyGoogleMap = ({ apiKey }) => {
  // Load the Google Maps JS API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || ''
  });

  // References
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const gisLayersRef = useRef({});
  const googleMapsServiceRef = useRef(null);

  // State
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showEmirates, setShowEmirates] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [currentEmirate, setCurrentEmirate] = useState('Dubai');
  const [enabledLayers, setEnabledLayers] = useState([]);
  const [gisInitialized, setGisInitialized] = useState(false);

  // Context
  const { 
    propertyMarkers, 
    selectedPropertyId, 
    setSelectedPropertyId,
    mapMode,
    setMapMode,
    emiratesColors
  } = usePropertyMap();

  /**
   * Initialize Google Maps API service
   */
  useEffect(() => {
    if (isLoaded && !googleMapsServiceRef.current) {
      googleMapsServiceRef.current = new GoogleMapsApiService(apiKey);
      googleMapsServiceRef.current.initialize()
        .then(success => {
          setGisInitialized(success);
        })
        .catch(error => {
          console.error('Failed to initialize Google Maps API service:', error);
          setGisInitialized(false);
        });
    }
  }, [isLoaded, apiKey]);

  /**
   * Create marker clusterer when map and markers are ready
   */
  useEffect(() => {
    if (mapLoaded && mapRef.current && markersRef.current.length > 0) {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: markersRef.current,
        algorithm: {
          maxZoom: 15,
          gridSize: 60
        },
        renderer: {
          render: ({ count, position }) => {
            return new window.google.maps.Marker({
              position,
              label: { text: String(count), color: '#ffffff' },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#1e40af',
                fillOpacity: 0.9,
                strokeWeight: 1,
                strokeColor: '#ffffff',
                scale: count < 10 ? 18 : count < 100 ? 22 : 26,
              },
              zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count,
            });
          }
        }
      });
    }
    
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
    };
  }, [mapLoaded, propertyMarkers]);

  /**
   * Load emirates boundaries if show emirates is enabled
   */
  useEffect(() => {
    if (!showEmirates || !mapLoaded || !mapRef.current || !googleMapsServiceRef.current || !gisInitialized) return;
    
    const loadEmiratesBoundaries = async () => {
      // Clean up existing boundaries
      if (gisLayersRef.current.emirates) {
        gisLayersRef.current.emirates.forEach(layer => {
          layer.setMap(null);
        });
        gisLayersRef.current.emirates = [];
      }
      
      try {
        // Load boundaries for each emirate
        const emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
        const layers = [];
        
        for (const emirate of emirates) {
          const geoJson = await googleMapsServiceRef.current.getRegionBoundary(emirate, 'emirate');
          const color = emiratesColors[emirate] || '#3b82f6'; // Default to blue if no color is defined
          
          const layer = new window.google.maps.Data();
          layer.addGeoJson(geoJson);
          layer.setStyle({
            fillColor: color,
            fillOpacity: 0.3,
            strokeColor: color,
            strokeWeight: 1,
            strokeOpacity: 0.8,
          });
          
          layer.setMap(mapRef.current);
          layers.push(layer);
          
          // Add click listener to each emirate
          layer.addListener('click', (event) => {
            const properties = event.feature.getProperty('properties');
            const name = properties?.name || emirate;
            
            // Zoom to the emirate bounds
            const bounds = new window.google.maps.LatLngBounds();
            event.feature.getGeometry().forEachLatLng(latlng => bounds.extend(latlng));
            mapRef.current.fitBounds(bounds);
            
            // Update UI state
            setCurrentEmirate(name);
            if (!showAreas) {
              setShowAreas(true);
            }
          });
        }
        
        gisLayersRef.current.emirates = layers;
      } catch (error) {
        console.error('Error loading emirates boundaries:', error);
      }
    };
    
    loadEmiratesBoundaries();
  }, [showEmirates, mapLoaded, gisInitialized, emiratesColors]);

  /**
   * Load area boundaries if show areas is enabled
   */
  useEffect(() => {
    if (!showAreas || !mapLoaded || !mapRef.current || !googleMapsServiceRef.current || !gisInitialized) return;
    
    const loadAreaBoundaries = async () => {
      // Clean up existing boundaries
      if (gisLayersRef.current.areas) {
        gisLayersRef.current.areas.forEach(layer => {
          layer.setMap(null);
        });
        gisLayersRef.current.areas = [];
      }
      
      try {
        // In a real implementation, we would load areas for the current emirate
        // For this demo, we'll create some mock areas
        const mockAreas = [
          `${currentEmirate} - Downtown`, 
          `${currentEmirate} - Marina`, 
          `${currentEmirate} - Airport`, 
          `${currentEmirate} - Old Town`
        ];
        
        const layers = [];
        
        for (const area of mockAreas) {
          const geoJson = await googleMapsServiceRef.current.getRegionBoundary(area, 'area');
          
          const propertyCount = geoJson.features[0].properties.propertyCount || 0;
          let color = '#e5f5e0'; // Light green for low density
          
          // Color based on property density
          if (propertyCount > 300) {
            color = '#006d2c'; // Dark green for high density
          } else if (propertyCount > 100) {
            color = '#74c476'; // Medium green for medium density
          }
          
          const layer = new window.google.maps.Data();
          layer.addGeoJson(geoJson);
          layer.setStyle({
            fillColor: color,
            fillOpacity: 0.4,
            strokeColor: '#ffffff',
            strokeWeight: 1,
            strokeOpacity: 0.6,
          });
          
          layer.setMap(mapRef.current);
          layers.push(layer);
          
          // Add click listener to each area
          layer.addListener('click', (event) => {
            const properties = event.feature.getProperty('properties');
            const name = properties?.name || area;
            
            // Zoom to the area bounds
            const bounds = new window.google.maps.LatLngBounds();
            event.feature.getGeometry().forEachLatLng(latlng => bounds.extend(latlng));
            mapRef.current.fitBounds(bounds);
            
            // Could show details about the area in a popup or sidebar
            console.log(`Clicked on area: ${name}`);
          });
        }
        
        gisLayersRef.current.areas = layers;
      } catch (error) {
        console.error('Error loading area boundaries:', error);
      }
    };
    
    loadAreaBoundaries();
  }, [showAreas, currentEmirate, mapLoaded, gisInitialized]);

  /**
   * Load GIS layers when enabled
   */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !googleMapsServiceRef.current || !gisInitialized) return;
    
    const loadGisLayers = async () => {
      // Get current map bounds
      const bounds = mapRef.current.getBounds();
      if (!bounds) return;
      
      const boundingBox = {
        north: bounds.getNorthEast().lat(),
        east: bounds.getNorthEast().lng(),
        south: bounds.getSouthWest().lat(),
        west: bounds.getSouthWest().lng()
      };
      
      // Clean up and load each enabled layer
      for (const layerType of ['parcels', 'zoning', 'schools', 'hospitals', 'metroStations', 'busStops']) {
        // Clean up existing layer if it exists
        if (gisLayersRef.current[layerType]) {
          gisLayersRef.current[layerType].setMap(null);
          delete gisLayersRef.current[layerType];
        }
        
        // Skip if this layer is not enabled
        if (!enabledLayers.includes(layerType)) continue;
        
        try {
          // Fetch GIS data
          const gisFeatures = await googleMapsServiceRef.current.getGisData(layerType, boundingBox);
          
          // Create the data layer
          const layer = new window.google.maps.Data();
          
          // Add features to the layer
          gisFeatures.forEach(feature => {
            layer.addGeoJson(feature);
          });
          
          // Style the layer based on type
          let layerStyle = {};
          
          switch (layerType) {
            case 'parcels':
              layerStyle = {
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                strokeColor: '#3b82f6',
                strokeWeight: 1
              };
              break;
            case 'zoning':
              layerStyle = {
                fillColor: '#10b981',
                fillOpacity: 0.2,
                strokeColor: '#10b981',
                strokeWeight: 1
              };
              break;
            case 'schools':
              layerStyle = {
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#f59e0b',
                  fillOpacity: 0.9,
                  strokeColor: '#ffffff',
                  strokeWeight: 1,
                  scale: 8
                }
              };
              break;
            case 'hospitals':
              layerStyle = {
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#ef4444',
                  fillOpacity: 0.9,
                  strokeColor: '#ffffff',
                  strokeWeight: 1,
                  scale: 8
                }
              };
              break;
            case 'metroStations':
              layerStyle = {
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#8b5cf6',
                  fillOpacity: 0.9,
                  strokeColor: '#ffffff',
                  strokeWeight: 1,
                  scale: 7
                }
              };
              break;
            case 'busStops':
              layerStyle = {
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#ec4899',
                  fillOpacity: 0.9,
                  strokeColor: '#ffffff',
                  strokeWeight: 1,
                  scale: 6
                }
              };
              break;
            default:
              layerStyle = {
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                strokeColor: '#3b82f6',
                strokeWeight: 1
              };
          }
          
          layer.setStyle(layerStyle);
          
          // Add click handler for features
          layer.addListener('click', (event) => {
            const properties = event.feature.getProperty('properties');
            // Could show details about the feature in a popup or sidebar
            console.log(`Clicked on ${layerType} feature:`, properties);
          });
          
          // Add the layer to the map
          layer.setMap(mapRef.current);
          gisLayersRef.current[layerType] = layer;
        } catch (error) {
          console.error(`Error loading ${layerType} layer:`, error);
        }
      }
    };
    
    if (enabledLayers.length > 0) {
      loadGisLayers();
    }
  }, [enabledLayers, mapLoaded, gisInitialized]);

  /**
   * Handle map load event
   */
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  /**
   * Handle map unload event
   */
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
    setMapLoaded(false);
  }, []);

  /**
   * Create property marker icon based on property type and status
   */
  const getPropertyMarkerIcon = useCallback((property) => {
    let color = '#3b82f6'; // Default blue
    
    // Color based on property type
    switch (property.type?.toLowerCase()) {
      case 'commercial':
        color = '#10b981'; // Emerald
        break;
      case 'industrial':
        color = '#f97316'; // Orange
        break;
      case 'land':
        color = '#84cc16'; // Lime
        break;
      default: // residential
        color = '#3b82f6'; // Blue
    }
    
    // Gray out if sold or rented
    if (['sold', 'rented'].includes(property.status?.toLowerCase())) {
      color = '#6b7280'; // Gray
    }
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 1,
      scale: selectedPropertyId === property.id ? 10 : 8, // Make selected marker slightly larger
      labelOrigin: new window.google.maps.Point(0, 0),
    };
  }, [selectedPropertyId]);

  /**
   * Toggle GIS layer
   */
  const handleToggleLayer = useCallback((layerId) => {
    setEnabledLayers(prev => 
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  }, []);

  /**
   * Toggle emirates display
   */
  const handleToggleEmirates = useCallback((show) => {
    setShowEmirates(show);
    
    // Update map mode
    if (show) {
      if (showAreas) {
        setMapMode('hybrid');
      } else {
        setMapMode('emirates');
      }
    } else if (showAreas) {
      setMapMode('areas');
    } else {
      setMapMode('properties');
    }
  }, [showAreas, setMapMode]);

  /**
   * Toggle areas display
   */
  const handleToggleAreas = useCallback((show) => {
    setShowAreas(show);
    
    // Update map mode
    if (show) {
      if (showEmirates) {
        setMapMode('hybrid');
      } else {
        setMapMode('areas');
      }
    } else if (showEmirates) {
      setMapMode('emirates');
    } else {
      setMapMode('properties');
    }
  }, [showEmirates, setMapMode]);

  /**
   * Handle emirate change
   */
  const handleEmirateChange = useCallback((emirate) => {
    setCurrentEmirate(emirate);
    // This would trigger the effect to reload the areas for the new emirate
  }, []);

  // Handle map loading error
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 p-6 rounded">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Map Loading Error</h3>
          <p className="mt-1 text-sm text-gray-500">
            There was a problem loading Google Maps.
            <br />Please check your API key and try again.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while the map is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 p-6 rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
      >
        {/* Property markers */}
        {mapLoaded && propertyMarkers?.properties && propertyMarkers.properties.map((property) => (
          <Marker
            key={property.id}
            position={{ lat: property.lat, lng: property.lng }}
            icon={getPropertyMarkerIcon(property)}
            onClick={() => {
              setSelectedProperty(property);
              setSelectedPropertyId(property.id);
            }}
            ref={marker => {
              if (marker) {
                const existingIndex = markersRef.current.findIndex(
                  m => m.getPosition().lat() === property.lat && 
                       m.getPosition().lng() === property.lng
                );
                
                if (existingIndex >= 0) {
                  markersRef.current[existingIndex] = marker;
                } else {
                  markersRef.current.push(marker);
                }
              }
            }}
            zIndex={selectedPropertyId === property.id ? 1000 : undefined}
          />
        ))}
        
        {/* Info window for selected property */}
        {selectedProperty && (
          <InfoWindow
            position={{ lat: selectedProperty.lat, lng: selectedProperty.lng }}
            onCloseClick={() => {
              setSelectedProperty(null);
              setSelectedPropertyId(null);
            }}
            options={{ pixelOffset: new window.google.maps.Size(0, -30) }}
          >
            <div className="map-popup">
              <h3>{selectedProperty.title}</h3>
              <div className="price">
                {formatPrice(selectedProperty.price)}
                {selectedProperty.status && (
                  <span className="ml-2 text-xs">({selectedProperty.status})</span>
                )}
              </div>
              <div className="address">{selectedProperty.address}</div>
              <div className="details">
                {selectedProperty.bedrooms && `${selectedProperty.bedrooms} Beds`}
                {selectedProperty.bedrooms && selectedProperty.bathrooms && ' · '}
                {selectedProperty.bathrooms && `${selectedProperty.bathrooms} Baths`}
                {(selectedProperty.bedrooms || selectedProperty.bathrooms) && selectedProperty.area && ' · '}
                {selectedProperty.area && formatArea(selectedProperty.area)}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Map Controls */}
      <GISSettingsPanel
        enabledLayers={enabledLayers}
        onToggleLayer={handleToggleLayer}
        gisInitialized={gisInitialized}
        showEmirates={showEmirates}
        onToggleEmirates={handleToggleEmirates}
        showAreas={showAreas}
        onToggleAreas={handleToggleAreas}
        currentEmirate={currentEmirate}
        onEmirateChange={handleEmirateChange}
      />
      
      {/* Map Legend */}
      <MapLegend
        showEmirates={showEmirates}
        showAreas={showAreas}
      />
    </div>
  );
};

PropertyGoogleMap.propTypes = {
  apiKey: PropTypes.string
};

export default PropertyGoogleMap;
