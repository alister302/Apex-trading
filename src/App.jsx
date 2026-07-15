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
import Subscription from "./Subscription";
import AdminDashboard from "./AdminDashboard";
import { supabase } from "./supabase";
import AffiliatePage from "./AffiliatePage";
import InfluencerPage from "./InfluencerPage";

const SERVER = "https://apex-server-09p7.onrender.com";
const GEMINI_KEY = "AIzaSyDLXA3uOQuQmJQanhcSQmCnPqaAJL2l4xU";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
const PROMPT = `You are PRINCEX IQ — elite candlestick analyst. Analyze chart screenshot. ALWAYS give prediction. Return ONLY JSON:
{"pair":"UNKNOWN","timeframe":"","market_bias":"BULLISH or BEARISH or NEUTRAL","trend":"","patterns":[],"support":"","resistance":"","entry_signal":"BUY or SELL or WAIT","trade_duration":"","candles":[{"number":1,"direction":"UP or DOWN","strength":"STRONG or MEDIUM or WEAK","confidence":85,"reason":""},{"number":2,"direction":"UP or DOWN","strength":"STRONG or MEDIUM or WEAK","confidence":80,"reason":""},{"number":3,"direction":"UP or DOWN","strength":"STRONG or MEDIUM or WEAK","confidence":75,"reason":""}],"summary":""}`;

const PREMIUM_TABS = ["analyzer","academy","quiz","fast","longterm","elite","risk","live"];

function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  const maskedLocal = local.slice(0,2) + "***";
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0].slice(0,2) + "***." + domainParts.slice(1).join(".");
  return maskedLocal + "@" + maskedDomain;
}

