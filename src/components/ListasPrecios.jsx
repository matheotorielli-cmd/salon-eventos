import { useEffect, useState } from "react"
import { Eye, Pencil, Plus, Power } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { cambiarEstadoLista, observarListasPrecios } from "../services/listasPrecios"

const fecha = (valor) => valor ? valor.split("-").reverse().join("/") : "—"

export default function ListasPrecios() {
  const navigate = useNavigate()
  const [listas, setListas] = useState([]), [error, setError] = useState("")
  useEffect(() => observarListasPrecios(setListas, () => setError("No se pudieron cargar las listas de precios.")), [])

  async function alternar(lista) {
    if (!auth.currentUser) return
    try { await cambiarEstadoLista({ id: lista.id, activa: lista.activa === false, userId: auth.currentUser.uid }) }
    catch { setError("No se pudo cambiar el estado de la lista.") }
  }

  return <div className="price-list-page">
    <header className="price-list-header responsive-header"><div><span>CONFIGURACIÓN</span><h1>Listas de precios</h1><p>Organizá precios y vigencias para tus servicios y bebidas.</p></div><button onClick={() => navigate("/listas-precios/nueva")}><Plus size={19}/> Nueva lista de precios</button></header>
    {error && <div className="price-error">{error}</div>}
    <section className="price-list-card"><div className="price-list-scroll"><table>
      <thead><tr><th>Nombre</th><th>Fecha de apertura</th><th>Fecha de vigencia</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>{listas.map((lista) => <tr key={lista.id}><td><strong>{lista.nombre}</strong><small>{lista.servicios?.length || 0} servicios · {lista.bebidas?.length || 0} bebidas</small></td><td>{fecha(lista.fechaApertura)}</td><td>{fecha(lista.fechaCierre)}</td><td>{lista.descripcion || "—"}</td><td><span className={lista.activa === false ? "price-status off" : "price-status"}>{lista.activa === false ? "Inactiva" : "Activa"}</span></td><td><div className="price-row-actions"><button title="Ver" onClick={() => navigate(`/listas-precios/${lista.id}/editar`)}><Eye size={16}/></button><button title="Editar" onClick={() => navigate(`/listas-precios/${lista.id}/editar`)}><Pencil size={16}/></button><button className="danger" title={lista.activa === false ? "Habilitar" : "Deshabilitar"} onClick={() => alternar(lista)}><Power size={16}/></button></div></td></tr>)}
      {!listas.length && <tr><td colSpan="6" className="price-list-empty"><div>✦</div><strong>Todavía no hay listas de precios</strong><span>Creá la primera lista para empezar a organizar tus valores.</span><button onClick={() => navigate("/listas-precios/nueva")}><Plus size={17}/> Crear lista</button></td></tr>}</tbody>
    </table></div></section>
  </div>
}
