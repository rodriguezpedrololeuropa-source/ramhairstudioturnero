import { useState, useEffect } from "react";

// ============================================================
//  RAM HAIR STUDIO — TURNOS ONLINE (app publica para clientes)
//  Usa la MISMA API de Google Sheets que tu panel privado.
//  Cada turno se guarda con origen "publico" en la hoja TURNOS,
//  y aparece automaticamente en el Turnero de tu panel.
// ============================================================

const API = "https://script.google.com/macros/s/AKfycbw8-ZwQ23GvZufkXLMr_y-Pe49Md_PT4sS5DqiWCY8I0qy8-63E65rtvU2pIZSBI3Zw/exec";

// ------- CONFIGURACION DEL LOCAL (edita esto a gusto) -------
const HORA_INICIO = 9;        // abre 09:00
const HORA_FIN = 20;          // ultimo turno arranca antes de las 20:00
const INTERVALO_MIN = 30;     // duracion de cada turno en minutos
const DIAS_CERRADOS = [0];    // 0=Domingo, 1=Lunes ... 6=Sabado
const DIAS_ADELANTE = 14;     // cuantos dias hacia adelante se puede reservar
// ------------------------------------------------------------

const SVCS = [
  { id: "corte", label: "Corte", price: 14000 },
  { id: "corte_barba", label: "Corte + Barba", price: 18000 },
  { id: "corte_cejas", label: "Corte + Cejas", price: 15000 },
  { id: "corte_full", label: "Corte FULL", price: 20000 },
];

const fmtP = n => "$" + Number(n).toLocaleString("es-AR");
const DIAS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

async function api(action, params = {}) {
  const res = await fetch(API, { method: "POST", body: JSON.stringify({ action, ...params }) });
  return res.json();
}

async function fetchTurnos() {
  // Si agregaste la accion "slots" en tu Apps Script (recomendado, ver LEEME),
  // se usa esa. Si no existe, cae a leer la hoja TURNOS completa.
  try {
    const res = await fetch(`${API}?action=slots`);
    const j = await res.json();
    if (j && j.data) return j.data;
  } catch (e) { /* sigue con fallback */ }
  try {
    const res = await fetch(`${API}?action=get&sheet=TURNOS`);
    const j = await res.json();
    return j.data || [];
  } catch (e) { return []; }
}

const normHora = h => String(h || "").slice(0, 5);
const normFecha = f => String(f || "").slice(0, 10);

