import React from 'react';

const IncidentCard = ({ incident, isSelected, onClick }) => {
  const typeIcons = {
    Medical: '🏥',
    Fire: '🔥',
    Police: '🚔',
    Accident: '🚗',
    Other: '⚠️'
  };

  const severityColors = {
    High: 'bg-red-100 text-red-800 border-red-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-green-100 text-green-800 border-green-300'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl">{typeIcons[incident.type]}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-gray-800">
              {incident.type} - #{incident.id}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full border ${
              severityColors[incident.aiAnalysis.severity]
            }`}>
              {incident.aiAnalysis.severity}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {incident.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>📍 {incident.location}</span>
            <span>⏱ {new Date(incident.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;