export function numeroWhatsApp(telefono) {
  let numero = String(telefono || "").replace(/\D/g, "")
  if (!numero) return ""
  if (numero.startsWith("549")) return numero
  if (numero.startsWith("54")) return `549${numero.slice(2).replace(/^0/, "")}`
  numero = numero.replace(/^0/, "").replace(/^15/, "")
  return `549${numero}`
}

export function enlaceWhatsApp(telefono) {
  const numero = numeroWhatsApp(telefono)
  return numero ? `https://wa.me/${numero}` : ""
}
