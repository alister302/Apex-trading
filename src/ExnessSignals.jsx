import { useState, useEffect, useRef } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const PAIRS = [
  "EUR/USD","GBP/USD","USD/JPY","USD/CHF","USD/CAD",
  "AUD/USD","NZD/USD","EUR/GBP","EUR/JPY","EUR/CHF",
  "EUR/CAD","EUR/AUD","GBP/JPY","GBP/CHF","GBP/CAD",
  "GBP/AUD","AUD/JPY","AUD/CAD","AUD/CHF","AUD/NZD",
  "CAD/JPY","CAD/CHF","CHF/JPY","NZD/JPY","NZD/CAD",
  "NZD/CHF","XAU/USD",
];

const TV_MAP = {
  "EUR/USD":"FX:EURUSD","GBP/USD":"FX:GBPUSD","USD/JPY":"FX:USDJPY",
  "USD/CHF":"FX:USDCHF","USD/CAD":"FX:USDCAD","AUD/USD":"FX:AUDUSD",
  "NZD/USD":"FX:NZDUSD","EUR/GBP":"FX:EURGBP","EUR/JPY":"FX:EURJPY",
  "EUR/CHF":"FX:EURCHF","EUR/CAD":"FX:EURCAD","EUR/AUD":"FX:EURAUD",
  "GBP/JPY":"FX:GBPJPY","GBP/CHF":"FX:GBPCHF","GBP/CAD":"FX:GBPCAD",
  "GBP/AUD":"FX:GBPAUD","AUD/JPY":"FX:AUDJPY","AUD/CAD":"FX:AUDCAD",
  "AUD/CHF":"FX:AUDCHF","AUD/NZD":"FX:AUDNZD","CAD/JPY":"FX:CADJPY",
  "CAD/CHF":"FX:CADCHF","CHF/JPY":"FX:CHFJPY","NZD/JPY":"FX:NZDJPY",
  "NZD/CAD":"FX:NZDCAD","NZD/CHF":"FX:NZDCHF","XAU/USD":"TVC:GOLD",
};

function playAlert(tier) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur, vol=0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine";
      gain.gain.setValueAtTime(vol, ctx.currentTime+start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+start+dur);
      osc.start(ctx.currentTime+start); osc.stop(ctx.currentTime+start+dur);
    };
    if (tier==="elite") {
      beep(880,0,0.1,0.5); beep(1100,0.12,0.1,0.5); beep(1320,0.24,0.1,0.5);
      beep(1760,0.36,0.2,0.5); beep(2200,0.58,0.3,0.5);
    } else if (tier==="strong") {
      beep(880,0,0.15,0.35); beep(1100,0.18,0.15,0.35); beep(1320,0.36,0.2,0.35);
    } else {
      beep(660,0,0.1,0.2); beep(880,0.15,0.15,0.2);
    }
  } catch(e) {}
}

function playExitAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "square";
      gain.gain.setValueAtTime(0.4, ctx.currentTime+start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+start+dur);
      osc.start(ctx.currentTime+start); osc.stop(ctx.currentTime+start+dur);
    };
    beep(400,0,0.2); beep(300,0.25,0.2); beep(200,0.5,0.3);
  } catch(e) {}
}

function ScoreBar({ bull, bear, dark }) {
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:9, color:"#00dd55", fontFamily:"monospace" }}>BULL {bull}%</span>
        <span style={{ fontSize:9, color:"#ff2244", fontFamily:"monospace" }}>BEAR {bear}%</span>
      </div>
      <div style={{ height:8, background:dark?"#0a1520":"#e0eaf4", borderRadius:4, overflow:"hidden", display:"flex" }}>
        <div style={{ width:`${bull}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)" }} />
        <div style={{ width:`${bear}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)" }} />
      </div>
    </div>
  );
}

