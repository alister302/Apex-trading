import { useState, useEffect, useRef } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const ALL_PAIRS = [
  { symbol: "EUR/USD", type: "forex", tv: "EURUSD" },
  { symbol: "GBP/USD", type: "forex", tv: "GBPUSD" },
  { symbol: "USD/JPY", type: "forex", tv: "USDJPY" },
  { symbol: "XAU/USD", type: "forex", tv: "XAUUSD" },
  { symbol: "USD/CHF", type: "forex", tv: "USDCHF" },
  { symbol: "AUD/USD", type: "forex", tv: "AUDUSD" },
  { symbol: "USD/CAD", type: "forex", tv: "USDCAD" },
  { symbol: "EUR/GBP", type: "forex", tv: "EURGBP" },
  { symbol: "BTC/USD", type: "crypto", tv: "BTCUSD" },
  { symbol: "ETH/USD", type: "crypto", tv: "ETHUSD" },
  { symbol: "BNB/USD", type: "crypto", tv: "BNBUSD" },
  { symbol: "SOL/USD", type: "crypto", tv: "SOLUSD" },
];

const ALL_TIMEFRAMES = ["1min","2min","5min","15min","30min","1h","2h","4h","1day"];

const TV_INTERVALS = {
  "1min":"1","2min":"2","5min":"5","15min":"15","30min":"30",
  "1h":"60","2h":"120","4h":"240","1day":"D"
};

function ChartImage({ symbol, timeframe, dark }) {
  const tvSymbol = ALL_PAIRS.find(p => p.symbol === symbol)?.tv || symbol.replace("/","");
  const interval = TV_INTERVALS[timeframe] || "5";
  const theme = dark ? "dark" : "light";
  const src = `https://charts.tradingview.com/snapshot/${tvSymbol}?interval=${interval}&theme=${theme}&style=1&locale=en&width=400&height=200`;

  return (
    <div style={{ marginTop: 10, borderRadius: 8, overflow: "hidden", border: `1px solid rgba(255,255,255,0.1)` }}>
      <iframe
        src={`https://www.tradingview.com/widgetembed/?frameElementId=tv&symbol=${tvSymbol}&interval=${interval}&theme=${theme}&style=1&locale=en&toolbar_bg=%23f1f3f6&enable_publishing=false&hide_top_toolbar=1&hide_legend=1&hide_side_toolbar=1&save_image=false&withdateranges=0`}
        style={{ width: "100%", height: 180, border: "none", display: "block" }}
        title={`${symbol} chart`}
      />
    </div>
  );
}

