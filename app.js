// ================================================
//   ProfilIA — Logique applicative
//   Firebase + Quiz + Dashboard formateur + live
// ================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs,
    onSnapshot, query, where, serverTimestamp, updateDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { QUESTION_POOL, THEMES } from "./questions.js";

// ================================================
//   CONFIGURATION FIREBASE
// ================================================
const firebaseConfig = {
    apiKey: "AIzaSyCS291zmAqHPGOdwKyrQQ-UhJHETmogiiY",
    authDomain: "profilia-quiz.firebaseapp.com",
    projectId: "profilia-quiz",
    storageBucket: "profilia-quiz.firebasestorage.app",
    messagingSenderId: "449666887260",
    appId: "1:449666887260:web:b2c591dddd99c2424a4099"
};

const TEACHER_EMAILS = [
    "jeanphilippe.bolle@cnddinant.be",
    "jeanphilippe@pedagokit.be"
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ================================================
//   ÉTAT GLOBAL
// ================================================
const FILTER_ALL = "Tous";

const state = {
    role: null, // 'student' | 'teacher'
    pseudo: null,
    sessionCode: null,
    questions: [], // 16 questions sélectionnées
    currentIdx: 0,
    selectedAnswer: null,
    scores: { reflechi: 0, pragmatique: 0, technophile: 0 },
    scoresByTheme: {},
    currentFilter: FILTER_ALL,
    // Radar
    radarCanvas: null,
    radarCtx: null,
    radarPoints: [],
    // Firebase
    teacherUser: null,
    unsubscribeParticipants: null,
    unsubscribeSession: null,
    unsubscribeSessionsList: null,
    participants: [],
    teacherSessions: [], // liste live des sessions du prof
    sessionParticipantCounts: {}, // { code: count } pour affichage rapide
    // Dashboard
    dashFilter: FILTER_ALL,
    dashRadarCtx: null,
    dashRadarPoints: [],
    // Groupe (modal)
    groupRadarCtx: null,
    savedParticipantId: null
};

// Initialiser scoresByTheme
THEMES.forEach(t => state.scoresByTheme[t] = { reflechi: 0, pragmatique: 0, technophile: 0 });

// ================================================
//   NAVIGATION ÉCRANS
// ================================================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
}

// ================================================
//   UTILITAIRES
// ================================================
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateSessionCode() {
    // 4 caractères alphanumériques faciles à dicter (sans O, 0, I, 1)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function sanitizePseudo(s) {
    return s.trim().replace(/\s+/g, " ").slice(0, 40);
}

// ================================================
//   SÉLECTION DE 16 QUESTIONS (4 par domaine)
// ================================================
function selectQuizQuestions() {
    const byTheme = {};
    THEMES.forEach(t => byTheme[t] = []);
    QUESTION_POOL.forEach(q => byTheme[q.theme].push(q));

    const selected = [];
    THEMES.forEach(t => {
        const pool = shuffleArray(byTheme[t]);
        selected.push(...pool.slice(0, 4));
    });

    // Mélange final + réponses de chaque question
    const shuffled = shuffleArray(selected).map(q => ({
        ...q,
        answers: shuffleArray(q.answers)
    }));

    return shuffled;
}

