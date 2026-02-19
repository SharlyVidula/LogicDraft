import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { Wand2, Layout, History, Loader2, Trash2, Download, Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react"; // ADDED CLERK IMPORTS
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: { primaryColor: '#e1f5fe', edgeColor: '#2563eb', fontFamily: 'Inter, sans-serif' },
  htmlLabels: false, // ADDED: Fixes the ER Diagram PDF export crash!
  securityLevel: 'loose'
});

function App() {
  const [prompt, setPrompt] = useState("");
  const [diagramCode, setDiagramCode] = useState("graph TD\n  A[Prompt AI] --> B(See Diagram)");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chartRef = useRef(null);
  
  const { userId } = useAuth(); // ADDED: Grabs the Google User ID from Clerk
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ADDED: Only fetch history if the user is successfully logged in
  useEffect(() => { 
    if (userId) fetchHistory(); 
    else setHistory([]); 
  }, [userId]);

  const fetchHistory = async () => {
    try {
      // ADDED: Send userId to the server to get private history
      const res = await axios.get(`${API_URL}/api/diagrams?userId=${userId}`);
      setHistory(res.data);
    } catch (err) { console.error("History fetch failed"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    if(window.confirm("Delete this diagram?")) {
      await axios.delete(`${API_URL}/api/diagrams/${id}`);
      fetchHistory();
    }
  };

  const downloadPDF = async () => {
    const element = chartRef.current;
    if (!element) return;

    try {
      // 1. html-to-image perfectly captures SVGs without triggering browser security blocks
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff', // Ensures the PDF doesn't have a transparent/black background
        pixelRatio: 2 // Doubles the resolution for a crisp, professional look
      });
      
      // 2. Calculate the dimensions for the PDF page
      const width = element.scrollWidth * 2;
      const height = element.scrollHeight * 2;

      // 3. Create and save the PDF
      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width, height]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save("LogicDraft-Full.pdf");

    } catch (err) { 
      console.error("PDF Export Error:", err);
      alert("Export failed! Check the browser console."); 
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
    }
  }, [diagramCode]);

  const handleGenerate = async () => {
    if (!prompt || !userId) return; // ADDED: Block generation if not logged in
    setLoading(true);
    try {
      // ADDED: Send the Google User ID to the server
      const response = await axios.post(`${API_URL}/api/generate`, { prompt, userId });
      setDiagramCode(response.data.mermaidCode);
      fetchHistory();
      if (isMobile) setSidebarOpen(false);
    } catch (error) { alert("Server error. The Brain might be sleeping."); }
    finally { setLoading(false); }
  };

  const styles = getStyles(isMobile, sidebarOpen);

  return (
    <div style={styles.container}>
      {isMobile && sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <History size={18} /> <h2 style={{fontSize: '16px', margin: 0}}>Saved Logic</h2>
          </div>
          {isMobile && <X size={20} style={{cursor: 'pointer'}} onClick={() => setSidebarOpen(false)} />}
        </div>
        
        {/* ADDED: Only show history if logged in */}
        <SignedIn>
          <div style={styles.historyList}>
            {history.map((item) => (
              <div key={item._id} style={styles.historyItem} onClick={() => { setDiagramCode(item.mermaidCode); if(isMobile) setSidebarOpen(false); }}>
                <p style={styles.historyText}>{item.prompt.substring(0, 20)}...</p>
                <Trash2 size={14} color="#ef4444" onClick={(e) => handleDelete(item._id, e)} style={{cursor: 'pointer'}} />
              </div>
            ))}
          </div>
        </SignedIn>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              {isMobile && (
                <Menu size={24} color="#0f172a" style={{cursor: 'pointer'}} onClick={() => setSidebarOpen(true)} />
              )}
              <Layout size={isMobile ? 24 : 28} color="#2563eb" />
              <h1 style={styles.title}>LogicDraft <span style={{color: '#2563eb'}}>AI</span></h1>
            </div>
            
            {/* ADDED: Login/Logout Buttons */}
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <SignedIn>
                <button onClick={downloadPDF} style={styles.downloadBtn}>
                  <Download size={16} /> {isMobile ? "PDF" : "Export Full PDF"}
                </button>
                <UserButton /> 
              </SignedIn>
              
              <SignedOut>
                <SignInButton mode="modal">
                  <button style={styles.loginBtn}>Sign In</button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </header>

        {/* ADDED: Welcome screen for logged out users */}
        <SignedOut>
          <div style={styles.welcomeScreen}>
            <h2>Welcome to LogicDraft</h2>
            <p>Please Sign In with Google to generate and save your diagrams.</p>
            <SignInButton mode="modal">
               <button style={styles.button}>Get Started for Free</button>
            </SignInButton>
          </div>
        </SignedOut>

        {/* ADDED: Hide workspace until logged in */}
        <SignedIn>
          <section style={styles.workspace}>
            <div style={styles.inputCard}>
              <textarea
                style={styles.textarea}
                placeholder="Describe a diagram..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <button onClick={handleGenerate} disabled={loading} style={styles.button}>
                {loading ? <Loader2 className="animate-spin" /> : <><Wand2 size={18} /> Generate</>}
              </button>
            </div>

            <div style={styles.canvasCard}>
              <div key={diagramCode} className="mermaid" ref={chartRef} style={styles.mermaidWrapper}>
                {diagramCode}
              </div>
            </div>
          </section>
        </SignedIn>
      </main>
    </div>
  );
}

const getStyles = (isMobile, sidebarOpen) => ({
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f1f5f9', overflow: 'hidden', position: 'relative' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 },
  sidebar: { width: '280px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column', flexShrink: 0, position: isMobile ? 'absolute' : 'relative', height: '100%', zIndex: 50, transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none', transition: 'transform 0.3s ease-in-out', boxShadow: isMobile && sidebarOpen ? '4px 0 15px rgba(0,0,0,0.3)' : 'none' },
  sidebarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' },
  historyList: { flex: 1, overflowY: 'auto' },
  historyItem: { padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyText: { fontSize: '12px', margin: 0 },
  main: { flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', height: '100vh', overflow: 'hidden', width: '100%' },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: isMobile ? '15px' : '15px 30px' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', margin: 0, color: '#0f172a' },
  downloadBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '8px 12px' : '10px 18px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: isMobile ? '12px' : '14px' },
  loginBtn: { padding: '8px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  workspace: { padding: isMobile ? '15px' : '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 },
  welcomeScreen: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '15px', color: '#0f172a', textAlign: 'center', padding: '20px' },
  inputCard: { backgroundColor: '#fff', padding: isMobile ? '15px' : '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  textarea: { width: '100%', minHeight: '100px', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none', boxSizing: 'border-box' },
  button: { marginTop: '15px', width: '100%', padding: '14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' },
  canvasCard: { backgroundColor: '#fff', padding: isMobile ? '20px' : '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'center', overflowX: 'auto' },
  mermaidWrapper: { minWidth: isMobile ? '100%' : 'auto', display: 'flex', justifyContent: 'center' }
});

export default App;