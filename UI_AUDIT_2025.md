# UI Audit & 2025 Design Alignment

## 1) Audit aktuálneho stavu

### Silné stránky
- Aplikácia je modulárna (React komponenty, Context API) a má jasný workflow od zadania projektu po workspace.
- Už dnes má dobrú funkčnú štruktúru: header, formulár, tab workspace, AI asistent, dokumentácia.
- Používa utility-first prístup (Tailwind triedy), čo je vhodné pre rýchly dizajnový iteratívny proces.

### Medzery voči 2025 praxi
- Vizualita bola prevažne „flat dark panel“ bez výraznej vizuálnej hierarchie sekcií.
- Interakčné prvky nemali jednotný systém (rozdielne štýly tlačidiel, panelov, focus states).
- Home obrazovka mala nižšiu informačnú gradáciu pre onboarding (chýbali quick-start bloky).
- Responsívne správanie headera bolo funkčné, ale nie optimálne pre hustý počet akcií.

## 2) State-of-the-art web dizajn praktiky pre 2025
- **Adaptive clarity:** menej vizuálneho šumu, viac kontextových panelov a jasná priorita CTA.
- **Token-driven UI:** konzistentné reusable štýly (napr. `glass-panel`, `btn-primary`) pre znižovanie dizajn debt.
- **Accessible by default:** vysoký kontrast, robustné focus stavy, čitateľné veľkosti písma a jasné labely.
- **Progressive onboarding:** micro-guidance priamo v rozhraní (quick-start, contextual hints).
- **Responsive orchestration:** header/actions navrhnuté tak, aby sa prirodzene „balili“ na menších šírkach.
- **Subtle depth & motion:** jemné ambientné vrstvy (blur/gradient glow), bez rušivých animácií.

## 3) Tri nové dizajnové návrhy

### Návrh A — Aurora Command Center (implementovaný)
- **Idea:** Glassmorphism + hlboké gradientné pozadie + svetelné akcenty pre „AI control room“.
- **UX cieľ:** Rýchle zadanie požiadavky, jasná orientácia v hlavných akciách.
- **Kľúčové prvky:** sticky translucent header, quick-start panel, konzistentné CTA.

### Návrh B — Editorial Forest Grid
- **Idea:** Viac editorial typografie, vysoká čitateľnosť, sekcie oddelené jemnou textúrou.
- **UX cieľ:** Lepšie spracovanie dlhších textov a dokumentácie.
- **Kľúčové prvky:** širšie riadkovanie, silnejšie heading hierarchy, oddelené „content rails“.

### Návrh C — Conversational Workspace Flow
- **Idea:** Primárny dôraz na AI asistenta a iteráciu krokov v „chat-first“ rozložení.
- **UX cieľ:** Minimalizovať prepínanie kontextu medzi plánovaním, otázkami a dokumentmi.
- **Kľúčové prvky:** persistent assistant rail, action chips, workflow timeline v hornej časti.

## 4) Implementačné rozhodnutie
Aktuálna aktualizácia UI implementuje **Návrh A (Aurora Command Center)**, pretože najlepšie spája moderný vizuál, responzívnosť a nízke riziko regresie pre existujúci workflow.