// ================================================
//   RADAR CHART (générique)
// ================================================
function drawRadar(ctx, canvas, data, maxScore, storePointsInto = null) {
    if (!ctx) return [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    // Graduations
    ctx.strokeStyle = '#d7e8e8';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
        ctx.stroke();
    }

    const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
    const axisLabels = ['Technophile', 'Pragmatique', 'Réfléchi'];
    const profileKeys = ['technophile', 'pragmatique', 'reflechi'];

    // Axes + labels
    angles.forEach((angle, index) => {
        const x = centerX + Math.cos(angle - Math.PI / 2) * radius;
        const y = centerY + Math.sin(angle - Math.PI / 2) * radius;
        ctx.beginPath();
        ctx.strokeStyle = '#d7e8e8';
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = '#2C6565';
        ctx.font = 'bold 13px Barlow, sans-serif';
        ctx.textAlign = 'center';
        const lx = centerX + Math.cos(angle - Math.PI / 2) * (radius + 22);
        const ly = centerY + Math.sin(angle - Math.PI / 2) * (radius + 22);
        ctx.fillText(axisLabels[index], lx, ly);
    });

    const scoreValues = [data.technophile, data.pragmatique, data.reflechi];
    const points = [];

    // Polygone
    if (scoreValues.some(v => v > 0)) {
        ctx.beginPath();
        ctx.strokeStyle = '#2C6565';
        ctx.fillStyle = 'rgba(44, 101, 101, 0.28)';
        ctx.lineWidth = 2;
        angles.forEach((angle, index) => {
            const score = Math.min(scoreValues[index], maxScore);
            const r = (radius * score) / maxScore;
            const x = centerX + Math.cos(angle - Math.PI / 2) * r;
            const y = centerY + Math.sin(angle - Math.PI / 2) * r;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Points
    angles.forEach((angle, index) => {
        const score = Math.min(scoreValues[index], maxScore);
        const r = (radius * score) / maxScore;
        const x = centerX + Math.cos(angle - Math.PI / 2) * r;
        const y = centerY + Math.sin(angle - Math.PI / 2) * r;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#2C6565';
        ctx.fill();
        points.push({
            x, y,
            score: scoreValues[index],
            max: maxScore,
            label: axisLabels[index],
            profile: profileKeys[index]
        });
    });

    if (storePointsInto) storePointsInto.length = 0, points.forEach(p => storePointsInto.push(p));
    return points;
}

function setupRadarHover(canvas, tooltip, pointsRef) {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        const HOVER = 14;
        const found = pointsRef.find(p => {
            const dx = p.x - mx, dy = p.y - my;
            return Math.sqrt(dx * dx + dy * dy) <= HOVER;
        });
        if (found) {
            const displayScore = Number.isInteger(found.score) ? found.score : found.score.toFixed(1);
            const displayMax = Number.isInteger(found.max) ? found.max : found.max.toFixed(1);
            tooltip.textContent = `${found.label} : ${displayScore} / ${displayMax}`;
            tooltip.style.left = (found.x / scaleX) + 'px';
            tooltip.style.top = (found.y / scaleY) + 'px';
            tooltip.classList.add('visible');
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.classList.remove('visible');
            canvas.style.cursor = 'default';
        }
    });
    canvas.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
        canvas.style.cursor = 'default';
    });
}

// ================================================
//   RADAR ÉLÈVE
// ================================================
function getStudentActiveScores() {
    if (state.currentFilter === FILTER_ALL) {
        return { data: state.scores, max: 16 };
    }
    return { data: state.scoresByTheme[state.currentFilter], max: 4 };
}

function drawStudentRadar() {
    const active = getStudentActiveScores();
    state.radarPoints = drawRadar(state.radarCtx, state.radarCanvas, active.data, active.max);
}

function renderStudentFilters() {
    const container = document.getElementById('radar-filters');
    container.innerHTML = '';
    [FILTER_ALL, ...THEMES].forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'filter-pill' + (opt === state.currentFilter ? ' active' : '');
        btn.textContent = opt;
        btn.onclick = () => {
            state.currentFilter = opt;
            renderStudentFilters();
            drawStudentRadar();
        };
        container.appendChild(btn);
    });
}

// ================================================
//   QUIZ
// ================================================
function displayQuestion() {
    const q = state.questions[state.currentIdx];
    document.getElementById('question-theme').textContent = q.theme;
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('question-counter').textContent = state.currentIdx + 1;
    document.getElementById('question-total').textContent = state.questions.length;

    const pct = ((state.currentIdx) / state.questions.length) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';

    const answersEl = document.getElementById('answers-container');
    answersEl.innerHTML = '';
    q.answers.forEach((a, i) => {
        const div = document.createElement('div');
        div.className = 'answer-option';
        div.textContent = a.text;
        div.onclick = () => selectAnswer(i);
        answersEl.appendChild(div);
    });

    state.selectedAnswer = null;
    document.getElementById('next-btn').disabled = true;
}

