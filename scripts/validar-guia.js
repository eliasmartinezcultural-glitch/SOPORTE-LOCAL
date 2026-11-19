const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();
const fail = (message) => {
  console.error("ERROR:", message);
  process.exitCode = 1;
};
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

for (const file of ["index.html", "styles.css", "datos.js", "app.js"]) {
  if (!fs.existsSync(path.join(root, file))) fail("Falta el archivo obligatorio: " + file);
}
if (process.exitCode) process.exit(1);

const html = read("index.html");
const app = read("app.js");
const dataSource = read("datos.js");
const css = read("styles.css");

for (const file of ["app.js", "datos.js"]) {
  try { new vm.Script(read(file), { filename: file }); }
  catch (error) { fail("Error de sintaxis en " + file + ": " + error.message); }
}

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) fail("Hay IDs HTML duplicados: " + [...new Set(duplicates)].join(", "));

for (const [, asset] of html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)) {
  if (asset.startsWith("http://") || asset.startsWith("https://") || asset.startsWith("//")) continue;
  const localPath = asset.split(/[?#]/)[0];
  if (!fs.existsSync(path.join(root, localPath))) fail("El HTML referencia un archivo inexistente: " + asset);
}

if (/(^|[^a-z])(tel|mailto):/i.test(html + app + dataSource)) {
  fail("Se detectó un enlace tel: o mailto:; los contactos deben permanecer como texto.");
}
if ((html + app + dataSource + css).toLowerCase().includes("javascript:")) {
  fail("Se detectó un protocolo javascript: no permitido.");
}

const marker = "window.CHANAR_CONTACTOS =";
const start = dataSource.indexOf(marker);
if (start < 0) {
  fail("No se encontró window.CHANAR_CONTACTOS en datos.js.");
} else {
  const jsonText = dataSource.slice(start + marker.length).trim().replace(/;\s*$/, "");
  let contacts;
  try { contacts = JSON.parse(jsonText); }
  catch (error) { fail("datos.js no contiene JSON válido: " + error.message); }

  if (Array.isArray(contacts)) {
    if (contacts.length === 0) fail("El directorio no puede publicarse vacío.");
    const seen = new Set();
    const allowedSourceTypes = new Set(["oficial", "agenda", "institucional", "mapa"]);
    for (const [index, item] of contacts.entries()) {
      const label = "Ficha " + (index + 1);
      if (!item.id || !item.nombre || !item.categoria) fail(label + ": faltan id, nombre o categoría.");
      if (seen.has(item.id)) fail("ID de ficha duplicado: " + item.id);
      seen.add(item.id);
      if (!item.fuente || !(item.fuente.startsWith("https://") || item.fuente.startsWith("http://"))) {
        fail(label + ": fuente ausente o URL no segura.");
      }
      if (!allowedSourceTypes.has(item.fuenteTipo)) fail(label + ": fuenteTipo ausente o no reconocido.");
      if (item.telefonos && !Array.isArray(item.telefonos)) fail(label + ": telefonos debe ser una lista.");
    }
    console.log("Fichas verificadas:", contacts.length);
  } else {
    fail("CHANAR_CONTACTOS debe ser una lista.");
  }
}

if (process.exitCode) process.exit(1);
console.log("Validación estática completada correctamente.");
