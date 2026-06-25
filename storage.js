// ─── LOADING SCREEN ────────────────────────────────────────────────────────────

(function injectLoadingScreen() {
    const style = document.createElement('style');
    style.textContent = `
        #upward-loading {
            position: fixed;
            inset: 0;
            background: #020223;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 28px;
            transition: opacity 0.4s ease;
        }
        #upward-loading.hide {
            opacity: 0;
            pointer-events: none;
        }
        .ul-logo {
            font-family: 'Press Start 2P', monospace;
            font-size: 22px;
            color: #FFD700;
            text-shadow: 0 0 20px rgba(255,215,0,0.5);
            letter-spacing: 2px;
        }
        .ul-bar-container {
            width: 200px;
            height: 6px;
            background: rgba(255,255,255,0.08);
            border-radius: 3px;
            overflow: hidden;
        }
        .ul-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #00ff99, #FFD700);
            border-radius: 3px;
            animation: ulPulse 1.2s ease infinite;
        }
        @keyframes ulPulse {
            0%   { width: 0%; }
            50%  { width: 70%; }
            100% { width: 100%; }
        }
        .ul-text {
            font-family: 'Press Start 2P', monospace;
            font-size: 8px;
            color: rgba(255,255,255,0.3);
            letter-spacing: 2px;
        }
    `;
    document.head.appendChild(style);

    const div = document.createElement('div');
    div.id = 'upward-loading';
    div.innerHTML = `
        <div class="ul-logo">Upward</div>
        <div class="ul-bar-container"><div class="ul-bar-fill"></div></div>
        <div class="ul-text">Loading your progress...</div>
    `;
    // Inserăm imediat ce body-ul există
    if (document.body) {
        document.body.appendChild(div);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(div));
    }
})();

document.head.insertAdjacentHTML('beforeend', '<link rel="icon" type="image/png" href="/logos/favicon.png"><link rel="apple-touch-icon" href="/logos/favicon.png">');

function hideLoadingScreen() {
    const el = document.getElementById('upward-loading');
    if (!el) return;
    el.classList.add('hide');
    setTimeout(() => el.remove(), 450);
}

// ─── STRUCTURA DATELOR ─────────────────────────────────────────────────────────
//
// Firestore: colecția "users", document cu ID = UID-ul userului
// {
//   name: string,
//   email: string,
//   xp: number,
//   rankIndex: number,
//   lessonsCompleted: number,
//   createdAt: string,
//   bosses: {
//     e: bool, d: bool, c: bool, b: bool, a: bool, s: bool, national: bool
//   },
//   practice: {
//     e_1: bool, e_2: bool, e_3: bool,
//     d_1: bool, ... national_3: bool
//   },
//   lessons: {
//     html_structure: bool, html_text: bool, html_links: bool,
//     html_lists: bool, html_forms: bool, html_semantic: bool,
//     css_colors: bool, css_fonts: bool, css_spacing: bool,
//     css_selectors: bool, css_boxmodel: bool, css_positioning: bool,
//     py_var: bool, py_conditions: bool, py_loops: bool,
//     py_functions: bool, py_lists: bool, py_strings: bool
//   }
// }

// ─── STATE LOCAL (cache in-memory) ─────────────────────────────────────────────