function selectAnswer(index) {
    document.querySelectorAll('.answer-option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('.answer-option')[index].classList.add('selected');
    state.selectedAnswer = index;
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    if (state.selectedAnswer === null) return;
    const q = state.questions[state.currentIdx];
    const chosenProfile = q.answers[state.selectedAnswer].profile;
    state.scores[chosenProfile]++;
    state.scoresByTheme[q.theme][chosenProfile]++;

    drawStudentRadar();

    state.currentIdx++;
    if (state.currentIdx < state.questions.length) {
        displayQuestion();
    } else {
        document.getElementById('progress-fill').style.width = '100%';
        finishQuiz();
    }
}

async function finishQuiz() {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('final-quiz-result').style.display = 'block';
    document.getElementById('final-results').style.display = 'block';

    const profileNames = {
        reflechi: 'Réfléchi 🤔',
        pragmatique: 'Pragmatique ⚖️',
        technophile: 'Technophile 🚀'
    };

    const dominant = Object.keys(state.scores).reduce((a, b) =>
        state.scores[a] > state.scores[b] ? a : b
    );
    document.getElementById('dominant-profile').textContent = profileNames[dominant];

    document.getElementById('scores-display').innerHTML = `
        <p><strong>Réfléchi :</strong> ${state.scores.reflechi} / 16</p>
        <p><strong>Pragmatique :</strong> ${state.scores.pragmatique} / 16</p>
        <p><strong>Technophile :</strong> ${state.scores.technophile} / 16</p>
    `;

    drawStudentRadar();

    // Sauvegarde Firestore
    const saveStatus = document.getElementById('save-status');
    saveStatus.innerHTML = '<span class="spinner"></span> Enregistrement…';
    try {
        const partRef = await addDoc(
            collection(db, 'sessions', state.sessionCode, 'participants'),
            {
                pseudo: state.pseudo,
                scores: state.scores,
                scoresByTheme: state.scoresByTheme,
                dominantProfile: dominant,
                completedAt: serverTimestamp()
            }
        );
        state.savedParticipantId = partRef.id;
        saveStatus.innerHTML = '✅ Résultats enregistrés dans la session <strong>' + state.sessionCode + '</strong>';
    } catch (err) {
        console.error(err);
        saveStatus.innerHTML = '⚠️ Impossible d\'enregistrer les résultats. (' + err.code + ')';
    }
}

// ================================================
//   VUE "PROFILS DU GROUPE" (élève)
// ================================================
let unsubscribeGroup = null;

function openGroupModal() {
    document.getElementById('group-modal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Écoute live des participants de la session
    if (unsubscribeGroup) unsubscribeGroup();
    const partsRef = collection(db, 'sessions', state.sessionCode, 'participants');
    unsubscribeGroup = onSnapshot(partsRef, snap => {
        const participants = [];
        snap.forEach(d => participants.push(d.data()));
        renderGroupStats(participants);
    }, err => {
        console.error('group snapshot err', err);
    });
}

function closeGroupModal() {
    document.getElementById('group-modal').classList.remove('active');
    document.body.style.overflow = '';
    if (unsubscribeGroup) { unsubscribeGroup(); unsubscribeGroup = null; }
}

function renderGroupStats(participants) {
    const total = participants.length;
    document.getElementById('group-total-count').textContent = total;

    const counts = { reflechi: 0, pragmatique: 0, technophile: 0 };
    const sums = { reflechi: 0, pragmatique: 0, technophile: 0 };
    participants.forEach(p => {
        if (p.dominantProfile && counts[p.dominantProfile] !== undefined) counts[p.dominantProfile]++;
        if (p.scores) {
            sums.reflechi += p.scores.reflechi || 0;
            sums.pragmatique += p.scores.pragmatique || 0;
            sums.technophile += p.scores.technophile || 0;
        }
    });

    document.getElementById('group-reflechi').textContent = counts.reflechi;
    document.getElementById('group-pragmatique').textContent = counts.pragmatique;
    document.getElementById('group-technophile').textContent = counts.technophile;

    // Radar moyenne (échelle sur 16)
    const avg = total > 0 ? {
        reflechi: sums.reflechi / total,
        pragmatique: sums.pragmatique / total,
        technophile: sums.technophile / total
    } : { reflechi: 0, pragmatique: 0, technophile: 0 };

    const canvas = document.getElementById('group-radar-chart');
    if (!state.groupRadarCtx) state.groupRadarCtx = canvas.getContext('2d');
    drawRadar(state.groupRadarCtx, canvas, avg, 16);
}

// ================================================
//   AUTHENTIFICATION FORMATEUR
// ================================================
async function teacherSignIn() {
    const errEl = document.getElementById('login-error');
    errEl.classList.remove('visible');
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const email = result.user.email;
        if (!TEACHER_EMAILS.includes(email)) {
            await signOut(auth);
            errEl.innerHTML = `Accès refusé : l'adresse <code>${email}</code> n'est pas autorisée à accéder à l'espace formateur.`;
            errEl.classList.add('visible');
            return;
        }
        // onAuthStateChanged prend le relais
    } catch (err) {
        console.error(err);
        let msg = 'Erreur de connexion : ' + (err.message || err.code);
        if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
            msg = `⚠️ Le fournisseur Google Sign-In n'est pas encore activé dans Firebase.<br><br>
            <strong>Une seule action requise :</strong>
            <ol style="margin-left: 20px; margin-top: 10px;">
              <li>Ouvrir <a href="https://console.firebase.google.com/project/profilia-quiz/authentication/providers" target="_blank">la console Firebase Auth</a></li>
              <li>Cliquer sur "Get started" si demandé</li>
              <li>Activer <strong>Google</strong> comme fournisseur</li>
              <li>Renseigner l'email de support et sauvegarder</li>
            </ol>
            Ensuite, réessayer.`;
        } else if (err.code === 'auth/unauthorized-domain') {
            msg = `⚠️ Le domaine actuel n'est pas autorisé dans Firebase Auth.<br>
            Ajoutez-le dans <a href="https://console.firebase.google.com/project/profilia-quiz/authentication/settings" target="_blank">Auth → Settings → Authorized domains</a>.`;
        }
        errEl.innerHTML = msg;
        errEl.classList.add('visible');
    }
}

