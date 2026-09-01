export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, type, image } = req.body;
  
  if (!prompt && !image) {
    return res.status(400).json({ error: 'Missing prompt or image' });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured',
      details: 'Please set GROQ_API_KEY in environment variables.'
    });
  }

  let systemPrompt = type === 'summarize'
    ? 'Summarize the following text concisely in 3-5 sentences.'
    : 'You are a helpful academic tutor for African students. Answer clearly and simply.';

  let userContent = prompt;
  if (image) {
    userContent += `\n\n[Image: ${image}]`;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // ✅ FIXED: Using a working model name
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'API error',
        details: data.error
      });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
