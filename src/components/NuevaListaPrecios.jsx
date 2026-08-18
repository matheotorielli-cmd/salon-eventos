import { useEffect, useState } from "react"
import { ArrowLeft, CalendarDays, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { auth } from "../firebase"
import { buscarSuperposicionLista, guardarListaPrecios, obtenerListaAnterior, obtenerListaPrecios } from "../services/listasPrecios"

const iso = (fecha) => { const d = new Date(fecha); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
const itemVacio = () => ({ id: crypto.randomUUID(), nombre: "", presentacion: "", costo: "", precio: "", activo: true })
const bebidasComprasJunio = [
  ["Cerveza Heinecken", "", 3540, 8000],
  ["Coca Cola", "1,5 L", 2300, 6000],
  ["Coca Cola sin azúcar", "1,5 L", 2300, 6000],
  ["Fanta", "1,5 L", 2300, 6000],
  ["Schweppes Pomelo", "1,5 L", 2300, 6000],
  ["Sprite", "1,5 L", 2300, 6000],
  ["Bonaqua", "1,5 L", 1320, 3500],
  ["Cerveza Miller", "", 2775, 6799],
  ["Cerveza Santa Fe Pilsen", "", 2391, 5800],
  ["Aquarius Pomelo", "1,5 L", 1903, 5200],
  ["Aquarius Naranja", "1,5 L", 1903, 5200],
  ["Aquarius Pera", "1,5 L", 1903, 5200],
  ["Aquarius Manzana", "1,5 L", 1903, 5200],
  ["Aquarius Limonada", "1,5 L", 1903, 5200]
]

export default function NuevaListaPrecios() {
  const navigate = useNavigate(), { id } = useParams(), hoy = new Date(), fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate())
  const [form, setForm] = useState({ nombre: "", fechaApertura: iso(hoy), fechaCierre: iso(fin), descripcion: "", activa: true, servicios: [itemVacio()], bebidas: [itemVacio()] })
  const [guardando, setGuardando] = useState(false), [cargandoAnterior, setCargandoAnterior] = useState(false), [error, setError] = useState("")
  useEffect(() => { if (id) obtenerListaPrecios(id).then((lista) => lista && setForm({ ...lista, servicios: lista.servicios?.length ? lista.servicios : [itemVacio()], bebidas: lista.bebidas?.length ? lista.bebidas : [itemVacio()] })).catch(() => setError("No se pudo cargar la lista.")) }, [id])
  const cambiar = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }))
  const cambiarItem = (grupo, itemId, campo, valor) => cambiar(grupo, form[grupo].map((item) => item.id === itemId ? { ...item, [campo]: valor } : item))
  const agregar = (grupo) => cambiar(grupo, [...form[grupo], itemVacio()])
  const quitar = (grupo, itemId) => cambiar(grupo, form[grupo].filter((item) => item.id !== itemId))
  const cargarServiciosAnteriores = async () => {
    setError(""); setCargandoAnterior(true)
    try {
      const anterior = await obtenerListaAnterior(id)
      if (!anterior?.servicios?.length) return setError("La lista anterior no tiene cumpleaños ni servicios para copiar.")
      setForm((actual) => ({ ...actual, servicios: anterior.servicios.map((item) => ({ ...item, id:crypto.randomUUID() })) }))
    } catch (loadError) {
      console.error(loadError); setError("No se pudo cargar la lista anterior.")
    } finally { setCargandoAnterior(false) }
  }
  const cargarComprasJunio = () => setForm((actual) => {
    const importadas = new Map(bebidasComprasJunio.map(([nombre, presentacion, costo, precio]) => [`${nombre}|${presentacion}`.toLocaleLowerCase("es"), { nombre, presentacion, costo, precio }]))
    const existentes = actual.bebidas.filter((item) => item.nombre.trim()).map((item) => {
      const importada = importadas.get(`${item.nombre}|${item.presentacion}`.toLocaleLowerCase("es"))
      if (!importada) return item
      importadas.delete(`${item.nombre}|${item.presentacion}`.toLocaleLowerCase("es"))
      return { ...item, ...importada }
    })
    const nuevas = [...importadas.values()].map((item) => ({ id: crypto.randomUUID(), ...item, activo: true }))
    return { ...actual, bebidas: [...existentes, ...nuevas] }
  })

  async function guardar(e) {
    e.preventDefault(); setError("")
    if (!auth.currentUser) return setError("La sesión no está disponible.")
    const normalizar = (items) => items.filter((item) => item.nombre.trim()).map((item) => ({ ...item, nombre: item.nombre.trim(), presentacion: item.presentacion.trim(), costo: Number(item.costo || 0), precio: Number(item.precio || 0) }))
    const servicios = normalizar(form.servicios), bebidas = normalizar(form.bebidas)
    if (form.fechaCierre < form.fechaApertura) return setError("La fecha de cierre no puede ser anterior a la fecha de apertura.")
    if (!servicios.length) return setError("Agregá al menos un servicio o cumpleaños.")
    if ([...servicios, ...bebidas].some((item) => item.precio <= 0)) return setError("Todos los precios deben ser mayores que cero.")
    setGuardando(true)
    try {
      const superpuesta = await buscarSuperposicionLista({ idExcluir: id, fechaApertura: form.fechaApertura, fechaCierre: form.fechaCierre, activa: form.activa })
      if (superpuesta) return setError(`Estas fechas se superponen con ${superpuesta.nombre || "otra lista activa"}.`)
      await guardarListaPrecios({ id, datos: { nombre: form.nombre.trim(), fechaApertura: form.fechaApertura, fechaCierre: form.fechaCierre, descripcion: form.descripcion.trim(), activa: form.activa, servicios, bebidas }, userId: auth.currentUser.uid })
      navigate("/listas-precios")
    }
    catch (saveError) { console.error(saveError); setError("No se pudo guardar la lista de precios.") }
    finally { setGuardando(false) }
  }

  return <div className="price-form-page"><header className="price-form-header"><button type="button" onClick={() => navigate("/listas-precios")}><ArrowLeft size={19}/></button><div><span>CONFIGURACIÓN</span><h1>{id ? "Editar" : "Nueva"} lista de precios</h1></div></header>
    <form onSubmit={guardar} className="price-form-card">
      <label className="price-field"><span>Nombre</span><input value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} placeholder="Ingresá el nombre de la lista" required/></label>
      <section className="price-validity"><div className="price-section-title"><CalendarDays size={19}/><div><strong>Vigencia de la lista de precios</strong><small>Definí desde cuándo y hasta cuándo estará disponible.</small></div></div><div className="price-date-grid"><label className="price-field"><span>Fecha de apertura</span><input type="date" value={form.fechaApertura} onChange={(e) => cambiar("fechaApertura", e.target.value)} required/></label><label className="price-field"><span>Fecha de cierre</span><input type="date" min={form.fechaApertura} value={form.fechaCierre} onChange={(e) => cambiar("fechaCierre", e.target.value)} required/></label></div></section>
      <button type="button" onClick={cargarServiciosAnteriores} disabled={cargandoAnterior}>{cargandoAnterior ? "Cargando..." : "Cargar cumpleaños y servicios de la lista anterior"}</button>
      <EditorItems titulo="Cumpleaños y servicios" grupo="servicios" items={form.servicios} onChange={cambiarItem} onAdd={agregar} onRemove={quitar}/>
      <button type="button" onClick={cargarComprasJunio}>Cargar bebidas de compras Junio</button>
      <EditorItems titulo="Bebidas" grupo="bebidas" items={form.bebidas} onChange={cambiarItem} onAdd={agregar} onRemove={quitar} presentacion/>
      <label className="price-field"><span>Descripción</span><textarea rows="3" value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} placeholder="Podés agregar una descripción"/></label>
      <label className="price-active"><input type="checkbox" checked={form.activa} onChange={(e) => cambiar("activa", e.target.checked)}/><span><strong>Lista activa</strong><small>Podrás deshabilitarla cuando ya no esté vigente.</small></span></label>
      {error && <div className="price-error">{error}</div>}<footer><button type="button" className="price-cancel" onClick={() => navigate("/listas-precios")}>Cancelar</button><button disabled={guardando} type="submit" className="price-submit"><CheckCircle2 size={18}/>{guardando ? "Guardando..." : "Guardar lista"}</button></footer>
    </form></div>
}

