import { useState, useEffect, useRef } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const ALL_PAIRS = [
  { symbol:"EUR/USD", flag:"🇪🇺🇺🇸" }, { symbol:"CAD/JPY", flag:"🇨🇦🇯🇵" },
  { symbol:"GBP/AUD", flag:"🇬🇧🇦🇺" }, { symbol:"EUR/GBP", flag:"🇪🇺🇬🇧" },
  { symbol:"EUR/CAD", flag:"🇪🇺🇨🇦" }, { symbol:"GBP/CAD", flag:"🇬🇧🇨🇦" },
  { symbol:"GBP/JPY", flag:"🇬🇧🇯🇵" }, { symbol:"AUD/USD", flag:"🇦🇺🇺🇸" },
  { symbol:"CHF/JPY", flag:"🇨🇭🇯🇵" }, { symbol:"AUD/CHF", flag:"🇦🇺🇨🇭" },
  { symbol:"GBP/CHF", flag:"🇬🇧🇨🇭" }, { symbol:"AUD/CAD", flag:"🇦🇺🇨🇦" },
  { symbol:"GBP/USD", flag:"🇬🇧🇺🇸" }, { symbol:"USD/JPY", flag:"🇺🇸🇯🇵" },
  { symbol:"USD/CHF", flag:"🇺🇸🇨🇭" }, { symbol:"USD/CAD", flag:"🇺🇸🇨🇦" },
  { symbol:"EUR/JPY", flag:"🇪🇺🇯🇵" }, { symbol:"EUR/AUD", flag:"🇪🇺🇦🇺" },
  { symbol:"EUR/NZD", flag:"🇪🇺🇳🇿" }, { symbol:"EUR/CHF", flag:"🇪🇺🇨🇭" },
  { symbol:"AUD/JPY", flag:"🇦🇺🇯🇵" }, { symbol:"AUD/NZD", flag:"🇦🇺🇳🇿" },
  { symbol:"CAD/CHF", flag:"🇨🇦🇨🇭" }, { symbol:"NZD/USD", flag:"🇳🇿🇺🇸" },
  { symbol:"NZD/JPY", flag:"🇳🇿🇯🇵" }, { symbol:"NZD/CAD", flag:"🇳🇿🇨🇦" },
  { symbol:"NZD/CHF", flag:"🇳🇿🇨🇭" }, { symbol:"XAU/USD", flag:"🥇"     },
  { symbol:"BTC/USD", flag:"₿"       }, { symbol:"ETH/USD", flag:"Ξ"       },
];

