import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ incident, vehicles }) => {
  // Mock coordinates for Mumbai (default)
  const incidentCoords = [19.0760, 72.8777];

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

  // Function to handle call action
  const handleCall = (contactNumber) => {
    window.location.href = `tel:${contactNumber}`;
  };

  // Function to copy number to clipboard
  const handleCopyNumber = (contactNumber) => {
    navigator.clipboard.writeText(contactNumber).then(() => {
      alert('Contact number copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy number');
    });
  };

  // Get vehicle emoji based on type
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

  return (
    <MapContainer
      center={incidentCoords}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
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

      {/* 5km radius circle */}
      <Circle
        center={incidentCoords}
        radius={5000}
        pathOptions={{
          color: 'blue',
          fillColor: 'blue',
          fillOpacity: 0.1
        }}
      />

      {/* Available Vehicles */}
      {vehicles.map((vehicle) => (
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

              {/* Distance */}
              {vehicle.distance && (
                <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                  <span style={{ color: '#6b7280', fontWeight: '600' }}>Distance:</span>{' '}
                  <span style={{ color: '#1f2937' }}>~{vehicle.distance.toFixed(2)} km away</span>
                </div>
              )}

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