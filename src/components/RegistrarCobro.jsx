import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { observarCuentas } from "../services/cuentas"
import { registrarCobro } from "../services/cobros"
import { observarTiposCobro } from "../services/configuracion"
import { obtenerListaVigente } from "../services/listasPrecios"
import { calcularFinanzasEvento } from "../utils/finanzasEvento"
import { recalcularEventoConLista } from "../utils/vigenciaPrecios"

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

function datosCobroEvento(evento) {
  const tipo = String(evento.tipoEventoNombre || evento.tipoEvento || evento.servicioListaNombre || "evento").trim().toLocaleLowerCase("es")
  const nombre = String(evento.nombreEvento || evento.title || evento.cliente || "Evento").trim()
  const [anio, mes, dia] = String(evento.fecha || "").split("-")
  const fecha = anio && mes && dia ? `${dia}/${mes}/${anio}` : String(evento.fecha || "")
  const horaInicio = formatearHora(evento.hora || evento.horaInicio)
  const horaFin = formatearHora(evento.horaFin)
  const horario = horaInicio && horaFin ? `${horaInicio} hs a ${horaFin} hs` : horaInicio ? `${horaInicio} hs` : ""

  return {
    concepto: `Cobro ${tipo} (${nombre})`,
    descripcion: [fecha, horario].filter(Boolean).join(" · ")
  }
}

function formatearHora(valor) {
  const [hora, minutos] = String(valor || "").split(":")
  if (!hora) return ""
  return minutos === "00" ? String(Number(hora)) : `${Number(hora)}:${minutos}`
}

