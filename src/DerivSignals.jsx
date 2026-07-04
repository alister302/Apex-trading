import { useState, useEffect, useRef } from "react";

const VOLATILITY_PAIRS = [
  { symbol:"R_10",   name:"Volatility 10 Index",   short:"V10"  },
  { symbol:"R_25",   name:"Volatility 25 Index",   short:"V25"  },
  { symbol:"R_50",   name:"Volatility 50 Index",   short:"V50"  },
  { symbol:"R_75",   name:"Volatility 75 Index",   short:"V75"  },
  { symbol:"R_100",  name:"Volatility 100 Index",  short:"V100" },
  { symbol:"1HZ10V", name:"Volatility 10 (1s)",    short:"V10s" },
  { symbol:"1HZ25V", name:"Volatility 25 (1s)",    short:"V25s" },
  { symbol:"1HZ50V", name:"Volatility 50 (1s)",    short:"V50s" },
  { symbol:"1HZ75V", name:"Volatility 75 (1s)",    short:"V75s" },
  { symbol:"1HZ100V",name:"Volatility 100 (1s)",   short:"V100s"},
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
  { label:"1M",  value:60    },
  { label:"5M",  value:300   },
  { label:"15M", value:900   },
  { label:"30M", value:1800  },
  { label:"1H",  value:3600  },
];

function calcEMA(data, period) {
  if (!data||data.length<period) return null;
  const k = 2/(period+1);
  let ema = data.slice(0,period).reduce((a,b)=>a+b,0)/period;
  for (let i=period-1;i>=0;i--) ema=data[i]*k+ema*(1-k);
  return ema;
}
function calcRSI(closes, period=14) {
  if (closes.length<period+1) return null;
  let g=0,l=0;
  for (let i=0;i<period;i++) { const d=closes[i]-closes[i+1]; if(d>0)g+=d; else l+=Math.abs(d); }
  const rs=(g/period)/((l/period)||0.001);
  return 100-(100/(1+rs));
}
function calcMACD(closes) {
  if (closes.length<26) return null;
  const e12=calcEMA(closes,12), e26=calcEMA(closes,26);
  if (!e12||!e26) return null;
  return { histogram:e12-e26, bullish:e12>e26 };
}
function calcBB(closes, period=20, mult=2) {
  if (closes.length<period) return null;
  const slice=closes.slice(0,period);
  const mean=slice.reduce((a,b)=>a+b,0)/period;
  const std=Math.sqrt(slice.reduce((a,b)=>a+Math.pow(b-mean,2),0)/period);
  return { upper:mean+mult*std, middle:mean, lower:mean-mult*std };
}
function getPattern(candles) {
  if (candles.length<3) return { name:"N/A", bias:0 };
  const [c0,c1]=candles;
  const o0=c0.open,h0=c0.high,l0=c0.low,cl0=c0.close;
  const o1=c1.open,cl1=c1.close;
  const body0=Math.abs(cl0-o0),range0=h0-l0;
  const upper=h0-Math.max(cl0,o0),lower=Math.min(cl0,o0)-l0;
  if (!range0) return { name:"Doji", bias:0 };
  if (body0<range0*0.05) return { name:"Doji", bias:0 };
  if (lower>body0*2&&upper<body0*0.3&&cl0>o0) return { name:"Hammer", bias:1 };
  if (upper>body0*2&&lower<body0*0.3) return { name:"Shooting Star", bias:-1 };
  if (cl0>o0&&cl1<o1&&cl0>o1&&o0<cl1) return { name:"Bullish Engulfing", bias:1 };
  if (cl0<o0&&cl1>o1&&cl0<o1&&o0>cl1) return { name:"Bearish Engulfing", bias:-1 };
  return { name:cl0>o0?"Bullish":"Bearish", bias:cl0>o0?0.5:-0.5 };
}

