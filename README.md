# Split Happens

Split Happens är en app för att dela utgifter och inkomster i par eller grupper med upp till
tio personer. Appen använder Firebase Authentication och Cloud Firestore för inloggning,
grupper och synkronisering mellan enheter.

Par med två medlemmar har även stöd för återkommande betalningar. Grupper med tre till tio
medlemmar får dynamisk kostnadsdelning och förslag på effektiva Swish-betalningar.

## Utveckling och tester

Kör `npm test` från repositoryts rot för ekonomiberäkningar och statiska appkontroller.
Kör `npm run build` separat för webbplatsens byggkontroll.

Gemensamt kreditkort är ett frivilligt tillval för par. Se `docs/shared-credit-card.md`
för användning, lagring, korrigeringar och verifieringsgränser. Kör
`npm run test:browser` för hela användarflödet med simulerad Firebase-data.
Vid publicering ska samtliga JavaScript-moduler i denna mapp följa med.

Under Inställningar → Stående betalningar kan du välja kategori för varje prenumeration.
Valet sparas direkt och används för framtida månadsutgifter. Tidigare poster behåller
sin kategori och kan redigeras individuellt i historiken.