export default function RegistrarCobro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [evento, setEvento] = useState(null)
  const [cuentas, setCuentas] = useState([])
  const [tiposCobro, setTiposCobro] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [listaVigente, setListaVigente] = useState(null)
  const [eventoRecalculado, setEventoRecalculado] = useState(null)
  const [cargandoPrecios, setCargandoPrecios] = useState(false)
  const [errorPrecios, setErrorPrecios] = useState("")
  const ventaBebidasId = searchParams.get("bebidas") || ""
  const montoBebidas = searchParams.get("monto") || ""
  const [form, setForm] = useState({ cuentaId: "", cuentaId2: "", dividir: false, montoCuenta1: montoBebidas, montosCuentas: {}, descripcion: "", concepto: ventaBebidasId ? "Cobro de bebidas" : "Cobro de evento", fecha: new Date().toISOString().split("T")[0], porcentaje: "", monto: montoBebidas })

  useEffect(() => {
    getDoc(doc(db, "eventos", id)).then((snapshot) => {
      const eventoCargado = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
      setEvento(eventoCargado)
      if (eventoCargado && !ventaBebidasId) setForm((actual) => ({ ...actual, ...datosCobroEvento(eventoCargado) }))
      setCargando(false)
    }).catch(() => { setError("No se pudo cargar el evento."); setCargando(false) })
    return observarCuentas(
      (data) => setCuentas(data.filter((cuenta) => cuenta.activa !== false)),
      () => setError("No se pudieron cargar las cuentas disponibles.")
    )
  }, [id, ventaBebidasId])

  useEffect(() => observarTiposCobro(
    (data) => setTiposCobro(data.filter((tipo) => tipo.activo !== false)),
    () => setError("No se pudieron cargar los tipos de cobro.")
  ), [])

  useEffect(() => {
    if (!evento || !form.fecha) return
    let vigente = true
    Promise.resolve().then(() => {
      if (!vigente) return null
      setCargandoPrecios(true)
      setErrorPrecios("")
      setListaVigente(null)
      setEventoRecalculado(null)
      return obtenerListaVigente(form.fecha)
    }).then((lista) => {
      if (!lista) return
      const recalculado = recalcularEventoConLista(evento, lista)
      if (!vigente) return
      setListaVigente(lista)
      setEventoRecalculado(recalculado)
      if (ventaBebidasId) {
        const venta = (recalculado.ventasBebidas || []).find((item) => item.id === ventaBebidasId)
        const nuevoSaldo = Number(venta?.saldo ?? venta?.total ?? 0)
        setForm((actual) => ({ ...actual, monto: String(nuevoSaldo), montoCuenta1: String(nuevoSaldo), montosCuentas: {} }))
      }
    }).catch((loadError) => {
      if (!vigente) return
      console.error(loadError)
      setListaVigente(null)
      setEventoRecalculado(null)
      if (loadError.message === "sin-lista-vigente") setErrorPrecios("No existe una lista de precios vigente para la fecha del cobro.")
      else if (loadError.message === "listas-vigentes-superpuestas") setErrorPrecios("Hay más de una lista vigente para esta fecha. Corregí las fechas antes de cobrar.")
      else if (loadError.message.startsWith("bebida-sin-precio-vigente:")) setErrorPrecios(`Falta el precio vigente de ${loadError.message.split(":")[1]}.`)
      else if (loadError.message === "servicio-sin-precio-vigente") setErrorPrecios("El servicio del evento no existe en la lista vigente.")
      else if (loadError.message === "precio-vigente-menor-a-lo-cobrado") setErrorPrecios("El precio vigente es menor que el importe ya cobrado. Revisá la lista antes de continuar.")
      else setErrorPrecios("No se pudieron actualizar los precios para el cobro.")
    }).finally(() => { if (vigente) setCargandoPrecios(false) })
    return () => { vigente = false }
  }, [evento, form.fecha, ventaBebidasId])

  const esCobroBebidas = Boolean(ventaBebidasId)
  const eventoCobro = eventoRecalculado || evento || {}
  const finanzas = calcularFinanzasEvento(eventoCobro)
  const ventaBebidas = (eventoCobro.ventasBebidas || []).find((venta) => venta.id === ventaBebidasId)
  const totalCobro = esCobroBebidas ? Number(ventaBebidas?.total || 0) : finanzas.totalServicio
  const cobradoCobro = esCobroBebidas ? Number(ventaBebidas?.cobrado || 0) : finanzas.cobradoServicio
  const saldo = esCobroBebidas ? Number(ventaBebidas?.saldo ?? ventaBebidas?.total ?? 0) : finanzas.saldoServicio
  const montoAplicado = Number(form.monto || 0)
  const tipoCobro = tiposCobro.find((tipo) => tipo.cuentaId === form.cuentaId)
  const tipoCobro2 = tiposCobro.find((tipo) => tipo.cuentaId === form.cuentaId2)
  const montoAplicadoCuenta1 = form.dividir ? Number(form.montoCuenta1 || 0) : montoAplicado
  const montoAplicadoCuenta2 = form.dividir ? montoAplicado - montoAplicadoCuenta1 : 0
  const porcentajeDescuento = esCobroBebidas ? 0 : Number(tipoCobro?.porcentajeDescuento || 0)
  const porcentajeDescuento2 = esCobroBebidas ? 0 : Number(tipoCobro2?.porcentajeDescuento || 0)
  const descuentoCuenta1 = Math.round(montoAplicadoCuenta1 * porcentajeDescuento / 100)
  const descuentoCuenta2 = Math.round(montoAplicadoCuenta2 * porcentajeDescuento2 / 100)
  const descuento = descuentoCuenta1 + descuentoCuenta2
  const montoCuenta1 = montoAplicadoCuenta1 - descuentoCuenta1
  const montoCuenta2 = montoAplicadoCuenta2 - descuentoCuenta2
  const monto = montoCuenta1 + montoCuenta2
  const destinosBebidas = cuentas.map((cuenta) => ({ cuentaId: cuenta.id, monto: Number(form.montosCuentas[cuenta.id] || 0) })).filter((item) => item.monto > 0)
  const totalDistribuido = destinosBebidas.reduce((total, item) => total + item.monto, 0)
  const diferenciaDistribucion = monto - totalDistribuido

  function cambiarPorcentaje(porcentaje) {
    const montoCalculado = porcentaje
      ? (finanzas.totalServicio * Number(porcentaje)) / 100
      : ""
    setForm({ ...form, porcentaje, monto: montoCalculado === "" ? "" : String(Math.round(montoCalculado)) })
  }

  async function cobrar(e) {
    e.preventDefault()
    setError("")
    if (cargandoPrecios) return setError("Esperá a que se actualicen los precios.")
    if (errorPrecios || !listaVigente) return setError(errorPrecios || "No hay una lista de precios vigente.")
    if (!esCobroBebidas && !form.cuentaId) return setError("Seleccioná la cuenta que recibirá el dinero.")
    if (!esCobroBebidas && form.dividir && (!form.cuentaId2 || form.cuentaId2 === form.cuentaId)) return setError("Seleccioná una segunda cuenta diferente.")
    if (esCobroBebidas && !destinosBebidas.length) return setError("Ingresá el monto que recibirá al menos una cuenta.")
    if (esCobroBebidas && totalDistribuido !== monto) return setError("La suma distribuida debe coincidir exactamente con el total de bebidas.")
    if (!Number.isFinite(montoAplicado) || montoAplicado <= 0 || monto <= 0) return setError("Ingresá un monto mayor que cero.")
    if (montoAplicado > saldo) return setError("El cobro no puede superar el saldo pendiente.")
    if (!auth.currentUser) return setError("La sesión no está disponible.")

    setGuardando(true)
    try {
      if (form.dividir && (montoAplicadoCuenta1 <= 0 || montoAplicadoCuenta2 <= 0 || montoCuenta1 <= 0 || montoCuenta2 <= 0)) throw new Error("distribucion-invalida")
      const destinos = esCobroBebidas ? destinosBebidas : form.dividir ? [{ cuentaId: form.cuentaId, monto: montoCuenta1 }, { cuentaId: form.cuentaId2, monto: montoCuenta2 }] : [{ cuentaId: form.cuentaId, monto }]
      const aplicacionesCobro = esCobroBebidas ? [] : [
        {
          cuentaId: form.cuentaId,
          tipoCobroId: tipoCobro?.id || "",
          tipoCobroNombre: tipoCobro?.nombre || cuentas.find((cuenta) => cuenta.id === form.cuentaId)?.nombre || "",
          porcentajeDescuento,
          montoAplicado: montoAplicadoCuenta1,
          descuento: descuentoCuenta1,
          monto: montoCuenta1
        },
        ...(form.dividir ? [{
          cuentaId: form.cuentaId2,
          tipoCobroId: tipoCobro2?.id || "",
          tipoCobroNombre: tipoCobro2?.nombre || cuentas.find((cuenta) => cuenta.id === form.cuentaId2)?.nombre || "",
          porcentajeDescuento: porcentajeDescuento2,
          montoAplicado: montoAplicadoCuenta2,
          descuento: descuentoCuenta2,
          monto: montoCuenta2
        }] : [])
      ]
      await registrarCobro({
        eventoId: id,
        ...form,
        destinos,
        ventaBebidasId,
        listaPreciosId: listaVigente.id,
        monto,
        montoAplicado,
        descuento,
        porcentajeDescuento,
        tipoCobroId: form.dividir ? "" : tipoCobro?.id || "",
        tipoCobroNombre: form.dividir ? aplicacionesCobro.map((item) => item.tipoCobroNombre).join(" + ") : tipoCobro?.nombre || "",
        aplicacionesCobro,
        userId: auth.currentUser.uid
      })
      navigate(`/evento/${id}`)
    } catch (saveError) {
      console.error(saveError)
      const mensajes = { "monto-supera-saldo": "El cobro supera el saldo pendiente.", "monto-supera-bebidas": "El cobro supera el saldo de la venta de bebidas.", "descuento-invalido": "El descuento calculado no es válido.", "descuento-bebidas-no-permitido": "Los descuentos no se aplican a las ventas de bebidas.", "distribucion-invalida": "La distribución entre cuentas no coincide con el total.", "demasiadas-cuentas": "El cobro puede distribuirse entre un máximo de cinco cuentas.", "cuentas-repetidas": "Las cuentas deben ser diferentes.", "cuenta-no-disponible": "La cuenta seleccionada ya no está disponible.", "evento-no-disponible": "El evento ya no está disponible.", "sin-lista-vigente": "La lista de precios dejó de estar vigente. Volvé a abrir el cobro.", "servicio-sin-precio-vigente": "El servicio no tiene un precio en la lista vigente.", "precio-vigente-menor-a-lo-cobrado": "El nuevo precio es menor que lo ya cobrado." }
      setError(mensajes[saveError.message] || "No se pudo registrar el cobro.")
    } finally { setGuardando(false) }
  }

  if (cargando) return <div style={mensaje}>Cargando evento...</div>
  if (!evento) return <div style={mensaje}>Evento no encontrado.</div>

  return (
    <div style={pagina}>
      <button onClick={() => navigate(`/evento/${id}`)} style={volver}>← Volver al evento</button>
      <header style={cabecera}><div><span style={sobreTitulo}>COBRO DE EVENTO</span><h1 style={{ margin: "3px 0 4px" }}>{evento.cliente || evento.title}</h1><span style={{ color: "#e9dcf6" }}>Evento #{id}</span></div></header>

      <section style={resumen}>
        <Dato label={esCobroBebidas ? "Total de bebidas" : "Total del evento"} valor={pesos.format(totalCobro)} />
        <Dato label="Cobrado" valor={pesos.format(cobradoCobro)} />
        <Dato label={esCobroBebidas ? "Saldo de bebidas" : "Saldo del evento"} valor={pesos.format(saldo)} destacado />
      </section>

      {listaVigente && <div style={precioVigenteBox}>Precios actualizados con <strong>{listaVigente.nombre}</strong>, vigente para el {form.fecha.split("-").reverse().join("/")}.</div>}
      {errorPrecios && <div role="alert" style={errorBox}>{errorPrecios}</div>}

      <form onSubmit={cobrar} style={tarjeta}>
        <div style={tituloSeccion}><div><h2 style={{ margin: 0 }}>{esCobroBebidas ? "Cobrar bebidas" : "Registrar pago"}</h2><p style={{ margin: "4px 0 0", color: "#776d83" }}>{esCobroBebidas ? "Distribuí el total entre una o varias cuentas." : "El saldo de la cuenta elegida se actualizará automáticamente."}</p></div></div>
        <div style={grilla}>
          {!esCobroBebidas && <Campo label="Cuenta que recibe el cobro"><select value={form.cuentaId} onChange={(e) => setForm({ ...form, cuentaId: e.target.value, montoCuenta1: "" })} required><option value="">Seleccionar cuenta</option>{cuentas.map((cuenta) => { const configuracion = tiposCobro.find((tipo) => tipo.cuentaId === cuenta.id); return <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}{Number(configuracion?.porcentajeDescuento || 0) > 0 ? ` · ${configuracion.porcentajeDescuento}% de descuento` : ""}</option> })}</select></Campo>}
          {!esCobroBebidas && <Campo label="Porcentaje"><select value={form.porcentaje} onChange={(e) => cambiarPorcentaje(e.target.value)}><option value="">Seleccionar %</option><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option></select></Campo>}
          <Campo label={esCobroBebidas ? "Total de bebidas" : "Importe a cancelar"}><input type="number" min="1" max={saldo} step="1" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value, montoCuenta1: "" })} placeholder="$ 0" required readOnly={esCobroBebidas}/></Campo>
          <Campo label="Fecha"><input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></Campo>
          <Campo label="Concepto"><input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} /></Campo>
          <Campo label="Descripción"><input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalle opcional" /></Campo>
        </div>
        {!esCobroBebidas && montoAplicado > 0 && descuento > 0 && <section style={descuentoBox}><div><span>Importe a cancelar</span><strong>{pesos.format(montoAplicado)}</strong></div><div><span>{form.dividir ? "Descuento según cuentas" : `Descuento (${porcentajeDescuento}%)`}</span><strong>- {pesos.format(descuento)}</strong></div><div style={totalAbonar}><span>Total que abona</span><strong>{pesos.format(monto)}</strong></div></section>}
        {esCobroBebidas ? <section style={cuentasBebidasBox}><div style={cuentasBebidasHead}><strong>Distribución por cuentas</strong><span>Total a distribuir: {pesos.format(monto)}</span></div>{cuentas.map((cuenta) => <label key={cuenta.id} style={cuentaMontoRow}><span>{cuenta.nombre}</span><input type="number" min="0" max={monto} step="1" value={form.montosCuentas[cuenta.id] || ""} onChange={(e) => setForm({ ...form, montosCuentas: { ...form.montosCuentas, [cuenta.id]: e.target.value } })} placeholder="$ 0"/></label>)}<div style={distribucionResumen}><span>Distribuido: <strong>{pesos.format(totalDistribuido)}</strong></span><span style={{color:diferenciaDistribucion===0?"#16865c":"#b45309"}}>{diferenciaDistribucion < 0 ? "Excede" : "Falta asignar"}: <strong>{pesos.format(Math.abs(diferenciaDistribucion))}</strong></span></div></section> : <><label style={dividirLabel}><input type="checkbox" style={{width:20,height:20,accentColor:"#4e2581"}} checked={form.dividir} onChange={(e) => setForm({ ...form, dividir: e.target.checked, montoCuenta1: e.target.checked ? String(Math.round(montoAplicado / 2)) : "", cuentaId2: "" })}/><span>Dividir el cobro entre dos cuentas</span></label>{form.dividir && <div style={divisionBox}><Campo label="Importe a cancelar con la primera cuenta"><input type="number" min="1" max={Math.max(1, montoAplicado - 1)} value={form.montoCuenta1} onChange={(e) => setForm({ ...form, montoCuenta1: e.target.value })}/></Campo><Campo label="Segunda cuenta"><select value={form.cuentaId2} onChange={(e) => setForm({ ...form, cuentaId2: e.target.value })} required><option value="">Seleccionar segunda cuenta</option>{cuentas.filter((cuenta) => cuenta.id !== form.cuentaId).map((cuenta) => { const configuracion = tiposCobro.find((tipo) => tipo.cuentaId === cuenta.id); return <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}{Number(configuracion?.porcentajeDescuento || 0) > 0 ? ` · ${configuracion.porcentajeDescuento}% de descuento` : ""}</option> })}</select></Campo><Dato label="Importe a cancelar con la segunda cuenta" valor={pesos.format(Math.max(0, montoAplicadoCuenta2))}/></div>}</>}
        {montoAplicado > 0 && montoAplicado <= saldo && <div style={preview}>Luego del cobro quedarán pendientes <strong>{pesos.format(saldo - montoAplicado)}</strong>.</div>}
        {error && <div role="alert" style={errorBox}>{error}</div>}
        <div style={acciones}><button type="button" onClick={() => navigate(`/evento/${id}`)} style={cancelar}>Cancelar</button><button disabled={guardando || cargandoPrecios || Boolean(errorPrecios) || saldo <= 0} style={cobrarBtn}>{guardando ? "Registrando..." : cargandoPrecios ? "Actualizando precios..." : "Confirmar cobro"}</button></div>
      </form>
    </div>
  )
}