async function teacherSignOut() {
    if (state.unsubscribeParticipants) { state.unsubscribeParticipants(); state.unsubscribeParticipants = null; }
    if (state.unsubscribeSession) { state.unsubscribeSession(); state.unsubscribeSession = null; }
    if (state.unsubscribeSessionsList) { state.unsubscribeSessionsList(); state.unsubscribeSessionsList = null; }
    state.sessionCode = null;
    state.participants = [];
    state.teacherSessions = [];
    state.sessionParticipantCounts = {};
    await signOut(auth);
    showScreen('role-screen');
}

// ================================================
//   GESTION SESSIONS FORMATEUR
// ================================================
async function createTeacherSession() {
    if (!state.teacherUser) return;
    let code, exists = true, attempts = 0;
    while (exists && attempts < 10) {
        code = generateSessionCode();
        const snap = await getDoc(doc(db, 'sessions', code));
        exists = snap.exists();
        attempts++;
    }
    if (!code) return alert('Impossible de générer un code unique. Réessaie.');

    await setDoc(doc(db, 'sessions', code), {
        code,
        createdAt: serverTimestamp(),
        createdBy: state.teacherUser.email,
        createdByName: state.teacherUser.displayName || state.teacherUser.email,
        active: true
    });
    state.sessionCode = code;
    renderTeacherDashboard();
    subscribeToParticipants(code);
}

async function endTeacherSession() {
    if (!state.sessionCode) return;
    if (!confirm('Terminer la session ? Les participant·es ne pourront plus rejoindre avec ce code.')) return;
    try {
        await updateDoc(doc(db, 'sessions', state.sessionCode), { active: false });
    } catch (err) { console.error(err); }
    if (state.unsubscribeParticipants) { state.unsubscribeParticipants(); state.unsubscribeParticipants = null; }
    state.sessionCode = null;
    state.participants = [];
    renderTeacherDashboard();
}

// ================================================
//   LISTE DES SESSIONS DU FORMATEUR (live)
// ================================================
function subscribeToTeacherSessions(email) {
    if (state.unsubscribeSessionsList) state.unsubscribeSessionsList();
    const q = query(
        collection(db, 'sessions'),
        where('createdBy', '==', email),
        where('active', '==', true)
    );
    state.unsubscribeSessionsList = onSnapshot(q, async snap => {
        const sessions = [];
        snap.forEach(d => sessions.push({ id: d.id, ...d.data() }));
        // Tri par date décroissante
        sessions.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
        });
        state.teacherSessions = sessions;
        renderSessionsList();
        // Compte des participants (lecture asynchrone en arrière-plan)
        sessions.forEach(async s => {
            try {
                const partSnap = await getDocs(collection(db, 'sessions', s.id, 'participants'));
                state.sessionParticipantCounts[s.id] = partSnap.size;
                renderSessionsList();
            } catch (err) { /* silencieux */ }
        });
    });
}

function renderSessionsList() {
    const listEl = document.getElementById('sessions-list');
    const emptyEl = document.getElementById('sessions-list-empty');
    if (!listEl) return;

    const sessions = state.teacherSessions;
    if (!sessions || sessions.length === 0) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }
    emptyEl.style.display = 'none';

    listEl.innerHTML = sessions.map(s => {
        const d = s.createdAt?.toDate?.();
        const dateStr = d ? d.toLocaleString('fr-BE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) : '…';
        const count = state.sessionParticipantCounts[s.id];
        const countStr = count === undefined ? '…' : count;
        const isCurrent = s.id === state.sessionCode;
        return `
            <div class="session-row ${isCurrent ? 'current' : ''}">
                <div class="s-code">${escapeHtml(s.id)}</div>
                <div class="s-meta">
                    Créée le <strong>${dateStr}</strong>
                    · <strong>${countStr}</strong> participant·e${countStr === 1 ? '' : 's'}
                    ${isCurrent ? '<span class="s-badge">Active</span>' : ''}
                </div>
                <button class="btn-mini btn-open" data-open-session="${escapeHtml(s.id)}" ${isCurrent ? 'disabled' : ''}>
                    ${isCurrent ? 'Ouverte' : 'Ouvrir'}
                </button>
                <button class="btn-mini btn-delete" data-delete-session="${escapeHtml(s.id)}">
                    Supprimer
                </button>
            </div>
        `;
    }).join('');

    // Rebranche les listeners
    listEl.querySelectorAll('[data-open-session]').forEach(btn => {
        btn.addEventListener('click', () => openSession(btn.dataset.openSession));
    });
    listEl.querySelectorAll('[data-delete-session]').forEach(btn => {
        btn.addEventListener('click', () => deleteSession(btn.dataset.deleteSession));
    });
}

