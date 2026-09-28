import { useState, useEffect, useRef, useCallback } from "react";

const TWELVE_KEY = "62e0549bbdc04d76a224157e22da6bbd";
const TF_MAP = {"1m":"1min","5m":"5min","15m":"15min","1h":"1h","4h":"4h","1d":"1day"};
const MAX_CANDLES = 5000;

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
  const canvasRef   = useRef(null);
  const dragRef     = useRef(null);
  const lastDrag    = useRef(null);
  const [candles,   setCandles]   = useState([]);
  const [tf,        setTf]        = useState("15m");
  const [loading,   setLoading]   = useState(false);
  const [loadingMore,setLoadingMore]=useState(false);
  const [error,     setError]     = useState("");
  const [fullscreen,setFullscreen]= useState(false);
  const [half,      setHalf]      = useState(false);
  const [offset,    setOffset]    = useState(0);
  const [zoom,      setZoom]      = useState(80);
  const [hasMore,   setHasMore]   = useState(true);
  const [earliest,  setEarliest]  = useState(null);

  const bgCard = dark?"#0a1520":"#fff";
  const border = dark?"#0d2a42":"#d0dce8";
  const gridC  = dark?"#0d2a4233":"#d0dce833";
  const txt    = dark?"#8899aa":"#445566";

  const getApiSymbol = () => {
    if (!symbol) return "EUR/USD";
    if (["Index","Boom","Crash","Jump","Step"].some(k=>symbol.includes(k))) return null;
    if (symbol.length===6 && !symbol.includes("/")) return symbol.slice(0,3)+"/"+symbol.slice(3);
    return symbol;
  };

  // Initial fetch
  const fetchCandles = useCallback(async()=>{
    const apiSym = getApiSymbol();
    if (!apiSym) { setError("Chart unavailable for synthetic indices"); return; }
    setLoading(true); setError(""); setHasMore(true);
    try {
      const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${apiSym}&interval=${TF_MAP[tf]}&outputsize=500&apikey=${TWELVE_KEY}`);
      const data = await res.json();
      if (data.status==="error") { setError(data.message||"API error"); setLoading(false); return; }
      const c = data.values.map(v=>({
        t:v.datetime, o:parseFloat(v.open), h:parseFloat(v.high),
        l:parseFloat(v.low), c:parseFloat(v.close)
      })).reverse();
      setCandles(c);
      setEarliest(c[0]?.t || null);
      setOffset(0);
    } catch(e) { setError("Fetch failed"); }
    setLoading(false);
  },[symbol,tf]);

  useEffect(()=>{ fetchCandles(); },[fetchCandles]);

  // Load more historical candles
  const loadMore = useCallback(async()=>{
    const apiSym = getApiSymbol();
    if (!apiSym || !earliest || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const end = earliest.replace(" ","T");
      const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${apiSym}&interval=${TF_MAP[tf]}&outputsize=500&end_date=${end}&apikey=${TWELVE_KEY}`);
      const data = await res.json();
      if (data.status==="error" || !data.values?.length) { setHasMore(false); setLoadingMore(false); return; }
      const newC = data.values.map(v=>({
        t:v.datetime, o:parseFloat(v.open), h:parseFloat(v.high),
        l:parseFloat(v.low), c:parseFloat(v.close)
      })).reverse();
      // Remove overlap
      const filtered = newC.filter(c=>c.t < earliest);
      if (!filtered.length) { setHasMore(false); setLoadingMore(false); return; }
      setCandles(prev => {
        const merged = [...filtered, ...prev].slice(-MAX_CANDLES);
        return merged;
      });
      setEarliest(filtered[0]?.t || earliest);
      setOffset(o => o + filtered.length);
    } catch(e) {}
    setLoadingMore(false);
  },[earliest, tf, loadingMore, hasMore, symbol]);

  // Draw
  useEffect(()=>{
    if (!candles.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height;
    const PAXIS=68, PT=20, PB=30;
    const chartW=W-PAXIS;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=bgCard; ctx.fillRect(0,0,W,H);

    const start=Math.max(0,candles.length-zoom-offset);
    const end=Math.min(candles.length, candles.length-offset);
    const visible=candles.slice(start, end<=start?start+1:end);
    if (!visible.length) return;

    const maxP=Math.max(...visible.map(c=>c.h));
    const minP=Math.min(...visible.map(c=>c.l));
    const range=maxP-minP||0.0001;
    const toY=p=>PT+((maxP-p)/range)*(H-PT-PB);
    const cw=Math.max(2,Math.floor(chartW/visible.length)-1);
    const toX=i=>Math.floor(i*(chartW/visible.length));

    // Grid
    for (let i=0;i<=6;i++) {
      const y=PT+(i/6)*(H-PT-PB);
      ctx.strokeStyle=gridC; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(chartW,y); ctx.stroke();
      ctx.fillStyle=txt; ctx.font="9px monospace";
      ctx.fillText((maxP-(i/6)*range).toFixed(5),chartW+3,y+3);
    }

    // EMAs on full dataset for accuracy
    const closes=candles.map(c=>c.c);
    const ema20=calcEMA(closes,20);
    const ema50=calcEMA(closes,50);
    const ema200=calcEMA(closes,200);

    [[ema20,"#00ccff",1.5],[ema50,"#ffaa00",1.5],[ema200,"#ff44ff",2]].forEach(([ema,col,lw])=>{
      ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath();
      let started=false;
      for (let i=start;i<end;i++) {
        if (!ema[i]) continue;
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
      ctx.fillStyle=bull?col:"#ff3355";
      const by=Math.min(toY(c.o),toY(c.c));
      ctx.fillRect(x,by,cw,Math.max(1,Math.abs(toY(c.c)-toY(c.o))));
    });

    // Time labels
    ctx.fillStyle=txt; ctx.font="8px monospace";
    const step=Math.max(1,Math.floor(visible.length/6));
    for (let i=0;i<visible.length;i+=step) {
      const label=visible[i].t.slice(11,16)||visible[i].t.slice(5,10);
      ctx.fillText(label,toX(i),H-8);
    }

    // Current price badge
    const last=candles[candles.length-1-(offset||0)]?.c;
    if (last) {
      const y=toY(last);
      ctx.setLineDash([3,3]); ctx.strokeStyle="#ffffff33"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(chartW,y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle="#ffd700"; ctx.fillRect(chartW,y-9,PAXIS,18);
      ctx.fillStyle="#000"; ctx.font="bold 9px monospace";
      ctx.fillText(last.toFixed(5),chartW+3,y+4);
    }

    // EMA legend top-left
    [["EMA20","#00ccff"],["EMA50","#ffaa00"],["EMA200","#ff44ff"]].forEach(([l,c],i)=>{
      ctx.fillStyle=c; ctx.fillRect(8+i*72,5,22,3);
      ctx.fillStyle=txt; ctx.font="8px monospace"; ctx.fillText(l,34+i*72,10);
    });

    // Loading more indicator
    if (loadingMore) {
      ctx.fillStyle="#4499ff"; ctx.font="9px monospace";
      ctx.fillText("⟳ Loading history...", 8, H-10);
    }
    if (!hasMore) {
      ctx.fillStyle=txt; ctx.font="8px monospace";
      ctx.fillText("◀ All history loaded", 8, H-10);
    }

  },[candles,dark,offset,zoom,bgCard,gridC,txt,loadingMore,hasMore]);

  // Mouse/touch drag with auto load-more on left edge
  const onMouseDown=e=>{ dragRef.current=e.clientX; lastDrag.current=e.clientX; };
  const onMouseMove=e=>{
    if (dragRef.current===null) return;
    const dx=dragRef.current-e.clientX;
    const cw=Math.max(1,(canvasRef.current?.clientWidth||300)/zoom);
    const delta=Math.round(dx/cw);
    if (delta!==0){
      setOffset(o=>{
        const newO=Math.max(0,Math.min(candles.length-zoom,o+delta));
        // Load more when near left edge
        if (newO >= candles.length-zoom-10 && hasMore && !loadingMore) loadMore();
        return newO;
      });
      dragRef.current=e.clientX;
    }
  };
  const onMouseUp=()=>{ dragRef.current=null; };

  // Touch support
  const onTouchStart=e=>{ dragRef.current=e.touches[0].clientX; };
  const onTouchMove=e=>{
    if (dragRef.current===null) return;
    const dx=dragRef.current-e.touches[0].clientX;
    const cw=Math.max(1,(canvasRef.current?.clientWidth||300)/zoom);
    const delta=Math.round(dx/cw);
    if (delta!==0){
      setOffset(o=>{
        const newO=Math.max(0,Math.min(candles.length-zoom,o+delta));
        if (newO >= candles.length-zoom-10 && hasMore && !loadingMore) loadMore();
        return newO;
      });
      dragRef.current=e.touches[0].clientX;
    }
  };

  const chartH=fullscreen?window.innerHeight-100:half?180:320;
  const apiSym=getApiSymbol();
  const btn=(active,col="#ffd700")=>({
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
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:9, color:"#ffd700", fontWeight:700 }}>📊 {symbol}</span>
          <span style={{ fontSize:8, color:txt }}>{candles.length} candles</span>
          {loadingMore && <span style={{ fontSize:8, color:"#4499ff" }}>⟳ loading...</span>}
        </div>
        <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
          {["1m","5m","15m","1h","4h","1d"].map(t=>(
            <button key={t} onClick={()=>setTf(t)} style={btn(tf===t)}>{t}</button>
          ))}
          <button onClick={()=>setZoom(z=>Math.max(20,z-20))} style={btn(false)}>+</button>
          <button onClick={()=>setZoom(z=>Math.min(500,z+20))} style={btn(false)}>−</button>
          <button onClick={()=>loadMore()} disabled={!hasMore||loadingMore} style={btn(false,"#4499ff")}>◀ More</button>
          <button onClick={()=>{setHalf(h=>!h);setFullscreen(false);}} style={btn(half,"#4499ff")}>⬒</button>
          <button onClick={()=>{setFullscreen(f=>!f);setHalf(false);}} style={btn(fullscreen,"#ff444f")}>{fullscreen?"✕":"⛶"}</button>
          <button onClick={fetchCandles} style={btn(false)}>↺</button>
        </div>
      </div>

      {/* Canvas */}
      {!apiSym?(
        <div style={{height:chartH,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}>
          <div style={{fontSize:24}}>📊</div>
          <div style={{fontSize:10,color:txt}}>Chart unavailable for synthetic indices</div>
        </div>
      ):loading?(
        <div style={{height:chartH,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
          <div style={{fontSize:20}}>⟳</div>
          <div style={{fontSize:10,color:txt}}>Loading candles...</div>
        </div>
      ):error?(
        <div style={{height:chartH,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
          <div style={{fontSize:10,color:"#ff5577"}}>⚠ {error}</div>
          <button onClick={fetchCandles} style={{...btn(false),padding:"6px 14px"}}>Retry</button>
        </div>
      ):(
        <canvas ref={canvasRef} width={900} height={chartH}
          style={{width:"100%",height:chartH,display:"block",cursor:"ew-resize",touchAction:"pan-y"}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
          onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(20,Math.min(500,z+(e.deltaY>0?10:-10))));}}
        />
      )}

      {/* Footer legend */}
      <div style={{display:"flex",gap:12,padding:"5px 12px",borderTop:`1px solid ${border}`,flexWrap:"wrap",alignItems:"center"}}>
        {[["EMA 20","#00ccff"],["EMA 50","#ffaa00"],["EMA 200","#ff44ff"]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:18,height:2,background:c,borderRadius:1}}/>
            <span style={{fontSize:8,color:c,fontWeight:700}}>{l}</span>
          </div>
        ))}
        <span style={{marginLeft:"auto",fontSize:8,color:txt}}>← Drag/scroll to pan · Pinch to zoom</span>
      </div>
    </div>
  );
}