function analyzeCandles(candles) {
  if (!candles||candles.length<20) return null;
  const closes=candles.map(c=>c.close);
  const highs=candles.map(c=>c.high);
  const lows=candles.map(c=>c.low);
  const latest=closes[0];

  const ema9=calcEMA(closes,9);
  const ema21=calcEMA(closes,21);
  const ema50=calcEMA(closes,50);
  const rsi=calcRSI(closes,14);
  const macd=calcMACD(closes);
  const bb=calcBB(closes,20,2);
  const pat=getPattern(candles);

  // ATR
  let atrSum=0;
  for (let i=0;i<14;i++) atrSum+=highs[i]-lows[i];
  const atr=atrSum/14;

  const votes=[];
  const details={};

  if (ema9&&ema21) { const v=ema9>ema21?1:-1; votes.push(v); details.ema={v,label:v>0?"EMA Bull":"EMA Bear"}; }
  if (ema50) { const v=latest>ema50?1:-1; votes.push(v); details.ema50={v,label:v>0?"Above EMA50":"Below EMA50"}; }
  if (rsi!==null) { const v=rsi<40?1:rsi>60?-1:rsi<50?0.5:-0.5; votes.push(v); details.rsi={v,label:`RSI ${rsi.toFixed(1)}`}; }
  if (macd) { const v=macd.bullish?1:-1; votes.push(v); details.macd={v,label:macd.bullish?"MACD Bull":"MACD Bear"}; }
  if (bb) { const v=latest<bb.lower?1:latest>bb.upper?-1:latest<bb.middle?0.5:-0.5; votes.push(v); details.bb={v,label:latest<bb.lower?"BB Oversold":latest>bb.upper?"BB Overbought":"BB Neutral"}; }
  if (pat.bias!==0) { const v=pat.bias>0?1:-1; votes.push(v); details.pattern={v,label:pat.name}; }
  const mom=((closes[0]-closes[4])/closes[4])*100;
  const mv=mom>0.05?1:mom<-0.05?-1:0; votes.push(mv); details.momentum={v:mv,label:`Mom ${mom.toFixed(2)}%`};

  const bullV=votes.filter(v=>v>0).length;
  const bearV=votes.filter(v=>v<0).length;
  const total=votes.length;
  const bullPct=Math.round((bullV/total)*100);
  const bearPct=Math.round((bearV/total)*100);

  let signal="WAIT",confidence=50;
  if (bullPct>=75) { signal="RISE"; confidence=bullPct; }
  else if (bearPct>=75) { signal="FALL"; confidence=bearPct; }

  // Next 3 candles
  const decay=0.88;
  const next3=[];
  for (let i=1;i<=3;i++) {
    const conf=Math.round(confidence*Math.pow(decay,i-1));
    const dir=signal==="RISE"?"UP":signal==="FALL"?"DOWN":"N/A";
    const str=conf>=80?"STRONG":conf>=65?"MEDIUM":"WEAK";
    next3.push({ number:i, direction:dir, confidence:conf, strength:str,
      reason:i===1?"Momentum entry":i===2?"Continuation":i===3?"Watch for reversal":"" });
  }

  return { signal, confidence, bullPct, bearPct, bullVotes:bullV, bearVotes:bearV,
    totalVotes:total, pattern:pat.name, rsi:rsi?.toFixed(1), atr,
    price:latest, details, next3,
    trend:bullPct>bearPct?"Bullish":"Bearish" };
}

function playAlert(signal) {
  try {
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    const beep=(f,s,d)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.value=f;o.type="sine";
      g.gain.setValueAtTime(0.3,ctx.currentTime+s);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+s+d);
      o.start(ctx.currentTime+s);o.stop(ctx.currentTime+s+d);
    };
    if (signal==="RISE") { beep(880,0,0.15);beep(1100,0.2,0.15);beep(1320,0.4,0.2); }
    else { beep(880,0,0.15);beep(660,0.2,0.15);beep(440,0.4,0.2); }
  } catch(e){}
}

