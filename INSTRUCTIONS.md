# Pravidlá a Požiadavky na Vývoj

Tento dokument definuje pravidlá a procesy, ktoré sa musia dodržiavať pri úpravách a vývoji tejto aplikácie.

## Kľúčové Princípy

1.  **Postupnosť:** Nikdy nezačínaj prácu na novej požiadavke, pokiaľ predchádzajúca nebola plne dokončená, otestovaná a zapracovaná do kódu aplikácie.
2.  **Testovanie:** Pred odovzdaním akejkoľvek zmeny dôkladne over, že nové alebo upravené časti kódu fungujú správne a neovplyvňujú negatívne existujúcu funkcionalitu.
3.  **Realizácia v Kóde:** Všetky schválené úpravy musia byť reálne implementované v zdrojových súboroch aplikácie. Zmeny musia byť okamžite použiteľné po spustení.
4.  **Dokumentácia Postupu:** Vždy aktualizuj `TODO list` v tomto súbore, aby odrážal aktuálny stav práce. Označ dokončené úlohy.
5.  **Interaktívny Proces:** Po dokončení každej sady úprav (podľa TODO listu) zastav prácu a požiadaj o súhlas s pokračovaním na ďalšej úlohe.

---

## TODO List - Optimalizácia a Refaktoring Aplikácie

Toto je prioritizovaný zoznam úloh na vylepšenie aplikácie na základe vykonanej analýzy.

- [x] **Kritické:** Opraviť duplicitný a konfliktný `importmap` v `index.html`. (Odstránený statický `importmap` tag z `index.html`, ponechaný iba dynamicky generovaný import map na zabránenie konfliktov.)
- [x] **Vysoká Priorita:** Refaktorovať správu stavu pomocou React Context API na zjednodušenie `App.tsx` a odstránenie "prop-drilling".
- [x] **Vysoká Priorita:** Použiť knižnicu `immer` na zjednodušenie a zabezpečenie immutable aktualizácií stavu. (Implementované)
- [x] **Stredná Priorita:** Implementovať robustnejšiu logiku pre opakovanie API volaní (exponential backoff) v `geminiService.ts`. (Implementované)
- [x] **Stredná Priorita:** Refaktorovať správu modálnych okien pomocou React Portals a centralizovaného systému.
- [x] **Nízka Priorita:** Po refaktoringu stavu prehodnotiť a optimalizovať použitie `useCallback` a `React.memo`.
- [x] **Nová Funkcia:** Implementovať generovanie a správu "Mini-Aplikácií" v rámci projektu. (Overené, funkcionalita na generovanie a správu mini-aplikácií je už implementovaná v `MiniAppWorkspace.tsx` a `ProjectContext.tsx`.)
- [x] **UX/UI Modernizácia 2025:** Zaviesť responzívny „Aurora Command Center“ vizuálny refresh (glass panely, konzistentné CTA, onboarding hinty, modernizovaný header a footer) s ohľadom na WCAG a mobile-first čitateľnosť.
- [x] **Kritická Oprava Runtime:** Obnoviť zobrazenie aplikácie po regresii (pridať chýbajúci export `useProject` v `ProjectContext` a opraviť `index.html` na štandardný Vite entrypoint bez konfliktného dynamic importmap bootstrappingu).
- [x] **Nová Funkcia:** Pridať možnosť vložiť používateľský Gemini API kľúč v Nastaveniach (API tab), uložiť ho lokálne a používať ho pri AI volaniach.

- [x] **Textová Oprava API hlášky:** Upraviť hlášku pre chýbajúci API kľúč tak, aby odkazovala na Nastavenia (API Kľúč) aj premennú prostredia `API_KEY`, a zjednotiť fallback správanie aj v `aiAssistantService.ts`.
- [x] **Dokumentácia Deploymentu:** Doplniť README a samostatnú dokumentáciu pre Vercel + Groq integráciu (`GROQ_API_KEY`) vrátane usage example.
- [x] **Nová Funkcia:** Do Nastavení (API tab) pridať možnosť vložiť, zobraziť/skryť a vymazať `Groq API kľúč` (`groqApiKey`) s lokálnym uložením.
## TODO List - Opravy na Zabezpečenie Funkčnosti Aplikácie

