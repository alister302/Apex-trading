import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const SERVER = "https://apex-server-09p7.onrender.com";

export default function AdminDashboard({ dark, onExit }) {
  const [tab, setTab] = useState("stats");
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [adminPayouts, setAdminPayouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const passkey = sessionStorage.getItem("apex_admin_key") || "";

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    text: dark?"#c8d8e8":"#1a2a3a",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
    label: dark?"#667788":"#556677",
  };

  const headers = { "Content-Type":"application/json", "x-admin-passkey":passkey };

  const fetchStats = async () => {
    const res = await fetch(`${SERVER}/admin/stats`, { headers });
    const data = await res.json();
    setStats(data);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(`${SERVER}/admin/users`, { headers });
    const data = await res.json();
    setUsers(data.users||[]);
    setLoading(false);
  };

  const fetchInfluencers = async () => {
    const res = await fetch(`${SERVER}/admin/influencers`, { headers });
    const data = await res.json();
    setInfluencers(data.influencers||[]);
  };

  const fetchAdminPayouts = async () => {
    const res = await fetch(`${SERVER}/admin/payouts`, { headers });
    const data = await res.json();
    setAdminPayouts(data.payouts||[]);
  };

  const fetchPayments = async () => {
    setLoading(true);
    const res = await fetch(`${SERVER}/admin/payments`, { headers });
    const data = await res.json();
    setPayments(data.payments||[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPayments();
    fetchInfluencers();
    fetchAdminPayouts();
  }, []);

  const updateInfluencerStatus = async (id, status) => {
    await fetch(`${SERVER}/admin/influencer/status`, {
      method:"POST", headers, body:JSON.stringify({ influencer_id:id, status })
    });
    setMsg("✓ Influencer status updated to "+status);
    fetchInfluencers();
  };

  const markPayoutPaid = async (id) => {
    await fetch(`${SERVER}/admin/payout/pay`, {
      method:"POST", headers, body:JSON.stringify({ payout_id:id })
    });
    setMsg("✓ Payout marked as paid");
    fetchAdminPayouts();
  };

  const grantSub = async (userId, plan) => {
    setMsg("");
    const res = await fetch(`${SERVER}/admin/grant`, { method:"POST", headers, body:JSON.stringify({ user_id:userId, plan }) });
    const data = await res.json();
    if (data.success) { setMsg(`✓ Granted ${plan} to user`); fetchUsers(); }
    else setMsg("Error: " + data.error);
  };

  const revokeSub = async (userId) => {
    const res = await fetch(`${SERVER}/admin/revoke`, { method:"POST", headers, body:JSON.stringify({ user_id:userId }) });
    const data = await res.json();
    if (data.success) { setMsg("✓ Subscription revoked"); fetchUsers(); }
  };

  const promotePlan = async (userId) => {
    const res = await fetch(`${SERVER}/admin/promote`, { method:"POST", headers, body:JSON.stringify({ user_id:userId }) });
    const data = await res.json();
    if (data.success) { setMsg("✓ User promoted to admin"); fetchUsers(); }
  };

  const TABS = [["stats","📊 STATS"],["users","👥 USERS"],["payments","💳 PAYMENTS"],["influencers","💼 PARTNERS"],["payouts","💰 PAYOUTS"]];

  return (
    <div style={{ minHeight:"100vh", background:t.bg, fontFamily:"'IBM Plex Mono',monospace", color:t.text }}>
      <style>{`.adm-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:9px;letter-spacing:1px;border-radius:4px;padding:4px 8px}.adm-btn:hover{opacity:0.8}`}</style>

      {/* Header */}
      <div style={{ background:dark?"#030810":"#fff", borderBottom:`1px solid ${t.border}`, padding:"0 16px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", height:50 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:900, color:"#ffd700", letterSpacing:2 }}>⚡ ADMIN DASHBOARD</div>
          <button className="adm-btn" onClick={onExit} style={{ background:"#ff224422", color:"#ff4466", padding:"6px 12px" }}>← EXIT</button>
              <button className="adm-btn" onClick={async()=>{ await supabase.auth.signOut(); onExit(); }} style={{ background:"#ff000033", color:"#ff4444", padding:"6px 12px", border:"1px solid #ff000044", borderRadius:4 }}>🔒 LOGOUT</button>        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ background:dark?"#030810":"#fff", borderBottom:`1px solid ${t.border}`, padding:"0 16px" }}>
        <div style={{ display:"flex", gap:4 }}>
          {TABS.map(([id,label])=>(
            <button key={id} className="adm-btn" onClick={()=>setTab(id)}
              style={{ padding:"12px 16px", background:"transparent", borderBottom:tab===id?"3px solid #ffd700":"3px solid transparent", color:tab===id?"#ffd700":t.muted, borderRadius:0, fontSize:10, letterSpacing:1 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"16px" }}>
        {msg && <div style={{ background:dark?"#001a0d":"#e8fff3", border:"1px solid #00cc5533", borderRadius:7, padding:"8px 14px", marginBottom:14, fontSize:11, color:"#00cc55" }}>{msg}</div>}

        {/* STATS */}
        {tab==="stats" && stats && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
            {[
              { label:"TOTAL USERS", value:stats.users||0, color:"#4499ff" },
              { label:"ACTIVE SUBS", value:stats.active_subs||0, color:"#00dd55" },
              { label:"TOTAL REVENUE", value:`KES ${(stats.total_revenue||0).toLocaleString()}`, color:"#ffd700" },
            ].map(({label,value,color})=>(
              <div key={label} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"20px 16px", textAlign:"center" }}>
                <div style={{ fontSize:9, letterSpacing:2, color:t.label, marginBottom:8 }}>{label}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {tab==="users" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:10, color:t.label, fontWeight:700, letterSpacing:2 }}>ALL USERS ({users.length})</div>
              <button className="adm-btn" onClick={fetchUsers} style={{ background:"#0066ff22", color:"#4499ff", padding:"6px 12px" }}>⟳ REFRESH</button>
            </div>
            {loading && <div style={{ textAlign:"center", padding:24, color:t.dim, fontSize:11 }}>Loading...</div>}
            {users.map(u=>(
              <div key={u.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontSize:12, color:dark?"#fff":"#001133", fontWeight:700 }}>{u.full_name||"Unknown"}</div>
                    <div style={{ fontSize:10, color:t.muted }}>{u.email}</div>
                    <div style={{ display:"flex", gap:6, marginTop:4 }}>
                      <span style={{ fontSize:8, padding:"2px 7px", background:u.role==="admin"?"#ffd70022":"#0066ff11", border:`1px solid ${u.role==="admin"?"#ffd70033":"#0066ff22"}`, color:u.role==="admin"?"#ffd700":"#4499ff", borderRadius:4, fontWeight:700, letterSpacing:1 }}>{u.role?.toUpperCase()}</span>
                      {u.subscription && <span style={{ fontSize:8, padding:"2px 7px", background:u.subscription.status==="active"?"#00dd5522":"#ff224422", border:`1px solid ${u.subscription.status==="active"?"#00dd5533":"#ff224433"}`, color:u.subscription.status==="active"?"#00dd55":"#ff4466", borderRadius:4, fontWeight:700 }}>{u.subscription.plan?.toUpperCase()} · {u.subscription.status?.toUpperCase()}</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {["weekly","monthly","annual","lifetime"].map(plan=>(
                      <button key={plan} className="adm-btn" onClick={()=>grantSub(u.id,plan)} style={{ background:"#00dd5522", color:"#00dd55", border:"1px solid #00dd5533" }}>+{plan}</button>
                    ))}
                    <button className="adm-btn" onClick={()=>revokeSub(u.id)} style={{ background:"#ff224422", color:"#ff4466", border:"1px solid #ff224433" }}>REVOKE</button>
                    {u.role!=="admin" && <button className="adm-btn" onClick={()=>promotePlan(u.id)} style={{ background:"#ffd70022", color:"#ffd700", border:"1px solid #ffd70033" }}>PROMOTE</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INFLUENCERS */}
        {tab==="influencers" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:10, color:t.label, fontWeight:700, letterSpacing:2 }}>PARTNERS ({influencers.length})</div>
              <button className="adm-btn" onClick={fetchInfluencers} style={{ background:"#0066ff22", color:"#4499ff", padding:"6px 12px" }}>⟳ REFRESH</button>
            </div>
            {influencers.map(inf=>(
              <div key={inf.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontSize:12, color:dark?"#fff":"#001133", fontWeight:700 }}>{inf.full_name}</div>
                    <div style={{ fontSize:10, color:t.muted }}>M-Pesa: {inf.mpesa_number} · ID: {inf.national_id}</div>
                    <div style={{ fontSize:10, color:"#ffd700", fontWeight:700 }}>Code: {inf.referral_code}</div>
                    <div style={{ display:"flex", gap:6, marginTop:4 }}>
                      <span style={{ fontSize:8, padding:"2px 7px", background:inf.status==="approved"?"#00dd5522":inf.status==="pending"?"#ffaa0022":"#ff224422", border:`1px solid ${inf.status==="approved"?"#00dd5533":inf.status==="pending"?"#ffaa0033":"#ff224433"}`, color:inf.status==="approved"?"#00dd55":inf.status==="pending"?"#ffaa00":"#ff4466", borderRadius:4, fontWeight:700 }}>{inf.status?.toUpperCase()}</span>
                      <span style={{ fontSize:8, color:t.dim }}>Referrals: {inf.total_referrals} · Earned: KES {inf.total_earnings?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    {inf.status!=="approved" && <button className="adm-btn" onClick={()=>updateInfluencerStatus(inf.id,"approved")} style={{ background:"#00dd5522", color:"#00dd55", border:"1px solid #00dd5533" }}>✓ APPROVE</button>}
                    {inf.status!=="suspended" && <button className="adm-btn" onClick={()=>updateInfluencerStatus(inf.id,"suspended")} style={{ background:"#ff224422", color:"#ff4466", border:"1px solid #ff224433" }}>SUSPEND</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAYOUTS */}
        {tab==="payouts" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:10, color:t.label, fontWeight:700, letterSpacing:2 }}>PAYOUT REQUESTS ({adminPayouts.length})</div>
              <button className="adm-btn" onClick={fetchAdminPayouts} style={{ background:"#0066ff22", color:"#4499ff", padding:"6px 12px" }}>⟳ REFRESH</button>
            </div>
            {adminPayouts.map(p=>(
              <div key={p.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:12, color:dark?"#fff":"#001133", fontWeight:700 }}>{p.influencers?.full_name}</div>
                  <div style={{ fontSize:10, color:t.muted }}>KES {p.amount?.toLocaleString()} → {p.influencers?.mpesa_number}</div>
                  <div style={{ fontSize:9, color:t.dim }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:9, padding:"3px 10px", background:p.status==="paid"?"#00dd5522":"#ffaa0022", border:`1px solid ${p.status==="paid"?"#00dd5533":"#ffaa0033"}`, color:p.status==="paid"?"#00dd55":"#ffaa00", borderRadius:5, fontWeight:700 }}>{p.status?.toUpperCase()}</span>
                  {p.status==="pending" && <button className="adm-btn" onClick={()=>markPayoutPaid(p.id)} style={{ background:"#00dd5522", color:"#00dd55", border:"1px solid #00dd5533" }}>✓ MARK PAID</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAYMENTS */}
        {tab==="payments" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:10, color:t.label, fontWeight:700, letterSpacing:2 }}>ALL PAYMENTS ({payments.length})</div>
              <button className="adm-btn" onClick={fetchPayments} style={{ background:"#0066ff22", color:"#4499ff", padding:"6px 12px" }}>⟳ REFRESH</button>
            </div>
            {loading && <div style={{ textAlign:"center", padding:24, color:t.dim, fontSize:11 }}>Loading...</div>}
            {payments.map(p=>(
              <div key={p.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700 }}>{p.profiles?.email||p.user_id?.slice(0,12)}</div>
                  <div style={{ fontSize:10, color:t.muted }}>{p.plan?.toUpperCase()} · KES {p.amount?.toLocaleString()}</div>
                  <div style={{ fontSize:9, color:t.dim }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{ fontSize:9, padding:"3px 10px", background:p.status==="completed"?"#00dd5522":p.status==="pending"?"#ffaa0022":"#ff224422", border:`1px solid ${p.status==="completed"?"#00dd5533":p.status==="pending"?"#ffaa0033":"#ff224433"}`, color:p.status==="completed"?"#00dd55":p.status==="pending"?"#ffaa00":"#ff4466", borderRadius:5, fontWeight:700 }}>
                  {p.status?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