export default function LiveSignals({ dark }) {
  const [signals, setSignals] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [running, setRunning] = useState(true);
  const [selectedPairs, setSelectedPairs] = useState(["EUR/USD","GBP/USD","XAU/USD","BTC/USD","ETH/USD"]);
  const [selectedTF, setSelectedTF] = useState("5min");
  const [showPairPicker, setShowPairPicker] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [manualPair, setManualPair] = useState("EUR/USD");
  const [manualTF, setManualTF] = useState("5min");
  const [manualDuration, setManualDuration] = useState("15-30 minutes");
  const [manualResult, setManualResult] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("auto");
  const intervalRef = useRef(null);

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

  const signalColor = (s) => s === "BUY" ? "#00dd55" : s === "SELL" ? "#ff2244" : "#ffaa00";
  const signalBg = (s) => s === "BUY" ? (dark?"#001a0d":"#e8fff3") : s === "SELL" ? (dark?"#1a0005":"#fff0f3") : (dark?"#1a1000":"#fffbe8");

  const fetchSignals = async () => {
    if (!running) return;
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

  const startAuto = () => {
    setRunning(true);
    fetchSignals();
    fetch(`${SERVER}/trigger`).catch(() => {});
  };

  const stopAuto = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const triggerNow = () => {
    fetch(`${SERVER}/trigger`).catch(() => {});
    setTimeout(fetchSignals, 8000);
  };

  // Manual analysis using built-in TA
  const runManualAnalysis = async () => {
    setManualLoading(true);
    setManualResult(null);
    try {
      const res = await fetch(
        `${SERVER}/analyze?symbol=${encodeURIComponent(manualPair)}&interval=${manualTF}&duration=${encodeURIComponent(manualDuration)}`
      );
      const data = await res.json();
      setManualResult(data);
    } catch(e) {
      setManualResult({ error: "Analysis failed: " + e.message });
    }
    setManualLoading(false);
  };

  useEffect(() => {
    fetchSignals();
    intervalRef.current = setInterval(() => {
      if (running) fetchSignals();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const timeAgo = (ts) => {
    if (!ts) return "Never";
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  };

  const togglePair = (symbol) => {
    setSelectedPairs(prev =>
      prev.includes(symbol) ? prev.filter(p => p !== symbol) : [...prev, symbol]
    );
  };

  const signalList = Object.values(signals).filter(s => s.signal !== "WAIT");
  const filtered = filter === "ALL" ? signalList
    : filter === "BUY" ? signalList.filter(s => s.signal === "BUY")
    : filter === "SELL" ? signalList.filter(s => s.signal === "SELL")
    : filter === "FOREX" ? signalList.filter(s => s.type === "forex")
    : signalList.filter(s => s.type === "crypto");

  const buys = signalList.filter(s => s.signal === "BUY").length;
  const sells = signalList.filter(s => s.signal === "SELL").length;

  return (
    <div style={{ flex:1, background:t.bg, overflowY:"auto" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .live-pulse{animation:pulse 1.5s infinite}
        .spin-anim{animation:spin 1s linear infinite;display:inline-block}
        .tab-pill{cursor:pointer;transition:all 0.2s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;letter-spacing:1px}
        .tab-pill:hover{opacity:0.8}
        .pair-chip{cursor:pointer;transition:all 0.15s;user-select:none}
        .pair-chip:hover{transform:scale(1.03)}
        .signal-card{transition:all 0.2s}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* SUB TABS */}
        <div style={{ display:"flex", gap:6, marginBottom:16, background:t.bgCard, borderRadius:10, padding:6, border:`1px solid ${t.border}` }}>
          {[["auto","📡 AUTO SIGNALS"],["manual","🎯 MANUAL SCAN"]].map(([id,label]) => (
            <button key={id} className="tab-pill" onClick={() => setActiveTab(id)}
              style={{ flex:1, padding:"10px", background:activeTab===id?"#0066ff":"transparent", border:"none", color:activeTab===id?"#fff":t.textMuted, borderRadius:7, fontSize:11 }}>
              {label}
            </button>
          ))}
        </div>

        {/* ============ AUTO SIGNALS TAB ============ */}
        {activeTab === "auto" && (
          <>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ position:"relative", width:10, height:10 }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", background: running?"#00dd55":"#ff2244" }} />
                  {running && <div className="live-pulse" style={{ position:"absolute", inset:-3, borderRadius:"50%", border:"2px solid #00dd5544" }} />}
                </div>
                <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:12, fontWeight:900, color:running?(dark?"#00dd55":"#009944"):"#ff2244", letterSpacing:2 }}>
                  {running ? "LIVE" : "STOPPED"}
                </span>
                <span style={{ fontSize:10, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>
                  {lastUpdated ? timeAgo(lastUpdated) : ""}
                </span>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={triggerNow}
                  style={{ background:"#0066ff22", border:"1px solid #0066ff44", color:"#4499ff", padding:"6px 12px", borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                  ⟳ NOW
                </button>
                <button onClick={() => setShowCharts(!showCharts)}
                  style={{ background:showCharts?"#aa66ff22":"transparent", border:`1px solid ${showCharts?"#aa66ff44":t.border}`, color:showCharts?"#aa66ff":t.textMuted, padding:"6px 12px", borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                  📊 CHARTS
                </button>
                {running ? (
                  <button onClick={stopAuto}
                    style={{ background:"#ff224422", border:"1px solid #ff224444", color:"#ff2244", padding:"6px 14px", borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                    ⏹ STOP
                  </button>
                ) : (
                  <button onClick={startAuto}
                    style={{ background:"#00dd5522", border:"1px solid #00dd5544", color:"#00dd55", padding:"6px 14px", borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                    ▶ START
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              {[
                { label:"SIGNALS", value:signalList.length, color:dark?"#c8d8e8":"#1a2a3a" },
                { label:"BUY", value:buys, color:"#00dd55" },
                { label:"SELL", value:sells, color:"#ff2244" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", marginBottom:3 }}>{label}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Pair Picker */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showPairPicker?10:0 }}>
                <span style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
                  PAIRS ({selectedPairs.length})
                </span>
                <button className="tab-pill" onClick={() => setShowPairPicker(!showPairPicker)}
                  style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.textMuted, padding:"4px 10px", borderRadius:4, fontSize:9 }}>
                  {showPairPicker ? "DONE" : "EDIT"}
                </button>
              </div>
              {showPairPicker && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {ALL_PAIRS.map(p => (
                    <div key={p.symbol} className="pair-chip" onClick={() => togglePair(p.symbol)}
                      style={{ padding:"5px 12px", background:selectedPairs.includes(p.symbol)?(p.type==="forex"?"#0066ff22":"#aa66ff22"):"transparent", border:`1px solid ${selectedPairs.includes(p.symbol)?(p.type==="forex"?"#0066ff":"#aa66ff"):t.border}`, color:selectedPairs.includes(p.symbol)?(p.type==="forex"?"#4499ff":"#cc99ff"):t.textMuted, borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700 }}>
                      {p.symbol}
                    </div>
                  ))}
                </div>
              )}
              {!showPairPicker && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                  {selectedPairs.map(p => (
                    <span key={p} style={{ padding:"3px 8px", background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", color:"#4499ff", borderRadius:4, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700 }}>{p}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Timeframe selector */}
            <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
              {ALL_TIMEFRAMES.map(tf => (
                <button key={tf} className="tab-pill" onClick={() => setSelectedTF(tf)}
                  style={{ padding:"5px 10px", background:selectedTF===tf?"#0066ff":"transparent", border:`1px solid ${selectedTF===tf?"#0066ff":t.border}`, color:selectedTF===tf?"#fff":t.textMuted, borderRadius:5, fontSize:9 }}>
                  {tf}
                </button>
              ))}
            </div>

            {/* Filter */}
            <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
              {["ALL","BUY","SELL","FOREX","CRYPTO"].map(f => (
                <button key={f} className="tab-pill" onClick={() => setFilter(f)}
                  style={{ padding:"6px 12px", background:filter===f?"#ffd700":"transparent", border:`1px solid ${filter===f?"#ffd700":t.border}`, color:filter===f?"#000":t.textMuted, borderRadius:5, fontSize:9 }}>
                  {f}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
                <span style={{ fontSize:11, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>⚠ {error}</span>
              </div>
            )}

            {isAnalyzing && (
              <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"8px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                <span className="spin-anim">⟳</span>
                <span style={{ fontSize:10, color:"#4499ff", fontFamily:"'IBM Plex Mono',monospace" }}>Analyzing markets...</span>
              </div>
            )}

            {loading && (
              <div style={{ textAlign:"center", padding:32 }}>
                <div className="spin-anim" style={{ fontSize:24, color:"#0066ff" }}>⟳</div>
                <div style={{ marginTop:8, fontSize:11, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>Loading...</div>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:28, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📡</div>
                <div style={{ fontSize:12, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace", marginBottom:12 }}>No BUY/SELL signals right now</div>
                <button onClick={triggerNow}
                  style={{ background:"linear-gradient(135deg,#0066ff,#0044bb)", border:"none", color:"#fff", padding:"10px 20px", borderRadius:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                  ⚡ SCAN NOW
                </button>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map((sig, i) => (
                <div key={i} className="signal-card"
                  style={{ background:signalBg(sig.signal), border:`1px solid ${signalColor(sig.signal)}33`, borderLeft:`4px solid ${signalColor(sig.signal)}`, borderRadius:10, padding:"14px 16px", cursor:"pointer" }}
                  onClick={() => setExpandedSignal(expandedSignal === i ? null : i)}>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, fontWeight:900, color:dark?"#fff":"#001133" }}>{sig.symbol}</span>
                      <span style={{ fontSize:9, color:t.textDim, background:dark?"#0a1520":"#e0eaf4", padding:"2px 7px", borderRadius:4, fontFamily:"'IBM Plex Mono',monospace" }}>{sig.timeframe}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:signalColor(sig.signal) }}>
                        {sig.signal==="BUY"?"▲":"▼"} {sig.signal}
                      </span>
                      <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, fontWeight:700, color:signalColor(sig.signal) }}>{sig.confidence}%</span>
                    </div>
                  </div>

                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:4 }}>
                    <span style={{ fontSize:10, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace" }}>💰 {sig.price}</span>
                    <span style={{ fontSize:10, color:dark?"#4499cc":"#0055aa", fontFamily:"'IBM Plex Mono',monospace" }}>{sig.pattern}</span>
                    <span style={{ fontSize:10, color:"#ffaa00", fontFamily:"'IBM Plex Mono',monospace" }}>⏱ {sig.duration}</span>
                    <span style={{ fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>{timeAgo(sig.timestamp)}</span>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginBottom:8 }}>
                    {[
                      { label:"ENTRY", value:sig.entry, color:"#4499ff" },
                      { label:"TP1", value:sig.tp1, color:"#00dd55" },
                      { label:"TP2", value:sig.tp2, color:"#00ee77" },
                      { label:"SL", value:sig.sl, color:"#ff2244" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background:dark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.05)", borderRadius:5, padding:"5px 6px", textAlign:"center" }}>
                        <div style={{ fontSize:8, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace" }}>{label}</div>
                        <div style={{ fontSize:9, color, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize:10, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace" }}>{sig.trend} · {sig.reason?.slice(0,60)}</div>

                  {/* TradingView Chart */}
                  {showCharts && expandedSignal === i && (
                    <ChartImage symbol={sig.symbol} timeframe={sig.timeframe} dark={dark} />
                  )}
                  {!showCharts && expandedSignal === i && (
                    <div style={{ marginTop:10, fontSize:10, color:"#aa66ff", fontFamily:"'IBM Plex Mono',monospace", textAlign:"center" }}>
                      Enable 📊 CHARTS toggle to see market chart
                    </div>
                  )}
                </div>
              ))}
            </div>

            {signalList.length > 0 && (
              <div style={{ marginTop:14, marginBottom:20, padding:"10px 14px", background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff22", borderRadius:8, fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace", textAlign:"center" }}>
                WAIT signals hidden · Only BUY/SELL shown · Updates every 5min · Powered by TwelveData
              </div>
            )}
          </>
        )}

        {/* ============ MANUAL SCAN TAB ============ */}
        {activeTab === "manual" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:12 }}>SELECT PAIR</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {ALL_PAIRS.map(p => (
                  <div key={p.symbol} className="pair-chip" onClick={() => setManualPair(p.symbol)}
                    style={{ padding:"6px 12px", background:manualPair===p.symbol?(p.type==="forex"?"#0066ff":"#aa66ff"):"transparent", border:`1px solid ${manualPair===p.symbol?(p.type==="forex"?"#0066ff":"#aa66ff"):t.border}`, color:manualPair===p.symbol?"#fff":t.textMuted, borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700 }}>
                    {p.symbol}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:12 }}>SELECT TIMEFRAME</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {ALL_TIMEFRAMES.map(tf => (
                  <button key={tf} className="tab-pill" onClick={() => setManualTF(tf)}
                    style={{ padding:"7px 14px", background:manualTF===tf?"#ffd700":"transparent", border:`1px solid ${manualTF===tf?"#ffd700":t.border}`, color:manualTF===tf?"#000":t.textMuted, borderRadius:6, fontSize:10 }}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:10 }}>TRADE DURATION</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {["5-15 minutes","15-30 minutes","30-60 minutes","1-2 hours","2-4 hours","4-8 hours"].map(d => (
                  <button key={d} className="tab-pill" onClick={() => setManualDuration(d)}
                    style={{ padding:"6px 12px", background:manualDuration===d?"#00aa44":"transparent", border:`1px solid ${manualDuration===d?"#00aa44":t.border}`, color:manualDuration===d?"#fff":t.textMuted, borderRadius:6, fontSize:9 }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart preview */}
            {manualPair && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, overflow:"hidden" }}>
                <div style={{ padding:"10px 14px", fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
                  📊 {manualPair} · {manualTF} LIVE CHART
                </div>
                <ChartImage symbol={manualPair} timeframe={manualTF} dark={dark} />
              </div>
            )}

            <button onClick={runManualAnalysis} disabled={manualLoading}
              style={{ background:manualLoading?(dark?"#0a1520":"#e0eaf4"):"linear-gradient(135deg,#00aa44,#006633)", border:"none", color:manualLoading?t.textDim:"#fff", padding:"16px", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:900, letterSpacing:2, cursor:manualLoading?"not-allowed":"pointer", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              {manualLoading ? <><span className="spin-anim">⟳</span> ANALYZING...</> : "🎯 ANALYZE NOW"}
            </button>

            {manualResult && !manualLoading && (
              <div style={{ background:manualResult.error?( dark?"#1a0005":"#fff0f3"):signalBg(manualResult.signal), border:`1px solid ${manualResult.error?"#ff224433":(signalColor(manualResult.signal)+"44")}`, borderLeft:`4px solid ${manualResult.error?"#ff2244":signalColor(manualResult.signal||"WAIT")}`, borderRadius:10, padding:"18px 16px" }}>
                {manualResult.error ? (
                  <div style={{ fontSize:12, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>⚠ {manualResult.error}</div>
                ) : (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <div>
                        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133", marginBottom:4 }}>{manualPair} · {manualTF}</div>
                        <div style={{ fontSize:11, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace" }}>{manualResult.trend}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:32, fontWeight:900, color:signalColor(manualResult.signal) }}>
                          {manualResult.signal==="BUY"?"▲":manualResult.signal==="SELL"?"▼":"◆"} {manualResult.signal}
                        </div>
                        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, color:signalColor(manualResult.signal) }}>{manualResult.confidence}%</div>
                      </div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                      <div style={{ fontSize:11, color:dark?"#4499cc":"#0055aa", fontFamily:"'IBM Plex Mono',monospace" }}>Pattern: {manualResult.pattern}</div>
                      <div style={{ fontSize:11, color:"#ffaa00", fontFamily:"'IBM Plex Mono',monospace" }}>Duration: {manualResult.duration}</div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:12 }}>
                      {[
                        { label:"ENTRY", value:manualResult.entry, color:"#4499ff" },
                        { label:"TP1", value:manualResult.tp1, color:"#00dd55" },
                        { label:"TP2", value:manualResult.tp2, color:"#00ee77" },
                        { label:"TP3", value:manualResult.tp3, color:"#00ffaa" },
                        { label:"SL", value:manualResult.sl, color:"#ff2244" },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background:dark?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.05)", borderRadius:6, padding:"8px 4px", textAlign:"center" }}>
                          <div style={{ fontSize:8, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", marginBottom:3 }}>{label}</div>
                          <div style={{ fontSize:9, color, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize:11, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.6 }}>{manualResult.reason}</div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
