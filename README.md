# Upward

## Informații generale

**Categorie:** Software cu caracter educațional
**Județ:** București
**Live:** https://upward-44313.web.app
**GitHub:** https://github.com/Arman-Aghajani/Upward (cod sursă complet)

## 1. Descriere generală

**Upward** este o platformă web educațională care transformă învățarea programării într-o experiență de tip joc de rol (RPG). În loc de tutoriale statice și exerciții izolate, elevul urmează un traseu de progresie vizibilă: lecții care se deblochează pe rând, un sistem de ranguri de la **E** până la **National**, Gardieni (bosses) de învins la finalul fiecărui rang, provocări zilnice și un mod de duel live împotriva altui elev.

Ce diferențiază Upward de un curs clasic sau de o platformă de exerciții este modul în care e verificat codul scris de elev: fiecare soluție trece printr-un **motor de execuție reală** (Piston, auto-găzduit), nu printr-o simplă comparație de text, iar apoi — acolo unde e cazul — un model lingvistic (Claude Haiku, prin API-ul Anthropic) verifică dacă *metoda* folosită respectă cerința problemei (de exemplu interzicerea unor funcții built-in), oferind și feedback narativ personalizat. Astfel, evaluarea combină rigoarea unui judge clasic de concurs cu nuanța unui tutor uman.

Platforma se adresează elevilor de gimnaziu și liceu fără experiență anterioară în programare, dar și oricărei persoane care preferă o abordare gamificată în locul tutorialelor tradiționale. Curriculum-ul acoperă trei limbaje fundamentale ale dezvoltării web — **Python, HTML și CSS** — structurate în **45 de lecții interactive** (15 per limbaj).

## 2. Funcționalități

### 2.1. Autentificare și sincronizare cloud
- Înregistrare și autentificare prin **Firebase Authentication** (email + parolă)
- Progresul (XP, rang, lecții, probleme rezolvate, boss-uri învinse, streak zilnic) e salvat în **Cloud Firestore**, sincronizat automat între dispozitive
- La prima logare se creează automat un document de utilizator cu valori implicite; documentele mai vechi sunt migrate transparent cu orice câmp nou adăugat ulterior în platformă

### 2.2. Harta cursurilor și cele 45 de lecții
- **CourseMap** — hub central cu acces la cele trei trasee de învățare (HTML, CSS, Python), harta interactivă, Duel Mode, Guardian Trials, Practice, Leaderboard și progres
- Trei limbaje × 15 lecții fiecare:
  - **Python (15):** de la sintaxă și tipuri de date, la condiții, bucle, funcții, scope, string-uri, liste, comprehensions, dicționare, tupluri/seturi și tratarea erorilor
  - **HTML (15):** structură de document, text, link-uri, imagini, liste, tabele, formulare (2 lecții), block vs. inline, atribute globale, head & meta, HTML semantic, multimedia, elemente HTML5 moderne
  - **CSS (15):** selectori, culori, tipografie, box model, margin/padding, display, poziționare, Flexbox (2 lecții), Grid, pseudo-clase/pseudo-elemente, tranziții și transformări, variabile CSS, design responsive
- **Interactive Map** (`mapBuildingWeb.html`) — o hartă vizuală de tip „lume deblocabilă” care leagă lecțiile de teme (HTML/CSS/Python) și oferă acces direct la Daily Challenge pentru fiecare limbaj
- Fiecare lecție combină teorie, exemple și recompensă XP la finalizare

### 2.3. Sistem de ranguri și progresie (XP centralizat)
- Șapte ranguri: **E → D → C → B → A → S → National**, urmate de un prag simbolic „MAX RANK”
- Praguri de XP per rang: E→D 100, D→C 150, C→B 200, B→A 250, A→S 300, S→National 400
- Toată logica de acordare XP și avansare în rang trece printr-o singură sursă de adevăr, `storage.gainXP()`, care face **scrierea atomică** a XP-ului rămas și a noului rang într-un singur `update()` Firestore — esențial pentru ca regulile de securitate să poată verifica simultan scăderea XP-ului „consumat” și creșterea rangului, inclusiv atunci când un singur bonus de XP depășește mai multe praguri deodată (carry-over pe mai multe ranguri într-o singură tranzacție)
- Animație dedicată de „Rank Up” (`rankup.js`) la fiecare avansare

### 2.4. Guardian Trials (Boss Battles)
- La finalul fiecărui rang, elevul înfruntă un Gardian tematic, cronometrat:

| Rang | Gardian | Timp | Probleme |
|---|---|---|---|
| E | The Apprentice | 6 min | Count to Five, Positive/Negative/Zero, What Does range() Produce? |
| D | The Cipher | 7 min | List Average, Count Occurrences, Loop Output |
| C | The Strategist | 8 min | Filter Odd Numbers, Name Greeting, String Method |
| B | The Forger | 9 min | Remove Duplicates, Word Frequency, List Slicing |
| A | The Sage | 10 min | Prime Numbers, Most Frequent Character, Dictionary Comprehension |
| S | The Master Sentinel | 12 min | Memoized Fibonacci, Sum of Digits, Accumulator Trace |
| National | The Architect | 15 min | Find First Negative, Count Common Characters, Recursive Trace |

- Fiecare luptă are 2 probleme de cod (executate prin Piston, apoi validate algoritmic de AI) și o întrebare grilă de tip „ce afișează acest cod?”
- Fiecare lovitură reușită scade HP-ul Gardianului (35 / 35 / 30); la 0 HP, Gardianul e învins, elevul primește **+50 XP** și boss-ul e marcat definitiv ca finalizat
- Dacă timpul expiră înainte de înfrângerea Gardianului, elevul pierde lupta și trebuie să reîncerce

### 2.5. Practice Problems — evaluare duală
- Probleme de antrenament libere, independente de Guardian Trials, câte 3 pentru fiecare rang (2 probleme de cod + 1 grilă)
- Evaluare în doi pași, pentru fiecare submisie de cod:
  1. **Piston** rulează efectiv codul elevului pe cazurile de test — acesta e verdictul final de corectitudine, nu o presupunere a AI-ului
  2. Dacă testele trec și problema impune o restricție de metodă (ex. „fără `set()`”, „fără `sorted()`”, „fără `.count()`”), **Claude Haiku** verifică strict dacă restricția a fost respectată; altfel, AI-ul oferă doar feedback narativ de încurajare/corectare
- Recompensă: **+10 XP** la prima rezolvare corectă a fiecărei probleme

### 2.6. Daily Challenge
- Provocare zilnică, generată dinamic de AI pentru fiecare dintre cele trei tipuri (Python / HTML / CSS), calibrată automat pe rangul curent al elevului
- Problema zilei e **cache-uită în Firestore** (`dailyChallenge/{uid}/{tip}/{dată}`) — regenerarea are loc o singură dată per zi per utilizator per tip; la refresh, pagina o încarcă din cache în loc să o genereze din nou
- Pentru Python, testele generate de AI sunt verificate automat prin Piston înainte de a fi acceptate ca problemă validă (până la 3 încercări de generare)
- Evaluare: Piston pentru Python (execuție reală), respectiv verdict AI explicit („VERDICT: PASS/FAIL”) pentru HTML/CSS
- **Streak tracking** — numără zilele consecutive în care elevul a rezolvat provocarea, afișat ca banner motivațional
- Recompensă: **+20 XP**, o singură dată pe zi per tip de provocare

### 2.7. Duel Mode
- Matchmaking **în timp real prin Firestore**: elevul intră într-o coadă (`queue`), iar când apare un al doilea jucător de rang similar, unul dintre cei doi clienți creează documentul de duel (`duels`) cu o problemă generată dinamic de AI, calibrată pe rangul minim al celor doi combatanți
- Fiecare jucător primește propriul editor și rezolvă aceeași problemă contra cronometru (5 minute)
- Verdictul e dat exclusiv de **Piston** (execuție reală) — primul jucător care trimite o soluție ce trece toate testele câștigă instant duelul
- **Forfeit automat la schimbarea tab-ului** — dacă un jucător părăsește pagina în timpul duelului, pierde automat, iar adversarul e declarat câștigător
- Câștigătorul primește **+30 XP**; dacă timpul expiră fără nicio soluție corectă, duelul se încheie fără câștigător

### 2.8. Leaderboard
- Clasament global, sortat după rang și apoi după XP, cu podium pentru primii 3 și evidențierea poziției proprii chiar dacă elevul nu se află în top 100

### 2.9. AI Tutor context-aware
- Widget de chat disponibil pe lecții, probleme și provocări, injectat printr-un singur script reutilizabil (`AI-Tutor/chat.js`)
- Fiecare pagină poate seta `window.LESSON_CONTEXT` înainte de încărcarea script-ului — AI-ul primește acest context în system prompt și oferă răspunsuri ancorate în lecția/problema curentă, nu generice
- Politică explicită de „hint-only”: tutorul ghidează și explică, dar nu oferă niciodată soluția completă a unei probleme

## 3. Arhitectură tehnică

Upward este construit pe un model **serverless**, fără server de backend gestionat manual:

