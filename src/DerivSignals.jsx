import { useState, useEffect, useRef } from "react";

const VOLATILITY_PAIRS = [
  { symbol:"R_10",    name:"Volatility 10 Index",  short:"V10"   },
  { symbol:"R_25",    name:"Volatility 25 Index",  short:"V25"   },
  { symbol:"R_50",    name:"Volatility 50 Index",  short:"V50"   },
  { symbol:"R_75",    name:"Volatility 75 Index",  short:"V75"   },
  { symbol:"R_100",   name:"Volatility 100 Index", short:"V100"  },
  { symbol:"1HZ10V",  name:"Volatility 10 (1s)",   short:"V10s"  },
  { symbol:"1HZ25V",  name:"Volatility 25 (1s)",   short:"V25s"  },
  { symbol:"1HZ50V",  name:"Volatility 50 (1s)",   short:"V50s"  },
  { symbol:"1HZ75V",  name:"Volatility 75 (1s)",   short:"V75s"  },
  { symbol:"1HZ100V", name:"Volatility 100 (1s)",  short:"V100s" },
];

const FOREX_PAIRS = [
  { symbol:"frxEURUSD", name:"EUR/USD", short:"EUR/USD" },
  { symbol:"frxGBPUSD", name:"GBP/USD", short:"GBP/USD" },
  { symbol:"frxUSDJPY", name:"USD/JPY", short:"USD/JPY" },
  { symbol:"frxAUDUSD", name:"AUD/USD", short:"AUD/USD" },
  { symbol:"frxUSDCAD", name:"USD/CAD", short:"USD/CAD" },
  { symbol:"frxEURGBP", name:"EUR/GBP", short:"EUR/GBP" },
];

const ALL_PAIRS = [...VOLATILITY_PAIRS, ...FOREX_PAIRS];

const TIMEFRAMES = [
  { label:"1M",  value:60   },
  { label:"5M",  value:300  },
  { label:"15M", value:900  },
  { label:"30M", value:1800 },
  { label:"1H",  value:3600 },
];

// ── Indicators ──────────────────────────────────────────
function calcEMA(data, period) {
  if (!data || data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period - 1; i >= 0; i--) ema = data[i] * k + ema * (1 - k);
  return ema;
}
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let g = 0, l = 0;
  for (let i = 0; i < period; i++) {
    const d = closes[i] - closes[i + 1];
    if (d > 0) g += d; else l += Math.abs(d);
  }
  const rs = (g / period) / ((l / period) || 0.001);
  return 100 - (100 / (1 + rs));
}
function calcMACD(closes) {
  if (closes.length < 26) return null;
  const e12 = calcEMA(closes, 12), e26 = calcEMA(closes, 26);
  if (!e12 || !e26) return null;
  return { histogram: e12 - e26, bullish: e12 > e26 };
}
function calcBB(closes, period = 20, mult = 2) {
  if (closes.length < period) return null;
  const slice = closes.slice(0, period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period);
  return { upper: mean + mult * std, middle: mean, lower: mean - mult * std };
}
function getPattern(candles) {
  if (candles.length < 3) return { name:"N/A", bias:0 };
  const [c0, c1] = candles;
  const o0 = c0.open, h0 = c0.high, l0 = c0.low, cl0 = c0.close;
  const o1 = c1.open, cl1 = c1.close;
  const body0 = Math.abs(cl0 - o0), range0 = h0 - l0;
  const upper = h0 - Math.max(cl0, o0), lower = Math.min(cl0, o0) - l0;
  if (!range0) return { name:"Doji", bias:0 };
  if (body0 < range0 * 0.05) return { name:"Doji", bias:0 };
  if (lower > body0 * 2 && upper < body0 * 0.3 && cl0 > o0) return { name:"Hammer", bias:1 };
  if (upper > body0 * 2 && lower < body0 * 0.3) return { name:"Shooting Star", bias:-1 };
  if (cl0 > o0 && cl1 < o1 && cl0 > o1 && o0 < cl1) return { name:"Bullish Engulfing", bias:1 };
  if (cl0 < o0 && cl1 > o1 && cl0 < o1 && o0 > cl1) return { name:"Bearish Engulfing", bias:-1 };
  return { name: cl0 > o0 ? "Bullish" : "Bearish", bias: cl0 > o0 ? 0.5 : -0.5 };
}