function openSession(code) {
    if (!code || code === state.sessionCode) return;
    if (state.unsubscribeParticipants) { state.unsubscribeParticipants(); state.unsubscribeParticipants = null; }
    state.sessionCode = code;
    state.participants = [];
    renderTeacherDashboard();
    subscribeToParticipants(code);
}

// Quitter la vue de la session actuelle sans la clôturer ni la supprimer.
// La session reste active en base ; les élèves peuvent toujours rejoindre.
function leaveCurrentSessionView() {
    if (!state.sessionCode) return;
    if (state.unsubscribeParticipants) { state.unsubscribeParticipants(); state.unsubscribeParticipants = null; }
    state.sessionCode = null;
    state.participants = [];
    renderTeacherDashboard();
}

async function deleteSession(code) {
    if (!code) return;
    const partCount = state.sessionParticipantCounts[code];
    const msg = partCount > 0
        ? `Supprimer définitivement la session "${code}" et ses ${partCount} réponse${partCount === 1 ? '' : 's'} ? Cette action est irréversible.`
        : `Supprimer définitivement la session "${code}" ? Cette action est irréversible.`;
    if (!confirm(msg)) return;

    try {
        // 1. Supprimer tous les participants (par batchs de 400 max)
        const partsRef = collection(db, 'sessions', code, 'participants');
        const partsSnap = await getDocs(partsRef);
        const docs = partsSnap.docs;
        for (let i = 0; i < docs.length; i += 400) {
            const batch = writeBatch(db);
            docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
        // 2. Supprimer le document de session
        await deleteDoc(doc(db, 'sessions', code));

        // 3. Si c'était la session courante, réinitialise le dashboard
        if (state.sessionCode === code) {
            if (state.unsubscribeParticipants) { state.unsubscribeParticipants(); state.unsubscribeParticipants = null; }
            state.sessionCode = null;
            state.participants = [];
            renderTeacherDashboard();
        }
        delete state.sessionParticipantCounts[code];
    } catch (err) {
        console.error(err);
        alert('Suppression impossible : ' + (err.message || err.code));
    }
}

function subscribeToParticipants(code) {
    if (state.unsubscribeParticipants) state.unsubscribeParticipants();
    const partsRef = collection(db, 'sessions', code, 'participants');
    state.unsubscribeParticipants = onSnapshot(partsRef, snap => {
        state.participants = [];
        snap.forEach(d => state.participants.push({ id: d.id, ...d.data() }));
        state.participants.sort((a, b) => {
            const ta = a.completedAt?.toMillis?.() || 0;
            const tb = b.completedAt?.toMillis?.() || 0;
            return tb - ta;
        });
        updateDashboardData();
    });
}

function renderTeacherDashboard() {
    const emailEl = document.getElementById('teacher-email');
    if (state.teacherUser) emailEl.textContent = state.teacherUser.email;

    const hasSession = !!state.sessionCode;
    document.getElementById('no-session-view').style.display = hasSession ? 'none' : 'block';
    document.getElementById('active-session-view').style.display = hasSession ? 'block' : 'none';
    document.getElementById('stats-grid').style.display = hasSession ? 'grid' : 'none';
    document.getElementById('dash-bar-panel').style.display = hasSession ? 'block' : 'none';
    document.getElementById('dash-charts').style.display = hasSession ? 'grid' : 'none';
    // La liste des sessions n'apparaît qu'en dehors d'une session active
    document.getElementById('sessions-list-panel').style.display = hasSession ? 'none' : 'block';

    if (hasSession) {
        document.getElementById('active-session-code').textContent = state.sessionCode;
        renderDashRadarFilters();
        updateDashboardData();
    }
    renderSessionsList();
}

function updateDashboardData() {
    const participants = state.participants;
    const total = participants.length;
    document.getElementById('stat-total').textContent = total;

    const counts = { reflechi: 0, pragmatique: 0, technophile: 0 };
    participants.forEach(p => {
        if (p.dominantProfile && counts[p.dominantProfile] !== undefined) counts[p.dominantProfile]++;
    });
    ['reflechi', 'pragmatique', 'technophile'].forEach(k => {
        document.getElementById('stat-' + k).textContent = counts[k];
        const pct = total > 0 ? Math.round((counts[k] / total) * 100) : 0;
        document.getElementById('pct-' + k).textContent = pct;
    });

    // Liste des participants
    const tbody = document.getElementById('participants-tbody');
    const empty = document.getElementById('empty-participants');
    if (total === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        const profileLabels = { reflechi: 'Réfléchi', pragmatique: 'Pragmatique', technophile: 'Technophile' };
        tbody.innerHTML = participants.map(p => {
            const t = p.completedAt?.toDate?.() || null;
            const timeStr = t ? t.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }) : '…';
            const prof = p.dominantProfile || '—';
            return `<tr>
                <td>${escapeHtml(p.pseudo)}</td>
                <td><span class="profile-tag ${prof}">${profileLabels[prof] || prof}</span></td>
                <td>${timeStr}</td>
            </tr>`;
        }).join('');
    }

    drawDashRadar();
    drawDashBarChart();
}

