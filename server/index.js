const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
// Enable CORS for your Vercel frontend later
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🍃 LogicDraft is LIVE on MongoDB Atlas!"))
  .catch(err => console.error("❌ DB Connection Failed:", err.message));

// ADDED: userId to the schema so diagrams belong to specific accounts
const Diagram = mongoose.model('Diagram', new mongoose.Schema({
  prompt: String,
  mermaidCode: String,
  userId: String, 
  createdAt: { type: Date, default: Date.now }
}));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
    // ADDED: Expect userId from the frontend
    const { prompt, userId } = req.body;
    
    if(!userId) return res.status(401).json({ error: "Please log in first!" });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const systemPrompt = "Convert this to Mermaid.js code. Output ONLY raw code, no markdown.";
        const result = await model.generateContent(`${systemPrompt}\n\nRequest: ${prompt}`);
        const text = result.response.text().trim();

        const cleanCode = text.replace(/```mermaid/g, "").replace(/```/g, "").trim();
        
        // ADDED: Save the diagram with the user's specific ID attached
        const newDoc = await Diagram.create({ prompt, mermaidCode: cleanCode, userId });
        
        console.log("✅ Success! Diagram saved.");
        res.json(newDoc);
    } catch (error) {
        console.error("❌ AI Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/diagrams', async (req, res) => {
    // ADDED: Filter history by the logged-in user's ID
    const { userId } = req.query;
    if(!userId) return res.json([]); 

    try {
        const history = await Diagram.find({ userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/diagrams/:id', async (req, res) => {
    try {
        await Diagram.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// The dynamic port for deployment
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Brain active on port ${PORT}`));