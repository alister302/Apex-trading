import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  const reset = () => { setError(""); setSuccess(""); };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); reset();
    const { error: e } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
    setLoading(false);
    if (e) setError(e.message);
    else { setSuccess("Account created! You can now sign in."); setTimeout(() => setMode("login"), 2000); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError("Email and password required"); return; }
    setLoading(true); reset();
    const { data, error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (e) setError(e.message);
    else onLogin(data.user);
  };

  const handleForgot = async () => {
    if (!email.trim()) { setError("Enter your email address"); return; }
    setLoading(true); reset();
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: "https://apex-trading-eta.vercel.app" });
    setLoading(false);
    if (e) setError(e.message);
    else setSuccess("Reset link sent! Check your email inbox.");
  };

  const inp = { width:"100%", padding:"13px 16px", background:"rgba(0,40,80,0.25)", border:"1px solid #0d2a42", borderRadius:8, color:"#c8d8e8", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, outline:"none" };

  return (
    <div style={{ minHeight:"100vh", background:"#020810", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'IBM Plex Mono',monospace", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 30px #0066ff22,0 0 60px #0066ff11}50%{box-shadow:0 0 40px #0066ff44,0 0 80px #0066ff22}}
        @keyframes rain{0%{transform:translateY(-150px);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(110vh);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .auth-card{animation:fadeUp 0.5s ease forwards,glow 4s ease-in-out infinite}
        .logo-float{animation:floatY 3s ease-in-out infinite}
        .auth-inp:focus{border-color:#0066ff!important;box-shadow:0 0 0 3px #0066ff22}
        .auth-btn{transition:all 0.2s;cursor:pointer;border:none;font-family:'IBM Plex Mono',monospace}
        .auth-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,100,255,0.4)}
        .auth-btn:disabled{opacity:0.5;cursor:not-allowed}
        .link{background:none;border:none;cursor:pointer;font-family:'IBM Plex Mono',monospace;transition:color 0.2s}
        .link:hover{color:#4499ff!important}
      `}</style>

      {["$","€","£","₿","Ξ","¥","$","€","₿"].map((s,i)=>(
        <div key={i} style={{ position:"absolute", fontSize:14+i*3, color:i%2===0?"#0066ff0d":"#ffd7000d", fontWeight:900, userSelect:"none", left:`${8+i*11}%`, top:`-20px`, animation:`rain ${5+i*0.7}s linear ${i*0.4}s infinite` }}>{s}</div>
      ))}

      <div className="auth-card" style={{ background:"rgba(2,8,16,0.97)", border:"1px solid #0d2a42", borderRadius:18, padding:"38px 32px", width:"100%", maxWidth:420, position:"relative", zIndex:2, backdropFilter:"blur(12px)" }}>

        <div className="logo-float" style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:68, height:68, background:"linear-gradient(135deg,#0066ff,#00aaff)", clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 0 40px #0066ff55" }}>
            <span style={{ fontSize:30, color:"#fff" }}>▲</span>
          </div>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:24, fontWeight:900, color:"#fff", letterSpacing:4 }}>
            PRINCEX <span style={{ color:"#ffd700" }}>ACADEMY</span>
          </div>
          <div style={{ fontSize:9, color:"#2a4060", letterSpacing:3, marginTop:5 }}>TRADING SIGNALS PLATFORM</div>
        </div>

        <div style={{ fontSize:11, fontWeight:700, color:"#4499ff", letterSpacing:2, marginBottom:20, textAlign:"center" }}>
          {mode==="login"?"⚡ SIGN IN TO YOUR ACCOUNT":mode==="register"?"✦ CREATE FREE ACCOUNT":"🔑 RESET YOUR PASSWORD"}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {mode==="register" && (
            <input className="auth-inp" style={inp} placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} />
          )}
          <input className="auth-inp" style={inp} type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} />
          {mode!=="forgot" && (
            <div style={{ position:"relative" }}>
              <input className="auth-inp" style={{ ...inp, paddingRight:50 }} type={showPass?"text":"password"} placeholder="Password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())} />
              <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#334455", cursor:"pointer", fontSize:16 }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ marginTop:12, padding:"10px 14px", background:"#1a0005", border:"1px solid #ff224433", borderRadius:7, fontSize:11, color:"#ff5577" }}>⚠ {error}</div>}
        {success && <div style={{ marginTop:12, padding:"10px 14px", background:"#001a0d", border:"1px solid #00cc5533", borderRadius:7, fontSize:11, color:"#00cc55" }}>✓ {success}</div>}

        <button className="auth-btn" disabled={loading} onClick={mode==="login"?handleLogin:mode==="register"?handleRegister:handleForgot}
          style={{ marginTop:18, width:"100%", padding:"15px", background:"linear-gradient(135deg,#0066ff,#0044bb)", borderRadius:8, color:"#fff", fontSize:13, fontWeight:700, letterSpacing:2 }}>
          {loading?"⟳ PLEASE WAIT...":mode==="login"?"⚡ SIGN IN":mode==="register"?"✦ CREATE ACCOUNT":"📧 SEND RESET LINK"}
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"18px 0" }}>
          <div style={{ flex:1, height:1, background:"#0d2a42" }} />
          <span style={{ fontSize:9, color:"#1e3040" }}>OR</span>
          <div style={{ flex:1, height:1, background:"#0d2a42" }} />
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
          {mode==="login" && <>
            <button className="link" onClick={()=>{setMode("forgot");reset();}} style={{ fontSize:11, color:"#445566" }}>Forgot password?</button>
            <div style={{ fontSize:11, color:"#2a4060" }}>No account? <button className="link" onClick={()=>{setMode("register");reset();}} style={{ fontSize:11, color:"#4499ff", fontWeight:700 }}>Create one free →</button></div>
          </>}
          {mode==="register" && <div style={{ fontSize:11, color:"#2a4060" }}>Already have account? <button className="link" onClick={()=>{setMode("login");reset();}} style={{ fontSize:11, color:"#4499ff", fontWeight:700 }}>Sign in →</button></div>}
          {mode==="forgot" && <button className="link" onClick={()=>{setMode("login");reset();}} style={{ fontSize:11, color:"#4499ff", fontWeight:700 }}>← Back to sign in</button>}
        </div>

        <div style={{ marginTop:24, fontSize:8, color:"#1a2a3a", textAlign:"center", letterSpacing:1 }}>PRINCEX ACADEMY · PRINCE X TOOLS · TRADING INVOLVES RISK</div>
      </div>
    </div>
  );
}
