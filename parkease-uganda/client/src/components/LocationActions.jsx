import React from 'react';
import { Share2, Navigation } from 'lucide-react';

/**
 * Generates a Google Maps directions URL for the given coordinates.
 */
const getMapsUrl = (lat, lng, name) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(name)}`;

/**
 * LocationActions renders two buttons:
 *  - "Get Directions" — opens Google Maps in a new tab
 *  - "Share"          — uses the Web Share API if available, falls back to copying the link
 *
 * Props:
 *   lat      {number}  — latitude of the parking facility
 *   lng      {number}  — longitude of the parking facility
 *   name     {string}  — display name of the facility
 *   compact  {boolean} — if true, renders icon-only buttons (for tight layouts)
 */
const LocationActions = ({ lat, lng, name, compact = false }) => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng);

  const mapsUrl = hasCoords
    ? getMapsUrl(parsedLat, parsedLng, name)
    : null;

  const handleShare = async () => {
    const shareData = {
      title: `Parking at ${name}`,
      text: `Get directions to ${name} parking on Google Maps`,
      url: mapsUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled the share — do nothing
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      // Fallback: copy the Google Maps link to clipboard
      try {
        await navigator.clipboard.writeText(mapsUrl);
        alert('📋 Google Maps link copied to clipboard!');
      } catch {
        // Last resort: open the share URL directly
        window.open(mapsUrl, '_blank');
      }
    }
  };

  const buttonBase = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: compact ? '8px 10px' : '10px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: '1px solid var(--border-color)',
    transition: 'all 0.2s ease',
    background: 'var(--surface-color)',
    color: 'var(--text-main)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {/* Get Directions — opens Google Maps */}
      {hasCoords ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Get Directions on Google Maps"
          style={{ ...buttonBase, color: 'var(--primary)', borderColor: 'var(--primary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-color)'; e.currentTarget.style.color = 'var(--primary)'; }}
        >
          <Navigation size={16} />
          {!compact && 'Directions'}
        </a>
      ) : (
        <span
          title="No map location set for this facility"
          style={{ ...buttonBase, opacity: 0.4, cursor: 'not-allowed', color: 'var(--text-muted)' }}
        >
          <Navigation size={16} />
          {!compact && 'Directions'}
        </span>
      )}

      {/* Share location link */}
      <button
        type="button"
        title={hasCoords ? 'Share location link' : 'No map location set for this facility'}
        disabled={!hasCoords}
        style={{ ...buttonBase, opacity: hasCoords ? 1 : 0.4, cursor: hasCoords ? 'pointer' : 'not-allowed' }}
        onClick={hasCoords ? handleShare : undefined}
        onMouseEnter={e => { if (hasCoords) e.currentTarget.style.background = 'var(--border-color)'; }}
        onMouseLeave={e => { if (hasCoords) e.currentTarget.style.background = 'var(--surface-color)'; }}
      >
        <Share2 size={16} />
        {!compact && 'Share'}
      </button>
    </div>
  );
};

export default LocationActions;