export default function App() {
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [sub, setSub] = useState(null);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("analyzer");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [adminPrompt, setAdminPrompt] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminErr, setAdminErr] = useState("");
  const [image, setImage] = useState(null);
  const [b64, setB64] = useState(null);
  const [mime, setMime] = useState("image/png");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [history, setHistory] = useState([]);
  const [drag, setDrag] = useState(false);
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [showInfluencer, setShowInfluencer] = useState(false);
  const fileRef = useRef();

  // Save ref code on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("princex_ref", ref.toUpperCase());
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
      setAuthReady(true);
    });
    const { data: s } = supabase.auth.onAuthStateChange((_, sess) => setUser(sess?.user || null));
    return () => s?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    checkSub();
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get("OrderTrackingId");
    const orderId = localStorage.getItem("apex_order_id");
    if (trackId && orderId) verifyPayment(trackId, orderId);
  }, [user]);

  // Check Supabase if user has OlympTrade ID
  useEffect(() => {
    if (!user) return;
    saveReferral(user.id);
    const checkOlympTrade = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("olymptrade_id, role")
        .eq("id", user.id)
        .single();
      // Admins bypass affiliate requirement
      if (data?.role === "admin") { setShowAffiliate(false); return; }
      // If no OlympTrade ID - block and show affiliate page
      if (!data?.olymptrade_id) setShowAffiliate(true);
      else setShowAffiliate(false);
    };
    checkOlympTrade();
  }, [user]);

  const saveReferral = async (userId) => {
    const ref = localStorage.getItem('princex_ref');
    if (!ref) {
      // Check if profile already has referred_by from Supabase trigger
      try {
        const { data: profile } = await supabase.from('profiles').select('referred_by').eq('id', userId).single();
        if (profile?.referred_by) {
          // Already tracked via Supabase trigger - just sync with server
          await fetch(SERVER + '/referral/track-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, ref_code: profile.referred_by }),
          });
        }
      } catch(e) {}
      return;
    }
    try {
      await supabase.from('profiles').update({ referred_by: ref }).eq('id', userId);
      await fetch(SERVER + '/referral/track-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ref_code: ref }),
      });
      localStorage.removeItem('princex_ref');
    } catch(e) { console.log('Referral failed:', e.message); }
  };

  const checkSub = async () => {
    try {
      const res = await fetch(`${SERVER}/subscription/${user.id}`);
      const data = await res.json();
      setSub(data);
      return data;
    } catch(e) {}
  };

  // Poll subscription every 15 seconds to catch M-Pesa callbacks
  useEffect(() => {
    if (!user) return;
    const poll = setInterval(async () => {
      const data = await checkSub();
      // Stop polling once active
      if (data?.active) clearInterval(poll);
    }, 15000);
    return () => clearInterval(poll);
  }, [user]);

  const verifyPayment = async (trackId, orderId) => {
    try {
      const res = await fetch(`${SERVER}/pesapal/verify`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ order_tracking_id:trackId, order_id:orderId, user_id:user.id })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem("apex_order_id");
        localStorage.removeItem("apex_plan");
        window.history.replaceState({}, "", "/");
        await checkSub();
        setShowSub(false);
      }
    } catch(e) {}
  };

  const isAdmin = sub?.role === "admin";
  const isPremium = isAdmin || sub?.active === true;

  const verifyAdmin = async () => {
    setAdminErr("");
    try {
      const res = await fetch(`${SERVER}/admin/verify`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ passkey: adminKey })
      });
      const data = await res.json();
      if (data.valid) {
        sessionStorage.setItem("apex_admin_key", adminKey);
        setAdminPrompt(false);
        setAdminKey("");
        setShowAdmin(true);
      } else setAdminErr("Invalid passkey");
    } catch(e) { setAdminErr("Connection failed"); }
  };

  const handleTab = (id) => {
    if (PREMIUM_TABS.includes(id) && !isPremium) { setShowSub(true); return; }
    setTab(id); setShowSub(false);
  };

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.8)":"#fff",
    bgH: dark?"#030810":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    borderD: dark?"#1e4060":"#a0b8cc",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
    inp: dark?"rgba(0,40,80,0.2)":"#e8f0f8",
    hist: dark?"rgba(0,15,30,0.8)":"#f8fbff",
  };

  const bc = b => b==="BULLISH"?"#00bb55":b==="BEARISH"?"#ee2244":"#dd9900";
  const dc = d => d==="UP"?"#00bb55":"#ee2244";
  const sc = s => s==="BUY"?"#00bb55":s==="SELL"?"#ee2244":"#dd9900";

  const loadFile = f => {
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
      const res = await fetch(GEMINI_URL, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ contents:[{parts:[{text:PROMPT},{inline_data:{mime_type:mime,data:b64}}]}], generationConfig:{temperature:0.2,maxOutputTokens:8192,responseMimeType:"application/json"} })
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
    {id:"analyzer",label:"⚡ ANALYZER",premium:false},
    {id:"iq",label:"🎓 IQ",premium:false},
    {id:"quiz",label:"🧩 QUIZ",premium:false},
    {id:"fast",label:"⚡ FAST",premium:true},
    {id:"longterm",label:"📈 LONG TERM",premium:true},
    {id:"elite",label:"★ ELITE",premium:true},
    {id:"risk",label:"🧮 RISK",premium:false},
    {id:"live",label:"📡 LIVE",premium:false},
    {id:"partner",label:"💼 PARTNER",premium:false},
  ];

  if (splash) return <Splash onDone={() => setSplash(false)} />;
  if (!authReady) return (
    <div style={{minHeight:"100vh",background:"#050a0f",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
      <div style={{width:40,height:40,background:"linear-gradient(135deg,#0066ff,#00aaff)",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)"}} />
      <div style={{color:"#0066ff",fontFamily:"monospace",fontSize:12,letterSpacing:2}}>LOADING...</div>
    </div>
  );
  if (!user) return <Auth onLogin={u => setUser(u)} />;
  if (showAdmin && isAdmin) return <AdminDashboard dark={dark} onExit={() => setShowAdmin(false)} />;

  // BLOCK users who haven't submitted OlympTrade ID
  if (showAffiliate) return (
    <AffiliatePage user={user} supabase={supabase} onVerified={() => setShowAffiliate(false)} />
  );

  return (
    <div style={{height:"100vh",background:t.bg,color:t.text,fontFamily:"'IBM Plex Mono',monospace",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#1e4060;border-radius:2px}
        .sb{background:linear-gradient(135deg,#0066ff,#0044bb);border:none;color:#fff;padding:14px;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;letter-spacing:2px;cursor:pointer;width:100%;border-radius:6px;transition:all 0.2s}
        .sb:hover:not(:disabled){filter:brightness(1.15)}
        .sb:disabled{opacity:0.4;cursor:not-allowed}
        .pulse{animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .tb::-webkit-scrollbar{display:none}
        .tb{-ms-overflow-style:none;scrollbar-width:none}
        .hbtn{transition:all 0.15s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .hbtn:hover{opacity:0.8;transform:translateY(-1px)}
      `}</style>

      {/* ADMIN PASSKEY MODAL */}
      {showInfluencer && (
        <InfluencerPage user={user} supabase={supabase} dark={dark} onClose={()=>setShowInfluencer(false)} />
      )}
      {adminPrompt && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:dark?"#030810":"#fff",border:"1px solid #ffd70033",borderRadius:14,padding:28,width:"100%",maxWidth:360,boxShadow:"0 0 40px #ffd70022"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:28,marginBottom:8}}>🔐</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:900,color:"#ffd700",letterSpacing:2}}>ADMIN ACCESS</div>
              <div style={{fontSize:10,color:t.dim,marginTop:4}}>Enter your admin passkey</div>
            </div>
            <input type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&verifyAdmin()}
              placeholder="Admin passkey..."
              style={{width:"100%",padding:"12px 14px",background:"rgba(0,40,80,0.3)",border:"1px solid #0d2a42",borderRadius:8,color:"#c8d8e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,outline:"none",marginBottom:10}} />
            {adminErr && <div style={{fontSize:11,color:"#ff4466",marginBottom:10,textAlign:"center"}}>⚠ {adminErr}</div>}
            <div style={{display:"flex",gap:8}}>
              <button className="hbtn" onClick={verifyAdmin} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#ffd700,#cc9900)",color:"#000",borderRadius:7,fontSize:11,letterSpacing:1}}>✓ VERIFY</button>
              <button className="hbtn" onClick={()=>{setAdminPrompt(false);setAdminKey("");setAdminErr("");}} style={{flex:1,padding:"11px",background:"transparent",border:`1px solid ${t.border}`,color:t.muted,borderRadius:7,fontSize:11}}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
     <div style={{flexShrink:0,background:t.bgH,borderBottom:`1px solid ${t.border}`,padding:"0 14px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:"linear-gradient(135deg,#0066ff,#00aaff)",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px #0066ff44"}}>
              <span style={{fontSize:12,color:"#fff"}}>▲</span>
            </div>
            <div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:dark?"#fff":"#0044bb",letterSpacing:3}}>
                PRINCEX <span style={{color:"#ffd700"}}>IQ</span>
              </div>
              <div style={{fontSize:7,letterSpacing:2,color:t.dim}}>PRINCEX IQ</div>
            </div>
          </div>

          {/* Right side controls */}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>

            {/* Masked email */}
            <span style={{fontSize:8,color:t.dim,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:window.innerWidth>480?"block":"none"}}>
              {maskEmail(user?.email)}
            </span>

            {/* Plan badge */}
            {isPremium && (
              <span style={{fontSize:8,padding:"2px 7px",background:isAdmin?"#ffd70022":"#00dd5522",border:`1px solid ${isAdmin?"#ffd70044":"#00dd5544"}`,color:isAdmin?"#ffd700":"#00dd55",borderRadius:4,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap"}}>
                {isAdmin?"👑 ADMIN":sub?.plan?.toUpperCase()+" ✓"}
              </span>
            )}

            {/* Live indicator */}
            <span style={{fontSize:8,color:"#00aa44",whiteSpace:"nowrap"}}>● LIVE</span>

            {/* Dark toggle */}
            <button className="hbtn" onClick={()=>setDark(!dark)}
              style={{background:"transparent",border:`1px solid ${t.border}`,borderRadius:5,padding:"4px 7px",fontSize:13}}>
              {dark?"☀️":"🌙"}
            </button>

            {/* Admin button - only for admins */}
            {isAdmin && (
              <button className="hbtn" onClick={()=>setAdminPrompt(true)}
                style={{background:"#ffd70022",border:"1px solid #ffd70033",borderRadius:5,padding:"5px 9px",fontSize:9,color:"#ffd700",letterSpacing:1}}>
                ⚙ ADMIN
              </button>
            )}

            {/* Upgrade/Active button */}
            <button className="hbtn" onClick={()=>setShowSub(!showSub)}
              style={{
                background: isPremium
                  ? (showSub?"#00dd5533":"#00dd5522")
                  : "linear-gradient(135deg,#ff6600,#cc3300)",
                border: isPremium?"1px solid #00dd5544":"none",
                borderRadius:6, padding:"6px 12px",
                fontSize:9, color: isPremium?"#00dd55":"#fff",
                fontWeight:700, letterSpacing:1, whiteSpace:"nowrap",
                boxShadow: isPremium?"none":"0 2px 12px #ff660044",
              }}>
              {isPremium ? (showSub?"✕ CLOSE":"✓ ACTIVE") : "⚡ UPGRADE"}
            </button>

            {/* Logout */}
            <button className="hbtn" onClick={()=>supabase.auth.signOut()}
              style={{background:"#ff224411",border:"1px solid #ff224433",borderRadius:5,padding:"5px 8px",fontSize:9,color:"#ff4466",fontWeight:700}}>
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tb" style={{flexShrink:0,background:t.bgH,borderBottom:`1px solid ${t.border}`,overflowX:"auto"}}>
        <div style={{display:"flex",minWidth:"max-content",padding:"0 4px"}}>
          {TABS.map(tb=>(
            <button key={tb.id} onClick={()=>handleTab(tb.id)}
              style={{padding:"11px 14px",background:"transparent",border:"none",borderBottom:tab===tb.id&&!showSub?"3px solid #0066ff":"3px solid transparent",color:tab===tb.id&&!showSub?"#0066ff":t.muted,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s",position:"relative"}}>
              {tb.label}
              {tb.premium&&!isPremium&&<span style={{position:"absolute",top:5,right:2,fontSize:7,color:"#ffd700"}}>🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>

        {showSub && (
          <Subscription user={user} sub={sub} onSubscribed={async()=>{ setShowSub(false); await checkSub(); }} dark={dark} />
        )}

        {!showSub && <>
          {tab==="iq" && <Academy dark={dark} />}
          {tab==="quiz" && <Quiz dark={dark} />}
          {tab==="fast" && <Fast dark={dark} />}
          {tab==="longterm" && <LongTerm dark={dark} />}
          {tab==="elite" && <Elite dark={dark} />}
          {tab==="risk" && <RiskCalc dark={dark} />}
          {tab==="live" && <LiveSignals dark={dark} isPremium={true} isAdmin={true} />}

          {tab==="partner" && <div style={{padding:20,fontFamily:"'IBM Plex Mono',monospace",color:dark?"#c8d8e8":"#1a2a3a"}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900,color:"#ffd700",marginBottom:8}}>💼 PARTNER PROGRAM</div>
            <div style={{fontSize:11,color:dark?"#8899aa":"#445566",marginBottom:20}}>Earn commissions by referring traders to PrinceX IQ</div>
            <button onClick={()=>setShowInfluencer(true)} style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#ffd700,#cc9900)",color:"#000",border:"none",borderRadius:10,fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:2}}>
              💼 JOIN PARTNER PROGRAM
            </button>
            <div style={{marginTop:20,background:dark?"#0a1520":"#e8f4ff",border:"1px solid #0066ff33",borderRadius:10,padding:"14px 16px"}}>
              <div style={{fontSize:10,color:"#4499ff",fontWeight:700,marginBottom:10}}>HOW IT WORKS</div>
              {[["1","Sign up as a partner below"],["2","Get your unique referral link"],["3","Share with traders on WhatsApp, TikTok, Instagram"],["4","Earn KES 100-1,200 per subscription"],["5","Request M-Pesa payout at KES 1,000+"]].map(([n,s])=>(
                <div key={n} style={{display:"flex",gap:10,marginBottom:8,alignItems:"center"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:"#ffd70022",border:"1px solid #ffd70044",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:9,color:"#ffd700",fontWeight:900}}>{n}</span>
                  </div>
                  <span style={{fontSize:10,color:dark?"#8899aa":"#445566"}}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[["Weekly","KES 100"],["Monthly","KES 250"],["Annual","KES 1,200"]].map(([p,c])=>(
                <div key={p} style={{background:dark?"#0a1520":"#f0f8ff",border:"1px solid #ffd70033",borderRadius:8,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:dark?"#667788":"#556677"}}>{p}</div>
                  <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:900,color:"#ffd700"}}>{c}</div>
                </div>
              ))}
            </div>
          </div>}
          {tab==="analyzer" && (
            <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"14px",display:"grid",gridTemplateColumns:"1fr 260px",gap:14}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>

                {/* Upload area */}
                <div
                  style={{border:`2px dashed ${drag?"#0088ff":t.borderD}`,background:drag?(dark?"rgba(0,100,255,0.06)":"#e8f4ff"):t.inp,borderRadius:8,padding:18,textAlign:"center",minHeight:170,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all 0.2s"}}
                  onDragOver={e=>{e.preventDefault();setDrag(true)}}
                  onDragLeave={()=>setDrag(false)}
                  onDrop={e=>{e.preventDefault();setDrag(false);loadFile(e.dataTransfer.files[0])}}
                  onClick={()=>fileRef.current.click()}>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])} />
                  {image ? (
                    <div style={{width:"100%",position:"relative"}}>
                      <img src={image} alt="" style={{width:"100%",maxHeight:230,objectFit:"contain",borderRadius:6,border:`1px solid ${t.border}`}} />
                      <div style={{position:"absolute",top:8,right:8,background:"#0066ff",color:"#fff",fontSize:9,padding:"2px 8px",borderRadius:4,fontWeight:700}}>READY</div>
                    </div>
                  ) : (
                    <>
                      <div style={{fontSize:34}}>📊</div>
                      <div style={{fontSize:12,fontWeight:700,color:dark?"#4499cc":"#0055aa"}}>DROP CHART SCREENSHOT HERE</div>
                      <div style={{fontSize:10,color:t.muted}}>PNG / JPG / WEBP · Any pair · Any timeframe</div>
                      <div style={{fontSize:9,color:t.dim}}>OTC · Forex · Crypto · All supported</div>
                    </>
                  )}
                </div>

                <div style={{display:"flex",gap:8}}>
                  <button className="sb" onClick={analyze} disabled={!b64||loading} style={{flex:1}}>
                    {loading ? "⟳  SCANNING..." : "⚡  RUN PRINCEX IQ ANALYSIS"}
                  </button>
                  {image && (
                    <button onClick={()=>{setImage(null);setB64(null);setResult(null);setErr(null);}}
                      style={{background:t.bgCard,border:`1px solid ${t.border}`,color:t.muted,padding:"14px 14px",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",borderRadius:6,fontWeight:600}}>
                      CLEAR
                    </button>
                  )}
                </div>

                {err && <div style={{background:dark?"#2a000a":"#fff0f3",border:"1px solid #cc0022",padding:"10px 14px",fontSize:11,color:"#cc0022",borderRadius:6}}>⚠ {err}</div>}

                {loading && (
                  <div style={{background:t.bgCard,border:`1px solid ${t.border}`,padding:20,textAlign:"center",borderRadius:8}}>
                    <div className="pulse" style={{fontSize:12,fontWeight:700,letterSpacing:2,color:"#0088ff"}}>⚡ PRINCEX IQ SCANNING CHART...</div>
                    <div style={{marginTop:8,fontSize:10,color:t.muted}}>Detecting patterns · Computing signals</div>
                  </div>
                )}

                {result && !loading && (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
                      {[
                        {l:"PAIR",v:result.pair,c:dark?"#fff":"#001133"},
                        {l:"TIMEFRAME",v:result.timeframe,c:t.muted},
                        {l:"BIAS",v:result.market_bias,c:bc(result.market_bias)},
                        {l:"SIGNAL",v:result.entry_signal,c:sc(result.entry_signal)}
                      ].map(({l,v,c})=>(
                        <div key={l}>
                          <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:4,fontWeight:600}}>{l}</div>
                          <div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:4,fontWeight:600}}>TRADE DURATION</div>
                        <div style={{fontSize:12,color:"#dd9900",fontWeight:700}}>⏱ {result.trade_duration}</div>
                      </div>
                      <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:4,fontWeight:600}}>TREND</div>
                        <div style={{fontSize:10,color:t.muted,lineHeight:1.5}}>{result.trend}</div>
                      </div>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:6,fontWeight:600}}>SUPPORT / RESISTANCE</div>
                        <div style={{fontSize:11,color:"#00bb55",marginBottom:5,fontWeight:600}}>▲ {result.support}</div>
                        <div style={{fontSize:11,color:"#ee2244",fontWeight:600}}>▼ {result.resistance}</div>
                      </div>
                      <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:6,fontWeight:600}}>PATTERNS</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {(result.patterns||[]).map((p,i)=>(
                            <span key={i} style={{background:dark?"#001a33":"#e0eeff",border:`1px solid ${dark?"#0d3a5a":"#99bbdd"}`,color:dark?"#4499cc":"#0055aa",fontSize:9,padding:"2px 7px",borderRadius:4,fontWeight:700}}>{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{fontSize:10,letterSpacing:2,color:t.label,marginBottom:8,fontWeight:700}}>NEXT 3 CANDLE PREDICTIONS</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                        {(result.candles||[]).map(c=>(
                          <div key={c.number} style={{background:t.bgCard,border:`2px solid ${dc(c.direction)}33`,borderRadius:8,padding:12,borderTop:`3px solid ${dc(c.direction)}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                              <span style={{fontSize:9,color:t.label,fontWeight:700}}>#{c.number}</span>
                              <span style={{background:dc(c.direction)+"22",color:dc(c.direction),fontSize:9,padding:"1px 6px",borderRadius:3,fontWeight:700}}>
                                {c.direction==="UP"?"▲ UP":"▼ DOWN"}
                              </span>
                            </div>
                            <div style={{fontSize:22,fontWeight:900,color:dc(c.direction),fontFamily:"'Orbitron',sans-serif"}}>{c.confidence}%</div>
                            <div style={{fontSize:9,color:t.muted,marginTop:2,marginBottom:6,fontWeight:600}}>{c.strength}</div>
                            <div style={{height:4,background:dark?"#0a1520":"#e0eaf4",borderRadius:2,overflow:"hidden",marginBottom:6}}>
                              <div style={{width:`${c.confidence}%`,height:"100%",background:dc(c.direction),borderRadius:2}} />
                            </div>
                            <div style={{fontSize:9,color:t.muted,lineHeight:1.5}}>{c.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderLeft:`4px solid ${bc(result.market_bias)}`,borderRadius:8,padding:"12px 14px"}}>
                      <div style={{fontSize:8,letterSpacing:2,color:t.label,marginBottom:6,fontWeight:700}}>PRINCEX IQ SUMMARY</div>
                      <div style={{fontSize:11,color:t.muted,lineHeight:1.8}}>{result.summary}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan History */}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,letterSpacing:2,color:t.label,fontWeight:700}}>SCAN HISTORY ({history.length})</div>
                {history.length===0 && (
                  <div style={{border:`1px dashed ${t.borderD}`,borderRadius:8,padding:14,textAlign:"center",fontSize:10,color:t.dim}}>No scans yet</div>
                )}
                {history.map((h,i)=>(
                  <div key={i} onClick={()=>setResult(h.analysis)}
                    style={{background:t.hist,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 10px",cursor:"pointer"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:9,color:t.label}}>#{history.length-i} · {h.time}</span>
                      <span style={{background:sc(h.analysis.entry_signal)+"22",color:sc(h.analysis.entry_signal),fontSize:8,padding:"1px 6px",borderRadius:3,fontWeight:700}}>{h.analysis.entry_signal}</span>
                    </div>
                    <img src={h.image} alt="" style={{width:"100%",height:48,objectFit:"cover",borderRadius:4,marginBottom:4}} />
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:10,color:t.text,fontWeight:600}}>{h.analysis.pair}</span>
                      <span style={{fontSize:10,color:bc(h.analysis.market_bias),fontWeight:700}}>{h.analysis.market_bias}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>}
      </div>

      {/* FOOTER */}
      <div style={{flexShrink:0,borderTop:`1px solid ${t.border}`,padding:"5px 14px",display:"flex",justifyContent:"space-between",background:t.bgH}}>
        <div style={{fontSize:8,color:t.dim}}>PRINCEX IQ · PRINCE X TOOLS</div>
        <div style={{fontSize:8,color:t.dim}}>TRADING INVOLVES RISK</div>
      </div>
    </div>
  );
}
// deploy Wed Jul  1 14:46:08 EAT 2026
// Wed Jul  1 15:03:09 EAT 2026
