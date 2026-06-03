import { useState, useEffect, useRef } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const PLANS = [
  { id:"weekly",   name:"WEEKLY",   price:299,   period:"7 days",   color:"#0066ff", features:["All live signals","Sniper scanner","Auto analysis","Push notifications"] },
  { id:"monthly",  name:"MONTHLY",  price:799,   period:"30 days",  color:"#00aaff", popular:true, features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Priority support"] },
  { id:"annual",   name:"ANNUAL",   price:6999,  period:"365 days", color:"#00dd88", features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Save 27%"] },
  { id:"lifetime", name:"LIFETIME", price:14999, period:"Forever",  color:"#ffd700", features:["All live signals","Sniper scanner","Auto analysis","VIP access","Never expires"] },
];

export default function Subscription({ user, sub, onSubscribed, dark }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payMethod, setPayMethod] = useState(null); // "mpesa" | "card"
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [stkSent, setStkSent] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [serverReady, setServerReady] = useState(false);
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

  // Wake server on mount
  useEffect(() => {
    pingServer();
    // Check URL params for return from checkout
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("apex_order");
    const plan = params.get("apex_plan");
    const inv = params.get("invoice_id") || params.get("tracking_id");
    if (orderId && plan) {
      setStatus("Verifying your payment...");
      verifyCheckout(orderId, inv, plan);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const pingServer = async () => {
    for (let i = 0; i < 6; i++) {
      try {
        const r = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(10000) });
        if (r.ok) { setServerReady(true); setStatus(""); return; }
      } catch(e) {}
      setStatus(`Connecting to server... (${i+1}/6)`);
      await new Promise(r => setTimeout(r, 5000));
    }
    setStatus("Server slow — you can still try subscribing");
    setServerReady(true);
  };

  const verifyCheckout = async (orderId, invId, plan) => {
    try {
      const res = await fetch(`${SERVER}/intasend/verify`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ order_id:orderId, invoice_id:invId, user_id:user.id, plan })
      });
      const data = await res.json();
      if (data.success) {
        setStatus("✅ Payment confirmed! Activating your plan...");
        setTimeout(() => { onSubscribed(); }, 2000);
      } else {
        setStatus(`Payment status: ${data.state || "Pending verification"}`);
      }
    } catch(e) { setStatus("Could not verify payment — contact support if charged"); }
  };

  // Poll STK push status
  const startPolling = (invId) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${SERVER}/intasend/status/${invId}`);
        const data = await res.json();
        const state = data.state || "PENDING";
        setStatus(`Payment status: ${state} (checking...)`);
        if (state === "COMPLETE") {
          clearInterval(pollRef.current);
          setStatus("✅ Payment complete! Activating your plan...");
          setStkSent(false);
          setTimeout(() => onSubscribed(), 2000);
        } else if (state === "FAILED" || state === "CANCELLED") {
          clearInterval(pollRef.current);
          setError(`Payment ${state.toLowerCase()}. Please try again.`);
          setStkSent(false);
          setLoading(false);
        } else if (attempts >= 24) { // 2 min timeout
          clearInterval(pollRef.current);
          setStatus("Payment taking long — check your M-Pesa app or try again.");
          setStkSent(false);
          setLoading(false);
        }
      } catch(e) {}
    }, 5000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleMpesa = async () => {
    if (!phone.trim()) { setError("Enter your M-Pesa phone number"); return; }
    setLoading(true); setError(""); setStatus("Sending M-Pesa prompt...");
    try {
      const res = await fetch(`${SERVER}/intasend/mpesa`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          phone: phone.trim(),
          plan: selectedPlan,
        }),
        signal: AbortSignal.timeout(40000),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); setStatus(""); return; }
      setStkSent(true);
      setInvoiceId(data.invoice_id);
      setStatus("✅ M-Pesa prompt sent! Enter your PIN on your phone.");
      startPolling(data.invoice_id);
    } catch(e) {
      setError(e.name==="AbortError"?"Server timeout — check connection and retry":e.message);
      setLoading(false); setStatus("");
    }
  };

  const handleCard = async () => {
    setLoading(true); setError(""); setStatus("Creating secure checkout...");
    try {
      const res = await fetch(`${SERVER}/intasend/checkout`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          plan: selectedPlan,
        }),
        signal: AbortSignal.timeout(40000),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); setStatus(""); return; }
      if (data.checkout_url) {
        setStatus("Redirecting to secure payment page...");
        localStorage.setItem("apex_order_id", data.order_id);
        localStorage.setItem("apex_plan", selectedPlan);
        window.location.href = data.checkout_url;
      }
    } catch(e) {
      setError(e.name==="AbortError"?"Server timeout — retry in 30 seconds":e.message);
      setLoading(false); setStatus("");
    }
  };

  const daysLeft = sub?.expires
    ? Math.max(0, Math.ceil((new Date(sub.expires) - Date.now()) / 86400000))
    : null;

  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <div style={{ minHeight:"100vh", background:t.bg, padding:"20px 16px", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .spin{animation:spin 1s linear infinite;display:inline-block}
        .mpulse{animation:pulse 1.5s infinite}
        .plan-card{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer}
        .plan-card:hover{transform:translateY(-3px)}
        .plan-card.selected{box-shadow:0 0 0 3px var(--pc)}
        .pay-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;border-radius:8px}
        .pay-btn:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
        .pay-btn:disabled{opacity:0.5;cursor:not-allowed}
        .method-btn{transition:all 0.2s;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-weight:700;border-radius:10px}
        .method-btn:hover{transform:translateY(-2px)}
      `}</style>

      <div style={{ maxWidth:860, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:3, marginBottom:6 }}>
            APEX <span style={{ color:"#ffd700" }}>FX</span> PREMIUM
          </div>
          <div style={{ fontSize:10, color:t.muted }}>Professional signals · Live scanner · Sniper analysis</div>
        </div>

        {/* Server status */}
        <div style={{ background:serverReady?(dark?"#001a0d":"#e8fff3"):(dark?"#0a1020":"#f0f4ff"), border:`1px solid ${serverReady?"#00dd5533":t.border}`, borderRadius:8, padding:"8px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          {serverReady ? <span style={{ color:"#00dd55" }}>●</span> : <span className="spin" style={{ color:"#0066ff", fontSize:13 }}>⟳</span>}
          <span style={{ fontSize:10, color:serverReady?"#00dd55":t.muted }}>{status || (serverReady?"Payment server ready":"Connecting...")}</span>
        </div>

        {/* Active sub */}
        {sub?.active && (
          <div style={{ background:dark?"#001a0d":"#e8fff3", border:"2px solid #00dd5544", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:9, color:"#00dd55", fontWeight:700, letterSpacing:2 }}>✓ ACTIVE SUBSCRIPTION</div>
              <div style={{ fontSize:14, color:dark?"#fff":"#001133", fontWeight:700, marginTop:4 }}>{sub.plan?.toUpperCase()} PLAN</div>
            </div>
            {daysLeft!==null && <div style={{ textAlign:"right" }}><div style={{ fontSize:9, color:t.dim }}>Days left</div><div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:"#00dd55" }}>{daysLeft}</div></div>}
            {sub.plan==="lifetime" && <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ffd700" }}>∞ LIFETIME</div>}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224444", borderRadius:8, padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:18 }}>×</button>
          </div>
        )}

        {/* Step 1 — Select Plan */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"18px 16px", marginBottom:14 }}>
          <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:14 }}>STEP 1 — SELECT YOUR PLAN</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
            {PLANS.map(p => (
              <div key={p.id} className={`plan-card${selectedPlan===p.id?" selected":""}`}
                style={{ "--pc":p.color, background:selectedPlan===p.id?(dark?`${p.color}18`:`${p.color}11`):t.bg, border:`2px solid ${selectedPlan===p.id?p.color:t.border}`, borderRadius:10, padding:"14px 12px", position:"relative", overflow:"hidden" }}
                onClick={()=>{ setSelectedPlan(p.id); setPayMethod(null); setStkSent(false); setError(""); }}>
                {p.popular && <div style={{ position:"absolute", top:0, right:0, background:"#ffd700", color:"#000", fontSize:7, fontWeight:900, padding:"3px 8px" }}>POPULAR</div>}
                {sub?.plan===p.id&&sub?.active && <div style={{ position:"absolute", top:0, left:0, background:p.color, color:"#fff", fontSize:7, fontWeight:900, padding:"3px 8px" }}>ACTIVE</div>}
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:900, color:p.color, letterSpacing:2, marginBottom:4 }}>{p.name}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:dark?"#fff":"#001133" }}>
                  <span style={{ fontSize:9, color:t.muted, fontFamily:"monospace" }}>KES </span>{p.price.toLocaleString()}
                </div>
                <div style={{ fontSize:9, color:t.dim, marginTop:2, marginBottom:10 }}>{p.period}</div>
                {p.features.map((f,i) => (
                  <div key={i} style={{ fontSize:8, color:t.muted, display:"flex", gap:4, marginBottom:3 }}>
                    <span style={{ color:p.color }}>✓</span>{f}
                  </div>
                ))}
                {selectedPlan===p.id && (
                  <div style={{ marginTop:10, textAlign:"center", fontSize:9, color:p.color, fontWeight:700 }}>✓ SELECTED</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 2 — Payment Method */}
        {selectedPlan && !stkSent && (
          <div style={{ background:t.bgCard, border:`1px solid ${plan?.color||t.border}`, borderRadius:12, padding:"18px 16px", marginBottom:14 }}>
            <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:14 }}>STEP 2 — CHOOSE PAYMENT METHOD</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>

              {/* M-Pesa */}
              <button className="method-btn" onClick={()=>{ setPayMethod("mpesa"); setError(""); }}
                style={{ padding:"16px 12px", background:payMethod==="mpesa"?(dark?"#001a0d":"#e8fff3"):"transparent", border:`2px solid ${payMethod==="mpesa"?"#00cc44":t.border}`, color:dark?"#fff":"#001133", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:6 }}>📱</div>
                <div style={{ fontSize:12, fontWeight:900, color:"#00cc44", marginBottom:3 }}>M-PESA</div>
                <div style={{ fontSize:9, color:t.muted }}>STK Push to phone</div>
                <div style={{ fontSize:9, color:t.dim }}>Instant · Safe</div>
              </button>

              {/* Card */}
              <button className="method-btn" onClick={()=>{ setPayMethod("card"); setError(""); }}
                style={{ padding:"16px 12px", background:payMethod==="card"?(dark?"#001833":"#e8f4ff"):"transparent", border:`2px solid ${payMethod==="card"?"#0066ff":t.border}`, color:dark?"#fff":"#001133", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:6 }}>💳</div>
                <div style={{ fontSize:12, fontWeight:900, color:"#0066ff", marginBottom:3 }}>CARD</div>
                <div style={{ fontSize:9, color:t.muted }}>Visa / Mastercard</div>
                <div style={{ fontSize:9, color:t.dim }}>Secure redirect</div>
              </button>
            </div>

            {/* M-Pesa form */}
            {payMethod==="mpesa" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:10, color:t.muted }}>Enter the M-Pesa number to receive the payment prompt:</div>
                <input
                  value={phone}
                  onChange={e=>setPhone(e.target.value)}
                  placeholder="e.g. 0712345678 or 254712345678"
                  type="tel"
                  style={{ width:"100%", padding:"12px 14px", background:t.inp, border:`1px solid ${t.border}`, borderRadius:8, color:dark?"#c8d8e8":"#001133", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, outline:"none" }}
                />
                <div style={{ fontSize:9, color:t.dim }}>
                  KES {PLANS.find(p=>p.id===selectedPlan)?.price?.toLocaleString()} · {PLANS.find(p=>p.id===selectedPlan)?.name} Plan
                </div>
                <button className="pay-btn" onClick={handleMpesa} disabled={loading||!serverReady}
                  style={{ padding:"14px", background:"linear-gradient(135deg,#00cc44,#009933)", color:"#fff", fontSize:12, letterSpacing:2, width:"100%" }}>
                  {loading ? <><span className="spin">⟳</span> SENDING PROMPT...</> : "📱 SEND M-PESA PROMPT"}
                </button>
              </div>
            )}

            {/* Card button */}
            {payMethod==="card" && (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:10, color:t.muted }}>You will be redirected to a secure IntaSend payment page to complete card payment.</div>
                <div style={{ fontSize:9, color:t.dim }}>
                  KES {PLANS.find(p=>p.id===selectedPlan)?.price?.toLocaleString()} · {PLANS.find(p=>p.id===selectedPlan)?.name} Plan
                </div>
                <button className="pay-btn" onClick={handleCard} disabled={loading||!serverReady}
                  style={{ padding:"14px", background:"linear-gradient(135deg,#0066ff,#0044bb)", color:"#fff", fontSize:12, letterSpacing:2, width:"100%" }}>
                  {loading ? <><span className="spin">⟳</span> PREPARING...</> : "💳 PAY WITH CARD"}
                </button>
              </div>
            )}

            {status && !stkSent && (
              <div style={{ marginTop:10, padding:"8px 12px", background:dark?"#001020":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:6, fontSize:10, color:"#4499ff", display:"flex", gap:8, alignItems:"center" }}>
                <span className="spin">⟳</span>{status}
              </div>
            )}
          </div>
        )}

        {/* STK Push sent state */}
        {stkSent && (
          <div style={{ background:dark?"#001a0d":"#e8fff3", border:"2px solid #00cc4444", borderRadius:12, padding:"24px 20px", marginBottom:14, textAlign:"center" }}>
            <div className="mpulse" style={{ fontSize:48, marginBottom:12 }}>📱</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#00cc44", marginBottom:8 }}>M-PESA PROMPT SENT!</div>
            <div style={{ fontSize:11, color:t.muted, marginBottom:16, lineHeight:1.7 }}>
              Check your phone for the M-Pesa payment request.<br/>
              Enter your M-Pesa PIN to complete the payment.<br/>
              KES {PLANS.find(p=>p.id===selectedPlan)?.price?.toLocaleString()}
            </div>
            <div style={{ fontSize:10, color:t.dim, marginBottom:16 }}>{status}</div>
            <button className="pay-btn" onClick={()=>{ clearInterval(pollRef.current); setStkSent(false); setLoading(false); setStatus(""); }}
              style={{ padding:"10px 24px", background:"transparent", border:`1px solid ${t.border}`, color:t.muted, fontSize:10 }}>
              ← Change Payment Method
            </button>
          </div>
        )}

        {/* Trust badges */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:10, textAlign:"center" }}>POWERED BY INTASEND · SECURE PAYMENTS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, textAlign:"center" }}>
            {[["🔒","SSL Secured","256-bit encryption"],["📱","M-Pesa Ready","Instant STK push"],["⚡","Instant Access","Activated on payment"]].map(([icon,title,desc])=>(
              <div key={title}>
                <div style={{ fontSize:20, marginBottom:3 }}>{icon}</div>
                <div style={{ fontSize:9, color:dark?"#fff":"#001133", fontWeight:700, marginBottom:1 }}>{title}</div>
                <div style={{ fontSize:8, color:t.dim }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
