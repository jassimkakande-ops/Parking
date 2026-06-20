import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate('/search');
  };

  return (
    <div className="home-container" style={{ background: 'var(--bg-color)', color: 'var(--text-main)', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* 1. Hero Section */}
      <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
        
        {/* Left: Search Box */}
        <div style={{ flex: '1 1 500px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '24px', lineHeight: '1.2' }}>
            Parking made easy, wherever you go
          </h1>
          
          <div style={{
            background: 'var(--surface-color)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '8px', padding: '4px' }}>
              <button style={{ flex: 1, padding: '12px', background: 'var(--surface-color)', borderRadius: '6px', border: 'none', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: 'var(--text-main)' }}>Hourly/Daily</button>
              <button style={{ flex: 1, padding: '12px', background: 'transparent', borderRadius: '6px', border: 'none', color: 'var(--text-muted)' }}>Monthly</button>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
              <Search size={20} color="var(--primary)" style={{ marginRight: '12px' }} />
              <input 
                type="text" 
                placeholder="Where are you going?" 
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1.1rem', color: 'var(--text-main)' }} 
              />
            </div>

            {/* Time Pickers (Mocked for visual similarity) */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
                <Calendar size={20} color="var(--text-muted)" style={{ marginRight: '12px' }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start time</div>
                  <div style={{ fontWeight: '500' }}>Today, 11:30 AM</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>End time</div>
                  <div style={{ fontWeight: '500' }}>Today, 2:30 PM</div>
                </div>
              </div>
            </div>

            <button className="btn-primary" onClick={handleSearch} style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}>
              Find Parking Spots
            </button>
          </div>
        </div>

        {/* Right: Hero Image */}
        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80" 
            alt="Woman walking in parking lot" 
            style={{ width: '100%', maxWidth: '600px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} 
          />
        </div>
      </div>

      {/* 2. How SpotHero Works */}
      <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--surface-color)' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '60px' }}>How ParkEase Works</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-color)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🔍</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Look</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Search and compare prices at hundreds of parking facilities across Uganda.</p>
          </div>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-color)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📱</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Book</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Pay securely and receive a digital parking pass instantly in the app.</p>
          </div>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-color)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🚗</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Park</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>When you arrive, follow the instructions included in your pass, park, and go!</p>
          </div>
        </div>
      </div>

      {/* 2.5. Stats & Featured In */}
      <div style={{ padding: '60px 20px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-evenly', flexWrap: 'wrap', gap: '40px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>4.8 <span style={{ color: '#F59E0B', fontSize: '2rem' }}>★★★★★</span></div>
            <p style={{ color: 'var(--text-main)', fontWeight: '500', marginTop: '8px' }}>We have a 4.8 in the App Store</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>100+</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--text-muted)' }}>MILLION</div>
            <p style={{ color: 'var(--text-main)', fontWeight: '500', marginTop: '8px' }}>We've parked over 100 million cars</p>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>13+</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--text-muted)' }}>YEARS</div>
            <p style={{ color: 'var(--text-main)', fontWeight: '500', marginTop: '8px' }}>We've been around since 2011</p>
          </div>
        </div>
      </div>

      {/* 3. Event Parking */}
      <div style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', background: 'var(--surface-color)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: '1 1 400px' }}>
            <img 
              src="https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=80" 
              alt="Stadium Event" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '350px' }} 
            />
          </div>
          <div style={{ flex: '1 1 400px', padding: '40px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Event Parking</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px', fontSize: '1.1rem' }}>
              Enjoy the convenience of booking a parking spot at the venue ahead of time, ensuring you have a space when you arrive for games, concerts, and more.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              <a href="/search" onClick={(e) => { e.preventDefault(); handleSearch(); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Namboole Stadium Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); handleSearch(); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Lugogo Arena Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); handleSearch(); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Serena Hotel Events Parking</a>
            </div>
            <button className="btn-primary" onClick={handleSearch} style={{ padding: '12px 24px' }}>View All Stadiums</button>
          </div>
        </div>
      </div>

      {/* 4. Monthly Parking */}
      <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap-reverse', background: 'var(--surface-color)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: '1 1 400px', padding: '40px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Monthly Parking</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px', fontSize: '1.1rem' }}>
              Search for secure monthly parking facilities that make it easy to park near your home or office.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              <a href="/search" onClick={(e) => { e.preventDefault(); handleSearch(); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Kampala Monthly Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); handleSearch(); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Entebbe Monthly Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); handleSearch(); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Jinja Monthly Parking</a>
            </div>
            <button className="btn-primary" onClick={handleSearch} style={{ padding: '12px 24px' }}>View All Cities</button>
          </div>
          <div style={{ flex: '1 1 400px' }}>
            <img 
              src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80" 
              alt="Monthly Parking Garage" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '350px' }} 
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