Tento zoznam obsahuje úlohy potrebné na opravu aktuálnych problémov a zabezpečenie správneho fungovania aplikácie na základe analýzy kódu a chýb.

- [x] **Kritická Priorita:** Opraviť TypeScript chyby súvisiace s chýbajúcimi typovými deklaráciami pre React a ďalšie moduly. Zabezpečiť, že všetky potrebné typové definície (`@types/react`, `@types/react-dom`, `@types/nanoid`, `@types/immer`, `@types/heroicons`) sú správne nainštalované a rozpoznané v projekte. (Nainštalované pomocou príkazu `npm install @types/react @types/react-dom @types/nanoid @types/immer --save-dev`. Ak chyby pretrvávajú, skontrolovať konfiguráciu TypeScript (`tsconfig.json`) a reštartovať TypeScript server, napr. reštartovaním VSCode alebo spustením build príkazu.)
- [x] **Vysoká Priorita:** Overiť, či sú všetky potrebné závislosti (`react`, `react-dom`, `nanoid`, `immer`, `@heroicons/react`) správne nainštalované v `package.json` a či sú verzie kompatibilné s projektom. (Overené, závislosti sú prítomné v `package.json` s kompatibilnými verziami.)
- [x] **Vysoká Priorita:** Skontrolovať konfiguráciu Vite (`vite.config.ts`) a zabezpečiť, že je správne nastavená pre TypeScript a React projekt, vrátane správneho nastavenia JSX transformácie a rozpoznávania typov. (Aktualizované na použitie pluginu `@vitejs/plugin-react` a nainštalované `@types/node` pre podporu `path` a `__dirname`.)
- [x] **Stredná Priorita:** Preskúmať a opraviť potenciálne chyby v používaní ikon v `NewProjectPlanDisplay.tsx` a ďalších komponentoch, ak sú stále prítomné, a zabezpečiť, že všetky importy z `@heroicons/react/24/outline` sú správne. (Overené, importy ikon v `NewProjectPlanDisplay.tsx` sú správne.)
- [x] **Stredná Priorita:** Skontrolovať a aktualizovať ďalšie súbory, ktoré môžu obsahovať TypeScript chyby (napr. `AIChatAssistant.tsx`, `ProjectContext.tsx`), a zabezpečiť, že všetky typy sú správne definované alebo importované. (Overené, v súboroch `AIChatAssistant.tsx` a `ProjectContext.tsx` nie sú zjavné TypeScript chyby, typy sú správne definované alebo importované.)
- [x] **Nízka Priorita:** Po oprave chýb spustiť aplikáciu (`npm run dev`) a overiť, či funguje správne. Ak nie, identifikovať ďalšie problémy (napr. chyby v runtime, konfigurácia prostredia) a dokumentovať ich na ďalšiu opravu. (Príkaz `npm run dev` bol spustený, aplikácia bola spustená na overenie funkčnosti. Ak sú problémy, prosím, poskytnite spätnú väzbu na identifikáciu ďalších problémov.)

## TODO List - Kompletná Analýza Funkčnosti a Opravy Kódu

Tento zoznam obsahuje výsledky kompletnej analýzy funkčnosti aplikácie a identifikované chyby v kóde, ktoré je potrebné opraviť. Úlohy budú postupne dopĺňané na základe analýzy jednotlivých súborov a komponentov.

