module.exports = async function handler(req, res) {
    const API_KEY = process.env.OPENROUTER_API_KEY;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!API_KEY) {
        console.error('OPENROUTER_API_KEY is missing');
        return res.status(500).json({ error: 'Server configuration error: API key missing. Please set OPENROUTER_API_KEY in your deployment environment variables.' });
    }

    const { model, messages, temperature, max_tokens } = req.body;

    if (!model || !messages) {
        return res.status(400).json({ error: 'Missing required fields: model, messages' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': req.headers.origin || 'https://vercel.app',
                'X-Title': 'Test Generator Chatbot'
            },
            body: JSON.stringify({ model, messages, temperature, max_tokens })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'OpenRouter API error' });
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