function genSlots() {
  const out = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    for (let m = 0; m < 60; m += INTERVALO_MIN) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

function genFechas() {
  const out = [];
  const d = new Date();
  for (let i = 0; i < DIAS_ADELANTE; i++) {
    if (!DIAS_CERRADOS.includes(d.getDay())) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({ iso, dia: DIAS[d.getDay()], num: d.getDate(), mes: MESES[d.getMonth()], hoy: i === 0 });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#000;color:#fff;font-family:'Inter',sans-serif;}
  .cinzel{font-family:'Cinzel',serif;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(255,255,255,.1)}50%{text-shadow:0 0 40px rgba(255,255,255,.3)}}
  .fade-up{animation:fadeUp .4s ease both;}
  .glow{animation:glow 4s ease-in-out infinite;}
  @media(prefers-reduced-motion:reduce){.fade-up,.glow{animation:none;}}
  .btn-main{width:100%;padding:13px;background:#fff;color:#000;font-family:'Cinzel',serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;border:none;cursor:pointer;transition:all .3s;}
  .btn-main:hover{background:#e0e0e0;transform:translateY(-1px);}
  .btn-main.dim{opacity:.3;cursor:default;}
  .btn-ghost{width:100%;padding:11px;background:transparent;color:#fff;font-family:'Cinzel',serif;font-size:10px;letter-spacing:.15em;text-transform:uppercase;border:1px solid #2a2a2a;cursor:pointer;transition:all .3s;}
  .btn-ghost:hover{border-color:#fff;}
  .card{background:rgba(5,5,5,0.88);backdrop-filter:blur(10px);border:1px solid #1a1a1a;padding:20px;margin-bottom:10px;animation:fadeUp .4s ease both;position:relative;z-index:1;}
  .card-title{font-family:'Cinzel',serif;font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#555;margin-bottom:14px;}
  .field-lbl{font-size:9px;letter-spacing:.12em;color:#fff;text-transform:uppercase;display:block;margin-bottom:6px;font-family:'Cinzel',serif;opacity:.6;}
  .field{width:100%;background:transparent;border:none;border-bottom:1px solid #2a2a2a;color:#fff;font-size:14px;padding:9px 0;outline:none;font-family:'Inter',sans-serif;display:block;margin-bottom:16px;transition:border-color .3s;}
  .field:focus{border-bottom-color:#fff;}
  .field::placeholder{color:#333;}
  .svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
  .svc-card{border:1px solid #1a1a1a;padding:16px 10px;text-align:center;cursor:pointer;transition:all .3s;}
  .svc-card:hover{border-color:#444;}
  .svc-card.active{border-color:#fff;background:#111;}
  .fecha-strip{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;}
  .fecha-card{border:1px solid #1a1a1a;padding:12px 14px;text-align:center;cursor:pointer;transition:all .25s;flex-shrink:0;min-width:64px;}
  .fecha-card:hover{border-color:#444;}
  .fecha-card.active{border-color:#fff;background:#111;}
  .fecha-card.hoy{border-color:#1a3a2a;}
  .hora-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
  .hora-card{border:1px solid #1a1a1a;padding:11px 4px;text-align:center;cursor:pointer;transition:all .25s;font-family:'Cinzel',serif;font-size:13px;color:#fff;}
  .hora-card:hover{border-color:#444;}
  .hora-card.active{border-color:#fff;background:#111;}
  .hora-card.ocupado{opacity:.22;cursor:default;text-decoration:line-through;}
  .cf-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #111;font-size:12px;}
  .ck{color:#555;font-family:'Cinzel',serif;font-size:9px;letter-spacing:.08em;text-transform:uppercase;}
  .dots{display:flex;gap:8px;justify-content:center;margin:18px 0 20px;}
  .dot{width:6px;height:6px;border-radius:50%;background:#1a1a1a;transition:all .4s;}
  .dot.done{background:#333;}
  .dot.active{background:#fff;}
  @media(max-width:380px){.hora-grid{grid-template-columns:repeat(3,1fr);}}
`;

function injectCSS() {
  if (document.getElementById("ram-css")) return;
  const s = document.createElement("style"); s.id = "ram-css"; s.textContent = css; document.head.appendChild(s);
}

const LogoSVG = () => (
  <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
    <svg viewBox="0 0 800 700" style={{ width: "min(600px,95vw)", opacity: .14 }} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(60,120)">
        <path d="M80,0 C110,-10 140,20 145,60 C150,100 130,140 100,155 C70,170 40,155 25,125 C10,95 15,50 40,25 C55,10 65,5 80,0 Z" fill="none" stroke="#fff" strokeWidth="1.8"/>
        <path d="M80,15 C100,10 120,30 122,60 C124,90 108,118 88,128 C68,138 48,125 38,105 C28,85 35,55 55,38 C65,28 72,18 80,15 Z" fill="none" stroke="#fff" strokeWidth="1.4"/>
        <path d="M80,160 C76,200 70,240 65,290 C62,320 60,350 58,380" fill="none" stroke="#fff" strokeWidth="2"/>
        <path d="M68,240 C45,228 28,235 22,255 C16,275 28,295 50,295 C62,295 72,285 68,265 Z" fill="none" stroke="#fff" strokeWidth="1.3"/>
      </g>
      <g transform="translate(550,120)">
        <path d="M80,0 C110,-10 140,20 145,60 C150,100 130,140 100,155 C70,170 40,155 25,125 C10,95 15,50 40,25 C55,10 65,5 80,0 Z" fill="none" stroke="#fff" strokeWidth="1.8"/>
        <path d="M80,15 C100,10 120,30 122,60 C124,90 108,118 88,128 C68,138 48,125 38,105 C28,85 35,55 55,38 C65,28 72,18 80,15 Z" fill="none" stroke="#fff" strokeWidth="1.4"/>
        <path d="M80,160 C84,200 90,240 95,290 C98,320 100,350 102,380" fill="none" stroke="#fff" strokeWidth="2"/>
        <path d="M92,240 C115,228 132,235 138,255 C144,275 132,295 110,295 C98,295 88,285 92,265 Z" fill="none" stroke="#fff" strokeWidth="1.3"/>
      </g>
      <text x="400" y="260" textAnchor="middle" fontFamily="Georgia,serif" fontSize="180" fontWeight="900" fill="#fff" letterSpacing="20">RAM</text>
      <text x="400" y="320" textAnchor="middle" fontFamily="Georgia,serif" fontSize="30" fill="#fff" letterSpacing="20">HAIR STUDIO</text>
      <line x1="200" y1="342" x2="365" y2="342" stroke="#fff" strokeWidth="1"/>
      <line x1="435" y1="342" x2="600" y2="342" stroke="#fff" strokeWidth="1"/>
      <circle cx="400" cy="342" r="5" fill="#fff"/>
      <circle cx="385" cy="342" r="3" fill="#fff"/>
      <circle cx="415" cy="342" r="3" fill="#fff"/>
    </svg>
  </div>
);

const Logo = () => (
  <div style={{ textAlign: "center", padding: "34px 0 6px", position: "relative", zIndex: 1 }}>
    <div className="cinzel glow" style={{ fontSize: 34, letterSpacing: ".35em", color: "#fff" }}>RAM</div>
    <div className="cinzel" style={{ fontSize: 10, letterSpacing: ".45em", color: "#555", marginTop: 4 }}>HAIR STUDIO</div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
      <div style={{ width: 60, height: 1, background: "#1a1a1a" }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />
      <div style={{ width: 60, height: 1, background: "#1a1a1a" }} />
    </div>
  </div>
);

const PASOS = ["svc", "fecha", "hora", "datos", "confirm"];

export default function App() {
  useEffect(() => { injectCSS(); }, []);

  const [step, setStep] = useState("svc");
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [selSvc, setSelSvc] = useState(null);
  const [selFecha, setSelFecha] = useState(null);
  const [selHora, setSelHora] = useState(null);
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [err, setErr] = useState("");
  const [listo, setListo] = useState(false);

  const fechas = genFechas();
  const slots = genSlots();

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    setTurnos(await fetchTurnos());
    setLoading(false);
  }

  const ocupados = new Set(turnos.map(t => `${normFecha(t.Fecha || t.fecha)}|${normHora(t.Hora || t.hora)}`));
  const esOcupado = (fecha, hora) => ocupados.has(`${fecha}|${hora}`);

  const hoyISO = fechas.length && fechas[0].hoy ? fechas[0].iso : null;
  const ahora = new Date();
  const horaPasada = (fecha, hora) => {
    if (fecha !== hoyISO) return false;
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m <= ahora.getHours() * 60 + ahora.getMinutes();
  };

  async function confirmar() {
    if (enviando) return;
    setErr("");
    setEnviando(true);
    // Re-chequea que el horario siga libre justo antes de agendar
    const frescos = await fetchTurnos();
    const tomado = frescos.some(t => normFecha(t.Fecha || t.fecha) === selFecha && normHora(t.Hora || t.hora) === selHora);
    if (tomado) {
      setTurnos(frescos);
      setErr("Ese horario se acaba de ocupar. Elegi otro, por favor.");
      setStep("hora");
      setSelHora(null);
      setEnviando(false);
      return;
    }
    try {
      await api("addTurno", {
        cliente_nombre: nom.trim(),
        cliente_tel: tel.trim(),
        service: selSvc,
        fecha: selFecha,
        hora: selHora,
        origen: "publico",
      });
      setListo(true);
    } catch (e) {
      setErr("No se pudo agendar el turno. Proba de nuevo en unos segundos.");
    }
    setEnviando(false);
  }

  function reiniciar() {
    setListo(false); setSelSvc(null); setSelFecha(null); setSelHora(null);
    setNom(""); setTel(""); setErr(""); setStep("svc"); cargar();
  }

  const svc = SVCS.find(s => s.id === selSvc);
  const fechaSel = fechas.find(f => f.iso === selFecha);
  const idx = PASOS.indexOf(step);

  return (
    <div style={{ minHeight: "100vh", background: "#000", position: "relative", overflow: "hidden" }}>
      <LogoSVG />
      <Logo />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 50px", position: "relative", zIndex: 1 }}>

        {listo ? (
          <div className="card fade-up" style={{ textAlign: "center", borderColor: "#1a3a2a", marginTop: 24 }}>
            <div className="cinzel" style={{ fontSize: 30, marginBottom: 10 }}>✦</div>
            <div className="cinzel" style={{ fontSize: 12, letterSpacing: ".2em", marginBottom: 16 }}>TURNO CONFIRMADO</div>
            <div className="cf-row"><span className="ck">Servicio</span><span>{svc?.label}</span></div>
            <div className="cf-row"><span className="ck">Dia</span><span>{fechaSel ? `${fechaSel.dia} ${fechaSel.num} ${fechaSel.mes}` : selFecha}</span></div>
            <div className="cf-row"><span className="ck">Hora</span><span>{selHora} hs</span></div>
            <div className="cf-row"><span className="ck">Nombre</span><span>{nom}</span></div>
            <p style={{ fontSize: 11, color: "#555", margin: "18px 0" }}>Te esperamos. Si no podes venir, avisanos con anticipacion.</p>
            <button className="btn-ghost" onClick={reiniciar}>Sacar otro turno</button>
          </div>
        ) : (
          <>
            <p className="cinzel" style={{ textAlign: "center", fontSize: 10, letterSpacing: ".25em", color: "#555", marginTop: 14 }}>RESERVA TU TURNO</p>
            <div className="dots">
              {PASOS.map((p, i) => <div key={p} className={`dot${i < idx ? " done" : ""}${i === idx ? " active" : ""}`} />)}
            </div>

            {err && <div className="card" style={{ borderColor: "#3a1a1a", textAlign: "center" }}><span style={{ fontSize: 12, color: "#ff8a8a" }}>{err}</span></div>}

            {step === "svc" && (
              <div className="card fade-up">
                <div className="card-title">1 — Elegi el servicio</div>
                <div className="svc-grid">
                  {SVCS.map(sv => (
                    <div key={sv.id} className={`svc-card${selSvc === sv.id ? " active" : ""}`} onClick={() => setSelSvc(sv.id)}>
                      <div className="cinzel" style={{ fontSize: 12, marginBottom: 6 }}>{sv.label}</div>
                      <div className="cinzel" style={{ fontSize: 17, color: selSvc === sv.id ? "#fff" : "#444" }}>{fmtP(sv.price)}</div>
                    </div>
                  ))}
                </div>
                <button className={`btn-main${selSvc ? "" : " dim"}`} onClick={() => selSvc && setStep("fecha")}>Continuar</button>
              </div>
            )}

            {step === "fecha" && (
              <div className="card fade-up">
                <div className="card-title">2 — Elegi el dia</div>
                <div className="fecha-strip">
                  {fechas.map(f => (
                    <div key={f.iso} className={`fecha-card${selFecha === f.iso ? " active" : ""}${f.hoy ? " hoy" : ""}`} onClick={() => { setSelFecha(f.iso); setSelHora(null); }}>
                      <div className="cinzel" style={{ fontSize: 8, color: "#555", textTransform: "uppercase", marginBottom: 3 }}>{f.dia}</div>
                      <div className="cinzel" style={{ fontSize: 16 }}>{f.num}</div>
                      <div style={{ fontSize: 8, color: "#555" }}>{f.mes}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep("svc")}>Atras</button>
                  <button className={`btn-main${selFecha ? "" : " dim"}`} style={{ flex: 2 }} onClick={() => selFecha && setStep("hora")}>Continuar</button>
                </div>
              </div>
            )}

            {step === "hora" && (
              <div className="card fade-up">
                <div className="card-title">3 — Elegi la hora</div>
                {loading && <p className="cinzel" style={{ fontSize: 10, color: "#555", letterSpacing: ".15em", marginBottom: 12 }}>Cargando disponibilidad...</p>}
                <div className="hora-grid">
                  {slots.map(h => {
                    const bloqueado = esOcupado(selFecha, h) || horaPasada(selFecha, h);
                    return (
                      <div key={h} className={`hora-card${selHora === h ? " active" : ""}${bloqueado ? " ocupado" : ""}`} onClick={() => !bloqueado && setSelHora(h)}>
                        {h}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep("fecha")}>Atras</button>
                  <button className={`btn-main${selHora ? "" : " dim"}`} style={{ flex: 2 }} onClick={() => selHora && setStep("datos")}>Continuar</button>
                </div>
              </div>
            )}

            {step === "datos" && (
              <div className="card fade-up">
                <div className="card-title">4 — Tus datos</div>
                <span className="field-lbl">Nombre y apellido</span>
                <input className="field" value={nom} onChange={e => setNom(e.target.value)} placeholder="Carlos Lopez" />
                <span className="field-lbl">Telefono</span>
                <input className="field" type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="+54 9 ..." />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep("hora")}>Atras</button>
                  <button className={`btn-main${nom.trim() && tel.trim() ? "" : " dim"}`} style={{ flex: 2 }} onClick={() => nom.trim() && tel.trim() && setStep("confirm")}>Continuar</button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="card fade-up">
                <div className="card-title">5 — Confirmar</div>
                <div className="cf-row"><span className="ck">Servicio</span><span>{svc?.label}</span></div>
                <div className="cf-row"><span className="ck">Precio</span><span>{fmtP(svc?.price)}</span></div>
                <div className="cf-row"><span className="ck">Dia</span><span>{fechaSel ? `${fechaSel.dia} ${fechaSel.num} ${fechaSel.mes}` : selFecha}</span></div>
                <div className="cf-row"><span className="ck">Hora</span><span>{selHora} hs</span></div>
                <div className="cf-row"><span className="ck">Nombre</span><span>{nom}</span></div>
                <div className="cf-row"><span className="ck">Telefono</span><span>{tel}</span></div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep("datos")}>Atras</button>
                  <button className={`btn-main${enviando ? " dim" : ""}`} style={{ flex: 2 }} onClick={confirmar}>
                    {enviando ? "Agendando..." : "Confirmar turno"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
