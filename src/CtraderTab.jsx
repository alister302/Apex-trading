import { useState, useEffect, useRef, useCallback } from "react";

const SERVER = "https://princex-api.onrender.com";
const CLIENT_ID = "34731_EFdh6Dqb0UOI6OdxQCwX4tt2PPzESSBdfWw8kwAokpw0xxSEA6";
const REDIRECT_URI = "https://princex-iq.vercel.app/callback";
const OAUTH_URL = `https://connect.spotware.com/apps/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=trading`;
const TWELVE_KEY = "62e0549bbdc04d76a224157e22da6bbd";

const ALL_SYMBOLS = ["EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD","XAUUSD","XAGUSD","GBPJPY","EURJPY","USDZAR","EURGBP","AUDCAD","CADJPY","CHFJPY","EURCAD","EURCHF","GBPCAD","GBPCHF"];
const LOT_SIZES = [0.01,0.05,0.1,0.25,0.5,1.0];
const TF_MAP = {"1m":"1min","5m":"5min","15m":"15min","1h":"1h","4h":"4h","1d":"1day"};

function calcEMA(prices, period) {
  if (prices.length < period) return [];
  const k = 2/(period+1);
  const result = new Array(prices.length).fill(null);
  let ema = prices.slice(0,period).reduce((a,b)=>a+b,0)/period;
  result[period-1] = ema;
  for (let i=period;i<prices.length;i++) { ema=prices[i]*k+ema*(1-k); result[i]=ema; }
  return result;
}

