import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { addExtraSlot as addExtraSlotApi } from '../../api/parkingApi';
import { Loader2, Plus } from 'lucide-react';

const AerialCarIcon = ({ size = 24, isOccupied = false }) => {
  const color = isOccupied ? '#fff' : 'var(--text-muted)';
  const strokeColor = isOccupied ? '#fff' : 'var(--border-color)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="14" height="18" rx="3" stroke={strokeColor} strokeWidth="2" fill={isOccupied ? 'var(--primary)' : 'none'} />
      <path d="M7 6L17 6" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 16L17 16" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="7" y="8" width="10" height="6" rx="1" stroke={strokeColor} strokeWidth="1.5" fill={isOccupied ? '#fff' : 'none'} />
      <path d="M6 12H5" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M19 12H18" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const AerialBikeIcon = ({ size = 24, isOccupied = false }) => {
  const strokeColor = isOccupied ? '#fff' : 'var(--border-color)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="6" r="2" stroke={strokeColor} strokeWidth="2" fill={isOccupied ? 'var(--primary)' : 'none'} />
      <rect x="10" y="9" width="4" height="10" rx="2" stroke={strokeColor} strokeWidth="2" fill={isOccupied ? 'var(--primary)' : 'none'} />
      <path d="M9 13H7" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 13H17" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const AllotmentView = ({ facility }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [activeTab, setActiveTab] = useState('car');

  useEffect(() => {
    if (!facility) return;

    const fetchSlots = async () => {
      try {
        setLoading(true);
        // We will fetch the slots for the facility.
        // Wait, does the API expose an endpoint for this?
        // In parking.routes.js: GET /api/v1/facilities/:id includes slots if populated, or we fetch them separately.
        const res = await api.get(`/facilities/${facility.id}`);
        
        const dbSlots = res.data.data.slots || [];
        setSlots(dbSlots);
      } catch (err) {
        setError('Failed to load parking slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();

    const socket = io('http://localhost:5000');
    socket.emit('join_facility', facility.id);

    socket.on('slot_updated', (data) => {
      setSlots(prev => prev.map(s => {
        if (s.id === data.id) {
          return { ...s, is_occupied: data.is_occupied, vehicle_plate: data.vehicle_plate };
        }
        return s;
      }));
    });

    socket.on('slot_added', (newSlot) => {
      setSlots(prev => {
        if (prev.find(s => s.id === newSlot.id)) return prev;
        return [...prev, newSlot];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [facility]);

  if (!facility) return <div>Please select a facility</div>;
  if (loading) return <div>Loading allotment map...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  const handleAddSlot = async () => {
    try {
      setIsAddingSlot(true);
      const newSlot = await addExtraSlotApi(facility.id, activeTab);
      setSlots(prev => {
        if (prev.find(s => s.id === newSlot.id)) return prev;
        return [...prev, newSlot];
      });
    } catch (err) {
      alert('Failed to add slot');
    } finally {
      setIsAddingSlot(false);
    }
  };

  const displayedSlots = slots.filter(s => {
    const isBike = s.slot_number.toLowerCase().includes('bike');
    return activeTab === 'bike' ? isBike : !isBike;
  });

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setActiveTab('car')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              background: activeTab === 'car' ? 'var(--primary)' : 'var(--bg-color)', 
              color: activeTab === 'car' ? '#fff' : 'var(--text-muted)', 
              borderRadius: '8px', 
              fontWeight: 'bold',
              border: activeTab === 'car' ? 'none' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}>
            <AerialCarIcon size={18} isOccupied={activeTab === 'car'} /> CAR
          </button>
          <button 
            onClick={() => setActiveTab('bike')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              background: activeTab === 'bike' ? 'var(--primary)' : 'var(--bg-color)', 
              color: activeTab === 'bike' ? '#fff' : 'var(--text-muted)', 
              borderRadius: '8px', 
              fontWeight: 'bold',
              border: activeTab === 'bike' ? 'none' : '1px solid var(--border-color)',
              cursor: 'pointer'
            }}>
            <AerialBikeIcon size={18} isOccupied={activeTab === 'bike'} /> BIKE
          </button>
        </div>
        <button 
          className="btn-primary" 
          onClick={handleAddSlot} 
          disabled={isAddingSlot}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isAddingSlot ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Add {activeTab === 'car' ? 'Car' : 'Bike'} Slot
        </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
        gap: '24px',
        alignItems: 'start'
      }}>
        {displayedSlots.map((slot) => (
          <div 
            key={slot.id} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '24px 32px',
              border: slot.is_occupied ? '2px solid var(--primary)' : '2px dashed var(--border-color)',
              borderRadius: '12px',
              background: slot.is_occupied ? 'var(--primary-light, rgba(52, 168, 83, 0.1))' : 'transparent',
              transition: 'all 0.2s ease',
              minHeight: '120px'
            }}
          >
            <div style={{ 
              background: slot.is_occupied ? 'var(--primary)' : 'var(--bg-color)', 
              color: slot.is_occupied ? '#fff' : 'var(--text-muted)',
              padding: '8px 16px', 
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              border: slot.is_occupied ? 'none' : '1px solid var(--border-color)'
            }}>
              {slot.is_occupied ? (slot.vehicle_plate || 'OCC') : slot.slot_number}
            </div>
            
            <div style={{ color: slot.is_occupied ? 'var(--primary)' : 'var(--border-color)' }}>
              {activeTab === 'bike' ? (
                <AerialBikeIcon size={56} isOccupied={slot.is_occupied} />
              ) : (
                <AerialCarIcon size={56} isOccupied={slot.is_occupied} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllotmentView;
