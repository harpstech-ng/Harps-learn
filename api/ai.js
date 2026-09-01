export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, type, image } = req.body;
  
  if (!prompt && !image) {
    return res.status(400).json({ error: 'Missing prompt or image' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured',
      details: 'Please set OPENROUTER_API_KEY in environment variables.'
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://harpslearn.vercel.app',
        'X-Title': 'HarpsLearn AI'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free', // Free model on OpenRouter
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
      console.error('OpenRouter error:', data);
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
