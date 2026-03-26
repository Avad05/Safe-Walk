import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated } from '../middleware/auth.js';
import { generateAIAnalysis } from '../services/aiGemini.js';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

// POST /api/incidents - Create new incident
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { type, description, location, phoneNumber } = req.body;
    
    if (!type || !description || !location || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    let imageUrl = null;

    // Upload image to Supabase Storage if provided
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('incident-images')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('incident-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }
    }

    // Generate AI analysis
    const aiAnalysis = await generateAIAnalysis(type, description, location, phoneNumber);
    
    // Insert into database
    const { data, error } = await supabase
      .from('incidents')
      .insert([
        {
          type,
          description,
          location,
          phone_number: phoneNumber,
          image_url: imageUrl,
          ai_analysis: aiAnalysis,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create incident' });
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Complaint registered and being processed',
      incidentId: data.id 
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// GET /api/incidents - Get all incidents
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch incidents' });
    }

    // Transform to match frontend expectations
    const transformedData = data.map(incident => ({
      id: incident.id,
      type: incident.type,
      description: incident.description,
      location: incident.location,
      phoneNumber: incident.phone_number,
      image: incident.image_url,
      status: incident.status,
      aiAnalysis: incident.ai_analysis,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// GET /api/incidents/:id - Get specific incident
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Transform to match frontend expectations
    const transformedData = {
      id: data.id,
      type: data.type,
      description: data.description,
      location: data.location,
      phoneNumber: data.phone_number,
      image: data.image_url,
      status: data.status,
      aiAnalysis: data.ai_analysis,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// PATCH /api/incidents/:id - Update incident status
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('incidents')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Transform to match frontend expectations
    const transformedData = {
      id: data.id,
      type: data.type,
      description: data.description,
      location: data.location,
      phoneNumber: data.phone_number,
      image: data.image_url,
      status: data.status,
      aiAnalysis: data.ai_analysis,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

export default router;