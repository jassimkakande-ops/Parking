import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { SOCKET_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Car, Grid, Search as SearchIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, Autocomplete } from '@react-google-maps/api';
import BookingFlowModal from '../components/driver/BookingFlowModal';
import AllotmentView from '../components/owner/AllotmentView';

const libraries = ['places'];
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center to Kampala if no search state is provided
const defaultCenter = { lat: 0.3476, lng: 32.5825 };

const Search = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // If user searched from Home, use those coordinates to center the map
  const [mapCenter, setMapCenter] = useState(
    location.state?.lat && location.state?.lng 
      ? { lat: location.state.lat, lng: location.state.lng } 
      : defaultCenter
  );

  const [searchInputValue, setSearchInputValue] = useState(location.state?.name || "Kampala, Uganda");

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  const [selectedFacilityForBooking, setSelectedFacilityForBooking] = useState(null);
  const [slotMapFacility, setSlotMapFacility] = useState(null);
  const [preSelectedSlot, setPreSelectedSlot] = useState(null);

  useEffect(() => {
    fetchFacilities();
    
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Connected to real-time server (Search)');
    });

    socket.on('facility_updated', (data) => {
      setFacilities(prev => prev.map(f => {
        if (f.id === data.facilityId) {
          return { ...f, available_slots: Number(f.available_slots) + Number(data.modifier) };
        }
        return f;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/facilities?available=true');
      setFacilities(res.data.data);
      
      const socket = io(SOCKET_URL);
      res.data.data.forEach(f => {
        socket.emit('join_facility', f.id);
      });
      
    } catch (err) {
      setError('Failed to fetch parking facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (facility) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedFacilityForBooking(facility);
  };

  const onLoadMap = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmountMap = useCallback(function callback() {
    setMap(null);
  }, []);

  const onLoadAutocomplete = (autoC) => setAutocomplete(autoC);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMapCenter({ lat, lng });
        setSearchInputValue(place.formatted_address || place.name);
        
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(14);
        }
      }
    }
  };

  // Optional: Filter facilities by distance to mapCenter (simplified: just showing all for now, as Uganda is small, but panning map to search)
  // For a production app, you'd calculate haversine distance here and filter `facilities` to those within 10km.
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      {/* Top Search Bar */}
      <div style={{ padding: '16px 24px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 16px', background: 'var(--bg-color)', flex: 1, maxWidth: '600px' }}>
          <SearchIcon size={20} color="var(--primary)" style={{ marginRight: '12px' }} />
          {isLoaded ? (
            <div style={{ flex: 1 }}>
              <Autocomplete
                onLoad={onLoadAutocomplete}
                onPlaceChanged={onPlaceChanged}
                options={{ componentRestrictions: { country: 'ug' } }}
              >
                <input 
                  type="text" 
                  placeholder="Where are you going?" 
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem', color: 'var(--text-main)' }} 
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                />
              </Autocomplete>
            </div>
          ) : (
            <input 
              type="text" 
              placeholder="Loading search..." 
              disabled
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1.1rem', color: 'var(--text-main)' }} 
            />
          )}
        </div>
        <button className="btn-primary">Update Search</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: List of Facilities */}
        <div style={{ width: '400px', overflowY: 'auto', background: 'var(--bg-color)', borderRight: '1px solid var(--border-color)', padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>{facilities.length} Parking Spots</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading facilities...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)' }}>{error}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {facilities.map(facility => (
                <div key={facility.id} className="glass-panel" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => {
                  if (map && facility.latitude && facility.longitude) {
                    map.panTo({ lat: parseFloat(facility.latitude), lng: parseFloat(facility.longitude) });
                    map.setZoom(16);
                  }
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{facility.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <MapPin size={14} />
                        {facility.address}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                     <div className={`badge ${facility.available_slots > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {facility.available_slots} / {facility.total_slots} Slots Available
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {Number(facility.hourly_rate).toLocaleString()} UGX<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/hr</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px' }}
                      onClick={(e) => { e.stopPropagation(); handleBookNow(facility); }}
                      disabled={facility.available_slots <= 0}
                    >
                      <Car size={16} />
                      Book Now
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px' }}
                      onClick={(e) => { e.stopPropagation(); setSlotMapFacility(facility); }}
                      title="View slot map"
                    >
                      <Grid size={16} /> Slots
                    </button>
                  </div>
                </div>
              ))}
              {facilities.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>No parking facilities currently available.</div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={13}
              onLoad={onLoadMap}
              onUnmount={onUnmountMap}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }}
            >
              {facilities.map(f => (
                f.latitude && f.longitude && (
                  <MarkerF 
                    key={f.id} 
                    position={{ lat: parseFloat(f.latitude), lng: parseFloat(f.longitude) }}
                    onClick={() => setActiveMarker(f.id)}
                  >
                    {activeMarker === f.id ? (
                      <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                        <div style={{ textAlign: 'center', padding: '4px', minWidth: '120px' }}>
                          <strong style={{ display: 'block', marginBottom: '4px', color: '#000' }}>{f.name}</strong>
                          <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{Number(f.hourly_rate).toLocaleString()} UGX/hr</span><br/>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{f.available_slots} slots available</span>
                        </div>
                      </InfoWindowF>
                    ) : null}
                  </MarkerF>
                )
              ))}
            </GoogleMap>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f0f0f0' }}>
              Loading Google Maps...
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {slotMapFacility && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 9997,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto',
          padding: '40px 16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '800px',
            background: 'var(--surface-color)',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>{slotMapFacility.name} — Slot Map</h3>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Click a slot to see its booking schedule
                </p>
              </div>
              <button
                onClick={() => setSlotMapFacility(null)}
                style={{
                  background: 'var(--danger-bg)', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--danger)'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '0' }}>
              <AllotmentView
                facility={slotMapFacility}
                onBookSlot={(slot) => {
                  setPreSelectedSlot(slot);
                  handleBookNow(slotMapFacility);
                  setSlotMapFacility(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {selectedFacilityForBooking && (
        <BookingFlowModal 
          isOpen={true} 
          onClose={() => { setSelectedFacilityForBooking(null); setPreSelectedSlot(null); }} 
          facility={selectedFacilityForBooking}
          preSelectedSlot={preSelectedSlot}
        />
      )}
    </div>
  );
};

export default Search;