// ================================================
//   BAR CHART — Répartition des profils dominants
// ================================================
function drawDashBarChart() {
    const canvas = document.getElementById('dash-bar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Adapter la résolution du canvas à sa taille rendue (net sur écrans HiDPI)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.max(600, Math.round(rect.width * dpr));
    const targetH = Math.max(200, Math.round(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const counts = { reflechi: 0, pragmatique: 0, technophile: 0 };
    state.participants.forEach(p => {
        if (p.dominantProfile && counts[p.dominantProfile] !== undefined) counts[p.dominantProfile]++;
    });
    const total = state.participants.length;

    const bars = [
        { key: 'reflechi', label: 'Réfléchi', emoji: '🤔', color: '#4d8899', value: counts.reflechi },
        { key: 'pragmatique', label: 'Pragmatique', emoji: '⚖️', color: '#d19c3d', value: counts.pragmatique },
        { key: 'technophile', label: 'Technophile', emoji: '🚀', color: '#c9556f', value: counts.technophile }
    ];

    const paddingLeft = 70 * dpr;
    const paddingRight = 30 * dpr;
    const paddingTop = 30 * dpr;
    const paddingBottom = 70 * dpr;
    const chartW = w - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    // Échelle Y — minimum 4 pour avoir de la respiration quand peu de participants
    const maxVal = Math.max(total, 4);
    const yTicks = Math.min(maxVal, 5);
    const step = Math.ceil(maxVal / yTicks);
    const yMax = step * yTicks;

    // Grille + labels Y
    ctx.strokeStyle = '#eaf3f3';
    ctx.lineWidth = 1 * dpr;
    ctx.fillStyle = '#6a7676';
    ctx.font = `${13 * dpr}px Barlow, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= yTicks; i++) {
        const val = (yMax / yTicks) * i;
        const y = paddingTop + chartH - (chartH * i / yTicks);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + chartW, y);
        ctx.stroke();
        ctx.fillText(Math.round(val), paddingLeft - 10 * dpr, y);
    }

    // Axe Y
    ctx.strokeStyle = '#d7e8e8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, paddingTop + chartH);
    ctx.stroke();

    // Barres
    const barWidth = chartW / bars.length * 0.55;
    const groupWidth = chartW / bars.length;

    bars.forEach((bar, i) => {
        const cx = paddingLeft + groupWidth * i + groupWidth / 2;
        const barX = cx - barWidth / 2;
        const barH = yMax > 0 ? (chartH * bar.value / yMax) : 0;
        const barY = paddingTop + chartH - barH;

        // Barre avec dégradé
        const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
        grad.addColorStop(0, bar.color);
        grad.addColorStop(1, shade(bar.color, -18));
        ctx.fillStyle = grad;
        roundedRect(ctx, barX, barY, barWidth, barH, 8 * dpr);
        ctx.fill();

        // Valeur au-dessus
        ctx.fillStyle = bar.color;
        ctx.font = `900 ${28 * dpr}px Barlow, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(bar.value), cx, barY - 6 * dpr);

        // Label en bas
        ctx.fillStyle = '#2C6565';
        ctx.font = `700 ${15 * dpr}px Barlow, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${bar.emoji} ${bar.label}`, cx, paddingTop + chartH + 12 * dpr);

        // Pourcentage
        const pct = total > 0 ? Math.round((bar.value / total) * 100) : 0;
        ctx.fillStyle = '#6a7676';
        ctx.font = `${13 * dpr}px Barlow, sans-serif`;
        ctx.fillText(`${pct}%`, cx, paddingTop + chartH + 34 * dpr);
    });
}

