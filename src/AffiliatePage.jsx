import { useState } from "react";

export default function AffiliatePage({ user, supabase, onVerified }) {
  const [step, setStep] = useState("register"); // register | paste
  const [otId, setOtId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmitId = async () => {
    setError("");
    // Validate — OlympTrade IDs are numeric, 5-12 digits
    const cleaned = otId.trim().replace(/\D/g, "");
    if (cleaned.length < 5 || cleaned.length > 12) {
      setError("Invalid ID — OlympTrade IDs are 5-12 digits. Check your profile page.");
      return;
    }
    setLoading(true);
    try {
      const { error: e } = await supabase
        .from("profiles")
        .update({ olymptrade_id: cleaned })
        .eq("id", user.id);
      if (e) { setError("Failed to save: " + e.message); setLoading(false); return; }
      // Verified — unlock app
      onVerified();
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#020810", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'IBM Plex Mono',monospace", overflowY:"auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=IBM+Plex+Mono:wght@400;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .aff-card{animation:fadeUp 0.4s ease forwards}
        .aff-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700}
        .aff-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1)}
        .aff-btn:disabled{opacity:0.5;cursor:not-allowed}
        .step-btn{transition:all 0.2s;cursor:pointer;font-family:'IBM Plex Mono',monospace}
        .step-btn.active{border-bottom:3px solid #00cc44;color:#00cc44}
      `}</style>

      <div className="aff-card" style={{ background:"#030c18", border:"2px solid #00cc4444", borderRadius:18, padding:"28px 22px", width:"100%", maxWidth:420, textAlign:"center" }}>

        {/* Header */}
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:"#fff", letterSpacing:3, marginBottom:3 }}>
          PRINCEX <span style={{ color:"#ffd700" }}>IQ</span>
        </div>
        <div style={{ fontSize:8, color:"#334455", letterSpacing:3, marginBottom:20 }}>TRADING INTELLIGENCE PLATFORM</div>

        {/* Steps indicator */}
        <div style={{ display:"flex", gap:0, marginBottom:24, background:"#0a1520", borderRadius:8, padding:4 }}>
          <button className={`step-btn${step==="register"?" active":""}`} onClick={()=>setStep("register")}
            style={{ flex:1, padding:"8px", background:"transparent", border:"none", fontSize:9, color:step==="register"?"#00cc44":"#445566", letterSpacing:1, borderBottom:step==="register"?"3px solid #00cc44":"3px solid transparent" }}>
            1. REGISTER
          </button>
          <button className={`step-btn${step==="paste"?" active":""}`} onClick={()=>setStep("paste")}
            style={{ flex:1, padding:"8px", background:"transparent", border:"none", fontSize:9, color:step==="paste"?"#00cc44":"#445566", letterSpacing:1, borderBottom:step==="paste"?"3px solid #00cc44":"3px solid transparent" }}>
            2. ENTER ID
          </button>
        </div>

        {/* Step 1 - Register */}
        {step === "register" && (
          <div>
            <div style={{ width:64, height:64, margin:"0 auto 16px", borderRadius:12, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px #00cc4433" }}>
              <img src="https://olymptrade.com/favicon.ico" alt="OlympTrade"
                style={{ width:48, height:48, objectFit:"contain" }}
                onError={e=>{ e.target.outerHTML='<div style="font-size:30px">📊</div>'; }} />
            </div>

            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:"#00cc44", letterSpacing:2, marginBottom:12 }}>
              STEP 1: CREATE OLYMPTRADE ACCOUNT
            </div>

            <div style={{ background:"rgba(0,200,68,0.05)", border:"1px solid #00cc4422", borderRadius:12, padding:"14px", marginBottom:18, textAlign:"left" }}>
              <div style={{ fontSize:11, color:"#8899aa", lineHeight:2 }}>
                ✅ PrinceX IQ signals work with <strong style={{ color:"#fff" }}>OlympTrade</strong><br/>
                ✅ Trade Forex, Crypto & Gold<br/>
                ✅ Start from just <strong style={{ color:"#00cc44" }}>$1</strong><br/>
                ✅ Mobile app on Android & iOS<br/>
                ✅ <strong style={{ color:"#ffd700" }}>Welcome bonus on first deposit 🎁</strong>
              </div>
            </div>

            <a href="https://trkmad.com/2575974" target="_blank" rel="noopener noreferrer"
              style={{ display:"block", padding:"16px", background:"linear-gradient(135deg,#00cc44,#007722)", color:"#fff", borderRadius:10, fontSize:13, fontWeight:900, letterSpacing:2, textDecoration:"none", marginBottom:12, boxShadow:"0 4px 24px #00cc4455" }}>
              📈 OPEN FREE ACCOUNT ON OLYMPTRADE
            </a>

            <div style={{ fontSize:9, color:"#445566", marginBottom:20 }}>
              Free · No credit card · Takes 1 minute
            </div>

            <button className="aff-btn" onClick={()=>setStep("paste")}
              style={{ width:"100%", padding:"12px", background:"#0a1520", border:"1px solid #00cc4433", color:"#00cc44", borderRadius:8, fontSize:11, letterSpacing:1 }}>
              I registered → Enter my OlympTrade ID →
            </button>
          </div>
        )}

        {/* Step 2 - Paste ID */}
        {step === "paste" && (
          <div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:"#00cc44", letterSpacing:2, marginBottom:8 }}>
              STEP 2: ENTER YOUR OLYMPTRADE ID
            </div>

            <div style={{ background:"rgba(0,200,68,0.05)", border:"1px solid #00cc4422", borderRadius:10, padding:"14px", marginBottom:18, textAlign:"left" }}>
              <div style={{ fontSize:10, color:"#8899aa", lineHeight:1.9 }}>
                📱 Open OlympTrade app or website<br/>
                👤 Go to your <strong style={{ color:"#fff" }}>Profile / Account</strong><br/>
                🔢 Copy your <strong style={{ color:"#ffd700" }}>User ID number</strong><br/>
                📋 Paste it below
              </div>
            </div>

            {/* Visual guide */}
            <div style={{ background:"#0a1520", border:"1px solid #1e3040", borderRadius:8, padding:"10px 14px", marginBottom:16, textAlign:"left" }}>
              <div style={{ fontSize:9, color:"#445566", marginBottom:6, letterSpacing:1 }}>YOUR ID LOOKS LIKE THIS:</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#ffd700", letterSpacing:4 }}>12345678</div>
              <div style={{ fontSize:8, color:"#334455", marginTop:4 }}>Found in OlympTrade → Profile → Account ID</div>
            </div>

            <input
              value={otId}
              onChange={e=>setOtId(e.target.value)}
              placeholder="Paste your OlympTrade ID here"
              type="number"
              style={{ width:"100%", padding:"14px", background:"rgba(0,40,80,0.3)", border:`1px solid ${error?"#ff224444":"#0d2a42"}`, borderRadius:8, color:"#c8d8e8", fontFamily:"'IBM Plex Mono',monospace", fontSize:16, outline:"none", marginBottom:10, textAlign:"center", letterSpacing:4 }}
            />

            {error && (
              <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:7, padding:"8px 12px", marginBottom:12, fontSize:11, color:"#ff5577" }}>
                ⚠ {error}
              </div>
            )}

            <button className="aff-btn" onClick={handleSubmitId} disabled={loading || !otId.trim()}
              style={{ width:"100%", padding:"16px", background:otId.trim()?"linear-gradient(135deg,#00cc44,#007722)":"#0a1520", border:`1px solid ${otId.trim()?"#00cc44":"#1e3040"}`, color:otId.trim()?"#fff":"#445566", borderRadius:10, fontSize:13, letterSpacing:2, marginBottom:12 }}>
              {loading ? "⟳ VERIFYING..." : "✓ SUBMIT & UNLOCK APP"}
            </button>

            <button className="aff-btn" onClick={()=>setStep("register")}
              style={{ background:"transparent", border:"none", color:"#334455", fontSize:10, padding:"6px" }}>
              ← Back to Step 1
            </button>
          </div>
        )}

        <div style={{ marginTop:16, fontSize:8, color:"#1e2e3e" }}>
          * Affiliate partnership — we earn a commission when you register via our link
        </div>
      </div>
    </div>
  );
}
