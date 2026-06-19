import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../../utils/api';
import { addExtraSlot as addExtraSlotApi, updateSlotStatus } from '../../api/parkingApi';
import { Loader2, Plus, X, Clock, Calendar, LogIn, LogOut, Receipt, AlertCircle } from 'lucide-react';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const AerialCarIcon = ({ size = 24, isOccupied = false }) => {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

/** Returns { hours, minutes } between two Date objects */
const calcDuration = (from, to) => {
  const diffMs = Math.max(0, to - from);
  const totalMinutes = Math.floor(diffMs / 60000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60, totalMinutes };
};

// ─── Invoice Modal ────────────────────────────────────────────────────────────
const CheckOutInvoice = ({ slot, facility, linkedBooking, onConfirm, onCancel, loading }) => {
  const now = new Date();
  const checkInTime = slot.occupied_since ? new Date(slot.occupied_since) : null;
  const { hours, minutes, totalMinutes } = checkInTime ? calcDuration(checkInTime, now) : { hours: 0, minutes: 0, totalMinutes: 0 };
  const hourlyRate = Number(facility?.hourly_rate || 0);

  // Billing: round up to next full hour
  const billedHours = Math.ceil(totalMinutes / 60) || 1;
  const parkingFee = billedHours * hourlyRate;

  // Overstay: if there was a booking with an end_time that has already passed
  let overstayFee = 0;
  let overstayHours = 0;
  if (linkedBooking && linkedBooking.end_time) {
    const bookingEnd = new Date(linkedBooking.end_time);
    if (now > bookingEnd) {
      const overstay = calcDuration(bookingEnd, now);
      overstayHours = Math.ceil(overstay.totalMinutes / 60);
      overstayFee = overstayHours * hourlyRate * 1.5; // 1.5× overstay rate
    }
  }

  const totalDue = parkingFee + overstayFee;

  return (
    <div style={{ marginTop: '8px' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Receipt size={18} /> Check-Out Invoice
      </h4>

      <div style={{ background: 'var(--bg-color)', borderRadius: '10px', padding: '16px', marginBottom: '16px', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Vehicle</span>
          <span style={{ fontWeight: 'bold' }}>{slot.vehicle_plate || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Check-In</span>
          <span>{checkInTime ? fmt(checkInTime) : 'Unknown'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Check-Out</span>
          <span>{fmt(now)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Duration</span>
          <span>{hours}h {minutes}m → billed as {billedHours}h</span>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Parking Fee ({billedHours}h × {hourlyRate.toLocaleString()} UGX)</span>
          <span>{parkingFee.toLocaleString()} UGX</span>
        </div>
        {overstayFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--warning)' }}>
            <span>⚠️ Overstay ({overstayHours}h × 1.5×)</span>
            <span>{overstayFee.toLocaleString()} UGX</span>
          </div>
        )}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem' }}>
          <span>Total Due</span>
          <span style={{ color: 'var(--primary)' }}>{totalDue.toLocaleString()} UGX</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          className="btn-primary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          Confirm Check-Out
        </button>
      </div>
    </div>
  );
};

// ─── Check-In Form ────────────────────────────────────────────────────────────
const CheckInForm = ({ onConfirm, onCancel, loading }) => {
  const [plate, setPlate] = useState('');
  return (
    <div style={{ marginTop: '8px' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <LogIn size={18} /> Check In Driver
      </h4>
      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vehicle Number Plate</label>
      <input
        type="text"
        className="input-field"
        placeholder="e.g. UAA 259B"
        value={plate}
        onChange={e => setPlate(e.target.value.toUpperCase())}
        style={{ marginBottom: '12px', marginTop: '6px' }}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          className="btn-primary"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onConfirm(plate)}
          disabled={loading || !plate.trim()}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Mark Occupied
        </button>
      </div>
    </div>
  );
};

// ─── Slot Detail Popup ────────────────────────────────────────────────────────
const SlotDetailPopup = ({ slot, isBike, facility, isOwnerContext, onClose, onBook, onSlotUpdated }) => {
  const [view, setView] = useState('info'); // 'info' | 'checkin' | 'checkout'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!slot) return null;

  const hasBookings = slot.active_bookings && slot.active_bookings.length > 0;
  const isPhysicallyOccupied = slot.is_occupied;
  const isBooked = isPhysicallyOccupied || hasBookings;

  // The active booking with the earliest start time that is currently ongoing (for overstay calc)
  const ongoingBooking = hasBookings
    ? slot.active_bookings.find(b => new Date(b.start_time) <= new Date() && new Date(b.end_time) >= new Date())
    : null;

  const handleCheckIn = async (plate) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await updateSlotStatus(slot.id, { is_occupied: true, vehicle_plate: plate });
      onSlotUpdated && onSlotUpdated(updated);
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await updateSlotStatus(slot.id, { is_occupied: false, vehicle_plate: null });
      onSlotUpdated && onSlotUpdated(updated);
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%', maxWidth: '440px',
          padding: '28px', position: 'relative', borderRadius: '16px',
          border: `2px solid ${isBooked ? 'var(--danger)' : 'var(--success)'}`,
          maxHeight: '90vh', overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--danger)' }}>
          <X size={14} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          {isBike ? <AerialBikeIcon size={36} isOccupied={isBooked} /> : <AerialCarIcon size={36} isOccupied={isBooked} />}
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{slot.slot_number}</h3>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              {isPhysicallyOccupied && (
                <span className="badge badge-danger">Physically Occupied</span>
              )}
              {hasBookings && !isPhysicallyOccupied && (
                <span className="badge badge-warning">Has Upcoming Bookings</span>
              )}
              {!isBooked && (
                <span className="badge badge-success">Available</span>
              )}
            </div>
          </div>
        </div>

        {actionError && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
            <AlertCircle size={16} /> {actionError}
          </div>
        )}

        {/* ── INFO VIEW ── */}
        {view === 'info' && (
          <>
            {/* Physically occupied info */}
            {isPhysicallyOccupied && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <Clock size={13} style={{ color: 'var(--danger)' }} />
                  <span style={{ fontSize: '0.85rem' }}><strong>In since:</strong> {fmt(slot.occupied_since)}</span>
                </div>
                {slot.vehicle_plate && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🚗 {slot.vehicle_plate}</div>
                )}
                {!hasBookings && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    ⚠️ No linked digital booking found. Vehicle was manually checked in.
                  </div>
                )}
              </div>
            )}

            {/* Digital Booking Schedule */}
            {hasBookings && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontWeight: '600', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Calendar size={15} /> Booking Schedule
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {slot.active_bookings.map((bk, idx) => {
                    const now = new Date();
                    const start = new Date(bk.start_time);
                    const end = new Date(bk.end_time);
                    const isActive = start <= now && end >= now;
                    const isOverstay = isPhysicallyOccupied && now > end;
                    return (
                      <div key={bk.id || idx} style={{ background: isOverstay ? 'rgba(245,158,11,0.1)' : 'var(--danger-bg)', border: `1px solid ${isOverstay ? 'var(--warning)' : 'var(--danger)'}`, borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Booking #{idx + 1}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {isOverstay && <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>OVERSTAY</span>}
                            {isActive && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>ACTIVE</span>}
                            <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>{bk.status}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <Clock size={12} style={{ color: 'var(--success)' }} />
                          <span style={{ fontSize: '0.82rem' }}><strong>From:</strong> {fmt(bk.start_time)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <Clock size={12} style={{ color: isOverstay ? 'var(--warning)' : 'var(--danger)' }} />
                          <span style={{ fontSize: '0.82rem' }}><strong>Free at:</strong> {fmt(bk.end_time)}</span>
                        </div>
                        {bk.vehicle_plate && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>🚗 {bk.vehicle_plate}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isPhysicallyOccupied && !hasBookings && (
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                This slot is fully available — no vehicle, no upcoming bookings.
              </p>
            )}

            {/* ── Owner Actions ── */}
            {isOwnerContext && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                {!isPhysicallyOccupied && (
                  <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={() => setView('checkin')}
                  >
                    <LogIn size={16} /> Check In Vehicle
                  </button>
                )}
                {isPhysicallyOccupied && (
                  <button
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontWeight: '600' }}
                    onClick={() => setView('checkout')}
                  >
                    <LogOut size={16} /> Check Out &amp; Invoice
                  </button>
                )}
              </div>
            )}

            {/* ── Driver Action ── */}
            {onBook && (
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => { onClose(); onBook(slot); }}
              >
                Book This Slot
              </button>
            )}
          </>
        )}

        {/* ── CHECK-IN VIEW ── */}
        {view === 'checkin' && (
          <CheckInForm
            loading={actionLoading}
            onConfirm={handleCheckIn}
            onCancel={() => setView('info')}
          />
        )}

        {/* ── CHECK-OUT VIEW ── */}
        {view === 'checkout' && (
          <CheckOutInvoice
            slot={slot}
            facility={facility}
            linkedBooking={ongoingBooking}
            loading={actionLoading}
            onConfirm={handleCheckOut}
            onCancel={() => setView('info')}
          />
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AllotmentView = ({ facility, onBookSlot }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [activeTab, setActiveTab] = useState('car');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Owner context = no booking callback (admin/owner can check in/out)
  const isOwnerContext = !onBookSlot;

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/facilities/${facility.id}`);
      setSlots(res.data.data.slots || []);
    } catch {
      setError('Failed to load parking slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!facility) return;

    fetchSlots();

    const socket = io(SOCKET_URL);
    socket.emit('join_facility', facility.id);

    socket.on('slot_updated', (data) => {
      setSlots(prev => prev.map(s =>
        s.id === data.id ? { ...s, is_occupied: data.is_occupied, vehicle_plate: data.vehicle_plate, occupied_since: data.occupied_since } : s
      ));
    });

    socket.on('slot_added', (newSlot) => {
      setSlots(prev => prev.find(s => s.id === newSlot.id) ? prev : [...prev, newSlot]);
    });

    return () => socket.disconnect();
  }, [facility]);

  if (!facility) return <div>Please select a facility</div>;
  if (loading) return <div>Loading arrangement...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  const handleAddSlot = async () => {
    try {
      setIsAddingSlot(true);
      const newSlot = await addExtraSlotApi(facility.id, activeTab);
      setSlots(prev => prev.find(s => s.id === newSlot.id) ? prev : [...prev, newSlot]);
    } catch {
      alert('Failed to add slot');
    } finally {
      setIsAddingSlot(false);
    }
  };

  const handleSlotUpdated = (updatedSlot) => {
    setSlots(prev => prev.map(s => s.id === updatedSlot.id ? { ...s, ...updatedSlot } : s));
  };

  const displayedSlots = slots.filter(s => {
    const isBike = s.slot_number.toLowerCase().includes('bike');
    return activeTab === 'bike' ? isBike : !isBike;
  });

  const isSlotBooked = (slot) =>
    slot.is_occupied || (slot.active_bookings && slot.active_bookings.length > 0);

  const isBikeTab = activeTab === 'bike';

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: '400px' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['car', 'bike'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: activeTab === tab ? 'var(--primary)' : 'var(--bg-color)', color: activeTab === tab ? '#fff' : 'var(--text-muted)', borderRadius: '8px', fontWeight: 'bold', border: activeTab === tab ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}>
              {tab === 'car' ? <AerialCarIcon size={18} isOccupied={activeTab === tab} /> : <AerialBikeIcon size={18} isOccupied={activeTab === tab} />}
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Add Slot only for owners/admins */}
        {isOwnerContext && (
          <button className="btn-primary" onClick={handleAddSlot} disabled={isAddingSlot} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAddingSlot ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Add {activeTab === 'car' ? 'Car' : 'Bike'} Slot
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--danger)', display: 'inline-block' }} /> Booked / Occupied
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px dashed var(--border-color)', display: 'inline-block' }} /> Available
        </span>
        <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Click any slot for details</span>
      </div>

      {/* Slot Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {displayedSlots.map((slot) => {
          const booked = isSlotBooked(slot);
          return (
            <div
              key={slot.id}
              onClick={() => setSelectedSlot(slot)}
              title="Click for details"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '24px 32px',
                border: booked ? '2px solid var(--danger)' : '2px dashed var(--border-color)',
                borderRadius: '12px',
                background: booked ? 'var(--danger-bg)' : 'transparent',
                transition: 'all 0.2s ease', minHeight: '120px', cursor: 'pointer',
              }}
            >
              <div style={{ background: booked ? 'var(--danger)' : 'var(--bg-color)', color: booked ? '#fff' : 'var(--text-muted)', padding: '8px 16px', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', border: booked ? 'none' : '1px solid var(--border-color)' }}>
                {slot.is_occupied ? (slot.vehicle_plate || 'OCC') : slot.slot_number}
              </div>
              <div style={{ color: booked ? 'var(--danger)' : 'var(--border-color)' }}>
                {isBikeTab ? <AerialBikeIcon size={56} isOccupied={booked} /> : <AerialCarIcon size={56} isOccupied={booked} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slot Detail Popup */}
      {selectedSlot && (
        <SlotDetailPopup
          slot={selectedSlot}
          isBike={isBikeTab}
          facility={facility}
          isOwnerContext={isOwnerContext}
          onClose={() => setSelectedSlot(null)}
          onBook={onBookSlot || null}
          onSlotUpdated={handleSlotUpdated}
        />
      )}
    </div>
  );
};

export default AllotmentView;
