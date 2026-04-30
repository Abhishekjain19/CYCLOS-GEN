const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const getGeminiChatResponse = async (messages) => {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not defined. Please add it to your .env file.');
  }

  // Convert generic messages (role: 'user' | 'assistant') to Gemini format (role: 'user' | 'model')
  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: geminiMessages,
      systemInstruction: {
        role: 'system',
        parts: [{ text: 'You are EcoGuide, an expert AI assistant for Cyclos, a civic solid waste management platform. You are an expert in Sustainablity and Waste Management 2026 rules, urban waste pollution, and circular economy. Provide concise, expert-level reasoning. Use civic SWM terminology where appropriate. Keep your answers brief, engaging, and conversational as this is for voice mode.' }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  if (data.candidates && data.candidates.length > 0) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Invalid response from Gemini');
};