function Dato({ label, valor, destacado }) { return <div style={{ ...dato, ...(destacado ? datoDestacado : {}) }}><span style={datoLabel}>{label}</span><strong style={{ fontSize: 23 }}>{valor}</strong></div> }
function Campo({ label, children }) { return <label><span style={labelStyle}>{label}</span>{children}</label> }

const pagina = { maxWidth: 1050, margin: "0 auto" }
const volver = { marginBottom: 12, padding: 0, border: 0, background: "transparent", color: "#4e2581", fontWeight: 700, cursor: "pointer", boxShadow: "none" }
const cabecera = { padding: "23px 26px", borderRadius: 18, color: "white", background: "linear-gradient(100deg,#4e2581,#63349a)", boxShadow: "0 14px 30px rgba(78,37,129,.16)" }
const sobreTitulo = { color: "#bfe8ff", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }
const resumen = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, margin: "18px 0" }
const dato = { display: "flex", flexDirection: "column", gap: 6, padding: 17, borderRadius: 14, background: "white", border: "1px solid #e8e1ee", color: "#4e2581" }
const datoDestacado = { background: "#fffbea", borderColor: "#f4d00c", color: "#5c4e00" }
const datoLabel = { color: "#776d83", fontSize: 13, fontWeight: 600 }
const tarjeta = { padding: 25, borderRadius: 17, background: "white", border: "1px solid #e8e1ee", boxShadow: "0 12px 30px rgba(78,37,129,.07)" }
const tituloSeccion = { marginBottom: 22, paddingBottom: 17, borderBottom: "1px solid #eee7f4" }
const grilla = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 20 }
const labelStyle = { display: "block", marginBottom: 8, color: "#4b4058", fontSize: 14, fontWeight: 600 }
const preview = { marginTop: 20, padding: 13, borderRadius: 10, color: "#4e2581", background: "#eee7f7" }
const precioVigenteBox = { margin: "18px 0", padding: 14, borderRadius: 10, color: "#14532d", background: "#ecfdf3", border: "1px solid #bbf7d0" }
const descuentoBox = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 20, padding: 16, borderRadius: 13, color: "#4e2581", background: "#f4fbff", border: "1px solid #bfe8ff" }
const totalAbonar = { paddingLeft: 12, borderLeft: "2px solid #57b6ee" }
const errorBox = { marginTop: 18, padding: 12, borderRadius: 10, background: "#fff1f2", color: "#be123c" }
const acciones = { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }
const cancelar = { padding: "11px 18px", border: 0, borderRadius: 10, color: "#665b71", background: "#eee9f1", cursor: "pointer" }
const cobrarBtn = { padding: "11px 20px", border: 0, borderRadius: 10, color: "white", background: "#4e2581", fontWeight: 700, cursor: "pointer" }
const mensaje = { padding: 35, textAlign: "center", color: "#776d83" }
const dividirLabel = { display: "flex", alignItems: "center", gap: 10, width: "max-content", marginTop: 20, color: "#4e2581", fontWeight: 700, cursor: "pointer" }
const divisionBox = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 15, marginTop: 14, padding: 17, border: "1px solid #d9cfe5", borderRadius: 13, background: "#fbf9fd" }
const cuentasBebidasBox = { marginTop: 20, padding: 18, border: "1px solid #d9cfe5", borderRadius: 14, background: "#fbf9fd" }
const cuentasBebidasHead = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12, color: "#4e2581" }
const cuentaMontoRow = { display: "grid", gridTemplateColumns: "minmax(180px,1fr) minmax(180px,.55fr)", alignItems: "center", gap: 15, padding: "11px 0", borderTop: "1px solid #ece5f1", color: "#4b4058", fontWeight: 700 }
const distribucionResumen = { display: "flex", justifyContent: "flex-end", gap: 25, flexWrap: "wrap", marginTop: 10, paddingTop: 13, borderTop: "2px solid #e2d7e9", color: "#4e2581" }
