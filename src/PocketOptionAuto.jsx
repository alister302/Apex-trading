import { useState, useEffect, useRef, useCallback } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const TV_SYM = {"EUR/USD": "FX:EURUSD", "GBP/USD": "FX:GBPUSD", "USD/JPY": "FX:USDJPY", "USD/CHF": "FX:USDCHF", "USD/CAD": "FX:USDCAD", "AUD/USD": "FX:AUDUSD", "NZD/USD": "FX:NZDUSD", "EUR/GBP": "FX:EURGBP", "EUR/JPY": "FX:EURJPY", "GBP/JPY": "FX:GBPJPY", "XAU/USD": "TVC:GOLD", "EUR/CAD": "FX:EURCAD", "AUD/JPY": "FX:AUDJPY", "GBP/CAD": "FX:GBPCAD", "CAD/JPY": "FX:CADJPY"};
const TF_MAP = {"1min": "1", "5min": "5", "15min": "15", "30min": "30", "1h": "60"};
const PAIRS = [
  { symbol:"EUR/USD", flag:"🇪🇺" },
  { symbol:"GBP/USD", flag:"🇬🇧" },
  { symbol:"USD/JPY", flag:"🇯🇵" },
  { symbol:"USD/CHF", flag:"🇨🇭" },
  { symbol:"USD/CAD", flag:"🇨🇦" },
  { symbol:"AUD/USD", flag:"🇦🇺" },
  { symbol:"NZD/USD", flag:"🇳🇿" },
  { symbol:"EUR/GBP", flag:"🇪🇺" },
  { symbol:"EUR/JPY", flag:"🇪🇺" },
  { symbol:"GBP/JPY", flag:"🇬🇧" },
  { symbol:"XAU/USD", flag:"🥇" },
  { symbol:"EUR/CAD", flag:"🇪🇺" },
  { symbol:"AUD/JPY", flag:"🇦🇺" },
  { symbol:"GBP/CAD", flag:"🇬🇧" },
  { symbol:"CAD/JPY", flag:"🇨🇦" },
];

const TIMEFRAMES = [
  { label:"1M",  tf:"1min",  secs:60   },
  { label:"5M",  tf:"5min",  secs:300  },
  { label:"15M", tf:"15min", secs:900  },
  { label:"30M", tf:"30min", secs:1800 },
  { label:"1H",  tf:"1h",    secs:3600 },
];

const TIER_COLOR = {
  "ELITE ULTRA":"#ffd700",
  "STRONG":     "#00dd55",
  "MODERATE":   "#00aaff",
  "WEAK":       "#ffaa00",
  "WAIT":       "#445566",
};

function playAlert(tier) {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const b = (f,s,d,v=0.3) => {
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.value=f;o.type="sine";
      g.gain.setValueAtTime(v,ctx.currentTime+s);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+s+d);
      o.start(ctx.currentTime+s);o.stop(ctx.currentTime+s+d);
    };
    if (tier==="ELITE ULTRA"){ b(880,0,0.1,0.5);b(1100,0.15,0.1,0.5);b(1320,0.3,0.1,0.5);b(1760,0.45,0.2,0.5); }
    else if (tier==="STRONG"){ b(880,0,0.15);b(1100,0.2,0.15);b(1320,0.4,0.2); }
    else { b(660,0,0.1);b(880,0.15,0.15); }
  } catch(e){}
}

function ScoreBar({ bullPct, bearPct }) {
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:9, color:"#00dd55", fontFamily:"monospace" }}>BUY {bullPct}%</span>
        <span style={{ fontSize:9, color:"#ff2244", fontFamily:"monospace" }}>SELL {bearPct}%</span>
      </div>
      <div style={{ height:6, background:"#0a1520", borderRadius:3, overflow:"hidden", display:"flex" }}>
        <div style={{ width:`${bullPct}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)" }}/>
        <div style={{ width:`${bearPct}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)" }}/>
      </div>
    </div>
  );
}

