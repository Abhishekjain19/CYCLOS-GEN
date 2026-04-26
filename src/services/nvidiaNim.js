const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || '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';
const BASE_URL = '/api/nvidia';

/**
 * Llama 3.3 Reasoning model for Chat Assistant
 */
export const getChatResponse = async (messages) => {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are EcoGuide, an expert AI assistant for Cyclos, a civic solid waste management platform. You are an expert in Sustainablity and Waste Management 2026 rules, urban waste pollution, and circular economy. Provide concise, expert-level reasoning. Use civic SWM terminology where appropriate.'
        },
        ...messages
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'NVIDIA NIM API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

/**
 * Llama 3.2 Vision model for Waste Analysis
 */
export const analyzeWasteImage = async (base64Image) => {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta/llama-3.2-11b-vision-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'STRICT INSTRUCTION: Analyze this waste item and RETURN ONLY A VALID JSON OBJECT. DO NOT include any conversational text, explanations, or labels like "Based on the image".\n\nREQUIRED FIELDS:\n- type: (string, e.g., "Copper Wire", "Mixed Organic")\n- stream: (string, "Dry Waste", "Wet Waste", "E-Waste", "Hazardous")\n- grade: (string, "A", "B", "C")\n- recyclability_score: (string, e.g., "94%")\n- weight_estimation: (string, just the number, e.g., "8")\n- price_per_kg: (string, just the number, e.g., "800")\n- co2_per_kg: (string, just the number, e.g., "13.5")\n- selling_potential: (string, "YES", "NO", "Only if bulk")\n- confidence: (string, just the number e.g., "91")'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'NVIDIA NIM API error');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Attempt to parse JSON from response with a robust extraction logic
  try {
    // 1. Try to find JSON inside backticks or just the raw braces
    const jsonRegex = /({[\s\S]*})/;
    const match = content.match(jsonRegex);
    const jsonString = match ? match[1] : content;
    
    // 2. Clear any invisible characters or weird AI prefix/suffix
    const cleanedString = jsonString.trim();
    return JSON.parse(cleanedString);
  } catch (e) {
    console.warn('AI JSON Parse failed, attempting fallback extraction:', content);
    
    // Fallback: Manually extract fields if the AI returned markdown
    const fallback = {
      type: content.match(/Type:\s*(.*)/i)?.[1] || "Unidentified Item",
      stream: content.match(/Stream:\s*(.*)/i)?.[1] || "Dry Waste",
      grade: content.match(/Grade:\s*(.*)/i)?.[1] || "B",
      recyclability_score: content.match(/Recyclability:\s*(.*)/i)?.[1] || "50%",
      weight_estimation: content.match(/Weight:\s*(.*)/i)?.[1]?.replace(/[^0-9.]/g, '') || "1",
      price_per_kg: content.match(/Price:\s*(.*)/i)?.[1]?.replace(/[^0-9.]/g, '') || "10",
      co2_per_kg: content.match(/CO2:\s*(.*)/i)?.[1]?.replace(/[^0-9.]/g, '') || "5",
      selling_potential: content.match(/Selling:\s*(.*)/i)?.[1] || "YES",
      confidence: content.match(/Confidence:\s*(.*)/i)?.[1]?.replace(/[^0-9.]/g, '') || "85"
    };

    // If we couldn't even extract via regex, throw the error
    if (fallback.type === "Unidentified Item" && fallback.weight_estimation === "Unknown") {
      throw new Error('AI returned an unparseable response format.');
    }
    
    return fallback;
  }
};

/**
 * Llama 3.3 Reasoning model for SOS Report Email Generation
 */
export const generateSOSEmailBody = async (incidentType, location, userDescription = '') => {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an automated emergency dispatch assistant for Cyclos SWM Platform. Your job is to draft a highly professional, concise, and official SOS email report addressed to BBMP and KSPCB Authorities. The email must be extremely clear about the coordinates, incident type, and immediate action required.'
        },
        {
          role: 'user',
          content: `Generate a short official SOS email for the following incident:\nType: ${incidentType}\nLocation/Coordinates: ${location}\nAdditional Details: ${userDescription || 'None provided.'}\n\nDo NOT include subject line in your output, just the body of the email. Keep it urgent, structured with bullet points if necessary, and highly professional.`
        }
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'NVIDIA NIM API error');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};
