import { useState, useEffect, useRef } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const ALL_PAIRS = [
  { symbol:"EUR/USD", flag:"🇪🇺🇺🇸", tv:"FX:EURUSD" },
  { symbol:"CAD/JPY", flag:"🇨🇦🇯🇵", tv:"FX:CADJPY" },
  { symbol:"GBP/AUD", flag:"🇬🇧🇦🇺", tv:"FX:GBPAUD" },
  { symbol:"EUR/GBP", flag:"🇪🇺🇬🇧", tv:"FX:EURGBP" },
  { symbol:"EUR/CAD", flag:"🇪🇺🇨🇦", tv:"FX:EURCAD" },
  { symbol:"GBP/CAD", flag:"🇬🇧🇨🇦", tv:"FX:GBPCAD" },
  { symbol:"GBP/JPY", flag:"🇬🇧🇯🇵", tv:"FX:GBPJPY" },
  { symbol:"AUD/USD", flag:"🇦🇺🇺🇸", tv:"FX:AUDUSD" },
  { symbol:"CHF/JPY", flag:"🇨🇭🇯🇵", tv:"FX:CHFJPY" },
  { symbol:"AUD/CHF", flag:"🇦🇺🇨🇭", tv:"FX:AUDCHF" },
  { symbol:"GBP/CHF", flag:"🇬🇧🇨🇭", tv:"FX:GBPCHF" },
  { symbol:"AUD/CAD", flag:"🇦🇺🇨🇦", tv:"FX:AUDCAD" },
  { symbol:"GBP/USD", flag:"🇬🇧🇺🇸", tv:"FX:GBPUSD" },
  { symbol:"USD/JPY", flag:"🇺🇸🇯🇵", tv:"FX:USDJPY" },
  { symbol:"USD/CHF", flag:"🇺🇸🇨🇭", tv:"FX:USDCHF" },
  { symbol:"USD/CAD", flag:"🇺🇸🇨🇦", tv:"FX:USDCAD" },
  { symbol:"EUR/JPY", flag:"🇪🇺🇯🇵", tv:"FX:EURJPY" },
  { symbol:"EUR/AUD", flag:"🇪🇺🇦🇺", tv:"FX:EURAUD" },
  { symbol:"EUR/NZD", flag:"🇪🇺🇳🇿", tv:"FX:EURNZD" },
  { symbol:"EUR/CHF", flag:"🇪🇺🇨🇭", tv:"FX:EURCHF" },
  { symbol:"AUD/JPY", flag:"🇦🇺🇯🇵", tv:"FX:AUDJPY" },
  { symbol:"AUD/NZD", flag:"🇦🇺🇳🇿", tv:"FX:AUDNZD" },
  { symbol:"CAD/CHF", flag:"🇨🇦🇨🇭", tv:"FX:CADCHF" },
  { symbol:"NZD/USD", flag:"🇳🇿🇺🇸", tv:"FX:NZDUSD" },
  { symbol:"NZD/JPY", flag:"🇳🇿🇯🇵", tv:"FX:NZDJPY" },
  { symbol:"NZD/CAD", flag:"🇳🇿🇨🇦", tv:"FX:NZDCAD" },
  { symbol:"NZD/CHF", flag:"🇳🇿🇨🇭", tv:"FX:NZDCHF" },
  { symbol:"XAU/USD", flag:"🥇",      tv:"TVC:GOLD"  },
  { symbol:"BTC/USD", flag:"₿",       tv:"BINANCE:BTCUSDT" },
  { symbol:"ETH/USD", flag:"Ξ",       tv:"BINANCE:ETHUSDT" },
];

function TVChart({ tvSymbol, dark }) {
  const theme = dark ? "dark" : "light";
  return (
    <div style={{ borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ padding:"6px 10px", background:dark?"#0a1520":"#e8f4ff", fontSize:9, color:dark?"#4499ff":"#0055aa", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, letterSpacing:1 }}>
        📊 LIVE CHART · 1MIN
      </div>
      <iframe
        key={tvSymbol}
        src={`https://www.tradingview.com/widgetembed/?frameElementId=tv_po_${tvSymbol.replace(/[:/]/g,"_")}&symbol=${encodeURIComponent(tvSymbol)}&interval=1&theme=${theme}&style=1&locale=en&toolbar_bg=%23f1f3f6&enable_publishing=false&hide_top_toolbar=1&hide_legend=1&hide_side_toolbar=1&save_image=false&withdateranges=0&studies=[]`}
        style={{ width:"100%", height:220, border:"none", display:"block" }}
        title={tvSymbol + " chart"}
        loading="lazy"
        allow="fullscreen"
      />
    </div>
  );
}

