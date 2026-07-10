import { useState, useEffect, useRef, useCallback } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const VOLATILITY_PAIRS = [
  { symbol:"R_10",    name:"Volatility 10",   short:"V10"   },
  { symbol:"R_25",    name:"Volatility 25",   short:"V25"   },
  { symbol:"R_50",    name:"Volatility 50",   short:"V50"   },
  { symbol:"R_75",    name:"Volatility 75",   short:"V75"   },
  { symbol:"R_100",   name:"Volatility 100",  short:"V100"  },
  { symbol:"1HZ10V",  name:"Vol 10 (1s)",     short:"V10s"  },
  { symbol:"1HZ25V",  name:"Vol 25 (1s)",     short:"V25s"  },
  { symbol:"1HZ50V",  name:"Vol 50 (1s)",     short:"V50s"  },
  { symbol:"1HZ75V",  name:"Vol 75 (1s)",     short:"V75s"  },
  { symbol:"1HZ100V", name:"Vol 100 (1s)",    short:"V100s" },
];

const TIMEFRAMES = [
  { label:"1M", value:60,   tf:"1min"  },
  { label:"5M", value:300,  tf:"5min"  },
  { label:"15M",value:900,  tf:"15min" },
  { label:"1H", value:3600, tf:"1h"    },
  { label:"4H", value:14400,tf:"4h"    },
];

const TIER_CONFIG = {
  "ELITE ULTRA":{ color:"#ffd700", bg:"rgba(255,215,0,0.1)",  border:"#ffd700", glow:"0 0 30px #ffd70055" },
  "STRONG":     { color:"#00dd55", bg:"rgba(0,221,85,0.08)",  border:"#00dd55", glow:"0 0 20px #00dd5544" },
  "MODERATE":   { color:"#00aaff", bg:"rgba(0,170,255,0.08)", border:"#00aaff", glow:"0 0 15px #00aaff33" },
  "WEAK":       { color:"#ffaa00", bg:"rgba(255,170,0,0.08)", border:"#ffaa00", glow:"none" },
  "WAIT":       { color:"#445566", bg:"rgba(0,0,0,0.2)",       border:"#1e3040", glow:"none" },
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
    if (tier==="ELITE ULTRA") { b(880,0,0.1,0.5);b(1100,0.12,0.1,0.5);b(1320,0.24,0.1,0.5);b(1760,0.36,0.15,0.5);b(2200,0.52,0.2,0.5); }
    else if (tier==="STRONG") { b(880,0,0.15);b(1100,0.2,0.15);b(1320,0.4,0.2); }
    else { b(660,0,0.1);b(880,0.15,0.15); }
  } catch(e){}
}

