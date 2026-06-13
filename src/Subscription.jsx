import { useState, useEffect, useRef } from "react";

const SERVER = "https://princex-server-09p7.onrender.com";

const PLANS = [
  { id:"weekly",   name:"WEEKLY",   price:299,   period:"7 days",   color:"#0066ff", features:["All live signals","Sniper scanner","Auto analysis","Push notifications"] },
  { id:"monthly",  name:"MONTHLY",  price:799,   period:"30 days",  color:"#00aaff", popular:true, features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Priority support"] },
  { id:"annual",   name:"ANNUAL",   price:6999,  period:"365 days", color:"#00dd88", features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Save 27%"] },
  { id:"lifetime", name:"LIFETIME", price:14999, period:"Forever",  color:"#ffd700", features:["All live signals","Sniper scanner","Auto analysis","VIP access","Never expires"] },
];

export default function Subscription({ user, sub, onSubscribed, dark }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [stkSent, setStkSent] = useState(false);
  const [checkoutId, setCheckoutId] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [payState, setPayState] = useState("idle"); // idle | sent | complete | failed
  const pollRef = useRef(null);

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    inp: dark?"rgba(0,40,80,0.3)":"#e8f0f8",
  };

  useEffect(() => { wakeServer(); }, []);

  const wakeServer = async () => {
    for (let i = 0; i < 6; i++) {
      try {
        const r = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(10000) });
        if (r.ok) { setServerReady(true); return; }
      } catch(e) {}
      setStatus(`Connecting... (${i+1}/6)`);
      await new Promise(r => setTimeout(r, 5000));
    }
    setServerReady(true);
    setStatus("");
  };

  const startPolling = (cid) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${SERVER}/mpesa/status/${cid}`);
        const data = await res.json();
        setStatus(`Status: ${data.message || data.state}`);

        if (data.state === "COMPLETE") {
          clearInterval(pollRef.current);
          setPayState("complete");
          setStatus("✅ Payment confirmed!");
          setTimeout(() => onSubscribed(), 2500);
        } else if (data.state === "CANCELLED" || data.state === "FAILED") {
          clearInterval(pollRef.current);
          setPayState("failed");
          setError(`Payment ${data.state.toLowerCase()}: ${data.message}`);
          setStkSent(false);
          setLoading(false);
        } else if (attempts >= 36) { // 3 min
          clearInterval(pollRef.current);
          setStatus("Taking too long. Check your phone and try again if needed.");
          setStkSent(false);
          setLoading(false);
        }
      } catch(e) {}
    }, 5000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handlePay = async () => {
    if (!selectedPlan) { setError("Please select a plan first"); return; }
    if (!phone.trim()) { setError("Enter your M-Pesa phone number"); return; }

    // Validate phone
    const cleaned = phone.replace(/\D/g,"");
    if (cleaned.length < 9) { setError("Enter a valid Kenyan phone number"); return; }

    setLoading(true); setError(""); setStatus("Connecting to M-Pesa...");

    try {
      const res = await fetch(`${SERVER}/mpesa/stk`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          user_id: user.id,
          phone: phone.trim(),
          plan: selectedPlan,
        }),
        signal: AbortSignal.timeout(45000),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        setStatus("");
        return;
      }

      setStkSent(true);
      setPayState("sent");
      setCheckoutId(data.checkout_request_id);
      setStatus("M-Pesa prompt sent! Enter your PIN.");
      startPolling(data.checkout_request_id);

    } catch(e) {
      setError(e.name === "AbortError"
        ? "Connection timed out. Server may be starting — wait 30s and retry."
        : `Error: ${e.message}`);
      setLoading(false);
      setStatus("");
    }
  };

  const reset = () => {
    clearInterval(pollRef.current);
    setStkSent(false);
    setPayState("idle");
    setStatus("");
    setError("");
    setLoading(false);
    setCheckoutId(null);
  };

  const daysLeft = sub?.expires
    ? Math.max(0, Math.ceil((new Date(sub.expires) - Date.now()) / 86400000))
    : null;

  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <div style={{ minHeight:"100vh", background:t.bg, padding:"20px 16px", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes mpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .spin{animation:spin 1s linear infinite;display:inline-block}
        .mpulse{animation:mpulse 1.5s ease-in-out infinite}
        .fade-in{animation:fadeIn 0.3s ease forwards}
        .plan-card{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer}
        .plan-card:hover{transform:translateY(-3px)}
        .pay-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;border-radius:8px;letter-spacing:1px}
        .pay-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
        .pay-btn:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>

      <div style={{ maxWidth:820, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:3, marginBottom:5 }}>
            PRINCEX <span style={{ color:"#ffd700" }}>IQ</span> PREMIUM
          </div>
          <div style={{ fontSize:10, color:t.muted }}>Professional signals · Live scanner · Sniper analysis</div>
        </div>

        {/* Server status */}
        <div style={{ background:serverReady?(dark?"#001a0d":"#e8fff3"):(dark?"#0a1020":"#eef4ff"), border:`1px solid ${serverReady?"#00dd5533":t.border}`, borderRadius:8, padding:"8px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          {serverReady ? <span style={{ color:"#00dd55" }}>●</span> : <span className="spin" style={{ color:"#0066ff",fontSize:12 }}>⟳</span>}
          <span style={{ fontSize:10, color:serverReady?"#00dd55":t.muted }}>{serverReady?"Payment server ready ✓":(status||"Connecting to server...")}</span>
        </div>

        {/* Active sub banner */}
        {sub?.active && (
          <div style={{ background:dark?"#001a0d":"#e8fff3", border:"2px solid #00dd5544", borderRadius:12, padding:"14px 18px", marginBottom:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:9, color:"#00dd55", fontWeight:700, letterSpacing:2 }}>✓ ACTIVE SUBSCRIPTION</div>
              <div style={{ fontSize:14, color:dark?"#fff":"#001133", fontWeight:700, marginTop:3 }}>{sub.plan?.toUpperCase()} PLAN</div>
            </div>
            {daysLeft !== null && <div style={{ textAlign:"right" }}><div style={{ fontSize:9, color:t.dim }}>Days left</div><div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:"#00dd55" }}>{daysLeft}</div></div>}
            {sub.plan === "lifetime" && <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ffd700" }}>∞ LIFETIME</div>}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224444", borderRadius:8, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
          </div>
        )}

        {/* STK Sent state */}
        {stkSent && payState !== "complete" && (
          <div className="fade-in" style={{ background:dark?"#001a0d":"#e8fff3", border:"2px solid #00cc4444", borderRadius:14, padding:"28px 20px", marginBottom:16, textAlign:"center" }}>
            <div className="mpulse" style={{ fontSize:52, marginBottom:14 }}>📱</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, fontWeight:900, color:"#00cc44", marginBottom:10, letterSpacing:2 }}>CHECK YOUR PHONE!</div>
            <div style={{ fontSize:12, color:t.muted, lineHeight:1.8, marginBottom:6 }}>
              M-Pesa prompt sent to <strong style={{ color:dark?"#fff":"#001133" }}>{phone}</strong>
            </div>
            <div style={{ fontSize:11, color:t.muted, marginBottom:4 }}>
              Amount: <strong style={{ color:"#00cc44" }}>KES {plan?.price?.toLocaleString()}</strong> · {plan?.name} Plan
            </div>
            <div style={{ fontSize:11, color:"#ffaa00", marginBottom:20 }}>Enter your M-Pesa PIN to complete payment</div>
            <div style={{ fontSize:10, color:t.dim, marginBottom:20, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <span className="spin">⟳</span> {status || "Waiting for confirmation..."}
            </div>
            <button className="pay-btn" onClick={reset}
              style={{ padding:"10px 24px", background:"transparent", border:`1px solid ${t.border}`, color:t.muted, fontSize:10 }}>
              ← Change Plan / Retry
            </button>
          </div>
        )}

        {/* Payment complete */}
        {payState === "complete" && (
          <div className="fade-in" style={{ background:dark?"#001a0d":"#e8fff3", border:"2px solid #00dd5544", borderRadius:14, padding:"28px 20px", marginBottom:16, textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:"#00dd55", marginBottom:8 }}>PAYMENT SUCCESSFUL!</div>
            <div style={{ fontSize:12, color:t.muted }}>Your {plan?.name} plan is now active. Enjoy PRINCEX IQ Premium!</div>
          </div>
        )}

        {/* Plans + Form */}
        {!stkSent && payState === "idle" && (
          <>
            {/* Plans */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px", marginBottom:14 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:14 }}>SELECT PLAN</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:10 }}>
                {PLANS.map(p => (
                  <div key={p.id} className="plan-card"
                    style={{ background:selectedPlan===p.id?(dark?`${p.color}18`:"#f0f8ff"):"transparent", border:`2px solid ${selectedPlan===p.id?p.color:t.border}`, borderRadius:10, padding:"14px 12px", position:"relative", overflow:"hidden" }}
                    onClick={()=>{ setSelectedPlan(p.id); setError(""); }}>
                    {p.popular && <div style={{ position:"absolute",top:0,right:0,background:"#ffd700",color:"#000",fontSize:7,fontWeight:900,padding:"3px 8px" }}>POPULAR</div>}
                    {sub?.plan===p.id&&sub?.active && <div style={{ position:"absolute",top:0,left:0,background:p.color,color:"#fff",fontSize:7,fontWeight:900,padding:"3px 8px" }}>CURRENT</div>}
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:900, color:p.color, letterSpacing:2, marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:dark?"#fff":"#001133" }}>
                      <span style={{ fontSize:9, color:t.muted }}>KES </span>{p.price.toLocaleString()}
                    </div>
                    <div style={{ fontSize:9, color:t.dim, marginTop:2, marginBottom:8 }}>{p.period}</div>
                    {p.features.map((f,i)=>(
                      <div key={i} style={{ fontSize:8, color:t.muted, display:"flex", gap:4, marginBottom:2 }}>
                        <span style={{ color:p.color }}>✓</span>{f}
                      </div>
                    ))}
                    {selectedPlan===p.id && <div style={{ marginTop:8, textAlign:"center", fontSize:9, color:p.color, fontWeight:700 }}>✓ SELECTED</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* M-Pesa Form */}
            <div style={{ background:t.bgCard, border:`2px solid ${selectedPlan?PLANS.find(p=>p.id===selectedPlan)?.color:t.border}`, borderRadius:12, padding:"18px 16px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ fontSize:28 }}>📱</div>
                <div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:"#00cc44", letterSpacing:2 }}>M-PESA PAYMENT</div>
                  <div style={{ fontSize:9, color:t.dim }}>Powered by Safaricom Daraja API</div>
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:t.label, fontWeight:700, letterSpacing:1, marginBottom:6 }}>M-PESA PHONE NUMBER</div>
                <input
                  value={phone}
                  onChange={e=>setPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  type="tel"
                  style={{ width:"100%", padding:"13px 14px", background:t.inp, border:`1px solid ${t.border}`, borderRadius:8, color:dark?"#c8d8e8":"#001133", fontFamily:"'IBM Plex Mono',monospace", fontSize:14, outline:"none" }}
                />
                <div style={{ fontSize:9, color:t.dim, marginTop:5 }}>Safaricom number registered to M-Pesa</div>
              </div>

              {selectedPlan && (
                <div style={{ background:dark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.04)", borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:10, color:t.muted }}>Plan:</span>
                    <span style={{ fontSize:10, color:dark?"#fff":"#001133", fontWeight:700 }}>{plan?.name} · {plan?.period}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:10, color:t.muted }}>Amount:</span>
                    <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#00cc44" }}>KES {plan?.price?.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button className="pay-btn" onClick={handlePay}
                disabled={loading || !serverReady || !selectedPlan}
                style={{ width:"100%", padding:"15px", background:selectedPlan?"linear-gradient(135deg,#00cc44,#009933)":"#1e4060", color:"#fff", fontSize:13 }}>
                {loading
                  ? <><span className="spin">⟳</span> SENDING M-PESA PROMPT...</>
                  : !selectedPlan ? "SELECT A PLAN ABOVE"
                  : `📱 PAY KES ${plan?.price?.toLocaleString() || ""} VIA M-PESA`}
              </button>

              {status && !loading && (
                <div style={{ marginTop:10, fontSize:10, color:t.dim, textAlign:"center" }}>{status}</div>
              )}
            </div>

            {/* How it works */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:10 }}>HOW M-PESA PAYMENT WORKS</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  ["1","Select your plan above"],
                  ["2","Enter your Safaricom M-Pesa number"],
                  ["3","Tap the Pay button"],
                  ["4","Check your phone for the M-Pesa prompt"],
                  ["5","Enter your M-Pesa PIN to confirm"],
                  ["6","Your plan activates instantly after payment"],
                ].map(([n,s])=>(
                  <div key={n} style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:22, height:22, borderRadius:"50%", background:"#00cc4422", border:"1px solid #00cc4444", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:9, color:"#00cc44", fontWeight:900 }}>{n}</span>
                    </div>
                    <span style={{ fontSize:10, color:t.muted }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:12, padding:"8px 12px", background:dark?"rgba(0,200,68,0.05)":"rgba(0,180,60,0.05)", border:"1px solid #00cc4422", borderRadius:6, fontSize:9, color:"#00aa33", textAlign:"center" }}>
                🔒 Secured by Safaricom Daraja API · Official M-Pesa integration
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