// ─── Mini Canvas Chart ────────────────────────────────────────────────────────
function CtraderChart({ symbol, dark, ema1Period, ema2Period, extraEMAs }) {
  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const [candles, setCandles] = useState([]);
  const [tf,      setTf]      = useState("15m");
  const [loading, setLoading] = useState(false);
  const [offset,  setOffset]  = useState(0);
  const [zoom,    setZoom]    = useState(60);
  const [expanded,setExpanded]= useState(false);

  const bgCard = dark?"#0a1520":"#fff";
  const border = dark?"#0d2a42":"#d0dce8";
  const gridC  = dark?"#0d2a4233":"#d0dce833";
  const txt    = dark?"#8899aa":"#445566";

  const getApiSym = () => {
    if (!symbol) return null;
    if (symbol.length===6 && !symbol.includes("/")) return symbol.slice(0,3)+"/"+symbol.slice(3);
    return symbol;
  };

  const fetchCandles = useCallback(async()=>{
    const s = getApiSym(); if (!s) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${s}&interval=${TF_MAP[tf]}&outputsize=200&apikey=${TWELVE_KEY}`);
      const data = await res.json();
      if (data.values) setCandles(data.values.map(v=>({t:v.datetime,o:parseFloat(v.open),h:parseFloat(v.high),l:parseFloat(v.low),c:parseFloat(v.close)})).reverse());
    } catch(e){}
    setLoading(false);
  },[symbol,tf]);

  useEffect(()=>{ fetchCandles(); },[fetchCandles]);

  useEffect(()=>{
    if (!candles.length) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height, PAXIS=68, PT=18, PB=28, CW=W-PAXIS;
    ctx.clearRect(0,0,W,H); ctx.fillStyle=bgCard; ctx.fillRect(0,0,W,H);
    const start=Math.max(0,candles.length-zoom-offset);
    const end=Math.min(candles.length,candles.length-(offset||0));
    const visible=candles.slice(start,end);
    if (!visible.length) return;
    const maxP=Math.max(...visible.map(c=>c.h)), minP=Math.min(...visible.map(c=>c.l));
    const range=maxP-minP||0.0001;
    const toY=p=>PT+((maxP-p)/range)*(H-PT-PB);
    const cw=Math.max(2,Math.floor(CW/visible.length)-1);
    const toX=i=>Math.floor(i*(CW/visible.length));
    // Grid
    for(let i=0;i<=6;i++){const y=PT+(i/6)*(H-PT-PB);ctx.strokeStyle=gridC;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();ctx.fillStyle=txt;ctx.font="9px monospace";ctx.fillText((maxP-(i/6)*range).toFixed(5),CW+3,y+3);}
    // EMAs
    const closes=candles.map(c=>c.c);
    const emaColors=[["#00ccff",ema1Period],["#ffaa00",ema2Period],...(extraEMAs||[]).map((p,i)=>[["#ff44ff","#44ffaa","#ff9900"][i%3],p])];
    emaColors.forEach(([col,period])=>{
      if (!period) return;
      const ema=calcEMA(closes,parseInt(period));
      ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();let s2=false;
      for(let i=start;i<end;i++){if(!ema[i])continue;const x=toX(i-start)+cw/2,y=toY(ema[i]);if(!s2){ctx.moveTo(x,y);s2=true;}else ctx.lineTo(x,y);}
      ctx.stroke();
      // Label
      if(ema[end-1]){ctx.fillStyle=col;ctx.font="8px monospace";ctx.fillText(`EMA${period}`,CW+3,toY(ema[end-1]));}
    });
    // Candles
    visible.forEach((c,i)=>{const x=toX(i),bull=c.c>=c.o,col=bull?"#00dd55":"#ff3355";ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+cw/2,toY(c.h));ctx.lineTo(x+cw/2,toY(c.l));ctx.stroke();ctx.fillStyle=col;const by=Math.min(toY(c.o),toY(c.c));ctx.fillRect(x,by,cw,Math.max(1,Math.abs(toY(c.c)-toY(c.o))));});
    // Current price
    const last=candles[end-1]?.c;
    if(last){const y=toY(last);ctx.setLineDash([3,3]);ctx.strokeStyle="#ffffff33";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#ffd700";ctx.fillRect(CW,y-9,PAXIS,18);ctx.fillStyle="#000";ctx.font="bold 9px monospace";ctx.fillText(last.toFixed(5),CW+3,y+4);}
  },[candles,dark,offset,zoom,ema1Period,ema2Period,extraEMAs,bgCard,gridC,txt]);

  const onMouseDown=e=>{dragRef.current=e.clientX;};
  const onMouseMove=e=>{if(dragRef.current===null)return;const dx=dragRef.current-e.clientX;const cw2=Math.max(1,(canvasRef.current?.clientWidth||300)/zoom);const delta=Math.round(dx/cw2);if(delta!==0){setOffset(o=>Math.max(0,Math.min(candles.length-zoom,o+delta)));dragRef.current=e.clientX;}};
  const onMouseUp=()=>{dragRef.current=null;};

  const chartH = expanded ? 500 : 260;
  const btnS = (a,c="#ffd700")=>({padding:"3px 8px",background:a?c+"22":"transparent",border:`1px solid ${a?c:border}`,color:a?c:txt,borderRadius:4,fontSize:9,cursor:"pointer",fontFamily:"monospace"});

  return (
    <div style={{background:bgCard,border:`1px solid ${border}`,borderRadius:12,overflow:"hidden",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",borderBottom:`1px solid ${border}`,flexWrap:"wrap",gap:3}}>
        <span style={{fontSize:9,color:"#ffd700",fontWeight:700}}>📊 {symbol}</span>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {["1m","5m","15m","1h","4h","1d"].map(t=>(<button key={t} onClick={()=>setTf(t)} style={btnS(tf===t)}>{t}</button>))}
          <button onClick={()=>setZoom(z=>Math.max(20,z-10))} style={btnS(false)}>+</button>
          <button onClick={()=>setZoom(z=>Math.min(200,z+10))} style={btnS(false)}>−</button>
          <button onClick={()=>setExpanded(e=>!e)} style={btnS(expanded,"#4499ff")}>{expanded?"⊡ Compact":"⊞ Expand"}</button>
          <button onClick={fetchCandles} style={btnS(false)}>↺</button>
        </div>
      </div>
      {loading?(
        <div style={{height:chartH,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:txt}}>Loading...</span></div>
      ):(
        <canvas ref={canvasRef} width={900} height={chartH}
          style={{width:"100%",height:chartH,display:"block",cursor:"ew-resize",touchAction:"pan-y"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(20,Math.min(200,z+(e.deltaY>0?5:-5))));}}
        />
      )}
      <div style={{display:"flex",gap:10,padding:"4px 12px",borderTop:`1px solid ${border}`,flexWrap:"wrap",alignItems:"center"}}>
        {[["EMA"+ema1Period,"#00ccff"],["EMA"+ema2Period,"#ffaa00"],...(extraEMAs||[]).map((p,i)=>["EMA"+p,["#ff44ff","#44ffaa","#ff9900"][i%3]])].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:3}}><div style={{width:14,height:2,background:c}}/><span style={{fontSize:8,color:c,fontWeight:700}}>{l}</span></div>
        ))}
        <span style={{marginLeft:"auto",fontSize:7,color:txt}}>Drag·Scroll</span>
      </div>
    </div>
  );
}

// ─── Main CtraderTab ──────────────────────────────────────────────────────────
export default function CtraderTab({ dark }) {
  const [token,       setToken]       = useState(localStorage.getItem("ct_token")||null);
  const [accounts,    setAccounts]    = useState(JSON.parse(localStorage.getItem("ct_accounts")||"[]"));
  const [activeAcc,   setActiveAcc]   = useState(null);
  const [symbol,      setSymbol]      = useState("EURUSD");
  const [watchlist,   setWatchlist]   = useState(JSON.parse(localStorage.getItem("ct_watchlist")||'["EURUSD","GBPUSD","XAUUSD"]'));
  const [showAddSym,  setShowAddSym]  = useState(false);
  const [lotSize,     setLotSize]     = useState(0.01);
  const [autoSl,      setAutoSl]      = useState(20);
  const [autoTp,      setAutoTp]      = useState(40);
  const [useAuto,     setUseAuto]     = useState(true);
  const [sl,          setSl]          = useState("");
  const [tp,          setTp]          = useState("");
  const [price,       setPrice]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [tradeResult, setTradeResult] = useState(null);
  const [error,       setError]       = useState("");
  const [autoTrade,   setAutoTrade]   = useState(false);
  const [autoSignal,  setAutoSignal]  = useState(null);
  // EMA settings
  const [ema1,        setEma1]        = useState(20);
  const [ema2,        setEma2]        = useState(50);
  const [extraEMAs,   setExtraEMAs]   = useState([200]);
  const [newEMA,      setNewEMA]      = useState("");
  const [showEmaEdit, setShowEmaEdit] = useState(false);
  const autoRef = useRef(null);

  const t = {
    bg:    dark?"#050a0f":"#f0f4f8",
    card:  dark?"rgba(0,20,40,0.95)":"#fff",
    border:dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim:   dark?"#445566":"#778899",
  };

  useEffect(()=>{
    const onStorage=()=>{
      const tok=localStorage.getItem("ct_token");
      if(tok&&!token){setToken(tok);fetchAccounts(tok);}
    };
    window.addEventListener("storage",onStorage);
    return()=>window.removeEventListener("storage",onStorage);
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const code=params.get("code");
    if(code&&!token){window.history.replaceState({},"","/");exchangeToken(code);}
    else if(token&&accounts.length>0)setActiveAcc(accounts[0]);
  },[]);

  // Live price
  useEffect(()=>{
    const sym=symbol.slice(0,3)+"/"+symbol.slice(3);
    const url=`https://api.twelvedata.com/price?symbol=${sym}&apikey=${TWELVE_KEY}`;
    fetch(url).then(r=>r.json()).then(d=>{if(d.price)setPrice(parseFloat(d.price));});
    const iv=setInterval(()=>{fetch(url).then(r=>r.json()).then(d=>{if(d.price)setPrice(parseFloat(d.price));});},5000);
    return()=>clearInterval(iv);
  },[symbol]);

  const exchangeToken=async(code)=>{
    setLoading(true);
    try{
      const res=await fetch(`${SERVER}/ctrader/exchange-token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});
      const data=await res.json();
      const tok=data.accessToken||data.access_token;
      if(tok){localStorage.setItem("ct_token",tok);setToken(tok);fetchAccounts(tok);}
      else setError("Token failed: "+JSON.stringify(data));
    }catch(e){setError(e.message);}
    setLoading(false);
  };

  const fetchAccounts=async(tok)=>{
    try{
      const res=await fetch(`${SERVER}/ctrader/accounts`,{headers:{"x-access-token":tok||token}});
      const data=await res.json();
      const accs=data.data||data||[];
      localStorage.setItem("ct_accounts",JSON.stringify(accs));
      setAccounts(accs);
      if(accs.length>0)setActiveAcc(accs[0]);
    }catch(e){setError("Failed to fetch accounts");}
  };

  const logout=()=>{
    localStorage.removeItem("ct_token");localStorage.removeItem("ct_accounts");
    setToken(null);setAccounts([]);setActiveAcc(null);
    setAutoTrade(false);clearInterval(autoRef.current);
  };

  const pip=()=>symbol.includes("JPY")?0.01:0.0001;

  const calcSlTp=(side,p)=>{
    const slP=autoSl*pip(), tpP=autoTp*pip();
    if(side==="BUY") return{slPrice:parseFloat((p-slP).toFixed(5)),tpPrice:parseFloat((p+tpP).toFixed(5))};
    return{slPrice:parseFloat((p+slP).toFixed(5)),tpPrice:parseFloat((p-tpP).toFixed(5))};
  };

  const placeTrade=async(side)=>{
    if(!activeAcc){setError("Select an account");return;}
    if(!token){setError("Not connected");return;}
    setLoading(true);setTradeResult(null);setError("");
    const p=price||0;
    const{slPrice,tpPrice}=useAuto?calcSlTp(side,p):{slPrice:parseFloat(sl)||undefined,tpPrice:parseFloat(tp)||undefined};
    try{
      const res=await fetch(`${SERVER}/ctrader/autotrade`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({accessToken:token,accountId:activeAcc.ctidTraderAccountId||activeAcc.accountId,
          symbol,side,volume:lotSize,sl:slPrice,tp:tpPrice,
          isDemo:activeAcc.isLive===false||String(activeAcc.accountId||"").includes("demo")})});
      const data=await res.json();
      setTradeResult(data);
    }catch(e){setError(e.message);}
    setLoading(false);
  };

  // Auto-trade
  useEffect(()=>{
    if(!autoTrade){clearInterval(autoRef.current);return;}
    const run=async()=>{
      try{
        const sym=symbol.slice(0,3)+"/"+symbol.slice(3);
        const res=await fetch(`https://api.twelvedata.com/time_series?symbol=${sym}&interval=15min&outputsize=60&apikey=${TWELVE_KEY}`);
        const data=await res.json();
        if(!data.values)return;
        const closes=data.values.map(v=>parseFloat(v.close)).reverse();
        const ema=(arr,p)=>{const k=2/(p+1);let e=arr[0];for(let i=1;i<arr.length;i++)e=arr[i]*k+e*(1-k);return e;};
        const prev=closes.slice(0,-1);
        const e1n=ema(closes,ema1),e2n=ema(closes,ema2),e1p=ema(prev,ema1),e2p=ema(prev,ema2);
        if(e1p<e2p&&e1n>e2n){setAutoSignal(`🟢 BUY — EMA${ema1} crossed above EMA${ema2}`);placeTrade("BUY");}
        if(e1p>e2p&&e1n<e2n){setAutoSignal(`🔴 SELL — EMA${ema1} crossed below EMA${ema2}`);placeTrade("SELL");}
      }catch(e){}
    };
    run();autoRef.current=setInterval(run,60000);
    return()=>clearInterval(autoRef.current);
  },[autoTrade,symbol,activeAcc,token,lotSize,autoSl,autoTp,ema1,ema2]);

  const addToWatchlist=(s)=>{
    if(watchlist.includes(s))return;
    const w=[...watchlist,s];setWatchlist(w);localStorage.setItem("ct_watchlist",JSON.stringify(w));
  };
  const removeFromWatchlist=(s)=>{
    const w=watchlist.filter(x=>x!==s);setWatchlist(w);localStorage.setItem("ct_watchlist",JSON.stringify(w));
  };

  const cbtn=(a,col="#ffd700")=>({padding:"8px 14px",background:a?col+"22":"transparent",border:`2px solid ${a?col:t.border}`,color:a?col:t.muted,borderRadius:7,fontSize:9,cursor:"pointer",fontFamily:"monospace",fontWeight:700});

  if (!token) return (
    <div style={{background:t.bg,minHeight:"100%",fontFamily:"'IBM Plex Mono',monospace"}}>
      <div style={{maxWidth:900,margin:"0 auto",padding:"14px 16px"}}>
        <div style={{background:t.card,border:"2px solid #ff440044",borderRadius:12,padding:"32px 20px",textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12}}>🔴</div>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:dark?"#fff":"#001133",marginBottom:8}}>CONNECT CTRADER</div>
          <div style={{fontSize:10,color:t.muted,lineHeight:2,marginBottom:24}}>✅ Pepperstone · FxPro · IC Markets<br/>✅ Real CFD trading with TP/SL<br/>✅ EMA crossover auto-trader<br/>✅ Forex · Gold · Indices · Crypto</div>
          {loading?<div style={{fontSize:11,color:t.muted}}>Connecting...</div>:(
            <button onClick={()=>{localStorage.setItem("return_tab","ctrader");window.location.href=OAUTH_URL;}}
              style={{padding:"16px 32px",background:"linear-gradient(135deg,#ff4400,#cc2200)",color:"#fff",borderRadius:10,fontSize:13,letterSpacing:2,width:"100%",border:"none",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>
              🔗 CONNECT CTRADER ACCOUNT
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{background:t.bg,minHeight:"100%",fontFamily:"'IBM Plex Mono',monospace"}}>
      <style>{`.cbtn2{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}.cbtn2:hover:not(:disabled){opacity:0.85;transform:translateY(-1px)}.cbtn2:disabled{opacity:0.4;cursor:not-allowed}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}.pulse{animation:pulse 1.5s infinite}`}</style>

      {/* ── STICKY TRADE BAR (top) ── */}
      <div style={{position:"sticky",top:0,zIndex:100,background:dark?"#020810ee":"#f0f4f8ee",backdropFilter:"blur(10px)",borderBottom:`1px solid ${t.border}`,padding:"8px 14px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {/* Symbol */}
          <div style={{display:"flex",alignItems:"center",gap:5,background:t.card,border:`1px solid ${t.border}`,borderRadius:8,padding:"4px 10px"}}>
            <span style={{fontSize:9,color:t.dim}}>PAIR</span>
            <select value={symbol} onChange={e=>setSymbol(e.target.value)}
              style={{background:"transparent",border:"none",color:dark?"#fff":"#001133",fontSize:11,fontWeight:700,fontFamily:"monospace",outline:"none",cursor:"pointer"}}>
              {watchlist.map(s=><option key={s} value={s} style={{background:dark?"#0a1520":"#fff"}}>{s}</option>)}
            </select>
          </div>
          {/* Price */}
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:"#ffd700",minWidth:80}}>
            {price?.toFixed(symbol.includes("JPY")?3:5)||"---"}
          </div>
          {/* Lot */}
          <select value={lotSize} onChange={e=>setLotSize(parseFloat(e.target.value))}
            style={{background:t.card,border:`1px solid ${t.border}`,color:dark?"#fff":"#001133",padding:"6px 8px",borderRadius:6,fontFamily:"monospace",fontSize:10,cursor:"pointer"}}>
            {LOT_SIZES.map(l=><option key={l} value={l}>{l} lot</option>)}
          </select>
          {/* BUY/SELL overlay buttons */}
          <button className="cbtn2" onClick={()=>placeTrade("BUY")} disabled={loading||!activeAcc}
            style={{padding:"10px 22px",background:"linear-gradient(135deg,#00aa44,#007733)",color:"#fff",borderRadius:8,fontSize:13,letterSpacing:2,flexShrink:0}}>
            ▲ BUY
          </button>
          <button className="cbtn2" onClick={()=>placeTrade("SELL")} disabled={loading||!activeAcc}
            style={{padding:"10px 22px",background:"linear-gradient(135deg,#cc2244,#991133)",color:"#fff",borderRadius:8,fontSize:13,letterSpacing:2,flexShrink:0}}>
            ▼ SELL
          </button>
          {/* Status */}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#00dd55"}} className="pulse"/>
            <span style={{fontSize:8,color:"#00dd55"}}>LIVE</span>
            <button className="cbtn2" onClick={logout}
              style={{padding:"4px 10px",background:"#ff224422",border:"1px solid #ff4466",color:"#ff4466",borderRadius:5,fontSize:8}}>
              EXIT
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"12px 14px"}}>
        {error&&(
          <div style={{background:"#1a0005",border:"1px solid #ff224433",borderRadius:8,padding:"8px 12px",marginBottom:10,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:10,color:"#ff5577"}}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{background:"none",border:"none",color:"#ff5577",cursor:"pointer",fontSize:16}}>×</button>
          </div>
        )}

        {/* Trade result */}
        {tradeResult&&(
          <div style={{background:tradeResult.success?"#001a0d":"#1a0005",border:`2px solid ${tradeResult.success?"#00dd55":"#ff2244"}`,borderRadius:10,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:11,color:tradeResult.success?"#00dd55":"#ff2244",fontWeight:700,marginBottom:4}}>
              {tradeResult.success?"✅ TRADE PLACED!":"❌ TRADE FAILED"}
            </div>
            <div style={{fontSize:8,color:t.muted,fontFamily:"monospace"}}>{JSON.stringify(tradeResult).slice(0,150)}</div>
            <button onClick={()=>setTradeResult(null)} style={{marginTop:6,padding:"4px 10px",background:"transparent",border:`1px solid ${t.border}`,color:t.muted,borderRadius:5,fontSize:8,cursor:"pointer"}}>DISMISS</button>
          </div>
        )}

        {/* Account selector */}
        {accounts.length>0&&(
          <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 14px",marginBottom:10}}>
            <div style={{fontSize:8,color:t.dim,fontWeight:700,letterSpacing:1,marginBottom:6}}>ACCOUNT</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {accounts.map(acc=>(
                <div key={acc.ctidTraderAccountId||acc.accountId} onClick={()=>setActiveAcc(acc)}
                  style={{padding:"6px 12px",background:activeAcc?.ctidTraderAccountId===acc.ctidTraderAccountId?"#ff440022":"transparent",
                    border:`2px solid ${activeAcc?.ctidTraderAccountId===acc.ctidTraderAccountId?"#ff4400":t.border}`,borderRadius:6,cursor:"pointer"}}>
                  <div style={{fontSize:9,color:dark?"#fff":"#001133",fontWeight:700}}>{acc.traderLogin||acc.accountId}</div>
                  <div style={{fontSize:7,color:acc.isLive?"#ff4466":"#4499ff"}}>{acc.isLive?"🔴 LIVE":"🔵 DEMO"}</div>
                </div>
              ))}
              <button onClick={()=>fetchAccounts(token)} style={{padding:"6px 10px",background:"transparent",border:`1px solid ${t.border}`,color:t.muted,borderRadius:6,fontSize:8,cursor:"pointer"}}>↺</button>
            </div>
          </div>
        )}

        {/* Chart */}
        <CtraderChart symbol={symbol} dark={dark} ema1Period={ema1} ema2Period={ema2} extraEMAs={extraEMAs}/>

        {/* EMA Settings */}
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showEmaEdit?10:0}}>
            <div style={{fontSize:9,color:"#00ccff",fontWeight:700}}>📈 EMA SETTINGS</div>
            <button onClick={()=>setShowEmaEdit(e=>!e)} style={{...cbtn(showEmaEdit,"#00ccff"),padding:"4px 10px",fontSize:8}}>
              {showEmaEdit?"▲ Hide":"✏ Edit"}
            </button>
          </div>
          {showEmaEdit&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <div style={{fontSize:8,color:"#00ccff",marginBottom:3}}>EMA 1 Period</div>
                  <input type="number" value={ema1} onChange={e=>setEma1(parseInt(e.target.value)||20)}
                    style={{width:"100%",padding:"6px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:8,color:"#ffaa00",marginBottom:3}}>EMA 2 Period</div>
                  <input type="number" value={ema2} onChange={e=>setEma2(parseInt(e.target.value)||50)}
                    style={{width:"100%",padding:"6px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{fontSize:8,color:t.dim,marginBottom:5}}>EXTRA EMAs: {extraEMAs.join(", ")||"none"}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                {extraEMAs.map(p=>(
                  <div key={p} style={{padding:"3px 8px",background:"#ff44ff22",border:"1px solid #ff44ff44",borderRadius:5,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:9,color:"#ff44ff"}}>EMA{p}</span>
                    <button onClick={()=>setExtraEMAs(e=>e.filter(x=>x!==p))} style={{background:"none",border:"none",color:"#ff4466",cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:5}}>
                <input type="number" value={newEMA} onChange={e=>setNewEMA(e.target.value)} placeholder="Period e.g. 200"
                  style={{flex:1,padding:"6px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",fontFamily:"monospace",fontSize:11,outline:"none"}}/>
                <button onClick={()=>{ if(newEMA&&!extraEMAs.includes(parseInt(newEMA))){setExtraEMAs(e=>[...e,parseInt(newEMA)]);setNewEMA("");} }}
                  style={{padding:"6px 14px",background:"#00ccff22",border:"1px solid #00ccff",color:"#00ccff",borderRadius:6,fontSize:9,cursor:"pointer",fontFamily:"monospace"}}>
                  + ADD
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TP/SL */}
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:9,color:t.dim,fontWeight:700,letterSpacing:1}}>TP / SL</div>
            <button onClick={()=>setUseAuto(a=>!a)} style={{...cbtn(useAuto,"#00dd55"),padding:"4px 10px",fontSize:8}}>
              {useAuto?"⚡ AUTO PIPS":"✏ MANUAL"}
            </button>
          </div>
          {useAuto?(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:5}}>
                <div>
                  <div style={{fontSize:8,color:"#ff4466",marginBottom:3}}>SL (pips)</div>
                  <input type="number" value={autoSl} onChange={e=>setAutoSl(parseInt(e.target.value)||10)}
                    style={{width:"100%",padding:"7px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:8,color:"#00dd55",marginBottom:3}}>TP (pips)</div>
                  <input type="number" value={autoTp} onChange={e=>setAutoTp(parseInt(e.target.value)||20)}
                    style={{width:"100%",padding:"7px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              {price&&<div style={{fontSize:8,color:t.dim}}>BUY → SL:{(price-autoSl*pip()).toFixed(5)} TP:{(price+autoTp*pip()).toFixed(5)}</div>}
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div style={{fontSize:8,color:"#ff4466",marginBottom:3}}>SL Price</div>
                <input type="number" value={sl} onChange={e=>setSl(e.target.value)} placeholder="1.08500"
                  style={{width:"100%",padding:"7px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:8,color:"#00dd55",marginBottom:3}}>TP Price</div>
                <input type="number" value={tp} onChange={e=>setTp(e.target.value)} placeholder="1.09500"
                  style={{width:"100%",padding:"7px",background:dark?"rgba(0,40,80,0.3)":"#e8f0f8",border:`1px solid ${t.border}`,borderRadius:6,color:dark?"#c8d8e8":"#001133",fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
              </div>
            </div>
          )}
        </div>

        {/* Watchlist manager */}
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:9,color:"#4499ff",fontWeight:700}}>👁 WATCHLIST</div>
            <button onClick={()=>setShowAddSym(s=>!s)} style={{...cbtn(showAddSym,"#4499ff"),padding:"4px 10px",fontSize:8}}>+ Add</button>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:showAddSym?8:0}}>
            {watchlist.map(s=>(
              <div key={s} onClick={()=>setSymbol(s)}
                style={{padding:"5px 10px",background:symbol===s?"#4499ff22":"transparent",
                  border:`2px solid ${symbol===s?"#4499ff":t.border}`,borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:9,color:symbol===s?"#4499ff":t.muted,fontWeight:700}}>{s}</span>
                <button onClick={e=>{e.stopPropagation();removeFromWatchlist(s);}} style={{background:"none",border:"none",color:"#ff4466",cursor:"pointer",fontSize:11,lineHeight:1}}>×</button>
              </div>
            ))}
          </div>
          {showAddSym&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {ALL_SYMBOLS.filter(s=>!watchlist.includes(s)).map(s=>(
                <button key={s} onClick={()=>{addToWatchlist(s);setShowAddSym(false);}}
                  style={{padding:"4px 8px",background:"transparent",border:`1px solid ${t.border}`,color:t.muted,borderRadius:5,fontSize:9,cursor:"pointer",fontFamily:"monospace"}}>
                  +{s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auto-trade */}
        <div style={{background:t.card,border:`2px solid ${autoTrade?"#00dd55":t.border}`,borderRadius:10,padding:"10px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div>
              <div style={{fontSize:9,color:"#00dd55",fontWeight:700,letterSpacing:1}}>🤖 EMA AUTO-TRADE</div>
              <div style={{fontSize:8,color:t.dim,marginTop:2}}>EMA{ema1}×EMA{ema2} crossover · 15min · Real trades</div>
            </div>
            <button className="cbtn2" onClick={()=>setAutoTrade(a=>!a)}
              style={{padding:"8px 16px",background:autoTrade?"#00dd5522":"transparent",border:`2px solid ${autoTrade?"#00dd55":t.border}`,color:autoTrade?"#00dd55":t.muted,borderRadius:7,fontSize:9,fontWeight:700}}>
              {autoTrade?"⏹ STOP":"▶ START"}
            </button>
          </div>
          {autoTrade&&<div style={{fontSize:9,color:"#4499ff",padding:"5px 8px",background:"#4499ff11",borderRadius:5,marginBottom:5}}>✅ Monitoring {symbol} · Auto TP:{autoTp}p SL:{autoSl}p</div>}
          {autoSignal&&<div style={{fontSize:9,color:autoSignal.includes("BUY")?"#00dd55":"#ff4466",fontWeight:700}}>Last: {autoSignal}</div>}
        </div>

      </div>
    </div>
  );
}