- **Firebase Authentication** — gestionează contul și sesiunea fiecărui utilizator
- **Cloud Firestore** — bază de date NoSQL pentru progres, coadă de matchmaking, duel-uri live, leaderboard și cache-ul provocărilor zilnice; sincronizare în timp real prin `onSnapshot`
- **Firebase Hosting** — găzduiește frontend-ul static (HTML/CSS/JS), cu CDN global și HTTPS automat
- **Firebase Cloud Functions** (Node.js, `firebase-functions` v2) — expune patru funcții apelabile din client:
  - `runCode` — trimite codul elevului către Piston împreună cu cazurile de test și întoarce verdictul de corectitudine
  - `api` — proxy securizat către Anthropic Claude, folosit atât de evaluarea de algoritm, cât și de AI Tutor și feedback-ul narativ
  - `generateDaily` — generează provocarea zilnică (prompt calibrat pe rang și temă), validează testele Python prin Piston înainte de a le accepta, cu până la 3 reîncercări
  - `generateDuelProblem` — generează problema unui duel, calibrată pe rangul minim al celor doi jucători, cu aceeași validare Piston
- **Piston** — motor de execuție de cod open-source, **auto-găzduit** pe o instanță Oracle Cloud (VM proprie, containerizată cu Docker, izolare la nivel de proces prin cgroup v2), folosit pentru a rula efectiv codul Python trimis de elevi, nu doar pentru a-l analiza static
- **Anthropic API (Claude Haiku)** — folosit pentru: verificarea metodei/algoritmului la Practice și Guardian Trials, generarea de probleme pentru Daily Challenge și Duel Mode, feedback narativ personalizat și conversațiile din AI Tutor
- **Google Secret Manager** — stochează criptat cheia API Anthropic, injectată în Cloud Functions prin `defineSecret`

## 4. Arhitectură de securitate

- **Cheia API Anthropic nu ajunge niciodată în frontend.** Toate apelurile către Claude trec printr-o singură Cloud Function proxy (`api`), care citește cheia din Google Secret Manager la runtime. Chiar dacă întregul cod sursă e public pe GitHub, cheia rămâne inaccesibilă.
- **App Check activat pe toate funcțiile apelabile** (`enforceAppCheck: true`) — reduce riscul ca funcțiile Cloud (și, implicit, costurile API asociate) să fie apelate din afara aplicației reale.
- **Firestore Security Rules per UID** — fiecare utilizator autentificat poate citi și scrie exclusiv propriile date de progres; scrierile critice (XP + rang) sunt gândite ca operații atomice tocmai pentru ca regulile de securitate să poată valida coerent tranziția dintr-o singură cerere.
- **Piston rulează izolat, pe o mașină separată de restul infrastructurii** — execuția codului nesigur trimis de utilizatori nu are acces la Firestore, la cheile API sau la restul serviciilor platformei; singura suprafață de contact e un apel HTTP simplu (cod + stdin → stdout/stderr).
- **Validare server-side a input-ului** în toate Cloud Functions (tip, prezență, limite — ex. maximum 20 de cazuri de test per submisie), pentru a preveni abuzul motorului de execuție.

## 5. Tehnologii folosite

- **HTML5, CSS3, JavaScript (ES6+)** — frontend modular, fără framework UI, optimizat pentru încărcare rapidă
- **CodeMirror 5** — editor de cod cu evidențiere de sintaxă Python, folosit în Practice, Daily Challenge, Guardian Trials și Duel Mode
- **Firebase Authentication, Cloud Firestore, Firebase Hosting, Cloud Functions (v2), Firebase App Check** — platforma cloud completă a aplicației
- **Node.js** — runtime-ul Cloud Functions
- **Google Secret Manager** — gestionarea securizată a cheilor API
- **Piston** — motor open-source de execuție de cod, auto-găzduit pe **Oracle Cloud Infrastructure** (VM + Docker + cgroup v2)
- **Anthropic API — Claude Haiku** — evaluare de algoritm, generare de probleme, feedback narativ, tutor conversațional
- **Press Start 2P** — tipografie pixel-art pentru identitatea vizuală RPG
- **Material Symbols** — iconografie

## 6. Cerințe de sistem

- **Acces:** orice browser modern (Chrome, Firefox, Safari, Edge), pe desktop sau mobil, la adresa https://upward-44313.web.app
- **Conexiune internet:** necesară pentru autentificare, sincronizarea progresului, execuția de cod prin Piston și evaluările AI
- **Instalare:** niciuna — aplicația rulează integral în browser, fără plugin-uri sau extensii

## 7. Realizator

**Aghajani Arman**
- Școala: Colegiul Național Tudor Vladimirescu, București
- Județ: București

Proiect dezvoltat individual pentru **Olimpiada de Inovare și Creație Digitală — InfoEducație 2026**.