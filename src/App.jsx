import { useState, useRef, useEffect } from "react";
import Academy from "./Academy";
import Quiz from "./Quiz";
import Fast from "./Fast";
import LongTerm from "./LongTerm";
import Elite from "./Elite";
import RiskCalc from "./RiskCalc";
import LiveSignals from "./LiveSignals";
import Splash from "./Splash";
import Auth from "./Auth";
import { supabase } from "./supabase";

const GEMINI_KEY = "AIzaSyDLXA3uOQuQmJQanhcSQmCnPqaAJL2l4xU";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
const PROMPT = `You are APEX FX — elite candlestick analyst. Analyze chart screenshot. ALWAYS give prediction. entry_signal BUY = candles UP, SELL = candles DOWN. Return ONLY JSON:
{"pair":"UNKNOWN","timeframe":"","market_bias":"BULLISH or BEARISH or NEUTRAL","trend":"","patterns":[],"support":"","resistance":"","entry_signal":"BUY or SELL or WAIT","trade_duration":"","candles":[{"number":1,"direction":"UP or DOWN","strength":"STRONG or MEDIUM or WEAK","confidence":85,"reason":""},{"number":2,"direction":"UP or DOWN","strength":"STRONG or MEDIUM or WEAK","confidence":80,"reason":""},{"number":3,"direction":"UP or DOWN","strength":"STRONG or MEDIUM or WEAK","confidence":75,"reason":""}],"summary":""}`;

