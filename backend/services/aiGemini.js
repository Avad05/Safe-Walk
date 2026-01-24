import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateAIAnalysis = async (type, description, location = '', phoneNumber = '') => {
  try {
    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an emergency response AI system analyzing incoming emergency reports. 

Emergency Report Details:
- Type: ${type}
- Description: ${description}
- Location: ${location}
- Contact: ${phoneNumber}

Please analyze this emergency and provide:

1. SEVERITY: Rate as "High", "Medium", or "Low" based on:
   - Immediate danger to life
   - Number of people potentially affected
   - Time sensitivity
   - Resource requirements

2. SUMMARY: Write a concise 2-3 sentence professional summary for emergency operators that includes:
   - Key details
   - Recommended response priority
   - Any special concerns or warnings

3. RECOMMENDED_RESPONSE: Suggest which emergency units should be dispatched (Ambulance, Fire, Police, or combination)

4. ESTIMATED_URGENCY: Rate urgency on scale 1-10

5. SPECIAL_INSTRUCTIONS: Any specific precautions or actions responders should take

Format your response as JSON with these exact keys: severity, summary, recommendedResponse, estimatedUrgency, specialInstructions, confidence

Keep the summary professional and action-oriented.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    let aiAnalysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      aiAnalysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parsing Gemini response, using fallback:', parseError);
      // Fallback to mock if parsing fails
      aiAnalysis = generateFallbackAnalysis(type, description);
    }

    // Ensure all required fields exist
    return {
      severity: aiAnalysis.severity || 'Medium',
      summary: aiAnalysis.summary || 'Emergency requires immediate attention.',
      recommendedResponse: aiAnalysis.recommendedResponse || type,
      estimatedUrgency: aiAnalysis.estimatedUrgency || 5,
      specialInstructions: aiAnalysis.specialInstructions || 'Follow standard emergency protocols.',
      confidence: aiAnalysis.confidence || 85,
      analyzedAt: new Date().toISOString(),
      aiPowered: true
    };

  } catch (error) {
    console.error('Gemini AI Error:', error);
    // Fallback to mock analysis if API fails
    return generateFallbackAnalysis(type, description);
  }
};

// Fallback function if Gemini API fails
const generateFallbackAnalysis = (type, description) => {
  const descLower = description.toLowerCase();
  
  let severity = 'Low';
  const highKeywords = ['critical', 'severe', 'emergency', 'urgent', 'life-threatening', 'massive', 'major', 'explosion', 'multiple', 'fatal', 'unconscious', 'bleeding', 'fire', 'collapse'];
  const mediumKeywords = ['injury', 'accident', 'smoke', 'collision', 'robbery', 'assault', 'moderate', 'pain'];
  
  if (highKeywords.some(keyword => descLower.includes(keyword))) {
    severity = 'High';
  } else if (mediumKeywords.some(keyword => descLower.includes(keyword))) {
    severity = 'Medium';
  }
  
  const summaries = {
    'Medical': `Medical emergency reported. ${severity === 'High' ? 'IMMEDIATE ambulance dispatch required.' : 'Ambulance dispatch recommended.'}`,
    'Fire': `Fire incident detected. ${severity === 'High' ? 'URGENT fire department response needed.' : 'Fire department dispatch required.'}`,
    'Police': `Law enforcement incident. ${severity === 'High' ? 'HIGH PRIORITY police response needed.' : 'Police intervention recommended.'}`,
    'Accident': `Accident reported. ${severity === 'High' ? 'Multi-unit emergency response required.' : 'Emergency response needed.'}`,
    'Other': `Emergency situation reported. ${severity === 'High' ? 'Immediate assessment and response required.' : 'Evaluation and appropriate dispatch needed.'}`
  };
  
  return {
    severity,
    summary: summaries[type] || 'Emergency incident requiring attention.',
    recommendedResponse: type,
    estimatedUrgency: severity === 'High' ? 9 : severity === 'Medium' ? 6 : 3,
    specialInstructions: 'Follow standard emergency protocols. Assess situation upon arrival.',
    confidence: 75,
    analyzedAt: new Date().toISOString(),
    aiPowered: false // Indicates fallback was used
  };
};