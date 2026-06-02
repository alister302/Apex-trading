import { useState } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const PLANS = [
  { id:"weekly",   name:"WEEKLY",   price:299,   period:"7 days",   color:"#0066ff", features:["All live signals","Sniper scanner","Auto analysis","Push notifications"] },
  { id:"monthly",  name:"MONTHLY",  price:799,   period:"30 days",  color:"#00aaff", popular:true, features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Priority support"] },
  { id:"annual",   name:"ANNUAL",   price:6999,  period:"365 days", color:"#00dd88", features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Save 27%"] },
  { id:"lifetime", name:"LIFETIME", price:14999, period:"Forever",  color:"#ffd700", features:["All live signals","Sniper scanner","Auto analysis","Push notifications","VIP access","Never expires"] },
];

export default function Subscription({ user, sub, onSubscribed, dark }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#ffffff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
  };

  const handleSubscribe = async (planId) => {
    setLoading(planId);
    setError("");
    setDebug("");
    try {
      const payload = {
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        plan: planId
      };
      setDebug(`Connecting to ${SERVER}...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${SERVER}/pesapal/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const text = await res.text();
      setDebug(`Server responded: ${res.status}`);

      let data;
      try { data = JSON.parse(text); }
      catch(e) { setError(`Server error: ${text.slice(0,100)}`); setLoading(null); return; }

      if (data.error) { setError(data.error); setLoading(null); return; }

      if (data.redirect_url) {
        localStorage.setItem("apex_order_id", data.order_id);
        localStorage.setItem("apex_plan", planId);
        localStorage.setItem("apex_user_id", user.id);
        window.location.href = data.redirect_url;
      } else {
        setError("No payment URL received. Try again.");
      }
    } catch(e) {
      if (e.name === "AbortError") setError("Request timed out. Server may be starting up — wait 30s and retry.");
      else setError(`Connection failed: ${e.message}`);
    }
    setLoading(null);
  };

  const daysLeft = sub?.expires
    ? Math.max(0, Math.ceil((new Date(sub.expires) - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ minHeight:"100vh", background:t.bg, padding:"24px 16px", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        .plan-card{transition:transform 0.2s,box-shadow 0.2s}
        .plan-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.3)}
        .pay-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;letter-spacing:1px}
        .pay-btn:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-1px)}
        .pay-btn:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:3, marginBottom:8 }}>
            APEX <span style={{ color:"#ffd700" }}>FX</span> PREMIUM
          </div>
          <div style={{ fontSize:11, color:t.muted }}>Unlock professional signals · Live scanner · Sniper analysis</div>
        </div>

        {/* Active sub banner */}
        {sub?.active && (
          <div style={{ background:dark?"#001a0d":"#e8fff3", border:"2px solid #00dd5544", borderRadius:12, padding:"16px 20px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:10, color:"#00dd55", fontWeight:700, letterSpacing:2 }}>✓ SUBSCRIPTION ACTIVE</div>
              <div style={{ fontSize:15, color:dark?"#fff":"#001133", fontWeight:700, marginTop:4 }}>{sub.plan?.toUpperCase()} PLAN</div>
            </div>
            {daysLeft !== null && (
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:t.dim }}>Days remaining</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:"#00dd55" }}>{daysLeft}</div>
              </div>
            )}
            {sub.plan === "lifetime" && (
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:"#ffd700" }}>∞ LIFETIME</div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224444", borderRadius:8, padding:"12px 16px", marginBottom:16, fontSize:11, color:"#ff5577" }}>
            ⚠ {error}
            <button onClick={()=>setError("")} style={{ float:"right", background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:14 }}>×</button>
          </div>
        )}

        {/* Debug info */}
        {debug && (
          <div style={{ background:dark?"#001020":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:6, padding:"8px 12px", marginBottom:12, fontSize:10, color:"#4499ff" }}>
            {debug}
          </div>
        )}

        {/* Render wake-up notice */}
        <div style={{ background:dark?"#0a1020":"#f0f4f8", border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:10, color:t.dim, textAlign:"center" }}>
          ℹ Free server may take 30-60s to wake up on first payment. Please wait if it takes time.
        </div>

        {/* Plans */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14, marginBottom:24 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className="plan-card" style={{ background:t.bgCard, border:`2px solid ${sub?.plan===plan.id&&sub?.active?plan.color:t.border}`, borderRadius:12, padding:"20px 16px", position:"relative", overflow:"hidden" }}>
              {plan.popular && (
                <div style={{ position:"absolute", top:0, right:0, background:"#ffd700", color:"#000", fontSize:8, fontWeight:900, padding:"4px 10px", letterSpacing:1 }}>POPULAR</div>
              )}
              {sub?.plan===plan.id && sub?.active && (
                <div style={{ position:"absolute", top:0, left:0, background:plan.color, color:"#fff", fontSize:8, fontWeight:900, padding:"4px 10px", letterSpacing:1 }}>ACTIVE</div>
              )}

              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:900, color:plan.color, letterSpacing:2, marginBottom:6 }}>{plan.name}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:24, fontWeight:900, color:dark?"#fff":"#001133" }}>
                  <span style={{ fontSize:11, color:t.muted, fontFamily:"'IBM Plex Mono',monospace" }}>KES </span>
                  {plan.price.toLocaleString()}
                </div>
                <div style={{ fontSize:10, color:t.dim, marginTop:2 }}>{plan.period}</div>
              </div>

              <div style={{ marginBottom:16, display:"flex", flexDirection:"column", gap:6 }}>
                {plan.features.map((f,i) => (
                  <div key={i} style={{ fontSize:10, color:t.muted, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:plan.color }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <button className="pay-btn" onClick={()=>handleSubscribe(plan.id)}
                disabled={loading !== null}
                style={{ width:"100%", padding:"12px", background:`linear-gradient(135deg,${plan.color},${plan.color}99)`, color:plan.id==="annual"||plan.id==="lifetime"?"#000":"#fff", borderRadius:8, fontSize:10 }}>
                {loading===plan.id ? "⟳ CONNECTING..." : sub?.plan===plan.id&&sub?.active ? "✓ RENEW" : "⚡ SUBSCRIBE"}
              </button>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px 18px" }}>
          <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:12, textAlign:"center" }}>SECURED BY PESAPAL</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, textAlign:"center" }}>
            {[
              ["🔒","Secure","Bank-grade SSL"],
              ["📱","M-Pesa & Cards","Any payment method"],
              ["⚡","Instant","Access immediately"],
            ].map(([icon,title,desc])=>(
              <div key={title}>
                <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:10, color:dark?"#fff":"#001133", fontWeight:700, marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:9, color:t.dim }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
