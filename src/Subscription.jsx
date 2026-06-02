import { useState, useEffect } from "react";

const SERVER = "https://apex-server-09p7.onrender.com";

const PLANS = [
  { id:"weekly",   name:"WEEKLY",   price:299,   period:"7 days",   color:"#0066ff", features:["All live signals","Sniper scanner","Auto analysis","Push notifications"] },
  { id:"monthly",  name:"MONTHLY",  price:799,   period:"30 days",  color:"#00aaff", popular:true, features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Priority support"] },
  { id:"annual",   name:"ANNUAL",   price:6999,  period:"365 days", color:"#00dd88", features:["All live signals","Sniper scanner","Auto analysis","Push notifications","Save 27%"] },
  { id:"lifetime", name:"LIFETIME", price:14999, period:"Forever",  color:"#ffd700", features:["All live signals","Sniper scanner","Auto analysis","VIP access","Never expires"] },
];

export default function Subscription({ user, sub, onSubscribed, dark }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [serverReady, setServerReady] = useState(false);
  const [waking, setWaking] = useState(false);

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#ffffff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
  };

  // Wake server on component mount
  useEffect(() => {
    wakeServer();
  }, []);

  const wakeServer = async () => {
    setWaking(true);
    setStatus("Connecting to payment server...");
    try {
      const res = await fetch(`${SERVER}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(60000),
      });
      if (res.ok) {
        setServerReady(true);
        setStatus("Payment server ready ✓");
        setTimeout(() => setStatus(""), 2000);
      } else {
        setStatus("Server responded but unhealthy. Retrying...");
        setTimeout(wakeServer, 5000);
      }
    } catch(e) {
      setStatus("Server waking up... (30-60s on free tier)");
      setTimeout(wakeServer, 10000);
    }
    setWaking(false);
  };

  const handleSubscribe = async (planId) => {
    setError("");

    // Wake server first if not ready
    if (!serverReady) {
      setStatus("Waiting for server to wake up...");
      let attempts = 0;
      while (attempts < 12) {
        try {
          const ping = await fetch(`${SERVER}/health`, { signal: AbortSignal.timeout(10000) });
          if (ping.ok) { setServerReady(true); break; }
        } catch(e) {}
        attempts++;
        setStatus(`Server starting... attempt ${attempts}/12`);
        await new Promise(r => setTimeout(r, 5000));
      }
      if (attempts >= 12) {
        setError("Server is taking too long. Please try again in 1 minute.");
        return;
      }
    }

    setLoading(planId);
    setStatus(`Initiating ${planId} payment...`);

    const payload = {
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      plan: planId,
    };

    // Try up to 3 times
    let lastError = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        setStatus(`Connecting to PesaPal... (attempt ${attempt}/3)`);

        const res = await fetch(`${SERVER}/pesapal/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(45000),
        });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          lastError = `Server error (${res.status}): ${text.slice(0, 100)}`;
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const data = await res.json();

        if (data.error) {
          lastError = data.error;
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        if (data.redirect_url) {
          setStatus("Redirecting to payment page...");
          localStorage.setItem("apex_order_id", data.order_id || "");
          localStorage.setItem("apex_plan", planId);
          localStorage.setItem("apex_user_id", user.id);
          window.location.href = data.redirect_url;
          return;
        }

        lastError = "No payment URL received from server.";
      } catch(e) {
        if (e.name === "AbortError") lastError = "Request timed out. Server is slow — retrying...";
        else lastError = `Network error: ${e.message}`;
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    setError(lastError || "Payment failed after 3 attempts. Try again.");
    setStatus("");
    setLoading(null);
  };

  const daysLeft = sub?.expires
    ? Math.max(0, Math.ceil((new Date(sub.expires) - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ minHeight:"100vh", background:t.bg, padding:"20px 16px", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .spin{animation:spin 1s linear infinite;display:inline-block}
        .plan-card{transition:transform 0.2s,box-shadow 0.2s}
        .plan-card:hover{transform:translateY(-3px)}
        .pay-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;letter-spacing:1px;border-radius:8px}
        .pay-btn:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
        .pay-btn:disabled{opacity:0.55;cursor:not-allowed}
      `}</style>

      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Title */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:dark?"#fff":"#001133", letterSpacing:3, marginBottom:6 }}>
            APEX <span style={{ color:"#ffd700" }}>FX</span> PREMIUM
          </div>
          <div style={{ fontSize:10, color:t.muted }}>Professional signals · Live scanner · Sniper analysis</div>
        </div>

        {/* Server status bar */}
        <div style={{ background:serverReady?(dark?"#001a0d":"#e8fff3"):(dark?"#0a1020":"#f0f4f8"), border:`1px solid ${serverReady?"#00dd5533":t.border}`, borderRadius:8, padding:"10px 14px", marginBottom:18, display:"flex", alignItems:"center", gap:10 }}>
          {!serverReady ? (
            <span className="spin" style={{ color:"#0066ff", fontSize:14 }}>⟳</span>
          ) : (
            <span style={{ color:"#00dd55" }}>●</span>
          )}
          <span style={{ fontSize:10, color:serverReady?"#00dd55":t.muted }}>
            {status || (serverReady ? "Payment server ready" : "Connecting to payment server...")}
          </span>
        </div>

        {/* Active sub */}
        {sub?.active && (
          <div style={{ background:dark?"#001a0d":"#e8fff3", border:"2px solid #00dd5544", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:9, color:"#00dd55", fontWeight:700, letterSpacing:2 }}>✓ ACTIVE SUBSCRIPTION</div>
              <div style={{ fontSize:14, color:dark?"#fff":"#001133", fontWeight:700, marginTop:4 }}>{sub.plan?.toUpperCase()} PLAN</div>
            </div>
            {daysLeft !== null && (
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:t.dim }}>Days left</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, color:"#00dd55" }}>{daysLeft}</div>
              </div>
            )}
            {sub.plan === "lifetime" && <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ffd700" }}>∞ LIFETIME</div>}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224444", borderRadius:8, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
          </div>
        )}

        {/* Status when loading */}
        {status && loading && (
          <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:8, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            <span className="spin" style={{ color:"#4499ff" }}>⟳</span>
            <span style={{ fontSize:10, color:"#4499ff" }}>{status}</span>
          </div>
        )}

        {/* Plans grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14, marginBottom:22 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className="plan-card"
              style={{ background:t.bgCard, border:`2px solid ${sub?.plan===plan.id&&sub?.active?plan.color:t.border}`, borderRadius:12, padding:"18px 14px", position:"relative", overflow:"hidden" }}>

              {plan.popular && <div style={{ position:"absolute", top:0, right:0, background:"#ffd700", color:"#000", fontSize:8, fontWeight:900, padding:"3px 10px", letterSpacing:1 }}>POPULAR</div>}
              {sub?.plan===plan.id&&sub?.active && <div style={{ position:"absolute", top:0, left:0, background:plan.color, color:"#fff", fontSize:8, fontWeight:900, padding:"3px 10px" }}>ACTIVE</div>}

              <div style={{ marginBottom:12 }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:900, color:plan.color, letterSpacing:2, marginBottom:5 }}>{plan.name}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:dark?"#fff":"#001133" }}>
                  <span style={{ fontSize:10, color:t.muted, fontFamily:"monospace" }}>KES </span>{plan.price.toLocaleString()}
                </div>
                <div style={{ fontSize:9, color:t.dim, marginTop:2 }}>{plan.period}</div>
              </div>

              <div style={{ marginBottom:14, display:"flex", flexDirection:"column", gap:5 }}>
                {plan.features.map((f,i) => (
                  <div key={i} style={{ fontSize:9, color:t.muted, display:"flex", gap:5, alignItems:"flex-start" }}>
                    <span style={{ color:plan.color, flexShrink:0 }}>✓</span>{f}
                  </div>
                ))}
              </div>

              <button className="pay-btn" onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                style={{ width:"100%", padding:"12px 8px", background:`linear-gradient(135deg,${plan.color},${plan.color}99)`, color:plan.id==="annual"||plan.id==="lifetime"?"#000":"#fff", fontSize:10 }}>
                {loading === plan.id
                  ? <><span className="spin">⟳</span> PROCESSING...</>
                  : sub?.plan===plan.id&&sub?.active ? "✓ RENEW" : "⚡ SUBSCRIBE"}
              </button>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
          <div style={{ fontSize:9, letterSpacing:2, color:t.dim, fontWeight:700, marginBottom:10, textAlign:"center" }}>PAYMENT SECURED BY PESAPAL</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, textAlign:"center" }}>
            {[["🔒","Secure SSL","Bank-grade"],["📱","M-Pesa & Cards","Any method"],["⚡","Instant Access","After payment"]].map(([icon,title,desc])=>(
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