function CandlePredict({ candle, dark }) {
  const up=candle.direction==="UP";
  const color=up?"#00dd55":"#ff2244";
  const na=candle.direction==="N/A";
  return (
    <div style={{ background:na?(dark?"#0a1520":"#e8f0f8"):up?(dark?"#001a0d":"#e8fff3"):(dark?"#1a0005":"#fff0f3"), border:`2px solid ${na?"#33445566":color+"44"}`, borderRadius:10, padding:"12px 10px", borderTop:`4px solid ${na?"#445566":color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:9, color:dark?"#667788":"#556677", fontFamily:"monospace", fontWeight:700 }}>CANDLE #{candle.number}</span>
        <span style={{ background:na?"#33445522":color+"33", color:na?"#667788":color, fontSize:9, padding:"1px 6px", borderRadius:3, fontWeight:900, fontFamily:"monospace" }}>
          {na?"⟳ WAIT":up?"▲ RISE":"▼ FALL"}
        </span>
      </div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:na?"#445566":color, marginBottom:2 }}>{candle.confidence}%</div>
      <div style={{ fontSize:9, color:dark?"#667788":"#778899", marginBottom:5, fontFamily:"monospace" }}>{candle.strength}</div>
      <div style={{ height:4, background:dark?"#0a1520":"#e0eaf4", borderRadius:2, overflow:"hidden", marginBottom:6 }}>
        <div style={{ width:`${candle.confidence}%`, height:"100%", background:na?"#445566":color }} />
      </div>
      <div style={{ fontSize:9, color:dark?"#8899aa":"#445566", fontFamily:"monospace", lineHeight:1.5 }}>{candle.reason}</div>
    </div>
  );
}


const TV_MAP = {
  "R_10":    "VOLATILITY10INDEX",
  "R_25":    "VOLATILITY25INDEX",
  "R_50":    "VOLATILITY50INDEX",
  "R_75":    "VOLATILITY75INDEX",
  "R_100":   "VOLATILITY100INDEX",
  "1HZ10V":  "VOLATILITY10_1SINDEX",
  "1HZ25V":  "VOLATILITY25_1SINDEX",
  "1HZ50V":  "VOLATILITY50_1SINDEX",
  "1HZ75V":  "VOLATILITY75_1SINDEX",
  "1HZ100V": "VOLATILITY100_1SINDEX",
  "frxEURUSD":"FX:EURUSD",
  "frxGBPUSD":"FX:GBPUSD",
  "frxUSDJPY":"FX:USDJPY",
  "frxAUDUSD":"FX:AUDUSD",
  "frxUSDCAD":"FX:USDCAD",
  "frxEURGBP":"FX:EURGBP",
};

const TF_MAP = { 60:"1", 300:"5", 900:"15", 1800:"30", 3600:"60" };

export default function DerivSignals({ dark }) {
  const [selectedPair, setSelectedPair] = useState(ALL_PAIRS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [candles, setCandles] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [soundOn, setSoundOn] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [lastSignal, setLastSignal] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const wsRef = useRef(null);
  const candlesRef = useRef([]);
  const autoRef = useRef(null);

  const t = {
    bg:dark?"#050a0f":"#f0f4f8",
    bgCard:dark?"rgba(0,20,40,0.9)":"#fff",
    border:dark?"#0d2a42":"#d0dce8",
    muted:dark?"#8899aa":"#445566",
    dim:dark?"#445566":"#778899",
    label:dark?"#667788":"#556677",
  };

  const sc = s=>s==="RISE"?"#00dd55":s==="FALL"?"#ff2244":"#ffaa00";
  const sbg = s=>s==="RISE"?(dark?"#001a0d":"#e8fff3"):s==="FALL"?(dark?"#1a0005":"#fff0f3"):(dark?"#1a1000":"#fffbe8");

  const connectWS = () => {
    if (wsRef.current) wsRef.current.close();
    setWsStatus("connecting");
    setError("");

    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      // Subscribe to ticks for live price
      ws.send(JSON.stringify({ ticks: selectedPair.symbol, subscribe:1 }));
      // Request candles
      fetchCandles(ws);
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.msg_type==="tick") {
        setLivePrice(data.tick?.quote);
      }
      if (data.msg_type==="candles") {
        const c = (data.candles||[]).map(k=>({
          open:k.open, high:k.high, low:k.low, close:k.close, time:k.epoch
        })).reverse();
        candlesRef.current = c;
        setCandles(c);
      }
      if (data.msg_type==="ohlc") {
        // Live candle update
        const ohlc = data.ohlc;
        if (ohlc && candlesRef.current.length>0) {
          const updated=[...candlesRef.current];
          updated[0]={ ...updated[0], close:parseFloat(ohlc.close), high:Math.max(updated[0].high,parseFloat(ohlc.high)), low:Math.min(updated[0].low,parseFloat(ohlc.low)) };
          candlesRef.current=updated;
          setCandles([...updated]);
        }
      }
      if (data.error) setError(data.error.message);
    };

    ws.onerror = () => { setWsStatus("error"); setError("WebSocket connection failed"); };
    ws.onclose = () => setWsStatus("disconnected");
  };

  const fetchCandles = (ws) => {
    if (!ws||ws.readyState!==1) return;
    ws.send(JSON.stringify({
      ticks_history: selectedPair.symbol,
      adjust_start_time: 1,
      count: 100,
      end: "latest",
      granularity: timeframe.value,
      style: "candles",
      subscribe: 1,
    }));
  };

  useEffect(() => {
    connectWS();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [selectedPair, timeframe]);

  // Auto scan every 30s
  useEffect(() => {
    clearInterval(autoRef.current);
    if (autoScan) {
      autoRef.current = setInterval(() => {
        if (candlesRef.current.length>=20) {
          const a = analyzeCandles(candlesRef.current);
          if (a) {
            setAnalysis(a);
            if (a.signal!=="WAIT" && soundOn && a.signal!==lastSignal) {
              playAlert(a.signal);
              setLastSignal(a.signal);
            }
          }
        }
      }, 30000);
    }
    return () => clearInterval(autoRef.current);
  }, [autoScan, soundOn, lastSignal]);

  const getSignal = () => {
    if (candles.length<20) { setError("Not enough candle data yet — wait a moment"); return; }
    setLoading(true); setError("");
    const a = analyzeCandles(candles);
    if (a) {
      setAnalysis(a);
      if (a.signal!=="WAIT" && soundOn) playAlert(a.signal);
    }
    setLoading(false);
  };

  const isVol = selectedPair.symbol.startsWith("R_")||selectedPair.symbol.startsWith("1HZ");

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
        <div style={{ background:t.bgCard, border:"2px solid #ff440044", borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:2, marginBottom:2 }}>
                📈 DERIV SIGNALS
              </div>
              <div style={{ fontSize:9, color:t.dim }}>RISE/FALL · REAL-TIME WEBSOCKET · VOLATILITY & FOREX</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div className={wsStatus==="connected"?"dblink":""} style={{ width:8, height:8, borderRadius:"50%", background:wsStatus==="connected"?"#00dd55":wsStatus==="connecting"?"#ffaa00":"#ff4466" }} />
                <span style={{ fontSize:8, color:wsStatus==="connected"?"#00dd55":wsStatus==="connecting"?"#ffaa00":"#ff4466", fontWeight:700 }}>
                  {wsStatus.toUpperCase()}
                </span>
              </div>
              <button className="dbtn" onClick={()=>setSoundOn(!soundOn)}
                style={{ background:soundOn?"#ffd70022":"transparent", border:`1px solid ${soundOn?"#ffd70044":t.border}`, color:soundOn?"#ffd700":t.muted, padding:"5px 8px", borderRadius:5, fontSize:12 }}>
                {soundOn?"🔔":"🔕"}
              </button>
            </div>
          </div>
        </div>

        {/* Pair selector — Volatility */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:8, letterSpacing:2, color:"#ff4400", fontWeight:700, marginBottom:8 }}>📊 VOLATILITY INDICES</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
            {VOLATILITY_PAIRS.map(p=>(
              <div key={p.symbol} className="dchip" onClick={()=>setSelectedPair(p)}
                style={{ padding:"5px 10px", background:selectedPair.symbol===p.symbol?(dark?"#ff440022":"#fff0ee"):"transparent", border:`2px solid ${selectedPair.symbol===p.symbol?"#ff4400":t.border}`, color:selectedPair.symbol===p.symbol?"#ff4400":t.muted, borderRadius:6, fontSize:9, fontWeight:700 }}>
                {p.short}
              </div>
            ))}
          </div>
          <div style={{ fontSize:8, letterSpacing:2, color:"#0066ff", fontWeight:700, marginBottom:8 }}>💱 FOREX PAIRS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {FOREX_PAIRS.map(p=>(
              <div key={p.symbol} className="dchip" onClick={()=>setSelectedPair(p)}
                style={{ padding:"5px 10px", background:selectedPair.symbol===p.symbol?(dark?"#0066ff22":"#e0eeff"):"transparent", border:`2px solid ${selectedPair.symbol===p.symbol?"#0066ff":t.border}`, color:selectedPair.symbol===p.symbol?"#4499ff":t.muted, borderRadius:6, fontSize:9, fontWeight:700 }}>
                {p.short}
              </div>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div style={{ display:"flex", gap:5, marginBottom:12 }}>
          {TIMEFRAMES.map(tf=>(
            <button key={tf.value} className="dbtn" onClick={()=>setTimeframe(tf)}
              style={{ flex:1, padding:"8px", background:timeframe.value===tf.value?"#0066ff":"transparent", border:`1px solid ${timeframe.value===tf.value?"#0066ff":t.border}`, color:timeframe.value===tf.value?"#fff":t.muted, borderRadius:6, fontSize:10, letterSpacing:1 }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Live price + candle count */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:9, color:t.dim }}>{selectedPair.name}</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:dark?"#fff":"#001133" }}>
              {livePrice ? livePrice.toFixed(selectedPair.symbol.startsWith("R_")||selectedPair.symbol.startsWith("1HZ")?2:5) : "---"}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:t.dim }}>Candles loaded</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:"#4499ff" }}>{candles.length}</div>
          </div>
        </div>


        {/* TradingView Chart */}
        {showChart && (
          <div style={{ borderRadius:8, overflow:"hidden", marginBottom:10, border:`1px solid ${t.border}` }}>
            <div style={{ padding:"5px 10px", background:dark?"#0a1520":"#e8f4ff", fontSize:9, color:"#4499ff", fontFamily:"monospace", fontWeight:700 }}>
              📊 LIVE CHART · {selectedPair.name} · {timeframe.label}
            </div>
            <iframe
                key={selectedPair.symbol + timeframe.value}
                src={`https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TV_MAP[selectedPair.symbol]||"FX:EURUSD")}&interval=${TF_MAP[timeframe.value]||"1"}&theme=${dark?"dark":"light"}&style=1&locale=en&toolbar_bg=%23f1f3f6&hide_top_toolbar=1&hide_legend=1&hide_side_toolbar=1&save_image=false`}
                style={{ width:"100%", height:320, border:"none", display:"block" }}
                title={selectedPair.name}
                loading="lazy"
              />
          </div>
        )}
        <button className="dbtn" onClick={()=>setShowChart(!showChart)}
          style={{ width:"100%", background:"transparent", border:`1px solid ${t.border}`, color:t.muted, padding:"6px", borderRadius:6, fontSize:9, marginBottom:10, letterSpacing:1 }}>
          {showChart?"▲ HIDE CHART":"▼ SHOW CHART"}
        </button>
        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} className="dbtn" style={{ background:"none", color:"#ff5577", fontSize:18, padding:0 }}>×</button>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <button className="dbtn" onClick={getSignal} disabled={loading||candles.length<20}
            style={{ flex:2, padding:"14px", background:"linear-gradient(135deg,#00aa44,#007733)", color:"#fff", borderRadius:10, fontSize:13, letterSpacing:2 }}>
            {loading?<><span className="dspin">⟳</span> ANALYZING...</>:"⚡ GET SIGNAL"}
          </button>
          <button className="dbtn" onClick={()=>setAutoScan(!autoScan)}
            style={{ flex:1, padding:"14px", background:autoScan?"#ff224422":"#0066ff22", border:`1px solid ${autoScan?"#ff224444":"#0066ff44"}`, color:autoScan?"#ff4466":"#4499ff", borderRadius:10, fontSize:11 }}>
            {autoScan?"⏹ STOP":"🔄 AUTO"}
          </button>
          <button className="dbtn" onClick={connectWS}
            style={{ flex:1, padding:"14px", background:"transparent", border:`1px solid ${t.border}`, color:t.muted, borderRadius:10, fontSize:11 }}>
            ⟳ RECONNECT
          </button>
        </div>

        {/* Analysis result */}
        {analysis && (
          <div style={{ background:sbg(analysis.signal), border:`3px solid ${sc(analysis.signal)}`, borderRadius:14, padding:"18px 16px", marginBottom:14 }}>

            {/* Signal header */}
            <div style={{ textAlign:"center", marginBottom:14 }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, color:sc(analysis.signal), letterSpacing:2, marginBottom:4 }}>
                {selectedPair.name} · {timeframe.label}
              </div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:42, fontWeight:900, color:sc(analysis.signal), lineHeight:1 }}>
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

            {/* Bull/Bear bar */}
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:9, color:"#00dd55", fontFamily:"monospace" }}>RISE {analysis.bullPct}%</span>
                <span style={{ fontSize:9, color:t.dim, fontFamily:"monospace" }}>{analysis.bullVotes}↑ {analysis.bearVotes}↓ / {analysis.totalVotes}</span>
                <span style={{ fontSize:9, color:"#ff2244", fontFamily:"monospace" }}>FALL {analysis.bearPct}%</span>
              </div>
              <div style={{ height:8, background:dark?"#0a1520":"#e0eaf4", borderRadius:4, overflow:"hidden", display:"flex" }}>
                <div style={{ width:`${analysis.bullPct}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)" }} />
                <div style={{ width:`${analysis.bearPct}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)" }} />
              </div>
            </div>

            {/* Indicators */}
            <div style={{ marginBottom:14 }}>
              {Object.entries(analysis.details).map(([key,d])=>(
                <div key={key} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                  <span style={{ fontSize:9, color:t.dim, fontFamily:"monospace" }}>{key.toUpperCase()}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:d.v>0?"#00dd55":d.v<0?"#ff2244":"#ffaa00", fontFamily:"monospace" }}>{d.label}</span>
                </div>
              ))}
            </div>

            {/* Next 3 candles */}
            <div>
              <div style={{ fontSize:10, letterSpacing:2, color:t.label, fontFamily:"monospace", fontWeight:700, marginBottom:10 }}>
                📊 NEXT 3 CANDLES PREDICTION
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {analysis.next3.map(c=><CandlePredict key={c.number} candle={c} dark={dark} />)}
              </div>
            </div>

            {/* Trade info */}
            <div style={{ marginTop:12, padding:"10px 12px", background:dark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.05)", borderRadius:8, fontSize:9, color:t.muted, fontFamily:"monospace", lineHeight:1.8 }}>
              📍 Entry Price: {analysis.price}<br/>
              ⏱ Duration: {timeframe.label} per candle · 3 candles = {timeframe.value*3/60} min expiry<br/>
              ⚠️ Use on Deriv Rise/Fall contracts only
            </div>
          </div>
        )}

        {/* Info box */}
        {!analysis && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📈</div>
            <div style={{ fontSize:11, color:t.muted, marginBottom:6 }}>Real-time Deriv WebSocket data</div>
            <div style={{ fontSize:10, color:t.dim, lineHeight:1.8 }}>
              {wsStatus==="connected"
                ? candles.length>=20
                  ? "✅ Ready — tap GET SIGNAL"
                  : `⏳ Loading candles... (${candles.length}/20)`
                : wsStatus==="connecting"
                ? "⟳ Connecting to Deriv..."
                : "❌ Disconnected — tap RECONNECT"
              }
            </div>
          </div>
        )}

        {/* Register on Deriv CTA */}
        <div style={{ background:dark?"#0a0510":"#f8f0ff", border:"1px solid #8844ff33", borderRadius:10, padding:"14px 16px", marginTop:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#aa66ff", fontWeight:700, marginBottom:3 }}>📈 TRADE ON DERIV</div>
              <div style={{ fontSize:9, color:t.dim }}>Use these signals on Deriv Rise/Fall contracts</div>
            </div>
            <a href="https://deriv.com" target="_blank" rel="noopener noreferrer"
              style={{ padding:"10px 18px", background:"linear-gradient(135deg,#8844ff,#6622dd)", color:"#fff", borderRadius:8, fontSize:10, fontWeight:700, textDecoration:"none", letterSpacing:1 }}>
              OPEN DERIV ACCOUNT →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
