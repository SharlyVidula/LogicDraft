# 🧠 LogicDraft AI

LogicDraft is a full-stack, AI-powered web application that instantly converts natural language prompts into professional, production-ready diagrams and flowcharts. 

Built with the MERN stack and powered by Google's Gemini AI, this application eliminates the need for manual diagramming by generating raw Mermaid.js syntax and rendering it flawlessly on the fly. 

## ✨ Key Features

* **🤖 AI Diagram Generation:** Leverages Google's `gemini-flash-latest` model to translate complex text prompts into precise Mermaid.js code.
* **📊 Live Rendering:** Dynamically parses and renders flowcharts, sequence diagrams, and ER diagrams natively in the browser.
* **🔒 Secure User Authentication:** Integrated with **Clerk** for seamless, secure Google OAuth and Email login.
* **💾 Private Cloud Storage:** Connects to **MongoDB Atlas** to securely save and retrieve user-specific diagram history.
* **📄 High-Fidelity PDF Exports:** Utilizes advanced HTML-to-canvas rendering (`html-to-image` + `jspdf`) to bypass standard SVG security limitations, allowing users to export massive, high-resolution diagrams.
* **📱 Fully Responsive UI:** Features a mobile-first, responsive workspace with a collapsible sidebar for mobile devices.

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* Clerk (Authentication)
* Mermaid.js (Diagram Rendering)
* HTML-to-Image & jsPDF (Exporting)
* Lucide React (Icons)

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose (Database)
* Google Generative AI SDK (Gemini)

**Deployment:**
* Frontend: Vercel
* Backend: Render

## 🚀 Local Development Setup

Follow these steps to run LogicDraft locally on your machine.

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/LogicDraft.git](https://github.com/yourusername/LogicDraft.git)
cd LogicDraft