function Dashboard({ sig, dark }) {
  if (!sig) return null;
  const t = { muted:dark?"#8899aa":"#445566", dim:dark?"#445566":"#778899", border:dark?"#0d2a42":"#d0dce8", bg:dark?"rgba(0,20,40,0.9)":"#fff" };
  const sc = s=>s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const rows = [
    ["PAIR", sig.symbol, dark?"#fff":"#001133"],
    ["TIMEFRAME", sig.timeframe, t.muted],
    ["TREND", sig.marketBias, sc(sig.signal)],
    ["SCORE", `${sig.score}/${sig.maxScore}`, sc(sig.signal)],
    ["CONFIDENCE", sig.tierIcon+" "+sig.tier?.toUpperCase(), sc(sig.signal)],
    ["BULL SCORE", sig.bullPct+"%", "#00dd55"],
    ["BEAR SCORE", sig.bearPct+"%", "#ff2244"],
    ["RSI", sig.rsi+" "+(parseFloat(sig.rsi)>50?"(Bullish)":"(Bearish)"), t.muted],
    ["MACD", sig.indicators?.macd?.label||"N/A", t.muted],
    ["VOLUME", sig.indicators?.volume?.label||"N/A", t.muted],
    ["SMC", sig.smcDetails||"N/A", t.muted],
    ["ALGOALPHA", sig.algoStatus, t.muted],
    ["ALLIGATOR", sig.alligatorStatus, t.muted],
    ["ADX", sig.adx+" "+(parseFloat(sig.adx)>25?"(Strong)":"(Weak)"), t.muted],
    ["SESSION", sig.session?.icon+" "+sig.session?.name, "#ffd700"],
    ["SIGNAL", sig.signal, sc(sig.signal)],
  ];
  return (
    <div style={{ background:t.bg, border:`2px solid ${sc(sig.signal)}33`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
      <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontFamily:"monospace", fontWeight:700, marginBottom:10 }}>📊 LIVE DASHBOARD</div>
      {rows.map(([label,value,color])=>(
        <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
          <span style={{ fontSize:9, color:t.dim, fontFamily:"monospace" }}>{label}</span>
          <span style={{ fontSize:9, color:color||t.muted, fontFamily:"monospace", fontWeight:700 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function SignalCard({ sig, dark, onClose }) {
  if (!sig || sig.signal==="WAIT") return null;
  const sc = s=>s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const sbg = s=>s==="BUY"?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3");
  const t = { muted:dark?"#8899aa":"#445566", dim:dark?"#445566":"#778899", border:dark?"#0d2a42":"#d0dce8" };
  const isElite = sig.tier==="elite";

  return (
    <div style={{ background:sbg(sig.signal), border:`3px solid ${sc(sig.signal)}`, borderRadius:14, padding:"18px 16px", marginBottom:14, position:"relative" }}>
      <button onClick={onClose} style={{ position:"absolute", top:10, right:12, background:"none", border:"none", color:t.dim, cursor:"pointer", fontSize:20 }}>×</button>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:900, color:sc(sig.signal), letterSpacing:2, marginBottom:4 }}>
          {sig.tierIcon} {isElite?"ELITE":"STRONG"} SIGNAL — {sig.symbol}
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:32, fontWeight:900, color:sc(sig.signal) }}>
          {sig.signal==="BUY"?"▲":"▼"} {sig.signal}
        </div>
        <div style={{ fontSize:11, color:sc(sig.signal), fontFamily:"monospace", marginTop:4 }}>
          Score: {sig.score}/{sig.maxScore} · {sig.timeframe} · {sig.session?.icon} {sig.session?.name}
        </div>
      </div>

      <ScoreBar bull={sig.bullPct} bear={sig.bearPct} dark={dark} />

      {/* Entry/Exit */}
      <div style={{ background:dark?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.05)", borderRadius:10, padding:"12px", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:10, color:"#4499ff", fontFamily:"monospace" }}>🎯 ENTRY</span>
          <span style={{ fontSize:13, color:"#4499ff", fontFamily:"monospace", fontWeight:900 }}>{sig.entry}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
          <span style={{ fontSize:10, color:"#ff2244", fontFamily:"monospace" }}>🛑 STOP LOSS</span>
          <span style={{ fontSize:13, color:"#ff2244", fontFamily:"monospace", fontWeight:900 }}>{sig.sl}</span>
        </div>
        <div style={{ height:1, background:dark?"#0d2a42":"#d0dce8", marginBottom:12 }} />
        {[
          {icon:"✅", label:"TP1", value:sig.tp1, rr:sig.rr1, note:"Close 50% here", color:"#00dd55"},
          {icon:"✅✅", label:"TP2", value:sig.tp2, rr:sig.rr2, note:"Close 40% here", color:"#00ee77"},
          {icon:"💰", label:"TP3", value:sig.tp3, rr:sig.rr3, note:"Close 10% here", color:"#ffd700"},
        ].map(({icon,label,value,rr,note,color})=>(
          <div key={label} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ fontSize:10, color, fontFamily:"monospace" }}>{icon} {label} <span style={{ color:t.dim, fontSize:8 }}>R:R 1:{rr}</span></span>
              <span style={{ fontSize:13, color, fontFamily:"monospace", fontWeight:900 }}>{value}</span>
            </div>
            <div style={{ fontSize:9, color:t.dim, fontFamily:"monospace", paddingLeft:4 }}>({note})</div>
          </div>
        ))}
        <div style={{ marginTop:8, padding:"6px 10px", background:"#ffaa0022", border:"1px solid #ffaa0033", borderRadius:6, fontSize:9, color:"#ffaa00", fontFamily:"monospace" }}>
          ⚠️ Move SL to Entry when TP1 is hit
        </div>
      </div>

      {/* SMC + Indicators summary */}
      <div style={{ fontSize:9, color:t.muted, fontFamily:"monospace", lineHeight:1.8 }}>
        {sig.smcDetails && <div>📐 SMC: {sig.smcDetails}</div>}
        <div>🐊 Alligator: {sig.alligatorStatus}</div>
        <div>☁️ AlgoAlpha: {sig.algoStatus}</div>
        <div>📊 ADX: {sig.adx} · RSI: {sig.rsi} · Session: {sig.session?.name}</div>
      </div>
    </div>
  );
}

function ExitCard({ exit, dark, onClose }) {
  if (!exit) return null;
  const priority = exit.count>=3?"💀 URGENT":exit.count>=2?"🔴 EXIT NOW":"🟡 WARNING";
  const color = exit.count>=3?"#ff0000":exit.count>=2?"#ff2244":"#ffaa00";
  return (
    <div style={{ background:dark?"#1a0000":"#fff0f0", border:`3px solid ${color}`, borderRadius:14, padding:"16px", marginBottom:14, position:"relative" }}>
      <button onClick={onClose} style={{ position:"absolute", top:10, right:12, background:"none", border:"none", color:"#ff2244", cursor:"pointer", fontSize:20 }}>×</button>
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color, letterSpacing:2, marginBottom:4 }}>
          🚨 EXIT SIGNAL — {exit.symbol}
        </div>
        <div style={{ fontSize:12, color:"#fff", fontFamily:"monospace" }}>{priority}</div>
        <div style={{ fontSize:11, color, fontFamily:"monospace", marginTop:4 }}>⚠️ CLOSE YOUR TRADE NOW</div>
      </div>
      <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:8, padding:"10px 12px" }}>
        <div style={{ fontSize:10, color:"#ff5577", fontFamily:"monospace", marginBottom:4 }}>Reason: {exit.reasons.join(" + ")}</div>
        <div style={{ fontSize:10, color:"#8899aa", fontFamily:"monospace" }}>Direction was: {exit.prevSignal}</div>
        <div style={{ fontSize:10, color:"#ffd700", fontFamily:"monospace" }}>Exit Price: {exit.price}</div>
      </div>
    </div>
  );
}

