import { useState, useEffect, useRef } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const PAIRS = [
  "EUR/USD","GBP/USD","USD/JPY","AUD/USD",
  "USD/CAD","EUR/GBP","USD/CHF","EUR/JPY",
  "XAU/USD","BTC/USD","ETH/USD",
];

function BuyerBar({ buyers, sellers, dark }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:10, color:"#00dd55", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
          👥 BUYERS {buyers}%
        </span>
        <span style={{ fontSize:10, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
          SELLERS {sellers}% 👥
        </span>
      </div>
      <div style={{ height:10, background:dark?"#0a1520":"#e0eaf4", borderRadius:5, overflow:"hidden", display:"flex", position:"relative" }}>
        <div style={{ width:`${buyers}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)", borderRadius:"5px 0 0 5px", transition:"width 0.5s" }} />
        <div style={{ width:`${sellers}%`, background:"linear-gradient(90deg,#dd2244,#ff2244)", borderRadius:"0 5px 5px 0", transition:"width 0.5s" }} />
      </div>
      <div style={{ textAlign:"center", marginTop:4, fontSize:9, color:dark?"#445566":"#778899", fontFamily:"'IBM Plex Mono',monospace" }}>
        {buyers > sellers ? `${buyers-sellers}% more buyers — ${buyers>=70?"Strong BUY pressure":buyers>=60?"Moderate BUY":"Slight BUY bias"}` :
         sellers > buyers ? `${sellers-buyers}% more sellers — ${sellers>=70?"Strong SELL pressure":sellers>=60?"Moderate SELL":"Slight SELL bias"}` :
         "Market balanced — no clear direction"}
      </div>
    </div>
  );
}

function CandlePredict({ candle, dark }) {
  const isUp = candle.direction === "UP";
  const color = isUp ? "#00dd55" : "#ff2244";
  const bg = isUp ? (dark?"#001a0d":"#e8fff3") : (dark?"#1a0005":"#fff0f3");

  return (
    <div style={{ background:bg, border:`2px solid ${color}33`, borderRadius:10, padding:"12px 10px", borderTop:`3px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:9, color:dark?"#667788":"#556677", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>
          CANDLE #{candle.number}
        </span>
        <span style={{ background:color+"22", color, fontSize:10, padding:"2px 8px", borderRadius:4, fontWeight:900, fontFamily:"'IBM Plex Mono',monospace" }}>
          {isUp?"▲ UP":"▼ DOWN"}
        </span>
      </div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:24, fontWeight:900, color, marginBottom:2 }}>
        {candle.confidence}%
      </div>
      <div style={{ fontSize:9, color:dark?"#667788":"#556677", fontFamily:"'IBM Plex Mono',monospace", marginBottom:8 }}>
        {candle.strength}
      </div>
      <div style={{ height:5, background:dark?"#0a1520":"#e0eaf4", borderRadius:3, overflow:"hidden", marginBottom:8 }}>
        <div style={{ width:`${candle.confidence}%`, height:"100%", background:color, borderRadius:3, transition:"width 0.8s" }} />
      </div>
      <div style={{ fontSize:9, color:dark?"#8899aa":"#445566", fontFamily:"'IBM Plex Mono',monospace", lineHeight:1.5 }}>
        {candle.reason}
      </div>
    </div>
  );
}

function SignalCard({ sig, dark, expanded, onToggle }) {
  const sc = s => s==="BUY"?"#00dd55":s==="SELL"?"#ff2244":"#ffaa00";
  const sbg = s => s==="BUY"?(dark?"#001a0d":"#e8fff3"):s==="SELL"?(dark?"#1a0005":"#fff0f3"):(dark?"#1a1000":"#fffbe8");

  const t = {
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
  };

  const timeAgo = ts => {
    if (!ts) return "";
    const d = Math.floor((Date.now()-new Date(ts))/1000);
    if (d<60) return `${d}s ago`;
    return `${Math.floor(d/60)}m ago`;
  };

  return (
    <div style={{ background:sbg(sig.signal), border:`2px solid ${sc(sig.signal)}44`, borderLeft:`5px solid ${sc(sig.signal)}`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>

      {/* Header row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, cursor:"pointer" }} onClick={onToggle}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ fontSize:18 }}>{sig.flag}</span>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, fontWeight:900, color:dark?"#fff":"#001133" }}>{sig.symbol}</span>
            <span style={{ fontSize:9, color:t.dim, background:dark?"#0a1520":"#e0eaf4", padding:"2px 6px", borderRadius:3, fontFamily:"'IBM Plex Mono',monospace" }}>1MIN</span>
          </div>
          <div style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>
            💰 {sig.price} · ⏱ {sig.expiry} · {timeAgo(sig.timestamp)}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:sc(sig.signal) }}>
            {sig.signal==="BUY"?"▲":sig.signal==="SELL"?"▼":"◆"} {sig.signal}
          </div>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, fontWeight:700, color:sc(sig.signal) }}>
            {sig.confidence}%
          </div>
        </div>
      </div>

      {/* Buyers/Sellers bar - always visible */}
      <BuyerBar buyers={sig.buyers} sellers={sig.sellers} dark={dark} />

      {/* Score bar */}
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontSize:9, color:"#00dd55", fontFamily:"'IBM Plex Mono',monospace" }}>BULL {sig.bullScore}%</span>
          <span style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>{sig.bullVotes}↑ {sig.bearVotes}↓ / {sig.totalVotes} indicators</span>
          <span style={{ fontSize:9, color:"#ff2244", fontFamily:"'IBM Plex Mono',monospace" }}>BEAR {sig.bearScore}%</span>
        </div>
        <div style={{ height:6, background:dark?"#0a1520":"#e0eaf4", borderRadius:3, overflow:"hidden", display:"flex" }}>
          <div style={{ width:`${sig.bullScore}%`, background:"linear-gradient(90deg,#00aa44,#00dd55)", transition:"width 0.5s" }} />
          <div style={{ width:`${sig.bearScore}%`, background:"linear-gradient(90deg,#dd2244,#ff2244)", transition:"width 0.5s" }} />
        </div>
      </div>

      {/* Pattern */}
      <div style={{ fontSize:10, color:dark?"#4499cc":"#0055aa", fontFamily:"'IBM Plex Mono',monospace", marginBottom:8 }}>
        📊 {sig.pattern} · {sig.trend}
      </div>

      {/* Next 3 candles preview - always visible */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:8 }}>
          NEXT 3 CANDLES PREDICTION
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {(sig.next3candles||[]).map(c => (
            <CandlePredict key={c.number} candle={c} dark={dark} />
          ))}
        </div>
      </div>

      {/* Expand button */}
      <button onClick={onToggle}
        style={{ width:"100%", background:"transparent", border:`1px solid ${sc(sig.signal)}33`, borderRadius:6, padding:"6px", fontSize:9, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", cursor:"pointer", fontWeight:700, letterSpacing:1 }}>
        {expanded ? "▲ HIDE DETAILS" : "▼ SHOW INDICATORS"}
      </button>

      {/* Expanded indicators */}
      {expanded && (
        <div style={{ marginTop:12, borderTop:`1px solid ${sc(sig.signal)}22`, paddingTop:12 }}>

          {/* TP/SL */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
            {[
              {l:"ENTRY", v:sig.entry, c:"#4499ff"},
              {l:"TP1",   v:sig.tp1,   c:"#00dd55"},
              {l:"TP2",   v:sig.tp2,   c:"#00ee77"},
              {l:"SL",    v:sig.sl,    c:"#ff2244"},
            ].map(({l,v,c})=>(
              <div key={l} style={{ background:dark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.05)", borderRadius:6, padding:"6px", textAlign:"center" }}>
                <div style={{ fontSize:8, color:t.label, fontFamily:"'IBM Plex Mono',monospace" }}>{l}</div>
                <div style={{ fontSize:9, color:c, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Indicators breakdown */}
          <div style={{ fontSize:9, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, marginBottom:8 }}>
            INDICATOR BREAKDOWN
          </div>
          {sig.indicators && Object.entries({
            "EMA Cross":  sig.indicators.emaCross,
            "EMA 50":     sig.indicators.ema50,
            "RSI 14":     sig.indicators.rsi,
            "MACD":       sig.indicators.macd,
            "VWAP":       sig.indicators.vwap,
            "SMA 20":     sig.indicators.sma20,
            "Supertrend": sig.indicators.supertrend,
            "Pattern":    sig.indicators.pattern,
            "Momentum":   sig.indicators.momentum,
          }).filter(([,d])=>d).map(([label, detail])=>(
            <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
              <span style={{ fontSize:9, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", width:80 }}>{label}</span>
              <span style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace", flex:1, textAlign:"center" }}>{detail.value}</span>
              <span style={{ fontSize:9, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace", color:detail.vote>0?"#00dd55":detail.vote<0?"#ff2244":"#ffaa00", width:60, textAlign:"right" }}>
                {detail.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PocketOptionAuto({ dark }) {
  const [signals, setSignals] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState(null);
  const [selectedPairs, setSelectedPairs] = useState(PAIRS);
  const [showPicker, setShowPicker] = useState(false);
  const intervalRef = useRef(null);

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
  };

  const fetchSignals = async () => {
    try {
      const res = await fetch(`${SERVER}/po/signals`);
      const data = await res.json();
      setSignals(data.signals || {});
      setLastUpdated(data.lastUpdated);
      setIsAnalyzing(data.isAnalyzing);
      setError(null);
    } catch(e) { setError("Server offline — retrying..."); }
    setLoading(false);
  };

  useEffect(() => {
    fetchSignals();
    intervalRef.current = setInterval(() => { if (running) fetchSignals(); }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const triggerNow = () => {
    fetch(`${SERVER}/po/trigger`).catch(()=>{});
    setTimeout(fetchSignals, 5000);
    setIsAnalyzing(true);
  };

  const timeAgo = ts => {
    if (!ts) return "Never";
    const d = Math.floor((Date.now()-new Date(ts))/1000);
    if (d<60) return `${d}s ago`;
    if (d<3600) return `${Math.floor(d/60)}m ago`;
    return `${Math.floor(d/3600)}h ago`;
  };

  const allSignals = Object.values(signals).filter(s => selectedPairs.includes(s.symbol));
  const filtered = filter==="ALL" ? allSignals
    : filter==="BUY"  ? allSignals.filter(s=>s.signal==="BUY")
    : filter==="SELL" ? allSignals.filter(s=>s.signal==="SELL")
    : filter==="FOREX"? allSignals.filter(s=>s.type==="forex")
    : allSignals.filter(s=>s.type==="crypto"||s.type==="commodity");

  const buys  = allSignals.filter(s=>s.signal==="BUY").length;
  const sells = allSignals.filter(s=>s.signal==="SELL").length;

  return (
    <div style={{ flex:1, background:t.bg, overflowY:"auto" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        .pospin{animation:spin 1s linear infinite;display:inline-block}
        .populse{animation:pulse 1.5s infinite}
        .pobtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .pobtn:hover{opacity:0.8}
        .pochip{cursor:pointer;transition:all 0.15s;user-select:none}
        .pochip:hover{transform:scale(1.04)}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div style={{ position:"relative", width:10, height:10 }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:running?"#00dd55":"#ff2244" }} />
                  {running && <div className="populse" style={{ position:"absolute", inset:-3, borderRadius:"50%", border:"2px solid #00dd5544" }} />}
                </div>
                <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:12, fontWeight:900, color:running?(dark?"#00dd55":"#009944"):"#ff2244", letterSpacing:2 }}>
                  POCKET OPTION AUTO
                </span>
              </div>
              <div style={{ fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>
                1MIN · 3 CANDLES EXPIRY · {allSignals.length} PAIRS SCANNED · Updated {timeAgo(lastUpdated)}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <button className="pobtn" onClick={triggerNow}
                style={{ background:"#0066ff22", border:"1px solid #0066ff44", color:"#4499ff", padding:"6px 12px", borderRadius:6, fontSize:9, letterSpacing:1 }}>
                ⟳ SCAN NOW
              </button>
              {running
                ? <button className="pobtn" onClick={()=>setRunning(false)} style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>⏹ STOP</button>
                : <button className="pobtn" onClick={()=>{setRunning(true);fetchSignals();}} style={{ background:"#00dd5522", border:"1px solid #00dd5533", color:"#00dd55", padding:"6px 12px", borderRadius:6, fontSize:9 }}>▶ START</button>
              }
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
          {[
            {l:"PAIRS",   v:allSignals.length,         c:dark?"#c8d8e8":"#1a2a3a"},
            {l:"BUY",     v:buys,                       c:"#00dd55"},
            {l:"SELL",    v:sells,                      c:"#ff2244"},
            {l:"WAIT",    v:allSignals.length-buys-sells, c:"#ffaa00"},
          ].map(({l,v,c})=>(
            <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
              <div style={{ fontSize:8, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", marginBottom:3 }}>{l}</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Pair picker */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showPicker?10:0 }}>
            <span style={{ fontSize:9, letterSpacing:2, color:t.label, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>WATCHING {selectedPairs.length} PAIRS</span>
            <button className="pobtn" onClick={()=>setShowPicker(!showPicker)}
              style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.muted, padding:"3px 10px", borderRadius:4, fontSize:9 }}>
              {showPicker?"DONE":"EDIT"}
            </button>
          </div>
          {showPicker && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {PAIRS.map(p=>(
                <div key={p} className="pochip" onClick={()=>setSelectedPairs(prev=>prev.includes(p)?prev.filter(x=>x!==p):[...prev,p])}
                  style={{ padding:"4px 10px", background:selectedPairs.includes(p)?"#0066ff22":"transparent", border:`1px solid ${selectedPairs.includes(p)?"#0066ff":t.border}`, color:selectedPairs.includes(p)?"#4499ff":t.muted, borderRadius:5, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700 }}>
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter */}
        <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
          {["ALL","BUY","SELL","FOREX","CRYPTO"].map(f=>(
            <button key={f} className="pobtn" onClick={()=>setFilter(f)}
              style={{ padding:"5px 12px", background:filter===f?"#ffd700":"transparent", border:`1px solid ${filter===f?"#ffd700":t.border}`, color:filter===f?"#000":t.muted, borderRadius:5, fontSize:9, letterSpacing:1 }}>
              {f}
            </button>
          ))}
        </div>

        {/* Status messages */}
        {isAnalyzing && (
          <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"8px 14px", marginBottom:12, display:"flex", gap:8, alignItems:"center" }}>
            <span className="pospin" style={{ color:"#4499ff" }}>⟳</span>
            <span style={{ fontSize:10, color:"#4499ff", fontFamily:"'IBM Plex Mono',monospace" }}>Scanning all pairs...</span>
          </div>
        )}
        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"8px 14px", marginBottom:12, fontSize:10, color:"#ff4466", fontFamily:"'IBM Plex Mono',monospace" }}>⚠ {error}</div>
        )}
        {loading && (
          <div style={{ textAlign:"center", padding:32 }}>
            <div className="pospin" style={{ fontSize:24, color:"#0066ff" }}>⟳</div>
            <div style={{ marginTop:8, fontSize:11, color:t.dim, fontFamily:"'IBM Plex Mono',monospace" }}>Loading Pocket Option signals...</div>
          </div>
        )}

        {/* No signals */}
        {!loading && filtered.length===0 && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:28, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📊</div>
            <div style={{ fontSize:12, color:t.muted, fontFamily:"'IBM Plex Mono',monospace", marginBottom:14 }}>
              {allSignals.length===0 ? "No signals yet — tap SCAN NOW" : `No ${filter} signals right now`}
            </div>
            <button className="pobtn" onClick={triggerNow}
              style={{ padding:"10px 24px", background:"linear-gradient(135deg,#0066ff,#0044bb)", color:"#fff", borderRadius:8, fontSize:11, letterSpacing:1 }}>
              ⚡ SCAN ALL PAIRS
            </button>
          </div>
        )}

        {/* Signal cards */}
        {filtered.map((sig,i)=>(
          <SignalCard
            key={sig.symbol}
            sig={sig}
            dark={dark}
            expanded={expanded===i}
            onToggle={()=>setExpanded(expanded===i?null:i)}
          />
        ))}

        {/* Footer */}
        {allSignals.length>0 && (
          <div style={{ marginTop:10, marginBottom:20, padding:"10px 14px", background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff22", borderRadius:8, fontSize:9, color:t.dim, fontFamily:"'IBM Plex Mono',monospace", textAlign:"center", lineHeight:1.8 }}>
            Auto-refreshes every 60 seconds · 1min timeframe · 3 candle expiry = 3 minutes<br/>
            Buyers/Sellers based on RSI, MACD, EMA, momentum · Not financial advice
          </div>
        )}

      </div>
    </div>
  );
}
