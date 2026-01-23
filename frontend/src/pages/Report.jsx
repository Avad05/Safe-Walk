import React, { useState } from 'react';
import axios from 'axios';

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

  const emergencyTypes = [
    { value: 'Medical', icon: '🏥', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
    { value: 'Fire', icon: '🔥', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
    { value: 'Police', icon: '🚔', color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
    { value: 'Accident', icon: '🚗', color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
    { value: 'Other', icon: '⚠️', color: 'from-purple-500 to-indigo-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation
    if (name === 'phoneNumber') {
      // Remove non-digits
      const cleaned = value.replace(/\D/g, '');
      
      // Limit to 10 digits
      const limited = cleaned.slice(0, 10);
      
      setFormData({
        ...formData,
        [name]: limited
      });
      
      // Validate
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
          // Use reverse geocoding to get address (using OpenStreetMap Nominatim)
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
          // Fallback to coordinates if reverse geocoding fails
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

      await axios.post('http://localhost:3001/api/incidents', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowSuccess(true);
      
      // Reset form
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
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-6 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🚨</div>
            <div>
              <h1 className="text-2xl font-bold">Emergency Response</h1>
              <p className="text-red-100 text-sm">Report an emergency incident</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-bold text-lg">Complaint Registered!</p>
              <p className="text-sm text-green-100">Being processed now</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Emergency Type Selection */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Emergency Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {emergencyTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeSelect(type.value)}
                  className={`
                    relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform
                    ${formData.type === type.value 
                      ? `${type.bgColor} border-3 ${type.borderColor} scale-105 shadow-lg` 
                      : 'bg-gray-50 border-2 border-gray-200 hover:scale-105 hover:shadow-md'
                    }
                  `}
                >
                  <div className="text-5xl mb-2">{type.icon}</div>
                  <div className={`
                    font-bold text-lg
                    ${formData.type === type.value ? 'text-gray-800' : 'text-gray-600'}
                  `}>
                    {type.value}
                  </div>
                  {formData.type === type.value && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Your Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xl">📱</span>
              </div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter 10-digit mobile number"
                className={`w-full pl-14 pr-5 py-4 text-lg border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all ${
                  phoneError 
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400' 
                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
                maxLength="10"
                required
              />
              {formData.phoneNumber && (
                <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                  <span className={`text-sm font-semibold ${
                    formData.phoneNumber.length === 10 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {formData.phoneNumber.length}/10
                  </span>
                </div>
              )}
            </div>
            {phoneError && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span>⚠️</span>
                {phoneError}
              </p>
            )}
            {formData.phoneNumber.length === 10 && !phoneError && (
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <span>✓</span>
                Valid phone number
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              We'll use this to contact you about the emergency
            </p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Describe the Emergency <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Please provide detailed information about the emergency..."
              rows="5"
              className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">Be as specific as possible to help responders</p>
          </div>

          {/* Location */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter address or landmark..."
              className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all"
              required
            />
            <div className="mt-3">
              <button 
                type="button"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className={`
                  flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors
                  ${isGettingLocation ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}
                `}
              >
                <span className="text-xl">📍</span>
                {isGettingLocation ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Getting location...
                  </span>
                ) : (
                  'Use my current location'
                )}
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Add Photo (Optional)
            </label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-3 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="text-5xl mb-3">📸</span>
                  <p className="text-lg font-medium text-gray-700">Tap to add photo</p>
                  <p className="text-sm text-gray-500 mt-1">Helps responders assess the situation</p>
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
              w-full py-5 rounded-2xl text-xl font-bold text-white shadow-2xl
              transform transition-all duration-300
              ${isSubmitting || phoneError || formData.phoneNumber.length !== 10
                ? 'bg-gray-400 cursor-not-allowed' 
                : selectedType 
                  ? `bg-gradient-to-r ${selectedType.color} hover:scale-105 active:scale-95` 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:scale-105 active:scale-95'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🚨</span>
                Report Emergency
              </span>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            For life-threatening emergencies, call 911 immediately
          </p>
        </form>
      </div>
    </div>
  );
};

export default Report;