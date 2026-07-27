import { useState, useEffect, useRef, useCallback } from "react";

const SERVER = "https://princex-ip.vercel.app";
const WS_URL  = "wss://ws.derivws.com/websockets/v3?app_id=1089";

// Will be populated from active_symbols
const DEFAULT_PAIRS = [
  { symbol:"R_50",    name:"Volatility 50",   short:"V50"   },
  { symbol:"R_75",    name:"Volatility 75",   short:"V75"   },
  { symbol:"R_100",   name:"Volatility 100",  short:"V100"  },
  { symbol:"R_10",    name:"Volatility 10",   short:"V10"   },
  { symbol:"R_25",    name:"Volatility 25",   short:"V25"   },
  { symbol:"1HZ50V",  name:"Vol 50 (1s)",     short:"V50s"  },
  { symbol:"1HZ75V",  name:"Vol 75 (1s)",     short:"V75s"  },
  { symbol:"1HZ100V", name:"Vol 100 (1s)",    short:"V100s" },
  { symbol:"1HZ10V",  name:"Vol 10 (1s)",     short:"V10s"  },
  { symbol:"1HZ25V",  name:"Vol 25 (1s)",     short:"V25s"  },
];

const TIMEFRAMES = [
  { label:"1M",  value:60    },
  { label:"5M",  value:300   },
  { label:"15M", value:900   },
  { label:"30M", value:1800  },
  { label:"1H",  value:3600  },
];

function playAlert(signal) {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const b = (f,s,d) => {
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.value=f;o.type="sine";
      g.gain.setValueAtTime(0.3,ctx.currentTime+s);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+s+d);
      o.start(ctx.currentTime+s);o.stop(ctx.currentTime+s+d);
    };
    if(signal==="RISE"){b(880,0,0.15);b(1100,0.2,0.15);b(1320,0.4,0.2);}
    else{b(880,0,0.15);b(660,0.2,0.15);b(440,0.4,0.2);}
  }catch(e){}
}

