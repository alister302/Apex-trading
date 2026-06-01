import { useState } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const PLANS = [
  { id:"weekly",   name:"WEEKLY",   price:299,   period:"7 days",    color:"#0066ff", features:["All live signals","Sniper scanner","Auto analysis","Push notifications"] },
  { id:"monthly",  name:"MONTHLY",  price:799,   period:"30 days",   color:"#00aaff", popular:true, features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Priority support"] },
  { id:"annual",   name:"ANNUAL",   price:6999,  period:"365 days",  color:"#00dd88", features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Priority support","Save 27%"] },
  { id:"lifetime", name:"LIFETIME", price:14999, period:"Forever",   color:"#ffd700", features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Priority support","Never expires","VIP access"] },
];

export default function Subscription({ user, sub, onSubscribed, dark }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#ffffff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
  };

  const handleSubscribe = async (planId) => {
    setLoading(planId); setError("");
    try {
      const res = await fetch(`${SERVER}/pesapal/initiate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id:user.id, email:user.email, name:user.user_metadata?.full_name||"User", plan:planId })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(null); return; }
      if (data.redirect_url) {
        localStorage.setItem("apex_order_id", data.order_id);
        localStorage.setItem("apex_plan", planId);
        window.location.href = data.redirect_url;
      }
    } catch(e) { setError("Payment service unavailable. Try again."); }
    setLoading(null);
  };

  const daysLeft = sub?.expires ? Math.max(0, Math.ceil((new Date(sub.expires)-Date.now())/86400000)) : null;

  return (
    <div style={{ minHeight:"100vh", background:t.bg, padding:"24px 16px", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .plan-card{transition:all 0.3s;cursor:pointer}
        .plan-card:hover{transform:translateY(-4px)}
        .pay-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;letter-spacing:2px}
        .pay-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.3)}
        .pay-btn:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:3, marginBottom:8 }}>
            APEX <span style={{ color:"#ffd700" }}>FX</span> PREMIUM
          </div>
          <div style={{ fontSize:11, color:t.muted, letterSpacing:1 }}>Unlock professional trading signals and live market scanner</div>
        </div>

        {/* Current sub status */}
        {sub?.active && (
          <div style={{ background:dark?"#001a0d":"#e8fff3", border:"1px solid #00dd5544", borderRadius:10, padding:"14px 18px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11, color:"#00dd55", fontWeight:700, letterSpacing:1 }}>✓ ACTIVE SUBSCRIPTION</div>
              <div style={{ fontSize:13, color:dark?"#fff":"#001133", fontWeight:700, marginTop:4 }}>{sub.plan?.toUpperCase()} PLAN</div>
            </div>
            {daysLeft!==null && <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:t.dim }}>Days remaining</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:"#00dd55" }}>{daysLeft}</div>
            </div>}
            {sub.plan==="lifetime" && <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ffd700" }}>∞ LIFETIME</div>}
          </div>
        )}

        {error && <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:11, color:"#ff4466" }}>⚠ {error}</div>}

        {/* Plans */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className="plan-card" style={{ background:t.bgCard, border:`2px solid ${sub?.plan===plan.id&&sub?.active?plan.color:t.border}`, borderRadius:12, padding:"20px 16px", position:"relative", overflow:"hidden" }}>
              {plan.popular && <div style={{ position:"absolute", top:0, right:0, background:"#ffd700", color:"#000", fontSize:8, fontWeight:900, padding:"4px 10px", letterSpacing:1 }}>POPULAR</div>}
              {sub?.plan===plan.id&&sub?.active && <div style={{ position:"absolute", top:0, left:0, background:plan.color, color:"#fff", fontSize:8, fontWeight:900, padding:"4px 10px", letterSpacing:1 }}>ACTIVE</div>}

              <div style={{ marginBottom:12 }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:900, color:plan.color, letterSpacing:2, marginBottom:4 }}>{plan.name}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:26, fontWeight:900, color:dark?"#fff":"#001133" }}>
                  <span style={{ fontSize:12, color:t.muted }}>KES </span>{plan.price.toLocaleString()}
                </div>
                <div style={{ fontSize:10, color:t.dim, marginTop:2 }}>{plan.period}</div>
              </div>

              <div style={{ marginBottom:14, display:"flex", flexDirection:"column", gap:5 }}>
                {plan.features.map((f,i) => (
                  <div key={i} style={{ fontSize:10, color:t.muted, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:plan.color, fontSize:10 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <button className="pay-btn" onClick={()=>handleSubscribe(plan.id)} disabled={loading===plan.id||loading!==null}
                style={{ width:"100%", padding:"12px 8px", background:`linear-gradient(135deg,${plan.color},${plan.color}bb)`, color:plan.id==="annual"||plan.id==="lifetime"?"#000":"#fff", borderRadius:7, fontSize:11 }}>
                {loading===plan.id?"⟳ REDIRECTING...":sub?.plan===plan.id&&sub?.active?"✓ RENEW PLAN":"⚡ SUBSCRIBE"}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"16px 18px" }}>
          <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:10 }}>PAYMENT SECURED BY PESAPAL</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            {[["🔒","Secure Payment","Bank-grade encryption"],["📱","M-Pesa & Cards","Pay with any method"],["⚡","Instant Access","Activated immediately"]].map(([icon,title,desc])=>(
              <div key={title} style={{ textAlign:"center" }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
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
