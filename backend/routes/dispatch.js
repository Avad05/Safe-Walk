import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { vehicles } from './vehicles.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// In-memory dispatch map: vehicleId -> { incidentId, vehicleInfo }
const dispatchMap = new Map();

// POST /api/dispatch - Dispatch a vehicle to an incident
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { vehicleId, incidentId, vehicleInfo } = req.body;

    if (!vehicleId || !incidentId) {
      return res.status(400).json({ error: 'vehicleId and incidentId are required' });
    }

    // Try to find in backend vehicle list, otherwise use frontend-provided info
    const backendVehicle = vehicles.find(v => v.id === parseInt(vehicleId));
    
    const resolvedVehicle = backendVehicle || (vehicleInfo ? {
      id: parseInt(vehicleId),
      unitId: vehicleInfo.unitId || `UNIT-${vehicleId}`,
      type: vehicleInfo.type || 'Other',
      operatorName: vehicleInfo.operatorName || 'Unknown',
      contactNumber: vehicleInfo.contactNumber || 'N/A',
      status: 'Available'
    } : null);

    if (!resolvedVehicle) {
      return res.status(404).json({ error: 'Vehicle not found and no vehicle info provided' });
    }

    // Store dispatch mapping with vehicle info
    dispatchMap.set(parseInt(vehicleId), {
      incidentId,
      vehicleInfo: {
        id: resolvedVehicle.id,
        unitId: resolvedVehicle.unitId,
        type: resolvedVehicle.type,
        operatorName: resolvedVehicle.operatorName
      }
    });

    // Mark backend vehicle as Busy if it exists
    if (backendVehicle) {
      backendVehicle.status = 'Busy';
    }

    // Build dispatch info object to persist
    const dispatchInfo = {
      vehicleId: resolvedVehicle.id,
      unitId: resolvedVehicle.unitId,
      vehicleType: resolvedVehicle.type,
      operatorName: resolvedVehicle.operatorName,
      contactNumber: resolvedVehicle.contactNumber || 'N/A',
      dispatchedAt: new Date().toISOString()
    };

    // Update incident status and dispatch_info in Supabase
    // Try with dispatch_info first, fall back to status-only if column doesn't exist
    let updateError = null;
    const { error: fullError } = await supabase
      .from('incidents')
      .update({ 
        status: 'dispatched',
        dispatch_info: dispatchInfo,
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId);

    if (fullError) {
      console.warn('dispatch_info column may not exist, falling back to status-only update:', fullError.message);
      const { error: fallbackError } = await supabase
        .from('incidents')
        .update({ 
          status: 'dispatched',
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);
      
      if (fallbackError) {
        console.error('Error updating incident status:', fallbackError);
      }
    }

    res.json({
      success: true,
      message: `Vehicle ${resolvedVehicle.unitId} dispatched successfully`,
      dispatch: {
        vehicleId: resolvedVehicle.id,
        unitId: resolvedVehicle.unitId,
        vehicleType: resolvedVehicle.type,
        operatorName: resolvedVehicle.operatorName,
        contactNumber: resolvedVehicle.contactNumber || 'N/A',
        incidentId
      }
    });
  } catch (error) {
    console.error('Error dispatching vehicle:', error);
    res.status(500).json({ error: 'Failed to dispatch vehicle' });
  }
});

// GET /api/dispatch/:vehicleId - Public endpoint for dispatched unit to view emergency details
router.get('/:vehicleId', async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const dispatch = dispatchMap.get(vehicleId);

    if (!dispatch) {
      return res.status(404).json({ error: 'No active dispatch found for this vehicle' });
    }

    const { incidentId, vehicleInfo } = dispatch;

    // Use stored vehicle info (works for both backend and frontend vehicles)
    const backendVehicle = vehicles.find(v => v.id === vehicleId);
    const resolvedVehicle = backendVehicle ? {
      id: backendVehicle.id,
      unitId: backendVehicle.unitId,
      type: backendVehicle.type,
      operatorName: backendVehicle.operatorName
    } : vehicleInfo;

    // Fetch incident details from Supabase
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json({
      vehicle: resolvedVehicle || null,
      incident: {
        id: data.id,
        type: data.type,
        description: data.description,
        location: data.location,
        phoneNumber: data.phone_number,
        image: data.image_url,
        status: data.status,
        aiAnalysis: data.ai_analysis,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching dispatch details:', error);
    res.status(500).json({ error: 'Failed to fetch dispatch details' });
  }
});

export default router;
