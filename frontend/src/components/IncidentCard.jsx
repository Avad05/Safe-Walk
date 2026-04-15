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
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };

  const statusDot = {
    pending: 'bg-amber-400',
    dispatched: 'bg-blue-400',
    completed: 'bg-emerald-400'
  };

  const statusLabel = {
    pending: 'Pending',
    dispatched: 'Dispatched',
    completed: 'Resolved'
  };

  const severity = incident.aiAnalysis?.severity;

  return (
    <div
      onClick={onClick}
      className={`px-3 md:px-4 py-3 md:py-3.5 cursor-pointer transition-all duration-200 border-l-3 active:bg-slate-700/40 ${
        isSelected
          ? 'bg-slate-700/60 border-l-cyan-400'
          : 'border-l-transparent hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-start gap-2.5 md:gap-3">
        <div className="text-xl md:text-2xl mt-0.5 flex-shrink-0">{typeIcons[incident.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5 flex-wrap">
            <h3 className="font-semibold text-slate-100 text-xs md:text-sm truncate">
              {incident.type}
            </h3>
            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${statusDot[incident.status]}`}></span>
            <span className="text-[8px] md:text-[9px] text-slate-500 flex-shrink-0">{statusLabel[incident.status]}</span>
            {severity && (
              <span className={`text-[8px] md:text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${
                severityColors[severity]
              }`}>
                {severity}
              </span>
            )}
          </div>
          <p className="text-[10px] md:text-xs text-slate-400 mb-1 md:mb-1.5 line-clamp-1">
            {incident.description}
          </p>
          <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] text-slate-500">
            <span className="truncate max-w-[60%]">📍 {incident.location}</span>
            <span className="flex-shrink-0">{new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        {/* Mobile chevron indicator */}
        <div className="lg:hidden flex-shrink-0 text-slate-600 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;