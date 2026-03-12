const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/gerar', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt não informado' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave OPENAI_API_KEY não configurada.' });
  }

  console.log('Chamando API OpenAI... Prompt:', prompt.length, 'chars');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        input: prompt,
        temperature: 0.7,
        max_output_tokens: 8192
      })
    });

    console.log('Status OpenAI:', response.status);

    if (response.status === 429) {
      return res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Erro OpenAI:', response.status, errBody);
      return res.status(response.status).json({
        error: `Erro na API: ${response.status}`,
        detail: errBody
      });
    }

    const data = await response.json();

    const text =
      data.output_text ||
      data.output?.map(item =>
        item.content?.map(part => part.text || '').join('')
      ).join('\n') ||
      '';

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
