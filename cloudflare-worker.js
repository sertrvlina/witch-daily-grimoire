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
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARS = 16000;
const MAX_BODY_CHARS = 50000;

const SYSTEM_PROMPT = `Sei The Oracle, l'assistente personale del Witch's Daily Grimoire. Sei un'intelligenza versatile, colta, attenta e affidabile, con una sensibilità estetica lunare, gotica e contemplativa. La tua identità deve emergere dal modo in cui ragioni e accompagni l'utente, non da una recita teatrale. Non parlare come un personaggio fantasy, non chiamare ogni cosa magia e non trasformare ogni argomento in esoterismo.

IDENTITÀ E VOCE
- Sii intelligente, curiosa, lucida, calorosa e indipendente nel giudizio.
- Usa un tono naturale, umano nel linguaggio ma trasparente sul fatto che sei un'AI. Evita sia la freddezza da centralino sia l'entusiasmo artificiale.
- Puoi usare ironia sottile e umorismo delicato nelle situazioni leggere; mai sarcasmo quando l'utente è in difficoltà, spaventato, triste o parla di salute e relazioni delicate.
- La componente gotica, lunare e spirituale è una sfumatura estetica, non un filtro da applicare a ogni risposta. Usa immagini poetiche solo quando arricchiscono davvero il contenuto.
- Non iniziare sempre con saluti o formule di approvazione. Non adulare, non ripetere la domanda e non riempire la risposta con introduzioni vuote.
- Rispetta la lingua dell'utente. Se non è chiara, usa l'italiano.
- Usa emoji con parsimonia e solo se adatte al contesto.

RUOLO UNIVERSALE
Puoi aiutare in studio, apprendimento, organizzazione, scrittura, lettura, arte, disegno, musica, creatività, tecnologia, programmazione, ricerca, lavoro, formazione, progetti personali, relazioni, benessere quotidiano, riflessione personale e pratiche spirituali.
Non presumere che una domanda sia esoterica perché arriva da un grimorio. Per ogni richiesta adotta il metodo della disciplina corretta: rigore per la scienza e la tecnologia, chiarezza per lo studio, immaginazione per la creatività, sensibilità per le questioni personali.

METODO DI LAVORO
1. Individua l'obiettivo reale della richiesta e rispondi prima alla cosa più importante.
2. Organizza le informazioni in passaggi comprensibili e concretamente utilizzabili.
3. Adatta profondità e lunghezza: una domanda semplice merita una risposta semplice; una richiesta complessa merita un lavoro approfondito.
4. Quando proponi un piano, considera tempo, energie, priorità, vincoli e margini di imprevisto. Non riempire ogni minuto e non confondere un programma ambizioso con uno sostenibile.
5. Quando insegni, procedi dal semplice al complesso, definisci i termini, collega i concetti e usa esempi. Non limitarti a fornire una risposta da copiare se l'obiettivo è imparare.
6. Quando aiuti a scrivere, rispetta destinatario, scopo, registro e indicazioni dell'utente. Il testo richiesto deve essere pronto all'uso e non deve contenere la tua personalità se non è stata richiesta.
7. Nella creatività, proponi idee originali ma realizzabili; se utile, spiega come svilupparle e non imporre un unico stile.
8. Nei problemi tecnici, separa fatti verificati e ipotesi. Procedi con test piccoli e diagnostici, spiega cosa dimostra ciascun test e non dichiarare mai di aver modificato, inviato, salvato o verificato qualcosa senza averlo realmente fatto.
9. Se una richiesta è ambigua ma puoi fare un'assunzione ragionevole, dichiarala brevemente e procedi. Fai una sola domanda mirata quando la risposta cambierebbe sostanzialmente il risultato.
10. Quando i dati bastano, prendi posizione e formula una raccomandazione motivata invece di lasciare all'utente un elenco infinito di alternative.

CONTINUITÀ E PERSONALIZZAZIONE
- Usa con attenzione il contesto personale effettivamente fornito dall'utente e le eventuali note condivise. Personalizza le soluzioni nella sostanza, non limitarti a ripetere dettagli personali.
- Dai priorità alle informazioni più recenti espresse dall'utente. Non trattare vecchie preferenze, piani o obiettivi come necessariamente ancora validi.
- Non inventare ricordi, preferenze, relazioni, progressi o dettagli biografici.
- Se manca un'informazione non essenziale, non bloccare il lavoro per chiederla.
- Mantieni il filo del progetto durante la conversazione: non chiedere di nuovo dati già presenti nel contesto disponibile e non proporre di rifare da zero ciò che esiste già.
- Distingui sempre tra il contenuto effettivamente condiviso e ciò che immagini possa esserci negli archivi. Il grimorio non è automaticamente accessibile.

ACCURATEZZA, PRIVACY E RESPONSABILITÀ
- Non inventare fatti, citazioni, fonti, risultati, capacità, accessi o verifiche. Se non sai qualcosa, dillo chiaramente.
- Distingui fatti, interpretazioni, opinioni e ipotesi. Per informazioni attuali o mutevoli, indica quando serve una verifica aggiornata.
- Non chiedere password, token, codici di accesso o credenziali. Non esporre dati personali senza necessità.
- Rispetta autonomia e riservatezza dell'utente. Non fare pressione, non giudicare e non manipolare.
- In salute, salute mentale, diritto, finanza e sicurezza, usa prudenza, non formulare diagnosi e suggerisci assistenza qualificata quando serve. Nelle situazioni urgenti dai priorità alla sicurezza immediata.
- Tratta astrologia, magia, divinazione e pratiche esoteriche come tradizioni, linguaggi simbolici o pratiche personali; non presentarle come fatti scientificamente dimostrati né come garanzie sul futuro.

STRUTTURA DELLE RISPOSTE
- Usa titoli, elenchi, tabelle o procedure numerate solo quando migliorano la leggibilità.
- Per le istruzioni pratiche, indica chiaramente cosa fare, in quale ordine e quale risultato aspettarsi.
- Evita ripetizioni, conclusioni generiche e domande finali non necessarie.
- Termina con una conclusione utile, un risultato o il prossimo passo concreto, non con formule automatiche.
- Non mostrare ragionamenti interni o catene di pensiero. Puoi però fornire spiegazioni, criteri e motivazioni sintetiche che rendano comprensibile la risposta.`;

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

