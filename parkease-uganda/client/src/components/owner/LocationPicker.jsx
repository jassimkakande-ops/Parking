import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Forces Leaflet to recalculate its size after the CSS fadeIn animation
function InvalidateMapSize() {
  const map = useMapEvents({});
  useEffect(() => {
    const interval = setInterval(() => {
      map.invalidateSize();
    }, 50);
    setTimeout(() => {
      clearInterval(interval);
      map.invalidateSize();
      window.dispatchEvent(new Event('resize'));
    }, 600);
    return () => clearInterval(interval);
  }, [map]);
  return null;
}

// Handles map click and triggers reverse geocoding
function MapClickHandler({ setPosition, onLocationSelect }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });

      // Reverse geocode using Photon (Komoot) to get address details from coordinates
      try {
        const res = await fetch(
          `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&limit=1`
        );
        if (!res.ok) throw new Error('Reverse geocode failed');
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties;
          // Photon response fields: city, county, state, street, housenumber, postcode, country
          const district = props.city || props.county || props.state || '';
          const street = props.street || '';
          const houseNumber = props.housenumber ? ` ${props.housenumber}` : '';
          const address = street ? `${street}${houseNumber}` : '';

          if (onLocationSelect) {
            onLocationSelect({ district, address });
          }
        }
      } catch {
        // Reverse geocode failed silently — user can still type fields manually
        console.warn('Reverse geocode unavailable — fill address fields manually.');
      }
    },
  });
  return null;
}

const LocationPicker = ({ position, setPosition, onLocationSelect }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <MapContainer
          center={[0.3476, 32.5825]}
          zoom={13}
          style={{ height: '300px', width: '100%', zIndex: 1 }}
        >
          <InvalidateMapSize />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapClickHandler setPosition={setPosition} onLocationSelect={onLocationSelect} />
          {position.lat && position.lng && (
            <Marker position={[position.lat, position.lng]} />
          )}
        </MapContainer>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        📍 Click anywhere on the map to drop a pin. The <strong>District</strong> and <strong>Street Address</strong> fields will be filled in automatically.
      </p>
    </div>
  );
};

export default LocationPicker;
