import { useState, useEffect } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

export default function LiveSignals({ dark }) {
  const [signals, setSignals] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const t = {
    bg: dark ? "#050a0f" : "#f0f4f8",
    bgCard: dark ? "rgba(0,20,40,0.9)" : "#ffffff",
    border: dark ? "#0d2a42" : "#d0dce8",
    text: dark ? "#c8d8e8" : "#1a2a3a",
    textMuted: dark ? "#8899aa" : "#445566",
    textDim: dark ? "#445566" : "#778899",
    textLabel: dark ? "#667788" : "#556677",
    inputBg: dark ? "rgba(0,40,80,0.2)" : "#e8f0f8",
  };

  const fetchSignals = async () => {
    try {
      const res = await fetch(`${SERVER}/signals`);
      const data = await res.json();
      setSignals(data.signals || {});
      setLastUpdated(data.lastUpdated);
      setIsAnalyzing(data.isAnalyzing);
      setError(null);
    } catch(e) {
      setError("Server offline — retrying...");
    }
    setLoading(false);
  };

  const triggerAnalysis = async () => {
    try {
      await fetch(`${SERVER}/trigger`);
      setTimeout(fetchSignals, 5000);
    } catch(e) {}
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const signalColor = (s) => s === "BUY" ? "#00dd55" : s === "SELL" ? "#ff2244" : "#ffaa00";
  const signalBg = (s) => s === "BUY" ? (dark?"#001a0d":"#e8fff3") : s === "SELL" ? (dark?"#1a0005":"#fff0f3") : (dark?"#1a1000":"#fffbe8");

  const signalList = Object.values(signals);
  const filtered = filter === "ALL" ? signalList
    : filter === "BUY" ? signalList.filter(s => s.signal === "BUY")
    : filter === "SELL" ? signalList.filter(s => s.signal === "SELL")
    : filter === "FOREX" ? signalList.filter(s => s.type === "forex")
    : signalList.filter(s => s.type === "crypto");

  const buys = signalList.filter(s => s.signal === "BUY").length;
  const sells = signalList.filter(s => s.signal === "SELL").length;
  const waits = signalList.filter(s => s.signal === "WAIT").length;

  const timeAgo = (ts) => {
    if (!ts) return "Never";
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  };

  return (
    <div style={{ flex:1, background:t.bg, overflowY:"auto" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .live-pulse{animation:pulse 2s infinite}
        .spin{animation:spin 1s linear infinite;display:inline-block}
        .filter-btn{cursor:pointer;transition:all 0.2s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:10px;letter-spacing:1px;}
        .filter-btn:hover{opacity:0.8}
        .signal-card{transition:all 0.2s}
        .signal-card:hover{transform:translateY(-2px)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"16px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ position:"relative", width:10, height:10 }}>
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"#00dd55" }} />
              {!error && <div className="live-pulse" style={{ position:"absolute", inset:-3, borderRadius:"50%", border:"2px solid #00dd5544" }} />}
            </div>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#00dd55":"#009944", letterSpacing:3 }}>
              LIVE SIGNALS
            </span>
            <span style={{ fontSize:10, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>
              · Auto-refresh 30s
            </span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:10, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>
              {lastUpdated ? `Updated ${timeAgo(lastUpdated)}` : "Loading..."}
            </span>
            <button onClick={triggerAnalysis}
              style={{ background:"#0066ff22", border:"1px solid #0066ff44", color:"#4499ff", padding:"6px 12px", borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer", letterSpacing:1 }}>
              ⟳ REFRESH
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          {[
            { label:"TOTAL", value:signalList.length, color:dark?"#c8d8e8":"#1a2a3a" },
            { label:"BUY", value:buys, color:"#00dd55" },
            { label:"SELL", value:sells, color:"#ff2244" },
            { label:"WAIT", value:waits, color:"#ffaa00" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"12px", textAlign:"center" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", marginBottom:4 }}>{label}</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
          {["ALL","BUY","SELL","FOREX","CRYPTO"].map(f => (
            <button key={f} className="filter-btn" onClick={() => setFilter(f)}
              style={{ padding:"7px 14px", background:filter===f ? "#0066ff" : "transparent", border:`1px solid ${filter===f?"#0066ff":t.border}`, color:filter===f?"#fff":t.textMuted, borderRadius:6 }}>
              {f}
            </button>
          ))}
        </div>

        {/* Server Status */}
        {isAnalyzing && (
          <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            <span className="spin" style={{ fontSize:14 }}>⟳</span>
            <span style={{ fontSize:11, color:"#4499ff", fontFamily:"'IBM Plex Mono',monospace" }}>Server analyzing markets...</span>
          </div>
        )}

        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
            <span style={{ fontSize:11, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>⚠ {error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:40 }}>
            <div className="spin" style={{ fontSize:24, color:"#0066ff" }}>⟳</div>
            <div style={{ marginTop:10, fontSize:11, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>Loading live signals...</div>
          </div>
        )}

        {/* Signals Grid */}
        {!loading && filtered.length === 0 && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:32, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📡</div>
            <div style={{ fontSize:13, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace", marginBottom:8 }}>No signals yet</div>
            <div style={{ fontSize:11, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace", marginBottom:16 }}>Server analyzes every 5 minutes automatically</div>
            <button onClick={triggerAnalysis}
              style={{ background:"linear-gradient(135deg,#0066ff,#0044bb)", border:"none", color:"#fff", padding:"12px 24px", borderRadius:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, cursor:"pointer", letterSpacing:1 }}>
              ⚡ TRIGGER NOW
            </button>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((sig, i) => (
            <div key={i} className="signal-card"
              style={{ background:signalBg(sig.signal), border:`1px solid ${signalColor(sig.signal)}33`, borderLeft:`4px solid ${signalColor(sig.signal)}`, borderRadius:10, padding:"14px 16px" }}>

              {/* Top Row */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:dark?"#fff":"#001133" }}>{sig.symbol}</span>
                  <span style={{ fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace", background:dark?"#0a1520":"#e0eaf4", padding:"2px 8px", borderRadius:4 }}>{sig.timeframe}</span>
                  <span style={{ fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>{sig.type?.toUpperCase()}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:signalColor(sig.signal) }}>
                    {sig.signal==="BUY"?"▲":sig.signal==="SELL"?"▼":"◆"} {sig.signal}
                  </span>
                  <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:700, color:signalColor(sig.signal) }}>{sig.confidence}%</span>
                </div>
              </div>

              {/* Price + Pattern */}
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:6 }}>
                <div>
                  <span style={{ fontSize:9, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace" }}>PRICE </span>
                  <span style={{ fontSize:12, color:dark?"#c8d8e8":"#1a2a3a", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{sig.price}</span>
                </div>
                <div>
                  <span style={{ fontSize:9, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace" }}>PATTERN </span>
                  <span style={{ fontSize:11, color:dark?"#4499cc":"#0055aa", fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>{sig.pattern}</span>
                </div>
                <div>
                  <span style={{ fontSize:9, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace" }}>DURATION </span>
                  <span style={{ fontSize:11, color:"#ffaa00", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{sig.duration}</span>
                </div>
              </div>

              {/* TP/SL */}
              {sig.signal !== "WAIT" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
                  {[
                    { label:"ENTRY", value:sig.entry, color:"#4499ff" },
                    { label:"TP1", value:sig.tp1, color:"#00dd55" },
                    { label:"TP2", value:sig.tp2, color:"#00ee77" },
                    { label:"SL", value:sig.sl, color:"#ff2244" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background:dark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.5)", borderRadius:6, padding:"6px 8px", textAlign:"center" }}>
                      <div style={{ fontSize:8, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:10, color, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reason + Time */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace", flex:1 }}>{sig.reason}</span>
                <span style={{ fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace", marginLeft:8, whiteSpace:"nowrap" }}>{timeAgo(sig.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        {signalList.length > 0 && (
          <div style={{ marginTop:16, marginBottom:20, padding:"12px 16px", background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff22", borderRadius:8, fontSize:10, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.8, textAlign:"center" }}>
            Signals update every 5 minutes · Server: apex-server-09p7.onrender.com · Powered by TwelveData
          </div>
        )}

      </div>
    </div>
  );
}
