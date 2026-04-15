import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const UnitDispatch = () => {
  const { vehicleId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDispatch = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/dispatch/${vehicleId}`);
      setData(response.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'No active dispatch found for this unit.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatch();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDispatch, 30000);
    return () => clearInterval(interval);
  }, [vehicleId]);

  const typeConfig = {
    Medical:  { emoji: '🏥', color: 'from-red-600 to-pink-600',    badge: 'bg-red-100 text-red-800' },
    Fire:     { emoji: '🔥', color: 'from-orange-500 to-red-600',  badge: 'bg-orange-100 text-orange-800' },
    Police:   { emoji: '🚔', color: 'from-blue-600 to-indigo-600', badge: 'bg-blue-100 text-blue-800' },
    Accident: { emoji: '🚗', color: 'from-yellow-500 to-orange-500', badge: 'bg-yellow-100 text-yellow-800' },
    Other:    { emoji: '⚠️', color: 'from-purple-600 to-indigo-600', badge: 'bg-purple-100 text-purple-800' },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-pulse">🚨</div>
          <p className="text-xl">Loading dispatch details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Active Dispatch</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchDispatch}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const { vehicle, incident } = data;
  const cfg = typeConfig[incident.type] || typeConfig.Other;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.color} py-6 px-4 shadow-2xl`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl animate-bounce">{cfg.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold">Emergency Dispatch</h1>
              <p className="text-white/80 text-sm">
                {vehicle ? `Unit: ${vehicle.unitId} · ${vehicle.operatorName}` : `Vehicle #${vehicleId}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
              {incident.status}
            </span>
            {lastUpdated && (
              <span className="text-xs text-white/60">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Emergency Type */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Emergency Type</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{cfg.emoji}</span>
            <span className="text-2xl font-bold">{incident.type} Emergency</span>
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">📍 Location</p>
          <p className="text-white text-lg font-semibold leading-snug">{incident.location}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(incident.location)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            🗺️ Open in Google Maps
          </a>
        </div>

        {/* Caller Phone */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">📱 Caller Contact</p>
          <p className="text-2xl font-mono font-bold text-green-400">{incident.phoneNumber}</p>
          <div className="flex gap-3 mt-3">
            <a
              href={`tel:${incident.phoneNumber}`}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              📞 Call Now
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(incident.phoneNumber);
                alert('Number copied!');
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">📝 Description</p>
          <p className="text-gray-100 leading-relaxed">{incident.description}</p>
        </div>

        {/* Photo Evidence */}
        {incident.image && (
          <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">📸 Photo Evidence</p>
            <img
              src={incident.image}
              alt="Incident"
              className="w-full rounded-xl object-cover max-h-72"
            />
          </div>
        )}

        {/* AI Analysis */}
        {incident.aiAnalysis && (
          <div className="bg-gray-800 rounded-2xl p-5 border border-purple-700">
            <p className="text-purple-400 text-xs uppercase tracking-wider mb-3">🤖 AI Analysis</p>
            {typeof incident.aiAnalysis === 'string' ? (
              <p className="text-gray-200 leading-relaxed text-sm">{incident.aiAnalysis}</p>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-200 leading-relaxed text-sm">{incident.aiAnalysis.summary}</p>
                <div className="grid grid-cols-2 gap-3">
                  {incident.aiAnalysis.severity && (
                    <div className="bg-gray-700 rounded-xl p-3">
                      <p className="text-gray-400 text-xs">Severity</p>
                      <p className={`font-bold ${
                        incident.aiAnalysis.severity === 'High' ? 'text-red-400' :
                        incident.aiAnalysis.severity === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                      }`}>{incident.aiAnalysis.severity}</p>
                    </div>
                  )}
                  {incident.aiAnalysis.estimatedUrgency && (
                    <div className="bg-gray-700 rounded-xl p-3">
                      <p className="text-gray-400 text-xs">Urgency</p>
                      <p className="font-bold text-white">{incident.aiAnalysis.estimatedUrgency}/10</p>
                    </div>
                  )}
                  {incident.aiAnalysis.recommendedResponse && (
                    <div className="bg-gray-700 rounded-xl p-3 col-span-2">
                      <p className="text-gray-400 text-xs">Recommended Response</p>
                      <p className="font-semibold text-blue-400 text-sm">{incident.aiAnalysis.recommendedResponse}</p>
                    </div>
                  )}
                </div>
                {incident.aiAnalysis.specialInstructions && (
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3 mt-2">
                    <p className="text-yellow-400 text-xs uppercase tracking-wider mb-1">⚠️ Special Instructions</p>
                    <p className="text-yellow-100 text-sm">{incident.aiAnalysis.specialInstructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reported time */}
        <div className="text-center text-gray-500 text-xs pb-6">
          Reported: {new Date(incident.createdAt).toLocaleString()}
          <br />
          Auto-refreshes every 30 seconds ·{' '}
          <button onClick={fetchDispatch} className="text-blue-400 hover:text-blue-300 underline">
            Refresh now
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitDispatch;
