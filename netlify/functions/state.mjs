// Cosa si mangia — archivio condiviso della famiglia su Netlify Blobs.
// GET  /api/state            -> tutto lo stato (piatti, menu, spesa) + versione
// GET  /api/state?v=<vers>   -> { unchanged: true } se nessuno ha modificato nulla
// POST /api/state            -> { op: "set" | "delete", path, data }
// Ogni richiesta deve portare l'intestazione x-family-code uguale alla variabile FAMILY_PIN.
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";
import seedPiatti from "./seed-piatti.json";
import seedMenu from "./seed-menu.json";

const MAX_BODY = 200_000;
const MAX_PIATTI = 400;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const digest = (s) => createHash("sha256").update(String(s)).digest();
const sameCode = (given, expected) => timingSafeEqual(digest(given.trim().toLowerCase()), digest(expected.trim().toLowerCase()));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

export default async (req) => {
  const expected = process.env.FAMILY_PIN;
  if (!expected) return json({ error: "setup", message: "Manca la variabile FAMILY_PIN nelle impostazioni del sito Netlify." }, 500);
  if (!sameCode(req.headers.get("x-family-code") || "", expected)) {
    await sleep(600); // rallenta chi prova codici a caso
    return json({ error: "code" }, 401);
  }

  const store = getStore({ name: "cosa-si-mangia", consistency: "strong" });

  let meta = await store.get("meta", { type: "json" });
  if (!meta) {
    // Primo avvio: carica il ricettario e il menu di partenza
    const piatti = {};
    for (const d of seedPiatti) piatti[d.id] = d;
    await store.setJSON("piatti", piatti);
    if (isObj(seedMenu) && seedMenu.slots) await store.setJSON("menu", seedMenu);
    meta = { v: Date.now() };
    await store.setJSON("meta", meta);
  }

  if (req.method === "GET") {
    const v = new URL(req.url).searchParams.get("v");
    if (v && v === String(meta.v)) return json({ v: meta.v, unchanged: true });
    const [piatti, menu, spesa] = await Promise.all([
      store.get("piatti", { type: "json" }),
      store.get("menu", { type: "json" }),
      store.get("spesa", { type: "json" }),
    ]);
    return json({ v: meta.v, piatti: piatti || {}, menu: menu || null, spesa: spesa || null });
  }

  if (req.method === "POST") {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: "too_big" }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "bad_json" }, 400); }
    const { op, path, data } = body || {};

    if (path === "menu/settimana" || path === "spesa/lista") {
      if (op !== "set" || !isObj(data)) return json({ error: "bad_request" }, 400);
      await store.setJSON(path === "menu/settimana" ? "menu" : "spesa", data);
    } else if (typeof path === "string" && /^piatti\/[A-Za-z0-9_-]{1,64}$/.test(path)) {
      const id = path.slice("piatti/".length);
      const piatti = (await store.get("piatti", { type: "json" })) || {};
      if (op === "set" && isObj(data)) piatti[id] = { ...data, id };
      else if (op === "delete") delete piatti[id];
      else return json({ error: "bad_request" }, 400);
      if (Object.keys(piatti).length > MAX_PIATTI) return json({ error: "quota" }, 413);
      await store.setJSON("piatti", piatti);
    } else {
      return json({ error: "bad_path" }, 400);
    }

    const v = Math.max(Date.now(), (meta.v || 0) + 1);
    await store.setJSON("meta", { v });
    return json({ ok: true, v });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/state" };
