import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../utils/api';
import { addExtraSlot as addExtraSlotApi } from '../../api/parkingApi';
import { Loader2, Plus, X, Clock, Calendar } from 'lucide-react';

const AerialCarIcon = ({ size = 24, isOccupied = false }) => {
  const color = isOccupied ? '#fff' : 'var(--text-muted)';
  const strokeColor = isOccupied ? '#fff' : 'var(--border-color)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="14" height="18" rx="3" stroke={strokeColor} strokeWidth="2" fill={isOccupied ? 'var(--danger)' : 'none'} />
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
      <circle cx="12" cy="6" r="2" stroke={strokeColor} strokeWidth="2" fill={isOccupied ? 'var(--danger)' : 'none'} />
      <rect x="10" y="9" width="4" height="10" rx="2" stroke={strokeColor} strokeWidth="2" fill={isOccupied ? 'var(--danger)' : 'none'} />
      <path d="M9 13H7" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 13H17" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// Popup that appears when a slot is clicked
const SlotDetailPopup = ({ slot, isBike, onClose, onBook }) => {
  if (!slot) return null;

  const hasBookings = slot.active_bookings && slot.active_bookings.length > 0;
  const isBooked = slot.is_occupied || hasBookings;

  const fmt = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9998,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%', maxWidth: '420px',
          padding: '28px',
          position: 'relative',
          borderRadius: '16px',
          border: isBooked ? '2px solid var(--danger)' : '2px solid var(--success)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'var(--danger-bg)', border: '1px solid var(--danger)',
            borderRadius: '50%', width: '28px', height: '28px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--danger)',
          }}
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          {isBike
            ? <AerialBikeIcon size={36} isOccupied={isBooked} />
            : <AerialCarIcon size={36} isOccupied={isBooked} />}
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{slot.slot_number}</h3>
            <span className={`badge ${isBooked ? 'badge-danger' : 'badge-success'}`} style={{ marginTop: '4px', display: 'inline-block' }}>
              {isBooked ? 'Booked / Occupied' : 'Available'}
            </span>
          </div>
        </div>

        {/* Booking schedule */}
        {hasBookings ? (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} /> Upcoming Bookings
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {slot.active_bookings.map((bk, idx) => (
                <div
                  key={bk.id || idx}
                  style={{
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Booking #{idx + 1}</span>
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{bk.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <Clock size={13} style={{ color: 'var(--danger)' }} />
                    <span style={{ fontSize: '0.85rem' }}>
                      <strong>From:</strong> {fmt(bk.start_time)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <Clock size={13} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '0.85rem' }}>
                      <strong>Free at:</strong> {fmt(bk.end_time)}
                    </span>
                  </div>
                  {bk.vehicle_plate && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      🚗 {bk.vehicle_plate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            This slot has no upcoming bookings — it's free to book!
          </p>
        )}

        {/* Book button (only shown when onBook prop is provided — i.e. driver context) */}
        {onBook && (
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '4px' }}
            onClick={() => { onClose(); onBook(slot); }}
          >
            Book This Slot
          </button>
        )}
      </div>
    </div>
  );
};

const AllotmentView = ({ facility, onBookSlot }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [activeTab, setActiveTab] = useState('car');
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (!facility) return;

    const fetchSlots = async () => {
      try {
        setLoading(true);
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

    const socket = io(SOCKET_URL);
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
  if (loading) return <div>Loading arrangement...</div>;
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

  // A slot is "booked" (red) if it is currently occupied OR has any upcoming bookings
  const isSlotBooked = (slot) =>
    slot.is_occupied || (slot.active_bookings && slot.active_bookings.length > 0);

  const isBikeTab = activeTab === 'bike';

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
        {/* Only show Add Slot button for owners/admins, not drivers */}
        {!onBookSlot && (
          <button
            className="btn-primary"
            onClick={handleAddSlot}
            disabled={isAddingSlot}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isAddingSlot ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Add {activeTab === 'car' ? 'Car' : 'Bike'} Slot
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--danger)', display: 'inline-block' }} />
          Booked / Occupied
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px dashed var(--border-color)', display: 'inline-block' }} />
          Available
        </span>
        <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Click any slot for details</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {displayedSlots.map((slot) => {
          const booked = isSlotBooked(slot);
          return (
            <div
              key={slot.id}
              onClick={() => setSelectedSlot(slot)}
              title="Click to see booking details"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 32px',
                border: booked ? '2px solid var(--danger)' : '2px dashed var(--border-color)',
                borderRadius: '12px',
                background: booked ? 'var(--danger-bg)' : 'transparent',
                transition: 'all 0.2s ease',
                minHeight: '120px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                background: booked ? 'var(--danger)' : 'var(--bg-color)',
                color: booked ? '#fff' : 'var(--text-muted)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 'bold',
                border: booked ? 'none' : '1px solid var(--border-color)'
              }}>
                {slot.is_occupied ? (slot.vehicle_plate || 'OCC') : slot.slot_number}
              </div>

              <div style={{ color: booked ? 'var(--danger)' : 'var(--border-color)' }}>
                {isBikeTab ? (
                  <AerialBikeIcon size={56} isOccupied={booked} />
                ) : (
                  <AerialCarIcon size={56} isOccupied={booked} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slot detail popup */}
      {selectedSlot && (
        <SlotDetailPopup
          slot={selectedSlot}
          isBike={isBikeTab}
          onClose={() => setSelectedSlot(null)}
          onBook={onBookSlot || null}
        />
      )}
    </div>
  );
};

export default AllotmentView;
