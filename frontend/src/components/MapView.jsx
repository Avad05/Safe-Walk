import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to recenter the map when coordinates change
const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords, map]);
  return null;
};

// Generate dummy vehicles around a given lat/lng
const generateNearbyVehicles = (lat, lng) => {
  const names = {
    Ambulance: [
      { op: 'Dr. Rajesh Kumar', ph: '+91 98765 43210' },
      { op: 'Dr. Priya Sharma', ph: '+91 98765 43211' },
      { op: 'Dr. Amit Patel', ph: '+91 98765 43212' },
      { op: 'Dr. Sneha Mehta', ph: '+91 98765 43213' },
      { op: 'Dr. Kavita Rao', ph: '+91 98765 43214' },
    ],
    Fire: [
      { op: 'Officer Suresh Yadav', ph: '+91 98765 43220' },
      { op: 'Officer Vikram Singh', ph: '+91 98765 43221' },
      { op: 'Officer Ramesh Joshi', ph: '+91 98765 43222' },
    ],
    Police: [
      { op: 'Constable Arjun Desai', ph: '+91 98765 43230' },
      { op: 'Inspector Ravi Malhotra', ph: '+91 98765 43231' },
      { op: 'Constable Neha Kapoor', ph: '+91 98765 43232' },
      { op: 'SI Sanjay Gupta', ph: '+91 98765 43233' },
    ],
    Accident: [
      { op: 'Rescue Officer Deepak Shah', ph: '+91 98765 43240' },
      { op: 'Rescue Officer Kavita Reddy', ph: '+91 98765 43241' },
    ],
    Other: [
      { op: 'Emergency Officer Manoj Kumar', ph: '+91 98765 43250' },
      { op: 'Emergency Officer Pooja Jain', ph: '+91 98765 43251' },
    ],
  };

  const vehicles = [];
  let id = 101;
  const types = Object.keys(names);

  // Generate 20 vehicles at random positions inside the 3km radius
  for (let i = 0; i < 20; i++) {
    const type = types[i % types.length];
    const crew = names[type][i % names[type].length];
    // Random angle and distance (within ~3km ≈ 0.027 degrees)
    const angle = Math.random() * 2 * Math.PI;
    const dist = 0.005 + Math.random() * 0.022;
    vehicles.push({
      id: id++,
      type,
      unitId: `${type.substring(0, 3).toUpperCase()}-${String(id).padStart(3, '0')}`,
      operatorName: crew.op,
      contactNumber: crew.ph,
      lat: lat + dist * Math.sin(angle),
      lng: lng + dist * Math.cos(angle),
      status: 'Available',
    });
  }
  return vehicles;
};

const MapView = ({ incident, vehicles: _backendVehicles, onDispatch }) => {
  const [incidentCoords, setIncidentCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Geocode the incident location to get lat/lng
  useEffect(() => {
    if (!incident?.location) return;

    // Check if location already contains coordinates (e.g., "Lat: 19.123, Lng: 72.456")
    const coordMatch = incident.location.match(/Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/i);
    if (coordMatch) {
      setIncidentCoords([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
      return;
    }

    const geocodeLocation = async () => {
      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(incident.location)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setIncidentCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          // Fallback to Mumbai center
          setIncidentCoords([19.0760, 72.8777]);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setIncidentCoords([19.0760, 72.8777]);
      } finally {
        setIsGeocoding(false);
      }
    };

    geocodeLocation();
  }, [incident?.location]);

  // Generate dummy vehicles around the geocoded incident location
  const nearbyVehicles = useMemo(() => {
    if (!incidentCoords) return [];
    return generateNearbyVehicles(incidentCoords[0], incidentCoords[1]);
  }, [incidentCoords]);

  // Custom icons for different vehicle types
  const vehicleIcons = {
    Ambulance: L.divIcon({
      html: '<div style="font-size: 24px;">🚑</div>',
      className: 'custom-icon',
      iconSize: [30, 30]
    }),
    Fire: L.divIcon({
      html: '<div style="font-size: 24px;">🚒</div>',
      className: 'custom-icon',
      iconSize: [30, 30]
    }),
    Police: L.divIcon({
      html: '<div style="font-size: 24px;">🚓</div>',
      className: 'custom-icon',
      iconSize: [30, 30]
    }),
    Accident: L.divIcon({
      html: '<div style="font-size: 24px;">🚗</div>',
      className: 'custom-icon',
      iconSize: [30, 30]
    }),
    Other: L.divIcon({
      html: '<div style="font-size: 24px;">🚐</div>',
      className: 'custom-icon',
      iconSize: [30, 30]
    })
  };

  const incidentIcon = L.divIcon({
    html: '<div style="font-size: 32px;">📍</div>',
    className: 'custom-icon',
    iconSize: [40, 40]
  });

  const handleCall = (contactNumber) => {
    window.location.href = `tel:${contactNumber}`;
  };

  const handleCopyNumber = (contactNumber) => {
    navigator.clipboard.writeText(contactNumber).then(() => {
      alert('Contact number copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy number');
    });
  };

  const getVehicleEmoji = (type) => {
    const emojis = {
      Ambulance: '🚑',
      Fire: '🚒',
      Police: '🚓',
      Accident: '🚗',
      Other: '🚐'
    };
    return emojis[type] || '🚐';
  };

  if (!incidentCoords) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <p style={{ color: '#6b7280' }}>{isGeocoding ? '📍 Locating incident...' : 'Waiting for location...'}</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={incidentCoords}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Recenter map when incident changes */}
      <RecenterMap coords={incidentCoords} />
      
      {/* Incident Location */}
      <Marker position={incidentCoords} icon={incidentIcon}>
        <Popup minWidth={200}>
          <div style={{ padding: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#dc2626' }}>
              📍 Incident Location
            </div>
            <div style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
              {incident.location}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {incident.type} Emergency
            </div>
          </div>
        </Popup>
      </Marker>

      {/* 3km radius circle */}
      <Circle
        center={incidentCoords}
        radius={3000}
        pathOptions={{
          color: '#dc2626',
          fillColor: '#dc2626',
          fillOpacity: 0.08,
          dashArray: '8 4'
        }}
      />

      {/* Nearby dummy vehicles */}
      {nearbyVehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.lat, vehicle.lng]}
          icon={vehicleIcons[vehicle.type] || vehicleIcons.Ambulance}
        >
          <Popup minWidth={280} maxWidth={320}>
            <div style={{ padding: '12px' }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
                    {getVehicleEmoji(vehicle.type)} {vehicle.type}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {vehicle.unitId}
                  </div>
                </div>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderRadius: '12px'
                }}>
                  {vehicle.status}
                </span>
              </div>

              {/* Operator Info */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  <strong>Operator:</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#1f2937' }}>
                  👤 {vehicle.operatorName}
                </div>
              </div>

              {/* Contact Number */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  <strong>Contact Number:</strong>
                </div>
                <div style={{ 
                  fontSize: '15px', 
                  fontFamily: 'monospace', 
                  color: '#2563eb',
                  fontWeight: '600'
                }}>
                  📞 {vehicle.contactNumber}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => handleCall(vehicle.contactNumber)}
                  style={{
                    flex: 1,
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  📞 Call Now
                </button>
                <button
                  onClick={() => handleCopyNumber(vehicle.contactNumber)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  title="Copy number"
                >
                  📋
                </button>
              </div>

              {/* Dispatch Button */}
              <button
                onClick={() => onDispatch && onDispatch(vehicle, incident)}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  backgroundColor: '#f97316',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#ea580c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f97316'}
              >
                🚨 Dispatch This Unit
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;