function EditorItems({ titulo, grupo, items, onChange, onAdd, onRemove, presentacion }) {
  return <section className="price-items">
    <header><div><strong>{titulo}</strong><small>{presentacion ? "Productos disponibles para vender en el evento." : "Servicios o combos incluidos en esta lista."}</small></div><button type="button" onClick={() => onAdd(grupo)}><Plus size={16}/> Agregar</button></header>
    <div className="price-items-list">{items.map((item) => <div className={`price-item-row${presentacion ? " price-item-row-beverage" : ""}`} key={item.id}>
      <label><span>Nombre</span><input value={item.nombre} onChange={(e) => onChange(grupo,item.id,"nombre",e.target.value)} placeholder={presentacion ? "Ej.: Coca-Cola" : "Ej.: Cumpleaños clásico"}/></label>
      {presentacion && <label><span>Presentación</span><input value={item.presentacion} onChange={(e) => onChange(grupo,item.id,"presentacion",e.target.value)} placeholder="Ej.: 2,25 L"/></label>}
      {presentacion && <label><span>Costo lista</span><input type="number" min="0" value={item.costo ?? ""} onChange={(e) => onChange(grupo,item.id,"costo",e.target.value)} placeholder="$ 0"/></label>}
      <label><span>{presentacion ? "Precio lista" : "Precio"}</span><input type="number" min="1" value={item.precio} onChange={(e) => onChange(grupo,item.id,"precio",e.target.value)} placeholder="$ 0"/></label>
      <button type="button" className="remove" onClick={() => onRemove(grupo,item.id)} title="Quitar"><Trash2 size={17}/></button>
    </div>)}</div>
  </section>
}
