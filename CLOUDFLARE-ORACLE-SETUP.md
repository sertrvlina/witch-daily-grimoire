# The Oracle · configurazione e regole di costo

Il Worker è definito in `cloudflare-worker.js` e usa il binding Workers AI denominato `AI`.

## Endpoint
`https://proud-scene-d65athe-oracle.martinabianco2007.workers.dev`

## Deploy
Il repository è collegato a Cloudflare Workers Builds. Le modifiche salvate sul branch `main` sono destinate al deploy automatico tramite la build collegata. Non sostituire manualmente il Worker con una versione precedente: si rischia di annullare le funzioni più recenti. Un commit GitHub conferma il salvataggio del codice, non da solo il completamento del deploy Cloudflare.

## Piano gratuito: regola obbligatoria
Il Worker non espone più endpoint GET di test che consumano AI: il controllo pubblico di stato verifica soltanto la build e il binding, senza eseguire inferenze.
- Mantenere Cloudflare Workers sul piano **Free**.
- Non attivare Workers Paid, non aggiungere crediti prepagati e non configurare servizi a pagamento.
- Workers AI sul piano Free dispone di una quota gratuita giornaliera di 10.000 Neurons. La quota si rinnova ogni giorno alle 00:00 UTC.
- Quando la quota gratuita è esaurita, le richieste AI sul piano Free vengono rifiutate fino al rinnovo. Non effettuare upgrade per superare il limite.
- Chat, analisi documenti e generazione/modifica immagini condividono la quota Workers AI.

## Consumo indicativo immagini
Il modello usato è `@cf/black-forest-labs/flux-2-klein-4b`.
- Risultato 512 × 512: circa 31,45 Neurons per immagine (input e output).
- Risultato 1024 × 1024: circa 109,73 Neurons per immagine (input e output).
- Lo studio immagini seleziona 512 × 512 come impostazione predefinita per contenere il consumo.
- Le stime sono indicative e non includono il consumo di chat o altre funzioni.

## Funzioni
- Chat con Lucilla tramite `@cf/zai-org/glm-4.7-flash`.
- Analisi di documenti: il testo viene estratto nel browser; soltanto dopo consenso viene inviato al Worker.
- Studio immagini: l'immagine viene ridimensionata nel browser; viene inviata al Worker solo dopo consenso esplicito. È disponibile la risoluzione 512 o 1024.
- Memoria, archivi e dati del Grimorio restano locali, salvo condivisione esplicita dall'interfaccia.

## Privacy
Il Worker non implementa un archivio persistente di chat o memoria. Il sito invia contenuti remoti soltanto quando l'utente attiva il consenso corrispondente. L'endpoint accetta richieste POST provenienti dal dominio GitHub Pages del progetto.
