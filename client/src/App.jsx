import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { Wand2, Layout, History, Loader2, Trash2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: { primaryColor: '#e1f5fe', edgeColor: '#2563eb', fontFamily: 'Inter, sans-serif' }
});

function App() {
  const [prompt, setPrompt] = useState("");
  const [diagramCode, setDiagramCode] = useState("graph TD\n  A[Prompt AI] --> B(See Diagram)");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/diagrams');
      setHistory(res.data);
    } catch (err) { console.error("History fetch failed"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    if(window.confirm("Delete this diagram?")) {
      await axios.delete(`http://localhost:5000/api/diagrams/${id}`);
      fetchHistory();
    }
  };

  const downloadPDF = async () => {
    const element = chartRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save("LogicDraft-Full.pdf");
    } catch (err) { alert("Export failed"); }
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
    }
  }, [diagramCode]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/generate', { prompt });
      setDiagramCode(response.data.mermaidCode);
      fetchHistory();
    } catch (error) { alert("Server error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <History size={18} /> <h2 style={{fontSize: '16px'}}>Saved Logic</h2>
        </div>
        <div style={styles.historyList}>
          {history.map((item) => (
            <div key={item._id} style={styles.historyItem} onClick={() => setDiagramCode(item.mermaidCode)}>
              <p style={styles.historyText}>{item.prompt.substring(0, 20)}...</p>
              <Trash2 size={14} color="#ef4444" onClick={(e) => handleDelete(item._id, e)} style={{cursor: 'pointer'}} />
            </div>
          ))}
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Layout size={28} color="#2563eb" />
              <h1 style={styles.title}>LogicDraft <span style={{color: '#2563eb'}}>AI</span></h1>
            </div>
            <button onClick={downloadPDF} style={styles.downloadBtn}>
              <Download size={16} /> Export Full PDF
            </button>
          </div>
        </header>

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
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f1f5f9', overflow: 'hidden' },
  sidebar: { width: '280px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' },
  historyList: { flex: 1, overflowY: 'auto' },
  historyItem: { padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyText: { fontSize: '12px', margin: 0 },
  
  main: { flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', height: '100vh', overflow: 'hidden' },
  header: { backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '15px 30px' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 'bold', margin: 0 },
  downloadBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  
  workspace: { padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '25px', flexGrow: 1 },
  inputCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  textarea: { width: '100%', minHeight: '100px', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', outline: 'none' },
  button: { marginTop: '15px', width: '100%', padding: '14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  
  canvasCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'center' },
  mermaidWrapper: { width: '100%', display: 'flex', justifyContent: 'center' }
};

export default App;