function analyzeCandles(candles) {
  if (!candles || candles.length < 20) return null;
  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const latest = closes[0];
  const ema9   = calcEMA(closes, 9);
  const ema21  = calcEMA(closes, 21);
  const ema50  = calcEMA(closes, 50);
  const rsi    = calcRSI(closes, 14);
  const macd   = calcMACD(closes);
  const bb     = calcBB(closes, 20, 2);
  const pat    = getPattern(candles);
  let atrSum = 0;
  for (let i = 0; i < 14; i++) atrSum += highs[i] - lows[i];
  const atr = atrSum / 14;

  const votes = [], details = {};
  if (ema9 && ema21)  { const v = ema9 > ema21 ? 1 : -1;  votes.push(v); details.ema   = { v, label: v > 0 ? "EMA Bull" : "EMA Bear" }; }
  if (ema50)          { const v = latest > ema50 ? 1 : -1; votes.push(v); details.ema50 = { v, label: v > 0 ? "Above EMA50" : "Below EMA50" }; }
  if (rsi !== null)   { const v = rsi < 40 ? 1 : rsi > 60 ? -1 : rsi < 50 ? 0.5 : -0.5; votes.push(v); details.rsi = { v, label: `RSI ${rsi.toFixed(1)}` }; }
  if (macd)           { const v = macd.bullish ? 1 : -1; votes.push(v); details.macd = { v, label: macd.bullish ? "MACD Bull" : "MACD Bear" }; }
  if (bb)             { const v = latest < bb.lower ? 1 : latest > bb.upper ? -1 : latest < bb.middle ? 0.5 : -0.5; votes.push(v); details.bb = { v, label: latest < bb.lower ? "BB Oversold" : latest > bb.upper ? "BB Overbought" : "BB Mid" }; }
  if (pat.bias !== 0) { const v = pat.bias > 0 ? 1 : -1; votes.push(v); details.pattern = { v, label: pat.name }; }
  const mom = ((closes[0] - closes[4]) / closes[4]) * 100;
  const mv  = mom > 0.05 ? 1 : mom < -0.05 ? -1 : 0;
  votes.push(mv); details.momentum = { v: mv, label: `Mom ${mom.toFixed(2)}%` };

  const bullV = votes.filter(v => v > 0).length;
  const bearV = votes.filter(v => v < 0).length;
  const total = votes.length;
  const bullPct = Math.round((bullV / total) * 100);
  const bearPct = Math.round((bearV / total) * 100);

  let signal = "WAIT", confidence = 50;
  if (bullPct >= 75) { signal = "RISE"; confidence = bullPct; }
  else if (bearPct >= 75) { signal = "FALL"; confidence = bearPct; }

  const decay = 0.88;
  const next3 = Array.from({ length:3 }, (_, i) => {
    const conf = Math.round(confidence * Math.pow(decay, i));
    const dir  = signal === "RISE" ? "UP" : signal === "FALL" ? "DOWN" : "N/A";
    const str  = conf >= 80 ? "STRONG" : conf >= 65 ? "MEDIUM" : "WEAK";
    return { number: i + 1, direction: dir, confidence: conf, strength: str,
      reason: i === 0 ? "Momentum entry" : i === 1 ? "Trend continuation" : "Watch for reversal" };
  });

  return { signal, confidence, bullPct, bearPct, bullVotes: bullV, bearVotes: bearV,
    totalVotes: total, pattern: pat.name, rsi: rsi?.toFixed(1), atr, price: latest, details, next3 };
}

function playAlert(signal) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (f, s, d) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f; o.type = "sine";
      g.gain.setValueAtTime(0.3, ctx.currentTime + s);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s + d);
      o.start(ctx.currentTime + s); o.stop(ctx.currentTime + s + d);
    };
    if (signal === "RISE") { beep(880, 0, 0.15); beep(1100, 0.2, 0.15); beep(1320, 0.4, 0.2); }
    else                   { beep(880, 0, 0.15); beep(660, 0.2, 0.15); beep(440, 0.4, 0.2); }
  } catch(e) {}
}

