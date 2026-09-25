import { useState, useEffect, useRef, useCallback } from "react";

const TWELVE_KEY = "62e0549bbdc04d76a224157e22da6bbd";
const TF_MAP = {"1m":"1min","5m":"5min","15m":"15min","1h":"1h","4h":"4h","1d":"1day"};

function calcEMA(prices, period) {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const result = new Array(prices.length).fill(null);
  let ema = prices.slice(0, period).reduce((a,b)=>a+b,0)/period;
  result[period-1] = ema;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i]*k + ema*(1-k);
    result[i] = ema;
  }
  return result;
}

export default function MT5Chart({ symbol, dark, broker }) {
  const canvasRef    = useRef(null);
  const dragRef      = useRef(null);
  const ringRef      = useRef(null);
  const [candles,    setCandles]    = useState([]);
  const [tf,         setTf]         = useState("15m");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [half,       setHalf]       = useState(false);
  const [offset,     setOffset]     = useState(0);
  const [zoom,       setZoom]       = useState(60);

  const bg     = dark?"#050a0f":"#f0f4f8";
  const bgCard = dark?"#0a1520":"#fff";
  const border = dark?"#0d2a42":"#d0dce8";
  const grid   = dark?"#0d2a4244":"#d0dce844";
  const txt    = dark?"#8899aa":"#445566";

  const getApiSymbol = () => {
    if (!symbol) return "EUR/USD";
    if (["Index","Boom","Crash","Jump","Step"].some(k=>symbol.includes(k))) return null;
    if (symbol.length===6 && !symbol.includes("/")) return symbol.slice(0,3)+"/"+symbol.slice(3);
    return symbol;
  };

  const fetchCandles = useCallback(async()=>{
    const apiSym = getApiSymbol();
    if (!apiSym) { setError("Chart unavailable for synthetic indices"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${apiSym}&interval=${TF_MAP[tf]}&outputsize=200&apikey=${TWELVE_KEY}`);
      const data = await res.json();
      if (data.status==="error") { setError(data.message||"API error"); setLoading(false); return; }
      setCandles(data.values.map(v=>({
        t:v.datetime, o:parseFloat(v.open), h:parseFloat(v.high),
        l:parseFloat(v.low), c:parseFloat(v.close)
      })).reverse());
      setOffset(0);
    } catch(e) { setError("Fetch failed"); }
    setLoading(false);
  },[symbol,tf]);

  useEffect(()=>{ fetchCandles(); },[fetchCandles]);

  useEffect(()=>{
    if (!candles.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height;
    const PAXIS=64, PT=18, PB=28;
    const chartW=W-PAXIS;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=bgCard; ctx.fillRect(0,0,W,H);

    const start=Math.max(0,candles.length-zoom-offset);
    const end=candles.length-(offset||0);
    const visible=candles.slice(start,end);
    if (!visible.length) return;

    const maxP=Math.max(...visible.map(c=>c.h));
    const minP=Math.min(...visible.map(c=>c.l));
    const range=maxP-minP||0.0001;
    const toY=p=>PT+((maxP-p)/range)*(H-PT-PB);
    const cw=Math.max(2,Math.floor(chartW/visible.length)-1);
    const toX=i=>Math.floor(i*(chartW/visible.length));

    // Grid
    ctx.lineWidth=1;
    for (let i=0;i<=6;i++) {
      const y=PT+(i/6)*(H-PT-PB);
      ctx.strokeStyle=grid;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(chartW,y); ctx.stroke();
      ctx.fillStyle=txt; ctx.font="9px monospace";
      ctx.fillText((maxP-(i/6)*range).toFixed(5),chartW+3,y+3);
    }

    // EMAs
    const closes=candles.map(c=>c.c);
    const ema20=calcEMA(closes,20);
    const ema50=calcEMA(closes,50);
    const ema200=calcEMA(closes,200);
    [[ema20,"#00ccff"],[ema50,"#ffaa00"],[ema200,"#ff44ff"]].forEach(([ema,col])=>{
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.beginPath();
      let started=false;
      for (let i=start;i<end;i++) {
        if (ema[i]===null||ema[i]===undefined) continue;
        const x=toX(i-start)+cw/2, y=toY(ema[i]);
        if (!started){ctx.moveTo(x,y);started=true;}else ctx.lineTo(x,y);
      }
      ctx.stroke();
    });

    // Candles
    visible.forEach((c,i)=>{
      const x=toX(i), bull=c.c>=c.o, col=bull?"#00dd55":"#ff3355";
      ctx.strokeStyle=col; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+cw/2,toY(c.h)); ctx.lineTo(x+cw/2,toY(c.l)); ctx.stroke();
      ctx.fillStyle=col;
      const by=Math.min(toY(c.o),toY(c.c));
      ctx.fillRect(x,by,cw,Math.max(1,Math.abs(toY(c.c)-toY(c.o))));
    });

    // Time labels
    const step=Math.max(1,Math.floor(visible.length/5));
    ctx.fillStyle=txt; ctx.font="8px monospace";
    for (let i=0;i<visible.length;i+=step)
      ctx.fillText((visible[i].t||"").slice(11,16)||(visible[i].t||"").slice(5,10),toX(i),H-6);

    // Current price
    const last=candles[end-1]?.c;
    if (last) {
      const y=toY(last);
      ctx.setLineDash([3,3]); ctx.strokeStyle="#ffffff44"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(chartW,y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle="#ffd700"; ctx.fillRect(chartW,y-8,PAXIS,16);
      ctx.fillStyle="#000"; ctx.font="bold 9px monospace";
      ctx.fillText(last.toFixed(5),chartW+3,y+4);
    }

    // Legend
    [["EMA20","#00ccff"],["EMA50","#ffaa00"],["EMA200","#ff44ff"]].forEach(([l,c],i)=>{
      ctx.fillStyle=c; ctx.fillRect(8+i*68,4,20,3);
      ctx.fillStyle=txt; ctx.font="8px monospace"; ctx.fillText(l,32+i*68,9);
    });
  },[candles,dark,offset,zoom,bgCard,grid,txt]);

  const onMouseDown=e=>{ dragRef.current=e.clientX; };
  const onMouseMove=e=>{
    if (dragRef.current===null) return;
    const dx=dragRef.current-e.clientX;
    const cw=(canvasRef.current?.width||300)/zoom;
    const delta=Math.round(dx/cw);
    if (delta!==0){
      setOffset(o=>Math.max(0,Math.min(candles.length-zoom,o+delta)));
      dragRef.current=e.clientX;
    }
  };
  const onMouseUp=()=>{ dragRef.current=null; };

  const chartH=fullscreen?window.innerHeight-120:half?180:320;
  const apiSym=getApiSymbol();
  const btnStyle=(active,col="#ffd700")=>({
    padding:"3px 8px", background:active?col+"22":"transparent",
    border:`1px solid ${active?col:border}`, color:active?col:txt,
    borderRadius:4, fontSize:9, cursor:"pointer", fontFamily:"monospace"
  });

  return (
    <div style={{ background:bgCard, border:`1px solid ${border}`, borderRadius:12,
      overflow:"hidden", marginBottom:12,
      ...(fullscreen?{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,borderRadius:0,margin:0}:{}) }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"8px 12px", borderBottom:`1px solid ${border}`, flexWrap:"wrap", gap:4 }}>
        <span style={{ fontSize:9, color:"#ffd700", fontWeight:700 }}>📊 {symbol} CHART</span>
        <div style={{ display:"flex", gap:3, flexWrap:"wrap", alignItems:"center" }}>
          {["1m","5m","15m","1h","4h","1d"].map(t=>(
            <button key={t} onClick={()=>setTf(t)} style={btnStyle(tf===t)}>{t}</button>
          ))}
          <button onClick={()=>setZoom(z=>Math.max(20,z-10))} style={btnStyle(false)}>+</button>
          <button onClick={()=>setZoom(z=>Math.min(200,z+10))} style={btnStyle(false)}>−</button>
          <button onClick={()=>{setHalf(h=>!h);setFullscreen(false);}} style={btnStyle(half,"#4499ff")}>⬒</button>
          <button onClick={()=>{setFullscreen(f=>!f);setHalf(false);}} style={btnStyle(fullscreen,"#ff444f")}>{fullscreen?"✕":"⛶"}</button>
          <button onClick={fetchCandles} style={btnStyle(false)}>↺</button>
        </div>
      </div>

      {/* Canvas */}
      {!apiSym?(
        <div style={{height:chartH,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}>
          <div style={{fontSize:22}}>📊</div>
          <div style={{fontSize:10,color:txt}}>Chart unavailable for synthetic indices</div>
        </div>
      ):loading?(
        <div style={{height:chartH,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:10,color:txt}}>Loading chart...</div>
        </div>
      ):error?(
        <div style={{height:chartH,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
          <div style={{fontSize:10,color:"#ff5577"}}>⚠ {error}</div>
          <button onClick={fetchCandles} style={{...btnStyle(false),padding:"6px 14px"}}>Retry</button>
        </div>
      ):(
        <canvas ref={canvasRef} width={900} height={chartH}
          style={{width:"100%",height:chartH,display:"block",cursor:"crosshair",touchAction:"pan-y"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(20,Math.min(200,z+(e.deltaY>0?5:-5))));}}
        />
      )}

      {/* Legend */}
      <div style={{display:"flex",gap:12,padding:"5px 12px",borderTop:`1px solid ${border}`,flexWrap:"wrap"}}>
        {[["EMA 20","#00ccff"],["EMA 50","#ffaa00"],["EMA 200","#ff44ff"]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:16,height:2,background:c,borderRadius:1}}/>
            <span style={{fontSize:8,color:c,fontWeight:700}}>{l}</span>
          </div>
        ))}
        <span style={{marginLeft:"auto",fontSize:8,color:txt}}>Drag·Scroll to zoom</span>
      </div>
    </div>
  );
}
