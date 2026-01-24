import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Mock vehicle data - in real app, this would be in a database
// Mock vehicle data - in real app, this would be in a database
const vehicles = [
  // Ambulances
  { 
    id: 1, 
    type: 'Ambulance', 
    lat: 19.116472, 
    lng: 73.006858, 
    status: 'Available',
    contactNumber: '+91 98765 43210',
    operatorName: 'Dr. Rajesh Kumar',
    unitId: 'AMB-001'
  },
  { 
    id: 2, 
    type: 'Ambulance', 
    lat: 19.0896, 
    lng: 72.8656, 
    status: 'Available',
    contactNumber: '+91 98765 43211',
    operatorName: 'Dr. Priya Sharma',
    unitId: 'AMB-002'
  },
  { 
    id: 3, 
    type: 'Ambulance', 
    lat: 19.0520, 
    lng: 72.8990, 
    status: 'Busy',
    contactNumber: '+91 98765 43212',
    operatorName: 'Dr. Amit Patel',
    unitId: 'AMB-003'
  },
  { 
    id: 4, 
    type: 'Ambulance', 
    lat: 19.1136, 
    lng: 72.8697, 
    status: 'Available',
    contactNumber: '+91 98765 43213',
    operatorName: 'Dr. Sneha Mehta',
    unitId: 'AMB-004'
  },
  
  // Fire trucks
  { 
    id: 5, 
    type: 'Fire', 
    lat: 19.0885, 
    lng: 72.8886, 
    status: 'Available',
    contactNumber: '+91 98765 43220',
    operatorName: 'Officer Suresh Yadav',
    unitId: 'FIRE-001'
  },
  { 
    id: 6, 
    type: 'Fire', 
    lat: 19.0670, 
    lng: 72.8520, 
    status: 'Available',
    contactNumber: '+91 98765 43221',
    operatorName: 'Officer Vikram Singh',
    unitId: 'FIRE-002'
  },
  { 
    id: 7, 
    type: 'Fire', 
    lat: 19.0990, 
    lng: 72.9050, 
    status: 'Busy',
    contactNumber: '+91 98765 43222',
    operatorName: 'Officer Ramesh Joshi',
    unitId: 'FIRE-003'
  },
  
  // Police vehicles
  { 
    id: 8, 
    type: 'Police', 
    lat: 19.0825, 
    lng: 72.8745, 
    status: 'Available',
    contactNumber: '+91 98765 43230',
    operatorName: 'Constable Arjun Desai',
    unitId: 'POL-001'
  },
  { 
    id: 9, 
    type: 'Police', 
    lat: 19.0560, 
    lng: 72.8820, 
    status: 'Available',
    contactNumber: '+91 98765 43231',
    operatorName: 'Constable Neha Kapoor',
    unitId: 'POL-002'
  },
  { 
    id: 10, 
    type: 'Police', 
    lat: 19.1050, 
    lng: 72.8580, 
    status: 'Available',
    contactNumber: '+91 98765 43232',
    operatorName: 'Inspector Ravi Malhotra',
    unitId: 'POL-003'
  },
  { 
    id: 11, 
    type: 'Police', 
    lat: 19.0720, 
    lng: 72.9100, 
    status: 'Busy',
    contactNumber: '+91 98765 43233',
    operatorName: 'Constable Sanjay Gupta',
    unitId: 'POL-004'
  },
  
  // Accident response
  { 
    id: 12, 
    type: 'Accident', 
    lat: 19.0800, 
    lng: 72.8650, 
    status: 'Available',
    contactNumber: '+91 98765 43240',
    operatorName: 'Rescue Officer Deepak Shah',
    unitId: 'ACC-001'
  },
  { 
    id: 13, 
    type: 'Accident', 
    lat: 19.0950, 
    lng: 72.8920, 
    status: 'Available',
    contactNumber: '+91 98765 43241',
    operatorName: 'Rescue Officer Kavita Reddy',
    unitId: 'ACC-002'
  },
  
  // Other emergency vehicles
  { 
    id: 14, 
    type: 'Other', 
    lat: 19.0880, 
    lng: 72.8780, 
    status: 'Available',
    contactNumber: '+91 98765 43250',
    operatorName: 'Emergency Officer Manoj Kumar',
    unitId: 'EMG-001'
  },
  { 
    id: 15, 
    type: 'Other', 
    lat: 19.0650, 
    lng: 72.8950, 
    status: 'Available',
    contactNumber: '+91 98765 43251',
    operatorName: 'Emergency Officer Pooja Jain',
    unitId: 'EMG-002'
  },
];

// GET /api/vehicles - Get all vehicles or filter by type
router.get('/', isAuthenticated, (req, res) => {
  const { type, status } = req.query;
  
  let filteredVehicles = [...vehicles];
  
  if (type) {
    filteredVehicles = filteredVehicles.filter(v => 
      v.type.toLowerCase() === type.toLowerCase()
    );
  }
  
  if (status) {
    filteredVehicles = filteredVehicles.filter(v => 
      v.status.toLowerCase() === status.toLowerCase()
    );
  }
  
  res.json(filteredVehicles);
});

// GET /api/vehicles/nearby - Get nearby vehicles
router.get('/nearby', isAuthenticated, (req, res) => {
  const { lat, lng, type, radius = 5 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }
  
  const incidentLat = parseFloat(lat);
  const incidentLng = parseFloat(lng);
  
  // Simple distance calculation (Haversine formula simplified)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  let nearbyVehicles = vehicles
    .filter(v => v.status === 'Available')
    .map(v => ({
      ...v,
      distance: calculateDistance(incidentLat, incidentLng, v.lat, v.lng)
    }))
    .filter(v => v.distance <= parseFloat(radius))
    .sort((a, b) => a.distance - b.distance);
  
  if (type) {
    nearbyVehicles = nearbyVehicles.filter(v => 
      v.type.toLowerCase() === type.toLowerCase()
    );
  }
  
  res.json(nearbyVehicles);
});

export default router;