// ── Candle Chart ─────────────────────────────────────────
function DerivChart({ candles, dark, pair, tf }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastX = useRef(0);

  if (!candles || candles.length < 3) return (
    <div style={{ height:280, background:dark?"#0a1520":"#f0f8ff", borderRadius:8,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
      <div style={{ fontSize:24 }}>📊</div>
      <div style={{ fontSize:11, color:dark?"#4499ff":"#0055aa", fontFamily:"monospace" }}>
        Loading candles... ({candles?.length || 0})
      </div>
    </div>
  );

  const H = 280, PL = 58, PB = 22, PT = 10;
  const chartH = H - PB - PT;
  const display = [...candles].slice(0, 80).reverse();
  const maxP = Math.max(...display.map(c => c.high));
  const minP = Math.min(...display.map(c => c.low));
  const range = maxP - minP || 0.0001;
  const dec   = pair?.startsWith("frx") ? 5 : 2;
  const cw    = Math.max(4, 10 * zoom);
  const W     = Math.max(600, PL + display.length * (cw + 1) + 30);
  const chartW = W - PL;
  const toY = p  => PT + ((maxP - p) / range) * chartH;
  const toX = i  => PL + i * (cw + 1) + cw / 2;
  const current  = candles[0]?.close;
  const hGrids   = Array.from({ length:6 }, (_, i) => minP + (range / 5) * i);
  const vStep    = Math.max(1, Math.floor(display.length / 8));
  const vGrids   = Array.from({ length: Math.floor(display.length / vStep) }, (_, i) => i * vStep);

  const onWheel = e => { e.stopPropagation(); e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(6, z + (e.deltaY < 0 ? 0.2 : -0.2)))); };
  const onMD = e => { dragging.current = true; lastX.current = e.clientX; };
  const onMM = e => { if (!dragging.current) return;
    if (containerRef.current) containerRef.current.scrollLeft += lastX.current - e.clientX;
    lastX.current = e.clientX; };
  const onMU = () => { dragging.current = false; };
  const onTS = e => { lastX.current = e.touches[0].clientX; };
  const onTM = e => { e.stopPropagation();
    if (containerRef.current) containerRef.current.scrollLeft += lastX.current - e.touches[0].clientX;
    lastX.current = e.touches[0].clientX; };

  return (
    <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${dark?"#1e3040":"#d0dce8"}`, marginBottom:10 }}>
      {/* Header */}
      <div style={{ padding:"5px 10px", background:dark?"#0a1520":"#e8f4ff",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:9, color:"#4499ff", fontFamily:"monospace", fontWeight:700 }}>
          📊 {pair} · {tf}
        </span>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:9, color:"#ffd700", fontFamily:"monospace", fontWeight:700 }}>
            ● {current?.toFixed(dec)}
          </span>
          {[["−", () => setZoom(z => Math.max(0.3, z - 0.3))],
            ["+", () => setZoom(z => Math.min(6, z + 0.3))],
            ["↺", () => setZoom(1)]].map(([lbl, fn]) => (
            <button key={lbl} onClick={fn} style={{ background:"#0066ff22", border:"1px solid #0066ff44",
              color:"#4499ff", fontSize:11, padding:"1px 7px", borderRadius:4, cursor:"pointer",
              fontFamily:"monospace", fontWeight:700 }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} onWheel={onWheel}
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
        onTouchStart={onTS} onTouchMove={onTM}
        style={{ overflowX:"auto", overflowY:"hidden", cursor:"grab", touchAction:"pan-x",
          background:dark?"#050a0f":"#ffffff" }}>
        <svg width={W} height={H} style={{ display:"block" }}>
          <rect x={PL} y={PT} width={chartW} height={chartH} fill={dark?"#050a0f":"#ffffff"}/>

          {/* Vertical grid */}
          {vGrids.map((gi, i) => (
            <line key={"v"+i} x1={toX(gi)} y1={PT} x2={toX(gi)} y2={H-PB}
              stroke={dark?"#1e304055":"#e0eaf499"} strokeWidth="0.5" strokeDasharray="3,4"/>
          ))}

          {/* Horizontal grid + labels */}
          {hGrids.map((p, i) => (
            <g key={"h"+i}>
              <line x1={PL} y1={toY(p)} x2={W} y2={toY(p)}
                stroke={dark?"#1e3040":"#e0eaf4"} strokeWidth="0.5" strokeDasharray="4,4"/>
              <text x={PL-4} y={toY(p)+3} fontSize="7" fill={dark?"#445566":"#889aa8"} textAnchor="end">
                {p.toFixed(dec)}
              </text>
            </g>
          ))}

          {/* Candles */}
          {display.map((c, i) => {
            const bull = c.close >= c.open;
            const col  = bull ? "#00dd55" : "#ff2244";
            const x    = toX(i);
            const bTop = Math.min(toY(c.open), toY(c.close));
            const bH   = Math.max(1.5, Math.abs(toY(c.close) - toY(c.open)));
            return (
              <g key={i}>
                <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={col} strokeWidth="1"/>
                <rect x={x-cw/2} y={bTop} width={cw} height={bH} fill={col} strokeWidth="0.5"/>
              </g>
            );
          })}

          {/* Current price */}
          {current && (
            <g>
              <line x1={PL} y1={toY(current)} x2={W} y2={toY(current)}
                stroke="#ffd700" strokeWidth="1" strokeDasharray="5,3"/>
              <rect x={W-65} y={toY(current)-9} width={65} height={17} fill="#ffd700" rx="3"/>
              <text x={W-32} y={toY(current)+4} fontSize="8" fill="#000" textAnchor="middle" fontWeight="bold">
                {current.toFixed(dec)}
              </text>
            </g>
          )}

          {/* Y axis line */}
          <line x1={PL} y1={PT} x2={PL} y2={H-PB} stroke={dark?"#1e3040":"#d0dce8"} strokeWidth="1"/>
        </svg>
      </div>

      {/* Footer */}
      <div style={{ padding:"3px 10px", fontSize:8, color:dark?"#334455":"#889aa8",
        fontFamily:"monospace", display:"flex", justifyContent:"space-between",
        background:dark?"#050a0f":"#f8fbff" }}>
        <span>drag to pan · scroll or +/− to zoom</span>
        <span>{display.length} candles</span>
      </div>
    </div>
  );
}

// ── Candle Prediction Card ────────────────────────────────
function CandleCard({ candle, dark }) {
  const up    = candle.direction === "UP";
  const na    = candle.direction === "N/A";
  const color = na ? "#667788" : up ? "#00dd55" : "#ff2244";
  return (
    <div style={{ background: na?(dark?"#0a1520":"#e8f0f8"):up?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"),
      border:`2px solid ${color}44`, borderRadius:10, padding:"12px 10px", borderTop:`4px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:9, color:dark?"#667788":"#556677", fontFamily:"monospace", fontWeight:700 }}>
          CANDLE #{candle.number}
        </span>
        <span style={{ background:color+"33", color, fontSize:9, padding:"1px 6px", borderRadius:3,
          fontWeight:900, fontFamily:"monospace" }}>
          {na ? "⟳ WAIT" : up ? "▲ RISE" : "▼ FALL"}
        </span>
      </div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color, marginBottom:2 }}>
        {candle.confidence}%
      </div>
      <div style={{ fontSize:9, color:dark?"#667788":"#778899", marginBottom:5, fontFamily:"monospace" }}>
        {candle.strength}
      </div>
      <div style={{ height:4, background:dark?"#0a1520":"#e0eaf4", borderRadius:2, overflow:"hidden", marginBottom:6 }}>
        <div style={{ width:`${candle.confidence}%`, height:"100%", background:color }}/>
      </div>
      <div style={{ fontSize:9, color:dark?"#8899aa":"#445566", fontFamily:"monospace", lineHeight:1.5 }}>
        {candle.reason}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function DerivSignals({ dark }) {
  const [selectedPair, setSelectedPair] = useState(ALL_PAIRS[0]);
  const [timeframe,    setTimeframe]    = useState(TIMEFRAMES[0]);
  const [candles,      setCandles]      = useState([]);
  const [livePrice,    setLivePrice]    = useState(null);
  const [analysis,     setAnalysis]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [wsStatus,     setWsStatus]     = useState("disconnected");
  const [soundOn,      setSoundOn]      = useState(true);
  const [autoScan,     setAutoScan]     = useState(false);
  const [lastSignal,   setLastSignal]   = useState(null);
  const wsRef    = useRef(null);
  const candlesRef = useRef([]);
  const autoRef  = useRef(null);

  const t = {
    bg:     dark ? "#050a0f"              : "#f0f4f8",
    bgCard: dark ? "rgba(0,20,40,0.9)"   : "#fff",
    border: dark ? "#0d2a42"             : "#d0dce8",
    muted:  dark ? "#8899aa"             : "#445566",
    dim:    dark ? "#445566"             : "#778899",
    label:  dark ? "#667788"             : "#556677",
  };

  const sc  = s => s === "RISE" ? "#00dd55" : s === "FALL" ? "#ff2244" : "#ffaa00";
  const sbg = s => s === "RISE" ? (dark?"#001a0d":"#e8fff3") : s === "FALL" ? (dark?"#1a0005":"#fff0f3") : (dark?"#1a1000":"#fffbe8");

  const connectWS = () => {
    if (wsRef.current) wsRef.current.close();
    setWsStatus("connecting"); setError(""); setCandles([]); candlesRef.current = [];
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    wsRef.current = ws;
    ws.onopen = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({ ticks: selectedPair.symbol, subscribe:1 }));
      ws.send(JSON.stringify({
        ticks_history: selectedPair.symbol, count:100,
        end:"latest", granularity: timeframe.value, style:"candles", subscribe:1,
      }));
    };
    ws.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.msg_type === "tick") setLivePrice(data.tick?.quote);
      if (data.msg_type === "candles") {
        const c = (data.candles || []).map(k => ({
          open:k.open, high:k.high, low:k.low, close:k.close, time:k.epoch
        })).reverse();
        candlesRef.current = c; setCandles([...c]);
      }
      if (data.msg_type === "ohlc" && data.ohlc && candlesRef.current.length > 0) {
        const o = data.ohlc;
        const u = [...candlesRef.current];
        u[0] = { ...u[0], close:parseFloat(o.close),
          high:Math.max(u[0].high, parseFloat(o.high)),
          low: Math.min(u[0].low,  parseFloat(o.low)) };
        candlesRef.current = u; setCandles([...u]);
      }
      if (data.error) setError(data.error.message);
    };
    ws.onerror  = () => { setWsStatus("error");        setError("WebSocket error"); };
    ws.onclose  = () =>   setWsStatus("disconnected");
  };

  useEffect(() => { connectWS(); return () => wsRef.current?.close(); }, [selectedPair, timeframe]);

  useEffect(() => {
    clearInterval(autoRef.current);
    if (autoScan) {
      autoRef.current = setInterval(() => {
        if (candlesRef.current.length >= 20) {
          const a = analyzeCandles(candlesRef.current);
          if (a) {
            setAnalysis(a);
            if (a.signal !== "WAIT" && soundOn && a.signal !== lastSignal) {
              playAlert(a.signal); setLastSignal(a.signal);
            }
          }
        }
      }, 30000);
    }
    return () => clearInterval(autoRef.current);
  }, [autoScan, soundOn, lastSignal]);

  const getSignal = () => {
    if (candles.length < 20) { setError("Not enough candles yet — wait a moment"); return; }
    setLoading(true); setError("");
    const a = analyzeCandles(candles);
    if (a) { setAnalysis(a); if (a.signal !== "WAIT" && soundOn) playAlert(a.signal); }
    setLoading(false);
  };

  const dec = selectedPair.symbol.startsWith("frx") ? 5 : 2;

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .dspin{animation:spin 1s linear infinite;display:inline-block}
        .dblink{animation:blink 1s infinite}
        .dbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .dbtn:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}
        .dbtn:disabled{opacity:0.5;cursor:not-allowed}
        .dchip{cursor:pointer;transition:all 0.12s;user-select:none}
        .dchip:hover{transform:scale(1.04)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #8844ff44", borderRadius:12,
          padding:"12px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900,
              color:dark?"#fff":"#001133", letterSpacing:2, marginBottom:2 }}>📈 DERIV SIGNALS</div>
            <div style={{ fontSize:9, color:t.dim }}>RISE/FALL · REAL-TIME WEBSOCKET · 1-MINUTE TO 1-HOUR</div>
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

        {/* Pair selector */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12,
          padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:8, letterSpacing:2, color:"#ff4400", fontWeight:700, marginBottom:8 }}>
            📊 VOLATILITY INDICES
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
            {VOLATILITY_PAIRS.map(p => (
              <div key={p.symbol} className="dchip" onClick={()=>{ setSelectedPair(p); setAnalysis(null); setError(""); }}
                style={{ padding:"5px 10px", background:selectedPair.symbol===p.symbol?(dark?"#ff440022":"#fff0ee"):"transparent",
                  border:`2px solid ${selectedPair.symbol===p.symbol?"#ff4400":t.border}`,
                  color:selectedPair.symbol===p.symbol?"#ff4400":t.muted, borderRadius:6, fontSize:9, fontWeight:700 }}>
                {p.short}
              </div>
            ))}
          </div>
          <div style={{ fontSize:8, letterSpacing:2, color:"#0066ff", fontWeight:700, marginBottom:8 }}>
            💱 FOREX PAIRS
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {FOREX_PAIRS.map(p => (
              <div key={p.symbol} className="dchip" onClick={()=>{ setSelectedPair(p); setAnalysis(null); setError(""); }}
                style={{ padding:"5px 10px", background:selectedPair.symbol===p.symbol?(dark?"#0066ff22":"#e0eeff"):"transparent",
                  border:`2px solid ${selectedPair.symbol===p.symbol?"#0066ff":t.border}`,
                  color:selectedPair.symbol===p.symbol?"#4499ff":t.muted, borderRadius:6, fontSize:9, fontWeight:700 }}>
                {p.short}
              </div>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div style={{ display:"flex", gap:5, marginBottom:12 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.value} className="dbtn" onClick={()=>{ setTimeframe(tf); setAnalysis(null); }}
              style={{ flex:1, padding:"8px", background:timeframe.value===tf.value?"#0066ff":"transparent",
                border:`1px solid ${timeframe.value===tf.value?"#0066ff":t.border}`,
                color:timeframe.value===tf.value?"#fff":t.muted, borderRadius:6, fontSize:10 }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Live price */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10,
          padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:9, color:t.dim }}>{selectedPair.name}</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:dark?"#fff":"#001133" }}>
              {livePrice ? livePrice.toFixed(dec) : "---"}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:t.dim }}>Candles</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#4499ff" }}>
              {candles.length}
            </div>
          </div>
        </div>

        {/* Chart */}
        <DerivChart candles={candles} dark={dark} pair={selectedPair.symbol} tf={timeframe.label} />

        {/* Error */}
        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8,
            padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} className="dbtn" style={{ background:"none", color:"#ff5577", fontSize:18, padding:0 }}>×</button>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <button className="dbtn" onClick={getSignal} disabled={loading||candles.length<20}
            style={{ flex:2, padding:"14px", background:"linear-gradient(135deg,#00aa44,#007733)",
              color:"#fff", borderRadius:10, fontSize:13, letterSpacing:2 }}>
            {loading ? <><span className="dspin">⟳</span> ANALYZING...</> : "⚡ GET SIGNAL"}
          </button>
          <button className="dbtn" onClick={()=>setAutoScan(!autoScan)}
            style={{ flex:1, padding:"14px", background:autoScan?"#ff224422":"#0066ff22",
              border:`1px solid ${autoScan?"#ff224444":"#0066ff44"}`,
              color:autoScan?"#ff4466":"#4499ff", borderRadius:10, fontSize:11 }}>
            {autoScan ? "⏹ STOP" : "🔄 AUTO"}
          </button>
          <button className="dbtn" onClick={connectWS}
            style={{ flex:1, padding:"14px", background:"transparent", border:`1px solid ${t.border}`,
              color:t.muted, borderRadius:10, fontSize:11 }}>
            ⟳ RECONNECT
          </button>
        </div>

        {/* Analysis result */}
        {analysis && (
          <div style={{ background:sbg(analysis.signal), border:`3px solid ${sc(analysis.signal)}`,
            borderRadius:14, padding:"18px 16px", marginBottom:14 }}>

            <div style={{ textAlign:"center", marginBottom:14 }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, color:sc(analysis.signal), letterSpacing:2, marginBottom:4 }}>
                {selectedPair.name} · {timeframe.label}
              </div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:44, fontWeight:900, color:sc(analysis.signal), lineHeight:1 }}>
                {analysis.signal==="RISE"?"▲":analysis.signal==="FALL"?"▼":"◆"}
              </div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:26, fontWeight:900, color:sc(analysis.signal) }}>
                {analysis.signal}
              </div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:700, color:sc(analysis.signal) }}>
                {analysis.confidence}% CONFIDENCE
              </div>
              <div style={{ fontSize:10, color:t.muted, fontFamily:"monospace", marginTop:4 }}>
                {analysis.pattern} · RSI: {analysis.rsi}
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:9, color:"#00dd55", fontFamily:"monospace" }}>RISE {analysis.bullPct}%</span>
                <span style={{ fontSize:9, color:t.dim, fontFamily:"monospace" }}>{analysis.bullVotes}↑ {analysis.bearVotes}↓ / {analysis.totalVotes}</span>
                <span style={{ fontSize:9, color:"#ff2244", fontFamily:"monospace" }}>FALL {analysis.bearPct}%</span>
              </div>
              <div style={{ height:8, background:dark?"#0a1520":"#e0eaf4", borderRadius:4, overflow:"hidden", display:"flex" }}>
                <div style={{ width:`${analysis.bullPct}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)" }}/>
                <div style={{ width:`${analysis.bearPct}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)" }}/>
              </div>
            </div>

            {/* Indicators */}
            <div style={{ marginBottom:14 }}>
              {Object.entries(analysis.details).map(([key, d]) => (
                <div key={key} style={{ display:"flex", justifyContent:"space-between",
                  padding:"4px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                  <span style={{ fontSize:9, color:t.dim, fontFamily:"monospace" }}>{key.toUpperCase()}</span>
                  <span style={{ fontSize:9, fontWeight:700, fontFamily:"monospace",
                    color:d.v>0?"#00dd55":d.v<0?"#ff2244":"#ffaa00" }}>{d.label}</span>
                </div>
              ))}
            </div>

            {/* Next 3 candles */}
            <div style={{ fontSize:10, letterSpacing:2, color:t.label, fontFamily:"monospace", fontWeight:700, marginBottom:10 }}>
              📊 NEXT 3 CANDLES
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              {analysis.next3.map(c => <CandleCard key={c.number} candle={c} dark={dark} />)}
            </div>

            {/* Trade info */}
            <div style={{ padding:"10px 12px", background:dark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.05)",
              borderRadius:8, fontSize:9, color:t.muted, fontFamily:"monospace", lineHeight:1.8 }}>
              📍 Entry: {analysis.price.toFixed(dec)}<br/>
              ⏱ Duration: {timeframe.label}/candle · 3 candles = {(timeframe.value*3/60).toFixed(0)} min expiry<br/>
              ⚠️ Use on Deriv Rise/Fall contracts only
            </div>
          </div>
        )}

        {/* Status when no analysis */}
        {!analysis && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10,
            padding:"16px", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📈</div>
            <div style={{ fontSize:10, color:t.muted, marginBottom:6 }}>Real-time Deriv WebSocket</div>
            <div style={{ fontSize:10, color:t.dim, lineHeight:1.8 }}>
              {wsStatus==="connected"
                ? candles.length>=20 ? "✅ Ready — tap GET SIGNAL"
                  : `⏳ Loading candles... (${candles.length}/20)`
                : wsStatus==="connecting" ? "⟳ Connecting to Deriv..."
                : "❌ Disconnected — tap RECONNECT"}
            </div>
          </div>
        )}

        {/* Deriv CTA */}
        <div style={{ background:dark?"#0a0510":"#f8f0ff", border:"1px solid #8844ff33",
          borderRadius:10, padding:"14px 16px", marginTop:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#aa66ff", fontWeight:700, marginBottom:3 }}>📈 TRADE ON DERIV</div>
              <div style={{ fontSize:9, color:t.dim }}>Use these signals on Deriv Rise/Fall contracts</div>
            </div>
            <a href="https://deriv.com" target="_blank" rel="noopener noreferrer"
                     style={{ padding:"10px 18px", background:"linear-gradient(135deg,#8844ff,#6622dd)",
                color:"#fff", borderRadius:8, fontSize:10, fontWeight:700, textDecoration:"none", letterSpacing:1 }}>
              OPEN DERIV ACCOUNT →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
