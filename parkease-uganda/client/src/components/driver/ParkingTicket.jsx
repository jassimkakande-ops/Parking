import React from 'react';
import { Download } from 'lucide-react';

const ParkingTicket = ({ booking, facility }) => {
  if (!booking || !facility) return null;

  const handleDownload = () => {
    // Simple approach: Trigger browser print dialog for just the ticket content
    // Users can "Save as PDF" from the print dialog.
    const printContent = document.getElementById('printable-ticket').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; background: #f0f0f0;">
        ${printContent}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React bindings properly
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* The Printable Ticket Area */}
      <div 
        id="printable-ticket" 
        style={{
          background: '#fff',
          color: '#000',
          padding: '32px',
          borderRadius: '16px',
          border: '2px dashed #ccc',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'left'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '16px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>PARKEASE</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Digital Parking Ticket</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Facility</span>
            <strong style={{ fontSize: '14px' }}>{facility.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Address</span>
            <strong style={{ fontSize: '14px' }}>{facility.address}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Vehicle Plate</span>
            <strong style={{ fontSize: '16px' }}>{booking.vehicle_plate}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Slot Number</span>
            <strong style={{ fontSize: '18px' }}>{booking.slot_number || booking.slot_id}</strong>
          </div>
          <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Arrival Time</span>
            <strong style={{ fontSize: '14px' }}>{new Date(booking.intended_arrival_time || booking.start_time).toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>End Time</span>
            <strong style={{ fontSize: '14px' }}>{new Date(booking.end_time).toLocaleString()}</strong>
          </div>
          <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Total Paid</span>
            <strong style={{ fontSize: '20px', color: '#000' }}>{Number(booking.paid || booking.total_amount || 0).toLocaleString()} UGX</strong>
          </div>
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#888', wordBreak: 'break-all' }}>
            REF: {booking.reference || booking.id}
          </div>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${booking.id}`} alt="QR Code" style={{ marginTop: '16px', width: '100px', height: '100px' }} />
        </div>
      </div>

      <button className="btn-secondary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Download size={18} /> Download Ticket PDF
      </button>
    </div>
  );
};

export default ParkingTicket;
