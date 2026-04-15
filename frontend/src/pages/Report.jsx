import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// Generate a short confirmation beep using Web Audio API
const playConfirmationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.15);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
    setTimeout(() => ctx.close(), 1000);
  } catch (e) { /* audio not supported */ }
};

const vehicleEmojis = {
  Ambulance: '🚑', Fire: '🚒', Police: '🚓', Accident: '🚗', Other: '🚐'
};

const Report = () => {
  const [formData, setFormData] = useState({
    type: '', description: '', location: '', phoneNumber: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Dispatch tracking state
  const [trackingId, setTrackingId] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [dispatchInfo, setDispatchInfo] = useState(null);
  const [trackingError, setTrackingError] = useState(false);
  const pollIntervalRef = useRef(null);

  // Poll for incident status updates
  useEffect(() => {
    if (!trackingId) return;

    const pollStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/incidents/${trackingId}/status`);
        setTrackingStatus(response.data.status);
        if (response.data.dispatchInfo) {
          setDispatchInfo(response.data.dispatchInfo);
        }
        setTrackingError(false);
      } catch {
        setTrackingError(true);
      }
    };

    pollStatus();
    pollIntervalRef.current = setInterval(pollStatus, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [trackingId]);

  const clearTracking = () => {
    setTrackingId(null);
    setTrackingStatus(null);
    setDispatchInfo(null);
    setTrackingError(false);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    let finalTranscript = formData.description;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interim += transcript;
        }
      }
      setFormData(prev => ({
        ...prev,
        description: finalTranscript + (interim ? (finalTranscript ? ' ' : '') + interim : '')
      }));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, [isListening, formData.description]);

  const emergencyTypes = [
    { value: 'Medical', icon: '🏥', accent: 'red', desc: 'Injuries, health crisis, medical aid' },
    { value: 'Fire', icon: '🔥', accent: 'orange', desc: 'Fire, smoke, gas leaks' },
    { value: 'Police', icon: '🚔', accent: 'blue', desc: 'Crime, threats, security' },
    { value: 'Accident', icon: '🚗', accent: 'amber', desc: 'Traffic collisions, road incidents' },
    { value: 'Other', icon: '⚠️', accent: 'violet', desc: 'Floods, collapses, other' },
  ];

  const accentMap = {
    red: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', ring: 'ring-red-500/20' },
    orange: { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-400', ring: 'ring-orange-500/20' },
    blue: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400', ring: 'ring-blue-500/20' },
    amber: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400', ring: 'ring-amber-500/20' },
    violet: { bg: 'bg-violet-500/15', border: 'border-violet-500/40', text: 'text-violet-400', ring: 'ring-violet-500/20' },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: cleaned });
      setPhoneError(cleaned.length > 0 && cleaned.length < 10 ? 'Must be 10 digits' : '');
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          setFormData({ ...formData, location: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        } catch {
          setFormData({ ...formData, location: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}` });
        } finally { setIsGettingLocation(false); }
      },
      () => { setIsGettingLocation(false); alert('Unable to get location. Check browser permissions.'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.description || !formData.location || !formData.phoneNumber) {
      alert('Please fill in all required fields'); return;
    }
    if (formData.phoneNumber.length !== 10) { setPhoneError('Must be exactly 10 digits'); return; }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('description', formData.description);
      submitData.append('location', formData.location);
      submitData.append('phoneNumber', formData.phoneNumber);
      if (image) submitData.append('image', image);

      const response = await axios.post(`${API_BASE_URL}/api/incidents`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      playConfirmationSound();
      setShowSuccess(true);

      // Start tracking the submitted incident
      if (response.data.incidentId) {
        setTrackingId(response.data.incidentId);
        setTrackingStatus('pending');
      }

      setTimeout(() => {
        setFormData({ type: '', description: '', location: '', phoneNumber: '' });
        setImage(null); setImagePreview(null); setShowSuccess(false); setPhoneError('');
      }, 4000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  const selectedType = emergencyTypes.find(t => t.value === formData.type);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-5 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 md:gap-3">
            <img src="/logo.png" alt="Logo" className="w-14 h-12 md:w-[120px] md:h-[100px] rounded-2xl md:rounded-3xl object-contain" />
            <div>
              <h1 className="text-sm md:text-lg font-semibold text-slate-100">Emergency Response System</h1>
              <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider">Report an incident — help is minutes away</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-5">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-100">&lt; 3 min</div>
              <div className="text-[10px] text-slate-500">Avg Response</div>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-100">24/7</div>
              <div className="text-[10px] text-slate-500">Available</div>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="flex items-center gap-1.5 bg-emerald-500/15 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-emerald-400 font-medium">SYSTEM ONLINE</span>
            </div>
          </div>
          {/* Mobile-only status pill */}
          <div className="flex md:hidden items-center gap-1.5 bg-emerald-500/15 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-[9px] text-emerald-400 font-medium">ONLINE</span>
          </div>
        </div>
      </header>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 md:p-8 text-center max-w-sm mx-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <span className="text-2xl md:text-3xl">✓</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-slate-100 mb-2">Emergency Registered</h2>
            <p className="text-xs md:text-sm text-slate-400 mb-4">Your report has been received. Help is being dispatched.</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-base md:text-lg">📡</div>
                <div className="text-[9px] md:text-[10px] text-slate-500">Logged</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-base md:text-lg">🤖</div>
                <div className="text-[9px] md:text-[10px] text-slate-500">Analyzing</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-base md:text-lg">🚨</div>
                <div className="text-[9px] md:text-[10px] text-slate-500">Dispatching</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-5 py-4 md:py-6">

        {/* Dispatch Tracking Banner */}
        {trackingId && (
          <div className="mb-5 md:mb-6">
            <div className={`rounded-xl border overflow-hidden transition-all ${
              trackingStatus === 'dispatched'
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : trackingStatus === 'completed'
                ? 'bg-cyan-500/5 border-cyan-500/30'
                : 'bg-amber-500/5 border-amber-500/30'
            }`}>
              {/* Tracking Header */}
              <div className="px-4 md:px-5 py-3 md:py-3.5 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    trackingStatus === 'dispatched' ? 'bg-emerald-400' :
                    trackingStatus === 'completed' ? 'bg-cyan-400' : 'bg-amber-400'
                  }`}></div>
                  <h3 className="text-xs md:text-sm font-semibold text-slate-100">Track Your Report</h3>
                  <span className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                    trackingStatus === 'dispatched'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : trackingStatus === 'completed'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {trackingStatus}
                  </span>
                </div>
                <button
                  onClick={clearTracking}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
                >
                  ✕ Dismiss
                </button>
              </div>

              {/* Status Progress */}
              <div className="px-4 md:px-5 py-3 md:py-4">
                <div className="flex items-center gap-2 md:gap-3 mb-4">
                  {/* Step 1: Pending */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                      trackingStatus ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>✓</div>
                    <span className="text-[10px] md:text-xs text-slate-300 hidden sm:inline">Registered</span>
                  </div>
                  <div className={`flex-1 h-0.5 rounded-full ${trackingStatus === 'dispatched' || trackingStatus === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                  {/* Step 2: Dispatched */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                      trackingStatus === 'dispatched' || trackingStatus === 'completed'
                        ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>{trackingStatus === 'dispatched' || trackingStatus === 'completed' ? '✓' : '2'}</div>
                    <span className="text-[10px] md:text-xs text-slate-300 hidden sm:inline">Dispatched</span>
                  </div>
                  <div className={`flex-1 h-0.5 rounded-full ${trackingStatus === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                  {/* Step 3: Completed */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                      trackingStatus === 'completed'
                        ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>{trackingStatus === 'completed' ? '✓' : '3'}</div>
                    <span className="text-[10px] md:text-xs text-slate-300 hidden sm:inline">Resolved</span>
                  </div>
                </div>

                {/* Pending State */}
                {trackingStatus === 'pending' && !dispatchInfo && (
                  <div className="bg-slate-800/60 rounded-lg p-3 md:p-4 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin flex-shrink-0"></div>
                    <div>
                      <p className="text-xs md:text-sm text-slate-200 font-medium">Awaiting dispatch</p>
                      <p className="text-[10px] md:text-xs text-slate-500">An operator will review and dispatch the nearest unit shortly</p>
                    </div>
                  </div>
                )}

                {/* Dispatched State — Unit Details */}
                {dispatchInfo && (
                  <div className="bg-slate-800/60 rounded-xl border border-emerald-500/20 overflow-hidden">
                    <div className="px-3 md:px-4 py-2.5 md:py-3 bg-emerald-500/10 border-b border-emerald-500/15">
                      <p className="text-xs md:text-sm font-semibold text-emerald-400 flex items-center gap-2">
                        <span className="text-base md:text-lg">🚨</span> Unit Dispatched — Help is on the way!
                      </p>
                    </div>
                    <div className="p-3 md:p-4">
                      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                        {/* Vehicle Type */}
                        <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                          <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Vehicle</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg md:text-xl">{vehicleEmojis[dispatchInfo.vehicleType] || '🚐'}</span>
                            <span className="text-xs md:text-sm font-semibold text-slate-200">{dispatchInfo.vehicleType}</span>
                          </div>
                        </div>
                        {/* Unit ID */}
                        <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                          <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Unit ID</p>
                          <p className="text-xs md:text-sm font-mono font-bold text-cyan-400">{dispatchInfo.unitId}</p>
                        </div>
                        {/* Operator */}
                        <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                          <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Operator</p>
                          <p className="text-xs md:text-sm font-medium text-slate-200">👤 {dispatchInfo.operatorName}</p>
                        </div>
                        {/* Contact */}
                        <div className="bg-slate-900/60 rounded-lg p-2.5 md:p-3">
                          <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Contact</p>
                          <a
                            href={`tel:${dispatchInfo.contactNumber}`}
                            className="text-xs md:text-sm font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            📞 {dispatchInfo.contactNumber}
                          </a>
                        </div>
                      </div>
                      {/* Dispatched time */}
                      {dispatchInfo.dispatchedAt && (
                        <p className="text-[9px] md:text-[10px] text-slate-500 mt-2.5 md:mt-3 text-center">
                          Dispatched at {new Date(dispatchInfo.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {/* Call Button */}
                      <a
                        href={`tel:${dispatchInfo.contactNumber}`}
                        className="mt-3 flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 md:py-3 rounded-lg font-semibold text-xs md:text-sm transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        📞 Call Responder
                      </a>
                    </div>
                  </div>
                )}

                {/* Completed State */}
                {trackingStatus === 'completed' && (
                  <div className="bg-slate-800/60 rounded-lg p-3 md:p-4 text-center">
                    <span className="text-2xl md:text-3xl block mb-2">✅</span>
                    <p className="text-xs md:text-sm font-medium text-slate-200">Incident resolved</p>
                    <p className="text-[10px] md:text-xs text-slate-500">This emergency has been marked as resolved by the operator</p>
                  </div>
                )}

                {trackingError && (
                  <p className="text-[10px] text-amber-400 mt-2 text-center">Having trouble connecting — will retry automatically</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Main Form — 2/3 */}
          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

              {/* Emergency Type */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-5">
                <label className="block text-xs font-medium text-slate-400 mb-3 md:mb-4 uppercase tracking-wider">
                  Select Emergency Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                  {emergencyTypes.map((type) => {
                    const a = accentMap[type.accent];
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`rounded-xl p-3 md:p-4 text-center transition-all border relative ${isSelected
                          ? `${a.bg} ${a.border} ring-2 ${a.ring}`
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-[7px] md:text-[8px] text-white font-bold">✓</span>
                          </div>
                        )}
                        <div className="text-2xl md:text-3xl mb-1 md:mb-2">{type.icon}</div>
                        <div className={`text-[10px] md:text-xs font-semibold mb-0.5 ${isSelected ? a.text : 'text-slate-300'}`}>{type.value}</div>
                        <div className="text-[8px] md:text-[9px] text-slate-500 leading-tight hidden sm:block">{type.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-5">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Your Contact Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">+91</span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    required
                    className={`w-full pl-14 pr-16 py-3 bg-slate-800 border rounded-lg text-base text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${phoneError ? 'border-red-500/40 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500'
                      }`}
                  />
                  {formData.phoneNumber && (
                    <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold ${formData.phoneNumber.length === 10 ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                      {formData.phoneNumber.length === 10 ? '✓' : `${formData.phoneNumber.length}/10`}
                    </span>
                  )}
                </div>
                {phoneError && <p className="text-red-400 text-xs mt-2">{phoneError}</p>}
                {formData.phoneNumber.length === 10 && !phoneError && (
                  <p className="text-emerald-400 text-xs mt-2">✓ We'll contact you on this number</p>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Describe the Emergency <span className="text-red-400">*</span>
                  </label>
                  {isListening && (
                    <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-medium animate-pulse">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Listening...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="What happened? How many people are affected? Any immediate dangers?"
                    rows="4"
                    required
                    className="w-full px-3.5 py-3 pr-14 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title={isListening ? 'Stop listening' : 'Describe by voice'}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      isListening
                        ? 'bg-red-500/20 border border-red-500/40 text-red-400 shadow-lg shadow-red-500/10 animate-pulse'
                        : 'bg-slate-700/60 border border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10'
                    }`}
                  >
                    {isListening ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="2" width="6" height="12" rx="3" />
                        <path d="M5 10a7 7 0 0 0 14 0" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`mt-2.5 md:mt-3 flex items-center gap-2 text-xs font-medium px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-colors ${
                    isListening
                      ? 'text-red-400 bg-red-500/10 hover:bg-red-500/15'
                      : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15'
                  }`}
                >
                  {isListening ? (
                    <><span className="w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse"></span> Stop Recording</>
                  ) : (
                    <>🎤 Use Voice to Describe</>
                  )}
                </button>
                <div className="mt-2.5 md:mt-3 bg-slate-800/60 rounded-lg p-2.5 md:p-3 border border-slate-700/50">
                  <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">💡 Include details about:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['What happened', 'People involved', 'Visible injuries', 'Is it escalating'].map((tip, i) => (
                      <span key={i} className="text-[9px] md:text-[10px] text-slate-500">• {tip}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-5">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Emergency Location <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Complete address, landmark, or area name"
                  required
                  className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="mt-2.5 md:mt-3 flex items-center gap-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isGettingLocation ? (
                    <><span className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span> Detecting location...</>
                  ) : (
                    <>📡 Use My Current Location</>
                  )}
                </button>
              </div>

              {/* Photo */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-5">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Photo Evidence <span className="text-slate-600">(optional)</span>
                </label>
                <p className="text-[9px] md:text-[10px] text-slate-500 mb-3">Photos help responders assess severity and prepare better</p>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 md:h-52 object-cover rounded-lg border border-slate-700" />
                    <button
                      type="button"
                      onClick={() => { setImage(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600 text-slate-300 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm"
                    >✕</button>
                    <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold">
                      ✓ Photo attached
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 border border-dashed border-slate-700 rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group">
                    <div className="text-center group-hover:scale-105 transition-transform">
                      <span className="text-3xl md:text-4xl block mb-2">📸</span>
                      <span className="text-xs md:text-sm text-slate-400 font-medium">Tap to add photo</span>
                      <span className="text-[9px] md:text-[10px] text-slate-600 block mt-1">JPG, PNG up to 10MB</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !!phoneError || formData.phoneNumber.length !== 10 || !formData.type}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3.5 md:py-4 rounded-xl font-semibold transition-all text-sm md:text-base shadow-lg shadow-red-500/20 hover:shadow-red-500/30 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting Report...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🚨 Submit Emergency Report
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar — 1/3 */}
          <div className="space-y-4 md:space-y-5">

            {/* Emergency Hotlines */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 md:px-5 py-3 border-b border-slate-800">
                <h3 className="text-xs md:text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span>☎️</span> Emergency Hotlines
                </h3>
              </div>
              <div className="p-2.5 md:p-3 space-y-1.5 md:space-y-2">
                {[
                  { num: '100', label: 'Police', sub: 'Law enforcement', icon: '🚔' },
                  { num: '102', label: 'Ambulance', sub: 'Medical emergency', icon: '🚑' },
                  { num: '101', label: 'Fire', sub: 'Fire department', icon: '🔥' },
                  { num: '112', label: 'Unified', sub: 'All emergencies', icon: '📞' },
                ].map((h, i) => (
                  <a key={i} href={`tel:${h.num}`} className="flex items-center justify-between bg-slate-800 hover:bg-slate-750 rounded-lg p-2.5 md:p-3 transition-colors group">
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <span className="text-lg md:text-xl">{h.icon}</span>
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-slate-200">{h.label}</div>
                        <div className="text-[9px] md:text-[10px] text-slate-500">{h.sub}</div>
                      </div>
                    </div>
                    <div className="text-base md:text-lg font-bold text-slate-300 group-hover:text-cyan-400 transition-colors">{h.num}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 md:px-5 py-3 border-b border-slate-800">
                <h3 className="text-xs md:text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span>⚡</span> What Happens Next
                </h3>
              </div>
              <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
                {[
                  { step: '1', title: 'Instant Registration', desc: 'Your report is logged immediately', color: 'bg-cyan-500' },
                  { step: '2', title: 'AI Analysis', desc: 'Gemini AI assesses severity & priority', color: 'bg-violet-500' },
                  { step: '3', title: 'Unit Dispatched', desc: 'Nearest available unit is alerted', color: 'bg-amber-500' },
                  { step: '4', title: 'Help Arrives', desc: 'Responders reach your location', color: 'bg-emerald-500' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 md:gap-3">
                    <div className={`${s.color} w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] md:text-[10px] font-bold text-white`}>{s.step}</div>
                    <div>
                      <p className="text-[11px] md:text-xs font-semibold text-slate-200">{s.title}</p>
                      <p className="text-[9px] md:text-[10px] text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 md:px-5 py-3 border-b border-slate-800">
                <h3 className="text-xs md:text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span>🛡️</span> While You Wait
                </h3>
              </div>
              <div className="p-3 md:p-4 space-y-2 md:space-y-2.5">
                {[
                  { icon: '🧘', text: 'Stay calm and assess the situation' },
                  { icon: '🚪', text: 'Move to safety if in danger' },
                  { icon: '🤝', text: 'Help others if safe to do so' },
                  { icon: '📱', text: 'Keep your phone accessible' },
                  { icon: '👂', text: 'Follow responder instructions' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 md:gap-2.5 bg-slate-800/60 rounded-lg px-2.5 md:px-3 py-2">
                    <span className="text-sm md:text-base">{t.icon}</span>
                    <span className="text-[10px] md:text-xs text-slate-400">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 md:p-4">
              <p className="text-[11px] md:text-xs font-semibold text-amber-400 mb-1">⚠ Life-Threatening?</p>
              <p className="text-[9px] md:text-[10px] text-amber-300/70 leading-relaxed">For critical situations, call emergency services directly. Do not rely solely on this system.</p>
              <div className="flex gap-2 mt-2.5 md:mt-3">
                <a href="tel:112" className="flex-1 text-center bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold transition-colors">
                  Call 112
                </a>
                <a href="tel:100" className="flex-1 text-center bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold transition-colors">
                  Call 100
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;