// ── Mega Chart with drawings ──────────────────────────────────────
function MegaChart({ candles, analysis, dark, pair, tf }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastX = useRef(0);

  if (!candles||candles.length<3) return (
    <div style={{ height:320, background:"#0a0a0a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
      <div style={{ fontSize:24 }}>📊</div>
      <div style={{ fontSize:11, color:"#4499ff", fontFamily:"monospace" }}>Connecting... ({candles?.length||0} candles)</div>
    </div>
  );

  const H=340, AXIS_W=70, PB=24, PT=14;
  const chartH=H-PB-PT;
  const display=[...candles].slice(0,80).reverse();
  const dec=2;
  const cw=Math.max(4,10*zoom);
  const CANDLE_W=Math.max(600, display.length*(cw+1)+80);
  const W=CANDLE_W+AXIS_W;

  const allHighs=display.map(c=>c.high), allLows=display.map(c=>c.low);
  const rawMax=Math.max(...allHighs), rawMin=Math.min(...allLows);
  const pad=(rawMax-rawMin)*0.08;
  const hi=rawMax+pad, lo=rawMin-pad, range=hi-lo||0.0001;

  const toY=p=>PT+((hi-p)/range)*chartH;
  const toX=i=>i*(cw+1)+cw/2;
  const current=candles[0]?.close;
  const prevClose=candles[1]?.close;
  const priceUp=current>=(prevClose||current);
  const priceColor=priceUp?"#00cc88":"#ff2244";

  // Grid
  const gridCount=6;
  const rawStep=range/gridCount;
  const mag=Math.pow(10,Math.floor(Math.log10(rawStep)));
  const niceStep=Math.ceil(rawStep/mag)*mag;
  const firstGrid=Math.ceil(lo/niceStep)*niceStep;
  const hGrids=[];
  for(let p=firstGrid;p<=hi;p+=niceStep) hGrids.push(parseFloat(p.toFixed(dec)));

  const vStep=Math.max(5,Math.floor(display.length/8));
  const vGrids=Array.from({length:Math.floor(display.length/vStep)},(_,i)=>i*vStep);

  // Ghost candles (predictions)
  const preds = analysis?.predictions||[];
  const ghostX = i => CANDLE_W + 10 + i*(cw+2) + cw/2;

  // Fib levels
  const fibs = analysis?.fibLevels||[];

  const onWheel=e=>{e.stopPropagation();e.preventDefault();setZoom(z=>Math.max(0.3,Math.min(6,z+(e.deltaY<0?0.2:-0.2))));};
  const onMD=e=>{dragging.current=true;lastX.current=e.clientX;};
  const onMM=e=>{if(!dragging.current)return;if(containerRef.current)containerRef.current.scrollLeft+=lastX.current-e.clientX;lastX.current=e.clientX;};
  const onMU=()=>{dragging.current=false;};
  const onTS=e=>{lastX.current=e.touches[0].clientX;};
  const onTM=e=>{e.stopPropagation();if(containerRef.current)containerRef.current.scrollLeft+=lastX.current-e.touches[0].clientX;lastX.current=e.touches[0].clientX;};

  const totalW = CANDLE_W + AXIS_W + preds.length*(cw+2)+20;

  return (
    <div style={{ borderRadius:8, overflow:"hidden", border:"1px solid #1e3040", marginBottom:12 }}>
      {/* Header */}
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
        {/* Scrollable candle area */}
        <div ref={containerRef} onWheel={onWheel}
          onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
          onTouchStart={onTS} onTouchMove={onTM}
          style={{ flex:1, overflowX:"auto", overflowY:"hidden", cursor:"grab", touchAction:"pan-x" }}>
          <svg width={totalW} height={H} style={{ display:"block" }}>
            <rect width={totalW} height={H} fill="#0a0a0a"/>

            {/* Fib levels */}
            {fibs.map((f,i)=>(
              <g key={i}>
                <line x1={0} y1={toY(f.price)} x2={CANDLE_W} y2={toY(f.price)}
                  stroke="#8844ff33" strokeWidth="0.5" strokeDasharray="3,5"/>
                <text x={4} y={toY(f.price)-2} fontSize="6.5" fill="#8844ff88" fontFamily="monospace">
                  {(f.ratio*100).toFixed(1)}%
                </text>
              </g>
            ))}

            {/* OB box */}
            {analysis?.smc?.ob && (
              <rect x={0} y={toY(display[2]?.high||hi)} width={CANDLE_W}
                height={Math.abs(toY(display[2]?.high||hi)-toY(display[2]?.low||lo))}
                fill={analysis.signal==="RISE"?"#00dd5511":"#ff224411"}
                stroke={analysis.signal==="RISE"?"#00dd5533":"#ff224433"} strokeWidth="0.5"/>
            )}

            {/* FVG zone */}
            {analysis?.smc?.fvg && (
              <rect x={0} y={toY(Math.max(display[0]?.low||lo, display[2]?.high||hi))}
                width={CANDLE_W}
                height={Math.abs(toY(display[0]?.low||lo)-toY(display[2]?.high||hi))}
                fill={analysis.signal==="RISE"?"#00dd5508":"#ff224408"}/>
            )}

            {/* Vertical grid */}
            {vGrids.map((gi,i)=>(
              <line key={i} x1={toX(gi)} y1={PT} x2={toX(gi)} y2={H-PB}
                stroke="#1e304044" strokeWidth="0.5" strokeDasharray="3,4"/>
            ))}

            {/* Horizontal grid */}
            {hGrids.map((p,i)=>(
              <line key={i} x1={0} y1={toY(p)} x2={CANDLE_W} y2={toY(p)}
                stroke="#1e3040" strokeWidth="0.5" strokeDasharray="4,4"/>
            ))}

            {/* TP/SL lines */}
            {analysis?.signal!=="WAIT" && analysis?.tp1 && (
              <>
                <line x1={0} y1={toY(parseFloat(analysis.sl))} x2={CANDLE_W} y2={toY(parseFloat(analysis.sl))} stroke="#ff2244" strokeWidth="1" strokeDasharray="5,3"/>
                <line x1={0} y1={toY(parseFloat(analysis.tp1))} x2={CANDLE_W} y2={toY(parseFloat(analysis.tp1))} stroke="#00dd55" strokeWidth="1" strokeDasharray="5,3"/>
                <line x1={0} y1={toY(parseFloat(analysis.tp2))} x2={CANDLE_W} y2={toY(parseFloat(analysis.tp2))} stroke="#00ff88" strokeWidth="1" strokeDasharray="5,3"/>
                <text x={4} y={toY(parseFloat(analysis.sl))-2} fontSize="7" fill="#ff2244" fontFamily="monospace">SL</text>
                <text x={4} y={toY(parseFloat(analysis.tp1))-2} fontSize="7" fill="#00dd55" fontFamily="monospace">TP1</text>
                <text x={4} y={toY(parseFloat(analysis.tp2))-2} fontSize="7" fill="#00ff88" fontFamily="monospace">TP2</text>
              </>
            )}

            {/* Entry line */}
            {analysis?.entry && (
              <line x1={0} y1={toY(parseFloat(analysis.entry))} x2={CANDLE_W} y2={toY(parseFloat(analysis.entry))}
                stroke="#ffffff33" strokeWidth="1" strokeDasharray="3,3"/>
            )}

            {/* Current price guide */}
            {current && (
              <line x1={0} y1={toY(current)} x2={CANDLE_W} y2={toY(current)}
                stroke="#33445566" strokeWidth="1" strokeDasharray="4,4"/>
            )}

            {/* Candles */}
            {display.map((c,i)=>{
              const bull=c.close>=c.open, col=bull?"#00dd55":"#ff2244";
              const x=toX(i), bTop=Math.min(toY(c.open),toY(c.close));
              const bH=Math.max(1.5,Math.abs(toY(c.close)-toY(c.open)));
              return (
                <g key={i}>
                  <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={col} strokeWidth="1"/>
                  <rect x={x-cw/2} y={bTop} width={cw} height={bH} fill={col}/>
                </g>
              );
            })}

            {/* Ghost candles (predictions) */}
            {preds.map((p,i)=>{
              const x=ghostX(i);
              const dir=p.direction==="UP";
              const col=dir?"#8844ff":"#4488ff";
              const midY=toY(current||0);
              const size=(p.size||0.001)*5000;
              const top=midY-(dir?size:0);
              const bH=Math.max(4,Math.min(size,40));
              return (
                <g key={i} opacity="0.5">
                  <line x1={x} y1={top-10} x2={x} y2={top+bH+10} stroke={col} strokeWidth="1"/>
                  <rect x={x-cw/2} y={top} width={cw} height={bH} fill={col} opacity="0.6"/>
                  <text x={x} y={top-14} fontSize="7" fill={col} textAnchor="middle" fontFamily="monospace" fontWeight="bold">C{p.n}</text>
                  <text x={x} y={top+bH+18} fontSize="6.5" fill={col} textAnchor="middle" fontFamily="monospace">{p.confidence}%</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Fixed price axis */}
        <svg width={AXIS_W} height={H} style={{ display:"block", flexShrink:0, background:"#0a0a0a" }}>
          <line x1={0} y1={PT} x2={0} y2={H-PB} stroke="#1e3040" strokeWidth="1"/>
          {hGrids.map((p,i)=>(
            <text key={i} x={5} y={toY(p)+3} fontSize="7.5" fill="#445566" fontFamily="monospace">{p.toFixed(dec)}</text>
          ))}
          {current && (
            <g>
              <rect x={1} y={toY(current)-9} width={AXIS_W-2} height={17} fill={priceColor} rx="3"/>
              <text x={AXIS_W/2} y={toY(current)+4} fontSize="8" fill="#fff" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{current.toFixed(dec)}</text>
            </g>
          )}
          {analysis?.rsi && (
            <g>
              <rect x={4} y={H-PB+3} width={AXIS_W-8} height={14} fill="#00888833" rx="3"/>
              <text x={AXIS_W/2} y={H-PB+13} fontSize="7.5" fill="#00ccaa" textAnchor="middle" fontFamily="monospace" fontWeight="bold">RSI {analysis.rsi}</text>
            </g>
          )}
        </svg>
      </div>

      <div style={{ padding:"3px 10px", fontSize:8, color:"#334455", fontFamily:"monospace",
        display:"flex", justifyContent:"space-between", background:"#050a0f" }}>
        <span>drag · scroll to zoom · purple = predicted candles</span>
        <span>{display.length} candles</span>
      </div>
    </div>
  );
}

// ── Dashboard Panel ──────────────────────────────────────────────
function Dashboard({ analysis, dark }) {
  if (!analysis) return null;
  const tc = TIER_CONFIG[analysis.tier]||TIER_CONFIG["WAIT"];
  const cats = analysis.categories||{};
  const rows = [
    ["SCORE",       `${analysis.totalScore}/30`, tc.color],
    ["TIER",        analysis.tier, tc.color],
    ["BULL %",      `${analysis.bullPct}%`, "#00dd55"],
    ["BEAR %",      `${analysis.bearPct}%`, "#ff2244"],
    ["RSI",         analysis.rsi||"N/A", parseFloat(analysis.rsi)>50?"#00dd55":"#ff2244"],
    ["MACD",        analysis.macd?"BULL":"BEAR", analysis.macd?"#00dd55":"#ff2244"],
    ["ADX",         analysis.adx||"N/A", "#4499ff"],
    ["STOCH",       analysis.stoch||"N/A", "#8899aa"],
    ["VOLUME",      analysis.volSpike?"SPIKE ✅":"NORMAL", analysis.volSpike?"#00dd55":"#445566"],
    ["SMC",         analysis.smc?.signals?.join(", ")||"None", "#8844ff"],
    ["PATTERN",     analysis.pattern||"None", "#ffd700"],
    ["CHART PAT",   analysis.chart?.name||"None", "#ffd700"],
    ["SESSION",     analysis.session||"N/A", "#ffaa00"],
    ["TREND",       `${cats.trendScore||0}/5`, "#4499ff"],
    ["MOMENTUM",    `${cats.momScore||0}/4`, "#4499ff"],
    ["VOLUME SC",   `${cats.volumeScore||0}/3`, "#4499ff"],
    ["SMC SCORE",   `${cats.smcScore||0}/5`, "#8844ff"],
    ["MTF",         `${cats.mtfScore||0}/3`, "#4499ff"],
  ];
  return (
    <div style={{ background:"#0a0a0a", border:`1px solid ${tc.border}33`, borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
      <div style={{ fontSize:9, letterSpacing:2, color:"#445566", fontFamily:"monospace", fontWeight:700, marginBottom:8 }}>📊 LIVE DASHBOARD</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px 12px" }}>
        {rows.map(([l,v,c])=>(
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #1e304022" }}>
            <span style={{ fontSize:8, color:"#445566", fontFamily:"monospace" }}>{l}</span>
            <span style={{ fontSize:8, color:c||"#c8d8e8", fontFamily:"monospace", fontWeight:700 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Signal Card ──────────────────────────────────────────────────
function SignalCard({ analysis, onClose }) {
  const [showCats, setShowCats] = useState(false);
  if (!analysis||analysis.signal==="WAIT") return null;
  const tc = TIER_CONFIG[analysis.tier]||TIER_CONFIG["MODERATE"];
  const sc = analysis.signal==="RISE"?"#00dd55":"#ff2244";
  const cats = analysis.categories||{};

  return (
    <div style={{ background:analysis.signal==="RISE"?"#001a0d":"#1a0005",
      border:`3px solid ${sc}`, borderRadius:14, padding:"18px 16px", marginBottom:14,
      boxShadow:tc.glow, position:"relative" }}>
      <button onClick={onClose} style={{ position:"absolute",top:10,right:12,background:"none",border:"none",color:"#445566",cursor:"pointer",fontSize:20 }}>×</button>

      {/* Tier badge */}
      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{ display:"inline-block", background:tc.bg, border:`2px solid ${tc.color}`,
          borderRadius:20, padding:"3px 16px", fontSize:10, color:tc.color, fontFamily:"monospace",
          fontWeight:700, letterSpacing:2, marginBottom:8 }}>
          {analysis.tier==="ELITE ULTRA"?"💎 ELITE ULTRA":"⭐".repeat(analysis.tier==="STRONG"?3:analysis.tier==="MODERATE"?2:1)+" "+analysis.tier}
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:48, fontWeight:900, color:sc, lineHeight:1 }}>
          {analysis.signal==="RISE"?"▲":"▼"}
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:28, fontWeight:900, color:sc }}>{analysis.signal}</div>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, color:sc }}>{analysis.totalScore}/30 POINTS</div>
        <div style={{ fontSize:10, color:"#8899aa", fontFamily:"monospace", marginTop:4 }}>
          {analysis.session} · {analysis.pattern} · {analysis.chart?.name!=="None"?analysis.chart?.name:""}
        </div>
      </div>

      {/* Score bars */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontSize:9, color:"#00dd55", fontFamily:"monospace" }}>RISE {analysis.bullPct}%</span>
          <span style={{ fontSize:9, color:"#445566", fontFamily:"monospace" }}>{analysis.bullVotes}↑ {analysis.bearVotes}↓</span>
          <span style={{ fontSize:9, color:"#ff2244", fontFamily:"monospace" }}>FALL {analysis.bearPct}%</span>
        </div>
        <div style={{ height:8, background:"#0a1520", borderRadius:4, overflow:"hidden", display:"flex" }}>
          <div style={{ width:`${analysis.bullPct}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)" }}/>
          <div style={{ width:`${analysis.bearPct}%`, background:"linear-gradient(90deg,#cc2244,#ff2244)" }}/>
        </div>
      </div>

      {/* Category scores */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5, marginBottom:14 }}>
        {[
          ["TREND",cats.trendScore,5],["MOM",cats.momScore,4],["VOL",cats.volScore+cats.volumeScore,5],
          ["SMC",cats.smcScore,5],["CANDLE",cats.candleScore,2],["CHART",cats.chartScore,3],
          ["MTF",cats.mtfScore,3],["OSC",cats.oscScore,3],
        ].map(([l,v,m])=>(
          <div key={l} style={{ background:"#0a1520", borderRadius:5, padding:"5px 6px", textAlign:"center" }}>
            <div style={{ fontSize:7, color:"#445566", fontFamily:"monospace" }}>{l}</div>
            <div style={{ fontSize:11, color:v>=m*0.7?"#00dd55":v>=m*0.4?"#ffaa00":"#ff2244", fontFamily:"monospace", fontWeight:700 }}>{v}/{m}</div>
          </div>
        ))}
      </div>

      {/* Entry/Exit */}
      <div style={{ background:"#0a1520", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {[
            ["🎯 ENTRY",analysis.entry,"#4499ff"],
            ["🛑 STOP LOSS",analysis.sl,"#ff2244"],
            ["✅ TP1 (R:R "+analysis.rr1+")",analysis.tp1,"#00dd55"],
            ["✅✅ TP2 (R:R "+analysis.rr2+")",analysis.tp2,"#00ff88"],
          ].map(([l,v,c])=>(
            <div key={l} style={{ background:"#050a0f", borderRadius:5, padding:"6px 8px" }}>
              <div style={{ fontSize:8, color:"#445566", fontFamily:"monospace", marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:11, color:c, fontFamily:"monospace", fontWeight:700 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, fontSize:9, color:"#ffaa00", fontFamily:"monospace" }}>
          ⚠️ Move SL to entry when TP1 is hit
        </div>
      </div>

      {/* 5 Ghost candle predictions */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:"#8844ff", fontFamily:"monospace", fontWeight:700, marginBottom:8 }}>
          🔮 NEXT 5 CANDLE PREDICTIONS
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:5 }}>
          {analysis.predictions?.map(p=>{
            const up=p.direction==="UP";
            const col=up?"#8844ff":"#4488ff";
            return (
              <div key={p.n} style={{ background:"#0a1520", border:`1px solid ${col}44`, borderRadius:7, padding:"8px 4px", textAlign:"center", borderTop:`3px solid ${col}` }}>
                <div style={{ fontSize:8, color:"#445566", fontFamily:"monospace", marginBottom:3 }}>C{p.n}</div>
                <div style={{ fontSize:16, color:col }}>{up?"▲":"▼"}</div>
                <div style={{ fontSize:11, color:col, fontWeight:700, fontFamily:"monospace" }}>{p.confidence}%</div>
                <div style={{ fontSize:7, color:"#445566", marginTop:2 }}>{p.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SMC signals */}
      {analysis.smc?.signals?.length>0 && (
        <div style={{ marginBottom:12, display:"flex", flexWrap:"wrap", gap:5 }}>
          {analysis.smc.signals.map(s=>(
            <span key={s} style={{ background:"#8844ff22", border:"1px solid #8844ff44", color:"#aa66ff",
              fontSize:9, padding:"2px 8px", borderRadius:4, fontFamily:"monospace" }}>{s}</span>
          ))}
        </div>
      )}

      {/* CTA */}
      <a href="https://dtrader.deriv.com" target="_blank" rel="noopener noreferrer"
        style={{ display:"block", padding:"14px", background:`linear-gradient(135deg,${sc},${sc}99)`,
          color:analysis.signal==="RISE"?"#000":"#fff", borderRadius:10, fontSize:12, fontWeight:900,
          textDecoration:"none", textAlign:"center", letterSpacing:2, marginTop:8 }}>
        📈 OPEN {analysis.signal} TRADE ON DERIV →
      </a>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function DerivSignals({ dark }) {
  const [selectedPair, setSelectedPair] = useState(VOLATILITY_PAIRS[0]);
  const [timeframe,    setTimeframe]    = useState(TIMEFRAMES[0]);
  const [candles,      setCandles]      = useState([]);
  const [livePrice,    setLivePrice]    = useState(null);
  const [analysis,     setAnalysis]     = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [wsStatus,     setWsStatus]     = useState("disconnected");
  const [soundOn,      setSoundOn]      = useState(true);
  const [autoScan,     setAutoScan]     = useState(false);
  const [showDash,     setShowDash]     = useState(true);
  const wsRef    = useRef(null);
  const candlesRef = useRef([]);
  const autoRef  = useRef(null);
  const priceTimer = useRef(null);
  const [displayPrice, setDisplayPrice] = useState(null);

  const connectWS = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    setWsStatus("connecting"); setError(""); setCandles([]); candlesRef.current=[];
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
    wsRef.current = ws;
    ws.onopen = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({ ticks:selectedPair.symbol, subscribe:1 }));
      ws.send(JSON.stringify({ ticks_history:selectedPair.symbol, count:100, end:"latest", granularity:timeframe.value, style:"candles", subscribe:1 }));
    };
    ws.onmessage = e => {
      const d = JSON.parse(e.data);
      if (d.msg_type==="tick") {
        // Throttle price display to 500ms
        clearTimeout(priceTimer.current);
        priceTimer.current = setTimeout(()=>setDisplayPrice(d.tick?.quote), 500);
        setLivePrice(d.tick?.quote);
      }
      if (d.msg_type==="candles") {
        const c=(d.candles||[]).map(k=>({ open:parseFloat(k.open),high:parseFloat(k.high),low:parseFloat(k.low),close:parseFloat(k.close),time:k.epoch })).reverse();
        candlesRef.current=c; setCandles([...c]);
      }
      if (d.msg_type==="ohlc"&&d.ohlc&&candlesRef.current.length>0) {
        const o=d.ohlc, u=[...candlesRef.current];
        u[0]={...u[0],close:parseFloat(o.close),high:Math.max(u[0].high,parseFloat(o.high)),low:Math.min(u[0].low,parseFloat(o.low))};
        candlesRef.current=u; setCandles([...u]);
      }
      if (d.error) setError(d.error.message);
    };
    ws.onerror=()=>{setWsStatus("error");setError("WebSocket error");};
    ws.onclose=()=>setWsStatus("disconnected");
  }, [selectedPair, timeframe]);

  useEffect(()=>{ connectWS(); return ()=>{ wsRef.current?.close(); clearTimeout(priceTimer.current); }; }, [selectedPair, timeframe]);

  useEffect(()=>{
    clearInterval(autoRef.current);
    if (autoScan) {
      autoRef.current=setInterval(()=>{
        if (candlesRef.current.length>=30) getSignal();
      }, 60000);
    }
    return ()=>clearInterval(autoRef.current);
  }, [autoScan]);

  const getSignal = async () => {
    if (candlesRef.current.length<30) { setError("Need 30+ candles — wait a moment"); return; }
    setLoading(true); setError("");
    try {
      // Send WebSocket candles directly to server - no TwelveData needed
      const res = await fetch(`${SERVER}/mega/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candles: candlesRef.current,
          htfCandles: [],
          symbol: selectedPair.symbol,
          tf: timeframe.tf,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const ct = res.headers.get("content-type")||"";
      if (!ct.includes("json")) { setError("Server starting up — wait 30s and retry"); setLoading(false); return; }
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setAnalysis(data);
      if (data.signal!=="WAIT"&&soundOn) playAlert(data.tier);
    } catch(e) {
      setError(e.name==="AbortError"?"Request timed out — retry":e.message);
    }
    setLoading(false);
  };

  const t = { bg:"#0a0a0a", bgCard:"#0d0d0d", border:"#1e3040", muted:"#445566", dim:"#334455" };

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes glow{0%,100%{box-shadow:0 0 10px #8844ff44}50%{box-shadow:0 0 30px #8844ff88}}
        .dspin{animation:spin 1s linear infinite;display:inline-block}
        .dblink{animation:blink 1s infinite}
        .dglow{animation:glow 2s infinite}
        .dbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .dbtn:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}
        .dbtn:disabled{opacity:0.4;cursor:not-allowed}
        .dchip{cursor:pointer;transition:all 0.12s;user-select:none;font-family:'IBM Plex Mono',monospace}
        .dchip:hover{transform:scale(1.04)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #8844ff44", borderRadius:12,
          padding:"12px 16px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900,
                color:"#fff", letterSpacing:2, marginBottom:2 }}>
                💎 PRINCEX IQ MEGA SIGNALS
              </div>
              <div style={{ fontSize:9, color:t.muted }}>
                30-POINT CONFLUENCE · 9 CATEGORIES · 5 CANDLE PREDICTION · DERIV VOLATILITY
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div className={wsStatus==="connected"?"dblink":""} style={{ width:8, height:8, borderRadius:"50%",
                background:wsStatus==="connected"?"#00dd55":wsStatus==="connecting"?"#ffaa00":"#ff4466" }}/>
              <span style={{ fontSize:8, color:wsStatus==="connected"?"#00dd55":"#ff4466", fontWeight:700 }}>
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
            📊 SELECT VOLATILITY PAIR
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {VOLATILITY_PAIRS.map(p=>(
              <div key={p.symbol} className="dchip"
                onClick={()=>{ setSelectedPair(p); setAnalysis(null); setError(""); }}
                style={{ padding:"6px 12px",
                  background:selectedPair.symbol===p.symbol?"#8844ff":"transparent",
                  border:`2px solid ${selectedPair.symbol===p.symbol?"#8844ff":t.border}`,
                  color:selectedPair.symbol===p.symbol?"#fff":t.muted,
                  borderRadius:6, fontSize:10, fontWeight:700 }}>
                {p.short}
              </div>
            ))}
          </div>
        </div>

        {/* Timeframe */}
        <div style={{ display:"flex", gap:5, marginBottom:12 }}>
          {TIMEFRAMES.map(tf=>(
            <button key={tf.value} className="dbtn" onClick={()=>{ setTimeframe(tf); setAnalysis(null); }}
              style={{ flex:1, padding:"9px", background:timeframe.value===tf.value?"#8844ff":"transparent",
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
              {displayPrice?.toFixed(2)||"---"}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:t.muted }}>Candles loaded</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#8844ff" }}>
              {candles.length}
            </div>
          </div>
        </div>

        {/* Chart */}
        <MegaChart candles={candles} analysis={analysis} dark={dark} pair={selectedPair.symbol} tf={timeframe.label} />

        {/* Error */}
        {error && (
          <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:8,
            padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} className="dbtn" style={{ background:"none", color:"#ff5577", fontSize:18, padding:0 }}>×</button>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8, marginBottom:14 }}>
          <button className={`dbtn${analysis?.tier==="ELITE ULTRA"?" dglow":""}`}
            onClick={getSignal} disabled={loading||candles.length<30}
            style={{ padding:"16px", background:"linear-gradient(135deg,#8844ff,#6622dd)",
              color:"#fff", borderRadius:10, fontSize:13, letterSpacing:2 }}>
            {loading?<><span className="dspin">⟳</span> ANALYZING 30 POINTS...</>:"💎 GET MEGA SIGNAL"}
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

        {/* Dashboard toggle */}
        <button className="dbtn" onClick={()=>setShowDash(!showDash)}
          style={{ width:"100%", background:"transparent", border:`1px solid ${t.border}`, color:t.muted,
            padding:"6px", borderRadius:6, fontSize:9, marginBottom:showDash?10:14, letterSpacing:1 }}>
          {showDash?"▲ HIDE DASHBOARD":"▼ SHOW DASHBOARD"}
        </button>

        {/* Dashboard */}
        {showDash && <Dashboard analysis={analysis} dark={dark} />}

        {/* Signal card */}
        {analysis && analysis.signal!=="WAIT" && (
          <SignalCard analysis={analysis} onClose={()=>setAnalysis(null)} />
        )}

        {/* WAIT message */}
        {analysis && analysis.signal==="WAIT" && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:18, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, color:"#445566", marginBottom:4 }}>WAIT</div>
            <div style={{ fontSize:11, color:t.muted }}>Score: {analysis.totalScore}/30 — Need 16+ for signal</div>
            <div style={{ fontSize:10, color:t.dim, marginTop:4 }}>Market not ready — wait for better confluence</div>
          </div>
        )}

        {/* No signal yet */}
        {!analysis && !loading && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:20, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>💎</div>
            <div style={{ fontSize:11, color:t.muted, marginBottom:4 }}>30-Point Mega Signal Engine</div>
            <div style={{ fontSize:10, color:t.dim, lineHeight:1.8 }}>
              {candles.length>=30?"✅ Ready — tap GET MEGA SIGNAL":`⏳ Loading candles... (${candles.length}/30)`}
            </div>
          </div>
        )}

        {/* Deriv CTA */}
        <div style={{ background:"#0a0510", border:"1px solid #8844ff33", borderRadius:10, padding:"14px 16px", marginTop:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#aa66ff", fontWeight:700, marginBottom:3 }}>📈 TRADE ON DERIV</div>
              <div style={{ fontSize:9, color:t.muted }}>Rise/Fall · Volatility Indices · No expiry</div>
            </div>
            <a href="https://dtrader.deriv.com" target="_blank" rel="noopener noreferrer"
              style={{ padding:"10px 18px", background:"linear-gradient(135deg,#8844ff,#6622dd)", color:"#fff",
                borderRadius:8, fontSize:10, fontWeight:700, textDecoration:"none", letterSpacing:1 }}>
              OPEN DERIV →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
