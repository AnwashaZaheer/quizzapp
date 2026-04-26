require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const API_KEY = process.env.OPENROUTER_API_KEY;

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // ── CORS headers ────────────────────────────────────────────────
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // ── POST /api/chat ───────────────────────────────────────────────
    if (req.method === 'POST' && url.pathname === '/api/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            if (!API_KEY) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'OPENROUTER_API_KEY not set in .env' }));
            }
            try {
                const { model, messages, temperature, max_tokens } = JSON.parse(body);
                const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`,
                        'HTTP-Referer': `http://localhost:${PORT}`,
                        'X-Title': 'Test Generator Chatbot'
                    },
                    body: JSON.stringify({ model, messages, temperature, max_tokens })
                });
                const data = await upstream.json();
                res.writeHead(upstream.ok ? 200 : upstream.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // ── GET /api/validate-key ────────────────────────────────────────
    if (req.method === 'GET' && url.pathname === '/api/validate-key') {
        if (!API_KEY) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ valid: false, error: 'OPENROUTER_API_KEY not set in .env' }));
        }
        try {
            const upstream = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const data = await upstream.json();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: upstream.ok, credits: data.data?.limit_remaining ?? null }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ valid: false, error: err.message }));
        }
        return;
    }

    // ── Static files ─────────────────────────────────────────────────
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    filePath = path.join(__dirname, filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404); res.end('Not found');
        } else {
            const ext = path.extname(filePath);
            const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[ext] || 'text/plain';
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n✅  App running at → http://localhost:${PORT}`);
    console.log(`🔑  API key loaded: ${API_KEY ? 'YES' : 'NO — check your .env file'}\n`);
});
