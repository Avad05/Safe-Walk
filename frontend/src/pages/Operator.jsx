import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import IncidentCard from '../components/IncidentCard';
import MapView from '../components/MapView';
import AIPanel from '../components/AIPanel';

const Operator = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'detail' for mobile
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchIncidents();
      fetchVehicles();
      const interval = setInterval(() => {
        fetchIncidents();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/check`, {
        withCredentials: true
      });
      if (response.data.authenticated) {
        setIsAuthenticated(true);
      } else {
        navigate('/login');
      }
    } catch (error) {
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/incidents`, {
        withCredentials: true
      });
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
        withCredentials: true
      });
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleStatusUpdate = async (incidentId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/incidents/${incidentId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchIncidents();
      if (newStatus === 'completed') {
        // Clear selection when completing
        setSelectedIncident(null);
        setDispatchResult(null);
        setMobileView('list');
      } else if (selectedIncident?.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDispatch = async (vehicle, incident) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/dispatch`,
        {
          vehicleId: vehicle.id,
          incidentId: incident.id,
          vehicleInfo: {
            unitId: vehicle.unitId,
            type: vehicle.type,
            operatorName: vehicle.operatorName,
            contactNumber: vehicle.contactNumber
          }
        },
        { withCredentials: true }
      );
      fetchVehicles();
      fetchIncidents();
      setDispatchResult({
        unitId: vehicle.unitId,
        vehicleId: vehicle.id,
        incidentId: incident.id,
        operatorName: vehicle.operatorName,
        contactNumber: vehicle.contactNumber,
        vehicleType: vehicle.type,
        dispatchUrl: `${window.location.origin}/dispatch/${vehicle.id}`
      });
    } catch (error) {
      console.error('Dispatch error:', error);
      alert(error.response?.data?.error || 'Failed to dispatch vehicle');
    }
  };

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setMobileView('detail');
  };

  const handleBackToList = () => {
    setMobileView('list');
    setSelectedIncident(null);
    setDispatchResult(null);
  };

  // Filter incidents by tab
  const activeIncidents = incidents.filter(i => i.status !== 'completed');
  const completedIncidents = incidents.filter(i => i.status === 'completed');
  const displayedIncidents = activeTab === 'active' ? activeIncidents : completedIncidents;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="px-3 md:px-5 py-2.5 md:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile back button */}
            {mobileView === 'detail' && (
              <button
                onClick={handleBackToList}
                className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors mr-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <img src="/logo.png" alt="Logo" className="w-7 h-7 md:w-9 md:h-9 rounded-lg object-contain" />
            <div>
              <h1 className="text-xs md:text-base font-semibold text-slate-100">Command Center</h1>
              <p className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-wider hidden sm:block">Emergency Response Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Stats - desktop only */}
            <div className="hidden lg:flex items-center gap-3 mr-2">
              <div className="text-center">
                <div className="text-sm font-bold text-amber-400">{activeIncidents.length}</div>
                <div className="text-[9px] text-slate-500">Active</div>
              </div>
              <div className="w-px h-6 bg-slate-700"></div>
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-400">{completedIncidents.length}</div>
                <div className="text-[9px] text-slate-500">Resolved</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/15 px-2 md:px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] md:text-[10px] text-emerald-400 font-medium">LIVE</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] md:text-xs text-slate-400 hover:text-slate-200 px-2 md:px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* DESKTOP LAYOUT (lg+) */}
      <div className="hidden lg:flex h-[calc(100vh-56px)]">
        {/* Left Panel - Incidents List */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => { setActiveTab('active'); setSelectedIncident(null); }}
              className={`flex-1 py-3 px-3 text-center text-xs font-semibold transition-all ${
                activeTab === 'active'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Active ({activeIncidents.length})
            </button>
            <button
              onClick={() => { setActiveTab('completed'); setSelectedIncident(null); }}
              className={`flex-1 py-3 px-3 text-center text-xs font-semibold transition-all ${
                activeTab === 'completed'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Resolved ({completedIncidents.length})
            </button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {displayedIncidents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-600">{activeTab === 'active' ? 'No active incidents' : 'No resolved incidents'}</p>
              </div>
            ) : (
              displayedIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  isSelected={selectedIncident?.id === incident.id}
                  onClick={() => setSelectedIncident(incident)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {selectedIncident ? (
            <IncidentDetailPanel
              incident={selectedIncident}
              dispatchResult={dispatchResult}
              vehicles={vehicles}
              onStatusUpdate={handleStatusUpdate}
              onDispatch={handleDispatch}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-sm text-slate-500">Select an incident to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE LAYOUT (< lg) */}
      <div className="lg:hidden">
        {mobileView === 'list' ? (
          <>
            {/* Mobile Tabs */}
            <div className="flex border-b border-slate-800 sticky top-[44px] z-20 bg-slate-900">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-3 px-3 text-center text-xs font-semibold transition-all ${
                  activeTab === 'active'
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Active ({activeIncidents.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-3 px-3 text-center text-xs font-semibold transition-all ${
                  activeTab === 'completed'
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Resolved ({completedIncidents.length})
              </button>
            </div>

            {/* Mobile Incident List */}
            <div className="divide-y divide-slate-800/60">
              {displayedIncidents.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-700">
                    <span className="text-xl">{activeTab === 'active' ? '📋' : '✅'}</span>
                  </div>
                  <p className="text-sm text-slate-500">{activeTab === 'active' ? 'No active incidents' : 'No resolved incidents'}</p>
                </div>
              ) : (
                displayedIncidents.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    isSelected={false}
                    onClick={() => handleSelectIncident(incident)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          /* Mobile Detail View */
          selectedIncident && (
            <div className="pb-6">
              <IncidentDetailPanel
                incident={selectedIncident}
                dispatchResult={dispatchResult}
                vehicles={vehicles}
                onStatusUpdate={handleStatusUpdate}
                onDispatch={handleDispatch}
                isMobile={true}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

/* ── Extracted Detail Panel ── */
const IncidentDetailPanel = ({ incident, dispatchResult, vehicles, onStatusUpdate, onDispatch, isMobile = false }) => {
  const vehicleEmojis = {
    Ambulance: '🚑', Fire: '🚒', Police: '🚓', Accident: '🚗', Other: '🚐'
  };

  return (
    <div className={`${isMobile ? 'p-3' : 'p-5'} space-y-3 md:space-y-4 max-w-4xl`}>
      {/* Incident Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-700 flex justify-between items-start">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-slate-100">
              {incident.type} Incident
            </h2>
            <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5">
              ID: {incident.id.substring(0, 8)}… · {new Date(incident.createdAt).toLocaleString()}
            </p>
          </div>
          <span className={`text-[9px] md:text-[10px] px-2 md:px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider flex-shrink-0 ${
            incident.status === 'pending'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : incident.status === 'dispatched'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {incident.status}
          </span>
        </div>

        <div className="p-4 md:p-5 space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</p>
              <p className="text-xs md:text-sm text-slate-200 font-medium">{incident.type}</p>
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Location</p>
              <p className="text-xs md:text-sm text-slate-200 font-medium break-words">{incident.location}</p>
            </div>
          </div>

          {/* Phone */}
          {incident.phoneNumber && (
            <div className="bg-slate-900/60 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Reporter Contact</p>
                <p className="text-xs md:text-sm font-mono text-cyan-400 font-semibold">{incident.phoneNumber}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${incident.phoneNumber}`}
                  className="text-[10px] md:text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  📞 Call
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(incident.phoneNumber);
                    alert('Copied!');
                  }}
                  className="text-[10px] md:text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg">
              {incident.description}
            </p>
          </div>

          {/* Photo */}
          {incident.image && (
            <div>
              <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Evidence</p>
              <img
                src={incident.image}
                alt="Incident"
                className="w-full h-40 md:h-52 object-cover rounded-lg border border-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Panel */}
      <AIPanel analysis={incident.aiAnalysis} />

      {/* Dispatch Result Banner */}
      {dispatchResult && dispatchResult.incidentId === incident.id && (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-emerald-500/30 overflow-hidden">
          <div className="px-4 md:px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/15">
            <p className="text-xs md:text-sm font-semibold text-emerald-400 flex items-center gap-2">
              ✓ Unit {dispatchResult.unitId} Dispatched Successfully
            </p>
          </div>
          <div className="p-4 md:p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2.5 md:gap-3">
              <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Unit</p>
                <p className="text-xs md:text-sm font-mono font-bold text-cyan-400">{dispatchResult.unitId}</p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Type</p>
                <p className="text-xs md:text-sm font-semibold text-slate-200">
                  {vehicleEmojis[dispatchResult.vehicleType] || '🚐'} {dispatchResult.vehicleType}
                </p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Operator</p>
                <p className="text-xs md:text-sm font-medium text-slate-200">{dispatchResult.operatorName}</p>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Contact</p>
                <p className="text-xs md:text-sm font-mono text-emerald-400">{dispatchResult.contactNumber}</p>
              </div>
            </div>
            {/* Dispatch URL */}
            <div className="flex items-center gap-2 bg-slate-900/40 rounded-lg p-2.5">
              <code className="text-[9px] md:text-[10px] bg-slate-900 border border-slate-700 px-2 py-1 rounded flex-1 truncate text-slate-300">
                {dispatchResult.dispatchUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(dispatchResult.dispatchUrl);
                  alert('Link copied!');
                }}
                className="text-[9px] md:text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded font-medium transition-colors flex-shrink-0"
              >
                Copy
              </button>
              <a
                href={dispatchResult.dispatchUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] md:text-[10px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-2 py-1 rounded font-medium transition-colors flex-shrink-0"
              >
                Open
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 md:px-5 py-3 md:py-3.5 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-xs md:text-sm font-semibold text-slate-100">Location & Nearby Units</h3>
          <span className="text-[9px] md:text-[10px] text-slate-500">3km radius</span>
        </div>
        <div className="h-64 md:h-96 m-3 md:m-4 rounded-lg overflow-hidden border border-slate-700">
          <MapView
            incident={incident}
            vehicles={vehicles.filter(v => v.status === 'Available')}
            onDispatch={onDispatch}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3">
          <button
            onClick={() => onStatusUpdate(incident.id, 'dispatched')}
            disabled={incident.status !== 'pending'}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2.5 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors"
          >
            Mark Dispatched
          </button>
          <button
            onClick={() => onStatusUpdate(incident.id, 'completed')}
            disabled={incident.status === 'completed'}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2.5 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors"
          >
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
};

export default Operator;