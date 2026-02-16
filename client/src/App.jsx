import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mermaid from 'mermaid';
import { Wand2, Layout, History, ChevronRight, Loader2 } from 'lucide-react';

// Initialize Mermaid
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

  // Fetch history from Atlas when the app loads
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/diagrams');
      setHistory(res.data);
    } catch (err) { console.error("Could not fetch history"); }
  };

  // Re-render diagram whenever code changes
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
      fetchHistory(); // Refresh the list
    } catch (error) { alert("The Brain is offline. Check server!"); }
    finally { setLoading(false); }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar - History */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <History size={18} /> <h2 style={{fontSize: '16px'}}>Saved Logic</h2>
        </div>
        <div style={styles.historyList}>
          {history.map((item) => (
            <div key={item._id} style={styles.historyItem} onClick={() => setDiagramCode(item.mermaidCode)}>
              <p style={styles.historyText}>{item.prompt.substring(0, 35)}...</p>
              <ChevronRight size={14} />
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content - Workspace */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <Layout size={28} color="#2563eb" />
            <h1 style={styles.title}>LogicDraft <span style={{color: '#2563eb'}}>AI</span></h1>
          </div>
        </header>

        <section style={styles.workspace}>
          <div style={styles.inputCard}>
            <textarea
              style={styles.textarea}
              placeholder="Describe a diagram (e.g. A Sequence diagram for an ATM withdrawal)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button onClick={handleGenerate} disabled={loading} style={styles.button}>
              {loading ? <Loader2 className="animate-spin" /> : <><Wand2 size={18} /> Generate</>}
            </button>
          </div>

          <div style={styles.canvasCard}>
            <div key={diagramCode} className="mermaid" ref={chartRef}>
              {diagramCode}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b' },
  sidebar: { width: '280px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '15px', borderBottom: '1px solid #334155', marginBottom: '20px' },
  historyList: { flex: 1, overflowY: 'auto' },
  historyItem: { padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid transparent', transition: '0.2s' },
  historyText: { fontSize: '13px', margin: 0, opacity: 0.8 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { padding: '15px 30px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' },
  title: { fontSize: '20px', fontWeight: 'bold', margin: 0 },
  workspace: { flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '25px' },
  inputCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  textarea: { width: '100%', minHeight: '80px', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', resize: 'vertical' },
  button: { marginTop: '12px', width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: '600' },
  canvasCard: { backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minHeight: '400px', display: 'flex', justifyContent: 'center' }
};

export default App;