const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

const ZAPIER_SECRET = process.env.ZAPIER_SECRET;
const PORT = process.env.PORT || 3000;

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy endpoint — receives patient data, writes to Zapier Storage
app.post('/set-patient', async (req, res) => {
  const { patient_id, patient_name } = req.body;

  if (!patient_name) {
    return res.status(400).json({ error: 'patient_name is required' });
  }

  if (!ZAPIER_SECRET) {
    return res.status(500).json({ error: 'ZAPIER_SECRET env var not set' });
  }

  try {
    const response = await fetch('https://store.zapier.com/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret': ZAPIER_SECRET,
      },
      body: JSON.stringify({
        selected_patient_id: patient_id || '',
        selected_patient_name: patient_name,
        selected_at: Date.now(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Zapier Storage error:', response.status, text);
      return res.status(502).json({ error: 'Zapier Storage write failed', detail: text });
    }

    const data = await response.json();
    res.json({ ok: true, data });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
