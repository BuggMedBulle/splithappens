# Split Happens – grupprototyp

Det här är en separat experimentkopia för att utveckla stöd för upp till tio personer.
Originalet finns kvar i `public/bankboken-v2` och påverkas inte av arbetet här.
Gruppversionen har inte stöd för återkommande eller stående betalningar.

## Viktigt

Kopian använder tills vidare samma Firebase-konfiguration som originalet, men datamodellen
är ännu byggd för exakt två personer (`A` och `B`). Använd därför inte prototypen med riktig
data innan datamodell och Firestore-regler har anpassats för grupper.

## Nästa utvecklingssteg

1. Ersätt personplatserna `A` och `B` med en dynamisk medlemslista på högst tio personer.
2. Lagra delning per medlem i stället för `shareA` och implicit andel för person B.
3. Uppdatera saldo från ett enda parsaldo till nettosaldon mellan flera personer.
4. Anpassa inbjudningar, medlemsväljare, historikfilter och avatarer.
5. Uppdatera Firestore-regler och testa med en separat testbok.
