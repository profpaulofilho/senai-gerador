const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/gerar', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt não informado' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Chave ANTHROPIC_API_KEY não configurada.' });

  console.log('Chamando API Anthropic...');
  console.log('Modelo: claude-sonnet-4-20250514');
  console.log('Prompt length:', prompt.length);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('Status da API:', response.status);

    if (response.status === 429) {
      return res.status(429).json({ error: 'Muitas requisições. Aguarde 1 minuto.' });
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Erro API Anthropic:', response.status, errBody);
      return res.status(response.status).json({ 
        error: `Erro na API: ${response.status}`,
        detail: errBody
      });
    }

    const data = await response.json();
    console.log('Resposta OK — tokens usados:', data.usage?.output_tokens);
    res.json(data);

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
