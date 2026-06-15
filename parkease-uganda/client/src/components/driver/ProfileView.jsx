import React, { useContext } from 'react';
import { User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const ProfileView = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="animate-fade-in" style={{ padding: '24px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--border-color)', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <User size={24} /> My Profile
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px', display: 'block' }}>Full Name</label>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{user?.full_name}</div>
        </div>
        
        <div>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px', display: 'block' }}>Email</label>
          <div style={{ fontSize: '1.1rem' }}>{user?.email}</div>
        </div>

        <div>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px', display: 'block' }}>Phone Number</label>
          <div style={{ fontSize: '1.1rem' }}>{user?.phone_number}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
