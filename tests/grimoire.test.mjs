import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const workerSource = await read("cloudflare-worker.js");
const worker = (await import("data:text/javascript;base64," + Buffer.from(workerSource).toString("base64"))).default;
const ORIGIN = "https://sertrvlina.github.io";
const ENDPOINT = "https://oracle.test/";

function request(body, origin = ORIGIN) {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8", Origin: origin },
    body: JSON.stringify(body),
  });
}

test("Worker e pagine hanno JavaScript sintatticamente valido", async () => {
  await import("data:text/javascript;base64," + Buffer.from(workerSource).toString("base64"));
  const oraclePage = await read("oracle.html");
  assert.ok(oraclePage.includes("https://proud-scene-d65athe-oracle.martinabianco2007.workers.dev"), "Oracle Worker endpoint missing");
  assert.ok(oraclePage.includes("Il Worker è già configurato"), "Oracle must not tell users to configure an already configured Worker");
  assert.ok(!oraclePage.includes("configura il Worker Cloudflare"), "obsolete Oracle setup prompt remains");
  assert.ok(oraclePage.includes("autorizzare l’invio") || oraclePage.includes("autorizza l’invio"), "Oracle consent guidance missing");
  const gardenPage = await read("life-garden.html");
  for (const feature of ["id=\"calendar\"", "id=\"money\"", "id=\"study\"", "id=\"care\"", "id=\"people\"", "id=\"skills\"", "id=\"review\"", "id=\"moon\"", "id=\"library\"", "id=\"atelier\"", "id=\"atlas\"", "id=\"places\"", "id=\"timeline\"", "witchGardenLifeV1", "phaseInfo", "witch-garden-life-v1"]) assert.ok(gardenPage.includes(feature), "life garden missing " + feature);
  const supportPage = await read("bpd-support.html");
  for (const feature of ["id=\"distress\"", "saveSenses", "saveUrge", "piano personale", "DEAR MAN", "id=\"refuge\"", "id=\"lowday\"", "id=\"identity\"", "id=\"letters\"", "id=\"resources\"", "saveLetter", "renderLetters"]) {
    assert.ok(supportPage.includes(feature), "support page missing " + feature);
  }
  for (const file of ["index.html", "oracle.html", "image-studio.html", "document-studio.html", "life-tools.html", "life-garden.html", "sound-tools.html", "bpd-support.html"]) {
    const html = await read(file);
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const [, source] of scripts) {
      if (source.trim()) new vm.Script(source, { filename: file });
    }
  }
});

test("l'aggiornamento di un piano conserva le attività e cambia solo quelle richieste", async () => {
  const oraclePage = await read("oracle.html");
  const start = oraclePage.indexOf("function saveDailyPlanFromReply");
  const end = oraclePage.indexOf("async function send()", start);
  assert.ok(start >= 0 && end > start, "daily plan persistence function not found");
  const source = oraclePage.slice(start, end) + "\nglobalThis.saveDailyPlanFromReply = saveDailyPlanFromReply;";
  const store = new Map();
  let id = 0;
  const context = vm.createContext({
    localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) },
    makeId: () => "test-" + (++id),
    Date,
    console,
  });
  new vm.Script(source).runInContext(context);
  const emit = (items, extra = {}) => "[[LUCILLA_DAILY_PLAN]]" + JSON.stringify({
    date: "2026-11-20", title: "Domani", items, ...extra
  }) + "[[/LUCILLA_DAILY_PLAN]]";
  const item = (title, time) => ({ title, time, duration: 30, category: "benessere" });
  context.saveDailyPlanFromReply(emit([item("Sveglia", "09:00"), item("Colazione", "09:15"), item("Disegno", "11:00")]), "Organizza la giornata");
  const initial = JSON.parse(store.get("lucillaDailyPlansV1"))[0];
  const wakeId = initial.items.find(x => x.title === "Sveglia").id;
  context.saveDailyPlanFromReply(emit([item("Sveglia", "09:00"), item("Disegno", "12:00"), item("Passeggiata", "17:00")]), "Sposta il disegno alle 12 e aggiungi una passeggiata");
  let saved = JSON.parse(store.get("lucillaDailyPlansV1"))[0];
  assert.deepEqual(Array.from(saved.items, x => x.title).sort(), ["Colazione", "Disegno", "Passeggiata", "Sveglia"].sort());
  assert.equal(saved.items.find(x => x.title === "Disegno").time, "12:00");
  assert.equal(saved.items.find(x => x.title === "Sveglia").id, wakeId);
  context.saveDailyPlanFromReply(emit([item("Sveglia", "09:00"), item("Disegno", "12:00")], { mode: "replace" }), "Rifai tutto il programma da capo");
  saved = JSON.parse(store.get("lucillaDailyPlansV1"))[0];
  assert.deepEqual(saved.items.map(x => x.title).sort(), ["Disegno", "Sveglia"].sort());
});