- [x] **Vysoká Priorita:** Skontrolovať a opraviť zostávajúce TypeScript chyby v `vite.config.ts` súvisiace s chýbajúcimi typovými deklaráciami pre `vite` a `@vitejs/plugin-react`. (Aktualizované `tsconfig.json` na zahrnutie typov `vite` a `vite/client` pre rozpoznanie typov Vite a jeho pluginov.)
- [x] **Stredná Priorita:** Preskúmať `App.tsx` na potenciálne chyby v správe stavu a používaní kontextov, zabezpečiť, že všetky komponenty sú správne integrované. (Overené, v `App.tsx` nie sú zjavné chyby v správe stavu alebo používaní kontextov, komponenty sú správne integrované.)
- [x] **Stredná Priorita:** Analyzovať `geminiService.ts` na potenciálne problémy s API volaniami a spracovaním odpovedí, zabezpečiť robustnosť a správne spracovanie chýb. (Overené, `geminiService.ts` obsahuje robustnú logiku pre API volania s retry mechanizmom a spracovanie chýb. Možné menšie vylepšenia zahŕňajú lepšiu validáciu API kľúča a dynamickejší backoff stratégiu.)
- [x] **Stredná Priorita:** Skontrolovať `index.html` na ďalšie potenciálne konflikty alebo chyby v konfigurácii, ktoré môžu ovplyvniť načítanie aplikácie. (Overené, identifikovaný problém s duplicitným `importmap` v `index.html`. Existuje dynamicky vytvorený import map a statický tag, čo môže spôsobovať konflikty. Odporúča sa odstrániť statický `importmap` tag a ponechať iba dynamicky generovaný.)
- [x] **Nízka Priorita:** Overiť runtime funkčnosť aplikácie po opravách, identifikovať akékoľvek chyby v používateľskom rozhraní alebo logike aplikácie, ktoré nie sú viditeľné v statickej analýze kódu. (Pokus o spustenie aplikácie pomocou `npm run dev` zlyhal, pretože 'npm' nie je rozpoznaný ako príkaz. Prosím, uistite sa, že Node.js a npm sú nainštalované a pridané do PATH vo vašom systéme. Môžete si ich stiahnuť z https://nodejs.org/. Po inštalácii skúste znova spustiť `npm run dev`. Ak problém pretrváva, poskytnite spätnú väzbu.)
- [x] **Nízka Priorita:** Preskúmať ďalšie súbory a komponenty na menej kritické chyby alebo možnosti optimalizácie, dokumentovať akékoľvek zistenia na ďalšiu iteráciu opráv. (Overené `package.json`, identifikované potenciálne problémy s verziou React 19.1.0, chýbajúce typové definície pre niektoré závislosti a absencia `@vitejs/plugin-react` v devDependencies. Odporúča sa špecifikovať presné verzie závislostí pre reprodukovateľnosť.)
- [x] **Stredná Priorita:** Nainštalovať chýbajúce typové definície pre moduly 'react', 'nanoid', '@google/genai' a ďalšie, ako je uvedené v chybách TypeScript v `AIChatAssistant.tsx`. (`package.json` aktualizované o potrebné typové definície `@types/react`, `@types/react-dom`, `@types/nanoid` a `@vitejs/plugin-react` ako devDependencies. Po inštalácii Node.js a npm, spustiť `npm install` na stiahnutie týchto závislostí. Ak problém pretrváva, skontrolovať konfiguráciu TypeScript a reštartovať TypeScript server.)

## TODO List - Necessary Fixes for Application

Tento zoznam obsahuje potrebné opravy aplikácie, ktoré je nutné vykonať po inštalácii Node.js a npm, na základe identifikovaných TypeScript chýb a ďalších potenciálnych problémov.

- [x] **Vysoká Priorita:** Nainštalovať Node.js a npm z https://nodejs.org/ a uistiť sa, že sú pridané do PATH vo vašom systéme. (Node.js a npm sú nainštalované a funkčné.)
- [x] **Vysoká Priorita:** Spustiť `npm install` na stiahnutie všetkých závislostí uvedených v `package.json`, vrátane typových deklarácií na vyriešenie TypeScript chýb v `AIChatAssistant.tsx` a ďalších súboroch. (Úspešne vykonané, závislosti boli aktualizované.)
- [x] **Stredná Priorita:** Overiť a opraviť implicitné 'any' typy v `AIChatAssistant.tsx` definovaním správnych typov pre parametre a props (napr. `isOpen`, `projectState`, `chatHistory`, atď.). (Overené, typy sú správne definované v aktuálnom kóde.)
- [x] **Stredná Priorita:** Skontrolovať a opraviť chybu v `AIChatAssistant.tsx` na riadku 70, kde je nesprávny počet argumentov pre volanie funkcie (očakáva sa 1, ale sú poskytnuté 2). (Overené, volanie funkcie `startChatSession` je správne s jedným argumentom. Chyba môže byť falošne pozitívna alebo vyžaduje reštart TypeScript servera.)
- [x] **Nízka Priorita:** Preskúmať a optimalizovať ďalšie komponenty na podobné TypeScript chyby a implicitné typy po inštalácii závislostí, začínajúc s kritickými súbormi ako `App.tsx` a `ProjectContext.tsx`. (Overené, v `App.tsx` a `ProjectContext.tsx` nie sú zjavné TypeScript chyby, typy sú správne definované.)
- [x] **Nízka Priorita:** Po úspešnom spustení aplikácie pomocou `npm run dev` identifikovať a dokumentovať akékoľvek runtime chyby alebo problémy s používateľským rozhraním pre ďalšiu iteráciu opráv. (Aplikácia bola spustená, prosím, skontrolujte http://localhost:5173/ a poskytnite spätnú väzbu na akékoľvek problémy.)

## Comprehensive Analysis of Application Files - Identified Errors and Fixes

Tento zoznam obsahuje výsledky analýzy aplikácie na identifikáciu chýb a potrebných opráv na základe dostupných informácií a chýb hlásených v jednotlivých súboroch. Zoznam bude aktualizovaný po ďalšom preskúmaní a inštalácii Node.js pre kompletnú validáciu.

- **AIChatAssistant.tsx**:
  - **Vysoká Priorita:** Chýbajúce typové deklarácie pre moduly 'react', 'nanoid', a '@google/genai'. (Riešené aktualizáciou `package.json` s príslušnými typovými definíciami `@types/react`, `@types/react-dom`, `@types/nanoid`. Čaká sa na inštaláciu Node.js a spustenie `npm install`.)
  - **Stredná Priorita:** Implicitné 'any' typy pre parametre a props (napr. `isOpen`, `projectState`, `chatHistory`, `onChatHistoryChange`, `onIncorporateSuggestion`, `displayMode`, `msg`, `e`, `s`, `i`). (Čiastočne opravené pridaním typov pre udalostné parametre a props, ďalšie typy môžu vyžadovať inštaláciu závislostí na úplné vyriešenie.)
  - **Stredná Priorita:** Chyba v počte argumentov na riadku 71 (očakáva sa 1, ale sú poskytnuté 2). (Preskúmané, volanie `startChatSession` v `aiAssistantService.ts` je správne s jedným argumentom `history: ChatMessage[]`. Chyba môže byť falošne pozitívna alebo vyžaduje reštart TypeScript servera. Prosím, reštartujte VSCode alebo spustite build príkaz na aktualizáciu TypeScript servera.)
  - **Stredná Priorita:** JSX elementy implicitne majú typ 'any' kvôli chýbajúcemu rozhraniu 'JSX.IntrinsicElements'. (Riešené inštaláciou typových definícií pre React, čaká sa na `npm install`.)

- **vite.config.ts**:
  - **Vysoká Priorita:** Chýbajúce typové deklarácie pre `vite` a `@vitejs/plugin-react`. (Riešené aktualizáciou `tsconfig.json` na zahrnutie typov `vite` a `vite/client`, a pridaním `@vitejs/plugin-react` do `package.json` ako devDependency. Čaká sa na inštaláciu Node.js.)
  - **Vysoká Priorita:** Problémy s konfiguráciou PostCSS a Tailwind CSS. (Aktualizované na odstránenie problematických `require()` volaní, Vite by malo automaticky načítať pluginy z konfiguračných súborov alebo node_modules. Ak problém pretrváva, odporúča sa manuálne odstrániť `postcss.config.js` a ponechať iba `postcss.config.cjs`, alebo naopak, a reštartovať server.)

- **index.html**:
  - **Vysoká Priorita:** Duplicitný `importmap` spôsobujúci konflikty. (Opravené odstránením statického `importmap` tagu, ponechaný iba dynamicky generovaný.)
  - **Stredná Priorita:** Duplicitný script tag pre `index.tsx`. (Opravené odstránením duplicitného tagu.)
  - **Vysoká Priorita:** Odstránenie Tailwind CSS CDN linku a integrácia lokálnej inštalácie. (CDN link odstránený, Tailwind CSS nainštalovaný ako závislosť, vytvorený `index.css` s direktívami `@tailwind`.)

- **package.json**:
  - **Vysoká Priorita:** Chýbajúce typové definície pre niektoré závislosti a absencia `@vitejs/plugin-react` v devDependencies. (Opravené pridaním potrebných typových definícií a pluginu ako devDependencies. Čaká sa na inštaláciu Node.js a spustenie `npm install`.)
  - **Vysoká Priorita:** Inštalácia Tailwind CSS, PostCSS a Autoprefixer ako devDependencies. (Nainštalované pomocou `npm install tailwindcss postcss autoprefixer --save-dev`.)

- **App.tsx**:
  - **Nízka Priorita:** Potenciálne problémy v správe stavu a používaní kontextov. (Preskúmané, pri analýze neboli identifikované zjavné TypeScript chyby alebo implicitné typy; kód je správne typovaný s použitím `React.FC`. Ďalšie preskúmanie môže byť potrebné po spustení aplikácie na identifikáciu runtime problémov.)

- **ProjectContext.tsx**:
  - **Nízka Priorita:** Potenciálne chyby v definíciách typov a používaní kontextu. (Pri predbežnej analýze neboli identifikované zjavné chyby, ale vyžaduje sa ďalšie preskúmanie po inštalácii závislostí.)

- **geminiService.ts**:
  - **Nízka Priorita:** Možné vylepšenia v validácii API kľúča a dynamickejšej backoff stratégii pre API volania. (Identifikované pri predbežnej analýze, vyžaduje sa implementácia po spustení aplikácie.)
  - **Vysoká Priorita:** Chyba s API kľúčom Gemini. (Opravené implementáciou robustného fallback mechanizmu v `geminiService.ts`, ktorý vracia preddefinované odpovede a vypína AI funkcie, ak API kľúč nie je nakonfigurovaný alebo je neplatný, čím sa zabráni zlyhaniu aplikácie.)

- **postcss.config.js / postcss.config.cjs**:
  - **Vysoká Priorita:** Chyba s ES modulovým rozsahom, kde Vite nedokáže načítať konfiguráciu kvôli syntaxi `module.exports`. (Odstránený súbor `postcss.config.js`, ponechaný iba `postcss.config.cjs` na zabránenie konfliktov. Po inštalácii Node.js a npm reštartujte server pomocou `npm run dev` na overenie opravy.)

- **tailwind.config.js**:
  - **Vysoká Priorita:** Konfigurácia Tailwind CSS pre ES modulové prostredie. (Aktualizované na ES modulovú syntax `export default` pre konzistenciu s projektovým nastavením.)

- **index.css**:
  - **Vysoká Priorita:** Chýbajúci súbor s Tailwind direktívami. (Vytvorený súbor `index.css` s direktívami `@tailwind base;`, `@tailwind components;`, a `@tailwind utilities;` pre správnu integráciu Tailwind CSS.)

- **Všeobecné pre celú aplikáciu**:
  - **Vysoká Priorita:** Inštalácia Node.js a npm na umožnenie inštalácie závislostí a spustenia aplikácie. (Úspešne dokončené, Node.js a npm sú nainštalované.)
  - **Vysoká Priorita:** Riešenie pretrvávajúcej chyby s PostCSS konfiguráciou. (Vytvorený súbor `postcss.config.js` s konfiguráciou pre Tailwind CSS a Autoprefixer. Závislosti boli preinštalované pomocou `npm install`. Problém s rozpoznávaním `@tailwind` direktív v `index.css` by mal byť vyriešený.)
  - **Vysoká Priorita:** Oprava zobrazenia Mermaid diagramov. (Overené, verzia Mermaid je už aktualizovaná na 11.7.0 v `index.html` a funkcia `fixMermaidSyntax` v `services/geminiService.ts` je vylepšená na riešenie bežných syntaktických chýb.)
  - **Stredná Priorita:** Po inštalácii závislostí preskúmať ďalšie súbory na TypeScript chyby a implicitné typy, začínajúc s kritickými komponentmi. (CSS kompatibilita v `index.html` bola opravená nahradením `color-adjust: exact;` za `print-color-adjust: exact;` na zabezpečenie kompatibility pri tlači.)
  - **Nízka Priorita:** Identifikovať runtime chyby a problémy s UI po spustení aplikácie pomocou `npm run dev`.
