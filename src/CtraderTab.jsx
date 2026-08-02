import { useState, useEffect } from "react";

const SERVER = "https://princex-api.onrender.com";
const CLIENT_ID = "34731_EFdh6Dqb0UOI6OdxQCwX4tt2PPzESSBdfWw8kwAokpw0xxSEA6";
const REDIRECT_URI = "https://princex-iq.vercel.app";
const AUTH_URL = `https://connect.spotware.com/apps/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=trading`;
// Sandbox: use demo accounts for testing until KYC approved

export default function CtraderTab({ dark }) {
  const [token, setToken]     = useState(localStorage.getItem("ctrader_token")||null);
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [balance, setBalance]   = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [lotSize, setLotSize]   = useState(0.01);
  const [tradeResult, setTradeResult] = useState(null);
  const [chartTF, setChartTF] = useState("15");
  const [tradeSymbol, setTradeSymbol] = useState("EURUSD");

  const t = {
    bg: dark?"#050a0f":"#f0f4f8",
    bgCard: dark?"rgba(0,20,40,0.9)":"#fff",
    border: dark?"#0d2a42":"#d0dce8",
    muted: dark?"#8899aa":"#445566",
    dim: dark?"#445566":"#778899",
  };

  // Handle OAuth callback
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.history.replaceState({}, "", "/");
      exchangeCode(code);
    }
  }, []);

  // Load accounts when token available
  useEffect(()=>{
    if (token) fetchAccounts();
  }, [token]);

  const exchangeCode = async (code) => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/ctrader/token`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("ctrader_token", data.access_token);
        setToken(data.access_token);
      } else {
        setError(data.error || "Auth failed");
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/ctrader/accounts`, {
        headers:{ "x-ctrader-token": token }
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setAccounts(data.accounts||[]);
      if (data.accounts?.length > 0) setSelected(data.accounts[0]);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const fetchBalance = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${SERVER}/ctrader/balance/${selected.accountId}`, {
        headers:{ "x-ctrader-token": token }
      });
      const data = await res.json();
      setBalance(data);
    } catch(e) {}
  };

  useEffect(()=>{ if(selected) fetchBalance(); }, [selected]);

  const placeTrade = async (direction) => {
    if (!selected) return;
    setLoading(true); setTradeResult(null);
    try {
      const res = await fetch(`${SERVER}/ctrader/trade`, {
        method:"POST",
        headers:{"Content-Type":"application/json","x-ctrader-token":token},
        body: JSON.stringify({
          accountId: selected.accountId,
          symbol: tradeSymbol,
          direction,
          volume: Math.round(lotSize * 100000),
        }),
      });
      const data = await res.json();
      if (data.error) setTradeResult({ success:false, error:data.error });
      else setTradeResult({ success:true, ...data });
      fetchBalance();
    } catch(e) { setTradeResult({ success:false, error:e.message }); }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("ctrader_token");
    setToken(null); setAccounts([]); setSelected(null); setBalance(null);
  };

  return (
    <div style={{ background:t.bg, minHeight:"100%", fontFamily:"'IBM Plex Mono',monospace" }}>
      <style>{`.cbtn{cursor:pointer;transition:all 0.15s;border:none;font-family:'IBM Plex Mono',monospace;font-weight:700} .cbtn:hover{opacity:0.85}`}</style>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"14px 16px" }}>

        {/* Header */}
        <div style={{ background:t.bgCard, border:"2px solid #ff440044", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:"#ff4400", letterSpacing:2, marginBottom:2 }}>
                🔴 PEPPERSTONE · CTRADER
              </div>
              <div style={{ fontSize:9, color:t.dim }}>Connect your cTrader account · Trade directly</div>
            </div>
            {token && (
              <button className="cbtn" onClick={logout}
                style={{ background:"#ff224422", border:"1px solid #ff224433", color:"#ff4466", padding:"6px 12px", borderRadius:6, fontSize:9 }}>
                LOGOUT
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background:"#1a0005", border:"1px solid #ff224433", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:"#ff5577" }}>⚠ {error}</span>
            <button onClick={()=>setError("")} style={{ background:"none", border:"none", color:"#ff5577", cursor:"pointer", fontSize:18 }}>×</button>
          </div>
        )}

        {!token ? (
          /* Login screen */
          <div>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"24px 20px", textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔗</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:dark?"#fff":"#001133", marginBottom:8 }}>
                CONNECT PEPPERSTONE
              </div>
              <div style={{ fontSize:10, color:t.muted, lineHeight:1.8, marginBottom:20 }}>
                Connect your Pepperstone cTrader account to:<br/>
                • View your balance and positions<br/>
                • Place trades directly from signals<br/>
                • Manage your account
              </div>
              <button className="cbtn" onClick={()=>window.location.href=AUTH_URL}
                style={{ padding:"16px 32px", background:"linear-gradient(135deg,#ff4400,#cc2200)", color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2, width:"100%" }}>
                🔗 CONNECT WITH CTRADER
              </button>
              <div style={{ fontSize:9, color:t.dim, marginTop:10 }}>
                Secure OAuth 2.0 · Pepperstone/cTrader credentials never stored
              </div>
            </div>

            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:10, color:"#ff4400", fontWeight:700, marginBottom:8 }}>HOW IT WORKS</div>
              {[
                ["1","Click Connect with cTrader"],
                ["2","Login with your Pepperstone credentials"],
                ["3","Authorize PrinceX IQ"],
                ["4","Start trading from signals directly"],
              ].map(([n,s])=>(
                <div key={n} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"center" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:"#ff440022", border:"1px solid #ff440044", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:9, color:"#ff4400", fontWeight:900 }}>{n}</span>
                  </div>
                  <span style={{ fontSize:10, color:t.muted }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Connected screen */
          <div>
            {/* Account selector */}
            {accounts.length > 0 && (
              <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"14px 16px", marginBottom:12 }}>
                <div style={{ fontSize:9, color:t.dim, fontWeight:700, letterSpacing:1, marginBottom:10 }}>SELECT ACCOUNT</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {accounts.map(acc=>(
                    <div key={acc.accountId} onClick={()=>setSelected(acc)}
                      style={{ padding:"10px 14px", background:selected?.accountId===acc.accountId?"#ff440022":"transparent",
                        border:`2px solid ${selected?.accountId===acc.accountId?"#ff4400":t.border}`,
                        borderRadius:8, cursor:"pointer", display:"flex", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontSize:11, color:dark?"#fff":"#001133", fontWeight:700 }}>{acc.accountNumber||acc.accountId}</div>
                        <div style={{ fontSize:9, color:t.dim }}>{acc.brokerName||"Pepperstone"} · {acc.isLive?"LIVE":"DEMO"}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:9, color:acc.isLive?"#ff4400":"#4499ff", fontWeight:700 }}>
                          {acc.isLive?"🔴 LIVE":"🔵 DEMO"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Balance */}
            {balance && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  ["BALANCE", `$${(balance.balance/100).toFixed(2)}`, "#00dd55"],
                  ["EQUITY",  `$${(balance.equity/100).toFixed(2)}`,  "#4499ff"],
                  ["MARGIN",  `$${(balance.margin/100).toFixed(2)}`,  "#ffaa00"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px", textAlign:"center" }}>
                    <div style={{ fontSize:7, color:t.dim, letterSpacing:1 }}>{l}</div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TradingView Chart */}
            <div style={{ borderRadius:10, overflow:"hidden", marginBottom:12, border:`1px solid ${t.border}` }}>
              <div style={{ padding:"5px 10px", background:dark?"#0a1520":"#e8f4ff", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:9, color:"#4499ff", fontFamily:"monospace", fontWeight:700 }}>📊 LIVE CHART · {tradeSymbol} · 15M</span>
                <div style={{ display:"flex", gap:5 }}>
                  {["1","5","15","60","240"].map(tf=>(
                    <button key={tf} onClick={()=>setChartTF(tf)}
                      style={{ padding:"2px 6px", background:chartTF===tf?"#0066ff":"transparent", border:`1px solid ${chartTF===tf?"#0066ff":t.border}`, color:chartTF===tf?"#fff":t.muted, borderRadius:3, fontSize:8, cursor:"pointer" }}>
                      {tf==="1"?"1M":tf==="5"?"5M":tf==="15"?"15M":tf==="60"?"1H":"4H"}
                    </button>
                  ))}
                </div>
              </div>
              <iframe
                key={tradeSymbol+chartTF}
                src={`https://www.tradingview.com/widgetembed/?symbol=FX:${tradeSymbol.replace("XAU","GOLD").replace("USD","USD")}&interval=${chartTF}&theme=${dark?"dark":"light"}&style=1&locale=en&hide_top_toolbar=0&hide_legend=0&hide_side_toolbar=0&save_image=false&studies=RSI@tv-basicstudies,MACD@tv-basicstudies,BB@tv-basicstudies`}
                style={{ width:"100%", height:400, border:"none", display:"block" }}
                title={tradeSymbol}
                loading="lazy"
              />
            </div>

            {/* Trading panel */}
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px", marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#ff4400", fontWeight:700, letterSpacing:1, marginBottom:12 }}>📊 PLACE TRADE</div>

              {/* Lot size */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:t.dim, marginBottom:6 }}>LOT SIZE</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {[0.01,0.05,0.1,0.25,0.5,1.0].map(l=>(
                    <button key={l} className="cbtn" onClick={()=>setLotSize(l)}
                      style={{ padding:"8px 12px", background:lotSize===l?"#ff4400":"transparent",
                        border:`1px solid ${lotSize===l?"#ff4400":t.border}`,
                        color:lotSize===l?"#fff":t.muted, borderRadius:5, fontSize:10 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buy/Sell buttons */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                <button className="cbtn" onClick={()=>placeTrade("BUY")} disabled={loading}
                  style={{ padding:"16px", background:"linear-gradient(135deg,#00aa44,#007733)", color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2 }}>
                  ▲ BUY
                </button>
                <button className="cbtn" onClick={()=>placeTrade("SELL")} disabled={loading}
                  style={{ padding:"16px", background:"linear-gradient(135deg,#cc2244,#991133)", color:"#fff", borderRadius:10, fontSize:14, letterSpacing:2 }}>
                  ▼ SELL
                </button>
              </div>

              {/* Trade result */}
              {tradeResult && (
                <div style={{ background:tradeResult.success?"#001a0d":"#1a0005",
                  border:`1px solid ${tradeResult.success?"#00dd5533":"#ff224433"}`,
                  borderRadius:8, padding:"10px 14px", fontSize:10,
                  color:tradeResult.success?"#00dd55":"#ff5577", fontFamily:"monospace" }}>
                  {tradeResult.success
                    ? `✅ Trade placed! Order: ${tradeResult.orderId||"done"}`
                    : `❌ ${tradeResult.error}`}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button className="cbtn" onClick={fetchBalance}
              style={{ width:"100%", padding:"10px", background:"transparent", border:`1px solid ${t.border}`, color:t.muted, borderRadius:8, fontSize:10 }}>
              ⟳ REFRESH BALANCE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
