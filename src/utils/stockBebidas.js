export function stockIdBebida(nombre, presentacion = "") {
  const texto = `${nombre}|${presentacion}`.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  let hash = 2166136261
  for (let i = 0; i < texto.length; i += 1) hash = Math.imul(hash ^ texto.charCodeAt(i), 16777619)
  return `bebida_${(hash >>> 0).toString(16)}`
}