export default function App() {
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("analyzer");
  const [image, setImage] = useState(null);
  const [b64, setB64] = useState(null);
  const [mime, setMime] = useState("image/png");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user || null));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const t = {
    bg: dark?"#050a0f":"#f0f4f8", bgCard: dark?"rgba(0,20,40,0.8)":"#fff",
    bgH: dark?"#030810":"#fff", border: dark?"#0d2a42":"#d0dce8",
    borderD: dark?"#1e4060":"#a0b8cc", text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566", dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677", inp: dark?"rgba(0,40,80,0.2)":"#e8f0f8",
    hist: dark?"rgba(0,15,30,0.8)":"#f8fbff",
  };

  const bc = b => b==="BULLISH"?"#00bb55":b==="BEARISH"?"#ee2244":"#dd9900";
  const dc = d => d==="UP"?"#00bb55":"#ee2244";
  const sc = s => s==="BUY"?"#00bb55":s==="SELL"?"#ee2244":"#dd9900";

  const load = f => {
    if (!f?.type?.startsWith("image/")) return;
    setMime(f.type);
    const r = new FileReader();
    r.onload = e => { setImage(e.target.result); setB64(e.target.result.split(",")[1]); setResult(null); setErr(null); };
    r.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!b64) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch(GEMINI_URL, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ contents:[{parts:[{text:PROMPT+"\nAnalyze this chart."},{inline_data:{mime_type:mime,data:b64}}]}], generationConfig:{temperature:0.2,maxOutputTokens:8192,responseMimeType:"application/json"} })
      });
      const data = await res.json();
      if (data.error) { setErr(data.error.message); setLoading(false); return; }
      const raw = data.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("") || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setResult(parsed);
      setHistory(h => [{image,analysis:parsed,time:new Date().toLocaleTimeString()},...h].slice(0,20));
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  const TABS = [
    {id:"analyzer",label:"⚡ ANALYZER"},{id:"academy",label:"🎓 ACADEMY"},
    {id:"quiz",label:"🧩 QUIZ"},{id:"fast",label:"⚡ FAST"},
    {id:"longterm",label:"📈 LONG TERM"},{id:"elite",label:"★ ELITE"},
    {id:"risk",label:"🧮 RISK"},{id:"live",label:"📡 LIVE"},
  ];

  if (splash) return <Splash onDone={() => setSplash(false)} />;
  if (!authReady) return <div style={{minHeight:"100vh",background:"#050a0f",display:"flex",alignItems:"center",justifyContent:"center",color:"#0066ff",fontFamily:"monospace"}}>Loading...</div>;
  if (!user) return <Auth onLogin={setUser} />;

  return (
    <div style={{height:"100vh",background:t.bg,color:t.text,fontFamily:"'IBM Plex Mono',monospace",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#1e4060;border-radius:2px}
        .sb{background:linear-gradient(135deg,#0066ff,#0044bb);border:none;color:#fff;padding:14px;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;width:100%;border-radius:6px;transition:all 0.2s}
        .sb:hover:not(:disabled){background:linear-gradient(135deg,#0088ff,#0055cc)}
        .sb:disabled{opacity:0.4;cursor:not-allowed}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .tb::-webkit-scrollbar{display:none}
        .tb{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* HEADER */}
      <div style={{flexShrink:0,background:t.bgH,borderBottom:`1px solid ${t.border}`,padding:"0 16px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:"linear-gradient(135deg,#0066ff,#00aaff)",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:13,color:"#fff"}}>▲</span>
            </div>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:dark?"#fff":"#0044bb",letterSpacing:3}}>APEX <span style={{color:"#ffd700"}}>FX</span></div>
              <div style={{fontSize:7,letterSpacing:2,color:t.dim}}>CANDLE INTELLIGENCE</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:8,color:t.dim,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</span>
            <span style={{fontSize:9,color:"#00aa44"}}>● LIVE</span>
            <button onClick={()=>setDark(!dark)} style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:14}}>
              {dark?"☀️":"🌙"}
            </button>
            <button onClick={()=>supabase.auth.signOut()} style={{background:"#ff224411",border:"1px solid #ff224433",borderRadius:5,padding:"4px 8px",cursor:"pointer",fontSize:9,color:"#ff4466",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700}}>
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tb" style={{flexShrink:0,background:t.bgH,borderBottom:`1px solid ${t.border}`,overflowX:"auto"}}>
        <div style={{display:"flex",minWidth:"max-content",padding:"0 6px"}}>
          {TABS.map(tb => (
            <button key={tb.id} onClick={()=>setTab(tb.id)} style={{padding:"12px 16px",background:"transparent",border:"none",borderBottom:tab===tb.id?"3px solid #0066ff":"3px solid transparent",color:tab===tb.id?"#0066ff":t.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s"}}>
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
        {tab==="academy" && <Academy dark={dark} />}
        {tab==="quiz" && <Quiz dark={dark} />}
        {tab==="fast" && <Fast dark={dark} />}
        {tab==="longterm" && <LongTerm dark={dark} />}
        {tab==="elite" && <Elite dark={dark} />}
        {tab==="risk" && <RiskCalc dark={dark} />}
        {tab==="live" && <LiveSignals dark={dark} />}

        {tab==="analyzer" && (
          <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"16px",display:"grid",gridTemplateColumns:"1fr 280px",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>

              <div style={{border:`2px dashed ${drag?"#0088ff":t.borderD}`,background:drag?(dark?"rgba(0,100,255,0.06)":"#e8f4ff"):t.inp,borderRadius:8,padding:20,textAlign:"center",minHeight:180,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all 0.2s"}}
                onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
                onDrop={e=>{e.preventDefault();setDrag(false);load(e.dataTransfer.files[0])}}
                onClick={()=>fileRef.current.click()}>
                <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>load(e.target.files[0])} />
                {image ? (
                  <div style={{width:"100%",position:"relative"}}>
                    <img src={image} alt="" style={{width:"100%",maxHeight:240,objectFit:"contain",borderRadius:6,border:`1px solid ${t.border}`}} />
                    <div style={{position:"absolute",top:8,right:8,background:"#0066ff",color:"#fff",fontSize:9,padding:"3px 8px",borderRadius:4,fontWeight:700}}>READY</div>
                  </div>
                ) : (
                  <>
                    <div style={{fontSize:36}}>📊</div>
                    <div style={{fontSize:13,fontWeight:700,color:dark?"#4499cc":"#0055aa"}}>DROP CHART HERE</div>
                    <div style={{fontSize:10,color:t.muted}}>PNG / JPG / WEBP · Any pair · Any TF</div>
                  </>
                )}
              </div>

              <div style={{display:"flex",gap:8}}>
                <button className="sb" onClick={analyze} disabled={!b64||loading} style={{flex:1}}>
                  {loading?"⟳ SCANNING...":"⚡ RUN APEX FX ANALYSIS"}
                </button>
                {image && <button onClick={()=>{setImage(null);setB64(null);setResult(null);setErr(null);}} style={{background:t.bgCard,border:`1px solid ${t.border}`,color:t.muted,padding:"14px 16px",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",borderRadius:6,fontWeight:600}}>CLEAR</button>}
              </div>

              {err && <div style={{background:dark?"#2a000a":"#fff0f3",border:"1px solid #cc0022",padding:"10px 14px",fontSize:11,color:"#cc0022",borderRadius:6}}>⚠ {err}</div>}
              {loading && <div style={{background:t.bgCard,border:`1px solid ${t.border}`,padding:20,textAlign:"center",borderRadius:8}}><div className="pulse" style={{fontSize:12,fontWeight:700,letterSpacing:2,color:"#0088ff"}}>APEX FX SCANNING...</div></div>}

              {result && !loading && (
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"14px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
                    {[{l:"PAIR",v:result.pair,c:dark?"#fff":"#001133"},{l:"TIMEFRAME",v:result.timeframe,c:t.muted},{l:"BIAS",v:result.market_bias,c:bc(result.market_bias)},{l:"SIGNAL",v:result.entry_signal,c:sc(result.entry_signal)}].map(({l,v,c})=>(
                      <div key={l}><div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:4,fontWeight:600}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div></div>
                    ))}
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"12px 14px"}}>
                      <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:4,fontWeight:600}}>DURATION</div>
                      <div style={{fontSize:12,color:"#dd9900",fontWeight:700}}>⏱ {result.trade_duration}</div>
                    </div>
                    <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"12px 14px"}}>
                      <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:4,fontWeight:600}}>TREND</div>
                      <div style={{fontSize:10,color:t.muted,lineHeight:1.5}}>{result.trend}</div>
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {(result.candles||[]).map(c=>(
                      <div key={c.number} style={{background:t.bgCard,border:`2px solid ${dc(c.direction)}33`,borderRadius:8,padding:12,borderTop:`3px solid ${dc(c.direction)}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                          <span style={{fontSize:9,color:t.label,fontWeight:700}}>#{c.number}</span>
                          <span style={{background:dc(c.direction)+"22",color:dc(c.direction),fontSize:9,padding:"1px 6px",borderRadius:3,fontWeight:700}}>{c.direction==="UP"?"▲ UP":"▼ DOWN"}</span>
                        </div>
                        <div style={{fontSize:22,fontWeight:900,color:dc(c.direction),fontFamily:"'Orbitron',sans-serif",marginBottom:2}}>{c.confidence}%</div>
                        <div style={{fontSize:9,color:t.muted,marginBottom:6,fontWeight:600}}>{c.strength}</div>
                        <div style={{height:4,background:dark?"#0a1520":"#e0eaf4",borderRadius:2,overflow:"hidden",marginBottom:8}}>
                          <div style={{width:`${c.confidence}%`,height:"100%",background:dc(c.direction),borderRadius:2}} />
                        </div>
                        <div style={{fontSize:9,color:t.muted,lineHeight:1.5}}>{c.reason}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderLeft:`4px solid ${bc(result.market_bias)}`,borderRadius:8,padding:"12px 16px"}}>
                    <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:6,fontWeight:700}}>APEX FX SUMMARY</div>
                    <div style={{fontSize:11,color:t.muted,lineHeight:1.8}}>{result.summary}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:10,letterSpacing:2,color:t.label,fontWeight:700}}>HISTORY ({history.length})</div>
              {history.length===0 && <div style={{border:`1px dashed ${t.borderD}`,borderRadius:8,padding:16,textAlign:"center",fontSize:10,color:t.dim}}>No scans yet</div>}
              {history.map((h,i)=>(
                <div key={i} onClick={()=>setResult(h.analysis)} style={{background:t.hist,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 10px",cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:9,color:t.label}}>#{history.length-i} · {h.time}</span>
                    <span style={{background:sc(h.analysis.entry_signal)+"22",color:sc(h.analysis.entry_signal),fontSize:8,padding:"1px 6px",borderRadius:3,fontWeight:700}}>{h.analysis.entry_signal}</span>
                  </div>
                  <img src={h.image} alt="" style={{width:"100%",height:50,objectFit:"cover",borderRadius:4,marginBottom:4}} />
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:10,color:t.text,fontWeight:600}}>{h.analysis.pair}</span>
                    <span style={{fontSize:10,color:bc(h.analysis.market_bias),fontWeight:700}}>{h.analysis.market_bias}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{flexShrink:0,borderTop:`1px solid ${t.border}`,padding:"6px 16px",display:"flex",justifyContent:"space-between",background:t.bgH}}>
        <div style={{fontSize:9,color:t.dim}}>APEX FX · PRINCE X TOOLS</div>
        <div style={{fontSize:9,color:t.dim}}>TRADING INVOLVES RISK</div>
      </div>
    </div>
  );
}
