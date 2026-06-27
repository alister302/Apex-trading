import { useState, useEffect, useRef } from "react";
import PocketOptionAuto from "./PocketOptionAuto";
import ExnessSignals from "./ExnessSignals";

const SERVER = "https://apex-server-09p7.onrender.com";

const ALL_PAIRS = [
  { symbol:"EUR/USD", type:"forex", tv:"EURUSD" },
  { symbol:"GBP/USD", type:"forex", tv:"GBPUSD" },
  { symbol:"USD/JPY", type:"forex", tv:"USDJPY" },
  { symbol:"XAU/USD", type:"forex", tv:"XAUUSD" },
  { symbol:"USD/CHF", type:"forex", tv:"USDCHF" },
  { symbol:"AUD/USD", type:"forex", tv:"AUDUSD" },
  { symbol:"USD/CAD", type:"forex", tv:"USDCAD" },
  { symbol:"EUR/GBP", type:"forex", tv:"EURGBP" },
  { symbol:"BTC/USD", type:"crypto", tv:"BTCUSD" },
  { symbol:"ETH/USD", type:"crypto", tv:"ETHUSD" },
  { symbol:"BNB/USD", type:"crypto", tv:"BNBUSD" },
  { symbol:"SOL/USD", type:"crypto", tv:"SOLUSD" },
];

const ALL_TIMEFRAMES = ["1min","2min","5min","15min","30min","1h","2h","4h","1day"];
const TV_INTERVALS = { "1min":"1","2min":"2","5min":"5","15min":"15","30min":"30","1h":"60","2h":"120","4h":"240","1day":"D" };

function IndicatorRow({ label, detail, dark }) {
  if (!detail) return null;
  const color = detail.vote > 0 ? "#00dd55" : detail.vote < 0 ? "#ff2244" : "#ffaa00";
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
      <span style={{ fontSize:10, color:dark?"#667788":"#556677", fontFamily:"'IBM Plex Mono',monospace", width:90 }}>{label}</span>
      <span style={{ fontSize:9, color:dark?"#445566":"#778899", fontFamily:"'IBM Plex Mono',monospace", flex:1, textAlign:"center" }}>{detail.value}</span>
      <span style={{ fontSize:9, fontWeight:700, color, fontFamily:"'IBM Plex Mono',monospace", width:60, textAlign:"right" }}>{detail.label}</span>
    </div>
  );
}