const storage = {

    _uid: null,
    _data: null,      // cache complet al documentului Firestore
    _db: null,

    // Constante de progresie — singura definiție din proiect.
    // Lungimea XP_NEEDED = RANKS.length - 1 (ultimul rank nu are prag).
    RANKS: ["E", "D", "C", "B", "A", "S", "National", "MAX RANK"],
    XP_NEEDED: [100, 150, 200, 250, 300, 400, Infinity],

    // ─── INIȚIALIZARE ──────────────────────────────────────────────────────────
    // Apelează această funcție la începutul fiecărei pagini care afișează progres.
    // Returnează o promisiune — pagina se afișează doar după ce datele sunt încărcate.
    //
    // Folosire:
    //   storage.init().then(() => {
    //       // populează UI-ul cu storage.getXP() etc
    //       hideLoadingScreen();
    //   });

    init() {
        return new Promise((resolve, reject) => {
            // Așteptăm ca Firebase să fie disponibil (firebase-init.js se încarcă după)
            const waitForFirebase = setInterval(() => {
                if (typeof firebase === 'undefined' || !firebase.auth) return;
                clearInterval(waitForFirebase);

                this._db = firebase.firestore();

                firebase.auth().onAuthStateChanged(async (user) => {
                    if (!user) {
                        // Nu e logat — redirecționăm la login
                        // (excepție: paginile de auth nu apelează storage.init())
                        hideLoadingScreen();
                        window.location.href = '../AccountManagement/Login.html';
                        return;
                    }

                    this._uid = user.uid;

                    try {
                        const docSnap = await this._db.collection('users').doc(this._uid).get();
                        if (docSnap.exists) {
                            this._data = docSnap.data();

                            // Migrare: completează câmpurile lipsă din documente vechi
                            const def = this._defaultData(user);
                            const patch = {};
                            for (const key of ['bosses', 'practice', 'lessons', 'dailyDone']) {
                                if (!this._data[key]) {
                                    this._data[key] = def[key];
                                    patch[key] = def[key];
                                }
                            }
                            for (const key of ['rankIndex', 'lessonsCompleted', 'createdAt']) {
                                if (this._data[key] === undefined) {
                                    this._data[key] = def[key];
                                    patch[key] = def[key];
                                }
                            }
                            if (Object.keys(patch).length > 0) {
                                await this._db.collection('users').doc(this._uid).update(patch);
                            }
                        } else {
                            // Document lipsă — creăm unul gol
                            this._data = this._defaultData(user);
                            await this._db.collection('users').doc(this._uid).set(this._data);
                        }

                        // Sincronizăm user_name în localStorage (pentru welcome text)
                        localStorage.setItem('user_name', this._data.name || 'Adventurer');
                        localStorage.setItem('current_user', this._uid);

                        resolve(this._data);
                    } catch (err) {
                        console.error('storage.init error:', err);
                        hideLoadingScreen();
                        reject(err);
                    }
                });
            }, 50);
        });
    },

    _defaultData(user) {
        return {
            name: user.displayName || localStorage.getItem('user_name') || 'Adventurer',
            email: user.email || '',
            xp: 0,
            rankIndex: 0,
            lessonsCompleted: 0,
            createdAt: new Date().toISOString(),
            bosses: {
                e: false, d: false, c: false,
                b: false, a: false, s: false, national: false
            },
            practice: {
                e_1: false, e_2: false, e_3: false,
                d_1: false, d_2: false, d_3: false,
                c_1: false, c_2: false, c_3: false,
                b_1: false, b_2: false, b_3: false,
                a_1: false, a_2: false, a_3: false,
                s_1: false, s_2: false, s_3: false,
                national_1: false, national_2: false, national_3: false
            },
            lessons: {
                // HTML
                html_l1: false, html_l2: false, html_l3: false, html_l4: false, html_l5: false,
                html_l6: false, html_l7: false, html_l8: false, html_l9: false, html_l10: false,
                html_l11: false, html_l12: false, html_l13: false, html_l14: false, html_l15: false,
                // CSS (keep as-is)
                css_l1: false, css_l2: false, css_l3: false, css_l4: false, css_l5: false,
                css_l6: false, css_l7: false, css_l8: false, css_l9: false, css_l10: false,
                css_l11: false, css_l12: false, css_l13: false, css_l14: false, css_l15: false,
                // Python
                py_l1: false, py_l2: false, py_l3: false, py_l4: false, py_l5: false,
                py_l6: false, py_l7: false, py_l8: false, py_l9: false, py_l10: false,
                py_l11: false, py_l12: false, py_l13: false, py_l14: false, py_l15: false
            },

            dailyDone: {}
        };
    },

    // Scrie un câmp sau subcâmp în Firestore și actualizează cache-ul local
    async _save(fieldPath, value) {
        if (!this._uid || !this._db) return;
        try {
            await this._db.collection('users').doc(this._uid).update({ [fieldPath]: value });
        } catch (err) {
            console.error('storage._save error:', err, fieldPath, value);
        }
    },

    // ─── PROGRES ───────────────────────────────────────────────────────────────

    getXP() {
        return this._data?.xp ?? 0;
    },

    async setXP(value) {
        this._data.xp = value;
        await this._save('xp', value);
        await this._db.collection('leaderboard').doc(this._uid).set({
            name: this._data.name,
            xp: value,
            rankIndex: this._data.rankIndex
        });
    },

    async addXP(amount) {
        const newXP = (this._data?.xp ?? 0) + Number(amount);
        this._data.xp = newXP;
        await this._save('xp', newXP);
        // sync leaderboard
        await this._db.collection('leaderboard').doc(this._uid).set({
            name: this._data.name,
            xp: newXP,
            rankIndex: this._data.rankIndex
        });
    },

    // ─── RANKUP CENTRALIZAT ──────────────────────────────────────────────────────
    // SINGURA sursă de adevăr pentru XP + rankup. Lecțiile, boss-urile, practice și
    // daily challenge cheamă DOAR asta când acordă XP — nu mai face nimeni calcul manual.
    //
    // Folosire:
    //   const newRank = await storage.gainXP(10);
    //   if (newRank) showRankUpAnimation(newRank);
    //
    // Întoarce numele noului rank (string) dacă userul a urcat, altfel null.
    // while = procesează corect și salturile peste mai multe praguri deodată.
    // Carry-over: surplusul de XP peste prag se reportează la noul rank.

    async gainXP(amount) {
        let xp = (this._data?.xp ?? 0) + Number(amount);
        let ri = this._data?.rankIndex ?? 0;
        let rankedUp = null;

        while (ri < this.RANKS.length - 1 && xp >= this.XP_NEEDED[ri]) {
            xp -= this.XP_NEEDED[ri];
            ri++;
            rankedUp = this.RANKS[ri];
        }

        // SCRIERE ATOMICĂ: xp și rankIndex într-un SINGUR update.
        // Esențial pentru Security Rules — regula trebuie să vadă scăderea de xp
        // și creșterea de rankIndex în aceeași operație, altfel respinge carry-over-ul.
        this._data.xp = xp;
        this._data.rankIndex = ri;
        if (this._uid && this._db) {
            try {
                await this._db.collection('users').doc(this._uid).update({
                    xp: xp,
                    rankIndex: ri
                });
            } catch (err) {
                console.error('storage.gainXP save error:', err, { xp, ri });
            }
        }
        await this._db.collection('leaderboard').doc(this._uid).set({
            name: this._data.name,
            xp: xp,
            rankIndex: ri
        });

        return rankedUp;
    },

    getRankIndex() {
        return this._data?.rankIndex ?? 0;
    },

    async setRankIndex(value) {
        this._data.rankIndex = value;
        await this._save('rankIndex', value);
    },

    getLessonsCompleted() {
        return this._data?.lessonsCompleted ?? 0;
    },

    async addLesson() {
        const newCount = (this._data?.lessonsCompleted ?? 0) + 1;
        this._data.lessonsCompleted = newCount;
        await this._save('lessonsCompleted', newCount);
    },

    // ─── IDENTITATE ────────────────────────────────────────────────────────────

    getUserName() {
        return this._data?.name || 'Adventurer';
    },

    getUserID() {
        return this._uid;
    },

    getUserEmail() {
        return this._data?.email || '';
    },

    async setUserName(value) {
        this._data.name = value;
        await this._save('name', value);
        localStorage.setItem('user_name', value);
    },

    // ─── BOSS-URI ──────────────────────────────────────────────────────────────
    // rank = 'e' | 'd' | 'c' | 'b' | 'a' | 's' | 'national'

    isBossDone(rank) {
        return this._data?.bosses?.[rank] === true;
    },

    async markBossDone(rank) {
        this._data.bosses[rank] = true;
        await this._save('bosses.' + rank, true);
    },

    // ─── PRACTICE ──────────────────────────────────────────────────────────────
    // key = ex: 'e_1', 'national_3'

    isPracticeDone(key) {
        return this._data?.practice?.[key] === true;
    },

    async markPracticeDone(key) {
        this._data.practice[key] = true;
        await this._save('practice.' + key, true);
    },

    // ─── LECȚII ────────────────────────────────────────────────────────────────
    // key = ex: 'py_lists', 'html_forms', 'css_boxmodel'
    // (fără prefixul 'lesson_' — storage.js îl gestionează intern)

    isLessonDone(key) {
        return this._data?.lessons?.[key] === true;
    },

    async markLessonDone(key) {
        this._data.lessons[key] = true;
        await this._save('lessons.' + key, true);
    },

    // ─── DUEL / MATCHMAKING ────────────────────────────────────────────────────────

    async joinQueue() {
        if (!this._uid || !this._db) return;
        await this._db.collection('queue').doc(this._uid).set({
            uid: this._uid,
            name: this._data.name,
            rankIndex: this._data.rankIndex,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async listenQueue(onMatched) {
        if (!this._uid || !this._db) return;
        let matched = false;

        const unsubscribe = this._db.collection('queue')
            .orderBy('joinedAt')
            .onSnapshot(async (snap) => {
                if (matched) return;

                const myDoc = snap.docs.find(d => d.id === this._uid);
                const others = snap.docs.filter(d => d.id !== this._uid);

                // ── P2: documentul meu a dispărut → caut duelul creat de P1 ──
                if (!myDoc) {
                    const duelSnap = await this._db.collection('duels')
                        .where('p2.uid', '==', this._uid)
                        .where('status', '==', 'active')
                        .limit(1)
                        .get();

                    if (!duelSnap.empty) {
                        matched = true;
                        unsubscribe();
                        onMatched(duelSnap.docs[0].id, 2);
                    }
                    return;
                }

                // ── P1: eu sunt în queue, există adversar, UID mai mic → creez duelul ──
                if (others.length === 0) return;

                const opponent = others[0].data();
                if (this._uid > opponent.uid) return;

                matched = true;
                const problemRank = Math.min(this._data.rankIndex, opponent.rankIndex);
                const problem = await this.generateDuelProblem(problemRank);

                const duelRef = await this._db.collection('duels').add({
                    p1: { uid: this._uid, name: this._data.name },
                    p2: { uid: opponent.uid, name: opponent.name },
                    problem: problem,
                    status: 'active',
                    startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    winner: null,
                    p1Code: '',
                    p2Code: '',
                    p1Submitted: false,
                    p2Submitted: false
                });

                await this._db.collection('queue').doc(this._uid).delete();
                await this._db.collection('queue').doc(opponent.uid).delete();

                unsubscribe();
                onMatched(duelRef.id, 1);
            });

        return unsubscribe;
    },

    async leaveQueue() {
        if (!this._uid || !this._db) return;
        await this._db.collection('queue').doc(this._uid).delete();
    },

    listenDuel(duelId, onUpdate) {
        if (!this._uid || !this._db) return;
        return this._db.collection('duels').doc(duelId)
            .onSnapshot(snap => {
                if (snap.exists) onUpdate(snap.data());
            });
    },

    async updateDuelCode(duelId, player, code) {
        if (!this._uid || !this._db) return;
        await this._db.collection('duels').doc(duelId).update({
            [`p${player}Code`]: code
        });
    },

    async submitDuelResult(duelId, player, passed) {
        if (!this._uid || !this._db) return;
        if (!passed) return;
        await this._db.collection('duels').doc(duelId).update({
            status: player === 1 ? 'p1_wins' : 'p2_wins',
            winner: this._data.name
        });
    },

    async forfeitDuel(duelId, player) {
        if (!this._uid || !this._db) return;
        const duelSnap = await this._db.collection('duels').doc(duelId).get();
        const duel = duelSnap.data();
        const winnerName = player === 1 ? duel.p2.name : duel.p1.name;
        await this._db.collection('duels').doc(duelId).update({
            status: player === 1 ? 'p2_wins' : 'p1_wins',
            winner: winnerName
        });
    },

    async generateDuelProblem(rankIndex) {
        const fn = firebase.functions().httpsCallable('generateDuelProblem');
        const result = await fn({ rankIndex: rankIndex ?? this._data.rankIndex });
        return result.data.problem;
    },


};