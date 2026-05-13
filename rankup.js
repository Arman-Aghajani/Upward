// ===== RANK UP ANIMATION SYSTEM =====
// Include this script in CourseMap.html and any page that awards XP
// Call checkRankUp() after any XP award

const RANK_NAMES = ["E", "D", "C", "B", "A", "S", "National", "MAX RANK"];
const XP_NEEDED = [100, 150, 200, 250, 300, 400, Infinity];

function checkRankUp() {
    let rankIndex = Number(localStorage.getItem("rankIndex")) || 0;
    let xp = Number(localStorage.getItem("xp")) || 0;

    let ranked = false;

    while (rankIndex < RANK_NAMES.length - 1 && xp >= XP_NEEDED[rankIndex]) {
        xp -= XP_NEEDED[rankIndex];
        rankIndex++;
        ranked = true;
    }

    if (ranked) {
        localStorage.setItem("rankIndex", rankIndex);
        localStorage.setItem("xp", xp);
        showRankUpAnimation(RANK_NAMES[rankIndex]);
    }
}

function showRankUpAnimation(newRank) {
    // Remove existing overlay if any
    const existing = document.getElementById('rankUpOverlay');
    if (existing) existing.remove();

    const displayRank = newRank === "National" ? "N" : newRank;

    const overlay = document.createElement('div');
    overlay.id = 'rankUpOverlay';
    overlay.innerHTML = `
        <div class="rankup-bg"></div>
        <div class="rankup-content">
            <div class="rankup-stars">★ ★ ★</div>
            <div class="rankup-label">RANK UP!</div>
            <div class="rankup-circle">
                <span class="rankup-letter">${displayRank}</span>
            </div>
            <div class="rankup-name">${newRank === "National" ? "National" : "Rank " + newRank}</div>
            <div class="rankup-subtitle">You have ascended. Keep climbing.</div>
            <button class="rankup-btn" onclick="closeRankUp()">Continue ⚔</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
        overlay.classList.add('rankup-show');
    });

    // Auto close after 6 seconds
    setTimeout(() => closeRankUp(), 6000);
}

function closeRankUp() {
    const overlay = document.getElementById('rankUpOverlay');
    if (overlay) {
        overlay.classList.add('rankup-hide');
        setTimeout(() => overlay.remove(), 500);
    }
}

// ===== INJECT STYLES =====
const rankUpStyles = document.createElement('style');
rankUpStyles.textContent = `
#rankUpOverlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity .4s ease;
    pointer-events: all;
}

#rankUpOverlay.rankup-show { opacity: 1; }
#rankUpOverlay.rankup-hide { opacity: 0; pointer-events: none; }

.rankup-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.15) 0%, rgba(2,2,35,0.97) 60%);
    animation: rankupPulse 2s ease infinite;
}

@keyframes rankupPulse {
    0%,100% { background: radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.15) 0%, rgba(2,2,35,0.97) 60%); }
    50% { background: radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.25) 0%, rgba(2,2,35,0.97) 60%); }
}

.rankup-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    text-align: center;
    padding: 40px;
    animation: rankupEntry .5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes rankupEntry {
    from { transform: scale(0.5) translateY(40px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
}

.rankup-stars {
    font-size: 28px;
    color: #FFD700;
    letter-spacing: 12px;
    animation: starSpin 1s ease both;
    text-shadow: 0 0 20px rgba(255,215,0,0.6);
}

@keyframes starSpin {
    from { transform: scale(0) rotate(-180deg); opacity: 0; }
    to { transform: scale(1) rotate(0deg); opacity: 1; }
}

.rankup-label {
    font-family: 'Press Start 2P', monospace;
    font-size: 28px;
    color: #FFD700;
    text-shadow: 0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4);
    animation: labelPop .4s ease .2s both;
    letter-spacing: 4px;
}

@keyframes labelPop {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.rankup-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    border: 4px solid #FFD700;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,215,0,0.1);
    box-shadow: 0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2), inset 0 0 40px rgba(255,215,0,0.05);
    animation: circlePop .5s cubic-bezier(0.34, 1.56, 0.64, 1) .3s both, circleGlow 2s ease .8s infinite;
}

@keyframes circlePop {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

@keyframes circleGlow {
    0%,100% { box-shadow: 0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2); }
    50% { box-shadow: 0 0 60px rgba(255,215,0,0.8), 0 0 120px rgba(255,215,0,0.4); }
}

.rankup-letter {
    font-family: 'Press Start 2P', monospace;
    font-size: 56px;
    color: #FFD700;
    text-shadow: 0 0 20px rgba(255,215,0,0.8);
}

.rankup-name {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: white;
    opacity: 0.9;
    animation: fadeUp .4s ease .5s both;
}

.rankup-subtitle {
    font-size: 14px;
    color: white;
    opacity: 0.4;
    animation: fadeUp .4s ease .6s both;
}

@keyframes fadeUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.rankup-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    padding: 14px 32px;
    background: #FFD700;
    color: #020223;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: transform .2s, box-shadow .2s;
    animation: fadeUp .4s ease .7s both;
    position: relative;
    overflow: hidden;
    margin-top: 8px;
}

.rankup-btn::after {
    content: "";
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent);
    transform: translateX(-100%);
    transition: transform .4s;
    pointer-events: none;
}

.rankup-btn:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(255,215,0,0.5); }
.rankup-btn:hover::after { transform: translateX(100%); }

/* PARTICLES */
.rankup-content::before, .rankup-content::after {
    content: "✦ ✦ ✦ ✦ ✦";
    position: absolute;
    font-size: 12px;
    color: #FFD700;
    opacity: 0.3;
    animation: particleFloat 3s ease infinite;
    letter-spacing: 20px;
}

.rankup-content::before { top: 20px; animation-delay: 0s; }
.rankup-content::after { bottom: 20px; animation-delay: 1.5s; }

@keyframes particleFloat {
    0%,100% { transform: translateY(0) scale(1); opacity: 0.3; }
    50% { transform: translateY(-10px) scale(1.1); opacity: 0.6; }
}
`;

document.head.appendChild(rankUpStyles);