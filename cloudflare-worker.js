/**
 * The Oracle - Cloudflare Worker
 * Required binding: Workers AI named AI
 * Model: @cf/zai-org/glm-4.7-flash
 *
 * No chat or memory is persisted or logged by this Worker.
 * The browser sends only data the user explicitly chooses to share.
 */
const ALLOWED_ORIGIN = "*";
const MODEL = "@cf/zai-org/glm-4.7-flash";
const MAX_MESSAGE_CHARS = 12000;
const MAX_MEMORY_CHARS = 6000;

const SYSTEM_PROMPT = `Sei The Oracle, l'assistente personale universale del Witch's Daily Grimoire.
Rispondi in italiano, salvo richiesta esplicita di un'altra lingua. Sei competente in cultura,
studio, organizzazione, creatività, tecnologia, lavoro, benessere, relazioni, ricerca e decisioni pratiche.
Adatta profondità e linguaggio alla persona e al suo livello.

Metodo:
- Comprendi l'obiettivo e rispondi in modo concreto, ordinato e utile.
- Non inventare fatti, fonti, capacità o risultati. Distingui fatti, ipotesi e opinioni.
- Se una risposta dipende da informazioni attuali, segnala che occorre verificarle con fonti aggiornate.
- Spiega i passaggi quando servono; proponi alternative realistiche e chiarisci pro e contro.
- Per salute, diritto, finanza e sicurezza usa prudenza, non formulare diagnosi o garanzie e indica quando serve un professionista.
- Rispetta autonomia, privacy e sensibilità della persona. Non giudicare e non manipolare.
- Non affermare di aver compiuto azioni esterne che non hai realmente eseguito.
- Usa un tono caldo, intelligente, naturale e chiaro. Evita risposte vaghe, ripetitive o inutilmente prolisse.
Il nome evocativo e l'estetica del Grimorio sono una cornice creativa: non presentare credenze esoteriche,
astrologiche o spirituali come fatti scientifici. Puoi esplorarle come tradizioni, simboli o pratiche personali.`;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Vary": "Origin",
    },
  });
}

function extractReply(result) {
  if (typeof result?.response === "string" && result.response.trim()) return result.response.trim();
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  return "";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    if (request.method === "GET") {
      if (new URL(request.url).searchParams.get("test") === "1") {
        if (!env.AI || typeof env.AI.run !== "function") {
          return json({ status: "error", stage: "binding", error: "Workers AI binding AI non disponibile." }, 503);
        }
        try {
          const result = await env.AI.run(MODEL, {
            messages: [
              { role: "system", content: "Rispondi in italiano con una sola frase breve. Non mostrare ragionamenti o passaggi interni." },
              { role: "user", content: "Scrivi soltanto: Il collegamento AI funziona." }
            ],
            max_tokens: 512,
            temperature: 0.2
          });
          const reply = extractReply(result);
          if (!reply) {
            return json({
              status: "error",
              stage: "model_response",
              finish_reason: result?.choices?.[0]?.finish_reason || null,
              message: "Il modello è stato raggiunto ma non ha restituito testo finale. Il test verrà riprovato con un limite maggiore.",
            }, 502);
          }
          return json({ status: "online", service: "The Oracle", aiBinding: true, aiTest: "passed", reply }, 200);
        } catch (error) {
          return json({ status: "error", stage: "workers_ai", message: String(error?.message || error) }, 502);
        }
      }
      return json({
        status: "online",
        service: "The Oracle",
        aiBinding: !!env.AI && typeof env.AI.run === "function",
      }, 200);
    }
    if (request.method !== "POST") return json({ error: "Metodo non consentito. Usa POST." }, 405);
    if (new URL(request.url).searchParams.get("ping") === "1") return json({ status: "ok", stage: "post", message: "La richiesta POST raggiunge il Worker." }, 200);
    if (!env.AI || typeof env.AI.run !== "function") {
      return json({ error: "Binding Workers AI non configurato. Aggiungi il binding AI." }, 503);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 25000) return json({ error: "Richiesta troppo grande." }, 413);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Corpo JSON non valido." }, 400); }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    const memory = typeof body.memory === "string"
      ? body.memory.slice(0, MAX_MEMORY_CHARS)
      : Array.isArray(body.memory)
        ? body.memory.filter(x => typeof x === "string").join("\n").slice(0, MAX_MEMORY_CHARS)
        : "";

    if (!message) return json({ error: "Scrivi un messaggio prima di inviarlo." }, 400);
    if (message.length > MAX_MESSAGE_CHARS) {
      return json({ error: "Il messaggio è troppo lungo. Riducilo e riprova." }, 413);
    }

    const userContent = memory
      ? "Note personali che l'utente ha scelto esplicitamente di condividere per questa richiesta:\n" +
        memory + "\n\nMessaggio dell'utente:\n" + message
      : message;

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        max_tokens: 1024,
        temperature: 0.35,
      });
      const reply = extractReply(result);
      if (!reply) return json({ error: "Il modello è stato raggiunto ma non ha restituito testo finale. Riprova tra poco." }, 502);
      return json({ reply }, 200);
    } catch (error) {
      return json({
        error: "Workers AI non ha completato la richiesta.",
        stage: "workers_ai",
        detail: String(error?.message || error).slice(0, 1200),
      }, 502);
    }
  },
};