test("health check non esegue inferenze e non consuma Neurons", async () => {
  let calls = 0;
  const env = { AI: { run: async () => { calls++; return {}; } } };
  const response = await worker.fetch(new Request(ENDPOINT + "?test=build"), env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.build, "oracle-planner-fidelity-2026-11-19");
  assert.equal(calls, 0);
});

test("i vecchi indirizzi GET di test non avviano modelli AI", async () => {
  let calls = 0;
  const env = { AI: { run: async () => { calls++; return {}; } } };
  for (const testName of ["chat", "stream", "1"]) {
    const response = await worker.fetch(new Request(ENDPOINT + "?test=" + testName), env);
    assert.equal(response.status, 200);
  }
  assert.equal(calls, 0);
});

test("rifiuta POST da origini non autorizzate", async () => {
  let calls = 0;
  const env = { AI: { run: async () => { calls++; return {}; } } };
  const response = await worker.fetch(request({ message: "ciao" }, "https://example.org"), env);
  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

test("saluto semplice non chiama il modello", async () => {
  let calls = 0;
  const env = { AI: { run: async () => { calls++; return {}; } } };
  const response = await worker.fetch(request({ message: "ciao lucilla" }), env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(data.reply, /Ciaooo/);
  assert.equal(calls, 0);
});

test("creazione da testo invia multipart e restituisce una stima senza riferimenti", async () => {
  let captured;
  const env = { AI: { run: async (model, options) => {
    assert.equal(model, "@cf/black-forest-labs/flux-2-klein-4b");
    const formRequest = new Request("https://unit.test/upload", {
      method: "POST",
      headers: { "Content-Type": options.multipart.contentType },
      body: options.multipart.body,
      duplex: "half",
    });
    captured = await formRequest.formData();
    return { image: "aGVsbG8=" };
  } } };
  const response = await worker.fetch(request({ action: "image_generate", prompt: "Una luna sopra un castello", outputSize: 512 }), env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(captured.get("prompt"), "Una luna sopra un castello");
  assert.equal(captured.get("width"), "512");
  assert.equal(captured.get("input_image_0"), null);
  assert.equal(data.estimatedNeurons, 26.09);
});

test("modifica con due riferimenti invia entrambi i file nel multipart", async () => {
  let captured;
  const env = { AI: { run: async (_model, options) => {
    const formRequest = new Request("https://unit.test/upload", {
      method: "POST",
      headers: { "Content-Type": options.multipart.contentType },
      body: options.multipart.body,
      duplex: "half",
    });
    captured = await formRequest.formData();
    return { image: "aGVsbG8=" };
  } } };
  const tinyImage = "data:image/jpeg;base64,aGVsbG8=";
  const response = await worker.fetch(request({
    action: "image_edit",
    prompt: "Usa il soggetto della prima e lo stile della seconda",
    images: [tinyImage, tinyImage],
    outputSize: 512,
  }), env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.ok(captured.get("input_image_0") instanceof Blob);
  assert.ok(captured.get("input_image_1") instanceof Blob);
  assert.equal(data.inputImages, 2);
  assert.equal(data.estimatedNeurons, 36.81);
});

test("rifiuta più di quattro immagini prima di chiamare AI", async () => {
  let calls = 0;
  const env = { AI: { run: async () => { calls++; return {}; } } };
  const response = await worker.fetch(request({
    action: "image_edit",
    prompt: "Modifica",
    images: ["a", "b", "c", "d", "e"],
  }), env);
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("analisi documento usa il modello solo dopo POST autorizzato", async () => {
  let calls = 0;
  const env = { AI: { run: async () => { calls++; return { response: "Analisi completata." }; } } };
  const response = await worker.fetch(request({
    action: "analyze_document",
    text: "Testo del documento",
    question: "Riassumi",
  }), env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.reply, "Analisi completata.");
  assert.equal(calls, 1);
});

test("quota gratuita esaurita produce un messaggio di stop senza upgrade", async () => {
  const env = { AI: { run: async () => {
    const error = new Error("Daily Neurons quota exceeded");
    error.status = 429;
    throw error;
  } } };
  const response = await worker.fetch(request({
    action: "image_generate",
    prompt: "Una luna sopra un castello",
    outputSize: 512,
  }), env);
  const data = await response.json();
  assert.equal(response.status, 429);
  assert.match(data.error, /quota gratuita/i);
  assert.match(data.error, /nessun upgrade o pagamento/i);
});
