import { useState, useEffect, useRef } from "react";

const UI_VALUE = 6.5378;
const USD_TO_UYU = 42.5;

function calcularCuotaUI(capitalUI, tasaAnual, años) {
  const n = años * 12;
  const r = tasaAnual / 12;
  return (capitalUI * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
function fmt(n) { return Math.round(n).toLocaleString("es-UY"); }
function formatUYU(n) { return "$" + fmt(n); }
function formatUSD(n) { return "USD " + fmt(n); }

// ── Tooltip component ──────────────────────────────────────────────────────────
function Tip({ children, content }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
      <span
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 14, height: 14, borderRadius: "50%",
          background: open ? "#c8a96e" : "#2a2d3a",
          color: open ? "#0f1117" : "#7c6f5a",
          fontSize: 9, fontWeight: 700, cursor: "pointer",
          border: "1px solid #3a3d4a", flexShrink: 0,
          fontFamily: "monospace", userSelect: "none",
          transition: "all 0.15s",
        }}
        title="Ver cálculo"
      >?</span>
      {open && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#12151f",
          border: "1px solid #c8a96e44",
          borderRadius: 8,
          padding: "10px 14px",
          minWidth: 240, maxWidth: 320,
          zIndex: 9999,
          boxShadow: "0 8px 32px #00000088",
          pointerEvents: "auto",
        }}>
          <span style={{
            position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
            width: 10, height: 10, background: "#12151f",
            border: "1px solid #c8a96e44", borderTop: "none", borderLeft: "none",
            transform: "translateX(-50%) rotate(45deg)",
          }} />
          <div style={{ fontSize: 11, color: "#c8a96e", fontWeight: 700, marginBottom: 6, letterSpacing: "0.05em" }}>
            CÓMO SE CALCULA
          </div>
          <div style={{ fontSize: 11, color: "#b0a898", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
            {content}
          </div>
        </span>
      )}
    </span>
  );
}

// ── Label con tooltip ──────────────────────────────────────────────────────────
function TipLabel({ label, tip, style = {} }) {
  return (
    <Tip content={tip}>
      <span style={{ fontSize: 11, color: "#7c6f5a", ...style }}>{label}</span>
    </Tip>
  );
}

const SCENARIOS = [
  { label: "Optimista",    tasacion: 155000, desc: "Tasación BHU: USD 155k" },
  { label: "Realista",     tasacion: 140000, desc: "Tasación BHU: USD 140k" },
  { label: "Conservador",  tasacion: 125000, desc: "Tasación BHU: USD 125k" },
];

