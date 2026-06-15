import React, { useState } from 'react';
import LocationPicker from './LocationPicker';
import { X } from 'lucide-react';
import { createFacility } from '../../api/parkingApi';

const AddFacilityModal = ({ isOpen, onClose, onFacilityCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    plot_number: '',
    address: '',
    description: '',
    total_slots: '',
    hourly_rate: ''
  });
  const [mapPosition, setMapPosition] = useState({ lat: null, lng: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = ({ district, address }) => {
    setFormData(prev => ({
      ...prev,
      district: district || prev.district,
      address: address || prev.address,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mapPosition.lat || !mapPosition.lng) {
      setError('Please select a location on the map.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: mapPosition.lat,
        longitude: mapPosition.lng,
        total_slots: parseInt(formData.total_slots),
        hourly_rate: parseFloat(formData.hourly_rate)
      };
      await createFacility(payload);
      
      setFormData({ name: '', district: '', plot_number: '', address: '', description: '', total_slots: '', hourly_rate: '' });
      setMapPosition({ lat: null, lng: null });
      
      if (onFacilityCreated) onFacilityCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create facility.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: '500px',
          backgroundColor: 'var(--bg-color)', zIndex: 1000,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add New Facility</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Facility Name</label>
              <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} required />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label">District / City</label>
                <input type="text" name="district" className="input-field" placeholder="Auto-filled" value={formData.district} onChange={handleChange} required />
              </div>
              <div>
                <label className="input-label">Plot Number</label>
                <input type="text" name="plot_number" className="input-field" placeholder="e.g. Plot 42" value={formData.plot_number} onChange={handleChange} required />
              </div>
            </div>
            
            <div>
              <label className="input-label">Street Address</label>
              <input type="text" name="address" className="input-field" placeholder="Auto-filled" value={formData.address} onChange={handleChange} required />
            </div>

            <div>
              <label className="input-label">Select Location on Map</label>
              <LocationPicker position={mapPosition} setPosition={setMapPosition} onLocationSelect={handleLocationSelect} />
            </div>

            <div>
              <label className="input-label">Description (Optional)</label>
              <textarea name="description" className="input-field" value={formData.description} onChange={handleChange} rows="2"></textarea>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="input-label">Total Slots</label>
                <input type="number" name="total_slots" className="input-field" min="1" value={formData.total_slots} onChange={handleChange} required />
              </div>
              <div>
                <label className="input-label">Hourly Rate (UGX)</label>
                <input type="number" name="hourly_rate" className="input-field" min="0" value={formData.hourly_rate} onChange={handleChange} required />
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Saving...' : 'Save Facility'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddFacilityModal;
