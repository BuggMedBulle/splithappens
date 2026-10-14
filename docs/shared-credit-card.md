# Gemensamt kreditkort och fakturor

Funktionen är frivillig för pargrupper med två personer. Befintliga privata utlägg, inkomster och grupper med fler personer använder samma räkneregler som tidigare. Webbplatsens startsida visar nu den senaste appen i `public/bankboken-multi`.

## Användning

1. Öppna gruppens inställningar och aktivera gemensamt kreditkort. Välj namn, huvudkort/extrakort, fakturabetalare och brytdag. Standardavgiften är 575 kr och delas 50/50. Brytdagen måste anges; den ingår i perioden. Korta månader använder månadens sista dag.
2. Välj Kreditkort som betalningskälla i utgiftsformuläret. Välj fysiskt kort och kostnadsfördelning var för sig. Fakturaperioden väljs från köpdatum och kan ändras manuellt. Negativa belopp är returer/krediteringar.
3. Öppna fakturavyn från startsidans sammanfattning eller kortknappen. Där finns total, andelar, kortsummor, transaktioner och filter. Öppna en annan månad om du behöver registrera en äldre eller framtida faktura. Avgiften skapas när fakturan skapas första gången och lagras i det dokumentet.
4. Registrera det faktiska fakturabeloppet. Via "Justera avgift, betalare och period" kan du korrigera avgift, fördelning, faktisk betalare, periodgränser och förfallodatum.
5. När differensen är noll: stäm av och bekräfta överföring till avräkningen. Fakturans skuld kvittas då med privata utlägg. Betala nettot med befintlig Swish-knapp och markera som swishat efter betalningen.
6. Registrera betalningen till kortbolaget separat. Bankbetalning och Swish är olika händelser och skapar inga ytterligare konsumtionskostnader.

Pågående och mottagna fakturor ingår inte i Swish-saldot. Avstämd innebär att underlaget matchar fakturan. Reglerad betyder att betalningsansvaret har förts till avräkningen, vilket kan ge ett nettobelopp i det gemensamma saldot. Reglerad innebär inte i sig att banken är betald eller att någon redan har swishat; bankstatus och betalningshistorik visas separat.

## Lagring och garantier

Inställningarna ligger i gruppdokumentets frivilliga `creditCard`-fält. Vanliga utgifter behåller sin befintliga form; kortköp får `paymentSource`, kortets medlems-ID, köpdatum och fakturatillhörighet. Roller använder stabila medlems-ID, även när en reserverad profil senare kopplas till ett användarkonto.

Fakturor ligger i samma befintliga `bankbooks/{groupId}/entries`-samling som dokument med `kind: "creditInvoice"`. De filtreras bort från vanliga utgifter. Det behövs ingen ny Firestore-samling, index eller datamigrering. Befintlig medlemsåtkomst används. Dokument-ID är deterministiskt, `credit-invoice-YYYY-MM`, och kan bara skapas en gång per grupp och månad genom appens transaktioner.

Fakturan innehåller en avgiftsögonblicksbild, fysiska kortroller, period, kostnadsunderlag och en överföringsjournal. Köp och fakturans motsvarande underlag sparas atomiskt genom Firestore-transaktioner. Samtidiga skrivare läser samma revisionskontrollerade fakturadokument, vilket gör att motstridiga skrivningar måste prövas igen. Det första skapandet bestämmer avgiften; senare öppningar lägger inte till en avgift till.

Standardändringar gäller bara fakturor som skapas därefter. Befintliga fakturor ändras uttryckligen var för sig. Att inaktivera kontot blockerar nya kortköp och nya perioder, men bevarar befintliga fakturor och deras skulder.

Överföring till saldot identifieras av faktura och revision. Upprepade överföringar av samma underlag är sidoeffektsfria. Senare ändringar ersätter inte tidigare överföringar: de kräver en orsak, ny avstämning och uttrycklig överföring av endast differensen. Journalen bevarar tidigare belopp, tid, användare och korrigeringsorsak. Köp- och fakturarättelser sparar före/efter-underlag.

Kvittorader som inte delas försvinner inte från kreditkortsfakturan. Välj uttryckligen vem som ansvarar för dessa rader. Hela kortbeloppet fördelas då, även när resterande rader använder egen delning. Befintlig privat kvittodelning är oförändrad.

Statistiken räknar kortköp och en avgift per faktura. Avgiften är en härledd statistikpost och är aldrig ett extra privat utlägg. Fakturadokument, överföringsjournal och bankbetalningar är inte nya utgifter. Swish räknas inte heller som konsumtion. Belopp beräknas i heltalsören, även för returer.

## Tester

- `npm test`: ekonomi, perioder, revisionsskydd, korrigeringar och den faktiska lagringsadaptern med en optimistisk transaktionssimulator. Där ingår 500 jämförelser med den tidigare saldologiken.
- `npm run test:browser`: hela appen i Playwright med simulerad Firebase och fryst testdatum. Kör först `npx playwright install chromium`, eller använd `CREDIT_TEST_CHROME` för en installerad Chrome-binär. Ingen riktig Firebase-data eller bankapp används.
- `npm run build`: separat byggkontroll med Node 22.13 eller senare.
- GitHub Actions kör ekonomitester, webbläsartest och byggning på push/PR.

Acceptansexemplet verifieras både genom lagringsadaptern och det riktiga gränssnittet: 7800 kr i köp, 575 kr avgift, A:s andel 4087,50 kr och B:s andel 4287,50 kr. Med A:s privata skuld på 1200 kr ska B swisha A 3087,50 kr. Efter betalning och omladdning är saldot noll. Testet kontrollerar dessutom bankbetalning, statistik, retur efter Swish, manuell period, återkommande kortköp och vanlig gruppregistrering.

## Driftsättning och verifieringsgränser

Alla filer i `public/bankboken-multi`, inklusive de nya JavaScript-modulerna, måste följa med vid publicering. Använd den nya versionen på båda enheterna innan kontot aktiveras. Äldre klienter känner inte till fakturadokumenten och ska inte användas parallellt med aktiverat kreditkort.

Detta arbete har verifierats med transaktionssimulator och webbläsarens simulerade Firebase, inte med en riktig inloggad Firebase-session eller Firestore-emulator. Den lokala datorn saknar Java för emulatorn. Inga riktiga ekonomiposter har ändrats. Push/PR publicerar koden för granskning; den installerar inte appen på GitHub Pages eller ändrar Firebase-regler.

Firestore-transaktioner kräver nätanslutning. Fakturaunderlag och journal lagras i ett dokument per månad och omfattas av Firestores vanliga dokumentstorleksgräns. Befintliga medlemsregler är oförändrade; de är inte ett separat manipulationsskydd mot en medlem som kringgår appen och gör direkta databasändringar.
