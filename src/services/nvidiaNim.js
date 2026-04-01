const NVIDIA_API_KEY = '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';
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
          content: 'You are EcoCaptain, an expert AI assistant for Cyclos, a marine waste management platform. You are an expert in SWM 2026 rules, ocean pollution, and circular economy. Provide concise, expert-level reasoning. Use marine-themed terminology where appropriate.'
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
              text: 'STRICT INSTRUCTION: Analyze this waste item and RETURN ONLY A VALID JSON OBJECT. DO NOT include any conversational text, explanations, or labels like "Based on the image".\n\nREQUIRED FIELDS:\n- type: (string, e.g., "Plastic Water Bottle")\n- weight_estimation: (string, e.g., "0.5 kg")\n- recycling_cost: (string, e.g., "₹14.00")\n- recycled_product_suggestion: (string, e.g., "Polyester fabric")\n- co2_impact: (string, e.g., "1.5 kg")'
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
      weight_estimation: content.match(/Weight Estimation:\s*(.*)/i)?.[1] || "Unknown",
      recycling_cost: content.match(/Recycling Cost:\s*(.*)/i)?.[1] || "₹0.00",
      recycled_product_suggestion: content.match(/Recycled Product Suggestion:\s*(.*)/i)?.[1] || "General Disposal",
      co2_impact: content.match(/CO2 Impact:\s*(.*)/i)?.[1] || "Negligible"
    };

    // If we couldn't even extract via regex, throw the error
    if (fallback.type === "Unidentified Item" && fallback.weight_estimation === "Unknown") {
      throw new Error('AI returned an unparseable response format.');
    }
    
    return fallback;
  }
};
