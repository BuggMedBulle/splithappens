# Gemensamt kreditkort — session 1

## Utgångsläge

Arbetet utgår från `adaptive-groups-release` vid `b8414ec`, den senaste lokalt tillgängliga utvecklingsversionen. En separat lokal klon används på grenen `credit-card-foundation`. Ursprunglig arbetskopia och dess ocommittade ändringar är bevarade; en extra säkerhetskopia finns i chattens `work/original-changes/`.

## Implementerat

- Befintliga `sharesOf`, `balanceOf`, `groupNetBalances` och `optimizedSwishPlan` har flyttats till `public/bankboken-multi/finance.js`. Appen använder dessa funktioner; gruppfunktionerna får profiler som uttryckliga argument. Befintliga regler och avrundning är bevarade.
- `credit-card-model.js` innehåller fristående beräkningar, validerade standardinställningar och en förhandsberäkning av fakturans skuldbidrag. Modulen laddas inte av appen och skriver inga data.
- `npm test` kör ekonomitester och kontroller av appens modulimporter, syntax och statiska tillgångar. De gamla startmallstesterna beskrev ett borttaget gränssnitt och har ersatts. `npm run build` finns kvar som separat byggkontroll.

Ingen databas har migrerats. Inget nytt UI, ingen fakturaskapning och ingen överföring till saldo har aktiverats.

## Beräkningsregler

Befintliga poster har belopp i kronor. Den nya fakturamodellen härleder heltalsbelopp i ören; det ursprungliga beloppet behöver inte dubbellagras. Positivt bidrag till parens saldo betyder att B är skyldig A.

Kortanvändare påverkar bara totalsummor per fysiskt kort. Kostnadsandel styrs av `split` (`a`, `b`, `even`, `custom`) och befintligt `shareA`. Returer har negativt belopp och vänder samma fördelning, även när en udda öresavrundning krävs. Delarnas summa ska alltid vara fakturans totalbelopp.

Varje faktura har en egen kopia av avgift och avgiftsfördelning. 57500 öre och `feeShareA: 0.5` ger 28750 öre per person. Att ändra kontots standardavgift ändrar inte ett befintligt fakturaunderlag. Rekommenderad regel för senare sessioner: standardändringar gäller endast fakturor som skapas därefter; befintliga öppna fakturor kan ändras uttryckligen var för sig.

Fakturabetalning till banken är metadata, inte konsumtion eller Swish. Swish-poster minskar nettosaldot och är inte konsumtion. Statistik ska baseras på köp och avgift, aldrig på ett sammanfattande fakturabelopp eller skuldbidrag.

## Minsta planerade datamodell

Detta är ett kontrakt för nästa sessioner, inte redan skapade Firestore-samlingar.

- Gruppens frivilliga `creditCard`-inställningar: `enabled`, namn, stabila medlems-ID för huvudkort/extrakort/fakturabetalare, `feeCents`, `feeShareA`, `cutoffDay`. Standard för brytdag är `null`; användaren behöver ange dagen innan automatisk periodtilldelning aktiveras. Roller ska använda befintliga stabila medlems-ID, även för deltagare som senare kopplar ett konto till en reserverad profil.
- Utgiftens tillägg: `paymentSource: "creditCard"`, `accountId`, `cardMemberId`, `invoiceId` och senare explicit information om manuell periodkorrigering. Befintliga belopp, kategori, datum, kvitto och kostnadsdelning återanvänds. Utgifter utan betalningskälla fortsätter tolkas som privata utlägg.
- Separata fakturadokument under gruppen: identitet, period, `memberAId`, `memberBId`, faktisk `invoicePayerMemberId`, avgift och avgiftsfördelning som ögonblicksbild, `actualTotalCents`, förfallodatum, status, bankbetalningsinformation, överföringsmarkör och revisionsinformation.
- Interna tillstånd: `ongoing`, `received`, `reconciled`, `transferred`. UI-etiketterna motsvarar Pågående, Mottagen, Avstämd, Reglerad. "Reglerad" betyder här att betalningsansvaret förts till avräkningen; det innebär inte automatiskt att banken är betald eller att någon har swishat. Dessa händelser visas separat.

