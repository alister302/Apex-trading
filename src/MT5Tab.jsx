import { useState, useEffect, useRef } from "react";

const SERVER = "https://princex-api.onrender.com";

const MT5_BROKERS = [
  { name:"Exness",    logo:"🟢", server:"mt5.exness.com:443",     signup:"https://one.exnessonelink.com/a/pzsnvvty6d" },
  { name:"XM",        logo:"🔵", server:"mt5.xm.com:443",         signup:"https://clicks.xm.com/landing" },
  { name:"OctaFX",    logo:"🟠", server:"mt5.octafx.com:443",      signup:"https://octafx.com/open-account" },
  { name:"FBS",       logo:"🔴", server:"mt5.fbs.com:443",         signup:"https://fbs.com/open-account" },
  { name:"HFM",       logo:"🟡", server:"mt5.hfm.com:443",         signup:"https://hfmarkets.com" },
  { name:"IC Markets",logo:"⚫", server:"mt5.icmarkets.com:443",   signup:"https://icmarkets.com" },
  { name:"Deriv CFDs", logo:"🔴", server:"mt5.deriv.com:443",        signup:"https://deriv.com/signup/" },
];

const PAIRS = ["EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","XAUUSD","GBPJPY","EURJPY"];
const DERIV_PAIRS = ["Boom 1000 Index","Boom 500 Index","Boom 300 Index","Crash 1000 Index","Crash 500 Index","Crash 300 Index","Volatility 10 Index","Volatility 25 Index","Volatility 50 Index","Volatility 75 Index","Volatility 100 Index","Step Index","Jump 10 Index","Jump 25 Index","Jump 50 Index","Jump 75 Index","Jump 100 Index"];

