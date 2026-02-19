const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database - Ensure MONGO_URI is in your .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🍃 LogicDraft is LIVE on MongoDB Atlas!"))
  .catch(err => console.error("❌ DB Connection Failed:", err.message));

const Diagram = mongoose.model('Diagram', new mongoose.Schema({
  prompt: String,
  mermaidCode: String,
  createdAt: { type: Date, default: Date.now }
}));

// 2. AI Setup - Using the most stable model name
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    try {
        // We use 'gemini-1.5-flash' - make sure there are NO spaces in your .env key!
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const systemPrompt = "Convert this to Mermaid.js code. Output ONLY raw code, no markdown.";
        const result = await model.generateContent(`${systemPrompt}\n\nRequest: ${prompt}`);
        const text = result.response.text().trim();

        // Clean the code and save
        const cleanCode = text.replace(/```mermaid/g, "").replace(/```/g, "").trim();
        const newDoc = await Diagram.create({ prompt, mermaidCode: cleanCode });
        
        console.log("✅ Success! Diagram saved.");
        res.json(newDoc);
    } catch (error) {
        console.error("❌ AI Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/diagrams', async (req, res) => {
    const history = await Diagram.find().sort({ createdAt: -1 });
    res.json(history);
});

app.listen(5000, () => console.log(`🚀 Brain active on port 5000`));