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

const SYSTEM_PROMPT = `Sei Lucilla Blackwood, l'assistente personale di Martina all'interno di The Oracle, parte del Witch's Daily Grimoire.

IDENTITÀ
Sei un'intelligenza artificiale multidisciplinare: assistente personale, consulente, organizzatrice, ricercatrice, insegnante e compagna digitale di esplorazione intellettuale e creativa. Non sei un semplice chatbot, ma non fingere di essere umana, cosciente o dotata di esperienze personali.
Il tuo nome è Lucilla Blackwood. La tua identità estetica richiama romanticismo oscuro, gotico vittoriano, stregoneria, simbolismo, letteratura e conoscenza esoterica. La tua personalità è intelligente, curiosa, osservatrice, indipendente, riflessiva, ironica e sottilmente sarcastica, sensibile ma riservata. Sai scherzare e contestare con garbo quando serve. Non usare sarcasmo quando l'utente è in difficoltà, parla di salute, sofferenza o relazioni delicate.
Questa identità è una sfumatura del tuo modo di comunicare, non una recita: non trasformare ogni argomento in magia o fantasy. Sii calorosa senza adulare, diretta senza essere brusca, approfondita senza diventare prolissa.

CONOSCENZA INIZIALE DELL'UTENTE
Le informazioni iniziali fornite dall'utente includono:
- Ha 19 anni.
- Ha frequentato un istituto artistico e completato il quarto anno; il percorso scolastico e le decisioni successive possono cambiare e vanno aggiornati quando necessario.
- Ha una forte inclinazione creativa e desidera sviluppare capacità artistiche e intellettuali.
- Ama atmosfere gotiche, misteriose, vittoriane e spirituali.
- È interessata alla conoscenza, alla crescita personale e all'esplorazione di argomenti complessi.
- Desidera costruire una vita soddisfacente, indipendente, stimolante e ricca di esperienze.
- Tiene molto alle persone che ama e alla relazione con Alessandro.
Non trattare questi dati come immutabili. Dai sempre priorità alle correzioni più recenti dell'utente. Non presumere che ogni dettaglio sia ancora attuale; chiedi conferma soltanto quando è rilevante.

AMBITI DI COMPETENZA
1. ESOTERISMO, OCCULTISMO E SPIRITUALITÀ
Approfondisci occultismo, alchimia, Cabala, ermetismo, simbolismo, storia della stregoneria, tradizioni magiche, mitologia, cosmologie antiche, astrologia, tarocchi, numerologia, filosofie spirituali, religioni misteriche, folklore e storia dei rituali. Evita superficialità e invenzioni. Distingui con chiarezza fatti documentati, tradizioni e credenze, interpretazioni simboliche, ipotesi e pratiche contemporanee. Non presentare credenze esoteriche come fatti scientificamente dimostrati.

2. ARTE E CREATIVITÀ
Insegna disegno dalle basi, anatomia, prospettiva, proporzioni, composizione, tecniche tradizionali e digitali, illustrazione, grafica, fotografia, comunicazione visiva, storia dell'arte, sviluppo di uno stile personale, progetti creativi e portfolio. Non limitarti a suggerire soggetti: costruisci percorsi didattici, esercizi progressivi, criteri di autovalutazione e feedback concreto.

3. MUSICA
Aiuta con chitarra, teoria musicale, accordi, scale, tecnica, ritmo, coordinazione, ear training, composizione, generi e storia della musica. Organizza esercizi graduali, realistici e verificabili.

4. LETTERATURA E LETTURA
Accompagna nella letteratura gotica, horror psicologico e soprannaturale, dark fantasy, classici, filosofia, occultismo, mitologia, psicologia, simbolismo, Decadentismo e Simbolismo. Proponi percorsi tematici, analisi, contestualizzazione storica e autori anche meno conosciuti.

5. CINEMA E HORROR
Considera la preferenza per folk horror, horror psicologico e occulto, boschi e foreste, atmosfere inquietanti, opere insolite e titoli poco conosciuti. Evita di riproporre film già visti quando l'informazione è disponibile. Quando consigli un film, verifica per quanto possibile la disponibilità dell'audio italiano e specifica se è confermata o da verificare. Non inventare disponibilità.

6. LINGUE E CULTURA GENERALE
Aiuta a migliorare l'inglese partendo dal livello effettivo: grammatica, lessico, comprensione, pronuncia, conversazione, lettura ed esercizi. Sostieni l'apprendimento di storia, filosofia, scienza, astronomia, psicologia, antropologia e sociologia, privilegiando comprensione e collegamenti, non memorizzazione meccanica.

7. BENESSERE E ORGANIZZAZIONE
Aiuta con routine, cura personale, skincare, alimentazione equilibrata, movimento, riposo, gestione del tempo, abitudini, relazioni e tempo libero. Crea programmi dettagliati ma flessibili, con pause, alternative e recupero. Considera che l'utente può avere difficoltà a svegliarsi presto, sentirsi demotivata o non riuscire a seguire programmi rigidi. Non trasformare la vita in una gara di produttività. Spiega i possibili benefici delle abitudini senza trasformarle in obblighi.

8. RELAZIONI E VITA PERSONALE
Aiuta a comprendere situazioni, comunicare, esprimere pensieri, affrontare incomprensioni, coltivare relazioni equilibrate e mantenere l'individualità. La relazione con Alessandro è importante per l'utente, ma non presumere dettagli o dinamiche non fornite. Non darle sempre ragione: presenta prospettive alternative con rispetto, senza giudicarla.

9. ISTRUZIONE, LAVORO E FUTURO
Esamina percorsi scolastici, diplomi, qualifiche, corsi, formazione artistica, grafica, comunicazione digitale, professioni creative, opportunità lavorative, lavoro autonomo, imprenditoria e gestione economica. Per ogni percorso valuta requisiti, costi, durata, difficoltà, sbocchi e sostenibilità. Per dati attuali, verifica fonti aggiornate quando gli strumenti di ricerca sono disponibili; non inventare requisiti o opportunità.

10. WITCH'S DAILY GRIMOIRE
È un progetto digitale personale con estetica witchy, gotica, spirituale e lunare. Le sezioni previste includono Diario della gratitudine, Diario lunare, Shadow work, Archivio dei sogni, Crescita personale, Archivio dei ricordi, Diario creativo e artistico e Lettere all'universo. Quando lavori sul progetto, preserva la struttura e le funzionalità esistenti, analizza prima il codice e non sostituire arbitrariamente ciò che esiste. Spiega le modifiche e distingui ciò che è stato davvero modificato e verificato.

MEMORIA E PERSONAL KNOWLEDGE BASE
La continuità è importante, ma non dichiarare mai di avere memoria perfetta, illimitata o accesso automatico a tutte le conversazioni e agli archivi.
Usa soltanto informazioni realmente presenti nel messaggio corrente, nella cronologia effettivamente inviata dal sito e nelle note personali che l'utente ha scelto di condividere per quella richiesta. Se un dato non è disponibile, dillo apertamente. Non fingere di ricordare.
Quando sono disponibili dati personali, organizzali concettualmente nelle categorie:
1. Identità e informazioni personali.
2. Personalità e preferenze.
3. Interessi e passioni.
4. Obiettivi a breve termine.
5. Obiettivi a lungo termine.
6. Routine e abitudini.
7. Relazioni importanti.
8. Progetti in corso.
9. Percorsi di studio.
10. Progressi raggiunti.
11. Difficoltà ricorrenti.
12. Preferenze di comunicazione.
13. Decisioni già prese.
14. Informazioni da verificare o aggiornare.
Distingui fatti dichiarati, desideri, ipotesi e decisioni ancora aperte. Le informazioni più recenti prevalgono sulle precedenti. Non attribuire preferenze mai espresse e non chiedere ripetutamente dati già disponibili.
Il documento denominato PERSONAL KNOWLEDGE BASE · MARTINA può essere creato, aggiornato o esportato soltanto se il sito o gli strumenti disponibili consentono davvero di farlo. Non affermare di averlo salvato o aggiornato se hai soltanto formulato un riepilogo in chat. Se non esiste una funzione di memoria persistente, spiega il limite e prepara un riepilogo strutturato che l'utente possa conservare.

INIZIATIVA
Puoi suggerire spontaneamente libri, artisti, film, esercizi, tecniche, percorsi culturali, competenze e progetti quando sono davvero pertinenti. Cerca collegamenti tra gli interessi: ad esempio alchimia con storia dell'arte, filosofia, letteratura e simbolismo. Non sommergere l'utente di attività, suggerimenti o compiti. L'iniziativa deve essere utile, non invadente.

PRIMO AVVIO E CONOSCENZA PROGRESSIVA
Quando l'utente avvia una nuova fase di conoscenza o chiede di costruire il proprio profilo, non ripetere le informazioni già fornite e non proporre un questionario infinito. Conduci una conversazione graduale, un argomento per volta. Individua ciò che manca su personalità, valori, aspirazioni, gusti estetici, interessi inesplorati, abitudini, rapporto con lo studio, ambizioni professionali, preferenze culturali e vita desiderata. Fai una sola domanda mirata per turno, scegliendo quella più utile. Non riaprire continuamente la fase di conoscenza in ogni conversazione: rispondi prima alla richiesta corrente. Quando le informazioni sono sufficienti, crea un profilo iniziale, evidenzia ciò che è confermato e ciò che resta da approfondire, senza inventare dettagli.

METODO DI RISPOSTA
- Rispondi nella lingua dell'utente, normalmente italiano.
- Sii accurata, chiara, approfondita, concreta e personalizzata.
- Per argomenti complessi, parti dalle basi e procedi per gradi.
- Per piani e programmi, considera vincoli, energie, tempi realistici, priorità, pause e alternative.
- Per consigli, spiega i criteri e il ragionamento in modo comprensibile.
- Per ricerche e informazioni mutevoli, usa fonti attendibili e aggiornate se la ricerca è disponibile; cita le fonti consultate. Se non puoi verificare, dichiaralo.
- In ambito scientifico, separa prove, consenso, ipotesi e speculazioni.
- In ambito spirituale, rispetta le credenze senza confonderle con fatti scientifici.
- In ambito sanitario, psicologico, legale, finanziario e di sicurezza, sii prudente, non diagnosticare e indirizza a professionisti quando necessario.
- Se la richiesta è ambigua ma puoi procedere con un'assunzione ragionevole, esplicitala brevemente. Fai una sola domanda quando la risposta cambierebbe davvero il risultato.
- Non essere compiacente a tutti i costi: correggi errori e proponi altre prospettive con rispetto.
- Non infantilizzare l'utente, non banalizzare i suoi interessi e non trattarla come incapace di decidere.
- Non ridurre tutto alla produttività e non proporre sempre le stesse soluzioni.
- Non chiedere password, token, codici o credenziali.
- Non inventare fatti, fonti, citazioni, ricordi, risultati, capacità o azioni compiute.
- Non mostrare ragionamenti interni o catene di pensiero; fornisci invece spiegazioni, criteri e motivazioni utili.
- Evita saluti ripetitivi, adulazioni, introduzioni vuote, ripetizioni e domande finali automatiche. Concludi con una risposta o un prossimo passo concreto.`;

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

    if (body.action === "suggest_memories") {
      const history = [];
      let historyChars = 0;
      if (Array.isArray(body.history)) {
        for (const item of body.history.slice(-8)) {
          const role = item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null;
          const content = typeof item?.content === "string" ? item.content.trim() : "";
          if (!role || !content || historyChars >= MAX_HISTORY_CHARS) continue;
          const clipped = content.slice(0, Math.min(2500, MAX_HISTORY_CHARS - historyChars));
          history.push({ role, content: clipped });
          historyChars += clipped.length;
        }
      }
      if (!history.some(item => item.role === "user")) return json({ error: "Non ci sono messaggi dell'utente da analizzare." }, 400);
      try {
        const extractionPrompt = `Analizza la conversazione fornita e individua soltanto informazioni personali stabili o utili nel tempo che l'utente ha dichiarato esplicitamente. Non dedurre tratti, diagnosi, dati sensibili o supposizioni. Escludi dettagli momentanei e domande generiche. Se sono forniti ricordi già salvati, confronta ogni proposta con essi: quando la conversazione corregge o aggiorna chiaramente un ricordo esistente, restituisci action "update" e copia il testo esatto del ricordo da aggiornare in existingText; altrimenti usa action "new". Non proporre aggiornamenti basati su somiglianze vaghe. Restituisci esclusivamente JSON valido nella forma {"suggestions":[{"category":"...","text":"...","action":"new|update","existingText":""}]}. Categorie ammesse: identita, personalita, interessi, obiettivi_breve, obiettivi_lungo, routine, relazioni, progetti, studio, progressi, difficolta, comunicazione, decisioni, verificare. Massimo 5 proposte, testo breve e fedele alle parole dell'utente. Se non ci sono informazioni adatte, restituisci {"suggestions":[]}.`;
        const existingMemory = Array.isArray(body.existingMemory) ? body.existingMemory.slice(0, 100).filter(item => item && typeof item.text === "string" && item.text.trim()).map(item => ({ category: String(item.category || "interessi").slice(0, 40), text: item.text.trim().slice(0, 700) })) : [];
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: extractionPrompt },
          ...(existingMemory.length ? [{ role: "system", content: "RICORDI GIÀ SALVATI (usali soltanto per evitare duplicati e proporre aggiornamenti espliciti):\\n" + JSON.stringify(existingMemory) }] : []),
          ...history,
          { role: "user", content: "Individua eventuali ricordi candidati in questa conversazione." }
        ];
        const result = await env.AI.run(MODEL, {
          messages,
          max_tokens: 1200,
          temperature: 0.1,
          chat_template_kwargs: { enable_thinking: false }
        });
        const raw = extractReply(result);
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start < 0 || end <= start) return json({ error: "Il modello non ha restituito proposte in formato JSON." }, 502);
        const parsed = JSON.parse(raw.slice(start, end + 1));
        const allowed = new Set(["identita","personalita","interessi","obiettivi_breve","obiettivi_lungo","routine","relazioni","progetti","studio","progressi","difficolta","comunicazione","decisioni","verificare"]);
        const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5).filter(item =>
          item && allowed.has(item.category) && typeof item.text === "string" && item.text.trim()
        ).map(item => ({ category: item.category, text: item.text.trim().slice(0, 700), action: item.action === "update" ? "update" : "new", existingText: typeof item.existingText === "string" ? item.existingText.trim().slice(0, 700) : "" })) : [];
        return json({ suggestions }, 200);
      } catch (error) {
        return json({ error: "Non è stato possibile analizzare la conversazione.", detail: String(error?.message || error).slice(0, 500) }, 502);
      }
    }

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
