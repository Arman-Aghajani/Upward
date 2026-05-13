# Upward

## Informații generale

**Categorie:** Software cu caracter educațional  
**Județ:** București  
**Live:** https://upward-44313.web.app  
**GitHub:** https://github.com/Arman-Aghajani/Upward (cod sursă complet)

## Descriere

**Upward** este o platformă web educațională care transformă învățarea programării într-o experiență de tip joc. Aplicația combină structura unui curriculum riguros cu mecanicile motivaționale din jocurile RPG: progresie vizibilă, ranguri deblocabile, recompense constante, lupte cu Guardians la final de capitol și un mod competitiv de duel cod-versus-cod.

Pilonul tehnologic al platformei este integrarea unui model lingvistic de ultimă generație — Claude, prin API-ul Anthropic — care funcționează simultan ca evaluator automatizat de cod și ca tutor conversațional context-aware. Această alegere permite oferirea de feedback nuanțat și personalizat, un avantaj major față de evaluările automate clasice bazate pe verificarea output-ului.

Upward se adresează elevilor de gimnaziu și liceu fără experiență anterioară în programare, dar și oricărei persoane care preferă o abordare gamificată în detrimentul tutorialelor tradiționale. Curriculum-ul actual acoperă trei limbaje fundamentale — Python, HTML și CSS — structurate în 18 lecții interactive.

## Funcționalități

1. **Sistem de autentificare și sincronizare cloud**
   - Înregistrare și login prin Firebase Authentication
   - Recuperare de parolă prin email
   - Sincronizare progres (XP, rang, lecții completate) în Cloud Firestore între dispozitive

2. **Hartă interactivă a cursurilor (CourseMap)**
   - Vizualizare a celor trei trasee de învățare: Python, HTML, CSS
   - Lecții deblocabile progresiv
   - Acces direct la modulele Practice, Duel Mode și camerele Guardians

3. **18 lecții interactive**
   - 6 lecții Python (variabile, condiții, bucle, funcții, liste & dicționare, șiruri & algoritmi)
   - 6 lecții HTML (structură, text, link-uri & imagini, liste & tabele, formulare, semantic HTML)
   - 6 lecții CSS (culori, fonturi, spațiere, selectori, flexbox & box model, poziționare)
   - Fiecare lecție combină teorie, exemple vizuale, exerciții practice și recompensă XP la finalizare

4. **Sistem de ranguri și progresie RPG**
   - Șase ranguri deblocabile: E → D → C → B → A → S → National
   - Fiecare rang are propriul prag XP și propriul Guardian de înfruntat
   - Sistem motivațional inspirat din jocurile RPG

5. **Practice — evaluare AI a codului**
   - Probleme libere de antrenament pentru fiecare rang
   - Cod scris de utilizator trimis spre evaluare AI
   - Feedback narativ personalizat în limba română prin Anthropic Claude

6. **Duel Mode — competiție cod-versus-cod**
   - Două panouri paralele, aceeași problemă, același timer
   - AI-ul evaluează ambele soluții
   - Câștigătorul primește XP bonus

7. **Guardians (Boss Battles)**
   - La final de rang, utilizatorul se confruntă cu un Guardian
   - Set de probleme tematice mai dificile, cronometrate
   - Probleme reprezentative: prime up to N, Caesar cipher, recursive factorial, flatten nested list, Fibonacci recursion trace
   - Înfrângerea Guardianului deblochează rangul următor

8. **AI Tutor context-aware**
   - Bulă plutitoare de chat disponibilă pe orice pagină
   - System prompt construit dinamic, ancorat în lecția curentă a utilizatorului
   - Răspunsuri specifice contextului, nu generice

9. **Teste de evaluare**
   - Teste structurate pentru fiecare limbaj (Python, HTML, CSS)
   - Două niveluri de dificultate per limbaj
   - Validare a cunoștințelor acumulate

## Tehnologii

Aplicația **Upward** a fost construită folosind:

- **HTML5, CSS3 și JavaScript ES6+** — frontend modular, fără framework de UI, optimizat pentru încărcare rapidă pe orice device
- **Firebase Authentication** — autentificare utilizatori cu email și parolă
- **Cloud Firestore** — bază de date NoSQL pentru sincronizarea progresului între dispozitive
- **Firebase Hosting** — găzduire frontend cu CDN global și HTTPS automat
- **Firebase Cloud Functions** — backend serverless pentru integrarea securizată cu API-ul AI
- **Google Secret Manager** — stocare criptată a cheilor API
- **Anthropic Claude API** — model lingvistic pentru evaluare de cod și tutor conversațional
- **Press Start 2P** — tipografie pixel-art pentru identitatea vizuală
- **Material Symbols** — iconografie consistentă

## Arhitectură de securitate

Cheia API pentru Anthropic Claude este stocată criptat în Google Secret Manager și accesată exclusiv prin Cloud Functions. Frontend-ul nu are niciodată acces direct la cheie — toate request-urile către AI trec printr-o funcție serverless de tip proxy. Această arhitectură garantează că, chiar dacă codul frontend e inspectat de utilizator sau accesat public pe GitHub, cheia API rămâne protejată.

Datele utilizatorilor în Firestore sunt securizate prin Security Rules per UID — doar utilizatorul autentificat își poate citi și scrie propriile date.

## Aplicație educațională

Upward poate fi utilizat ca instrument complementar în educația formală și non-formală:

- **În școli** — laboratoare de informatică, recapitulări, evaluări gamificate
- **În activități extracurriculare** — cluburi de programare, tabere de tehnologie
- **Pentru învățare individuală acasă** — alternativă motivațională la tutorialele clasice

## Cerințe de sistem

- **Acces:** orice browser modern (Chrome, Firefox, Safari, Edge) pe desktop sau mobil
- **Conexiune internet:** necesară pentru sincronizare cloud și evaluare AI
- **Instalare:** nu este necesară — aplicația rulează direct în browser

## Realizator

**Aghajani Arman**
- Școala: Colegiul Național Tudor Vladimirescu, București
- Județ: București

Proiect dezvoltat individual pentru **Olimpiada de Inovare și Creație Digitală — InfoEducație 2026**.
