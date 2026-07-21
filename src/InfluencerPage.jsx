import { useState, useEffect } from "react";

const SERVER = "https://princex-ip.vercel.app";

export default function InfluencerPage({ user, supabase, dark, onClose }) {
  const [view, setView] = useState("loading"); // loading|register|dashboard
  const [influencer, setInfluencer] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [form, setForm] = useState({ full_name:"", mpesa_number:"", national_id:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    inp: dark?"rgba(0,40,80,0.3)":"#e8f0f8",
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${SERVER}/influencer/${user.id}`);
      const data = await res.json();
      if (data.registered) {
        setInfluencer(data.influencer);
        setReferrals(data.referrals||[]);
        setPayouts(data.payouts||[]);
        setBalance(data.balance||0);
        setTotalEarned(data.totalEarned||0);
        setView("dashboard");
        // Force refresh influencer object with latest counts
        if (data.stats) {
          setInfluencer(prev => ({...prev, ...data.influencer, total_referrals: data.stats.total}));
        }
      } else setView("register");
    } catch(e) { setView("register"); }
  };

  const handleRegister = async () => {
    if (!form.full_name||!form.mpesa_number||!form.national_id) {
      setError("All fields required"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SERVER}/influencer/register`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id:user.id, ...form })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setSuccess("Application submitted! Wait for admin approval.");
      setInfluencer(data.influencer);
      setView("dashboard");
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const handlePayout = async () => {
    const amount = parseInt(payoutAmount);
    if (!amount || amount < 1000) { setError("Minimum payout is KES 1,000"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${SERVER}/influencer/payout`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id:user.id, amount })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setSuccess("Payout request submitted! Admin will process via M-Pesa."); setPayoutAmount(""); fetchData(); }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const referralLink = `https://princex-iq.vercel.app?ref=${influencer?.referral_code}`;

  const inp = { width:"100%", padding:"12px 14px", background:t.inp, border:`1px solid ${t.border}`, borderRadius:8, color:dark?"#c8d8e8":"#001133", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, outline:"none", marginBottom:10 };
  const btn = { cursor:"pointer", border:"none", fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, borderRadius:8, transition:"all 0.2s" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:9999, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:16, overflowY:"auto" }}>
      <div style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:16, width:"100%", maxWidth:600, marginTop:20, marginBottom:20, fontFamily:"'IBM Plex Mono',monospace" }}>

        {/* Header */}
        <div style={{ background:dark?"#030810":"#fff", borderBottom:`1px solid ${t.border}`, padding:"14px 18px", borderRadius:"16px 16px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ffd700", letterSpacing:2 }}>💼 PARTNER PROGRAM</div>
            <div style={{ fontSize:9, color:t.dim, marginTop:2 }}>Earn commissions by referring traders</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:t.muted, cursor:"pointer", fontSize:22 }}>×</button>
        </div>

        <div style={{ padding:18 }}>

          {error && <div style={{ background:dark?"#1a0005":"#fff0f3", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#ff5577" }}>⚠ {error} <button onClick={()=>setError("")} style={{ float:"right", background:"none", border:"none", color:"#ff5577", cursor:"pointer" }}>×</button></div>}
          {success && <div style={{ background:dark?"#001a0d":"#e8fff3", border:"1px solid #00dd5533", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:11, color:"#00dd55" }}>✓ {success}</div>}

          {/* Loading */}
          {view==="loading" && <div style={{ textAlign:"center", padding:32, color:t.dim }}>Loading...</div>}

          {/* Register form */}
          {view==="register" && (
            <div>
              <div style={{ background:dark?"#001833":"#e8f4ff", border:"1px solid #0066ff33", borderRadius:10, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700, marginBottom:8 }}>💰 COMMISSION STRUCTURE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Weekly sub","KES 100"],["Monthly sub","KES 250"],["Annual sub","KES 1,200"],["Min payout","KES 1,000"]].map(([l,v])=>(
                    <div key={l} style={{ background:dark?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.05)", borderRadius:6, padding:"8px 10px" }}>
                      <div style={{ fontSize:9, color:t.dim }}>{l}</div>
                      <div style={{ fontSize:13, color:"#00dd55", fontWeight:700 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, fontSize:9, color:t.dim }}>Payouts via M-Pesa · Minimum KES 1,000 · Manual approval</div>
              </div>

              <div style={{ fontSize:10, color:t.muted, fontWeight:700, letterSpacing:1, marginBottom:14 }}>APPLY TO BECOME A PARTNER</div>

              <input style={inp} placeholder="Full Name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} />
              <input style={inp} placeholder="M-Pesa Number (e.g. 0712345678)" type="tel" value={form.mpesa_number} onChange={e=>setForm({...form,mpesa_number:e.target.value})} />
              <input style={inp} placeholder="National ID Number" value={form.national_id} onChange={e=>setForm({...form,national_id:e.target.value})} />

              <div style={{ fontSize:9, color:t.dim, marginBottom:14 }}>
                ⚠ Applications are reviewed manually. You'll be notified once approved.
              </div>

              <button onClick={handleRegister} disabled={loading}
                style={{ ...btn, width:"100%", padding:"14px", background:"linear-gradient(135deg,#ffd700,#cc9900)", color:"#000", fontSize:13, letterSpacing:2 }}>
                {loading?"⟳ SUBMITTING...":"💼 SUBMIT APPLICATION"}
              </button>
            </div>
          )}

          {/* Dashboard */}
          {view==="dashboard" && influencer && (
            <div>
              {/* Status banner */}
              <div style={{ background:influencer.status==="approved"?(dark?"#001a0d":"#e8fff3"):influencer.status==="pending"?(dark?"#1a1000":"#fffbe8"):(dark?"#1a0005":"#fff0f3"), border:`1px solid ${influencer.status==="approved"?"#00dd5533":influencer.status==="pending"?"#ffaa0033":"#ff224433"}`, borderRadius:10, padding:"12px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:9, color:t.dim }}>STATUS</div>
                  <div style={{ fontSize:13, fontWeight:700, color:influencer.status==="approved"?"#00dd55":influencer.status==="pending"?"#ffaa00":"#ff4466" }}>
                    {influencer.status==="approved"?"✅ APPROVED":influencer.status==="pending"?"⏳ PENDING APPROVAL":"❌ SUSPENDED"}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:9, color:t.dim }}>YOUR CODE</div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:900, color:"#ffd700" }}>{influencer.referral_code}</div>
                </div>
              </div>

              {/* Sub tabs */}
              <div style={{ display:"flex", gap:4, marginBottom:16, background:dark?"#030810":"#fff", borderRadius:8, padding:4, border:`1px solid ${t.border}` }}>
                {[["overview","📊 OVERVIEW"],["link","🔗 MY LINK"],["referrals","👥 REFERRALS"],["payouts","💰 PAYOUTS"]].map(([id,label])=>(
                  <button key={id} onClick={()=>setActiveTab(id)}
                    style={{ ...btn, flex:1, padding:"8px 4px", background:activeTab===id?"#ffd700":"transparent", color:activeTab===id?"#000":t.muted, fontSize:8, letterSpacing:1, borderRadius:5 }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {activeTab==="overview" && (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                    {[
                      {l:"TOTAL EARNED",v:`KES ${totalEarned.toLocaleString()}`,c:"#ffd700"},
                      {l:"BALANCE",v:`KES ${balance.toLocaleString()}`,c:"#00dd55"},
                      {l:"SIGNUPS",v:referrals.filter(r=>r.status==="registered"||r.event==="signup").length,c:"#4499ff"},
                      {l:"PAID SUBS",v:referrals.filter(r=>r.commission>0).length,c:"#00dd55"},
                    ].map(({l,v,c})=>(
                      <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"12px 10px", textAlign:"center" }}>
                        <div style={{ fontSize:7, color:t.dim, letterSpacing:1, marginBottom:4 }}>{l}</div>
                        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
                    <div style={{ fontSize:10, color:t.muted, fontWeight:700, marginBottom:10 }}>💰 COMMISSION RATES</div>
                    {[["Weekly subscription","KES 100"],["Monthly subscription","KES 250"],["Annual subscription","KES 1,200"]].map(([l,v])=>(
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${dark?"#0d2a4222":"#d0dce822"}` }}>
                        <span style={{ fontSize:10, color:t.muted }}>{l}</span>
                        <span style={{ fontSize:10, color:"#00dd55", fontWeight:700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Referral link */}
              {activeTab==="link" && (
                <div>
                  <div style={{ background:t.bgCard, border:`2px solid #ffd70044`, borderRadius:10, padding:"16px", marginBottom:14 }}>
                    <div style={{ fontSize:10, color:"#ffd700", fontWeight:700, marginBottom:8 }}>🔗 YOUR REFERRAL LINK</div>
                    <div style={{ background:dark?"#0a1520":"#e8f4ff", borderRadius:6, padding:"10px 12px", fontSize:10, color:dark?"#4499ff":"#0055aa", fontFamily:"monospace", wordBreak:"break-all", marginBottom:10 }}>
                      {referralLink}
                    </div>
                    <button onClick={()=>{ navigator.clipboard.writeText(referralLink); setSuccess("Link copied!"); setTimeout(()=>setSuccess(""),2000); }}
                      style={{ ...btn, width:"100%", padding:"10px", background:"linear-gradient(135deg,#ffd700,#cc9900)", color:"#000", fontSize:11 }}>
                      📋 COPY LINK
                    </button>
                  </div>
                  <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
                    <div style={{ fontSize:10, color:t.muted, fontWeight:700, marginBottom:10 }}>HOW TO SHARE</div>
                    {["Share your link on WhatsApp, TikTok, Instagram","When someone registers via your link — they're tracked","When they subscribe — you earn commission automatically","Request payout when balance reaches KES 1,000"].map((s,i)=>(
                      <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", background:"#ffd70022", border:"1px solid #ffd70044", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <span style={{ fontSize:9, color:"#ffd700", fontWeight:900 }}>{i+1}</span>
                        </div>
                        <span style={{ fontSize:10, color:t.muted, lineHeight:1.6 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Referrals list */}
              {activeTab==="referrals" && (
                <div>
                  {referrals.length===0 && <div style={{ textAlign:"center", padding:24, color:t.dim, fontSize:11 }}>No referrals yet — share your link!</div>}
                  {referrals.map((r,i)=>(
                    <div key={i} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700 }}>{r.plan?.toUpperCase()} PLAN</div>
                        <div style={{ fontSize:9, color:t.dim }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13, color:"#00dd55", fontWeight:900 }}>+KES {r.commission}</div>
                        <div style={{ fontSize:8, color:t.dim }}>{r.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payouts */}
              {activeTab==="payouts" && (
                <div>
                  {influencer.status==="approved" && (
                    <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
                      <div style={{ fontSize:10, color:t.muted, fontWeight:700, marginBottom:10 }}>REQUEST PAYOUT</div>
                      <div style={{ fontSize:11, color:"#00dd55", marginBottom:10 }}>Available Balance: KES {balance.toLocaleString()}</div>
                      <input style={inp} type="number" placeholder="Amount (min KES 1,000)" value={payoutAmount} onChange={e=>setPayoutAmount(e.target.value)} />
                      <div style={{ fontSize:9, color:t.dim, marginBottom:10 }}>Will be sent to M-Pesa: {influencer.mpesa_number}</div>
                      <button onClick={handlePayout} disabled={loading||balance<1000}
                        style={{ ...btn, width:"100%", padding:"12px", background:balance>=1000?"linear-gradient(135deg,#00dd55,#009933)":"#1e3040", color:balance>=1000?"#fff":"#445566", fontSize:12, letterSpacing:1 }}>
                        {loading?"⟳ REQUESTING...":"💰 REQUEST PAYOUT"}
                      </button>
                    </div>
                  )}
                  {influencer.status==="pending" && (
                    <div style={{ background:dark?"#1a1000":"#fffbe8", border:"1px solid #ffaa0033", borderRadius:8, padding:"12px 14px", marginBottom:14, fontSize:11, color:"#ffaa00" }}>
                      ⏳ Payouts available after admin approves your account
                    </div>
                  )}
                  {payouts.length===0 && <div style={{ textAlign:"center", padding:16, color:t.dim, fontSize:11 }}>No payout history yet</div>}
                  {payouts.map((p,i)=>(
                    <div key={i} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:12, color:dark?"#fff":"#001133", fontWeight:700 }}>KES {p.amount?.toLocaleString()}</div>
                        <div style={{ fontSize:9, color:t.dim }}>{new Date(p.created_at).toLocaleDateString()} · {p.mpesa_number}</div>
                      </div>
                      <span style={{ fontSize:9, padding:"3px 10px", background:p.status==="paid"?"#00dd5522":p.status==="pending"?"#ffaa0022":"#ff224422", border:`1px solid ${p.status==="paid"?"#00dd5533":p.status==="pending"?"#ffaa0033":"#ff224433"}`, color:p.status==="paid"?"#00dd55":p.status==="pending"?"#ffaa00":"#ff4466", borderRadius:5, fontWeight:700 }}>
                        {p.status?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
