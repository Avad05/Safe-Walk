import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated } from '../middleware/auth.js';
// import { generateAIAnalysis } from '../services/aiMock.js';
import { generateAIAnalysis } from '../services/aiGemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'incident-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// In-memory incident storage
let incidents = [];
let incidentIdCounter = 1;

// POST /api/incidents - Create new incident (public)
// POST /api/incidents - Create new incident (public)
router.post('/', upload.single('image'), async (req, res) => { // Added async
  try {
    const { type, description, location, phoneNumber } = req.body;
    
    if (!type || !description || !location || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    // Generate AI analysis (now async)
    const aiAnalysis = await generateAIAnalysis(type, description, location, phoneNumber);
    
    const incident = {
      id: incidentIdCounter++,
      type,
      description,
      location,
      phoneNumber,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      aiAnalysis // AI-powered analysis
    };
    
    incidents.push(incident);
    
    res.status(201).json({ 
      success: true, 
      message: 'Complaint registered and being processed',
      incidentId: incident.id 
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// GET /api/incidents - Get all incidents (protected)
router.get('/', isAuthenticated, (req, res) => {
  const sortedIncidents = [...incidents].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sortedIncidents);
});

// GET /api/incidents/:id - Get specific incident (protected)
router.get('/:id', isAuthenticated, (req, res) => {
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  
  res.json(incident);
});

// PATCH /api/incidents/:id - Update incident status (protected)
router.patch('/:id', isAuthenticated, (req, res) => {
  const { status } = req.body;
  const incident = incidents.find(i => i.id === parseInt(req.params.id));
  
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  
  if (status) {
    incident.status = status;
    incident.updatedAt = new Date().toISOString();
  }
  
  res.json(incident);
});

// POST /api/incidents - Create new incident (public)
router.post('/', upload.single('image'), (req, res) => {
  try {
    const { type, description, location, phoneNumber } = req.body;

    //logged for phone
    console.log('Received incident data:', {
      type,
      description,
      location,
      phoneNumber
    });
    
    if (!type || !description || !location || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }
    
    const incident = {
      id: incidentIdCounter++,
      type,
      description,
      location,
      phoneNumber,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      aiAnalysis: generateAIAnalysis(type, description)
    };
    
    incidents.push(incident);
    
    res.status(201).json({ 
      success: true, 
      message: 'Complaint registered and being processed',
      incidentId: incident.id 
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

export default router;