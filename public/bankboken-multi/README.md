# Split Happens

Split Happens är en app för att dela utgifter och inkomster i par eller grupper med upp till
tio personer. Appen använder Firebase Authentication och Cloud Firestore för inloggning,
grupper och synkronisering mellan enheter.

Par med två medlemmar har även stöd för återkommande betalningar. Grupper med tre till tio
medlemmar får dynamisk kostnadsdelning och förslag på effektiva Swish-betalningar.

## Utveckling och tester

Kör `npm test` från repositoryts rot för ekonomiberäkningar och statiska appkontroller.
Kör `npm run build` separat för webbplatsens byggkontroll.

Kreditkortsstödets första session har en testad beräkningsgrund, men ingen aktiverad
kreditkortsfunktion. Se `docs/credit-card-foundation.md` för datamodell, räkneregler,
begränsningar och nästa sessioner. Vid publicering ska den nya modulen `finance.js`
alltid följa med `app.js`.