function roundedRect(ctx, x, y, w, h, r) {
    if (h <= 0) { ctx.beginPath(); ctx.rect(x, y, w, 0); return; }
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function shade(hex, amt) {
    // amt : -100..100, éclaircir ou assombrir
    const m = hex.replace('#', '').match(/.{2}/g);
    if (!m) return hex;
    const [r, g, b] = m.map(x => parseInt(x, 16));
    const clamp = v => Math.max(0, Math.min(255, v));
    const shift = 255 * (amt / 100);
    const rr = clamp(Math.round(r + shift));
    const gg = clamp(Math.round(g + shift));
    const bb = clamp(Math.round(b + shift));
    return '#' + [rr, gg, bb].map(v => v.toString(16).padStart(2, '0')).join('');
}

function drawDashRadar() {
    const canvas = document.getElementById('dash-radar-chart');
    if (!canvas) return;
    if (!state.dashRadarCtx) state.dashRadarCtx = canvas.getContext('2d');

    const participants = state.participants;
    let data = { reflechi: 0, pragmatique: 0, technophile: 0 };
    let max = 16;

    if (participants.length > 0) {
        if (state.dashFilter === FILTER_ALL) {
            let sums = { reflechi: 0, pragmatique: 0, technophile: 0 };
            participants.forEach(p => {
                sums.reflechi += p.scores?.reflechi || 0;
                sums.pragmatique += p.scores?.pragmatique || 0;
                sums.technophile += p.scores?.technophile || 0;
            });
            data = {
                reflechi: sums.reflechi / participants.length,
                pragmatique: sums.pragmatique / participants.length,
                technophile: sums.technophile / participants.length
            };
            max = 16;
        } else {
            const theme = state.dashFilter;
            let sums = { reflechi: 0, pragmatique: 0, technophile: 0 };
            let n = 0;
            participants.forEach(p => {
                if (p.scoresByTheme && p.scoresByTheme[theme]) {
                    sums.reflechi += p.scoresByTheme[theme].reflechi || 0;
                    sums.pragmatique += p.scoresByTheme[theme].pragmatique || 0;
                    sums.technophile += p.scoresByTheme[theme].technophile || 0;
                    n++;
                }
            });
            if (n > 0) {
                data = {
                    reflechi: sums.reflechi / n,
                    pragmatique: sums.pragmatique / n,
                    technophile: sums.technophile / n
                };
            }
            max = 4;
        }
    }

    state.dashRadarPoints = drawRadar(state.dashRadarCtx, canvas, data, max);
}

function renderDashRadarFilters() {
    const container = document.getElementById('dash-radar-filters');
    container.innerHTML = '';
    [FILTER_ALL, ...THEMES].forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'filter-pill' + (opt === state.dashFilter ? ' active' : '');
        btn.textContent = opt;
        btn.onclick = () => {
            state.dashFilter = opt;
            renderDashRadarFilters();
            drawDashRadar();
        };
        container.appendChild(btn);
    });
}

// ================================================
//   UTILITAIRES DIVERS
// ================================================
function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

async function joinStudentSession() {
    const errEl = document.getElementById('join-error');
    errEl.classList.remove('visible');

    const pseudo = sanitizePseudo(document.getElementById('pseudo-input').value);
    const code = document.getElementById('code-input').value.trim().toUpperCase();
    const consent = document.getElementById('consent-checkbox').checked;

    if (!pseudo) {
        errEl.textContent = 'Merci de saisir un pseudo.';
        errEl.classList.add('visible');
        return;
    }
    if (!code || code.length < 4) {
        errEl.textContent = 'Merci de saisir un code de session valide (4 caractères).';
        errEl.classList.add('visible');
        return;
    }
    if (!consent) {
        errEl.textContent = 'Merci d\'accepter les conditions d\'utilisation.';
        errEl.classList.add('visible');
        return;
    }

    // Vérifier que la session existe et est active
    try {
        const snap = await getDoc(doc(db, 'sessions', code));
        if (!snap.exists()) {
            errEl.textContent = `Le code "${code}" n'existe pas. Vérifie auprès du·de la formateur·rice.`;
            errEl.classList.add('visible');
            return;
        }
        const sd = snap.data();
        if (sd.active === false) {
            errEl.textContent = `La session "${code}" a été clôturée par le·la formateur·rice.`;
            errEl.classList.add('visible');
            return;
        }
    } catch (err) {
        console.error(err);
        errEl.textContent = 'Impossible de vérifier le code (' + err.code + '). Réessaie.';
        errEl.classList.add('visible');
        return;
    }

    state.pseudo = pseudo;
    state.sessionCode = code;
    state.questions = selectQuizQuestions();
    state.currentIdx = 0;
    state.scores = { reflechi: 0, pragmatique: 0, technophile: 0 };
    THEMES.forEach(t => state.scoresByTheme[t] = { reflechi: 0, pragmatique: 0, technophile: 0 });

    // Bascule vers le quiz
    document.getElementById('session-badge-code').textContent = code;
    showScreen('quiz-screen');

    // Init radar
    state.radarCanvas = document.getElementById('radar-chart');
    state.radarCtx = state.radarCanvas.getContext('2d');
    setupRadarHover(state.radarCanvas, document.getElementById('radar-tooltip'), state.radarPoints);

    // Init dashboard élève (radar)
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('final-quiz-result').style.display = 'none';
    document.getElementById('final-results').style.display = 'none';

    renderStudentFilters();
    displayQuestion();
    drawStudentRadar();
}

