import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const Report = () => {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    location: '',
    phoneNumber: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showInfo, setShowInfo] = useState(true);

  const emergencyTypes = [
    { 
      value: 'Medical', 
      icon: '🏥', 
      color: 'from-red-500 to-pink-500', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-300',
      description: 'Medical emergencies, injuries, health crisis',
      examples: ['Heart attack', 'Severe bleeding', 'Unconsciousness', 'Breathing difficulty']
    },
    { 
      value: 'Fire', 
      icon: '🔥', 
      color: 'from-orange-500 to-red-500', 
      bgColor: 'bg-orange-50', 
      borderColor: 'border-orange-300',
      description: 'Fire incidents, smoke, burning buildings',
      examples: ['Building fire', 'Vehicle fire', 'Gas leak', 'Electrical fire']
    },
    { 
      value: 'Police', 
      icon: '🚔', 
      color: 'from-blue-500 to-indigo-500', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-300',
      description: 'Crime, security threats, law enforcement needed',
      examples: ['Theft', 'Assault', 'Suspicious activity', 'Accident with injuries']
    },
    { 
      value: 'Accident', 
      icon: '🚗', 
      color: 'from-yellow-500 to-orange-500', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-300',
      description: 'Traffic accidents, collisions, road incidents',
      examples: ['Car crash', 'Motorcycle accident', 'Pedestrian incident', 'Multi-vehicle collision']
    },
    { 
      value: 'Other', 
      icon: '⚠️', 
      color: 'from-purple-500 to-indigo-500', 
      bgColor: 'bg-purple-50', 
      borderColor: 'border-purple-300',
      description: 'Natural disasters, infrastructure issues',
      examples: ['Flood', 'Building collapse', 'Missing person', 'Animal emergency']
    }
  ];

  const emergencyTips = [
    { icon: '🆘', title: 'Stay Calm', text: 'Take deep breaths and assess the situation carefully' },
    { icon: '📍', title: 'Share Location', text: 'Accurate location helps responders reach you faster' },
    { icon: '📸', title: 'Add Photos', text: 'Visual evidence helps assess severity and prepare response' },
    { icon: '⚡', title: 'Be Detailed', text: 'More information means better and faster emergency response' },
  ];

  const stats = [
    { value: '< 3 min', label: 'Avg Response Time' },
    { value: '24/7', label: 'Always Available' },
    { value: '98%', label: 'Success Rate' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const cleaned = value.replace(/\D/g, '');
      const limited = cleaned.slice(0, 10);
      
      setFormData({
        ...formData,
        [name]: limited
      });
      
      if (limited.length > 0 && limited.length < 10) {
        setPhoneError('Phone number must be 10 digits');
      } else {
        setPhoneError('');
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleTypeSelect = (type) => {
    setFormData({ ...formData, type });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          setFormData({
            ...formData,
            location: address
          });
        } catch (error) {
          console.error('Error getting address:', error);
          setFormData({
            ...formData,
            location: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        
        let errorMessage = 'Unable to get location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.description || !formData.location || !formData.phoneNumber) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.phoneNumber.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('description', formData.description);
      submitData.append('location', formData.location);
      submitData.append('phoneNumber', formData.phoneNumber);
      if (image) {
        submitData.append('image', image);
      }

      await axios.post(`${API_BASE_URL}/api/incidents`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowSuccess(true);
      
      setTimeout(() => {
        setFormData({ type: '', description: '', location: '', phoneNumber: '' });
        setImage(null);
        setImagePreview(null);
        setShowSuccess(false);
        setPhoneError('');
      }, 3000);

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = emergencyTypes.find(t => t.value === formData.type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-pink-600 text-white py-8 px-4 shadow-2xl relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="text-6xl animate-bounce">🚨</div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Emergency Response System</h1>
                <p className="text-red-100 text-lg">Fast. Reliable. Always Here for You.</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-red-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-8 py-6 rounded-3xl shadow-2xl flex items-center gap-4 border-4 border-green-300">
            <span className="text-5xl">✅</span>
            <div>
              <p className="font-bold text-2xl">Emergency Registered!</p>
              <p className="text-sm text-green-100">Help is on the way. Stay safe!</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Banner */}
        {showInfo && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
              ✕
            </button>
            
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">💡</span>
              <div>
                <h3 className="text-2xl font-bold mb-2">How to Report an Emergency</h3>
                <p className="text-blue-100">Follow these simple steps to get help quickly and efficiently</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {emergencyTips.map((tip, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-3xl mb-2">{tip.icon}</div>
                  <h4 className="font-bold text-lg mb-1">{tip.title}</h4>
                  <p className="text-sm text-blue-100">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Emergency Type Selection */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🆘</span>
                  <div>
                    <label className="block text-2xl font-bold text-gray-800">
                      Select Emergency Type <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-500">Choose the category that best describes your emergency</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {emergencyTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeSelect(type.value)}
                      className={`
                        relative overflow-hidden rounded-2xl p-5 transition-all duration-300 transform
                        ${formData.type === type.value 
                          ? `${type.bgColor} border-3 ${type.borderColor} scale-105 shadow-2xl` 
                          : 'bg-gray-50 border-2 border-gray-200 hover:scale-105 hover:shadow-lg'
                        }
                      `}
                    >
                      <div className="text-5xl mb-3">{type.icon}</div>
                      <div className={`
                        font-bold text-lg mb-1
                        ${formData.type === type.value ? 'text-gray-800' : 'text-gray-600'}
                      `}>
                        {type.value}
                      </div>
                      {formData.type === type.value && (
                        <>
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg">
                            ✓
                          </div>
                          <div className="text-xs text-gray-600 mt-2 leading-tight">
                            {type.description}
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>

                {/* Show examples when type is selected */}
                {selectedType && (
                  <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border-2 border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Common {selectedType.value} emergencies:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedType.examples.map((example, index) => (
                        <span key={index} className="text-xs bg-white px-3 py-1 rounded-full text-gray-700 border border-gray-300">
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📱</span>
                  <label className="block text-xl font-bold text-gray-800">
                    Your Contact Number <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full px-6 py-5 text-xl border-3 rounded-2xl focus:outline-none focus:ring-4 transition-all font-mono ${
                      phoneError 
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                        : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                    }`}
                    maxLength="10"
                    required
                  />
                  {formData.phoneNumber && (
                    <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                      <span className={`text-lg font-bold ${
                        formData.phoneNumber.length === 10 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {formData.phoneNumber.length}/10
                      </span>
                    </div>
                  )}
                </div>
                {phoneError && (
                  <p className="text-red-500 text-sm mt-3 flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
                    <span>⚠️</span>
                    {phoneError}
                  </p>
                )}
                {formData.phoneNumber.length === 10 && !phoneError && (
                  <p className="text-green-600 text-sm mt-3 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                    <span>✓</span>
                    Valid phone number - We'll contact you on this number
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📝</span>
                  <label className="block text-xl font-bold text-gray-800">
                    Describe the Emergency <span className="text-red-500">*</span>
                  </label>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please provide detailed information: What happened? How many people affected? Any immediate dangers? Current situation..."
                  rows="6"
                  className="w-full px-6 py-5 text-lg border-3 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
                  required
                />
                <div className="flex items-start gap-2 mt-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="font-semibold mb-1">Be as specific as possible:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>What exactly happened?</li>
                      <li>How many people are involved?</li>
                      <li>Any visible injuries or dangers?</li>
                      <li>Is the situation getting worse?</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📍</span>
                  <label className="block text-xl font-bold text-gray-800">
                    Emergency Location <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter complete address, landmark, or area name..."
                  className="w-full px-6 py-5 text-lg border-3 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all"
                  required
                />
                <div className="mt-4">
                  <button 
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isGettingLocation}
                    className={`
                      flex items-center gap-3 text-white font-bold py-3 px-6 rounded-xl transition-all transform
                      ${isGettingLocation 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-lg'
                      }
                    `}
                  >
                    <span className="text-2xl">📡</span>
                    {isGettingLocation ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Detecting your location...
                      </span>
                    ) : (
                      'Use My Current Location'
                    )}
                  </button>
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📸</span>
                  <div>
                    <label className="block text-xl font-bold text-gray-800">
                      Add Photo Evidence (Optional)
                    </label>
                    <p className="text-sm text-gray-500">Helps responders prepare better</p>
                  </div>
                </div>
                
                {imagePreview ? (
                  <div className="relative group">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-72 object-cover rounded-2xl border-4 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl transform hover:scale-110"
                    >
                      <span className="text-2xl">✕</span>
                    </button>
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-xl text-sm backdrop-blur-sm">
                      ✓ Photo added
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all group hover:border-blue-400">
                    <div className="flex flex-col items-center justify-center py-8 group-hover:scale-110 transition-transform">
                      <span className="text-7xl mb-4">📸</span>
                      <p className="text-xl font-bold text-gray-700 mb-2">Tap to add photo</p>
                      <p className="text-sm text-gray-500 text-center px-4">
                        Clear photos help responders assess the situation better
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || phoneError || formData.phoneNumber.length !== 10}
                className={`
                  w-full py-6 rounded-2xl text-2xl font-bold text-white shadow-2xl
                  transform transition-all duration-300 border-4 border-transparent
                  ${isSubmitting || phoneError || formData.phoneNumber.length !== 10
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : selectedType 
                      ? `bg-gradient-to-r ${selectedType.color} hover:scale-105 active:scale-95 hover:shadow-3xl` 
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:scale-105 active:scale-95 hover:shadow-3xl'
                  }
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting Emergency Report...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🚨</span>
                    Report Emergency Now
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Emergency Hotlines */}
            <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-3xl p-6 shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">☎️</span>
                Emergency Hotlines
              </h3>
              <div className="space-y-3">
                <a href="tel:911" className="block bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 transition-all border border-white/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">Police</div>
                      <div className="text-sm text-red-100">Immediate law enforcement</div>
                    </div>
                    <div className="text-3xl font-bold">100</div>
                  </div>
                </a>
                <a href="tel:102" className="block bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 transition-all border border-white/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">Ambulance</div>
                      <div className="text-sm text-red-100">Medical emergencies</div>
                    </div>
                    <div className="text-3xl font-bold">102</div>
                  </div>
                </a>
                <a href="tel:101" className="block bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 transition-all border border-white/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-lg">Fire</div>
                      <div className="text-sm text-red-100">Fire department</div>
                    </div>
                    <div className="text-3xl font-bold">101</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                <span className="text-2xl">🛡️</span>
                Safety Tips
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3 items-start bg-green-50 p-3 rounded-xl border-2 border-green-200">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Move to Safety</p>
                    <p className="text-xs text-green-700">Get away from immediate danger if possible</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-blue-50 p-3 rounded-xl border-2 border-blue-200">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-blue-800 text-sm">Don't Panic</p>
                    <p className="text-xs text-blue-700">Stay calm to make better decisions</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-purple-50 p-3 rounded-xl border-2 border-purple-200">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-purple-800 text-sm">Help Others</p>
                <p className="text-xs text-purple-700">Assist those who need help if safe to do so</p>
              </div>
            </div>
            <div className="flex gap-3 items-start bg-orange-50 p-3 rounded-xl border-2 border-orange-200">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-orange-800 text-sm">Follow Instructions</p>
                <p className="text-xs text-orange-700">Listen to emergency responders</p>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-3xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            What Happens Next?
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-semibold">Instant Registration</p>
                <p className="text-sm text-blue-100">Your report is logged immediately</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-semibold">AI Analysis</p>
                <p className="text-sm text-blue-100">System assesses severity & priority</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-semibold">Dispatch Team</p>
                <p className="text-sm text-blue-100">Nearest unit is alerted & dispatched</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
              <div>
                <p className="font-semibold">Help Arrives</p>
                <p className="text-sm text-blue-100">Responders reach your location</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100">
          <div className="text-center space-y-4">
            <div className="text-5xl">🏆</div>
            <h3 className="text-lg font-bold text-gray-800">Trusted by Thousands</h3>
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-2xl">
              ⭐⭐⭐⭐⭐
            </div>
            <p className="text-sm text-gray-600">Join 10,000+ people who trust us for emergency response</p>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Warning */}
    <div className="mt-8 bg-yellow-50 border-3 border-yellow-300 rounded-2xl p-6 text-center shadow-lg">
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-3xl">⚠️</span>
        <p className="text-xl font-bold text-yellow-800">Life-Threatening Emergency?</p>
      </div>
      <p className="text-yellow-700 mb-4">For immediate critical situations, call emergency services directly</p>
      <div className="flex gap-4 justify-center flex-wrap">
        <a href="tel:100" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105">
          📞 Police: 100
        </a>
        <a href="tel:102" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105">
          🚑 Ambulance: 102
        </a>
        <a href="tel:101" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105">
          🔥 Fire: 101
        </a>
      </div>
    </div>
  </div>
</div>
);
};
export default Report;