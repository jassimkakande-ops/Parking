import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Smartphone, Car, Facebook, Twitter, Instagram, MessageCircle, Send } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import api from '../utils/api'; // For contact form

const libraries = ['places'];

// Helper to get formatted local time for datetime-local input
const getLocalISO = (date) => {
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzoffset).toISOString().slice(0, 16);
};

const Home = () => {
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [autocomplete, setAutocomplete] = useState(null);

  // Search State
  const [parkingType, setParkingType] = useState('hourly'); // 'hourly' or 'monthly'

  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  nextHour.setMinutes(0, 0, 0);

  const laterHour = new Date(nextHour.getTime() + 2 * 60 * 60 * 1000);

  const [startTime, setStartTime] = useState(getLocalISO(nextHour));
  const [endTime, setEndTime] = useState(getLocalISO(laterHour));

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  const onLoad = (autoC) => setAutocomplete(autoC);

  const performSearch = (lat, lng, name) => {
    navigate('/search', {
      state: {
        lat,
        lng,
        name,
        parkingType,
        startTime: parkingType === 'hourly' ? startTime : null,
        endTime: parkingType === 'hourly' ? endTime : null
      }
    });
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        performSearch(
          place.geometry.location.lat(),
          place.geometry.location.lng(),
          place.formatted_address || place.name
        );
      } else {
        performSearch(null, null, "Kampala, Uganda");
      }
    }
  };

  const handleSearchClick = () => {
    // If they just clicked search without picking from autocomplete
    performSearch(null, null, "Kampala, Uganda");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setContactStatus('');
    try {
      await api.post('/contact', contactForm);
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      setContactStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="home-container" style={{ background: 'var(--bg-color)', color: 'var(--text-main)', minHeight: '100vh' }}>
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
              <button
                onClick={() => setParkingType('hourly')}
                style={{ flex: 1, padding: '12px', background: parkingType === 'hourly' ? 'var(--surface-color)' : 'transparent', borderRadius: '6px', border: 'none', fontWeight: 'bold', boxShadow: parkingType === 'hourly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: parkingType === 'hourly' ? 'var(--text-main)' : 'var(--text-muted)' }}
              >
                Hourly/Daily
              </button>
              <button
                onClick={() => setParkingType('monthly')}
                style={{ flex: 1, padding: '12px', background: parkingType === 'monthly' ? 'var(--surface-color)' : 'transparent', borderRadius: '6px', border: 'none', fontWeight: 'bold', boxShadow: parkingType === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: parkingType === 'monthly' ? 'var(--text-main)' : 'var(--text-muted)' }}
              >
                Monthly
              </button>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
              <Search size={20} color="var(--primary)" style={{ marginRight: '12px' }} />
              {isLoaded ? (
                <div style={{ flex: 1 }}>
                  <Autocomplete
                    onLoad={onLoad}
                    onPlaceChanged={onPlaceChanged}
                    options={{ componentRestrictions: { country: 'ug' } }}
                  >
                    <input
                      type="text"
                      placeholder="Where are you going?"
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1.1rem', color: 'var(--text-main)' }}
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

            {/* Time Pickers or Monthly Suggestion */}
            {parkingType === 'hourly' ? (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Start Time</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
                    <Calendar size={18} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>End Time</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg-color)' }}>
                    <Calendar size={18} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'var(--primary-glow)', borderRadius: '8px', border: '1px solid var(--primary)', color: 'var(--primary)', textAlign: 'center' }}>
                <strong>Looking for long-term parking?</strong><br />
                We'll show you facilities that offer monthly passes.
              </div>
            )}

            <button className="btn-primary" onClick={handleSearchClick} style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}>
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
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-color)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Search size={48} /></div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Look</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Search and compare prices at hundreds of parking facilities across Uganda.</p>
          </div>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-color)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Smartphone size={48} /></div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Book</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Pay securely and receive a digital parking pass instantly in the app.</p>
          </div>
          <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-color)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Car size={48} /></div>
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
            <p style={{ color: 'var(--text-main)', fontWeight: '500', marginTop: '8px' }}>A fivestar parking experience</p>
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
              <a href="/search" onClick={(e) => { e.preventDefault(); performSearch(null, null, "Namboole Stadium"); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Namboole Stadium Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); performSearch(null, null, "Lugogo Arena"); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Lugogo Arena Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); performSearch(null, null, "Serena Hotel Kampala"); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Serena Hotel Events Parking</a>
            </div>
            <button className="btn-primary" onClick={() => performSearch()} style={{ padding: '12px 24px' }}>View All Stadiums</button>
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
              <a href="/search" onClick={(e) => { e.preventDefault(); setParkingType('monthly'); performSearch(null, null, "Kampala"); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Kampala Monthly Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); setParkingType('monthly'); performSearch(null, null, "Entebbe"); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Entebbe Monthly Parking</a>
              <a href="/search" onClick={(e) => { e.preventDefault(); setParkingType('monthly'); performSearch(null, null, "Jinja"); }} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>Book Jinja Monthly Parking</a>
            </div>
            <button className="btn-primary" onClick={() => { setParkingType('monthly'); performSearch(); }} style={{ padding: '12px 24px' }}>View All Cities</button>
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

      {/* 5. About ParkEase Uganda */}
      <div style={{ padding: '80px 20px', background: 'var(--surface-color)', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '24px' }}>About ParkEase Uganda</h2>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-muted)', marginBottom: '24px' }}>
            ParkEase Uganda was founded with a simple mission: to eliminate the stress of parking in our rapidly growing cities.
            We believe that finding a secure parking spot shouldn't be the hardest part of your journey.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
            By partnering with hundreds of secure parking facilities across Kampala, Entebbe, and Jinja, we provide an intuitive platform
            that allows you to search, compare, and instantly book your spot using mobile money or card. Whether you're commuting to work,
            attending a major event, or looking for secure overnight parking, ParkEase is your trusted partner on the road.
          </p>
        </div>
      </div>

      {/* 6. Contact Us */}
      <div style={{ padding: '80px 20px', background: 'var(--bg-color)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--surface-color)', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>Contact Us</h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '32px' }}>Have questions? We'd love to hear from you.</p>

          {contactStatus === 'success' && (
            <div style={{ padding: '16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', fontWeight: 'bold' }}>
              Message sent successfully! We'll get back to you soon.
            </div>
          )}

          {contactStatus === 'error' && (
            <div style={{ padding: '16px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', fontWeight: 'bold' }}>
              Failed to send message. Please try again later.
            </div>
          )}

          <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Your Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={contactForm.name}
                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
              <input
                type="email"
                required
                className="input-field"
                value={contactForm.email}
                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message</label>
              <textarea
                required
                rows="5"
                className="input-field"
                style={{ resize: 'vertical' }}
                value={contactForm.message}
                onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isSending} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', fontSize: '1.1rem' }}>
              {isSending ? 'Sending...' : <><Send size={20} /> Send Message</>}
            </button>
          </form>
        </div>
      </div>

      {/* 7. Footer */}
      <footer style={{ background: '#111827', color: '#fff', padding: '60px 20px 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '40px', marginBottom: '40px' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '16px' }}>ParkEase Uganda</div>
              <p style={{ color: '#9ca3af', lineHeight: '1.6', marginBottom: '24px' }}>
                Simplifying parking across Uganda with seamless digital bookings and secure cashless payments.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Facebook */}
                <a href="#" style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', display: 'flex' }}><Facebook size={20} /></a>
                {/* Twitter (X) */}
                <a href="#" style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', display: 'flex' }}><Twitter size={20} /></a>
                {/* Instagram */}
                <a href="#" style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', display: 'flex' }}><Instagram size={20} /></a>
                {/* WhatsApp */}
                <a href="#" style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%', display: 'flex' }}><MessageCircle size={20} /></a>
              </div>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>About Us</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Careers</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Press</a></li>
              </ul>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Help Center</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Contact Us</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Cancellation Policy</a></li>
              </ul>
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms of Service</a></li>
                <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #374151', paddingTop: '30px', textAlign: 'center', color: '#6b7280', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <span>© 2026 ParkEase Uganda. All rights reserved.</span>
            <span>Parking at your own terms </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
