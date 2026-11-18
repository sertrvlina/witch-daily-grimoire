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
  const supportPage = await read("bpd-support.html");
  for (const feature of ["id=\"distress\"", "saveSenses", "saveUrge", "Piano personale", "DEAR MAN"]) {
    assert.ok(supportPage.includes(feature), "support page missing " + feature);
  }
  for (const file of ["index.html", "oracle.html", "image-studio.html", "document-studio.html", "life-tools.html", "sound-tools.html", "bpd-support.html"]) {
    const html = await read(file);
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const [, source] of scripts) {
      if (source.trim()) new vm.Script(source, { filename: file });
    }
  }
});

test("health check non esegue inferenze e non consuma Neurons", async () => {
  let calls = 0;
  const env = { AI: { run: async () => { calls++; return {}; } } };
  const response = await worker.fetch(new Request(ENDPOINT + "?test=build"), env);
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.build, "oracle-free-guard-2026-11-18");
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
