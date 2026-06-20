import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '300px'
};

const defaultCenter = {
  lat: 0.3476,
  lng: 32.5825
};

const LocationPicker = ({ position, setPosition, onLocationSelect }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });

    // Reverse geocode using Google Geocoding API
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      
      if (response.results && response.results[0]) {
        const addressComponents = response.results[0].address_components;
        
        let district = '';
        let street = '';
        
        addressComponents.forEach(component => {
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            district = component.long_name;
          }
          if (component.types.includes('route')) {
            street = component.long_name;
          }
        });

        if (onLocationSelect) {
          onLocationSelect({ 
            district: district, 
            address: response.results[0].formatted_address 
          });
        }
      }
    } catch (err) {
      console.error('Google reverse geocode failed:', err);
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={position?.lat ? position : defaultCenter}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          }}
        >
          {position?.lat && position?.lng && (
            <MarkerF position={position} />
          )}
        </GoogleMap>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        📍 Click anywhere on the map to drop a pin. The <strong>District</strong> and <strong>Street Address</strong> fields will be filled in automatically.
      </p>
    </div>
  );
};

export default LocationPicker;
