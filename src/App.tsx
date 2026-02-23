import React, { useState, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import { faceRecognitionService } from './services/FaceRecognitionService';
import { Shield, Target, Cpu, Database, Activity, Terminal, Trash2, LayoutDashboard, Settings, Layers, Box } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<'recognize' | 'register'>('recognize');
  const [registeredCount, setRegisteredCount] = useState(0);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  useEffect(() => {
    addLog('System Kernel v4.2 Initialize...');
    faceRecognitionService.loadModels().then(() => {
      setRegisteredCount(faceRecognitionService.getRegisteredFacesCount());
      addLog('Biometric Engines: ONLINE');
      addLog('Secure Vault Proxy: STABLE');
    });
  }, []);

  const handleRegister = async (name: string, descriptor: Float32Array) => {
    addLog(`Encrypting Identity: ${name}`);
    await faceRecognitionService.registerFace(name, descriptor);
    setRegisteredCount(faceRecognitionService.getRegisteredFacesCount());
    setMode('recognize');
    addLog('Identity Synced to Kernel.');
  };

  const clearData = () => {
    if (confirm('CRITICAL: Purge all biometric data?')) {
      faceRecognitionService.clearRegisteredFaces();
      setRegisteredCount(0);
      addLog('Vault Purged Successfully.');
    }
  };

  return (
    <div className="app-root">
      {/* Premium Header */}
      <header className="site-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-logo shadow-glow">
              <Shield className="w-6 h-6" />
            </div>
            <div className="brand-text">
              <h1 className="font-tech text-xl tracking-widest italic uppercase">
                Vision<span className="text-blue-500">ID</span>
              </h1>
              <span className="label-mini text-slate-500">Security Nexus v4.2</span>
            </div>
          </div>

          <div className="header-actions">
            <div className="status-badge">
              <div className="pulse-emerald" />
              <span className="font-mono text-[10px] uppercase font-bold text-emerald-500">Server Uplink: Active</span>
            </div>
            <button onClick={clearData} className="btn-icon-danger">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Navigation & Controls Side */}
        <aside className="sidebar">
          <section className="control-group">
            <span className="label-mini">System Directives</span>
            <div className="v-stack">
              <button
                onClick={() => setMode('recognize')}
                className={`nav-item ${mode === 'recognize' ? 'active' : ''}`}
              >
                <Target className="w-5 h-5" />
                <div className="nav-text">
                  <span className="nav-title">Biometric Scan</span>
                  <span className="nav-sub">Real-time identification</span>
                </div>
              </button>

              <button
                onClick={() => setMode('register')}
                className={`nav-item ${mode === 'register' ? 'active' : ''}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <div className="nav-text">
                  <span className="nav-title">ID Enrolment</span>
                  <span className="nav-sub">Register new profile</span>
                </div>
              </button>
            </div>
          </section>

          <section className="status-group card">
            <span className="label-mini">Hardware Telemetry</span>
            <div className="telemetry-list">
              <div className="tele-item">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="tele-label">Neural Engine</span>
                <span className="tele-val text-blue-500">8-CORE</span>
              </div>
              <div className="tele-item">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="tele-label">Vault Status</span>
                <span className="tele-val text-emerald-500">ENCRYPTED</span>
              </div>
              <div className="tele-item">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="tele-label">Database Load</span>
                <span className="tele-val text-amber-500">{registeredCount} PROFILES</span>
              </div>
            </div>
          </section>

          <section className="log-panel card">
            <div className="log-header">
              <Terminal className="w-3 h-3" />
              <span className="label-mini mb-0">Kernel Output</span>
            </div>
            <div className="log-stream font-mono">
              {systemLogs.map((log, i) => (
                <div key={i} className="log-entry animate-fade-in">
                  <span className="log-caret text-blue-500">{'>'}</span> {log}
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Main Scanner Section */}
        <section className="viewport-center">
          <div className="scanner-presentation-layer">
            <CameraFeed mode={mode} onRegisterSubmit={handleRegister} />
          </div>

          <div className="metadata-footer grid-2">
            <div className="card-glass">
              <div className="flex items-center gap-3 mb-4 text-blue-400">
                <Layers className="w-5 h-5" />
                <h3 className="font-tech text-sm tracking-widest uppercase mb-0">Encryption Mesh</h3>
              </div>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Biometric vectors are hashed via local SHA-512 equivalent protocols.
                Data never transits beyond memory bounds. No remote persistence engaged.
              </p>
            </div>
            <div className="card-glass">
              <div className="flex items-center gap-3 mb-4 text-indigo-400">
                <Box className="w-5 h-5" />
                <h3 className="font-tech text-sm tracking-widest uppercase mb-0">Model Params</h3>
              </div>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Architecture: SSD_MOBILENET_V1. Accuracy threshold: 0.62.
                Latency: ~32ms on Tensor-Accelerated WebAssembly.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p className="label-mini text-slate-700 m-0">Secure Biometric Identification System , made by Shuvam Bhattacharya</p>
        <div className="footer-links">
          <Settings className="w-4 h-4 text-slate-700 cursor-pointer hover:text-white transition-colors" />
        </div>
      </footer>

    </div>
  );
};

export default App;

