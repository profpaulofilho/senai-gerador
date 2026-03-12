const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// Endpoint que faz a chamada à API Anthropic com a chave guardada no servidor
app.post('/api/gerar', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt não informado' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API não configurada no servidor' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (response.status === 429) {
      return res.status(429).json({ error: 'Muitas requisições. Tente novamente em 1 minuto.' });
    }

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Erro na API: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