function ScoreBar({ bull, bear, dark }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:10, color:"#00dd55", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>BULL {bull}%</span>
        <span style={{ fontSize:10, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>BEAR {bear}%</span>
      </div>
      <div style={{ height:8, background:dark?"#0a1520":"#e0eaf4", borderRadius:4, overflow:"hidden", display:"flex" }}>
        <div style={{ width:`${bull}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)", borderRadius:"4px 0 0 4px", transition:"width 0.5s" }} />
        <div style={{ width:`${bear}%`, background:"linear-gradient(90deg,#ff2244,#aa0022)", borderRadius:"0 4px 4px 0", transition:"width 0.5s" }} />
      </div>
    </div>
  );
}

function ChartWidget({ tvSymbol, interval, dark }) {
  const theme = dark ? "dark" : "light";
  const tf = TV_INTERVALS[interval] || "5";
  return (
    <div style={{ borderRadius:8, overflow:"hidden", marginTop:10 }}>
      <iframe
        src={`https://www.tradingview.com/widgetembed/?frameElementId=tv_${tvSymbol}&symbol=${tvSymbol}&interval=${tf}&theme=${theme}&style=1&locale=en&toolbar_bg=%23f1f3f6&enable_publishing=false&hide_top_toolbar=1&hide_legend=1&hide_side_toolbar=1&save_image=false&withdateranges=0`}
        style={{ width:"100%", height:200, border:"none", display:"block" }}
        title={`${tvSymbol} chart`}
        loading="lazy"
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
  const [selectedPairs, setSelectedPairs] = useState(["EUR/USD","CAD/JPY","GBP/AUD","EUR/GBP","EUR/CAD","GBP/CAD","GBP/JPY","AUD/USD","CHF/JPY","AUD/CHF","GBP/CHF","AUD/CAD","GBP/USD","USD/JPY","USD/CHF","USD/CAD","EUR/JPY","EUR/AUD","EUR/NZD","EUR/CHF","AUD/JPY","AUD/NZD","CAD/CHF","NZD/USD","NZD/JPY","NZD/CAD","NZD/CHF","XAU/USD","BTC/USD","ETH/USD"]);
  const [soundOn, setSoundOn] = useState(true);
  const audioCtxRef = useRef(null);
  const prevSignalsRef = useRef({});
  const [selectedTF, setSelectedTF] = useState("5min");
  const [showPairPicker, setShowPairPicker] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [showChart, setShowChart] = useState(null);
  const [activeTab, setActiveTab] = useState("auto");
  const [manualPair, setManualPair] = useState("EUR/USD");
  const [manualTF, setManualTF] = useState("5min");
  const [manualResult, setManualResult] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [entryType, setEntryType] = useState("market");
  const intervalRef = useRef(null);

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#ffffff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    textMuted: dark?"#8899aa":"#445566",
    textDim: dark?"#445566":"#778899",
    textLabel: dark?"#667788":"#556677",
    inputBg: dark?"rgba(0,40,80,0.2)":"#e8f0f8",
  };

  const sColor = (s) => s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const sBg = (s) => s==="BUY"?(dark?"#001a0d":"#e8fff3"):s==="SELL"?(dark?"#1a0005":"#fff0f3"):(dark?"#1a1000":"#fffbe8");

  const playAlertSound = () => {
    try {
      const ctx = audioCtxRef.current || (audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)());
      const beep = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur);
      };
      beep(880, 0, 0.15); beep(1100, 0.18, 0.15); beep(1320, 0.36, 0.2);
    } catch(e) {}
  };

  const fetchSignals = async () => {
    try {
      const res = await fetch(`${SERVER}/po/signals`);
      const data = await res.json();
      const newSignals = data.signals || {};

      let hasNew = false;
      Object.entries(newSignals).forEach(([sym, sig]) => {
        const prev = prevSignalsRef.current[sym];
        const actionable = sig.signal === "BUY" || sig.signal === "SELL";
      });
      if (hasNew && soundOn) playAlertSound();
      prevSignalsRef.current = newSignals;

      setSignals(newSignals);
      setLastUpdated(data.lastUpdated);
      setIsAnalyzing(data.isAnalyzing);
      setError(null);
    } catch(e) { setError("Server offline — retrying..."); }
    setLoading(false);
  };

  useEffect(() => {
    fetchSignals();
    // Always poll every 30 seconds regardless of running state
    intervalRef.current = setInterval(() => { fetchSignals(); }, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Separate effect to trigger manual scan when running toggled on
  useEffect(() => {
    if (running) fetchSignals();
  }, [running]);

  const runManual = async () => {
    setManualLoading(true);
    setManualResult(null);
    try {
      const res = await fetch(`${SERVER}/signals/analyze?symbol=${encodeURIComponent(manualPair)}&interval=${manualTF}&entry_type=${entryType}`);
      const data = await res.json();
      setManualResult(data);
    } catch(e) { setManualResult({ error: e.message }); }
    setManualLoading(false);
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const d = Math.floor((Date.now()-new Date(ts))/1000);
    if (d<60) return `${d}s ago`;
    if (d<3600) return `${Math.floor(d/60)}m ago`;
    return `${Math.floor(d/3600)}h ago`;
  };

  // Only show BUY/SELL with 80%+ confidence sorted by confidence
  const signalList = Object.values(signals)
    .filter(s => (s.signal==="BUY" || s.signal==="SELL") && s.confidence>=80)
    .sort((a,b) => b.confidence - a.confidence);
  const filtered = filter==="ALL" ? signalList
    : filter==="BUY"  ? signalList.filter(s=>s.signal==="BUY")
    : filter==="SELL" ? signalList.filter(s=>s.signal==="SELL")
    : filter==="FOREX"? signalList.filter(s=>s.type==="forex")
    : signalList.filter(s=>s.type==="crypto"||s.type==="commodity");

  const renderEntryPlan = (analysis, label) => {
    if (!analysis || analysis.signal === "WAIT") return null;
    return (
      <div style={{ background:sBg(analysis.signal), border:`1px solid ${sColor(analysis.signal)}33`, borderRadius:8, padding:"12px 14px", marginBottom:10 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:8 }}>{label}</div>
        {analysis.pendingType && (
          <div style={{ fontSize:11, color:"#ffaa00", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:6 }}>
            📋 {analysis.pendingType}
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5 }}>
          {[
            { label:"ENTRY", value:analysis.entryPrice, color:"#4499ff" },
            { label:"TP1", value:analysis.tp1, color:"#00dd55" },
            { label:"TP2", value:analysis.tp2, color:"#00ee77" },
            { label:"TP3", value:analysis.tp3, color:"#00ffaa" },
            { label:"SL", value:analysis.sl, color:"#ff2244" },
          ].map(({ label:l, value:v, color:c }) => (
            <div key={l} style={{ background:dark?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.05)", borderRadius:5, padding:"6px 4px", textAlign:"center" }}>
              <div style={{ fontSize:8, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace" }}>{l}</div>
              <div style={{ fontSize:9, color:c, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:6, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>R/R: {analysis.riskReward}:1</span>
          <span style={{ fontSize:9, color:"#ffaa00", fontFamily:"'IBM Plex Mono',monospace" }}>⏱ {analysis.duration}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex:1, background:t.bg, overflowY:"auto" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .lpulse{animation:pulse 1.5s infinite}
        .lspin{animation:spin 1s linear infinite;display:inline-block}
        .btn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .btn:hover{opacity:0.8}
        .chip{cursor:pointer;transition:all 0.15s;user-select:none}
        .chip:hover{transform:scale(1.04)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Sub tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:14, background:t.bgCard, borderRadius:10, padding:5, border:`1px solid ${t.border}` }}>
          {[["auto","📡 AUTO"],["manual","🎯 SNIPER SCAN"],["po","🟢 OLYMP SIGNALS"],["exness","📊 EXNESS"]].map(([id,lb]) => (
            <button key={id} className="btn" onClick={() => setActiveTab(id)}
              style={{ flex:1, padding:"10px", background:activeTab===id?"#0066ff":"transparent", color:activeTab===id?"#fff":t.textMuted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
              {lb}
            </button>
          ))}
        </div>

        {/* ===== AUTO TAB ===== */}
        {activeTab==="auto" && <>

          {/* Controls */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ position:"relative", width:10, height:10 }}>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:running?"#00dd55":"#ff2244" }} />
                {running && <div className="lpulse" style={{ position:"absolute", inset:-3, borderRadius:"50%", border:"2px solid #00dd5544" }} />}
              </div>
              <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:900, color:running?(dark?"#00dd55":"#009944"):"#ff2244", letterSpacing:2 }}>
                {running?"LIVE":"STOPPED"}
              </span>
              {lastUpdated && <span style={{ fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>{timeAgo(lastUpdated)}</span>}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn" onClick={() => { fetch(`${SERVER}/trigger`).catch(()=>{}); setTimeout(fetchSignals,8000); }}
                style={{ background:"#0066ff22", border:"1px solid #0066ff44", color:"#4499ff", padding:"6px 10px", borderRadius:6, fontSize:9 }}>⟳ SCAN</button>
              {running
                ? <button className="btn" onClick={() => setRunning(false)} style={{ background:"#ff224422", border:"1px solid #ff224444", color:"#ff2244", padding:"6px 12px", borderRadius:6, fontSize:9 }}>⏹ STOP</button>
                : <button className="btn" onClick={() => { setRunning(true); fetchSignals(); }} style={{ background:"#00dd5522", border:"1px solid #00dd5544", color:"#00dd55", padding:"6px 12px", borderRadius:6, fontSize:9 }}>▶ START</button>
              }
              <button className="btn" onClick={() => setSoundOn(!soundOn)}
                style={{ background:soundOn?"#ffd70022":"transparent", border:`1px solid ${soundOn?"#ffd70044":t.border}`, color:soundOn?"#ffd700":t.textMuted, padding:"6px 10px", borderRadius:6, fontSize:9 }}>
                {soundOn?"🔔":"🔕"}
              </button>
            </div>
          </div>

          {/* Top Signal Banner */}
          {signalList.length > 0 && (
            <div style={{ background:signalList[0].signal==="BUY"?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"), border:`3px solid ${signalList[0].signal==="BUY"?"#00dd55":"#ff2244"}`, borderRadius:12, padding:"14px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:9, letterSpacing:2, color:signalList[0].signal==="BUY"?"#00dd55":"#ff2244", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:4 }}>🏆 TOP SIGNAL NOW</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:dark?"#fff":"#001133" }}>{signalList[0].symbol}</div>
                <div style={{ fontSize:10, color:dark?"#8899aa":"#445566", fontFamily:"'IBM Plex Mono',monospace" }}>{signalList[0].pattern} · Buyers:{signalList[0].buyers||"?"}% Sellers:{signalList[0].sellers||"?"}%</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:32, fontWeight:900, color:signalList[0].signal==="BUY"?"#00dd55":"#ff2244" }}>
                  {signalList[0].signal==="BUY"?"▲":"▼"} {signalList[0].signal}
                </div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:700, color:signalList[0].signal==="BUY"?"#00dd55":"#ff2244" }}>{signalList[0].confidence}%</div>
              </div>
            </div>
          )}
          {signalList.length === 0 && !loading && (
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 16px", marginBottom:12, textAlign:"center" }}>
              <div style={{ fontSize:11, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace" }}>⏳ Scanning 30 pairs — no 80%+ signals yet</div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
            {[
              {l:"SCANNED", v:"30",                                              c:dark?"#c8d8e8":"#1a2a3a"},
              {l:"80%+ SIGNALS", v:signalList.length,                            c:"#ffd700"},
              {l:"BUY",  v:signalList.filter(s=>s.signal==="BUY").length,        c:"#00dd55"},
              {l:"SELL", v:signalList.filter(s=>s.signal==="SELL").length,       c:"#ff2244"},
            ].map(({l,v,c}) => (
              <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:7, letterSpacing:1, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Pair picker */}
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"10px 14px", marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:showPairPicker?10:0 }}>
              <span style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>PAIRS ({selectedPairs.length})</span>
              <button className="btn" onClick={() => setShowPairPicker(!showPairPicker)} style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.textMuted, padding:"3px 8px", borderRadius:4, fontSize:9 }}>
                {showPairPicker?"DONE":"EDIT"}
              </button>
            </div>
            {showPairPicker && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
                {selectedPairs.map(p => <span key={p} style={{ padding:"2px 7px", background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", color:"#4499ff", borderRadius:4, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700 }}>{p}</span>)}
              </div>
            )}
          </div>

          {/* TF + Filter */}
          <div style={{ display:"flex", gap:4, marginBottom:10, flexWrap:"wrap" }}>
            {ALL_TIMEFRAMES.map(tf => (
              <button key={tf} className="btn" onClick={() => setSelectedTF(tf)}
                style={{ padding:"4px 8px", background:selectedTF===tf?"#0066ff":"transparent", border:`1px solid ${selectedTF===tf?"#0066ff":t.border}`, color:selectedTF===tf?"#fff":t.textMuted, borderRadius:4, fontSize:9 }}>
                {tf}
              </button>
            ))}
          </div>

          <div style={{ display:"flex", gap:4, marginBottom:14, flexWrap:"wrap" }}>
            {["ALL","BUY","SELL","FOREX","CRYPTO"].map(f => (
              <button key={f} className="btn" onClick={() => setFilter(f)}
                style={{ padding:"5px 10px", background:filter===f?"#ffd700":"transparent", border:`1px solid ${filter===f?"#ffd700":t.border}`, color:filter===f?"#000":t.textMuted, borderRadius:4, fontSize:9 }}>
                {f}
              </button>
            ))}
          </div>

          {error && <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:10, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>⚠ {error}</div>}
          {isAnalyzing && <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"8px 12px", marginBottom:10, display:"flex", gap:8, alignItems:"center" }}><span className="lspin">⟳</span><span style={{ fontSize:10, color:"#4499ff", fontFamily:"'IBM Plex Mono',monospace" }}>Sniper scanning...</span></div>}
          {loading && <div style={{ textAlign:"center", padding:32 }}><div className="lspin" style={{ fontSize:24, color:"#0066ff" }}>⟳</div></div>}

          {!loading && filtered.length===0 && (
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:28, textAlign:"center" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>🎯</div>
              <div style={{ fontSize:12, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace", marginBottom:12 }}>No confirmed signals — all indicators must agree</div>
              <button className="btn" onClick={() => { fetch(`${SERVER}/trigger`).catch(()=>{}); setTimeout(fetchSignals,8000); }}
                style={{ background:"linear-gradient(135deg,#0066ff,#0044bb)", color:"#fff", padding:"10px 20px", borderRadius:8, fontSize:11, letterSpacing:1 }}>⚡ SCAN NOW</button>
            </div>
          )}

          {/* Signal Cards */}
          {filtered.map((sig, i) => {
            const tvPair = ALL_PAIRS.find(p=>p.symbol===sig.symbol)?.tv||sig.symbol.replace("/","");
            const expanded = expandedSignal===i;
            return (
              <div key={i} style={{ background:sBg(sig.signal), border:`2px solid ${sColor(sig.signal)}44`, borderLeft:`5px solid ${sColor(sig.signal)}`, borderRadius:10, padding:"14px 16px", marginBottom:10 }}>

                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, cursor:"pointer" }} onClick={() => setExpandedSignal(expanded?null:i)}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:dark?"#fff":"#001133" }}>{sig.symbol}</span>
                      <span style={{ fontSize:9, color:t.textDim, background:dark?"#0a1520":"#e0eaf4", padding:"2px 6px", borderRadius:3, fontFamily:"'IBM Plex Mono',monospace" }}>{sig.timeframe}</span>
                    </div>
                    <div style={{ fontSize:10, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace" }}>💰 {sig.price} · {timeAgo(sig.timestamp)}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:sColor(sig.signal) }}>
                      {sig.signal==="BUY"?"▲":"▼"} {sig.signal}
                    </div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, color:sColor(sig.signal) }}>{sig.confidence}%</div>
                  </div>
                </div>

                {/* Score bar */}
                <ScoreBar bull={sig.bullScore||0} bear={sig.bearScore||0} dark={dark} />

                {/* TP/SL quick view */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:5, marginBottom:8 }}>
                  {[{l:"ENTRY",v:sig.entryPrice,c:"#4499ff"},{l:"TP1",v:sig.tp1,c:"#00dd55"},{l:"TP2",v:sig.tp2,c:"#00ee77"},{l:"SL",v:sig.sl,c:"#ff2244"}].map(({l,v,c})=>(
                    <div key={l} style={{ background:dark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.05)", borderRadius:5, padding:"5px 4px", textAlign:"center" }}>
                      <div style={{ fontSize:8, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace" }}>{l}</div>
                      <div style={{ fontSize:9, color:c, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:9, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace" }}>{sig.pattern} · R/R {sig.riskReward}:1</span>
                  <span style={{ fontSize:9, color:"#ffaa00", fontFamily:"'IBM Plex Mono',monospace" }}>⏱ {sig.duration}</span>
                </div>

                {/* Expanded */}
                {expanded && (
                  <div style={{ marginTop:12, borderTop:`1px solid ${sColor(sig.signal)}22`, paddingTop:12 }}>

                    {/* Indicator breakdown */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:8 }}>INDICATOR BREAKDOWN ({sig.bullVotes}↑ {sig.bearVotes}↓ / {sig.totalVotes} total)</div>
                      {sig.indicators && Object.entries({
                        "EMA Cross":sig.indicators.emaCross,
                        "EMA 50":sig.indicators.ema50,
                        "RSI 14":sig.indicators.rsi,
                        "MACD":sig.indicators.macd,
                        "ADX":sig.indicators.adx,
                        "VWAP":sig.indicators.vwap,
                        "Supertrend":sig.indicators.supertrend,
                        "Pattern":sig.indicators.pattern,
                        "Momentum":sig.indicators.momentum,
                        "SMA 20":sig.indicators.sma20,
                      }).map(([label,detail]) => <IndicatorRow key={label} label={label} detail={detail} dark={dark} />)}
                    </div>

                    {/* Chart */}
                    <button className="btn" onClick={() => setShowChart(showChart===i?null:i)}
                      style={{ background:"#aa66ff22", border:"1px solid #aa66ff44", color:"#cc99ff", padding:"6px 14px", borderRadius:6, fontSize:9, marginBottom:showChart===i?10:0, width:"100%", letterSpacing:1 }}>
                      📊 {showChart===i?"HIDE":"SHOW"} LIVE CHART
                    </button>

                    {showChart===i && <ChartWidget tvSymbol={tvPair} interval={sig.timeframe} dark={dark} />}
                  </div>
                )}
              </div>
            );
          })}
        </>}

        {/* ===== SNIPER MANUAL TAB ===== */}
        {activeTab==="po" && <PocketOptionAuto dark={dark} />}
        {activeTab==="exness" && <ExnessSignals dark={dark} />}
        {activeTab==="manual" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Pair */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:10 }}>SELECT PAIR</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {ALL_PAIRS.map(p => (
                  <div key={p.symbol} className="chip" onClick={() => setManualPair(p.symbol)}
                    style={{ padding:"6px 12px", background:manualPair===p.symbol?(p.type==="forex"?"#0066ff":"#aa66ff"):"transparent", border:`1px solid ${manualPair===p.symbol?(p.type==="forex"?"#0066ff":"#aa66ff"):t.border}`, color:manualPair===p.symbol?"#fff":t.textMuted, borderRadius:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700 }}>
                    {p.symbol}
                  </div>
                ))}
              </div>
            </div>

            {/* TF */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:10 }}>TIMEFRAME</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {ALL_TIMEFRAMES.map(tf => (
                  <button key={tf} className="btn" onClick={() => setManualTF(tf)}
                    style={{ padding:"7px 14px", background:manualTF===tf?"#ffd700":"transparent", border:`1px solid ${manualTF===tf?"#ffd700":t.border}`, color:manualTF===tf?"#000":t.textMuted, borderRadius:6, fontSize:10 }}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Type */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:10 }}>ENTRY TYPE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  ["market","⚡ MARKET ORDER","Enter immediately at current price"],
                  ["next_candle","🕯️ NEXT CANDLE","Enter at opening of next candle (safer)"],
                  ["pending","📋 PENDING ORDER","Enter at key support/resistance level (most precise)"],
                ].map(([id,label,desc]) => (
                  <div key={id} className="chip" onClick={() => setEntryType(id)}
                    style={{ padding:"10px 14px", background:entryType===id?(dark?"#0066ff22":"#ddeeff"):"transparent", border:`2px solid ${entryType===id?"#0066ff":t.border}`, borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, color:entryType===id?"#4499ff":t.text, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{label}</div>
                      <div style={{ fontSize:9, color:t.textDim, fontFamily:"'IBM Plex Mono',monospace", marginTop:2 }}>{desc}</div>
                    </div>
                    {entryType===id && <span style={{ color:"#0066ff", fontSize:16 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Chart preview */}
            {manualPair && (() => {
              const tvP = ALL_PAIRS.find(p=>p.symbol===manualPair)?.tv||manualPair.replace("/","");
              return (
                <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, overflow:"hidden" }}>
                  <div style={{ padding:"8px 14px", fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
                    📊 {manualPair} · {manualTF} LIVE
                  </div>
                  <ChartWidget tvSymbol={tvP} interval={manualTF} dark={dark} />
                </div>
              );
            })()}

            {/* Scan button */}
            <button className="btn" onClick={runManual} disabled={manualLoading}
              style={{ background:manualLoading?(dark?"#0a1520":"#e0eaf4"):"linear-gradient(135deg,#cc9900,#ffd700)", color:manualLoading?t.textDim:"#000", padding:"16px", borderRadius:8, fontSize:13, letterSpacing:2, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              {manualLoading ? <><span className="lspin">⟳</span> SCANNING...</> : "🎯 SNIPER SCAN"}
            </button>

            {/* Results */}
            {manualResult && !manualLoading && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {manualResult.error ? (
                  <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"12px", fontSize:12, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>⚠ {manualResult.error}</div>
                ) : (
                  <>
                    {/* Signal Summary */}
                    <div style={{ background:sBg(manualResult.market?.signal), border:`2px solid ${sColor(manualResult.market?.signal||"WAIT")}44`, borderLeft:`5px solid ${sColor(manualResult.market?.signal||"WAIT")}`, borderRadius:10, padding:"16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                        <div>
                          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:dark?"#fff":"#001133" }}>{manualPair} · {manualTF}</div>
                          <div style={{ fontSize:10, color:t.textMuted, fontFamily:"'IBM Plex Mono',monospace" }}>💰 {manualResult.price} · {manualResult.market?.pattern}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:28, fontWeight:900, color:sColor(manualResult.market?.signal||"WAIT") }}>
                            {manualResult.market?.signal==="BUY"?"▲":manualResult.market?.signal==="SELL"?"▼":"◆"} {manualResult.market?.signal}
                          </div>
                          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, color:sColor(manualResult.market?.signal||"WAIT") }}>{manualResult.market?.confidence}%</div>
                        </div>
                      </div>

                      <ScoreBar bull={manualResult.market?.bullScore||0} bear={manualResult.market?.bearScore||0} dark={dark} />

                      {/* Indicator Breakdown */}
                      <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:8 }}>
                          SNIPER INDICATORS ({manualResult.market?.bullVotes}↑ {manualResult.market?.bearVotes}↓ / {manualResult.market?.totalVotes} total)
                        </div>
                        {manualResult.market?.indicators && Object.entries({
                          "EMA Cross":manualResult.market.indicators.emaCross,
                          "EMA 50":manualResult.market.indicators.ema50,
                          "RSI 14":manualResult.market.indicators.rsi,
                          "MACD":manualResult.market.indicators.macd,
                          "ADX":manualResult.market.indicators.adx,
                          "VWAP":manualResult.market.indicators.vwap,
                          "Supertrend":manualResult.market.indicators.supertrend,
                          "Pattern":manualResult.market.indicators.pattern,
                          "Momentum":manualResult.market.indicators.momentum,
                          "SMA 20":manualResult.market.indicators.sma20,
                        }).map(([label,detail]) => <IndicatorRow key={label} label={label} detail={detail} dark={dark} />)}
                      </div>
                    </div>

                    {/* 3 Entry Plans */}
                    <div style={{ fontSize:9, letterSpacing:2, color:t.textLabel, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:4 }}>ENTRY PLANS</div>
                    {renderEntryPlan(manualResult.market, "⚡ MARKET ORDER — Enter Now")}
                    {renderEntryPlan(manualResult.nextCandle, "🕯️ NEXT CANDLE — Safer Entry")}
                    {renderEntryPlan(manualResult.pending, `📋 ${manualResult.pending?.pendingType||"PENDING ORDER"} — Key Level Entry`)}
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
