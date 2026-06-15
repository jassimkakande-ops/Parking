import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacilityDetails, updateSlotStatus } from '../api/parkingApi';
import LocationActions from '../components/LocationActions';

const ManageFacility = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // For toggling slot status
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehiclePlate, setVehiclePlate] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await getFacilityDetails(id);
      setFacility(data);
    } catch (err) {
      setError('Failed to fetch facility details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleToggleOccupancy = async (slot) => {
    // If it's already occupied, free it immediately
    if (slot.is_occupied) {
      try {
        await updateSlotStatus(slot.id, { is_occupied: false, vehicle_plate: null });
        fetchDetails(); // Refresh
      } catch (err) {
        alert('Failed to update slot');
      }
    } else {
      // If it's free, prompt for vehicle plate
      setSelectedSlot(slot);
    }
  };

  const confirmOccupancy = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    try {
      await updateSlotStatus(selectedSlot.id, { is_occupied: true, vehicle_plate: vehiclePlate });
      setSelectedSlot(null);
      setVehiclePlate('');
      fetchDetails(); // Refresh
    } catch (err) {
      alert('Failed to occupy slot');
    }
  };

  if (loading) return <div className="app-container" style={{ padding: '24px' }}>Loading...</div>;
  if (error) return <div className="app-container" style={{ padding: '24px', color: 'red' }}>{error}</div>;
  if (!facility) return <div className="app-container" style={{ padding: '24px' }}>Facility not found.</div>;

  return (
    <div className="main-content animate-fade-in" style={{ padding: '24px' }}>
      <button onClick={() => navigate('/owner')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '16px', fontWeight: '500' }}>
        &larr; Back to Dashboard
      </button>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{facility.name}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{facility.address}</p>
          </div>
          <LocationActions lat={facility.latitude} lng={facility.longitude} name={facility.name} />
        </div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '24px' }}>
          <div><strong>Total Slots:</strong> {facility.total_slots}</div>
          <div><strong>Available:</strong> {facility.available_slots}</div>
          <div><strong>Rate:</strong> {facility.hourly_rate} UGX/hr</div>
        </div>
      </div>

      <h2 style={{ marginBottom: '16px' }}>Manage Slots</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
        {facility.slots && facility.slots.map(slot => (
          <div 
            key={slot.id} 
            className="glass-panel" 
            style={{ 
              cursor: 'pointer', 
              textAlign: 'center', 
              border: slot.is_occupied ? '2px solid var(--danger-color)' : '2px solid var(--success-color)',
              background: slot.is_occupied ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'
            }}
            onClick={() => handleToggleOccupancy(slot)}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{slot.slot_number}</h3>
            {slot.is_occupied ? (
              <>
                <p style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Occupied</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>{slot.vehicle_plate}</p>
              </>
            ) : (
              <p style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Available</p>
            )}
          </div>
        ))}
      </div>

      {selectedSlot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Mark {selectedSlot.slot_number} as Occupied</h3>
            <form onSubmit={confirmOccupancy}>
              <label className="input-label">Vehicle Plate Number (Optional)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. UAB 123C" 
                value={vehiclePlate}
                onChange={e => setVehiclePlate(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setSelectedSlot(null); setVehiclePlate(''); }}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFacility;
