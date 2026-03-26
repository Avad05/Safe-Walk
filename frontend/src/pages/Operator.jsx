import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import IncidentCard from '../components/IncidentCard';
import MapView from '../components/MapView';
import AIPanel from '../components/AIPanel';

const Operator = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      }, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/auth/check', {
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
      const response = await axios.get('http://localhost:3001/api/incidents', {
        withCredentials: true
      });
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/vehicles', {
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
        `http://localhost:3001/api/incidents/${incidentId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchIncidents();
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/api/auth/logout', {}, {
        withCredentials: true
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚨</span>
            <div>
              <h1 className="text-2xl font-bold">Operator Dashboard</h1>
              <p className="text-sm text-gray-300">Emergency Response Control</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Incidents List */}
        <div className="w-1/3 bg-white shadow-lg overflow-y-auto">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">
              Active Incidents ({incidents.length})
            </h2>
          </div>
          <div className="divide-y">
            {incidents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p>No incidents reported</p>
              </div>
            ) : (
              incidents.map((incident) => (
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
        <div className="flex-1 overflow-y-auto">
          {selectedIncident ? (
            <div className="p-6 space-y-6">
              {/* Incident Header */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Incident #{selectedIncident.id}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Reported: {new Date(selectedIncident.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
                    selectedIncident.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedIncident.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedIncident.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Type</p>
                    <p className="text-lg">{selectedIncident.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Location</p>
                    <p className="text-lg">{selectedIncident.location}</p>
                  </div>
                </div>

                {/* Phone Number Display */}
                {selectedIncident.phoneNumber && (
                  <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600 font-semibold mb-2">Reporter Contact</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-mono text-blue-600 font-bold">
                        📱 {selectedIncident.phoneNumber}
                      </p>
                      <div className="flex gap-2">
                         <a // Add the opening tag here
                           href={`tel:${selectedIncident.phoneNumber}`}
                           className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                         >
                           📞 Call
                         </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedIncident.phoneNumber);
                            alert('Phone number copied!');
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Description</p>
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">
                    {selectedIncident.description}
                  </p>
                </div>

                {selectedIncident.image && (
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Photo Evidence</p>
                    <img
                      src={selectedIncident.image}
                      alt="Incident"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* AI Analysis Panel */}
              <AIPanel analysis={selectedIncident.aiAnalysis} />

              {/* Map */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Location & Available Vehicles
                </h3>
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapView
                    incident={selectedIncident}
                    vehicles={vehicles.filter(v => v.status === 'Available')}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Actions</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'dispatched')}
                    disabled={selectedIncident.status !== 'pending'}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    Mark as Dispatched
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedIncident.id, 'completed')}
                    disabled={selectedIncident.status === 'completed'}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    Mark as Completed
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">👈</div>
                <p className="text-xl">Select an incident to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Operator;