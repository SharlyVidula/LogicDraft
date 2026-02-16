const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors()); // Allows your React app to talk to this server
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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