export default function ExnessSignals({ dark }) {
  const [mode, setMode] = useState("get");
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [result, setResult] = useState(null);
  const [loadingGet, setLoadingGet] = useState(false);
  const [getError, setGetError] = useState("");
  const [autoSignals, setAutoSignals] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState("");
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [soundOn, setSoundOn] = useState(true);
  const [exitAlert, setExitAlert] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const [history, setHistory] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [expandedPair, setExpandedPair] = useState(null);
  const intervalRef = useRef(null);
  const prevSignalsRef = useRef({});

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
  };

  const sc = s=>s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const sbg = s=>s==="BUY"?(dark?"#001a0d":"#e8fff3"):s==="SELL"?(dark?"#1a0005":"#fff0f3"):(dark?"#1a1000":"#fffbe8");

  const getSignal = async () => {
    setLoadingGet(true); setGetError(""); setResult(null);
    try {
      const res = await fetch(`${SERVER}/exness/get/${encodeURIComponent(selectedPair)}`, { signal: AbortSignal.timeout(60000) });
      const contentType = res.headers.get("content-type")||"";
      if (!contentType.includes("json")) { setGetError("Server starting up — wait 30s and retry"); setLoadingGet(false); return; }
      const data = await res.json();
      if (data.error) { setGetError(data.error); setLoadingGet(false); return; }
      setResult(data);
      if (soundOn && data.signal!=="WAIT") playAlert(data.tier);
      setHistory(h=>[{...data, time:new Date().toLocaleTimeString()},...h].slice(0,20));
    } catch(e) {
      setGetError(e.name==="AbortError"?"Timeout — server may be waking up":e.message);
    }
    setLoadingGet(false);
  };

  const fetchAutoSignals = async () => {
    try {
      const res = await fetch(`${SERVER}/exness/signals`, { signal: AbortSignal.timeout(15000) });
      const ct = res.headers.get("content-type")||"";
      if (!ct.includes("json")) { setAutoError("Server offline — retrying..."); return; }
      const data = await res.json();
      const newSigs = data.signals||{};

      // Detect new signals + exit alerts
      let newCount = 0;
      Object.entries(newSigs).forEach(([sym,sig])=>{
        const prev = prevSignalsRef.current[sym];
        if (!prev) return;
        // New signal alert
        if ((sig.signal==="BUY"||sig.signal==="SELL") && sig.signal!==prev.signal && sig.score>=8) {
          newCount++;
          if (soundOn) playAlert(sig.tier);
        }
        // Exit alert detection
        if (prev.signal==="BUY"||prev.signal==="SELL") {
          const reasons = [];
          if (sig.signal!==prev.signal && (sig.signal==="BUY"||sig.signal==="SELL")) reasons.push("Signal Flipped");
          if (sig.indicators?.ema?.bear && prev.signal==="BUY") reasons.push("EMA Bearish Cross");
          if (sig.indicators?.ema?.bull && prev.signal==="SELL") reasons.push("EMA Bullish Cross");
          if (sig.indicators?.macd?.bear && prev.signal==="BUY") reasons.push("MACD Bearish");
          if (sig.indicators?.macd?.bull && prev.signal==="SELL") reasons.push("MACD Bullish");
          if (sig.indicators?.alligator?.neutral) reasons.push("Alligator Sleeping");
          if (reasons.length>=2) {
            setExitAlert({ symbol:sym, reasons, count:reasons.length, prevSignal:prev.signal, price:sig.price });
            if (soundOn) playExitAlert();
          }
        }
      });
      prevSignalsRef.current = newSigs;
      setAutoSignals(newSigs);
      setLastUpdated(data.lastUpdated);
      setIsAnalyzing(data.isAnalyzing);
      setAutoError("");
    } catch(e) { setAutoError("Server offline — retrying..."); }
    setAutoLoading(false);
  };

  useEffect(() => {
    if (mode==="auto") { setAutoLoading(true); fetchAutoSignals(); }
    return () => clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (mode==="auto" && running) intervalRef.current = setInterval(fetchAutoSignals, 30000);
  }, [running, mode]);

  const triggerAuto = () => {
    fetch(`${SERVER}/exness/trigger`, { signal:AbortSignal.timeout(10000) }).catch(()=>{});
    setIsAnalyzing(true);
    // Progress simulation
    setScanProgress(0);
    const prog = setInterval(()=>setScanProgress(p=>{ if(p>=100){clearInterval(prog);return 100;} return p+3; }), 900);
    setTimeout(fetchAutoSignals, 30000);
  };

  const timeAgo = ts => {
    if (!ts) return "Never";
    const d = Math.floor((Date.now()-new Date(ts).getTime())/1000);
    if (d<60) return `${d}s ago`;
    if (d<3600) return `${Math.floor(d/60)}m ago`;
    return `${Math.floor(d/3600)}h ago`;
  };

  const allSigs = Object.values(autoSignals);
  const strongSigs = allSigs.filter(s=>(s.signal==="BUY"||s.signal==="SELL")&&s.score>=8).sort((a,b)=>b.score-a.score);
  const filtered = filter==="ALL"?strongSigs:filter==="BUY"?strongSigs.filter(s=>s.signal==="BUY"):strongSigs.filter(s=>s.signal==="SELL");

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideD{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes prog{from{width:0%}to{width:100%}}
        .exspin{animation:spin 1s linear infinite;display:inline-block}
        .exslide{animation:slideD 0.3s ease}
        .exbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .exbtn:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}
        .exbtn:disabled{opacity:0.5;cursor:not-allowed}
        .pchip{cursor:pointer;transition:all 0.12s;user-select:none}
        .pchip:hover{transform:scale(1.05)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #0066ff44", borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:2, marginBottom:2 }}>
                📊 EXNESS SIGNALS
              </div>
              <div style={{ fontSize:9, color:t.dim }}>10-STRATEGY CONFLUENCE · 27 FOREX PAIRS · 1H TIMEFRAME</div>
            </div>
            <button className="exbtn" onClick={()=>setSoundOn(!soundOn)}
              style={{ background:soundOn?"#ffd70022":"transparent", border:`1px solid ${soundOn?"#ffd70044":t.border}`, color:soundOn?"#ffd700":t.muted, padding:"6px 10px", borderRadius:6, fontSize:12 }}>
              {soundOn?"🔔":"🔕"}
            </button>
          </div>
        </div>

        {/* Exit Alert */}
        {exitAlert && <ExitCard exit={exitAlert} dark={dark} onClose={()=>setExitAlert(null)} />}

        {/* Mode switcher */}
        <div style={{ display:"flex", gap:6, marginBottom:14, background:t.bgCard, borderRadius:10, padding:5, border:`1px solid ${t.border}` }}>
          <button className="exbtn" onClick={()=>setMode("get")}
            style={{ flex:1, padding:"11px", background:mode==="get"?"linear-gradient(135deg,#0066ff,#0044bb)":"transparent", border:"none", color:mode==="get"?"#fff":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            ⚡ GET SIGNAL
          </button>
          <button className="exbtn" onClick={()=>setMode("auto")}
            style={{ flex:1, padding:"11px", background:mode==="auto"?"linear-gradient(135deg,#ffd700,#cc9900)":"transparent", border:"none", color:mode==="auto"?"#000":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            🔄 AUTO SCAN
          </button>
        </div>

        {/* ===== GET SIGNAL ===== */}
        {mode==="get" && (
          <div className="exslide">

            {/* TradingView chart */}
            {showChart && (
              <div style={{ borderRadius:8, overflow:"hidden", marginBottom:10, border:`1px solid ${t.border}` }}>
                <div style={{ padding:"5px 10px", background:dark?"#0a1520":"#e8f4ff", fontSize:9, color:"#4499ff", fontFamily:"monospace", fontWeight:700 }}>
                  📊 LIVE CHART · {selectedPair} · 1H
                </div>
                <iframe
                  key={selectedPair}
                  src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TV_MAP[selectedPair]||"FX:EURUSD")}&interval=60&theme=${dark?"dark":"light"}&style=1&locale=en&toolbar_bg=%23f1f3f6&hide_top_toolbar=1&hide_legend=1&hide_side_toolbar=1&save_image=false`}
                  style={{ width:"100%", height:220, border:"none", display:"block" }}
                  title={selectedPair}
                  loading="lazy"
                />
              </div>
            )}
            <button className="exbtn" onClick={()=>setShowChart(!showChart)}
              style={{ width:"100%", background:"transparent", border:`1px solid ${t.border}`, color:t.muted, padding:"6px", borderRadius:6, fontSize:9, marginBottom:12, letterSpacing:1 }}>
              {showChart?"▲ HIDE CHART":"▼ SHOW CHART"}
            </button>

            {/* Pair selector */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px", marginBottom:12 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontWeight:700, marginBottom:10 }}>SELECT PAIR</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {PAIRS.map(p=>(
                  <div key={p} className="pchip"
                    onClick={()=>{setSelectedPair(p);setResult(null);setGetError("");}}
                    style={{ padding:"5px 9px", background:selectedPair===p?(dark?"#0066ff22":"#e0eeff"):"transparent", border:`2px solid ${selectedPair===p?"#0066ff":t.border}`, color:selectedPair===p?"#4499ff":t.muted, borderRadius:6, fontSize:9, fontWeight:700 }}>
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard for result */}
            {result && <Dashboard sig={result} dark={dark} />}

            {getError && (
              <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {getError}</span>
                <button onClick={()=>setGetError("")} className="exbtn" style={{ background:"none", color:"#ff5577", fontSize:18, padding:0 }}>×</button>
              </div>
            )}

            <button className="exbtn" onClick={getSignal} disabled={loadingGet}
              style={{ width:"100%", padding:"16px", background:loadingGet?(dark?"#0a1520":"#e8f0f8"):"linear-gradient(135deg,#0066ff,#0044bb)", border:"none", color:loadingGet?t.muted:"#fff", borderRadius:10, fontSize:13, letterSpacing:2, marginBottom:6 }}>
              {loadingGet?<><span className="exspin">⟳</span> ANALYZING {selectedPair}...</>:`⚡ GET SIGNAL — ${selectedPair}`}
            </button>
            <div style={{ fontSize:9, color:t.dim, textAlign:"center", marginBottom:14 }}>10-strategy confluence · 1H timeframe · Forex optimized</div>

            {/* Signal result */}
            {result && <SignalCard sig={result} dark={dark} onClose={()=>setResult(null)} />}

            {/* History */}
            {history.length>0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px", marginTop:14 }}>
                <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontWeight:700, marginBottom:10 }}>📋 SIGNAL HISTORY ({history.length})</div>
                {history.map((h,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                    <div>
                      <span style={{ fontSize:10, color:dark?"#fff":"#001133", fontWeight:700 }}>{h.symbol}</span>
                      <span style={{ fontSize:8, color:t.dim, marginLeft:6 }}>{h.time}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:9, color:t.dim, fontFamily:"monospace" }}>{h.score}/{h.maxScore}</span>
                      <span style={{ fontSize:10, color:sc(h.signal), fontWeight:900, fontFamily:"monospace" }}>{h.tierIcon} {h.signal}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== AUTO SCAN ===== */}
        {mode==="auto" && (
          <div className="exslide">

            {/* Controls */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:9, color:t.dim }}>Scans 27 pairs · Last: {timeAgo(lastUpdated)}</div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="exbtn" onClick={triggerAuto}
                    style={{ background:"#ffd70022", border:"1px solid #ffd70044", color:"#ffd700", padding:"6px 12px", borderRadius:6, fontSize:9 }}>
                    🔄 SCAN NOW
                  </button>
                  {running
                    ? <button className="exbtn" onClick={()=>setRunning(false)} style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>⏹ STOP</button>
                    : <button className="exbtn" onClick={()=>setRunning(true)} style={{ background:"#00dd5522", border:"1px solid #00dd5533", color:"#00dd55", padding:"6px 12px", borderRadius:6, fontSize:9 }}>▶ START</button>
                  }
                </div>
              </div>

              {/* Progress bar */}
              {isAnalyzing && scanProgress<100 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:9, color:"#4499ff", marginBottom:4 }}>
                    <span className="exspin">⟳</span> Scanning pairs... {scanProgress}%
                  </div>
                  <div style={{ height:4, background:dark?"#0a1520":"#e0eaf4", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${scanProgress}%`, height:"100%", background:"linear-gradient(90deg,#0066ff,#00aaff)", transition:"width 0.5s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                {l:"SCANNED",v:allSigs.length,c:dark?"#c8d8e8":"#1a2a3a"},
                {l:"SIGNALS",v:strongSigs.length,c:"#ffd700"},
                {l:"BUY",v:strongSigs.filter(s=>s.signal==="BUY").length,c:"#00dd55"},
                {l:"SELL",v:strongSigs.filter(s=>s.signal==="SELL").length,c:"#ff2244"},
              ].map(({l,v,c})=>(
                <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:7, letterSpacing:1, color:t.label, marginBottom:3 }}>{l}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Top signal */}
            {strongSigs.length>0 && (
              <div style={{ background:sbg(strongSigs[0].signal), border:`3px solid ${sc(strongSigs[0].signal)}`, borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ fontSize:9, color:sc(strongSigs[0].signal), fontWeight:700, letterSpacing:2, marginBottom:4 }}>🏆 TOP SIGNAL</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:dark?"#fff":"#001133" }}>{strongSigs[0].symbol}</div>
                    <div style={{ fontSize:9, color:t.muted }}>Score: {strongSigs[0].score}/{strongSigs[0].maxScore} · {strongSigs[0].tierIcon} {strongSigs[0].tier?.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:28, fontWeight:900, color:sc(strongSigs[0].signal) }}>
                      {strongSigs[0].signal==="BUY"?"▲":"▼"} {strongSigs[0].signal}
                    </div>
                    <div style={{ fontSize:11, color:sc(strongSigs[0].signal) }}>Entry: {strongSigs[0].entry}</div>
                  </div>
                </div>
              </div>
            )}

            {strongSigs.length===0 && !autoLoading && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:24, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📊</div>
                <div style={{ fontSize:11, color:t.muted, marginBottom:14 }}>No strong signals (score 8+) right now — tap SCAN NOW</div>
                <button className="exbtn" onClick={triggerAuto}
                  style={{ padding:"10px 24px", background:"linear-gradient(135deg,#ffd700,#cc9900)", color:"#000", borderRadius:8, fontSize:11 }}>
                  🔄 SCAN ALL 27 PAIRS
                </button>
              </div>
            )}

            {/* Filter */}
            <div style={{ display:"flex", gap:5, marginBottom:12 }}>
              {["ALL","BUY","SELL"].map(f=>(
                <button key={f} className="exbtn" onClick={()=>setFilter(f)}
                  style={{ padding:"5px 14px", background:filter===f?"#ffd700":"transparent", border:`1px solid ${filter===f?"#ffd700":t.border}`, color:filter===f?"#000":t.muted, borderRadius:5, fontSize:9 }}>
                  {f}
                </button>
              ))}
            </div>

            {autoError && (
              <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"8px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:10, color:"#ff5577" }}>⚠ {autoError}</span>
                <button className="exbtn" onClick={fetchAutoSignals} style={{ background:"none", color:"#4499ff", fontSize:9 }}>RETRY</button>
              </div>
            )}

            {/* Signal cards */}
            {filtered.map((sig,i)=>(
              <div key={sig.symbol} style={{ background:sbg(sig.signal), border:`2px solid ${sc(sig.signal)}44`, borderLeft:`5px solid ${sc(sig.signal)}`, borderRadius:12, padding:"12px 14px", marginBottom:10, cursor:"pointer" }}
                onClick={()=>setExpandedPair(expandedPair===sig.symbol?null:sig.symbol)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div>
                    <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133" }}>{sig.symbol}</span>
                    <span style={{ fontSize:8, color:t.dim, marginLeft:6, background:dark?"#0a1520":"#e0eaf4", padding:"1px 5px", borderRadius:3 }}>1H</span>
                    <div style={{ fontSize:9, color:t.dim, marginTop:3 }}>{sig.tierIcon} Score: {sig.score}/{sig.maxScore} · {sig.session?.icon} {sig.session?.name}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:sc(sig.signal) }}>
                      {sig.signal==="BUY"?"▲":"▼"} {sig.signal}
                    </div>
                    <div style={{ fontSize:10, color:sc(sig.signal) }}>{sig.entry}</div>
                  </div>
                </div>
                <ScoreBar bull={sig.bullPct} bear={sig.bearPct} dark={dark} />
                {expandedPair===sig.symbol && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
                      {[{l:"ENTRY",v:sig.entry,c:"#4499ff"},{l:"TP1",v:sig.tp1,c:"#00dd55"},{l:"TP2",v:sig.tp2,c:"#00ee77"},{l:"SL",v:sig.sl,c:"#ff2244"}].map(({l,v,c})=>(
                        <div key={l} style={{ background:dark?"rgba(0,0,0,0.25)":"rgba(0,0,0,0.05)", borderRadius:6, padding:"6px", textAlign:"center" }}>
                          <div style={{ fontSize:8, color:t.label }}>{l}</div>
                          <div style={{ fontSize:9, color:c, fontWeight:700, fontFamily:"monospace" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:9, color:t.muted, lineHeight:1.8, fontFamily:"monospace" }}>
                      {sig.smcDetails && <div>📐 {sig.smcDetails}</div>}
                      <div>🐊 {sig.alligatorStatus} · ☁️ {sig.algoStatus}</div>
                      <div>RSI: {sig.rsi} · ADX: {sig.adx} · ⚠️ Move SL to entry at TP1</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