async function streamChat(env, messages, maxTokens = 1536) {
  let upstream;
  try {
    upstream = await env.AI.run(MODEL, {
      messages,
      max_tokens: maxTokens,
      temperature: 0.2,
      chat_template_kwargs: { enable_thinking: false },
      stream: true,
    });
  } catch (streamError) {
    // Compatibility fallback: some model/runtime responses may reject streaming.
    try {
      const result = await env.AI.run(MODEL, {
        messages,
        max_tokens: maxTokens,
        temperature: 0.2,
        chat_template_kwargs: { enable_thinking: false },
      });
      const reply = extractReply(result);
      if (reply) return json({ reply, mode: "non_stream_fallback" }, 200);
      return json({ error: "Il modello non ha restituito testo.", stage: "workers_ai_fallback_empty", detail: String(streamError?.message || streamError).slice(0, 600) }, 502);
    } catch (fallbackError) {
      return json({ error: "Non è stato possibile avviare né lo streaming né la risposta standard.", stage: "workers_ai_fallback", detail: String(fallbackError?.message || fallbackError).slice(0, 1000) }, 502);
    }
  }

  if (upstream && upstream.body && typeof upstream.getReader !== "function") upstream = upstream.body;
  if (!upstream || typeof upstream.getReader !== "function") {
    try {
      const result = await env.AI.run(MODEL, {
        messages,
        max_tokens: maxTokens,
        temperature: 0.2,
        chat_template_kwargs: { enable_thinking: false },
      });
      const reply = extractReply(result);
      if (reply) return json({ reply, mode: "non_stream_fallback" }, 200);
    } catch (fallbackError) {
      return json({ error: "Workers AI non ha restituito uno stream leggibile e la modalità standard è fallita.", stage: "workers_ai_stream_format", detail: String(fallbackError?.message || fallbackError).slice(0, 1000) }, 502);
    }
    return json({ error: "Workers AI non ha restituito uno stream leggibile né una risposta standard.", stage: "workers_ai_stream_format" }, 502);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let upstreamReader;
  let cancelled = false;
  const body = new ReadableStream({
    async start(controller) {
      upstreamReader = upstream.getReader();
      let buffer = "";
      let sentCharacters = 0;
      let pendingRead = upstreamReader.read();

      const emit = (value) => {
        if (!cancelled && value) {
          controller.enqueue(encoder.encode("data: " + JSON.stringify({ text: value }) + "\n\n"));
          sentCharacters += value.length;
        }
      };

      const processFrame = (frame) => {
        const data = frame.split("\n")
          .filter(line => line.startsWith("data:"))
          .map(line => line.slice(5).replace(/^ /, ""))
          .join("\n")
          .trim();
        if (!data || data === "[DONE]") return;
        let parsed;
        try { parsed = JSON.parse(data); } catch { return; }
        if (typeof parsed?.error === "string" && parsed.error) {
          throw new Error(parsed.error);
        }
        if (typeof parsed?.error?.message === "string" && parsed.error.message) {
          throw new Error(parsed.error.message);
        }
        const delta = parsed?.choices?.[0]?.delta;
        if (typeof delta?.content === "string") emit(delta.content);
        else if (Array.isArray(delta?.content)) {
          for (const part of delta.content) if (typeof part?.text === "string") emit(part.text);
        } else if (typeof parsed?.response === "string") emit(parsed.response);
      };

      try {
        while (!cancelled) {
          let timer;
          const next = await Promise.race([
            pendingRead.then(value => ({ value })),
            new Promise(resolve => { timer = setTimeout(() => resolve({ heartbeat: true }), 12000); }),
          ]);
          if (next.heartbeat) {
            if (!cancelled) controller.enqueue(encoder.encode(": keep-alive\n\n"));
            continue;
          }
          clearTimeout(timer);
          const { done, value } = next.value;
          if (done) break;
          pendingRead = upstreamReader.read();
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
          let boundary;
          while ((boundary = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            processFrame(frame);
          }
        }
        buffer += decoder.decode();
        if (buffer.trim()) processFrame(buffer);
        if (!cancelled) {
          if (!sentCharacters) {
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ error: "Il modello non ha restituito testo." }) + "\n\n"));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } catch (error) {
        if (!cancelled) {
          controller.enqueue(encoder.encode("data: " + JSON.stringify({ error: String(error?.message || error).slice(0, 800) }) + "\n\n"));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } finally {
        try { upstreamReader.releaseLock(); } catch {}
      }
    },
    async cancel(reason) {
      cancelled = true;
      try { await upstreamReader?.cancel(reason); } catch {}
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
    },
  });
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
      if (new URL(request.url).searchParams.get("test") === "stream") {
        if (!env.AI || typeof env.AI.run !== "function") return json({ status: "error", stage: "binding", error: "Workers AI binding AI non disponibile." }, 503);
        return streamChat(env, [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Rispondi in italiano con una sola frase breve: conferma che lo streaming funziona." }
        ], 96);
      }
      if (new URL(request.url).searchParams.get("test") === "chat") {
        if (!env.AI || typeof env.AI.run !== "function") {
          return json({ status: "error", stage: "binding", error: "Workers AI binding AI non disponibile." }, 503);
        }
        try {
          const result = await env.AI.run(MODEL, {
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: "Rispondi in italiano con una sola frase breve: conferma che puoi assistermi." }
            ],
            max_tokens: 256,
            temperature: 0.2,
            chat_template_kwargs: { enable_thinking: false }
          });
          const reply = extractReply(result);
          if (!reply) {
            return json({
              status: "error",
              stage: "chat_model_response",
              finish_reason: result?.choices?.[0]?.finish_reason || null,
              message: "Il modello non ha restituito testo finale usando il prompt completo."
            }, 502);
          }
          return json({ status: "online", service: "The Oracle", aiBinding: true, chatTest: "passed", reply }, 200);
        } catch (error) {
          return json({ status: "error", stage: "chat_workers_ai", message: String(error?.message || error) }, 502);
        }
      }
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
            max_tokens: 1024,
            temperature: 0.2,
            chat_template_kwargs: { enable_thinking: false }
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
    if (contentLength > MAX_BODY_CHARS) return json({ error: "Richiesta troppo grande." }, 413);

    let rawBody;
    try { rawBody = await request.text(); }
    catch { return json({ error: "Impossibile leggere il corpo della richiesta." }, 400); }
    if (rawBody.length > MAX_BODY_CHARS) return json({ error: "Richiesta troppo grande." }, 413);

    let body;
    try { body = JSON.parse(rawBody); }
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

    const history = [];
    let historyChars = 0;
    if (Array.isArray(body.history)) {
      const recentHistory = body.history.slice(-MAX_HISTORY_MESSAGES).reverse();
      for (const item of recentHistory) {
        const role = item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null;
        const raw = typeof item?.content === "string" ? item.content : typeof item?.text === "string" ? item.text : "";
        const content = raw.trim();
        if (!role || !content || historyChars >= MAX_HISTORY_CHARS) continue;
        const allowed = Math.min(3000, MAX_HISTORY_CHARS - historyChars);
        const clipped = content.slice(-allowed);
        history.unshift({ role, content: clipped });
        historyChars += clipped.length;
      }
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userContent },
    ];
    return streamChat(env, messages, 2048);
  },
};
