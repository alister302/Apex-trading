import { useState, useEffect, useRef } from "react";

const SERVER = "https://princex-api.onrender.com";
const CLIENT_ID = "34731_EFdh6Dqb0UOI6OdxQCwX4tt2PPzESSBdfWw8kwAokpw0xxSEA6";
const REDIRECT_URI = "https://princex-iq.vercel.app/callback";
const OAUTH_URL = `https://connect.spotware.com/apps/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=trading`;

const SYMBOLS = ["EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD","XAUUSD","XAGUSD","GBPJPY","EURJPY","USDZAR"];
const LOT_SIZES = [0.01,0.05,0.1,0.25,0.5,1.0];

export default function CtraderTab({ dark }) {
  const [token,       setToken]       = useState(localStorage.getItem("ct_token")||null);
  const [accounts,    setAccounts]    = useState(JSON.parse(localStorage.getItem("ct_accounts")||"[]"));
  const [activeAcc,   setActiveAcc]   = useState(null);
  const [symbol,      setSymbol]      = useState("EURUSD");
  const [lotSize,     setLotSize]     = useState(0.01);
  const [sl,          setSl]          = useState("");
  const [tp,          setTp]          = useState("");
  const [autoSl,      setAutoSl]      = useState(20);
  const [autoTp,      setAutoTp]      = useState(40);
  const [useAuto,     setUseAuto]     = useState(true);
  const [price,       setPrice]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [tradeResult, setTradeResult] = useState(null);
  const [positions,   setPositions]   = useState([]);
  const [error,       setError]       = useState("");
  const [autoTrade,   setAutoTrade]   = useState(false);
  const [autoSignal,  setAutoSignal]  = useState(null);
  const autoRef = useRef(null);
  const wsRef   = useRef(null);

  const t = {
    bg:    dark?"#050a0f":"#f0f4f8",
    card:  dark?"rgba(0,20,40,0.95)":"#fff",
    border:dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim:   dark?"#445566":"#778899",
  };

  // Handle OAuth callback
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && !token) {
      window.history.replaceState({},"","/");
      exchangeToken(code);
    } else if (token && accounts.length > 0) {
      setActiveAcc(accounts[0]);
    }
  },[]);

  const exchangeToken = async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/ctrader/exchange-token`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.accessToken || data.access_token) {
        const tok = data.accessToken || data.access_token;
        localStorage.setItem("ct_token", tok);
        setToken(tok);
        fetchAccounts(tok);
      } else {
        setError("Token exchange failed: " + JSON.stringify(data));
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const fetchAccounts = async (tok) => {
    try {
      const res = await fetch(`${SERVER}/ctrader/accounts`, {
        headers:{"x-access-token": tok||token}
      });
      const data = await res.json();
      const accs = data.data || data || [];
      localStorage.setItem("ct_accounts", JSON.stringify(accs));
      setAccounts(accs);
      if (accs.length > 0) setActiveAcc(accs[0]);
    } catch(e) { setError("Failed to fetch accounts"); }
  };

  const logout = () => {
    localStorage.removeItem("ct_token");
    localStorage.removeItem("ct_accounts");
    setToken(null); setAccounts([]); setActiveAcc(null);
    setAutoTrade(false); clearInterval(autoRef.current);
  };

  // Live price via TwelveData
  useEffect(()=>{
    const sym = symbol.slice(0,3)+"/"+symbol.slice(3);
    const url = `https://api.twelvedata.com/price?symbol=${sym}&apikey=62e0549bbdc04d76a224157e22da6bbd`;
    fetch(url).then(r=>r.json()).then(d=>{ if(d.price) setPrice(parseFloat(d.price)); });
    const iv = setInterval(()=>{
      fetch(url).then(r=>r.json()).then(d=>{ if(d.price) setPrice(parseFloat(d.price)); });
    }, 5000);
    return ()=>clearInterval(iv);
  },[symbol]);

  const calcSlTp = (side, currentPrice) => {
    const pip = symbol.includes("JPY") ? 0.01 : 0.0001;
    const slPips = autoSl * pip;
    const tpPips = autoTp * pip;
    if (side === "BUY") return {
      slPrice: parseFloat((currentPrice - slPips).toFixed(5)),
      tpPrice: parseFloat((currentPrice + tpPips).toFixed(5))
    };
    return {
      slPrice: parseFloat((currentPrice + slPips).toFixed(5)),
      tpPrice: parseFloat((currentPrice - tpPips).toFixed(5))
    };
  };

  const placeTrade = async (side) => {
    if (!activeAcc) { setError("Select an account"); return; }
    if (!token) { setError("Not connected"); return; }
    setLoading(true); setTradeResult(null); setError("");
    const p = price || 0;
    const { slPrice, tpPrice } = useAuto ? calcSlTp(side, p) : { slPrice: parseFloat(sl)||undefined, tpPrice: parseFloat(tp)||undefined };
    try {
      const res = await fetch(`${SERVER}/ctrader/autotrade`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          accessToken: token,
          accountId: activeAcc.ctidTraderAccountId || activeAcc.accountId,
          symbol, side, volume: lotSize,
          sl: slPrice, tp: tpPrice,
          isDemo: activeAcc.isLive === false || String(activeAcc.accountId||"").includes("demo")
        })
      });
      const data = await res.json();
      setTradeResult(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  // Auto-trade engine — checks EMA cross every 60s
  useEffect(()=>{
    if (!autoTrade) { clearInterval(autoRef.current); return; }
    const run = async () => {
      try {
        const sym = symbol.slice(0,3)+"/"+symbol.slice(3);
        const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${sym}&interval=15min&outputsize=60&apikey=62e0549bbdc04d76a224157e22da6bbd`);
        const data = await res.json();
        if (!data.values) return;
        const closes = data.values.map(v=>parseFloat(v.close)).reverse();
        const ema = (arr, p) => {
          const k = 2/(p+1); let e = arr[0];
          for(let i=1;i<arr.length;i++) e = arr[i]*k+e*(1-k);
          return e;
        };
        const prev = closes.slice(0,-1);
        const e20n = ema(closes,20), e50n = ema(closes,50);
        const e20p = ema(prev,20),   e50p = ema(prev,50);
        const bull = e20p < e50p && e20n > e50n;
        const bear = e20p > e50p && e20n < e50n;
        if (bull) { setAutoSignal("🟢 BUY — EMA20 crossed above EMA50"); placeTrade("BUY"); }
        if (bear) { setAutoSignal("🔴 SELL — EMA20 crossed below EMA50"); placeTrade("SELL"); }
      } catch(e) {}
    };
    run();
    autoRef.current = setInterval(run, 60000);
    return ()=>clearInterval(autoRef.current);
  },[autoTrade, symbol, activeAcc, token, lotSize, autoSl, autoTp]);

  const btn = (active, col="#ffd700") => ({
    padding:"10px 16px", background:active?col+"22":"transparent",
    border:`2px solid ${active?col:t.border}`, color:active?col:t.muted,
    borderRadius:8, fontSize:10, cursor:"pointer", fontFamily:"monospace", fontWeight:700
  });

  return (
    <div style={{background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace"}}>
      <style>{`.cbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}.cbtn:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}.cbtn:disabled{opacity:0.4;cursor:not-allowed}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}.pulse{animation:pulse 1.5s infinite}`}</style>
      <div style={{maxWidth:900,margin:"0 auto",padding:"14px 16px"}}>

        {/* Header */}
        <div style={{background:t.card,border:"2px solid #ff440044",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:"#ff4400",letterSpacing:2}}>🔴 PEPPERSTONE / FXPRO</div>
              <div style={{fontSize:9,color:t.dim,marginTop:2}}>cTrader Open API · CFD Auto-Trading</div>
            </div>
            {token && (
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#00dd55"}} className="pulse"/>
                <span style={{fontSize:8,color:"#00dd55",fontWeight:700}}>CONNECTED</span>
                <button className="cbtn" onClick={logout}
                  style={{padding:"5px 12px",background:"#ff224422",border:"1px solid #ff4466",color:"#ff4466",borderRadius:6,fontSize:9}}>
                  LOGOUT
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{background:"#1a0005",border:"1px solid #ff224433",borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:"#ff5577"}}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"#ff5577",cursor:"pointer",fontSize:18}}>×</button>
          </div>
        )}

        {/* NOT CONNECTED */}
        {!token && (
          <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"32px 20px",textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:12}}>🔴</div>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:dark?"#fff":"#001133",marginBottom:8}}>
              CONNECT CTRADER
            </div>
            <div style={{fontSize:10,color:t.muted,lineHeight:2,marginBottom:24}}>
              ✅ Pepperstone · FxPro · IC Markets<br/>
              ✅ Real CFD trading with TP/SL<br/>
              ✅ EMA auto-trade engine<br/>
              ✅ Forex · Gold · Indices
            </div>
            {loading ? (
              <div style={{fontSize:11,color:t.muted}}>Connecting...</div>
            ) : (
              <button className="cbtn" onClick={()=>window.location.href=OAUTH_URL}
                style={{padding:"16px 32px",background:"linear-gradient(135deg,#ff4400,#cc2200)",color:"#fff",borderRadius:10,fontSize:13,letterSpacing:2,width:"100%"}}>
                🔗 CONNECT CTRADER ACCOUNT
              </button>
            )}
          </div>
        )}

        {/* CONNECTED */}
        {token && (
          <div>
            {/* Account selector */}
            {accounts.length > 0 && (
              <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:9,color:t.dim,fontWeight:700,letterSpacing:1,marginBottom:8}}>SELECT ACCOUNT</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {accounts.map(acc=>(
                    <div key={acc.ctidTraderAccountId||acc.accountId} onClick={()=>setActiveAcc(acc)}
                      style={{padding:"8px 14px",background:activeAcc?.ctidTraderAccountId===acc.ctidTraderAccountId?"#ff440022":"transparent",
                        border:`2px solid ${activeAcc?.ctidTraderAccountId===acc.ctidTraderAccountId?"#ff4400":t.border}`,
                        borderRadius:8,cursor:"pointer"}}>
                      <div style={{fontSize:10,color:dark?"#fff":"#001133",fontWeight:700}}>{acc.traderLogin||acc.accountId}</div>
                      <div style={{fontSize:8,color:acc.isLive?"#ff4466":"#4499ff"}}>{acc.isLive?"🔴 LIVE":"🔵 DEMO"} · {acc.depositCurrency||"USD"}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>fetchAccounts(token)}
                  style={{marginTop:8,padding:"5px 12px",background:"transparent",border:`1px solid ${t.border}`,color:t.muted,borderRadius:5,fontSize:9,cursor:"pointer"}}>
                  ↺ Refresh
                </button>
              </div>
            )}

            {/* Live price */}
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:9,color:t.dim}}>LIVE PRICE · {symbol}</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:900,color:"#ffd700"}}>
                {price?.toFixed(symbol.includes("JPY")?3:5)||"---"}
              </div>
            </div>

            {/* Symbol */}
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:9,color:t.dim,fontWeight:700,letterSpacing:1,marginBottom:8}}>SYMBOL</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {SYMBOLS.map(s=>(
                  <button key={s} className="cbtn" onClick={()=>setSymbol(s)}
                    style={{padding:"5px 10px",background:symbol===s?"#ff440022":"transparent",
                      border:`1px solid ${symbol===s?"#ff4400":t.border}`,
                      color:symbol===s?"#ff4400":t.muted,borderRadius:5,fontSize:9}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Lot size */}
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:9,color:t.dim,fontWeight:700,letterSpacing:1,marginBottom:8}}>LOT SIZE</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {LOT_SIZES.map(l=>(
                  <button key={l} className="cbtn" onClick={()=>setLotSize(l)}
                    style={{padding:"8px 14px",background:lotSize===l?"#ffd70022":"transparent",
                      border:`1px solid ${lotSize===l?"#ffd700":t.border}`,
                      color:lotSize===l?"#ffd700":t.muted,borderRadius:6,fontSize:10}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* TP/SL */}
            <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:9,color:t.dim,fontWeight:700,letterSpacing:1}}>TP / SL SETTINGS</div>
                <button onClick={()=>setUseAuto(a=>!a)}
                  style={{padding:"4px 10px",background:useAuto?"#00dd5522":"transparent",
                    border:`1px solid ${useAuto?"#00dd55":t.border}`,color:useAuto?"#00dd55":t.muted,
                    borderRadius:5,fontSize:8,cursor:"pointer"}}>
                  {useAuto?"⚡ AUTO PIPS":"✏ MANUAL"}
                </button>
              </div>
              {useAuto ? (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontSize:8,color:"#ff4466",marginBottom:4}}>SL (pips)</div>
                    <input type="number" value={autoSl} onChange={e=>setAutoSl(parseInt(e.target.value)||10)}
                      style={{width:"100%",padding:"8px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",
                        border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",
                        fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:8,color:"#00dd55",marginBottom:4}}>TP (pips)</div>
                    <input type="number" value={autoTp} onChange={e=>setAutoTp(parseInt(e.target.value)||20)}
                      style={{width:"100%",padding:"8px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",
                        border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",
                        fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <div style={{fontSize:8,color:"#ff4466",marginBottom:4}}>SL Price</div>
                    <input type="number" value={sl} onChange={e=>setSl(e.target.value)} placeholder="e.g. 1.08500"
                      style={{width:"100%",padding:"8px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",
                        border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",
                        fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <div style={{fontSize:8,color:"#00dd55",marginBottom:4}}>TP Price</div>
                    <input type="number" value={tp} onChange={e=>setTp(e.target.value)} placeholder="e.g. 1.09500"
                      style={{width:"100%",padding:"8px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",
                        border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",
                        fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                  </div>
                </div>
              )}
              {useAuto && price && (
                <div style={{marginTop:8,fontSize:8,color:t.dim}}>
                  BUY → SL: {(price-(autoSl*(symbol.includes("JPY")?0.01:0.0001))).toFixed(5)} · TP: {(price+(autoTp*(symbol.includes("JPY")?0.01:0.0001))).toFixed(5)}
                </div>
              )}
            </div>

            {/* BUY / SELL */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <button className="cbtn" onClick={()=>placeTrade("BUY")} disabled={loading||!activeAcc}
                style={{padding:"22px 0",background:"linear-gradient(135deg,#00aa44,#007733)",color:"#fff",borderRadius:12,fontSize:18,letterSpacing:2,
                  boxShadow:activeAcc?"0 4px 20px #00dd5544":"none"}}>
                ▲ BUY
              </button>
              <button className="cbtn" onClick={()=>placeTrade("SELL")} disabled={loading||!activeAcc}
                style={{padding:"22px 0",background:"linear-gradient(135deg,#cc2244,#991133)",color:"#fff",borderRadius:12,fontSize:18,letterSpacing:2,
                  boxShadow:activeAcc?"0 4px 20px #ff224444":"none"}}>
                ▼ SELL
              </button>
            </div>

            {/* Auto-trade engine */}
            <div style={{background:t.card,border:`2px solid ${autoTrade?"#00dd55":t.border}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div style={{fontSize:10,color:"#00dd55",fontWeight:700,letterSpacing:1}}>🤖 EMA AUTO-TRADE</div>
                  <div style={{fontSize:8,color:t.dim,marginTop:2}}>EMA20 × EMA50 crossover · 15min · Places real trades</div>
                </div>
                <button className="cbtn" onClick={()=>setAutoTrade(a=>!a)}
                  style={{padding:"10px 18px",background:autoTrade?"#00dd5522":"transparent",
                    border:`2px solid ${autoTrade?"#00dd55":t.border}`,
                    color:autoTrade?"#00dd55":t.muted,borderRadius:8,fontSize:10}}>
                  {autoTrade?"⏹ STOP":"▶ START"}
                </button>
              </div>
              {autoTrade && (
                <div style={{fontSize:9,color:"#4499ff",padding:"6px 10px",background:"#4499ff11",borderRadius:6,marginBottom:6}}>
                  ✅ Monitoring {symbol} · Checks every 60s · Auto TP:{autoTp}p SL:{autoSl}p
                </div>
              )}
              {autoSignal && (
                <div style={{fontSize:10,color:autoSignal.includes("BUY")?"#00dd55":"#ff4466",fontWeight:700,marginTop:4}}>
                  Last signal: {autoSignal}
                </div>
              )}
            </div>

            {/* Trade result */}
            {tradeResult && (
              <div style={{background:tradeResult.success?"#001a0d":"#1a0005",
                border:`2px solid ${tradeResult.success?"#00dd55":"#ff2244"}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontSize:12,color:tradeResult.success?"#00dd55":"#ff2244",fontWeight:700,marginBottom:6}}>
                  {tradeResult.success?"✅ TRADE PLACED!":"❌ TRADE FAILED"}
                </div>
                <div style={{fontSize:9,color:t.muted,fontFamily:"monospace"}}>
                  {JSON.stringify(tradeResult,null,2).slice(0,200)}
                </div>
                <button onClick={()=>setTradeResult(null)}
                  style={{marginTop:8,padding:"5px 12px",background:"transparent",border:`1px solid ${t.border}`,color:t.muted,borderRadius:5,fontSize:9,cursor:"pointer"}}>
                  DISMISS
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