export default function MT5Tab({ dark }) {
  const [broker, setBroker]       = useState(null);
  const [login, setLogin]         = useState("");
  const [password, setPassword]   = useState("");
  const [connected, setConnected] = useState(false);
  const [account, setAccount]     = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [symbol, setSymbol]       = useState("EURUSD");
  const [lotSize, setLotSize]     = useState(0.01);
  const [tradeResult, setTradeResult] = useState(null);
  const [monitoring, setMonitoring]   = useState(false);
  const [monitorAll, setMonitorAll]   = useState(false);
  const [alerts, setAlerts]           = useState([]);
  const [ringing, setRinging]         = useState(false);
  const monitorRef = useRef(null);
  const audioRef   = useRef(null);
  const ringRef    = useRef(null);
  const [step, setStep]           = useState("broker"); // broker, login, dashboard

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
  };

  const connect = async () => {
    if (!login||!password||!broker) { setError("Fill all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SERVER}/mt5/connect`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ login, password, server:broker.server, broker:broker.name }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setAccount(data);
      setConnected(true);
      setStep("dashboard");
      localStorage.setItem("mt5_session", JSON.stringify({ login, broker:broker.name, server:broker.server }));
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const fetchPositions = async () => {
    if (!connected) return;
    try {
      const res = await fetch(`${SERVER}/mt5/positions`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ login, server:broker.server }),
      });
      const data = await res.json();
      setPositions(data.positions||[]);
    } catch(e) {}
  };

  useEffect(()=>{ if(connected) fetchPositions(); }, [connected]);

  const placeTrade = async (direction) => {
    setLoading(true); setTradeResult(null);
    try {
      const res = await fetch(`${SERVER}/mt5/trade`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ login, password, server:broker.server, symbol, direction, volume:lotSize }),
      });
      const data = await res.json();
      if (data.error) setTradeResult({ success:false, error:data.error });
      else { setTradeResult({ success:true, ticket:data.ticket }); fetchPositions(); }
    } catch(e) { setTradeResult({ success:false, error:e.message }); }
    setLoading(false);
  };

  const closePosition = async (ticket) => {
    try {
      await fetch(`${SERVER}/mt5/close`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ login, password, server:broker.server, ticket }),
      });
      fetchPositions();
    } catch(e) {}
  };

  const disconnect = () => {
    setConnected(false); setAccount(null); setPositions([]);
    setStep("broker"); setBroker(null);
    localStorage.removeItem("mt5_session");
  };


  // ─── EMA Calculation ───────────────────────────────────────────────────────
  const calcEMA = (prices, period) => {
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
    return ema;
  };

  // ─── Ring phone for 15 seconds ─────────────────────────────────────────────
  const ringPhone = (msg) => {
    setRinging(true);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let elapsed = 0;
    const interval = setInterval(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
      elapsed += 600;
      if (elapsed >= 15000) { clearInterval(interval); setRinging(false); }
    }, 600);
    ringRef.current = interval;
    setAlerts(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev.slice(0,19)]);
  };

  // ─── Check EMA crossover for one symbol ────────────────────────────────────
  const checkEMA = async (sym) => {
    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${sym}&interval=15min&outputsize=60&apikey=62e0549bbdc04d76a224157e22da6bbd`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.values || data.values.length < 51) return;
      const closes = data.values.map(v => parseFloat(v.close)).reverse();
      const prevCloses = closes.slice(0, -1);
      const ema20now  = calcEMA(closes, 20);
      const ema50now  = calcEMA(closes, 50);
      const ema20prev = calcEMA(prevCloses, 20);
      const ema50prev = calcEMA(prevCloses, 50);
      const bullCross = ema20prev < ema50prev && ema20now > ema50now;
      const bearCross = ema20prev > ema50prev && ema20now < ema50now;
      if (bullCross) ringPhone(`🟢 BULLISH CROSS on ${sym} — EMA20 crossed above EMA50!`);
      if (bearCross) ringPhone(`🔴 BEARISH CROSS on ${sym} — EMA20 crossed below EMA50!`);
    } catch(e) { console.log("EMA check error:", e); }
  };

  // ─── Start/Stop monitoring ──────────────────────────────────────────────────
  useEffect(() => {
    if (monitoring) {
      const pairs = monitorAll
        ? (broker?.name==="Deriv CFDs" ? DERIV_PAIRS.slice(0,5) : PAIRS)
        : [symbol];
      pairs.forEach(s => checkEMA(s));
      monitorRef.current = setInterval(() => {
        const p = monitorAll
          ? (broker?.name==="Deriv CFDs" ? DERIV_PAIRS.slice(0,5) : PAIRS)
          : [symbol];
        p.forEach(s => checkEMA(s));
      }, 60000);
    } else {
      clearInterval(monitorRef.current);
    }
    return () => clearInterval(monitorRef.current);
  }, [monitoring, monitorAll, symbol, broker]);

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`.mbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}.mbtn:hover{opacity:0.85}.mbtn:disabled{opacity:0.4;cursor:not-allowed}`}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #ffd70044", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ffd700", letterSpacing:2, marginBottom:2 }}>
                📊 MT5 BROKER CONNECTION
              </div>
              <div style={{ fontSize:9, color:t.dim }}>Connect your MT5 account · Trade from signals</div>
            </div>
            {connected && (
              <button className="mbtn" onClick={disconnect}
                style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>
                DISCONNECT
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:18 }}>×</button>
          </div>
        )}

        {/* Step 1 - Select broker */}
        {step==="broker" && (
          <div>
            <div style={{ fontSize:10, color:t.muted, fontWeight:700, letterSpacing:1, marginBottom:12 }}>SELECT YOUR BROKER</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {MT5_BROKERS.map(b=>(
                <div key={b.name} onClick={()=>{ setBroker(b); setStep("login"); }}
                  style={{ background:t.bgCard, border:`2px solid ${broker?.name===b.name?"#ffd700":t.border}`,
                    borderRadius:10, padding:"14px", cursor:"pointer", textAlign:"center",
                    transition:"all 0.15s" }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{b.logo}</div>
                  <div style={{ fontSize:12, color:dark?"#fff":"#001133", fontWeight:700 }}>{b.name}</div>
                  <div style={{ fontSize:8, color:t.dim, marginTop:3 }}>MT5</div>
                </div>
              ))}
            </div>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:10, color:"#ffd700", fontWeight:700, marginBottom:8 }}>DON'T HAVE AN ACCOUNT?</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {MT5_BROKERS.slice(0,3).map(b=>(
                  <a key={b.name} href={b.signup} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"8px 12px", background:dark?"#0a1520":"#f0f8ff",
                      border:`1px solid ${t.border}`, borderRadius:6, textDecoration:"none" }}>
                    <span style={{ fontSize:10, color:dark?"#fff":"#001133" }}>{b.logo} {b.name}</span>
                    <span style={{ fontSize:9, color:"#4499ff" }}>Open Account →</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 - Login */}
        {step==="login" && broker && (
          <div>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ fontSize:28 }}>{broker.logo}</div>
                <div>
                  <div style={{ fontSize:13, color:dark?"#fff":"#001133", fontWeight:700 }}>{broker.name}</div>
                  <div style={{ fontSize:9, color:t.dim }}>{broker.server}</div>
                </div>
              </div>

              <div style={{ fontSize:9, color:t.muted, marginBottom:5 }}>MT5 LOGIN (Account Number)</div>
              <input value={login} onChange={e=>setLogin(e.target.value)}
                placeholder="e.g. 12345678" type="number"
                style={{ width:"100%", padding:"12px 14px", background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",
                  border:`1px solid ${t.border}`, borderRadius:8, color:dark?"#c8d8e8":"#001133",
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:13, outline:"none",
                  marginBottom:10, boxSizing:"border-box" }}/>

              <div style={{ fontSize:9, color:t.muted, marginBottom:5 }}>MT5 PASSWORD</div>
              <input value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="Your MT5 password" type="password"
                style={{ width:"100%", padding:"12px 14px", background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",
                  border:`1px solid ${t.border}`, borderRadius:8, color:dark?"#c8d8e8":"#001133",
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:13, outline:"none",
                  marginBottom:6, boxSizing:"border-box" }}/>

              <div style={{ fontSize:9, color:"#ffaa00", marginBottom:14 }}>
                ⚠️ Use investor (read-only) password for safety, or trading password to place orders
              </div>

              <button className="mbtn" onClick={connect} disabled={loading}
                style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#ffd700,#cc9900)",
                  color:"#000", borderRadius:10, fontSize:13, letterSpacing:1 }}>
                {loading?"⟳ CONNECTING...":"🔗 CONNECT MT5"}
              </button>

              <button className="mbtn" onClick={()=>setStep("broker")}
                style={{ width:"100%", padding:"10px", background:"transparent",
                  border:`1px solid ${t.border}`, color:t.muted, borderRadius:8, fontSize:10, marginTop:8 }}>
                ← BACK
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Dashboard */}
        {step==="dashboard" && account && account.connected && (
          <div>
            {/* Account info */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                ["BALANCE",  `$${parseFloat(account?.balance||0).toFixed(2)}`,  "#00dd55"],
                ["EQUITY",   `$${parseFloat(account?.equity||0).toFixed(2)}`,   "#4499ff"],
                ["MARGIN",   `$${parseFloat(account?.margin||0).toFixed(2)}`,   "#ffaa00"],
              ].map(([l,v,c])=>(
                <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                  <div style={{ fontSize:7, color:t.dim, letterSpacing:1 }}>{l}</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"8px 12px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
              <div style={{ fontSize:9, color:t.dim }}>Account: {account?.login} · {broker?.name}</div>
              <div style={{ fontSize:9, color:account.isDemo?"#4499ff":"#ff4400", fontWeight:700 }}>
                {account?.isDemo?"🔵 DEMO":"🔴 LIVE"}
              </div>
            </div>



            {/* EMA Monitor */}
            <div style={{ background:t.bgCard, border:`2px solid ${monitoring?"#00dd55":"#0d2a42"}`, borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:10, color:"#00dd55", fontWeight:700, letterSpacing:1 }}>📡 EMA CROSSOVER MONITOR</div>
                  <div style={{ fontSize:8, color:t.dim, marginTop:2 }}>EMA 20 × EMA 50 · 15min · Rings 15s on cross</div>
                </div>
                {ringing && <div style={{ fontSize:9, color:"#ff4466", fontWeight:700, animation:"blink 0.5s infinite" }}>🔔 RINGING...</div>}
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                <button className="mbtn" onClick={()=>setMonitoring(m=>!m)}
                  style={{ padding:"10px 18px", background:monitoring?"#00dd5522":"transparent",
                    border:`2px solid ${monitoring?"#00dd55":"#0d2a42"}`,
                    color:monitoring?"#00dd55":t.muted, borderRadius:8, fontSize:10, fontWeight:700 }}>
                  {monitoring?"⏹ STOP":"▶ START MONITOR"}
                </button>
                <button className="mbtn" onClick={()=>setMonitorAll(m=>!m)}
                  style={{ padding:"10px 18px", background:monitorAll?"#4499ff22":"transparent",
                    border:`2px solid ${monitorAll?"#4499ff":"#0d2a42"}`,
                    color:monitorAll?"#4499ff":t.muted, borderRadius:8, fontSize:10, fontWeight:700 }}>
                  {monitorAll?"🌍 ALL MARKETS":"🎯 CURRENT PAIR"}
                </button>
                {ringing && (
                  <button className="mbtn" onClick={()=>{ clearInterval(ringRef.current); setRinging(false); }}
                    style={{ padding:"10px 18px", background:"#ff224422", border:"2px solid #ff4466",
                      color:"#ff4466", borderRadius:8, fontSize:10, fontWeight:700 }}>
                    🔕 STOP RING
                  </button>
                )}
              </div>
              {monitoring && (
                <div style={{ fontSize:9, color:"#4499ff", padding:"6px 10px", background:"#4499ff11", borderRadius:6, marginBottom:8 }}>
                  ✅ Monitoring {monitorAll?"ALL pairs":""+symbol} every 60s
                </div>
              )}
              {alerts.length > 0 && (
                <div style={{ maxHeight:140, overflowY:"auto" }}>
                  <div style={{ fontSize:9, color:t.dim, marginBottom:5, letterSpacing:1 }}>RECENT ALERTS</div>
                  {alerts.map((a,i)=>(
                    <div key={i} style={{ padding:"6px 8px", background:dark?"#0a1520":"#e8f4ff",
                      borderRadius:6, marginBottom:4, borderLeft:`3px solid ${a.msg.includes("BULLISH")?"#00dd55":"#ff4466"}` }}>
                      <div style={{ fontSize:8, color:t.dim }}>{a.time}</div>
                      <div style={{ fontSize:10, color:dark?"#fff":"#001133", fontWeight:700 }}>{a.msg}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* TradingView Chart */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, overflow:"hidden", marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderBottom:`1px solid ${t.border}` }}>
                <div style={{ fontSize:9, color:"#ffd700", fontWeight:700, letterSpacing:1 }}>📊 LIVE CHART</div>
                <div style={{ display:"flex", gap:4 }}>
                  {["1","5","15","60","240","D"].map(tf=>(
                    <button key={tf} className="mbtn"
                      onClick={()=>{
                        const s = broker?.name==="Deriv CFDs"
                          ? "VOLATILITY_10"
                          : `FX:${symbol.replace("/","")}`;
                        const frame = document.getElementById("mt5-tv-frame");
                        if(frame) frame.src=`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol.includes("Index")||symbol.includes("Boom")||symbol.includes("Crash")?"CAPITALCOM:"+symbol.replace(/ /g,""):("FX:"+symbol))}&interval=${tf}&theme=${dark?"dark":"light"}&style=1&locale=en&toolbar_bg=%23f1f3f6&hide_side_toolbar=0&allow_symbol_change=1`;
                      }}
                      style={{ padding:"3px 7px", background:"transparent", border:`1px solid ${t.border}`,
                        color:t.muted, borderRadius:4, fontSize:8 }}>
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <iframe
                id="mt5-tv-frame"
                src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol.includes("Index")||symbol.includes("Boom")||symbol.includes("Crash")?"CAPITALCOM:"+symbol.replace(/ /g,""):("FX:"+symbol))}&interval=15&theme=${dark?"dark":"light"}&style=1&locale=en&toolbar_bg=%23f1f3f6&hide_side_toolbar=0&allow_symbol_change=1`}
                style={{ width:"100%", height:320, border:"none", display:"block" }}
                allowFullScreen
              />
            </div>
            {/* Trading panel */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px", marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#ffd700", fontWeight:700, letterSpacing:1, marginBottom:12 }}>⚡ PLACE TRADE</div>

              {/* Symbol */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, color:t.dim, marginBottom:5 }}>SYMBOL</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {PAIRS.map(p=>(
                    <button key={p} className="mbtn" onClick={()=>setSymbol(p)}
                      style={{ padding:"5px 10px", background:symbol===p?"#ffd700":"transparent",
                        border:`1px solid ${symbol===p?"#ffd700":t.border}`,
                        color:symbol===p?"#000":t.muted, borderRadius:5, fontSize:9 }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lot size */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:t.dim, marginBottom:5 }}>LOT SIZE</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {[0.01,0.05,0.1,0.25,0.5,1.0].map(l=>(
                    <button key={l} className="mbtn" onClick={()=>setLotSize(l)}
                      style={{ padding:"8px 12px", background:lotSize===l?"#ffd700":"transparent",
                        border:`1px solid ${lotSize===l?"#ffd700":t.border}`,
                        color:lotSize===l?"#000":t.muted, borderRadius:5, fontSize:10 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buy/Sell */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                <button className="mbtn" onClick={()=>placeTrade("BUY")} disabled={loading}
                  style={{ padding:"16px", background:"linear-gradient(135deg,#00aa44,#007733)",
                    color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2 }}>
                  ▲ BUY
                </button>
                <button className="mbtn" onClick={()=>placeTrade("SELL")} disabled={loading}
                  style={{ padding:"16px", background:"linear-gradient(135deg,#cc2244,#991133)",
                    color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2 }}>
                  ▼ SELL
                </button>
              </div>

              {tradeResult && (
                <div style={{ background:tradeResult.success?"#001a0d":"#1a0005",
                  border:`1px solid ${tradeResult.success?"#00dd5533":"#ff224433"}`,
                  borderRadius:8, padding:"10px 14px", fontSize:10,
                  color:tradeResult.success?"#00dd55":"#ff5577", fontFamily:"monospace" }}>
                  {tradeResult.success
                    ? `✅ Trade placed! Ticket: #${tradeResult.ticket}`
                    : `❌ ${tradeResult.error}`}
                </div>
              )}
            </div>

            {/* Open positions */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:10, color:"#ffd700", fontWeight:700 }}>📋 OPEN POSITIONS ({positions.length})</div>
                <button className="mbtn" onClick={fetchPositions}
                  style={{ background:"transparent", border:`1px solid ${t.border}`, color:t.muted, padding:"4px 10px", borderRadius:5, fontSize:9 }}>
                  ⟳
                </button>
              </div>
              {positions.length===0 ? (
                <div style={{ fontSize:10, color:t.dim, textAlign:"center", padding:16 }}>No open positions</div>
              ) : positions.map((p,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                  <div>
                    <div style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700 }}>{p.symbol}</div>
                    <div style={{ fontSize:9, color:p.type==="BUY"?"#00dd55":"#ff2244" }}>
                      {p.type} {p.volume} lots @ {p.openPrice}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:parseFloat(p.profit)>=0?"#00dd55":"#ff2244", fontWeight:700 }}>
                      {parseFloat(p.profit)>=0?"+":""}{parseFloat(p.profit||0).toFixed(2)}
                    </div>
                    <button className="mbtn" onClick={()=>closePosition(p.ticket)}
                      style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466",
                        padding:"3px 8px", borderRadius:4, fontSize:8, marginTop:3 }}>
                      CLOSE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
