const API_KEY = process.env.OPENROUTER_API_KEY;

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!API_KEY) {
        return res.status(500).json({ valid: false, error: 'OPENROUTER_API_KEY is not set in environment variables' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': req.headers.origin || 'https://vercel.app',
                'X-Title': 'Test Generator Chatbot'
            }
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ valid: true, credits: data.data?.limit_remaining ?? null });
        } else {
            return res.status(401).json({ valid: false, error: 'Invalid API key' });
        }
    } catch (error) {
        return res.status(500).json({ valid: false, error: error.message });
    }
};