Avgiften bör lagras en gång som en del av fakturadokumentet och visas som en avgiftsrad. Undvik en extra avgiftspost bland privata utlägg. Den senare statistikprojektionen läser fakturans avgift en gång.

## Garantier som återstår att implementera

Session 1:s förhandsberäkning kan neka ett underlag med differens eller en redan överförd faktura, men detta ersätter inte ett atomiskt databasskydd. Upprepade beräkningar är sidoeffektsfria; det är inte ett bevis på säker samtidig fakturaskapning eller överföring.

Session 3 behöver deterministiska faktura-ID och Firestore-transaktioner för skapande och avgiftsögonblicksbild. Brytdatum, korta månader, årsskiften, senare bokförda köp och manuella perioder ska testas där.

Session 4 behöver atomisk och versionskontrollerad bekräftelse av avstämningsunderlaget. Fakturans ID ska identifiera ett enda skuldbidrag. Fastställt underlag ska inte ändras av samtidiga köpändringar eller retroaktiva inställningar. Kreditköp ska aldrig samtidigt gå genom den privata skuldberäkningen. Bankbetalning får inte göra ett ytterligare skuldbidrag.

Session 5 behöver spårbara korrigeringar med nya differensbidrag i stället för att tyst skriva om historiska överföringar. Tidigare Swish-poster ligger kvar.

## Begränsningar och befintliga problem

- Fullt flöde, UI, Firebase-behörighetsregler, samtidighet och databasgarantier är inte verifierade i denna session.
- Fakturamodellen kräver full kostnadsfördelning av registrerat köp. Den nekar ett äldre `excludedAmount` som annars skulle lämna del av fakturan utan ansvarig person. Session 2 måste uttryckligen hantera eventuella sådana kvittodelar och inte bara utelämna dem från fakturan.
- Den senaste grenen anropar `store.createRecurring` och `store.createIfMissing`, men dessa metoder saknas i `initStore`. Det är ett befintligt fel som behöver repareras och testas innan återkommande kortköp stöds. Den här sessionen ändrar inte det flödet.
- React/Vinext-startsidan visar fortfarande den äldre `bankboken` via iframe. Den senaste appen finns på `/bankboken-multi/index.html` i repositoryt och som rotfiler på publiceringsgrenen.
- Vid framtida GitHub Pages-publicering måste `finance.js` kopieras tillsammans med `app.js`, HTML, CSS och övriga tillgångar. Ingen publicering har utförts här.

## Acceptansunderlag

Mat 2000 (50/50), kläder A 1500 (A), restaurang 1000 (50/50), kläder B 2500 (B), present 800 (A): köp 7800 kr. Med avgift 575 kr blir totalen 8375 kr, A:s andel 4087,50 kr och B:s andel 4287,50 kr. A:s privata skuld till B på 1200 kr ger ett nettobelopp på 3087,50 kr från B till A. En Swish på detta belopp ger noll i beräkningsmodellen.

Detta acceptanstest verifierar matematiken nu. Databasoperationernas engångsgarantier och det faktiska gränssnittsflödet ska verifieras i respektive senare session innan hela funktionen betraktas som klar.

## Verifiering av session 1

- `npm test`: 23 automatiserade tester, inklusive de 500 deterministiska jämförelserna mot originalkoden vid `b8414ec`. Regressionstestet kräver Git-historiken; kör det i repositoryt.
- Full Vinext-byggning lyckades med Node 24.19.0. Systemets Node 20 är äldre än projektets krav, så byggningen kördes med Codex medföljande Node.
- Riktad ESLint-kontroll av nya beräkningsmoduler och testfiler.
- Ingen inloggad webbläsartestning eller skrivning till Firebase har utförts.
