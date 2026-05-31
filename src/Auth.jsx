import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  const reset = () => { setError(""); setSuccess(""); };

  const handleRegister = async () => {
    if (!name || !email || !password) { setError("All fields required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); reset();
    const { error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    });
    setLoading(false);
    if (e) setError(e.message);
    else { setSuccess("Account created! You can now login."); setMode("login"); }
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password required"); return; }
    setLoading(true); reset();
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (e) setError(e.message);
    else onLogin(data.user);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email first"); return; }
    setLoading(true); reset();
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://apex-trading-eta.vercel.app"
    });
    setLoading(false);
    if (e) setError(e.message);
    else setSuccess("Password reset link sent to your email!");
  };

  const inp = {
    width: "100%", padding: "13px 16px",
    background: "rgba(0,40,80,0.3)",
    border: "1px solid #0d2a42",
    borderRadius: 8, color: "#c8d8e8",
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 13, outline: "none",
    transition: "border 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#050a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'IBM Plex Mono',monospace",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px #0066ff22} 50%{box-shadow:0 0 40px #0066ff44} }
        @keyframes rain { from{transform:translateY(-100px)} to{transform:translateY(110vh)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .auth-card { animation: fadeIn 0.5s ease, glow 3s infinite; }
        .logo-float { animation: float 3s ease-in-out infinite; }
        .auth-inp:focus { border-color: #0066ff !important; box-shadow: 0 0 0 2px #0066ff22; }
        .auth-btn { transition: all 0.2s; cursor: pointer; }
        .auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,100,255,0.4); }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .link-btn { background: none; border: none; cursor: pointer; font-family: 'IBM Plex Mono',monospace; transition: color 0.2s; }
        .link-btn:hover { color: #4499ff !important; }
      `}</style>

      {/* Background symbols */}
      {["$","€","£","₿","Ξ","¥"].map((s,i) => (
        <div key={i} style={{
          position:"absolute", fontSize: 16+i*4,
          color: i%2===0?"#0066ff11":"#ffd70011",
          fontWeight:900, userSelect:"none",
          left:`${10+i*15}%`, top:`${20+i*10}%`,
          animation:`rain ${4+i}s linear ${i*0.5}s infinite`,
        }}>{s}</div>
      ))}

      {/* Card */}
      <div className="auth-card" style={{
        background: "rgba(3,8,16,0.95)",
        border: "1px solid #0d2a42",
        borderRadius: 16, padding: "36px 32px",
        width: "100%", maxWidth: 420,
        backdropFilter: "blur(10px)",
        position: "relative", zIndex: 2,
      }}>
        {/* Logo */}
        <div className="logo-float" style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{
            width:64, height:64,
            background:"linear-gradient(135deg,#0066ff,#00aaff)",
            clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 14px",
            boxShadow:"0 0 30px #0066ff44",
          }}>
            <span style={{ fontSize:28, color:"#fff" }}>▲</span>
          </div>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, color:"#fff", letterSpacing:4 }}>
            APEX <span style={{ color:"#ffd700" }}>FX</span>
          </div>
          <div style={{ fontSize:9, color:"#334455", letterSpacing:3, marginTop:4 }}>CANDLE INTELLIGENCE SYSTEM</div>
        </div>

        {/* Mode title */}
        <div style={{ fontSize:13, fontWeight:700, color:"#4499ff", letterSpacing:2, marginBottom:20, textAlign:"center" }}>
          {mode==="login"?"SIGN IN TO YOUR ACCOUNT":mode==="register"?"CREATE NEW ACCOUNT":"RESET YOUR PASSWORD"}
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {mode==="register" && (
            <input className="auth-inp" style={inp} placeholder="Full Name"
              value={name} onChange={e=>setName(e.target.value)} />
          )}

          <input className="auth-inp" style={inp} placeholder="Email Address" type="email"
            value={email} onChange={e=>setEmail(e.target.value)} />

          {mode!=="forgot" && (
            <div style={{ position:"relative" }}>
              <input className="auth-inp" style={{ ...inp, paddingRight:48 }}
                placeholder="Password" type={showPass?"text":"password"}
                value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())}
              />
              <button onClick={()=>setShowPass(!showPass)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#445566", cursor:"pointer", fontSize:16 }}>
                {showPass?"🙈":"👁️"}
              </button>
            </div>
          )}
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{ marginTop:12, padding:"10px 14px", background:"#1a0005", border:"1px solid #ff224433", borderRadius:6, fontSize:11, color:"#ff4466" }}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop:12, padding:"10px 14px", background:"#001a0d", border:"1px solid #00cc5533", borderRadius:6, fontSize:11, color:"#00cc55" }}>
            ✓ {success}
          </div>
        )}

        {/* Main Button */}
        <button className="auth-btn" disabled={loading}
          onClick={mode==="login"?handleLogin:mode==="register"?handleRegister:handleForgot}
          style={{
            marginTop:20, width:"100%", padding:"14px",
            background:"linear-gradient(135deg,#0066ff,#0044bb)",
            border:"none", borderRadius:8, color:"#fff",
            fontFamily:"'IBM Plex Mono',monospace", fontSize:13,
            fontWeight:700, letterSpacing:2,
          }}>
          {loading ? "⟳ PLEASE WAIT..." : mode==="login"?"⚡ SIGN IN":mode==="register"?"✦ CREATE ACCOUNT":"📧 SEND RESET LINK"}
        </button>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"20px 0" }}>
          <div style={{ flex:1, height:1, background:"#0d2a42" }} />
          <span style={{ fontSize:10, color:"#334455" }}>OR</span>
          <div style={{ flex:1, height:1, background:"#0d2a42" }} />
        </div>

        {/* Links */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
          {mode==="login" && <>
            <button className="link-btn" onClick={()=>{setMode("forgot");reset();}} style={{ fontSize:11, color:"#667788" }}>
              Forgot password?
            </button>
            <div style={{ fontSize:11, color:"#445566" }}>
              No account?{" "}
              <button className="link-btn" onClick={()=>{setMode("register");reset();}} style={{ fontSize:11, color:"#4499ff", fontWeight:700 }}>
                Create one free
              </button>
            </div>
          </>}

          {mode==="register" && (
            <div style={{ fontSize:11, color:"#445566" }}>
              Already have account?{" "}
              <button className="link-btn" onClick={()=>{setMode("login");reset();}} style={{ fontSize:11, color:"#4499ff", fontWeight:700 }}>
                Sign in
              </button>
            </div>
          )}

          {mode==="forgot" && (
            <button className="link-btn" onClick={()=>{setMode("login");reset();}} style={{ fontSize:11, color:"#4499ff", fontWeight:700 }}>
              ← Back to sign in
            </button>
          )}
        </div>

        <div style={{ marginTop:24, fontSize:9, color:"#1e3040", textAlign:"center", letterSpacing:1 }}>
          APEX FX · POWERED BY PRINCE X TOOLS · TRADING INVOLVES RISK
        </div>
      </div>
    </div>
  );
}
