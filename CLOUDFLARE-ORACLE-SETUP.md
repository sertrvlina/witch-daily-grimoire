# Attivare The Oracle su Cloudflare

Il codice del Worker è in `cloudflare-worker.js`.

## 1. Binding AI
Nel pannello Cloudflare apri il Worker già creato. In Settings / Bindings aggiungi **Workers AI** con variabile **AI** e salva.

## 2. Inserire il codice
Apri il Worker, entra in Edit code, sostituisci tutto il codice Hello World con il contenuto integrale di `cloudflare-worker.js`, quindi salva e fai Deploy.

## 3. URL
Endpoint previsto: `https://proud-scene-d65athe-oracle.martinabianco2007.workers.dev`

## 4. Piano gratuito
Il modello `@cf/zai-org/glm-4.7-flash` è indicato da Cloudflare come disponibile nel piano Workers Free. Workers AI include 10.000 Neurons al giorno senza costo. Superata la quota, sul piano Free le richieste vengono rifiutate: non passare a Workers Paid e non aggiungere metodi di pagamento.

## Privacy
Il Worker non salva chat o memoria e non registra i contenuti. Il sito invia il messaggio solo dopo il consenso cloud. Le note personali vengono inviate solo con la seconda casella di consenso. Gli archivi del Grimorio non vengono letti né trasmessi dal Worker.