function SignalCard({ result, dark, onClose }) {
  try {
  if (!result || !result.signal || result.signal==="WAIT") return null;
  if (!result.entry || !result.sl || !result.tp1) return null;
  const sc = result.signal==="BUY"?"#00dd55":"#ff2244";
  const tc = TIER_COLOR[result.tier]||"#00aaff";

  return (
    <div style={{ background:result.signal==="BUY"?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"),
      border:`3px solid ${sc}`, borderRadius:14, padding:"18px 16px", marginBottom:14, position:"relative" }}>
      <button onClick={onClose} style={{ position:"absolute",top:10,right:12,background:"none",border:"none",color:"#445566",cursor:"pointer",fontSize:20 }}>×</button>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{ display:"inline-block", background:tc+"22", border:`1px solid ${tc}44`,
          borderRadius:20, padding:"2px 14px", fontSize:9, color:tc, fontFamily:"monospace", fontWeight:700, marginBottom:8 }}>
          {result.tier==="ELITE ULTRA"?"💎 ELITE ULTRA":"⭐ "+result.tier}
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:44, fontWeight:900, color:sc, lineHeight:1 }}>
          {result.signal==="BUY"?"▲":"▼"}
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:28, fontWeight:900, color:sc }}>{result.signal}</div>
        <div style={{ fontSize:11, color:sc, fontFamily:"monospace", marginTop:4 }}>
          {confidence}% CONFIDENCE
        </div>
        <div style={{ fontSize:9, color:"#8899aa", fontFamily:"monospace", marginTop:2 }}>
          {result.symbol} · {result.timeframe} · {result.session}
        </div>
      </div>

      <ScoreBar bullPct={bullPct} bearPct={bearPct} />

      {/* AI Reasoning */}
      {result.reasoning && (
        <div style={{ background:dark?"#0a0520":"#f0e8ff", border:"1px solid #8844ff33",
          borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
          <div style={{ fontSize:8, color:"#8844ff", fontWeight:700, letterSpacing:1, marginBottom:5 }}>🤖 GROQ AI REASONING</div>
          <div style={{ fontSize:10, color:dark?"#c8d8e8":"#223344", lineHeight:1.7, fontFamily:"monospace" }}>{result.reasoning}</div>
          {result.market_context && (
            <div style={{ fontSize:9, color:"#8899aa", marginTop:5, fontStyle:"italic" }}>{result.market_context}</div>
          )}
        </div>
      )}

      {/* Key level + Entry quality */}
      {(result.key_level||result.entry_quality) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
          {result.key_level && (
            <div style={{ background:dark?"#0a1520":"#e8f4ff", borderRadius:6, padding:"8px 10px" }}>
              <div style={{ fontSize:8, color:"#445566" }}>KEY LEVEL</div>
              <div style={{ fontSize:11, color:"#ffd700", fontWeight:700, fontFamily:"monospace" }}>{result.key_level}</div>
            </div>
          )}
          {result.entry_quality && (
            <div style={{ background:dark?"#0a1520":"#e8f4ff", borderRadius:6, padding:"8px 10px" }}>
              <div style={{ fontSize:8, color:"#445566" }}>ENTRY QUALITY</div>
              <div style={{ fontSize:11, fontWeight:700,
                color:result.entry_quality==="EXCELLENT"?"#00dd55":result.entry_quality==="GOOD"?"#00aaff":"#ffaa00" }}>
                {result.entry_quality}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk warning */}
      {result.risk_warning && (
        <div style={{ background:"#1a1000", border:"1px solid #ffaa0033", borderRadius:6,
          padding:"8px 12px", marginBottom:12, fontSize:9, color:"#ffaa00", fontFamily:"monospace" }}>
          ⚠️ {result.risk_warning}
        </div>
      )}

      {/* Entry/Exit */}
      <div style={{ background:dark?"#0a1520":"rgba(0,0,0,0.05)", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {[
            ["🎯 ENTRY", entry.toFixed(5), "#4499ff"],
            ["🛑 STOP LOSS", sl.toFixed(5), "#ff2244"],
            ["✅ TP1", tp1.toFixed(5), "#00dd55"],
            ["✅✅ TP2", tp2.toFixed(5), "#00ff88"],
          ].map(([l,v,c])=>(
            <div key={l} style={{ background:dark?"#050a0f":"rgba(0,0,0,0.05)", borderRadius:5, padding:"6px 8px" }}>
              <div style={{ fontSize:8, color:"#445566", marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:11, color:c, fontFamily:"monospace", fontWeight:700 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, fontSize:9, color:"#ffaa00", fontFamily:"monospace" }}>
          ⚠️ Move SL to entry when TP1 is hit
        </div>
      </div>

      {/* Next 3 candles */}
      {result.next3candles && next3.length>0 && (
        <div>
          <div style={{ fontSize:9, color:"#8844ff", fontFamily:"monospace", fontWeight:700, letterSpacing:1, marginBottom:8 }}>
            🔮 NEXT 3 CANDLES
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            {next3.map((c,i)=>{
              const up=c.direction==="UP";
              const col=up?"#00dd55":"#ff2244";
              return (
                <div key={i} style={{ background:dark?"#0a1520":"#f0f8ff",
                  border:`1px solid ${col}44`, borderRadius:8, padding:"8px 6px",
                  textAlign:"center", borderTop:`3px solid ${col}` }}>
                  <div style={{ fontSize:8, color:"#445566", marginBottom:3 }}>C{i+1}</div>
                  <div style={{ fontSize:18, color:col }}>{up?"▲":"▼"}</div>
                  <div style={{ fontSize:11, color:col, fontWeight:700, fontFamily:"monospace" }}>{c.confidence}%</div>
                  <div style={{ fontSize:8, color:"#445566", marginTop:2 }}>{c.reason?.slice(0,20)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
  } catch(err) {
    return (
      <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:10, padding:16, marginBottom:14 }}>
        <div style={{ color:"#ff5577", fontSize:11, fontFamily:"monospace" }}>⚠ Signal display error: {err.message}</div>
        <pre style={{ color:"#445566", fontSize:9, marginTop:8, overflow:"auto" }}>{JSON.stringify(result, null, 2)}</pre>
      </div>
    );
  }
}

export default function PocketOptionAuto({ dark }) {
  const [mode, setMode] = useState("get");
  const [selectedPair, setSelectedPair] = useState(PAIRS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]); // 15M default
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [autoSignals, setAutoSignals] = useState({});
  const [autoLoading, setAutoLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningPair, setScanningPair] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);
  const autoRef = useRef(null);

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
  };

  const sc = s=>s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";

  const getSignal = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${SERVER}/po/ai/signal`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ symbol:selectedPair.symbol, tf:timeframe.tf }),
        signal: AbortSignal.timeout(60000),
      });
      const ct = res.headers.get("content-type")||"";
      if (!ct.includes("json")) { setError("Server starting up — wait 30s and retry"); setLoading(false); return; }
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
      if (soundOn && data.signal!=="WAIT") playAlert(data.tier);
      setHistory(h=>[{...data, time:new Date().toLocaleTimeString()},...h].slice(0,20));
    } catch(e) {
      setError(e.name==="AbortError"?"AI thinking timeout — retry":e.message);
    }
    setLoading(false);
  };

  const runAutoScan = async () => {
    setAutoLoading(true);
    const results = {};
    for (let i=0; i<PAIRS.length; i++) {
      const pair = PAIRS[i];
      setScanningPair(pair.symbol);
      setScanProgress(Math.round((i/PAIRS.length)*100));
      try {
        const res = await fetch(`${SERVER}/po/ai/signal`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ symbol:pair.symbol, tf:timeframe.tf }),
          signal: AbortSignal.timeout(60000),
        });
        const data = await res.json();
        if (!data.error) {
          results[pair.symbol] = data;
          if (soundOn && (data.signal==="BUY"||data.signal==="SELL") && data.confidence>=80) playAlert(data.tier);
        }
      } catch(e) {}
      await new Promise(r=>setTimeout(r,2000)); // 2s between calls
    }
    setScanProgress(100); setScanningPair("");
    setAutoSignals(results);
    setAutoLoading(false);
  };

  useEffect(()=>{
    clearInterval(intervalRef.current);
    if (mode==="auto"&&running) {
      runAutoScan();
      intervalRef.current = setInterval(runAutoScan, 300000); // every 5 min
    }
    return ()=>clearInterval(intervalRef.current);
  }, [running, mode, timeframe]);

  const strongSigs = Object.values(autoSignals)
    .filter(s=>(s.signal==="BUY"||s.signal==="SELL")&&s.confidence>=70)
    .sort((a,b)=>b.confidence-a.confidence);
  const filtered = filter==="ALL"?strongSigs:strongSigs.filter(s=>s.signal===filter);

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .pspin{animation:spin 1s linear infinite;display:inline-block}
        .pbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .pbtn:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}
        .pbtn:disabled{opacity:0.4;cursor:not-allowed}
        .pchip{cursor:pointer;transition:all 0.12s;user-select:none}
        .pchip:hover{transform:scale(1.04)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #00dd5544", borderRadius:12,
          padding:"12px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900,
              color:dark?"#fff":"#001133", letterSpacing:2, marginBottom:2 }}>
              🟢 OLYMP SIGNALS
            </div>
            <div style={{ fontSize:9, color:t.dim }}>GROQ AI · READS MARKET · BUY/SELL · FOREX</div>
          </div>
          <button className="pbtn" onClick={()=>setSoundOn(!soundOn)}
            style={{ background:soundOn?"#ffd70022":"transparent", border:`1px solid ${soundOn?"#ffd70044":t.border}`,
              color:soundOn?"#ffd700":t.muted, padding:"5px 8px", borderRadius:5, fontSize:12 }}>
            {soundOn?"🔔":"🔕"}
          </button>
        </div>

        {/* Mode switcher */}
        <div style={{ display:"flex", gap:6, marginBottom:12, background:t.bgCard,
          borderRadius:10, padding:5, border:`1px solid ${t.border}` }}>
          <button className="pbtn" onClick={()=>setMode("get")}
            style={{ flex:1, padding:"11px", background:mode==="get"?"linear-gradient(135deg,#00aa44,#007733)":"transparent",
              color:mode==="get"?"#fff":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            ⚡ GET SIGNAL
          </button>
          <button className="pbtn" onClick={()=>setMode("auto")}
            style={{ flex:1, padding:"11px", background:mode==="auto"?"linear-gradient(135deg,#ffd700,#cc9900)":"transparent",
              color:mode==="auto"?"#000":t.muted, borderRadius:7, fontSize:11, letterSpacing:1 }}>
            🔄 AUTO SCAN
          </button>
        </div>

        {/* Timeframe */}
        <div style={{ display:"flex", gap:5, marginBottom:12 }}>
          {TIMEFRAMES.map(tf=>(
            <button key={tf.tf} className="pbtn" onClick={()=>setTimeframe(tf)}
              style={{ flex:1, padding:"8px", background:timeframe.tf===tf.tf?"#0066ff":"transparent",
                border:`1px solid ${timeframe.tf===tf.tf?"#0066ff":t.border}`,
                color:timeframe.tf===tf.tf?"#fff":t.muted, borderRadius:6, fontSize:10 }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* ===== GET SIGNAL ===== */}
        {mode==="get" && (
          <div>

            {/* TradingView Chart */}
            <div style={{ borderRadius:8, overflow:"hidden", marginBottom:12, border:`1px solid ${t.border}` }}>
              <div style={{ padding:"5px 10px", background:dark?"#0a1520":"#e8f4ff", fontSize:9, color:"#4499ff", fontFamily:"monospace", fontWeight:700 }}>
                📊 {selectedPair.symbol} · {timeframe.label}
              </div>
              <iframe
                key={selectedPair.symbol + timeframe.tf}
                src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TV_SYM[selectedPair.symbol]||"FX:EURUSD")}&interval=${TF_MAP[timeframe.tf]||"15"}&theme=${dark?"dark":"light"}&style=1&locale=en&hide_top_toolbar=1&hide_legend=1&hide_side_toolbar=1&save_image=false`}
                style={{ width:"100%", height:250, border:"none", display:"block" }}
                title={selectedPair.symbol}
                loading="lazy"
              />
            </div>

            {/* Pair selector */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12,
              padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontSize:8, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:8 }}>SELECT PAIR</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {PAIRS.map(p=>(
                  <div key={p.symbol} className="pchip"
                    onClick={()=>{ setSelectedPair(p); setResult(null); setError(""); }}
                    style={{ padding:"5px 10px",
                      background:selectedPair.symbol===p.symbol?(dark?"#00aa4422":"#e8fff3"):"transparent",
                      border:`2px solid ${selectedPair.symbol===p.symbol?"#00dd55":t.border}`,
                      color:selectedPair.symbol===p.symbol?"#00dd55":t.muted,
                      borderRadius:6, fontSize:9, fontWeight:700 }}>
                    {p.flag} {p.symbol}
                  </div>
                ))}
              </div>
            </div>

            {error && (
             <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433",
                borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
                <button onClick={()=>setError("")} className="pbtn" style={{ background:"none", color:"#ff5577", fontSize:18, padding:0 }}>×</button>
              </div>
            )}

            <button className="pbtn" onClick={getSignal} disabled={loading}
              style={{ width:"100%", padding:"16px",
                background:loading?(dark?"#0a1520":"#e8f0f8"):"linear-gradient(135deg,#00aa44,#007733)",
                color:loading?t.muted:"#fff", borderRadius:10, fontSize:13, letterSpacing:2, marginBottom:6 }}>
              {loading
                ? <><span className="pspin">⟳</span> GROQ AI THINKING...</>
                : `🤖 GET AI SIGNAL — ${selectedPair.flag} ${selectedPair.symbol}`}
            </button>
            <div style={{ fontSize:9, color:t.dim, textAlign:"center", marginBottom:14 }}>
              AI reads candles · thinks like a trader · {timeframe.label} timeframe
            </div>

            <SignalCard result={result} dark={dark} onClose={()=>setResult(null)} />

            {/* History */}
            {history.length>0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px", marginTop:14 }}>
                <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:10 }}>📋 HISTORY ({history.length})</div>
                {history.map((h,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"6px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                    <div>
                      <span style={{ fontSize:10, color:dark?"#fff":"#001133", fontWeight:700 }}>{h.symbol}</span>
                      <span style={{ fontSize:8, color:t.dim, marginLeft:6 }}>{h.time} · {h.timeframe}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:9, color:t.dim }}>{h.confidence}%</span>
                      <span style={{ fontSize:10, color:sc(h.signal), fontWeight:900 }}>
                        {h.signal==="BUY"?"▲":h.signal==="SELL"?"▼":"⟳"} {h.signal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== AUTO SCAN ===== */}
        {mode==="auto" && (
          <div>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10,
              padding:"12px 14px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:9, color:t.dim }}>AI scans {PAIRS.length} pairs · 2s between each</div>
                <div style={{ display:"flex", gap:6 }}>
                  <button className="pbtn" onClick={runAutoScan} disabled={autoLoading}
                    style={{ background:"#ffd70022", border:"1px solid #ffd70044", color:"#ffd700", padding:"6px 12px", borderRadius:6, fontSize:9 }}>
                    🔄 SCAN NOW
                  </button>
                  {running
                    ? <button className="pbtn" onClick={()=>setRunning(false)}
                        style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>⏹ STOP</button>
                    : <button className="pbtn" onClick={()=>setRunning(true)}
                        style={{ background:"#00dd5522", border:"1px solid #00dd5533", color:"#00dd55", padding:"6px 12px", borderRadius:6, fontSize:9 }}>▶ AUTO</button>
                  }
                </div>
              </div>

              {autoLoading && (
                <div style={{ marginTop:10 }}>
                  <div style={{ fontSize:9, color:"#4499ff", marginBottom:4 }}>
                    <span className="pspin">⟳</span> AI analyzing {scanningPair}... {scanProgress}%
                  </div>
                  <div style={{ height:4, background:dark?"#0a1520":"#e0eaf4", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ width:`${scanProgress}%`, height:"100%", background:"linear-gradient(90deg,#00aa44,#00dd55)", transition:"width 0.5s" }}/>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                {l:"SCANNED",v:Object.keys(autoSignals).length,c:dark?"#c8d8e8":"#1a2a3a"},
                {l:"SIGNALS",v:strongSigs.length,c:"#ffd700"},
                {l:"BUY",v:strongSigs.filter(s=>s.signal==="BUY").length,c:"#00dd55"},
                {l:"SELL",v:strongSigs.filter(s=>s.signal==="SELL").length,c:"#ff2244"},
              ].map(({l,v,c})=>(
                <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:7, letterSpacing:1, color:t.dim, marginBottom:3 }}>{l}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Top signal */}
            {strongSigs.length>0 && (
              <div style={{ background:strongSigs[0].signal==="BUY"?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"),
                border:`3px solid ${sc(strongSigs[0].signal)}`, borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ fontSize:9, color:sc(strongSigs[0].signal), fontWeight:700, letterSpacing:2, marginBottom:4 }}>🏆 TOP AI SIGNAL</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:dark?"#fff":"#001133" }}>
                      {strongSigs[0].symbol}
                    </div>
                    <div style={{ fontSize:9, color:t.muted }}>{strongSigs[0].tier} · {strongSigs[0].timeframe}</div>
                    {strongSigs[0].reasoning && (
                      <div style={{ fontSize:9, color:t.dim, marginTop:4, maxWidth:200 }}>{strongSigs[0].reasoning?.slice(0,80)}...</div>
                    )}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:28, fontWeight:900, color:sc(strongSigs[0].signal) }}>
                      {strongSigs[0].signal==="BUY"?"▲":"▼"} {strongSigs[0].signal}
                    </div>
                    <div style={{ fontSize:11, color:sc(strongSigs[0].signal) }}>{strongSigs[0].confidence}%</div>
                  </div>
                </div>
              </div>
            )}

            {strongSigs.length===0 && !autoLoading && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:24, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>🤖</div>
                <div style={{ fontSize:11, color:t.muted, marginBottom:14 }}>No strong signals yet — tap SCAN NOW</div>
                <button className="pbtn" onClick={runAutoScan}
                  style={{ padding:"10px 24px", background:"linear-gradient(135deg,#ffd700,#cc9900)", color:"#000", borderRadius:8, fontSize:11 }}>
                  🔄 START AI SCAN
                </button>
              </div>
            )}

            {/* Filter */}
            <div style={{ display:"flex", gap:5, marginBottom:12 }}>
              {["ALL","BUY","SELL"].map(f=>(
                <button key={f} className="pbtn" onClick={()=>setFilter(f)}
                  style={{ padding:"5px 14px", background:filter===f?"#ffd700":"transparent",
                    border:`1px solid ${filter===f?"#ffd700":t.border}`,
                    color:filter===f?"#000":t.muted, borderRadius:5, fontSize:9 }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Signal cards */}
            {filtered.map((sig,i)=>(
              <div key={sig.symbol} style={{ background:sig.signal==="BUY"?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"),
                border:`2px solid ${sc(sig.signal)}44`, borderLeft:`5px solid ${sc(sig.signal)}`,
                borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div>
                    <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133" }}>{sig.symbol}</span>
                    <span style={{ fontSize:8, color:t.dim, marginLeft:6, background:dark?"#0a1520":"#e0eaf4", padding:"1px 5px", borderRadius:3 }}>{sig.timeframe}</span>
                    <div style={{ fontSize:9, color:t.dim, marginTop:2 }}>{sig.tier} · {sig.session}</div>
                    {sig.reasoning && <div style={{ fontSize:9, color:t.dim, marginTop:2 }}>{sig.reasoning?.slice(0,60)}...</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:sc(sig.signal) }}>
                      {sig.signal==="BUY"?"▲":"▼"} {sig.signal}
                    </div>
                    <div style={{ fontSize:10, color:sc(sig.signal) }}>{sig.confidence}%</div>
                  </div>
                </div>
                <ScoreBar bullPct={sig.bullPct||50} bearPct={sig.bearPct||50} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
