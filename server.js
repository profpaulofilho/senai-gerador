const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/gerar', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt não informado' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada.' });

  console.log('Chamando API Gemini... Prompt:', prompt.length, 'chars');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
      })
    });

    console.log('Status Gemini:', response.status);

    if (response.status === 429) return res.status(429).json({ error: 'Muitas requisições. Aguarde 1 minuto.' });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Erro Gemini:', response.status, errBody);
      return res.status(response.status).json({ error: `Erro na API: ${response.status}`, detail: errBody });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ content: [{ type: 'text', text }] });

  } catch (err) {
    console.error('Erro interno:', err.message);
    res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('✅ Servidor rodando na porta ' + PORT));