export default function App() {
  const [precioCompra,   setPrecioCompra]   = useState(150000);
  const [capitalPropio,  setCapitalPropio]  = useState(25000);
  const [tasacion,       setTasacion]       = useState(140000);
  const [tea,            setTea]            = useState(0.045);
  const [años,           setAños]           = useState(25);
  const [activeScenario, setActiveScenario] = useState(1);
  const inflacion = 0.07;
  const ingreso   = 150000;

  useEffect(() => { setTasacion(SCENARIOS[activeScenario].tasacion); }, [activeScenario]);

  // ── Cálculos ──
  const maxPrestamoPorTasacion = tasacion * 0.8;
  const prestamoPorCapital     = precioCompra - capitalPropio;
  const prestamo               = Math.min(maxPrestamoPorTasacion, prestamoPorCapital);
  const prestamoCubierto       = prestamoPorCapital <= maxPrestamoPorTasacion;
  const shortfall              = prestamoPorCapital - maxPrestamoPorTasacion;

  const prestamoUI    = (prestamo * USD_TO_UYU) / UI_VALUE;
  const cuotaUI       = calcularCuotaUI(prestamoUI, tea, años);
  const cuotaPrestamo = cuotaUI * UI_VALUE;
  const fpiMensual    = (prestamoUI * 0.35) / 1200 * UI_VALUE;
  const seguroVida    = prestamo * USD_TO_UYU * 0.0004;
  const cuotaTotal    = cuotaPrestamo + fpiMensual + seguroVida;
  const pctIngreso    = (cuotaTotal / ingreso) * 100;

  const totalPagadoUI      = cuotaUI * 12 * años;
  const totalPagadoUSD     = (totalPagadoUI * UI_VALUE) / USD_TO_UYU;
  const totalConCapital    = totalPagadoUSD + capitalPropio;
  const totalInteresesUSD  = totalPagadoUSD - prestamo;
  const totalFPI           = (fpiMensual * 12 * años) / USD_TO_UYU;
  const costoTotalReal     = totalConCapital + totalFPI;
  const multiplicador      = (costoTotalReal / precioCompra).toFixed(2);

  const tablaAnual = Array.from({ length: años }, (_, i) => {
    const anio = i + 1;
    const cuotaEnPesos     = cuotaTotal * Math.pow(1 + inflacion, i);
    const ingresoProyect   = ingreso * Math.pow(1 + inflacion, i);
    const pctIng           = (cuotaEnPesos / ingresoProyect) * 100;
    const n                = años * 12;
    const r                = tea / 12;
    const mesesPagados     = i * 12;
    const saldoUI          = prestamoUI * (Math.pow(1 + r, n) - Math.pow(1 + r, mesesPagados)) / (Math.pow(1 + r, n) - 1);
    const saldoUSD         = (saldoUI * UI_VALUE) / USD_TO_UYU;
    return { anio, cuotaEnPesos, pctIng, saldoUSD };
  });

  const card = (extra = {}) => ({
    background: "#1a1d26", borderRadius: 10, padding: "20px 24px",
    marginBottom: 20, border: "1px solid #2a2d36", ...extra,
  });

  // ── Tooltips content ──
  const T = {
    maxPorTasacion: `Tasación × 80%\n${formatUSD(tasacion)} × 0.80 = ${formatUSD(maxPrestamoPorTasacion)}\n\nEl BHU financia hasta el 80% del\nvalor de tasación (no del precio\nde compra).`,

    prestamo: `min(precio − capital, tasación × 80%)\nmin(${formatUSD(prestamoPorCapital)}, ${formatUSD(maxPrestamoPorTasacion)})\n= ${formatUSD(prestamo)}\n\nSe toma el menor entre lo que\nnecesitás y lo que el BHU puede dar.`,

    prestamoUI: `Préstamo en pesos ÷ valor UI\n(${formatUSD(prestamo)} × ${USD_TO_UYU}) ÷ ${UI_VALUE}\n= ${fmt(prestamoUI)} UI\n\nConvierte el préstamo en USD a\nUnidades Indexadas para el cálculo\nde cuotas del BHU.`,

    cuotaPrestamo: `Fórmula cuota francesa (sistema francés)\nC = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)\n\nP = ${fmt(prestamoUI)} UI\nr = ${(tea/12*100).toFixed(4)}% (TEA ${(tea*100).toFixed(2)}% ÷ 12)\nn = ${años * 12} cuotas\n\nCuota = ${fmt(cuotaUI)} UI/mes\n× ${UI_VALUE} (valor UI hoy)\n= ${formatUYU(cuotaPrestamo)}`,

    fpi: `Fórmula oficial BHU (ES.CRE.03):\nFPI = préstamo UI × 0.35 ÷ 1200\n\n${fmt(prestamoUI)} × 0.35 ÷ 1200\n= ${fmt(prestamoUI * 0.35 / 1200)} UI/mes\n× ${UI_VALUE} = ${formatUYU(fpiMensual)}\n\nFinancia reparaciones si el bien\nes dañado por eventos externos.`,

    seguro: `Estimación propia (no oficial)\n0.04% mensual sobre el préstamo\n\n${formatUSD(prestamo)} × ${USD_TO_UYU} × 0.0004\n= ${formatUYU(seguroVida)}/mes\n\n⚠ El costo real lo determina el BSE\nsegún monto, plazo y salud del titular.\nConfirmar al solicitar la preaprobación.`,

    cuotaTotal: `Suma de los tres componentes:\n\nPréstamo:  ${formatUYU(cuotaPrestamo)}\nFPI:       ${formatUYU(fpiMensual)}\nSeguro:    ${formatUYU(seguroVida)}\n──────────────────\nTotal:     ${formatUYU(cuotaTotal)}`,

    pctIngreso: `Cuota total ÷ ingreso mensual\n${formatUYU(cuotaTotal)} ÷ $${fmt(ingreso)}\n= ${pctIngreso.toFixed(1)}%\n\nEl BHU permite hasta 35% del\ningreso disponible. Por encima\nde 28% se considera ajustado.`,

    totalPagado: `Cuota en UI × 12 meses × ${años} años\n× valor UI actual\n\n${fmt(cuotaUI)} UI × ${años * 12} cuotas\n= ${fmt(totalPagadoUI)} UI total\n× ${UI_VALUE} ÷ ${USD_TO_UYU}\n= ${formatUSD(totalPagadoUSD)}\n\nValores constantes en UI (hoy).`,

    intereses: `Total pagado − capital prestado\n${formatUSD(totalPagadoUSD)} − ${formatUSD(prestamo)}\n= ${formatUSD(totalInteresesUSD)}\n\nEs lo que le pagás al BHU en\nconcepto de intereses a lo largo\nde los ${años} años del préstamo.`,

    totalFPI: `FPI mensual × 12 × ${años} años ÷ tipo cambio\n${formatUYU(fpiMensual)} × ${años * 12} meses\n÷ ${USD_TO_UYU}\n= ${formatUSD(totalFPI)}`,

    costoTotal: `Capital + cuotas totales + FPI\n\n${formatUSD(capitalPropio)}\n+ ${formatUSD(totalPagadoUSD)}\n+ ${formatUSD(totalFPI)}\n= ${formatUSD(costoTotalReal)}\n\n${multiplicador}× el precio de compra.\nNo incluye seguro de vida ni\ngastos de escritura/ITP.`,

    multiplicador: `Costo total ÷ precio de compra\n${formatUSD(costoTotalReal)} ÷ ${formatUSD(precioCompra)}\n= ${multiplicador}×\n\nPor cada USD que vale el dpto hoy,\nterminás pagando ${multiplicador} USD en total.`,

    cuotaTabla: (anio, cuota) => `Cuota hoy × (1 + inflación)^(año−1)\n${formatUYU(cuotaTotal)} × (1.07)^${anio - 1}\n= ${formatUYU(cuota)}\n\nLa cuota en UI es fija. En pesos\nsube porque la UI sigue la inflación.`,

    pctTabla: (anio, pct) => `Cuota año ${anio} ÷ ingreso año ${anio}\n\nIngreso proyectado:\n$${fmt(ingreso)} × (1.07)^${anio-1} = $${fmt(ingreso * Math.pow(1.07, anio-1))}\n\nPorcentaje: ${pct.toFixed(1)}%\n\nSe asume que tus ingresos también\ncrecen con la inflación del 7%.`,

    saldoTabla: (anio, saldo) => {
      const meses = (anio - 1) * 12;
      return `Saldo usando fórmula de amortización\nfrancesa al inicio del año ${anio}:\n\nP × [(1+r)ⁿ − (1+r)^m] / [(1+r)ⁿ − 1]\n\nP = ${fmt(prestamoUI)} UI\nr = TEA/12\nm = ${meses} meses pagados\n\nSaldo: ${formatUSD(saldo)}\n\nEn valores constantes de UI (hoy).`;
    },

    tramiteTotal: `Suma de aranceles BHU:\n\nPreaprobación: 2.500 UI\nTasación:      2.500 UI\nSolicitud:     3.700 UI\nEscribano:     hasta 2.562% del préstamo\n\nPreaprobación y tasación se\ndescontarán del arancel de solicitud\nsi presentás la solicitud en 90 días.`,
  };

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#0f1117", minHeight: "100vh", color: "#e8e4d9",
      padding: "32px 24px", maxWidth: 780, margin: "0 auto",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#7c6f5a", textTransform: "uppercase", marginBottom: 8 }}>
          Simulador Préstamo Hipotecario
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0, color: "#f0ead8", lineHeight: 1.2 }}>BHU · Podés Comprar</h1>
        <div style={{ fontSize: 12, color: "#7c6f5a", marginTop: 6 }}>
          UI hoy: ${UI_VALUE} · USD/UYU: ${USD_TO_UYU} · Tocá <span style={{ background: "#2a2d3a", borderRadius: 3, padding: "1px 5px", fontFamily: "monospace" }}>?</span> en cualquier valor para ver el cálculo
        </div>
      </div>

      {/* Escenarios */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7c6f5a", marginBottom: 10, textTransform: "uppercase" }}>
          Escenario de tasación BHU
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {SCENARIOS.map((s, i) => (
            <button key={i} onClick={() => setActiveScenario(i)} style={{
              flex: 1, padding: "10px 8px",
              background: activeScenario === i ? "#c8a96e" : "#1a1d26",
              color: activeScenario === i ? "#0f1117" : "#9a8f7a",
              border: activeScenario === i ? "none" : "1px solid #2a2d36",
              borderRadius: 6, cursor: "pointer", fontSize: 12,
              fontFamily: "inherit", fontWeight: activeScenario === i ? 700 : 400,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Parámetros */}
      <div style={card()}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7c6f5a", marginBottom: 16, textTransform: "uppercase" }}>Parámetros</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
          {[
            { label: "Precio de compra (USD)", val: precioCompra, set: setPrecioCompra, min: 80000, max: 200000, step: 1000 },
            { label: "Capital propio (USD)",   val: capitalPropio, set: setCapitalPropio, min: 10000, max: 60000, step: 1000 },
            { label: "Tasación estimada (USD)",val: tasacion,      set: setTasacion,      min: 100000, max: 180000, step: 1000 },
            { label: "TEA (%)",                val: tea * 100,     set: v => setTea(v/100), min: 3.75, max: 7, step: 0.25 },
          ].map(({ label, val, set, min, max, step }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: "#7c6f5a", marginBottom: 4 }}>{label}</div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#c8a96e", marginBottom: 2 }} />
              <div style={{ fontSize: 13, color: "#f0ead8", fontWeight: 600 }}>
                {label.includes("TEA") ? val.toFixed(2) + "%" : formatUSD(val)}
              </div>
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 11, color: "#7c6f5a", marginBottom: 6 }}>Plazo</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[15, 20, 25].map(y => (
                <button key={y} onClick={() => setAños(y)} style={{
                  flex: 1, padding: "8px 0",
                  background: años === y ? "#c8a96e" : "#0f1117",
                  color: años === y ? "#0f1117" : "#9a8f7a",
                  border: años === y ? "none" : "1px solid #2a2d36",
                  borderRadius: 6, cursor: "pointer",
                  fontSize: 13, fontFamily: "inherit", fontWeight: años === y ? 700 : 400,
                }}>{y} años</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alert shortfall */}
      {!prestamoCubierto && (
        <div style={{ background: "#2a1a0f", border: "1px solid #8b4513", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#f4a460" }}>
          ⚠️ <strong>Atención:</strong> El BHU solo financia hasta el 80% de la tasación ({formatUSD(maxPrestamoPorTasacion)}). Con tu capital propio necesitarías cubrir {formatUSD(shortfall)} adicionales.
        </div>
      )}

      {/* Préstamo resultante */}
      <div style={card()}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7c6f5a", marginBottom: 16, textTransform: "uppercase" }}>Préstamo resultante</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Préstamo total",          val: formatUSD(prestamo),               tip: T.prestamo,       highlight: true },
            { label: "En UI (al inicio)",        val: fmt(prestamoUI) + " UI",           tip: T.prestamoUI },
            { label: "Máx. por tasación (80%)",  val: formatUSD(maxPrestamoPorTasacion), tip: T.maxPorTasacion, ok: prestamoCubierto },
            { label: "Capital que aportás",      val: formatUSD(capitalPropio),          tip: `Lo que ponés vos de tu bolsillo.\nPrecio − Préstamo BHU\n${formatUSD(precioCompra)} − ${formatUSD(prestamo)} = ${formatUSD(capitalPropio)}` },
          ].map(({ label, val, tip, highlight, ok }) => (
            <div key={label} style={{
              background: highlight ? "#c8a96e18" : "#0f1117",
              borderRadius: 8, padding: "12px 14px",
              border: highlight ? "1px solid #c8a96e44" : "1px solid #2a2d36",
            }}>
              <div style={{ marginBottom: 6 }}>
                <TipLabel label={label} tip={tip} />
              </div>
              <div style={{
                fontSize: highlight ? 18 : 15, fontWeight: 600,
                color: ok === false ? "#e07070" : ok === true ? "#7ec8a0" : highlight ? "#c8a96e" : "#e8e4d9",
              }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cuota desglosada */}
      <div style={card()}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7c6f5a", marginBottom: 16, textTransform: "uppercase" }}>Cuota mensual desglosada (en pesos hoy)</div>
        {[
          { label: "Préstamo (amortización + intereses)", val: cuotaPrestamo, color: "#c8a96e", tip: T.cuotaPrestamo },
          { label: "FPI (Fondo Protección Inmueble)",     val: fpiMensual,    color: "#8bb4c8", tip: T.fpi },
          { label: "Seguro de vida BSE (estimado)",       val: seguroVida,    color: "#b4c88b", tip: T.seguro },
        ].map(({ label, val, color, tip }) => {
          const pct = Math.round((val / cuotaTotal) * 100);
          return (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <TipLabel label={label} tip={tip} />
                <span style={{ fontSize: 13, fontWeight: 600, color }}>{formatUYU(val)}</span>
              </div>
              <div style={{ background: "#0f1117", borderRadius: 3, height: 5, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
        <div style={{ borderTop: "1px solid #2a2d36", paddingTop: 14, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tip content={T.cuotaTotal}>
            <span style={{ fontSize: 13, color: "#e8e4d9" }}>TOTAL mensual</span>
          </Tip>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#f0ead8" }}>{formatUYU(cuotaTotal)}</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <TipLabel label="% de tu ingreso mensual ($150k)" tip={T.pctIngreso} />
            <span style={{ fontSize: 13, fontWeight: 600, color: pctIngreso > 35 ? "#e07070" : pctIngreso > 28 ? "#e8c46a" : "#7ec8a0" }}>
              {pctIngreso.toFixed(1)}%
            </span>
          </div>
          <div style={{ background: "#0f1117", borderRadius: 3, height: 8, overflow: "hidden", position: "relative" }}>
            <div style={{ width: Math.min(pctIngreso, 100) + "%", height: "100%", background: pctIngreso > 35 ? "#e07070" : pctIngreso > 28 ? "#e8c46a" : "#7ec8a0", borderRadius: 3, transition: "width 0.3s" }} />
            <div style={{ position: "absolute", top: 0, left: "35%", width: 1, height: "100%", background: "#e07070", opacity: 0.5 }} />
          </div>
          <div style={{ fontSize: 10, color: "#7c6f5a", marginTop: 3 }}>Límite BHU: 35% · Verde &lt;28% · Amarillo 28–35%</div>
        </div>
      </div>

      {/* Tabla año a año */}
      <div style={card()}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7c6f5a", marginBottom: 4, textTransform: "uppercase" }}>Proyección año a año</div>
        <div style={{ fontSize: 11, color: "#5a5040", marginBottom: 14 }}>
          Cuota en pesos crece con inflación (7% anual) · % de ingreso asume que tus ingresos crecen al mismo ritmo
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 80px 110px", gap: 6, padding: "6px 8px 8px", borderBottom: "1px solid #2a2d36" }}>
          {["Año", "Cuota mensual", "% ingreso", "Saldo deuda"].map((h, idx) => (
            <div key={h} style={{ fontSize: 10, color: "#5a5040", textAlign: idx === 0 ? "left" : "right", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: 440, overflowY: "auto" }}>
          {tablaAnual.map(({ anio, cuotaEnPesos, pctIng, saldoUSD }) => {
            const esHito = anio % 5 === 0 || anio === 1 || anio === años;
            return (
              <div key={anio} style={{
                display: "grid", gridTemplateColumns: "36px 1fr 80px 110px",
                gap: 6, padding: "5px 8px",
                background: esHito ? "#c8a96e0d" : anio % 2 === 0 ? "#0f111766" : "transparent",
                borderRadius: 4,
                borderLeft: esHito ? "2px solid #c8a96e55" : "2px solid transparent",
              }}>
                <div style={{ fontSize: 12, color: esHito ? "#c8a96e" : "#5a5040", fontWeight: esHito ? 700 : 400 }}>{anio}</div>
                <div style={{ fontSize: 12, color: "#e8e4d9", textAlign: "right", fontWeight: esHito ? 600 : 400 }}>
                  <Tip content={T.cuotaTabla(anio, cuotaEnPesos)}>
                    <span>{formatUYU(cuotaEnPesos)}</span>
                  </Tip>
                </div>
                <div style={{ fontSize: 12, textAlign: "right", fontWeight: esHito ? 600 : 400, color: pctIng > 35 ? "#e07070" : pctIng > 28 ? "#e8c46a" : "#7ec8a0" }}>
                  <Tip content={T.pctTabla(anio, pctIng)}>
                    <span>{pctIng.toFixed(1)}%</span>
                  </Tip>
                </div>
                <div style={{ fontSize: 12, color: "#8bb4c8", textAlign: "right", fontWeight: esHito ? 600 : 400 }}>
                  <Tip content={T.saldoTabla(anio, saldoUSD)}>
                    <span>{formatUSD(saldoUSD)}</span>
                  </Tip>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: "#5a5040", marginTop: 10 }}>
          Filas resaltadas: año 1, cada 5 años y año final · Saldo en USD valores constantes de hoy
        </div>
      </div>

      {/* Costo total */}
      <div style={card({ border: "1px solid #c8a96e44" })}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7c6f5a", marginBottom: 4, textTransform: "uppercase" }}>¿Cuánto terminás pagando en total?</div>
        <div style={{ fontSize: 11, color: "#5a5040", marginBottom: 16 }}>Todo expresado en USD de hoy (valores constantes en UI)</div>
        {[
          { label: "Capital propio aportado",                      val: formatUSD(capitalPropio),    color: "#e8e4d9", tip: `Lo que aportás al momento de comprar.\nNo incluye gastos de escritura.` },
          { label: `Total cuotas del préstamo (${años*12} cuotas)`,val: formatUSD(totalPagadoUSD),  color: "#e8e4d9", tip: T.totalPagado },
          { label: "  → de los cuales son intereses",              val: formatUSD(totalInteresesUSD),color: "#e07070", tip: T.intereses },
          { label: "FPI acumulado",                                val: formatUSD(totalFPI),         color: "#8bb4c8", tip: T.totalFPI },
        ].map(({ label, val, color, tip }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1e2130" }}>
            <TipLabel label={label} tip={tip} />
            <span style={{ fontSize: 13, fontWeight: 600, color }}>{val}</span>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "14px 16px", background: "#c8a96e18", borderRadius: 8, border: "1px solid #c8a96e44", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Tip content={T.costoTotal}>
              <span style={{ fontSize: 11, color: "#7c6f5a", fontWeight: 700, letterSpacing: "0.05em" }}>COSTO TOTAL DEL APARTAMENTO</span>
            </Tip>
            <div style={{ fontSize: 10, color: "#5a5040", marginTop: 3 }}>Capital + cuotas + FPI (sin seguro ni gastos de compra)</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#c8a96e" }}>{formatUSD(costoTotalReal)}</div>
            <Tip content={T.multiplicador}>
              <span style={{ fontSize: 11, color: "#7c6f5a", marginTop: 2 }}>{multiplicador}× el precio de compra</span>
            </Tip>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#5a5040", marginTop: 10 }}>* No incluye seguro de vida BSE ni gastos de escritura/ITP/escribano.</div>
      </div>

      {/* Costos del trámite */}
      <div style={card()}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#7c6f5a", marginBottom: 14, textTransform: "uppercase" }}>Costos del trámite BHU (aprox.)</div>
        {[
          { item: "Preaprobación sujeto de crédito", ui: 2500,  tip: `Costo: 2.500 UI × ${UI_VALUE} = ${formatUYU(2500 * UI_VALUE)}\n\nSe descuenta del arancel de solicitud\nsi presentás la solicitud en los\nproximos 90 días.` },
          { item: "Tasación del inmueble",           ui: 2500,  tip: `Costo: 2.500 UI × ${UI_VALUE} = ${formatUYU(2500 * UI_VALUE)}\n\nIgual que la preaprobación, se\ndescuenta del arancel si avanzás\nen los próximos 90 días.` },
          { item: "Arancel ingreso de solicitud",    ui: 3700,  tip: `Costo: 3.700 UI × ${UI_VALUE} = ${formatUYU(3700 * UI_VALUE)}\n\nSe cobra al presentar la solicitud\nformal de préstamo en el BHU.` },
          { item: "Honorarios escribano (hipoteca, máx. 2.562%)", ui: null, usd: prestamo * 0.02562,
            tip: `Hasta 2.562% del total del préstamo\n${formatUSD(prestamo)} × 2.562%\n= ${formatUSD(prestamo * 0.02562)}\n\nSe retiene del préstamo el día\nde la escritura. Mínimo 14.64 UR.` },
        ].map(({ item, ui, usd, tip }) => {
          const displayVal = ui ? `${ui.toLocaleString()} UI ≈ ${formatUYU(ui * UI_VALUE)}` : `≈ ${formatUSD(usd)}`;
          return (
            <div key={item} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #2a2d36", alignItems: "center" }}>
              <TipLabel label={item} tip={tip} style={{ fontSize: 12, color: "#9a8f7a" }} />
              <span style={{ fontSize: 12, color: "#c8a96e", marginLeft: 12, textAlign: "right", flexShrink: 0 }}>{displayVal}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 2, alignItems: "center" }}>
          <Tip content={T.tramiteTotal}>
            <span style={{ fontSize: 12, color: "#e8e4d9", fontWeight: 600 }}>Total trámite BHU (aprox.)</span>
          </Tip>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#c8a96e" }}>
            {formatUSD((2500 + 2500 + 3700) * UI_VALUE / USD_TO_UYU + prestamo * 0.02562)}
          </span>
        </div>
        <div style={{ fontSize: 10, color: "#5a5040", marginTop: 8 }}>
          Preaprobación y tasación se descuentan del arancel si avanzás dentro de 90 días · Seguro de vida BSE se paga al escriturar
        </div>
      </div>

    </div>
  );
}