function DerivChart({ candles, dark, pair, tf }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastX = useRef(0);

  if (!candles||candles.length<3) return (
    <div style={{ height:260, background:"#0a0a0a", borderRadius:8,
      display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:24 }}>📊</div>
      <div style={{ fontSize:11, color:"#4499ff", fontFamily:"monospace" }}>
        Loading chart... ({candles?.length||0} candles)
      </div>
    </div>
  );

  const H=260, AXIS_W=65, PB=20, PT=10;
  const chartH=H-PB-PT;
  const display=[...candles].slice(0,80).reverse();
  const cw=Math.max(4,10*zoom);
  const CANDLE_W=Math.max(540, display.length*(cw+1)+20);
  const maxP=Math.max(...display.map(c=>c.high));
  const minP=Math.min(...display.map(c=>c.low));
  const pad=(maxP-minP)*0.06;
  const hi=maxP+pad, lo=minP-pad, range=hi-lo||0.0001;
  const toY=p=>PT+((hi-p)/range)*chartH;
  const toX=i=>i*(cw+1)+cw/2;
  const current=candles[0]?.close;
  const priceUp=(candles[0]?.close||0)>=(candles[1]?.close||0);
  const priceColor=priceUp?"#00cc88":"#ff2244";
  const dec=2;

  const rawStep=range/5, mag=Math.pow(10,Math.floor(Math.log10(rawStep||0.001)));
  const niceStep=Math.ceil(rawStep/mag)*mag;
  const firstGrid=Math.ceil(lo/niceStep)*niceStep;
  const hGrids=[];
  for(let p=firstGrid;p<=hi;p+=niceStep) hGrids.push(parseFloat(p.toFixed(dec)));

  const onWheel=e=>{e.stopPropagation();e.preventDefault();setZoom(z=>Math.max(0.3,Math.min(6,z+(e.deltaY<0?0.2:-0.2))));};
  const onMD=e=>{dragging.current=true;lastX.current=e.clientX;};
  const onMM=e=>{if(!dragging.current)return;if(containerRef.current)containerRef.current.scrollLeft+=lastX.current-e.clientX;lastX.current=e.clientX;};
  const onMU=()=>{dragging.current=false;};
  const onTS=e=>{lastX.current=e.touches[0].clientX;};
  const onTM=e=>{e.stopPropagation();if(containerRef.current)containerRef.current.scrollLeft+=lastX.current-e.touches[0].clientX;lastX.current=e.touches[0].clientX;};

  return (
    <div style={{ borderRadius:8, overflow:"hidden", border:"1px solid #1e3040", marginBottom:12 }}>
      <div style={{ padding:"5px 10px", background:"#0a1520", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:9, color:"#4499ff", fontFamily:"monospace", fontWeight:700 }}>📊 {pair} · {tf}</span>
        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
          <span style={{ fontSize:9, color:priceColor, fontFamily:"monospace", fontWeight:700 }}>{priceUp?"▲":"▼"} {current?.toFixed(dec)}</span>
          {[["−",()=>setZoom(z=>Math.max(0.3,z-0.3))],["+",()=>setZoom(z=>Math.min(6,z+0.3))],["↺",()=>setZoom(1)]].map(([l,f])=>(
            <button key={l} onClick={f} style={{ background:"#0066ff22",border:"1px solid #0066ff44",color:"#4499ff",fontSize:11,padding:"1px 7px",borderRadius:4,cursor:"pointer",fontFamily:"monospace",fontWeight:700 }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", background:"#0a0a0a" }}>
        <div ref={containerRef} onWheel={onWheel}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
          onTouchStart={onTS} onTouchMove={onTM}
          style={{ flex:1, overflowX:"auto", overflowY:"hidden", cursor:"grab", touchAction:"pan-x" }}>
          <svg width={CANDLE_W} height={H} style={{ display:"block" }}>
            <rect width={CANDLE_W} height={H} fill="#0a0a0a"/>
            {hGrids.map((p,i)=>(
              <line key={i} x1={0} y1={toY(p)} x2={CANDLE_W} y2={toY(p)} stroke="#1e3040" strokeWidth="0.5" strokeDasharray="4,4"/>
            ))}
            {current&&<line x1={0} y1={toY(current)} x2={CANDLE_W} y2={toY(current)} stroke="#33445566" strokeWidth="1" strokeDasharray="4,4"/>}
            {display.map((c,i)=>{
              const bull=c.close>=c.open,col=bull?"#00dd55":"#ff2244";
              const x=toX(i),bTop=Math.min(toY(c.open),toY(c.close));
              const bH=Math.max(1.5,Math.abs(toY(c.close)-toY(c.open)));
              return(<g key={i}><line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={col} strokeWidth="1"/><rect x={x-cw/2} y={bTop} width={cw} height={bH} fill={col}/></g>);
            })}
          </svg>
        </div>
        <svg width={AXIS_W} height={H} style={{ display:"block", flexShrink:0, background:"#0a0a0a" }}>
          <line x1={0} y1={PT} x2={0} y2={H-PB} stroke="#1e3040" strokeWidth="1"/>
          {hGrids.map((p,i)=>(
            <text key={i} x={5} y={toY(p)+3} fontSize="7" fill="#445566" fontFamily="monospace">{p.toFixed(dec)}</text>
          ))}
          {current&&(
            <g>
              <rect x={1} y={toY(current)-8} width={AXIS_W-2} height={16} fill={priceColor} rx="3"/>
              <text x={AXIS_W/2} y={toY(current)+4} fontSize="7.5" fill="#fff" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{current.toFixed(dec)}</text>
            </g>
          )}
        </svg>
      </div>
      <div style={{ padding:"3px 10px", fontSize:8, color:"#334455", fontFamily:"monospace", display:"flex", justifyContent:"space-between", background:"#050a0f" }}>
        <span>drag · scroll to zoom</span>
        <span>{display.length} candles · {tf}</span>
      </div>
    </div>
  );
}

export default function DerivSignals({ dark }) {
  const [pairs, setPairs]           = useState(DEFAULT_PAIRS);
  const [selectedPair, setSelectedPair] = useState(DEFAULT_PAIRS[0]);
  const [timeframe, setTimeframe]   = useState(TIMEFRAMES[0]);
  const [candles, setCandles]       = useState([]);
  const [livePrice, setLivePrice]   = useState(null);
  const [analysis, setAnalysis]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [wsStatus, setWsStatus]     = useState("disconnected");
  const [soundOn, setSoundOn]       = useState(true);
  const [autoScan, setAutoScan]     = useState(false);
  const wsRef      = useRef(null);
  const candlesRef = useRef([]);
  const autoRef    = useRef(null);
  const priceTimer = useRef(null);
  const pendingSym = useRef(null);

  const t = { bg:"#0a0a0a", bgCard:"#0d0d0d", border:"#1e3040", muted:"#445566", dim:"#334455" };
  const sc = s=>s==="RISE"?"#00dd55":s==="FALL"?"#ff2244":"#ffaa00";

  const requestCandles = (ws, symbol, granularity) => {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({
      ticks_history: symbol,
      count: 100,
      end: "latest",
      granularity: granularity,
      style: "candles",
      subscribe: 1,
    }));
    ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
  };

  const connectWS = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    setWsStatus("connecting");
    setError("");
    setCandles([]);
    candlesRef.current = [];
    setLivePrice(null);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      setError("");
      requestCandles(ws, selectedPair.symbol, timeframe.value);
    };

    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);



      if (d.msg_type === "tick") {
        clearTimeout(priceTimer.current);
        priceTimer.current = setTimeout(() => setLivePrice(d.tick?.quote), 300);
      }
      // Also update live price from candle updates
      if (d.msg_type === "ohlc" && d.ohlc) {
        setLivePrice(parseFloat(d.ohlc.close));
      }

      if (d.msg_type === "candles") {
        const c = (d.candles || []).map(k => ({
          open:  parseFloat(k.open),
          high:  parseFloat(k.high),
          low:   parseFloat(k.low),
          close: parseFloat(k.close),
          time:  k.epoch,
        })).reverse();
        candlesRef.current = c;
        setCandles([...c]);
      }

      if (d.msg_type === "ohlc" && d.ohlc && candlesRef.current.length > 0) {
        const o = d.ohlc;
        const u = [...candlesRef.current];
        u[0] = {
          ...u[0],
          close: parseFloat(o.close),
          high:  Math.max(u[0].high, parseFloat(o.high)),
          low:   Math.min(u[0].low,  parseFloat(o.low)),
        };
        candlesRef.current = u;
        setCandles([...u]);
      }

      if (d.error) {
        if (d.error.code === "InvalidSymbol") {
          // Symbol invalid - try next valid one
          const validFallbacks = ["R_50","R_75","R_100","1HZ50V","1HZ75V"];
          const current = selectedPair.symbol;
          const next = validFallbacks.find(s => s !== current);
          if (next && wsRef.current?.readyState === 1) {
            setError("Auto-switching to " + next);
            requestCandles(wsRef.current, next, timeframe.value);
          }
        } else {
          setError(d.error.message || "Deriv error");
        }
      }
    };

    ws.onerror = () => {
      setWsStatus("error");
      setError("WebSocket failed — tap RECONNECT");
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
    };
  }, [selectedPair, timeframe]);

  // Reconnect when pair or timeframe changes
  useEffect(() => {
    connectWS();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      clearTimeout(priceTimer.current);
    };
  }, [selectedPair.symbol, timeframe.value]);

  // Auto scan
  useEffect(() => {
    clearInterval(autoRef.current);
    if (autoScan) {
      autoRef.current = setInterval(() => {
        if (candlesRef.current.length >= 10) getSignal();
      }, 60000);
    }
    return () => clearInterval(autoRef.current);
  }, [autoScan]);

  const getSignal = async () => {
    if (candlesRef.current.length < 10) { setError("Not enough candles yet"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SERVER}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candles: candlesRef.current,
          symbol: selectedPair.symbol,
          tf: timeframe.label,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setAnalysis(data);
      if (data.signal !== "WAIT" && soundOn) playAlert(data.signal);
    } catch(e) {
      setError(e.name === "AbortError" ? "Timeout — retry" : e.message);
    }
    setLoading(false);
  };

  const sig  = analysis?.signal;
  const conf = analysis?.confidence || 0;
  const tier = analysis?.tier || "WAIT";
  const preds = Array.isArray(analysis?.next5candles) ? analysis.next5candles : [];

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .dspin{animation:spin 1s linear infinite;display:inline-block}
        .dblink{animation:blink 1s infinite}
        .dbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .dbtn:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}
        .dbtn:disabled{opacity:0.4;cursor:not-allowed}
        .dchip{cursor:pointer;transition:all 0.12s;user-select:none}
        .dchip:hover{transform:scale(1.04)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #8844ff44", borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:"#fff", letterSpacing:2, marginBottom:2 }}>
                🤖 PRINCEX IQ AI SIGNALS
              </div>
              <div style={{ fontSize:9, color:t.muted }}>PATTERN ENGINE · ALL CANDLE TYPES · 5 CANDLE PREDICTION</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div className={wsStatus==="connected"?"dblink":""} style={{ width:8, height:8, borderRadius:"50%",
                background:wsStatus==="connected"?"#00dd55":wsStatus==="connecting"?"#ffaa00":"#ff4466" }}/>
              <span style={{ fontSize:8, color:wsStatus==="connected"?"#00dd55":wsStatus==="connecting"?"#ffaa00":"#ff4466", fontWeight:700 }}>
                {wsStatus.toUpperCase()}
              </span>
              <button className="dbtn" onClick={()=>setSoundOn(!soundOn)}
                style={{ background:soundOn?"#ffd70022":"transparent", border:`1px solid ${soundOn?"#ffd70044":t.border}`,
                  color:soundOn?"#ffd700":t.muted, padding:"5px 8px", borderRadius:5, fontSize:12 }}>
                {soundOn?"🔔":"🔕"}
              </button>
            </div>
          </div>
        </div>

        {/* Pair selector */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:8, letterSpacing:2, color:"#8844ff", fontWeight:700, marginBottom:8 }}>
            📊 SELECT PAIR {wsStatus==="connected"&&<span style={{ color:"#00dd55", fontSize:7 }}>· {pairs.length} available</span>}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {pairs.map(p=>(
              <div key={p.symbol} className="dchip"
                onClick={()=>{ setSelectedPair(p); setAnalysis(null); setError(""); }}
                style={{ padding:"6px 12px",
                  background:selectedPair.symbol===p.symbol?"#8844ff":"transparent",
                  border:`2px solid ${selectedPair.symbol===p.symbol?"#8844ff":t.border}`,
                  color:selectedPair.symbol===p.symbol?"#fff":t.muted,
                  borderRadius:6, fontSize:9, fontWeight:700 }}>
                {p.short||p.symbol}
              </div>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div style={{ display:"flex", gap:5, marginBottom:12 }}>
          {TIMEFRAMES.map(tf=>(
            <button key={tf.value} className="dbtn"
              onClick={()=>{ setTimeframe(tf); setAnalysis(null); }}
              style={{ flex:1, padding:"8px",
                background:timeframe.value===tf.value?"#8844ff":"transparent",
                border:`1px solid ${timeframe.value===tf.value?"#8844ff":t.border}`,
                color:timeframe.value===tf.value?"#fff":t.muted, borderRadius:6, fontSize:10 }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Live price */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10,
          padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:9, color:t.muted }}>{selectedPair.name}</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:"#fff" }}>
              {livePrice?.toFixed(2) || "---"}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:t.muted }}>Candles</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#8844ff" }}>
              {candles.length}
            </div>
          </div>
        </div>

        {/* Chart */}
        <DerivChart candles={candles} dark={dark} pair={selectedPair.symbol} tf={timeframe.label}/>

        {/* Error */}
        {error && (
          <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:8,
            padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} className="dbtn"
              style={{ background:"none", color:"#ff5577", fontSize:18, padding:0 }}>×</button>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8, marginBottom:14 }}>
          <button className="dbtn" onClick={getSignal} disabled={loading||candles.length<10}
            style={{ padding:"16px", background:"linear-gradient(135deg,#8844ff,#6622dd)",
              color:"#fff", borderRadius:10, fontSize:13, letterSpacing:2 }}>
            {loading ? <><span className="dspin">⟳</span> ANALYZING...</> : "🤖 GET AI SIGNAL"}
          </button>
          <button className="dbtn" onClick={()=>setAutoScan(!autoScan)}
            style={{ padding:"14px", background:autoScan?"#ff224422":"#0066ff22",
              border:`1px solid ${autoScan?"#ff224444":"#0066ff44"}`,
              color:autoScan?"#ff4466":"#4499ff", borderRadius:10, fontSize:11 }}>
            {autoScan?"⏹ STOP":"🔄 AUTO"}
          </button>
          <button className="dbtn" onClick={connectWS}
            style={{ padding:"14px", background:"transparent", border:`1px solid ${t.border}`,
              color:t.muted, borderRadius:10, fontSize:11 }}>
            ⟳ RECONNECT
          </button>
        </div>

        {/* Signal Result */}
        {analysis && sig !== "WAIT" && (
          <div style={{ background:sig==="RISE"?"#001a0d":"#1a0005",
            border:`3px solid ${sc(sig)}`, borderRadius:14, padding:"18px 16px", marginBottom:14 }}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:10, color:sc(sig), fontFamily:"monospace", fontWeight:700, letterSpacing:2 }}>
                {tier==="ELITE ULTRA"?"💎 ELITE ULTRA":tier==="STRONG"?"⭐⭐⭐ STRONG":tier==="MODERATE"?"⭐⭐ MODERATE":"⭐ "+tier}
              </div>
              <button onClick={()=>setAnalysis(null)}
                style={{ background:"none", border:"none", color:"#445566", cursor:"pointer", fontSize:20 }}>×</button>
            </div>

            <div style={{ textAlign:"center", marginBottom:14 }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:52, fontWeight:900, color:sc(sig), lineHeight:1 }}>
                {sig==="RISE"?"▲":"▼"}
              </div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:28, fontWeight:900, color:sc(sig) }}>{sig}</div>
              <div style={{ fontSize:14, color:sc(sig), fontFamily:"monospace", marginTop:4 }}>{conf}% CONFIDENCE</div>
              <div style={{ fontSize:9, color:"#445566", marginTop:4 }}>{tier} · {selectedPair.name} · {timeframe.label}</div>
            </div>

            {/* Score bar */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:9, color:"#00dd55", fontFamily:"monospace" }}>RISE {analysis.bullPct||conf}%</span>
                <span style={{ fontSize:9, color:"#ff2244", fontFamily:"monospace" }}>FALL {analysis.bearPct||(100-conf)}%</span>
              </div>
              <div style={{ height:8, background:"#0a1520", borderRadius:4, overflow:"hidden", display:"flex" }}>
                <div style={{ width:`${analysis.bullPct||conf}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)" }}/>
                <div style={{ width:`${analysis.bearPct||(100-conf)}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)" }}/>
              </div>
            </div>

            {/* AI Reasoning */}
            {analysis.reasoning && (
              <div style={{ background:"#0a0520", border:"1px solid #8844ff33", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
                <div style={{ fontSize:8, color:"#8844ff", fontWeight:700, letterSpacing:1, marginBottom:5 }}>🤖 ANALYSIS</div>
                <div style={{ fontSize:10, color:"#c8d8e8", lineHeight:1.7, fontFamily:"monospace" }}>{String(analysis.reasoning)}</div>
              </div>
            )}

            {/* Detected patterns */}
            {Array.isArray(analysis.patterns_detected) && analysis.patterns_detected.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:"#ffd700", fontWeight:700, letterSpacing:1, marginBottom:6 }}>🕯️ DETECTED PATTERNS</div>
                {analysis.patterns_detected.map((p,i)=>(
                  <div key={i} style={{ fontSize:9, fontFamily:"monospace", padding:"3px 0",
                    borderBottom:"1px solid #1e304022",
                    color: p.includes("BULL")||p.includes("HAMMER")||p.includes("MORNING")||p.includes("WHITE")?"#00dd55":
                           p.includes("BEAR")||p.includes("STAR")||p.includes("EVENING")||p.includes("CROW")?"#ff2244":"#ffaa00" }}>
                    🕯 {p}
                  </div>
                ))}
              </div>
            )}

            {/* Entry/Exit */}
            <div style={{ background:"#0a1520", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  ["🎯 ENTRY",    analysis.entry,  "#4499ff"],
                  ["🛑 STOP",     analysis.sl,     "#ff2244"],
                  ["✅ TP1",      analysis.tp1,    "#00dd55"],
                  ["✅✅ TP2",    analysis.tp2,    "#00ff88"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ background:"#050a0f", borderRadius:5, padding:"6px 8px" }}>
                    <div style={{ fontSize:8, color:"#445566", marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:11, color:c, fontFamily:"monospace", fontWeight:700 }}>{String(v||"N/A")}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:8, fontSize:9, color:"#ffaa00", fontFamily:"monospace" }}>
                ⏱ Expiry: {String(analysis.min_expiry_min||2)}-{String(analysis.max_expiry_min||10)} min
                · Best: {String(analysis.best_expiry_candles||3)} candles
              </div>
            </div>

            {/* Risk warning */}
            {analysis.risk_warning && (
              <div style={{ background:"#1a1000", border:"1px solid #ffaa0033", borderRadius:6,
                padding:"8px 12px", marginBottom:12, fontSize:9, color:"#ffaa00", fontFamily:"monospace" }}>
                ⚠️ {String(analysis.risk_warning)}
              </div>
            )}

            {/* Next 5 candles */}
            {preds.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:"#8844ff", fontWeight:700, letterSpacing:1, marginBottom:8 }}>🔮 NEXT 5 CANDLES</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4 }}>
                  {preds.map((c,i)=>(
                    <div key={i} style={{ background:"#0a1520", borderRadius:6, padding:"6px 4px", textAlign:"center",
                      borderTop:`3px solid ${c.direction==="UP"?"#00dd55":"#ff2244"}` }}>
                      <div style={{ fontSize:7, color:"#445566" }}>C{i+1}</div>
                      <div style={{ fontSize:18, color:c.direction==="UP"?"#00dd55":"#ff2244" }}>
                        {c.direction==="UP"?"▲":"▼"}
                      </div>
                      <div style={{ fontSize:10, color:c.direction==="UP"?"#00dd55":"#ff2244", fontWeight:700 }}>
                        {c.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close button */}
            <button onClick={()=>setAnalysis(null)} className="dbtn"
              style={{ width:"100%", padding:"10px", background:"transparent",
                border:"1px solid #445566", color:"#445566", borderRadius:8, fontSize:11 }}>
              CLOSE
            </button>
          </div>
        )}

        {/* WAIT */}
        {analysis && sig === "WAIT" && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:18, textAlign:"center", marginBottom:14 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, color:"#445566", marginBottom:4 }}>WAIT</div>
            <div style={{ fontSize:11, color:t.muted }}>{String(analysis.reasoning||"No clear setup — wait for confluence")}</div>
            <button onClick={()=>setAnalysis(null)} className="dbtn"
              style={{ marginTop:10, padding:"8px 20px", background:"transparent",
                border:"1px solid #445566", color:"#445566", borderRadius:6, fontSize:10 }}>
              CLOSE
            </button>
          </div>
        )}

        {/* No analysis yet */}
        {!analysis && !loading && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:20, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🤖</div>
            <div style={{ fontSize:11, color:t.muted, marginBottom:4 }}>Pattern Engine — No AI needed</div>
            <div style={{ fontSize:10, color:t.dim }}>
              {candles.length >= 10
                ? "✅ Ready — tap GET AI SIGNAL"
                : wsStatus === "connected"
                  ? `⏳ Loading candles... (${candles.length}/10)`
                  : wsStatus === "connecting"
                    ? "⟳ Connecting to Deriv..."
                    : "❌ Disconnected — tap RECONNECT"}
            </div>
          </div>
        )}

        {/* Trade on Deriv */}
        <div style={{ background:"#0a0510", border:"1px solid #8844ff33", borderRadius:10, padding:"14px 16px", marginTop:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#aa66ff", fontWeight:700, marginBottom:3 }}>📈 TRADE ON DERIV</div>
              <div style={{ fontSize:9, color:t.muted }}>Rise/Fall · Volatility Indices</div>
            </div>
            <a href="https://dtrader.deriv.com" target="_blank" rel="noopener noreferrer"
              style={{ padding:"10px 18px", background:"linear-gradient(135deg,#8844ff,#6622dd)",
                color:"#fff", borderRadius:8, fontSize:10, fontWeight:700, textDecoration:"none", letterSpacing:1 }}>
              OPEN DERIV →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
