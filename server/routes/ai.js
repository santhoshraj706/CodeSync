const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Helper to call Gemini
async function askGemini(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// POST /api/ai/explain - Explain the given code
router.post('/explain', async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const prompt = `You are an expert ${language || 'programming'} teacher. Explain the following code clearly and concisely in 3-5 bullet points. Be beginner-friendly. Do not use markdown headers, just use bullet points (•):\n\n\`\`\`${language || ''}\n${code}\n\`\`\``;
    const text = await askGemini(prompt);
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini explain error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// POST /api/ai/fix - Fix bugs in the given code
router.post('/fix', async (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const prompt = `You are an expert ${language || 'programming'} developer. Analyze the following code for bugs, errors, and improvements. Return ONLY the corrected code with a brief comment on what was changed. Do not include any explanation outside the code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``;
    const text = await askGemini(prompt);
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini fix error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// POST /api/ai/chat - AI coding assistant chat
router.post('/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const systemContext = context
      ? `You are CodeSync AI, a helpful coding assistant. The user is currently working on code in a collaborative coding session. Here is their current code context:\n\`\`\`\n${context}\n\`\`\`\n\n`
      : `You are CodeSync AI, a helpful and friendly coding assistant in a collaborative coding IDE. `;

    const prompt = `${systemContext}User says: ${message}\n\nRespond helpfully and concisely. If showing code, use backtick code blocks.`;
    const text = await askGemini(prompt);
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini chat error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// POST /api/ai/summarize-chat - Summarize chat messages
router.post('/summarize-chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ error: 'Messages are required' });

  try {
    const chatLog = messages.map(m => `${m.username}: ${m.message}`).join('\n');
    const prompt = `You are a meeting summarizer. Summarize the following collaborative coding session chat in 3-5 concise bullet points, focusing on key decisions, questions, and topics discussed. Use bullet points (•):\n\n${chatLog}`;
    const text = await askGemini(prompt);
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini summarize error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// POST /api/ai/generate - Generate code from a description
router.post('/generate', async (req, res) => {
  const { description, language } = req.body;
  if (!description) return res.status(400).json({ error: 'Description is required' });

  try {
    const prompt = `You are an expert ${language || 'programming'} developer. Generate clean, well-commented ${language || ''} code for the following task. Return ONLY the code, no extra explanation:\n\n${description}`;
    const text = await askGemini(prompt);
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini generate error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

module.exports = router;