// ================================================
//   MODALES
// ================================================
function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
    if (id === 'group-modal' && unsubscribeGroup) { unsubscribeGroup(); unsubscribeGroup = null; }
}

// ================================================
//   LISTENERS
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    // Role selection
    document.querySelectorAll('[data-role]').forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.role;
            state.role = role;
            if (role === 'student') showScreen('intro-screen');
            else showScreen('teacher-login-screen');
        });
    });

    // Back links
    document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => {
            const target = el.dataset.goto;
            if (target === 'role') showScreen('role-screen');
        });
    });

    // Intro élève
    const consent = document.getElementById('consent-checkbox');
    const pseudoIn = document.getElementById('pseudo-input');
    const codeIn = document.getElementById('code-input');
    const startBtn = document.getElementById('start-quiz-btn');

    function refreshStartBtn() {
        startBtn.disabled = !(consent.checked && pseudoIn.value.trim() && codeIn.value.trim().length >= 4);
    }
    [consent, pseudoIn, codeIn].forEach(el => el.addEventListener('input', refreshStartBtn));
    consent.addEventListener('change', refreshStartBtn);

    codeIn.addEventListener('input', () => {
        codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    startBtn.addEventListener('click', joinStudentSession);

    // Quiz controls
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('btn-profile-desc').addEventListener('click', () => openModal('profile-modal'));
    document.getElementById('btn-group-profiles').addEventListener('click', openGroupModal);

    // Modales
    document.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', () => closeModal(el.dataset.closeModal));
    });
    ['profile-modal', 'group-modal'].forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => {
            if (e.target.id === id) closeModal(id);
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ['profile-modal', 'group-modal'].forEach(id => closeModal(id));
        }
    });

    // Login formateur
    document.getElementById('google-signin-btn').addEventListener('click', teacherSignIn);
    document.getElementById('teacher-logout-btn').addEventListener('click', teacherSignOut);
    document.getElementById('create-session-btn').addEventListener('click', createTeacherSession);
    document.getElementById('end-session-btn').addEventListener('click', endTeacherSession);
    document.getElementById('leave-session-btn').addEventListener('click', leaveCurrentSessionView);
    document.getElementById('copy-code-btn').addEventListener('click', () => {
        if (state.sessionCode) {
            navigator.clipboard.writeText(state.sessionCode).then(() => {
                const btn = document.getElementById('copy-code-btn');
                const original = btn.textContent;
                btn.textContent = '✓ Copié';
                setTimeout(() => btn.textContent = original, 1500);
            });
        }
    });

    // Init radar hover pour dashboard
    const dashCanvas = document.getElementById('dash-radar-chart');
    if (dashCanvas) {
        setupRadarHover(dashCanvas, document.getElementById('dash-radar-tooltip'), state.dashRadarPoints);
    }

    // Redessin du bar chart sur redimensionnement de la fenêtre (adaptation HiDPI)
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (state.sessionCode) drawDashBarChart();
        }, 200);
    });
});

// ================================================
//   RESTAURATION SESSION ACTIVE (après reload / re-login)
// ================================================
async function restoreActiveSession(email) {
    try {
        // Deux filtres égalité + tri côté client (évite le besoin d'index composite)
        const q = query(
            collection(db, 'sessions'),
            where('createdBy', '==', email),
            where('active', '==', true)
        );
        const snap = await getDocs(q);
        if (snap.empty) return false;
        let best = null, bestT = 0;
        snap.forEach(d => {
            const t = d.data().createdAt?.toMillis?.() || 0;
            if (t >= bestT) { bestT = t; best = d; }
        });
        if (!best) return false;
        state.sessionCode = best.id;
        renderTeacherDashboard();
        subscribeToParticipants(state.sessionCode);
        return true;
    } catch (err) {
        console.error('restoreActiveSession error', err);
        return false;
    }
}

// ================================================
//   ÉTAT AUTH — bascule automatique
// ================================================
onAuthStateChanged(auth, async (user) => {
    if (user && TEACHER_EMAILS.includes(user.email)) {
        state.teacherUser = user;
        showScreen('teacher-dashboard-screen');
        renderTeacherDashboard();
        // Souscrit à la liste des sessions du prof (live)
        subscribeToTeacherSessions(user.email);
        // Tente de reprendre la session active la plus récente
        await restoreActiveSession(user.email);
    } else if (user) {
        // Utilisateur connecté mais non autorisé
        signOut(auth);
    } else {
        state.teacherUser = null;
    }
});
