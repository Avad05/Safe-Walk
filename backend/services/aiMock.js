// Mock AI service - generates severity and summary based on keywords
export const generateAIAnalysis = (type, description) => {
  const descLower = description.toLowerCase();
  
  // Severity determination based on keywords
  let severity = 'Low';
  const highKeywords = ['critical', 'severe', 'emergency', 'urgent', 'life-threatening', 'massive', 'major', 'explosion', 'multiple', 'fatal'];
  const mediumKeywords = ['injury', 'bleeding', 'fire', 'smoke', 'accident', 'collision', 'robbery', 'assault', 'moderate'];
  
  if (highKeywords.some(keyword => descLower.includes(keyword))) {
    severity = 'High';
  } else if (mediumKeywords.some(keyword => descLower.includes(keyword))) {
    severity = 'Medium';
  }
  
  // Generate summary based on type and description
  const summaries = {
    'Medical': [
      'Medical emergency requiring immediate attention.',
      'Health-related incident. Ambulance dispatch recommended.',
      'Patient requires medical assistance. Prioritize response.'
    ],
    'Fire': [
      'Fire incident detected. Fire department dispatch required.',
      'Potential fire hazard. Immediate fire response needed.',
      'Fire emergency. Evacuate area and dispatch fire units.'
    ],
    'Police': [
      'Law enforcement required. Police dispatch recommended.',
      'Security incident. Police intervention necessary.',
      'Public safety concern. Immediate police response needed.'
    ],
    'Accident': [
      'Traffic/accident incident. Multi-unit response may be required.',
      'Accident reported. Assess injuries and dispatch appropriate units.',
      'Collision/accident scene. Emergency response required.'
    ],
      'Other': [
    'General emergency reported. Assessment required to determine response.',
    'Unspecified emergency incident. Evaluating situation for appropriate dispatch.',
    'Emergency situation requires evaluation. Standby for response coordination.'
  ]
  };
  
  const typeSummaries = summaries[type] || ['Emergency incident requiring attention.'];
  const baseSummary = typeSummaries[Math.floor(Math.random() * typeSummaries.length)];
  
  // Add context based on severity
  let contextualInfo = '';
  if (severity === 'High') {
    contextualInfo = ' HIGH PRIORITY: Immediate dispatch required.';
  } else if (severity === 'Medium') {
    contextualInfo = ' MODERATE PRIORITY: Prompt response recommended.';
  } else {
    contextualInfo = ' Standard response protocol.';
  }
  
  return {
    severity,
    summary: baseSummary + contextualInfo,
    confidence: Math.floor(Math.random() * 15) + 85, // 85-99% confidence
    analyzedAt: new Date().toISOString()
  };
};