function BuyerBar({ buyers, sellers, dark }) {
  const diff = Math.abs(buyers - sellers);
  const dom = buyers > sellers ? "BUY" : "SELL";
  const str = diff >= 20 ? "Strong" : diff >= 10 ? "Moderate" : "Slight";
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:10, color:"#00dd55", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>👥 BUYERS {buyers}%</span>
        <span style={{ fontSize:10, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>SELLERS {sellers}% 👥</span>
      </div>
      <div style={{ height:12, background:dark?"#0a1520":"#e0eaf4", borderRadius:6, overflow:"hidden", display:"flex" }}>
        <div style={{ width:`${buyers}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)", transition:"width 0.6s", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {buyers>30 && <span style={{ fontSize:8, color:"#fff", fontWeight:700 }}>{buyers}%</span>}
        </div>
        <div style={{ width:`${sellers}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)", transition:"width 0.6s", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {sellers>30 && <span style={{ fontSize:8, color:"#fff", fontWeight:700 }}>{sellers}%</span>}
        </div>
      </div>
      <div style={{ textAlign:"center", marginTop:3, fontSize:9, color:dom==="BUY"?"#00dd55":"#ff2244", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
        {str} {dom} pressure — {diff}% {dom==="BUY"?"more buyers":"more sellers"}
      </div>
    </div>
  );
}

function CandleCard({ candle, dark }) {
  const up = candle.direction === "UP";
  const color = up ? "#00dd55" : "#ff2244";
  return (
    <div style={{ background:up?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"), border:`2px solid ${color}33`, borderRadius:10, padding:"12px 10px", borderTop:`4px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <span style={{ fontSize:9, color:dark?"#667788":"#556677", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>CANDLE #{candle.number}</span>
        <span style={{ background:color+"33", color, fontSize:10, padding:"1px 7px", borderRadius:4, fontWeight:900, fontFamily:"'IBM Plex Mono',monospace" }}>
          {up?"▲ UP":"▼ DOWN"}
        </span>
      </div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:24, fontWeight:900, color, marginBottom:2 }}>{candle.confidence}%</div>
      <div style={{ fontSize:9, color:dark?"#667788":"#778899", marginBottom:5, fontFamily:"'IBM Plex Mono',monospace" }}>{candle.strength}</div>
      <div style={{ height:5, background:dark?"#0a1520":"#e0eaf4", borderRadius:3, overflow:"hidden", marginBottom:6 }}>
        <div style={{ width:`${candle.confidence}%`, height:"100%", background:color, borderRadius:3 }} />
      </div>
      <div style={{ fontSize:9, color:dark?"#8899aa":"#445566", fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.5 }}>{candle.reason}</div>
    </div>
  );
}

export default function PocketOptionAuto({ dark }) {
  const [mode, setMode] = useState("get");
  const [selectedPair, setSelectedPair] = useState(ALL_PAIRS[0]);
  const [result, setResult] = useState(null);
  const [loadingGet, setLoadingGet] = useState(false);
  const [getError, setGetError] = useState("");
  const [showChart, setShowChart] = useState(true);
  const [showInds, setShowInds] = useState(false);
  // Auto
  const [autoSignals, setAutoSignals] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoError, setAutoError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [status, setStatus] = useState("");
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const prevSignalsRef = useRef({});

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
    inp: dark?"rgba(0,40,80,0.3)":"#e8f0f8",
  };

  const sc = s => s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const sbg = s => s==="BUY"?(dark?"#001a0d":"#e8fff3"):s==="SELL"?(dark?"#1a0005":"#fff0f3"):(dark?"#1a1000":"#fffbe8");

  useEffect(() => {
    pingServer();
  }, []);

  const pingServer = async () => {
    for (let i = 0; i < 5; i++) {
      try {
        setStatus("Connecting to server" + (i > 0 ? " (attempt " + (i+1) + "/5)..." : "..."));
        const r = await fetch(SERVER + "/health", { signal: AbortSignal.timeout(20000) });
        if (r.ok) { setServerOnline(true); setStatus(""); return; }
      } catch(e) {}
      setStatus("Server waking up... (" + (i+1) + "/5) free tier sleeps after 15min");
      await new Promise(r => setTimeout(r, 8000));
    }
    setServerOnline(false);
    setStatus("Server offline - tap RETRY");
  };

  const getSignal = async () => {
    setLoadingGet(true);
    setGetError("");
    setResult(null);
    setShowInds(false);
    try {
      const sym = encodeURIComponent(selectedPair.symbol);
      const res = await fetch(`${SERVER}/po/get/${sym}`, {
        signal: AbortSignal.timeout(60000),
      });
      // Check content type first
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json") && !contentType.includes("json")) {
        const text = await res.text();
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          setGetError("Server is starting up — please wait 30 seconds and try again.");
        } else {
          setGetError("Unexpected server response. Check connection.");
        }
        setLoadingGet(false);
        return;
      }
      const data = await res.json();
      if (data.error) { setGetError(data.error); setLoadingGet(false); return; }
      const pairInfo = ALL_PAIRS.find(p => p.symbol === selectedPair.symbol);
      setResult({ ...data, flag: pairInfo?.flag || "📊", tvSymbol: pairInfo?.tv || ("FX:" + selectedPair.symbol.replace("/","")) });
      setServerOnline(true);
    } catch(e) {
      if (e.name === "AbortError") {
        setGetError("Request timed out. Server may be waking up — wait 30 seconds and try again.");
      } else {
        setGetError("Connection failed: " + e.message);
      }
    }
    setLoadingGet(false);
  };

  const fetchAutoSignals = async () => {
    try {
      const res = await fetch(`${SERVER}/po/signals`, { signal: AbortSignal.timeout(15000) });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) { setAutoError("Server offline — retrying..."); return; }
      const data = await res.json();
      setAutoSignals(data.signals || {});
      setLastUpdated(data.lastUpdated);
      setIsAnalyzing(data.isAnalyzing);
      setAutoError("");
      setServerOnline(true);
    } catch(e) { setAutoError("Server offline — retrying..."); }
    setAutoLoading(false);
  };

  useEffect(() => {
    if (mode === "auto") {
      setAutoLoading(true);
      fetchAutoSignals();
    }
    return () => clearInterval(intervalRef.current);
  }, [mode]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (mode === "auto" && running) {
      intervalRef.current = setInterval(fetchAutoSignals, 60000);
    }
  }, [running, mode]);

  const triggerAuto = () => {
    fetch(`${SERVER}/po/trigger`, { signal: AbortSignal.timeout(10000) }).catch(()=>{});
    setIsAnalyzing(true);
    setTimeout(fetchAutoSignals, 8000);
  };

  const timeAgo = ts => {
    if (!ts) return "Never";
    const d = Math.floor((Date.now()-new Date(ts))/1000);
    if (d<60) return `${d}s ago`;
    if (d<3600) return `${Math.floor(d/60)}m ago`;
    return `${Math.floor(d/3600)}h ago`;
  };

  const allAuto = Object.values(autoSignals);
  const filtered = filter==="ALL"?allAuto:filter==="BUY"?allAuto.filter(s=>s.signal==="BUY"):filter==="SELL"?allAuto.filter(s=>s.signal==="SELL"):allAuto;

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .pospin{animation:spin 1s linear infinite;display:inline-block}
        .pob{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .pob:hover{opacity:0.85}
        .pob:disabled{opacity:0.5;cursor:not-allowed}
        .pchip{cursor:pointer;transition:all 0.12s;user-select:none}
        .pchip:hover{transform:scale(1.04)}
        .slide{animation:slideDown 0.3s ease}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:2, marginBottom:2 }}>🟢 PRINCEX IQ SIGNALS</div>
              <div style={{ fontSize:9, color:t.dim }}>1MIN CANDLES · 3 CANDLES EXPIRY · 30 PAIRS</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:serverOnline?"#00dd55":"#ff4466" }} />
              <span style={{ fontSize:9, color:serverOnline?"#00dd55":"#ff4466", fontWeight:700 }}>{serverOnline?"SERVER ONLINE":"OFFLINE"}</span>
              {!serverOnline && <button className="pob" onClick={pingServer} style={{ background:"#0066ff22", border:"1px solid #0066ff44", color:"#4499ff", padding:"3px 8px", borderRadius:4, fontSize:8 }}>RETRY</button>}
            </div>
          </div>
        </div>

        {/* Mode switcher */}
        <div style={{ display:"flex", gap:6, marginBottom:14, background:t.bgCard, borderRadius:10, padding:5, border:`1px solid ${t.border}` }}>
          <button className="pob" onClick={()=>setMode("get")}
            style={{ flex:1, padding:"11px", background:mode==="get"?"linear-gradient(135deg,#00aa44,#007733)":"transparent", border:"none", color:mode==="get"?"#fff":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            ⚡ GET SIGNAL
          </button>
          <button className="pob" onClick={()=>setMode("auto")}
            style={{ flex:1, padding:"11px", background:mode==="auto"?"#0066ff":"transparent", border:"none", color:mode==="auto"?"#fff":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            📡 AUTO SCAN
          </button>
        </div>

        {/* ===== GET SIGNAL ===== */}
        {mode==="get" && (
          <div className="slide">

            {/* TradingView Chart */}
            {showChart && (
              <div style={{ marginBottom:12 }}>
                <TVChart tvSymbol={selectedPair.tv} dark={dark} />
              </div>
            )}

            {/* Chart toggle */}
            <button className="pob" onClick={()=>setShowChart(!showChart)}
              style={{ width:"100%", background:"transparent", border:`1px solid ${t.border}`, color:t.muted, padding:"6px", borderRadius:6, fontSize:9, marginBottom:12, letterSpacing:1 }}>
              {showChart?"▲ HIDE CHART":"▼ SHOW LIVE CHART"}
            </button>

            {/* Pair grid */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px", marginBottom:12 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontWeight:700, marginBottom:10 }}>SELECT PAIR</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {ALL_PAIRS.map(p => (
                  <div key={p.symbol} className="pchip"
                    onClick={()=>{ setSelectedPair(p); setResult(null); setGetError(""); }}
                    style={{ padding:"5px 10px", background:selectedPair.symbol===p.symbol?(dark?"#00aa4422":"#e8fff3"):"transparent", border:`2px solid ${selectedPair.symbol===p.symbol?"#00aa44":t.border}`, color:selectedPair.symbol===p.symbol?"#00aa44":t.muted, borderRadius:7, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:12 }}>{p.flag}</span>
                    <span>{p.symbol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {getError && (
              <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {getError}</span>
                <button onClick={()=>setGetError("")} className="pob" style={{ background:"none", color:"#ff5577", fontSize:18, padding:0 }}>×</button>
              </div>
            )}

            {/* Get Signal button */}
            <button className="pob" onClick={getSignal} disabled={loadingGet}
              style={{ width:"100%", padding:"16px", background:loadingGet?(dark?"#0a1520":"#e8f0f8"):"linear-gradient(135deg,#00aa44,#006622)", border:"none", color:loadingGet?t.muted:"#fff", borderRadius:10, fontSize:14, letterSpacing:2, display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:6 }}>
              {loadingGet
                ? <><span className="pospin">⟳</span> ANALYZING {selectedPair.symbol}...</>
                : <>{selectedPair.flag} GET SIGNAL — {selectedPair.symbol}</>}
            </button>
            <div style={{ fontSize:9, color:t.dim, textAlign:"center", marginBottom:14 }}>1 minute · 3 candles · 3 minute expiry</div>

            {loadingGet && (
              <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ fontSize:10, color:"#4499ff", marginBottom:4 }}>
                  <span className="pospin">⟳</span> Fetching live candles from TwelveData...
                </div>
                <div style={{ fontSize:9, color:t.dim }}>Running EMA · RSI · MACD · VWAP · Supertrend · Pattern detection...</div>
              </div>
            )}

            {/* Result Card */}
            {result && !loadingGet && (
              <div className="slide" style={{ background:sbg(result.signal), border:`3px solid ${sc(result.signal)}55`, borderLeft:`6px solid ${sc(result.signal)}`, borderRadius:14, padding:"18px 16px" }}>

                {/* Signal header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:26 }}>{result.flag}</span>
                    <div>
                      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, fontWeight:900, color:dark?"#fff":"#001133" }}>{result.symbol}</div>
                      <div style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>1MIN · {result.expiry} expiry · {result.pattern}</div>
                    </div>
                  </div>
                  <button onClick={()=>setResult(null)} className="pob" style={{ background:"transparent", border:"none", color:t.muted, fontSize:22, padding:0 }}>×</button>
                </div>

                {/* Big signal */}
                <div style={{ textAlign:"center", padding:"16px 10px", background:dark?"rgba(0,0,0,0.25)":"rgba(255,255,255,0.6)", borderRadius:10, marginBottom:14 }}>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:46, fontWeight:900, color:sc(result.signal), lineHeight:1 }}>
                    {result.signal==="BUY"?"▲":result.signal==="SELL"?"▼":"◆"}
                  </div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:28, fontWeight:900, color:sc(result.signal), marginBottom:4 }}>{result.signal}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:700, color:sc(result.signal) }}>{result.confidence}% CONFIDENCE</div>
                  <div style={{ fontSize:10, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", marginTop:6 }}>
                    💰 Entry: {result.entry} · {result.trend}
                  </div>
                </div>

                {/* Buyers/Sellers */}
                <BuyerBar buyers={result.buyers} sellers={result.sellers} dark={dark} />

                {/* Indicator score */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:9, color:"#00dd55", fontFamily:"'IBM Plex Mono',monospace" }}>BULL {result.bullScore}%</span>
                    <span style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>{result.bullVotes}↑ {result.bearVotes}↓ / {result.totalVotes}</span>
                    <span style={{ fontSize:9, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>BEAR {result.bearScore}%</span>
                  </div>
                  <div style={{ height:8, background:dark?"#0a1520":"#e0eaf4", borderRadius:4, overflow:"hidden", display:"flex" }}>
                    <div style={{ width:`${result.bullScore}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)", transition:"width 0.5s" }} />
                    <div style={{ width:`${result.bearScore}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)", transition:"width 0.5s" }} />
                  </div>
                </div>

                {/* 3 Candles */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:10 }}>
                    📊 NEXT 3 CANDLES — EXPIRY IN 3 MINUTES
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

                {/* Indicators toggle */}
                <button className="pob" onClick={()=>setShowInds(!showInds)}
                  style={{ width:"100%", background:"transparent", border:`1px solid ${sc(result.signal)}33`, borderRadius:6, padding:"7px", fontSize:9, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", marginBottom:showInds?12:0, letterSpacing:1 }}>
                  {showInds?"▲ HIDE INDICATORS":"▼ SHOW ALL INDICATORS"}
                </button>

                {showInds && result.indicators && (
                  <div className="slide">
                    <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:8 }}>INDICATOR BREAKDOWN</div>
                    {Object.entries({
                      "EMA Cross":result.indicators.emaCross, "EMA 50":result.indicators.ema50,
                      "RSI 14":result.indicators.rsi, "MACD":result.indicators.macd,
                      "VWAP":result.indicators.vwap, "SMA 20":result.indicators.sma20,
                      "Supertrend":result.indicators.supertrend, "Pattern":result.indicators.pattern,
                      "Momentum":result.indicators.momentum,
                    }).filter(([,d])=>d).map(([label,detail])=>(
                      <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                        <span style={{ fontSize:9, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", width:80 }}>{label}</span>
                        <span style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace", flex:1, textAlign:"center" }}>{detail.value}</span>
                        <span style={{ fontSize:9, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace", color:detail.vote>0?"#00dd55":detail.vote<0?"#ff2244":"#ffaa00", width:55, textAlign:"right" }}>{detail.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== AUTO SCAN ===== */}
        {mode==="auto" && (
          <div className="slide">
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:9, color:t.dim }}>Scans all 30 pairs · Last: {timeAgo(lastUpdated)}</div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="pob" onClick={triggerAuto} style={{ background:"#0066ff22", border:"1px solid #0066ff44", color:"#4499ff", padding:"6px 12px", borderRadius:6, fontSize:9 }}>⟳ SCAN NOW</button>
                  {running
                    ? <button className="pob" onClick={()=>setRunning(false)} style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>⏹ STOP</button>
                    : <button className="pob" onClick={()=>setRunning(true)} style={{ background:"#00dd5522", border:"1px solid #00dd5533", color:"#00dd55", padding:"6px 12px", borderRadius:6, fontSize:9 }}>▶ START</button>
                  }
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              {[{l:"BUY",v:allAuto.filter(s=>s.signal==="BUY").length,c:"#00dd55"},{l:"SELL",v:allAuto.filter(s=>s.signal==="SELL").length,c:"#ff2244"},{l:"TOTAL",v:allAuto.length,c:dark?"#c8d8e8":"#1a2a3a"}].map(({l,v,c})=>(
                <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:8, letterSpacing:2, color:t.label, marginBottom:3 }}>{l}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:5, marginBottom:12 }}>
              {["ALL","BUY","SELL"].map(f=>(
                <button key={f} className="pob" onClick={()=>setFilter(f)}
                  style={{ padding:"5px 14px", background:filter===f?"#ffd700":"transparent", border:`1px solid ${filter===f?"#ffd700":t.border}`, color:filter===f?"#000":t.muted, borderRadius:5, fontSize:9 }}>
                  {f}
                </button>
              ))}
            </div>

            {autoError && (
              <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"8px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, color:"#ff5577" }}>⚠ {autoError}</span>
                <button className="pob" onClick={fetchAutoSignals} style={{ background:"none", color:"#4499ff", fontSize:9 }}>RETRY</button>
              </div>
            )}

            {isAnalyzing && (
              <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"8px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
                <span className="pospin" style={{ color:"#4499ff" }}>⟳</span>
                <span style={{ fontSize:10, color:"#4499ff" }}>Scanning all 30 pairs...</span>
              </div>
            )}

            {autoLoading && allAuto.length===0 && (
              <div style={{ textAlign:"center", padding:28 }}>
                <div className="pospin" style={{ fontSize:22, color:"#00aa44" }}>⟳</div>
                <div style={{ marginTop:8, fontSize:10, color:t.dim }}>Loading signals...</div>
              </div>
            )}

            {!autoLoading && allAuto.length===0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:24, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📊</div>
                <div style={{ fontSize:11, color:t.muted, marginBottom:14 }}>Tap SCAN NOW to get all pair signals</div>
                <button className="pob" onClick={triggerAuto} style={{ padding:"10px 24px", background:"linear-gradient(135deg,#00aa44,#007733)", color:"#fff", borderRadius:8, fontSize:11, letterSpacing:1 }}>⚡ SCAN ALL 30 PAIRS</button>
              </div>
            )}

            {filtered.map((sig,i)=>{
              const pairInfo = ALL_PAIRS.find(p=>p.symbol===sig.symbol);
              const flag = pairInfo?.flag||"📊";
              const tvSym = pairInfo?.tv||"FX:EURUSD";
              return (
                <div key={sig.symbol} style={{ background:sbg(sig.signal), border:`2px solid ${sc(sig.signal)}44`, borderLeft:`5px solid ${sc(sig.signal)}`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, cursor:"pointer" }} onClick={()=>setExpanded(expanded===i?null:i)}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:18 }}>{flag}</span>
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
                    <div className="slide" style={{ marginTop:10 }}>
                      <TVChart tvSymbol={tvSym} dark={dark} />
                      <div style={{ marginTop:10 }}>
                        <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontWeight:700, marginBottom:8 }}>NEXT 3 CANDLES</div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                          {(sig.next3candles||[]).map(c=><CandleCard key={c.number} candle={c} dark={dark} />)}
                        </div>
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
