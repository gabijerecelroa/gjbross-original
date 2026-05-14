const fs = require("fs");

const env = fs.readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((acc, line) => {
    const i = line.indexOf("=");
    if (i > -1) acc[line.slice(0, i)] = line.slice(i + 1);
    return acc;
  }, {});

const TOKEN = env.GITHUB_TOKEN;
const GIST_ID = env.GIST_ID;
const FILE = env.GIST_FILENAME || "guests.json";

const nuevos = [
  ["Lorenza Acosta", 4],
  ["Marlene Leithe", 5],
  ["Maria Morinigo", 5],
  ["Katherina Gómez", 5],
  ["Rodrigo Bobadilla", 5],
  ["Tomas Villa", 6],
  ["Julio Fretes", 9],
  ["Pablito Fretes", 9],
  ["Ruven Franco", 1],
  ["Florencia Santa Cruz", 1],
  ["Luana Martinez", 1],
  ["Candela Fleitas", 1],
  ["Mariana Garcia", 1],
  ["Gonzalo Troche", 1],
  ["Milagros Gomez", 1],
  ["Luciana Martinez", 1],
  ["Melani Barrios", 1],
  ["Melina Paredes", 1],
  ["Shirley Rojas", 1],
  ["Gregori Meza", 11],
  ["Facu Caballero", 6],
  ["Javier Tandil", 9],
  ["Oriana Cazal", 6],
  ["Mai Torres", 10],
  ["Ale Aranda", 10]
];

async function main() {
  if (!TOKEN || !GIST_ID) throw new Error("Falta GITHUB_TOKEN o GIST_ID en .env");

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) throw new Error("No pude leer el Gist: " + await res.text());

  const gist = await res.json();
  const actual = JSON.parse(gist.files[FILE].content || '{"guests":[]}');

  const existentes = new Set(
    actual.guests.map(g => g.name.trim().toLowerCase())
  );

  const creados = [];
  for (const [name, qty] of nuevos) {
    if (existentes.has(name.trim().toLowerCase())) continue;

    creados.push({
      id: crypto.randomUUID(),
      name,
      qty,
      attended: false,
      createdAt: new Date().toISOString()
    });
  }

  actual.guests = [...creados, ...actual.guests];

  const patch = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      files: {
        [FILE]: {
          content: JSON.stringify(actual, null, 2)
        }
      }
    })
  });

  if (!patch.ok) throw new Error("No pude actualizar el Gist: " + await patch.text());

  console.log(`Listo: agregados ${creados.length} invitados.`);
  console.log(`Total personas agregadas: ${creados.reduce((s, g) => s + g.qty, 0)}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
