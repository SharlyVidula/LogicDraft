const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors()); // Allows your React app to talk to this server
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const mongoose = require('mongoose');

// 1. Connection to Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🍃 LogicDraft is LIVE on MongoDB Atlas!"))
  .catch(err => console.error("Database connection failed:", err));

// 2. Define the Schema (The Blueprint for a Diagram)
const diagramSchema = new mongoose.Schema({
  prompt: String,
  mermaidCode: String,
  createdAt: { type: Date, default: Date.now }
});
const Diagram = mongoose.model('Diagram', diagramSchema);

// 3. Update your Generate Route
app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const systemPrompt = `Convert to Mermaid.js syntax. Output ONLY code.`; 
        
        const result = await model.generateContent(`${systemPrompt}\nUser Request: ${prompt}`);
        const mermaidCode = result.response.text().trim();

        // SAVE TO CLOUD
        const newDoc = await Diagram.create({ prompt, mermaidCode });

        res.json(newDoc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate', async (req, res) => {
    const { prompt, diagramType } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // THE CORE LOGIC: We "prime" the AI to only output Mermaid code
        const systemPrompt = `
            You are a Software Engineering Diagram Generator.
            Your task: Convert the user's description into a valid Mermaid.js diagram.
            
            STRICT RULES:
            1. Output ONLY the raw Mermaid syntax.
            2. DO NOT include markdown code blocks like \`\`\`mermaid or \`\`\`.
            3. Do not include any conversational text, explanations, or greetings.
            4. Ensure syntax follows SE standards (UML, ERD, Flowcharts).
            
            Current Requested Diagram Type: ${diagramType || 'General Flowchart'}
        `;

        const result = await model.generateContent(`${systemPrompt}\n\nUser Request: ${prompt}`);
        const response = await result.response;
        const text = response.text().trim();

        res.json({ mermaidCode: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate diagram logic." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Brain active on port ${PORT}`));