function BuyerBar({ buyers, sellers, dark }) {
  const diff = Math.abs(buyers - sellers);
  const dominant = buyers > sellers ? "BUY" : "SELL";
  const strength = diff >= 20 ? "Strong" : diff >= 10 ? "Moderate" : "Slight";
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:10, color:"#00dd55", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>👥 BUYERS {buyers}%</span>
        <span style={{ fontSize:10, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>SELLERS {sellers}% 👥</span>
      </div>
      <div style={{ height:12, background:dark?"#0a1520":"#e0eaf4", borderRadius:6, overflow:"hidden", display:"flex" }}>
        <div style={{ width:`${buyers}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)", transition:"width 0.6s", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {buyers > 30 && <span style={{ fontSize:8, color:"#fff", fontWeight:700 }}>{buyers}%</span>}
        </div>
        <div style={{ width:`${sellers}%`, background:"linear-gradient(90deg,#dd2244,#ff2244)", transition:"width 0.6s", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {sellers > 30 && <span style={{ fontSize:8, color:"#fff", fontWeight:700 }}>{sellers}%</span>}
        </div>
      </div>
      <div style={{ textAlign:"center", marginTop:3, fontSize:9, color:dominant==="BUY"?"#00dd55":"#ff2244", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
        {strength} {dominant} pressure — {diff}% {dominant==="BUY"?"more buyers":"more sellers"}
      </div>
    </div>
  );
}

function CandleCard({ candle, dark }) {
  const up = candle.direction === "UP";
  const color = up ? "#00dd55" : "#ff2244";
  return (
    <div style={{ background:up?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"), border:`2px solid ${color}33`, borderRadius:10, padding:"12px 10px", borderTop:`4px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:9, color:dark?"#667788":"#556677", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>CANDLE #{candle.number}</span>
        <span style={{ background:color+"33", color, fontSize:11, padding:"2px 8px", borderRadius:4, fontWeight:900, fontFamily:"'IBM Plex Mono',monospace" }}>
          {up?"▲ UP":"▼ DOWN"}
        </span>
      </div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:26, fontWeight:900, color, marginBottom:2 }}>{candle.confidence}%</div>
      <div style={{ fontSize:9, color:dark?"#667788":"#778899", marginBottom:6, fontFamily:"'IBM Plex Mono',monospace" }}>{candle.strength}</div>
      <div style={{ height:5, background:dark?"#0a1520":"#e0eaf4", borderRadius:3, overflow:"hidden", marginBottom:8 }}>
        <div style={{ width:`${candle.confidence}%`, height:"100%", background:color, borderRadius:3 }} />
      </div>
      <div style={{ fontSize:9, color:dark?"#8899aa":"#445566", fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.5 }}>{candle.reason}</div>
    </div>
  );
}

function ResultCard({ result, dark, onClose }) {
  const sc = s => s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const sbg = s => s==="BUY"?(dark?"#001a0d":"#e8fff3"):s==="SELL"?(dark?"#1a0005":"#fff0f3"):(dark?"#1a1000":"#fffbe8");
  const [showInd, setShowInd] = useState(false);
  const t = { muted:dark?"#8899aa":"#445566", dim:dark?"#445566":"#778899", label:dark?"#667788":"#556677", border:dark?"#0d2a42":"#d0dce8" };
  const sig = result.signal;

  return (
    <div style={{ background:sbg(sig), border:`3px solid ${sc(sig)}55`, borderLeft:`6px solid ${sc(sig)}`, borderRadius:14, padding:"18px 16px", marginTop:14 }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.result-card{animation:slideIn 0.3s ease}`}</style>

      {/* Close button */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>{result.flag}</span>
          <div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:dark?"#fff":"#001133" }}>{result.symbol}</div>
            <div style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>1MIN · {result.expiry} expiry</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"transparent", border:"none", color:t.muted, cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
      </div>

      {/* Main signal */}
      <div style={{ textAlign:"center", marginBottom:16, padding:"16px", background:dark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.5)", borderRadius:10 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:42, fontWeight:900, color:sc(sig), marginBottom:4 }}>
          {sig==="BUY"?"▲":sig==="SELL"?"▼":"◆"} {sig}
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:700, color:sc(sig), marginBottom:6 }}>{result.confidence}% CONFIDENCE</div>
        <div style={{ fontSize:10, color:t.muted, fontFamily:"'IBM Plex Mono',monospace" }}>💰 Entry: {result.entry} · {result.pattern}</div>
      </div>

      {/* Buyers/Sellers */}
      <BuyerBar buyers={result.buyers} sellers={result.sellers} dark={dark} />

      {/* Indicator score */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontSize:9, color:"#00dd55", fontFamily:"'IBM Plex Mono',monospace" }}>BULL {result.bullScore}%</span>
          <span style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>{result.bullVotes}↑ {result.bearVotes}↓ / {result.totalVotes} indicators</span>
          <span style={{ fontSize:9, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>BEAR {result.bearScore}%</span>
        </div>
        <div style={{ height:7, background:dark?"#0a1520":"#e0eaf4", borderRadius:4, overflow:"hidden", display:"flex" }}>
          <div style={{ width:`${result.bullScore}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)", transition:"width 0.5s" }} />
          <div style={{ width:`${result.bearScore}%`, background:"linear-gradient(90deg,#dd2244,#ff2244)", transition:"width 0.5s" }} />
        </div>
      </div>

      {/* 3 Candles */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:10 }}>
          📊 NEXT 3 CANDLES · 3 MIN EXPIRY
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {(result.next3candles||[]).map(c => <CandleCard key={c.number} candle={c} dark={dark} />)}
        </div>
      </div>

      {/* TP/SL */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
        {[{l:"ENTRY",v:result.entry,c:"#4499ff"},{l:"TP1",v:result.tp1,c:"#00dd55"},{l:"TP2",v:result.tp2,c:"#00ee77"},{l:"SL",v:result.sl,c:"#ff2244"}].map(({l,v,c})=>(
          <div key={l} style={{ background:dark?"rgba(0,0,0,0.25)":"rgba(0,0,0,0.05)", borderRadius:7, padding:"8px 5px", textAlign:"center" }}>
            <div style={{ fontSize:8, color:t.label, fontFamily:"'IBM Plex Mono',monospace", marginBottom:3 }}>{l}</div>
            <div style={{ fontSize:9, color:c, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Toggle indicators */}
      <button onClick={()=>setShowInd(!showInd)}
        style={{ width:"100%", background:"transparent", border:`1px solid ${sc(sig)}33`, borderRadius:6, padding:"7px", fontSize:9, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", cursor:"pointer", fontWeight:700, letterSpacing:1, marginBottom:showInd?12:0 }}>
        {showInd?"▲ HIDE INDICATORS":"▼ SHOW ALL INDICATORS"}
      </button>

      {showInd && result.indicators && (
        <div>
          <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:8 }}>INDICATOR BREAKDOWN</div>
          {Object.entries({ "EMA Cross":result.indicators.emaCross, "EMA 50":result.indicators.ema50, "RSI 14":result.indicators.rsi, "MACD":result.indicators.macd, "VWAP":result.indicators.vwap, "SMA 20":result.indicators.sma20, "Supertrend":result.indicators.supertrend, "Pattern":result.indicators.pattern, "Momentum":result.indicators.momentum })
            .filter(([,d])=>d).map(([label,detail])=>(
            <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
              <span style={{ fontSize:9, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", width:80 }}>{label}</span>
              <span style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace", flex:1, textAlign:"center" }}>{detail.value}</span>
              <span style={{ fontSize:9, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace", color:detail.vote>0?"#00dd55":detail.vote<0?"#ff2244":"#ffaa00", width:55, textAlign:"right" }}>{detail.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PocketOptionAuto({ dark }) {
  const [mode, setMode] = useState("get"); // "get" | "auto"
  const [selectedPair, setSelectedPair] = useState(ALL_PAIRS[0]);
  const [result, setResult] = useState(null);
  const [loadingGet, setLoadingGet] = useState(false);
  const [getError, setGetError] = useState("");
  // Auto mode
  const [autoSignals, setAutoSignals] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);
  const intervalRef = useRef(null);

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
    inp: dark?"rgba(0,40,80,0.3)":"#e8f0f8",
  };

  // Check server on mount
  useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    try {
      const r = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(15000) });
      if (r.ok) setServerOnline(true);
    } catch(e) { setServerOnline(false); }
  };

  // GET SIGNAL — instant single pair
  const getSignal = async () => {
    setLoadingGet(true);
    setGetError("");
    setResult(null);
    try {
      const sym = encodeURIComponent(selectedPair.symbol);
      const res = await fetch(`${SERVER}/po/get/${sym}`, {
        signal: AbortSignal.timeout(45000)
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch(e) { setGetError("Server returned invalid response. It may be starting up — wait 30s and retry."); setLoadingGet(false); return; }
      if (data.error) { setGetError(data.error); setLoadingGet(false); return; }
      // Add flag from pair list
      const pairInfo = ALL_PAIRS.find(p => p.symbol === selectedPair.symbol);
      setResult({ ...data, flag: pairInfo?.flag || "📊" });
    } catch(e) {
      if (e.name === "AbortError") setGetError("Request timed out — server may be waking up. Wait 30 seconds and try again.");
      else setGetError(`Connection error: ${e.message}`);
    }
    setLoadingGet(false);
  };

  // AUTO — fetch all signals
  const fetchAutoSignals = async () => {
    try {
      const res = await fetch(`${SERVER}/po/signals`, { signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch(e) { setAutoError("Server offline — retrying..."); return; }
      setAutoSignals(data.signals || {});
      setLastUpdated(data.lastUpdated);
      setIsAnalyzing(data.isAnalyzing);
      setAutoError("");
      setServerOnline(true);
    } catch(e) { setAutoError("Server offline — retrying..."); }
    setAutoLoading(false);
  };

  const triggerAuto = () => {
    fetch(`${SERVER}/po/trigger`, { signal: AbortSignal.timeout(10000) }).catch(()=>{});
    setIsAnalyzing(true);
    setTimeout(fetchAutoSignals, 8000);
  };

  useEffect(() => {
    if (mode === "auto") {
      setAutoLoading(true);
      fetchAutoSignals();
      if (running) {
        intervalRef.current = setInterval(fetchAutoSignals, 60000);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [mode, running]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (mode === "auto" && running) {
      intervalRef.current = setInterval(fetchAutoSignals, 60000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const timeAgo = ts => {
    if (!ts) return "Never";
    const d = Math.floor((Date.now()-new Date(ts))/1000);
    if (d<60) return `${d}s ago`;
    if (d<3600) return `${Math.floor(d/60)}m ago`;
    return `${Math.floor(d/3600)}h ago`;
  };

  const sc = s => s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const sbg = s => s==="BUY"?(dark?"#001a0d":"#e8fff3"):s==="SELL"?(dark?"#1a0005":"#fff0f3"):(dark?"#1a1000":"#fffbe8");

  const allAuto = Object.values(autoSignals);
  const filtered = filter==="ALL"?allAuto:filter==="BUY"?allAuto.filter(s=>s.signal==="BUY"):filter==="SELL"?allAuto.filter(s=>s.signal==="SELL"):allAuto;

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .pospin{animation:spin 1s linear infinite;display:inline-block}
        .populse{animation:pulse 1.5s infinite}
        .pobtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .pobtn:hover{opacity:0.85}
        .pair-chip{cursor:pointer;transition:all 0.15s;user-select:none}
        .pair-chip:hover{transform:scale(1.04)}
        .slide-down{animation:slideDown 0.3s ease}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:2, marginBottom:3 }}>
                🟢 POCKET OPTION AUTO
              </div>
              <div style={{ fontSize:9, color:t.dim }}>
                1MIN · 3 CANDLES EXPIRY · 27 FOREX PAIRS + GOLD + CRYPTO
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:serverOnline?"#00dd55":"#ff4466" }} />
              <span style={{ fontSize:9, color:serverOnline?"#00dd55":"#ff4466" }}>{serverOnline?"ONLINE":"OFFLINE"}</span>
            </div>
          </div>
        </div>

        {/* Mode switcher */}
        <div style={{ display:"flex", gap:6, marginBottom:16, background:t.bgCard, borderRadius:10, padding:5, border:`1px solid ${t.border}` }}>
          <button className="pobtn" onClick={()=>setMode("get")}
            style={{ flex:1, padding:"11px", background:mode==="get"?"linear-gradient(135deg,#00aa44,#007733)":"transparent", border:"none", color:mode==="get"?"#fff":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            ⚡ GET SIGNAL
          </button>
          <button className="pobtn" onClick={()=>setMode("auto")}
            style={{ flex:1, padding:"11px", background:mode==="auto"?"#0066ff":"transparent", border:"none", color:mode==="auto"?"#fff":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            📡 AUTO SCAN
          </button>
        </div>

        {/* ===== GET SIGNAL MODE ===== */}
        {mode==="get" && (
          <div className="slide-down">
            {/* Pair selector */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontWeight:700, marginBottom:12 }}>SELECT PAIR</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {ALL_PAIRS.map(p => (
                  <div key={p.symbol} className="pair-chip" onClick={()=>{ setSelectedPair(p); setResult(null); setGetError(""); }}
                    style={{ padding:"6px 10px", background:selectedPair.symbol===p.symbol?(dark?"#00aa4422":"#e8fff3"):"transparent", border:`2px solid ${selectedPair.symbol===p.symbol?"#00aa44":t.border}`, color:selectedPair.symbol===p.symbol?"#00aa44":t.muted, borderRadius:7, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                    <span>{p.flag}</span> {p.symbol}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected pair + Get Signal button */}
            <div style={{ background:t.bgCard, border:`2px solid #00aa4444`, borderRadius:12, padding:"16px", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:28 }}>{selectedPair.flag}</span>
                  <div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:dark?"#fff":"#001133" }}>{selectedPair.symbol}</div>
                    <div style={{ fontSize:9, color:t.dim }}>1 minute · 3 candles · 3 min expiry</div>
                  </div>
                </div>
              </div>

              {getError && (
                <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:7, padding:"10px 14px", marginBottom:12, fontSize:11, color:"#ff5577" }}>
                  ⚠ {getError}
                  <button onClick={()=>setGetError("")} style={{ float:"right", background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:16 }}>×</button>
                </div>
              )}

              <button className="pobtn" onClick={getSignal} disabled={loadingGet}
                style={{ width:"100%", padding:"16px", background:loadingGet?(dark?"#0a1520":"#e0eaf4"):"linear-gradient(135deg,#00aa44,#007733)", border:"none", color:loadingGet?t.muted:"#fff", borderRadius:10, fontSize:14, letterSpacing:2, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                {loadingGet ? <><span className="pospin">⟳</span> ANALYZING {selectedPair.symbol}...</> : `⚡ GET SIGNAL — ${selectedPair.symbol}`}
              </button>

              {loadingGet && (
                <div style={{ marginTop:10, fontSize:10, color:t.dim, textAlign:"center" }}>
                  Fetching candles → Running 9 indicators → Predicting 3 candles...
                </div>
              )}
            </div>

            {/* Result */}
            {result && <ResultCard result={result} dark={dark} onClose={()=>setResult(null)} />}
          </div>
        )}

        {/* ===== AUTO SCAN MODE ===== */}
        {mode==="auto" && (
          <div className="slide-down">
            {/* Controls */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:9, color:t.dim }}>
                  Auto-scans all 29 pairs every 60s · Last: {timeAgo(lastUpdated)}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="pobtn" onClick={triggerAuto}
                    style={{ background:"#0066ff22", border:"1px solid #0066ff44", color:"#4499ff", padding:"6px 12px", borderRadius:6, fontSize:9 }}>
                    ⟳ SCAN NOW
                  </button>
                  {running
                    ? <button className="pobtn" onClick={()=>setRunning(false)} style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>⏹ STOP</button>
                    : <button className="pobtn" onClick={()=>setRunning(true)} style={{ background:"#00dd5522", border:"1px solid #00dd5533", color:"#00dd55", padding:"6px 12px", borderRadius:6, fontSize:9 }}>▶ START AUTO</button>
                  }
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              {[{l:"BUY",v:allAuto.filter(s=>s.signal==="BUY").length,c:"#00dd55"},
                {l:"SELL",v:allAuto.filter(s=>s.signal==="SELL").length,c:"#ff2244"},
                {l:"TOTAL",v:allAuto.length,c:dark?"#c8d8e8":"#1a2a3a"}].map(({l,v,c})=>(
                <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:8, letterSpacing:2, color:t.label, marginBottom:3 }}>{l}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{ display:"flex", gap:5, marginBottom:12 }}>
              {["ALL","BUY","SELL"].map(f=>(
                <button key={f} className="pobtn" onClick={()=>setFilter(f)}
                  style={{ padding:"5px 14px", background:filter===f?"#ffd700":"transparent", border:`1px solid ${filter===f?"#ffd700":t.border}`, color:filter===f?"#000":t.muted, borderRadius:5, fontSize:9, letterSpacing:1 }}>
                  {f}
                </button>
              ))}
            </div>

            {autoError && (
              <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"8px 14px", marginBottom:12, fontSize:10, color:"#ff5577" }}>
                ⚠ {autoError} <button className="pobtn" onClick={()=>{fetchAutoSignals();checkServer();}} style={{ background:"none", color:"#4499ff", fontSize:9, marginLeft:8 }}>Retry</button>
              </div>
            )}

            {isAnalyzing && (
              <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"8px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
                <span className="pospin" style={{ color:"#4499ff" }}>⟳</span>
                <span style={{ fontSize:10, color:"#4499ff" }}>Scanning all 29 pairs...</span>
              </div>
            )}

            {autoLoading && allAuto.length===0 && (
              <div style={{ textAlign:"center", padding:32 }}>
                <div className="pospin" style={{ fontSize:24, color:"#00aa44" }}>⟳</div>
                <div style={{ marginTop:8, fontSize:11, color:t.dim }}>Loading signals...</div>
              </div>
            )}

            {!autoLoading && allAuto.length===0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:24, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📊</div>
                <div style={{ fontSize:11, color:t.muted, marginBottom:14 }}>No signals yet — tap SCAN NOW to start</div>
                <button className="pobtn" onClick={triggerAuto}
                  style={{ padding:"10px 24px", background:"linear-gradient(135deg,#00aa44,#007733)", color:"#fff", borderRadius:8, fontSize:11, letterSpacing:1 }}>
                  ⚡ SCAN ALL PAIRS NOW
                </button>
              </div>
            )}

            {/* Auto signal cards - compact */}
            {filtered.map((sig,i)=>{
              const flag = ALL_PAIRS.find(p=>p.symbol===sig.symbol)?.flag||"📊";
              return (
                <div key={sig.symbol} style={{ background:sbg(sig.signal), border:`2px solid ${sc(sig.signal)}44`, borderLeft:`5px solid ${sc(sig.signal)}`, borderRadius:12, padding:"12px 14px", marginBottom:10, cursor:"pointer" }}
                  onClick={()=>setExpanded(expanded===i?null:i)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{flag}</span>
                      <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133" }}>{sig.symbol}</span>
                      <span style={{ fontSize:8, color:t.dim, background:dark?"#0a1520":"#e0eaf4", padding:"1px 5px", borderRadius:3 }}>1MIN</span>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:sc(sig.signal) }}>
                        {sig.signal==="BUY"?"▲":sig.signal==="SELL"?"▼":"◆"} {sig.signal}
                      </div>
                      <div style={{ fontSize:12, color:sc(sig.signal), fontWeight:700 }}>{sig.confidence}%</div>
                    </div>
                  </div>
                  <BuyerBar buyers={sig.buyers||50} sellers={sig.sellers||50} dark={dark} />
                  {expanded===i && (
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontWeight:700, marginBottom:8 }}>NEXT 3 CANDLES</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                        {(sig.next3candles||[]).map(c=><CandleCard key={c.number} candle={c} dark={dark} />)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
