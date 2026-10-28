// Polyfill roundRect for compatibility across all browsers/webviews
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (!r) r = 0;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}

function safeRoundRect(c, x, y, w, h, r) {
    if (!r) r = 0;
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
}

const socket = io({ autoConnect: false });
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const lobbyScreen = document.getElementById('lobbyScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerNameInput');
const btnCreateRoom = document.getElementById('btnCreateRoom');
const btnJoinRoom = document.getElementById('btnJoinRoom');
const roomCodeInput = document.getElementById('roomCodeInput');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const roleDisplay = document.getElementById('roleDisplay');
const statusDisplay = document.getElementById('statusDisplay');
const btnToggleAudio = document.getElementById('btnToggleAudio');
const btnFullscreen = document.getElementById('btnFullscreen');
const emergencyFlashOverlay = document.getElementById('emergencyFlashOverlay');
const taskCompleteBanner = document.getElementById('taskCompleteBanner');

let players = {};
let deadBodies = [];
let myId = null;
let currentRoomCode = null;
let mySessionToken = localStorage.getItem('bible_us_token') || `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
localStorage.setItem('bible_us_token', mySessionToken);
let gameOverTimer = null;

let gameState = 'START';
let MAP_WIDTH = 3800;
let MAP_HEIGHT = 2500;

let tasks = [];
let completedTasks = new Set();
let taskProgress = 0;
let activeTask = null;

// Camera & Screen Shake
const camera = { x: 0, y: 0 };
let screenShake = 0;
function triggerScreenShake(intensity = 15) {
    screenShake = intensity;
}

const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, ' ': false, 'e': false, 'E': false, 'v': false, 'V': false, 'm': false, 'M': false, 'r': false, 'R': false };

// Particle system (polvo, estrellas doradas, vapor)
const particles = [];
function addParticle(x, y, vx, vy, color, size, maxLife) {
    particles.push({ x, y, vx, vy, color, size, life: 0, maxLife });
}

// Vent navigation hitboxes (para tocar en pantalla las flechas de ventilación)
let ventArrowHitboxes = [];

// Fullscreen & Orientation Lock
function activateImmersiveMode() {
    try {
        const el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        }
    } catch (e) {}

    try {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    } catch (e) {}
}

if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
        activateImmersiveMode();
        if (window.gameAudio) window.gameAudio.playClick();
    });
}

if (btnToggleAudio) {
    btnToggleAudio.addEventListener('click', () => {
        if (window.gameAudio) {
            const isMuted = window.gameAudio.toggleMute();
            btnToggleAudio.innerText = isMuted ? '🔇' : '🔊';
        }
    });
}

// Auto-reconexión tras cambio de app en móvil
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentRoomCode && mySessionToken && (!socket.connected || !players[myId])) {
        socket.connect();
        socket.emit('reconnectSession', { roomCode: currentRoomCode, token: mySessionToken });
    }
});

btnCreateRoom.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name.length > 0) {
        if (window.gameAudio) window.gameAudio.init();
        activateImmersiveMode();
        socket.connect();
        socket.emit('createRoom', { name, token: mySessionToken });
    } else {
        showNotification("Por favor ingresa un nombre.");
    }
});

btnJoinRoom.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    const code = roomCodeInput.value.trim().toUpperCase();
    if (name.length === 0) {
        showNotification("Por favor ingresa un nombre.");
        return;
    }
    if (code.length === 0) {
        showNotification("Por favor ingresa el código de sala.");
        return;
    }
    if (window.gameAudio) window.gameAudio.init();
    activateImmersiveMode();
    socket.connect();
    socket.emit('joinRoom', { name, code, token: mySessionToken });
});

function updateLobbyUI(data) {
    if (!data) return;

    // Si aún se está mostrando la pantalla de victoria/derrota, no sobreescribirla
    if (gameState === 'GAME_OVER') {
        return;
    }

    gameState = 'LOBBY';
    const goScreen = document.getElementById('gameOverScreen');
    if (goScreen) goScreen.style.display = 'none';

    const gScreen = document.getElementById('gameScreen');
    if (gScreen) {
        gScreen.classList.remove('active');
        gScreen.style.display = 'none';
    }

    const meetScreen = document.getElementById('meetingScreen');
    if (meetScreen) meetScreen.style.display = 'none';

    if (window.miniGameManager) window.miniGameManager.close();

    const wrScreen = document.getElementById('waitingRoomScreen');
    if (wrScreen) wrScreen.style.display = 'flex';

    if (lobbyScreen) lobbyScreen.classList.remove('active');

    // Reactivar fondo cinematográfico del mar y el Arca
    if (window.stormBg) {
        window.stormBg.start();
    }

    if (data.players) {
        players = data.players;
        const count = Object.keys(players).length;
        const pCountEl = document.getElementById('playerCount');
        if (pCountEl) pCountEl.innerText = count;
        
        let html = '';
        for (let id in players) {
            let p = players[id];
            let hostTag = id === data.hostId ? ' <b style="color:#facc15;">(Anfitrión)</b>' : '';
            html += `<div style="font-size: 1.15em; padding: 6px 0; display:flex; align-items:center; justify-content:center; gap:8px;">
                <span style="color:${p.color}; font-size: 1.4em; text-shadow:0 0 10px ${p.color};">●</span>
                <span style="font-weight:bold; color:#f8fafc;">${p.name}</span>
                ${hostTag}
            </div>`;
        }
        const pListEl = document.getElementById('playerList');
        if (pListEl) pListEl.innerHTML = html;
    }

    const currentSocketId = (socket && socket.id) ? socket.id : myId;
    const isHost = (currentSocketId === data.hostId) || (myId === data.hostId);

    if (btnStartGame) {
        if (isHost) {
            btnStartGame.style.display = 'block';
            btnStartGame.disabled = false;
            const wMsg = document.getElementById('waitingMessage');
            if (wMsg) wMsg.style.display = 'none';
        } else {
            btnStartGame.style.display = 'none';
            const wMsg = document.getElementById('waitingMessage');
            if (wMsg) wMsg.style.display = 'block';
        }
    }
}

socket.on('roomJoined', (data) => {
    const roomCode = typeof data === 'object' ? data.roomCode : data;
    currentRoomCode = roomCode;
    lobbyScreen.classList.remove('active');
    document.getElementById('waitingRoomScreen').style.display = 'flex';
    if (roomCodeDisplay) roomCodeDisplay.innerText = roomCode;
    if (window.gameAudio) window.gameAudio.playClick();
    if (data && typeof data === 'object' && data.players) {
        updateLobbyUI(data);
    }
});

const btnStartGame = document.getElementById('btnStartGame');
if (btnStartGame) {
    btnStartGame.addEventListener('click', () => {
        if (window.gameAudio) window.gameAudio.playClick();
        socket.emit('startGame');
    });
}

socket.on('lobbyUpdate', (data) => {
    updateLobbyUI(data);
});

socket.on('gameError', (msg) => {
    showNotification(msg);
});

socket.on('sessionRestored', (data) => {
    currentRoomCode = data.roomCode;
    gameState = data.gameState;
    players = data.players;
    tasks = data.tasks;
    deadBodies = data.deadBodies || [];
    taskProgress = data.taskProgress || 0;

    if (gameState === 'PLAYING') {
        if (window.stormBg) window.stormBg.stop();
        lobbyScreen.classList.remove('active');
        document.getElementById('waitingRoomScreen').style.display = 'none';
        gameScreen.style.display = 'block';
        gameScreen.classList.add('active');
        resizeCanvas();
        updateUI();
        showNotification("¡Conexión restaurada con el Arca!");
    }
});

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

const btnAction = document.getElementById('btnAction');
const meetingModal = document.getElementById('meetingModal');
const meetingStatus = document.getElementById('meetingStatus');
const votingArea = document.getElementById('votingArea');
const voteTimer = document.getElementById('voteTimer');

let isMeeting = false;
let myVote = null;
const taskModal = document.getElementById('taskModal');
const btnCloseTask = document.getElementById('btnCloseTask');
const notificationContainer = document.getElementById('notificationContainer');

function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'game-notification';
    notif.innerText = message;
    notificationContainer.appendChild(notif);
    setTimeout(() => {
        if (notif.parentNode === notificationContainer) {
            notificationContainer.removeChild(notif);
        }
    }, 4000);
}

function setupTouch(btn, key) {
    if (!btn) return;
    const press = (e) => { e.preventDefault(); keys[key] = true; };
    const release = (e) => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener('touchstart', press);
    btn.addEventListener('touchend', release);
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
}

// Joystick
let joystickManager = null;
let joystickMove = { x: 0, y: 0 };

function initJoystick() {
    if (joystickManager) return;
    try {
        const zone = document.getElementById('joystickZone');
        if (typeof nipplejs !== 'undefined' && nipplejs && nipplejs.create && zone) {
            joystickManager = nipplejs.create({
                zone: zone,
                mode: 'static',
                position: { left: '50%', top: '50%' },
                color: 'white',
                size: 110
            });
            
            joystickManager.on('move', (evt, data) => {
                if (data && data.vector) {
                    joystickMove.x = data.vector.x;
                    joystickMove.y = -data.vector.y;
                }
            });
            
            joystickManager.on('end', () => {
                joystickMove.x = 0;
                joystickMove.y = 0;
            });
        }
    } catch (e) {}
}
setupTouch(btnAction, ' ');

btnCloseTask.addEventListener('click', () => {
    taskModal.style.display = 'none';
    activeTask = null;
});

function resizeCanvas() {
    canvas.width = window.innerWidth || 1200;
    canvas.height = window.innerHeight || 800;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Interacción directa con canvas (tocar flechas de ventilador para Judas)
function handleCanvasPointer(clientX, clientY) {
    if (!players[myId]) return;
    const me = players[myId];

    if (me.isInVent && me.isImposter) {
        const worldX = clientX + camera.x;
        const worldY = clientY + camera.y;

        // Comprobar si tocó alguna flecha de ventilación
        for (let arrow of ventArrowHitboxes) {
            if (Math.hypot(worldX - arrow.x, worldY - arrow.y) < arrow.radius) {
                socket.emit('moveVent', arrow.targetId);
                if (window.gameAudio) window.gameAudio.playVent();
                return;
            }
        }

        // Si tocó sobre el propio ventilador central, sale del ventilador
        if (Math.hypot(worldX - me.x, worldY - me.y) < 45) {
            socket.emit('exitVent');
            if (window.gameAudio) window.gameAudio.playVent();
        }
    }
}

canvas.addEventListener('click', (e) => {
    handleCanvasPointer(e.clientX, e.clientY);
});

canvas.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
        handleCanvasPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
});

// Socket Events
socket.on('connect', () => { myId = socket.id; });

socket.on('gameStarted', (data) => {
    if (window.stormBg) window.stormBg.stop();
    gameState = 'PLAYING';
    document.getElementById('waitingRoomScreen').style.display = 'none';
    document.getElementById('lobbyScreen').style.display = 'none';
    gameScreen.style.display = 'block';
    gameScreen.classList.add('active');
    
    players = data.players || {};
    MAP_WIDTH = data.mapWidth || 3800;
    MAP_HEIGHT = data.mapHeight || 2500;
    tasks = data.tasks || [];
    taskProgress = 0;
    deadBodies = [];
    completedTasks.clear();
    
    resizeCanvas();

    if (players[myId]) {
        camera.x = players[myId].x - canvas.width / 2;
        camera.y = players[myId].y - canvas.height / 2;
    } else {
        camera.x = 1800 - canvas.width / 2;
        camera.y = 1100 - canvas.height / 2;
    }

    try { initJoystick(); } catch (e) {}
    updateUI();
    if (window.gameAudio) window.gameAudio.playClick();
    requestAnimationFrame(gameLoop); 
});

socket.on('meetingStarted', (data) => {
    isMeeting = true;
    myVote = null;
    startVoiceChat();
    players = data.players;
    meetingModal.style.display = 'flex';
    meetingStatus.innerText = '¡Hermanos, deliberen y voten para descubrir al impostor!';
    voteTimer.innerText = 'Tiempo restante: ' + data.time + 's';
    btnAction.style.display = 'none';
    keys['w'] = keys['a'] = keys['s'] = keys['d'] = false;
    
    triggerScreenShake(25);
    if (emergencyFlashOverlay) emergencyFlashOverlay.classList.add('active');
    if (window.gameAudio) window.gameAudio.playMeetingBell();

    votingArea.innerHTML = '';
    
    const skipBtn = document.createElement('button');
    skipBtn.className = 'vote-player-btn';
    skipBtn.style.gridColumn = '1 / -1';
    skipBtn.style.background = '#475569';
    skipBtn.innerHTML = '<span>⏩ Saltar Votación</span>';
    skipBtn.onclick = () => castVote('skip');
    votingArea.appendChild(skipBtn);
    
    for (let id in players) {
        const p = players[id];
        if (p.isAlive) {
            const btn = document.createElement('button');
            btn.className = 'vote-player-btn';
            btn.innerHTML = `<span><span style="color:${p.color}">●</span> ${p.name}</span><span>VOTAR</span>`;
            btn.onclick = () => castVote(id);
            votingArea.appendChild(btn);
        }
    }
});

function castVote(targetId) {
    if (myVote) return;
    myVote = targetId;
    socket.emit('castVote', targetId);
    meetingStatus.innerText = 'Voto registrado. Esperando al resto de los hermanos...';
    if (window.gameAudio) window.gameAudio.playClick();
}

socket.on('meetingTimer', (time) => {
    voteTimer.innerText = 'Tiempo restante de deliberación: ' + time + 's';
});

socket.on('meetingEnded', (data) => {
    isMeeting = false;
    stopVoiceChat();
    meetingModal.style.display = 'none';
    if (emergencyFlashOverlay) emergencyFlashOverlay.classList.remove('active');
    players = data.players;
    deadBodies = [];
    updateUI();

    if (data.ejectedId) {
        const ejected = players[data.ejectedId];
        const msg = ejected.isImposter ? 
            `✝️ ¡${ejected.name} era Judas (el impostor)!` : 
            `🕊️ ${ejected.name} era un hermano Fiel inocente.`;
        showNotification(msg);
    } else {
        showNotification("Ningún tripulante fue expulsado (Empate o Voto Saltado).");
    }

    if (players[myId]) {
        players[myId].isMoving = false;
    }
});

socket.on('newPlayer', (playerInfo) => { players[playerInfo.id] = playerInfo; });
socket.on('playerDisconnected', (playerId) => { delete players[playerId]; });
socket.on('playerMoved', (playerInfo) => {
    if (players[playerInfo.id]) {
        players[playerInfo.id].x = playerInfo.x;
        players[playerInfo.id].y = playerInfo.y;
        players[playerInfo.id].facingRight = playerInfo.facingRight;
        players[playerInfo.id].isMoving = playerInfo.isMoving;
    }
});

socket.on('playerKilled', (data) => {
    if (players[data.targetId]) {
        players[data.targetId].isAlive = false;
    }
    deadBodies.push(data.body);
    if (data.targetId === myId) {
        triggerScreenShake(20);
        updateUI();
        if (window.gameAudio) window.gameAudio.playKill();
        showNotification("✝️ Has sido eliminado. Ahora eres un espíritu protector (puedes atravesar muros y terminar tus tareas).");
    }
});

// Respuestas de ventilación para Judas (Sin popup modal, directo en mapa)
socket.on('ventEntered', (data) => {
    if (players[myId]) {
        players[myId].isInVent = true;
        players[myId].currentVent = data.currentVent.id;
    }
    if (window.gameAudio) window.gameAudio.playVent();
    // Partículas de humo al entrar
    for (let i = 0; i < 20; i++) {
        addParticle(data.currentVent.x, data.currentVent.y, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 'rgba(100, 116, 139, 0.6)', 5, 25);
    }
});

socket.on('ventMoved', (data) => {
    if (players[myId]) {
        players[myId].x = data.currentVent.x;
        players[myId].y = data.currentVent.y;
        players[myId].currentVent = data.currentVent.id;
    }
    if (window.gameAudio) window.gameAudio.playVent();
    for (let i = 0; i < 15; i++) {
        addParticle(data.currentVent.x, data.currentVent.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 'rgba(239, 68, 68, 0.6)', 4, 20);
    }
});

socket.on('ventExited', (data) => {
    if (players[myId]) {
        players[myId].isInVent = false;
        players[myId].x = data.x;
        players[myId].y = data.y;
    }
    if (window.gameAudio) window.gameAudio.playVent();
    for (let i = 0; i < 25; i++) {
        addParticle(data.x, data.y, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 'rgba(180, 140, 90, 0.5)', 5, 25);
    }
});

socket.on('playerEnteredVent', (data) => {
    if (players[data.playerId]) players[data.playerId].isInVent = true;
});

socket.on('playerExitedVent', (data) => {
    if (players[data.playerId]) {
        players[data.playerId].isInVent = false;
        players[data.playerId].x = data.x;
        players[data.playerId].y = data.y;
    }
});

function updateUI() {
    if (!players[myId]) return;
    const me = players[myId];

    if (me.isImposter) {
        roleDisplay.innerText = 'Rol: Judas (Impostor)';
        roleDisplay.className = 'imposter';
    } else {
        roleDisplay.innerText = 'Rol: Fiel (Tripulante)';
        roleDisplay.className = 'crewmate';
    }

    if (!me.isAlive) {
        statusDisplay.innerText = 'ESTADO: FANTASMA';
        statusDisplay.className = 'dead';
    } else {
        statusDisplay.innerText = 'ESTADO: VIVO';
        statusDisplay.className = '';
    }
}

// Muros limpios y sin obstáculos que atrapen al jugador en Capilla o Biblioteca
const walls = [
    { x: 300, y: 350, w: 3200, h: 40 },
    { x: 300, y: 2050, w: 3200, h: 40 },
    { x: 300, y: 350, w: 40, h: 1740 },
    { x: 3460, y: 350, w: 40, h: 1740 },

    // Comedor
    { x: 1350, y: 750, w: 35, h: 210 },
    { x: 1350, y: 1200, w: 35, h: 200 },
    { x: 2300, y: 750, w: 35, h: 210 },
    { x: 2300, y: 1200, w: 35, h: 200 },
    { x: 1350, y: 750, w: 300, h: 35 },
    { x: 1950, y: 750, w: 385, h: 35 },
    { x: 1350, y: 1400, w: 600, h: 35 },
    { x: 2250, y: 1400, w: 85, h: 35 },

    // Vigilancia
    { x: 1350, y: 420, w: 35, h: 60 },
    { x: 1350, y: 640, w: 35, h: 110 },
    { x: 2300, y: 420, w: 35, h: 330 },

    // Electricidad
    { x: 750, y: 980, w: 170, h: 35 },
    { x: 1120, y: 980, w: 230, h: 35 },

    // Biblioteca
    { x: 750, y: 980, w: 35, h: 200 },
    { x: 750, y: 1320, w: 35, h: 130 },

    // Sala de Máquinas
    { x: 750, y: 420, w: 35, h: 230 },
    { x: 750, y: 850, w: 35, h: 350 },
    { x: 750, y: 1350, w: 35, h: 150 },

    // Capilla - Entrada ancha despejada de 460 a 680
    { x: 350, y: 1500, w: 110, h: 35 },
    { x: 680, y: 1500, w: 70, h: 35 },

    // Enfermería
    { x: 750, y: 1450, w: 180, h: 35 },
    { x: 1150, y: 1450, w: 200, h: 35 },
    { x: 1350, y: 1450, w: 35, h: 370 },

    // Animales
    { x: 1350, y: 1820, w: 130, h: 30 },
    { x: 1620, y: 1820, w: 200, h: 30 },
    { x: 1960, y: 1820, w: 340, h: 30 },
    { x: 1680, y: 1400, w: 25, h: 420 },
    { x: 2000, y: 1400, w: 25, h: 420 },

    // Control
    { x: 2450, y: 800, w: 200, h: 35 },
    { x: 2850, y: 800, w: 500, h: 35 },

    // Almacén
    { x: 2450, y: 420, w: 35, h: 580 },
    { x: 2450, y: 1180, w: 35, h: 620 },
    { x: 2450, y: 1380, w: 200, h: 35 },
    { x: 2850, y: 1380, w: 500, h: 35 },

    // Navegación
    { x: 2850, y: 1620, w: 80, h: 80 }
];

// Red de 6 ventiladores reposicionados en lugares abiertos y despejados
const VENTS = [
    { id: 0, x: 920, y: 580, name: "Electricidad", connects: [1, 4] },
    { id: 1, x: 1520, y: 850, name: "Comedor Principal", connects: [0, 2, 3] },
    { id: 2, x: 2150, y: 1550, name: "Animales", connects: [1, 3] },
    { id: 3, x: 2750, y: 1100, name: "Almacén", connects: [1, 2, 5] },
    { id: 4, x: 450, y: 1750, name: "Capilla", connects: [0] },
    { id: 5, x: 3100, y: 550, name: "Navegación", connects: [3] }
];

const COMPUERTAS = [
    { id: 0, x: 1350, y: 480, w: 35, h: 160, name: "Noroeste" },
    { id: 1, x: 1650, y: 740, w: 200, h: 35, name: "Comedor Norte" },
    { id: 2, x: 2300, y: 1820, w: 35, h: 160, name: "Sureste" }
];

let areDoorsClosed = false;

function checkCollision(x, y, radius) {
    for (let w of walls) {
        const testX = Math.max(w.x, Math.min(x, w.x + w.w));
        const testY = Math.max(w.y, Math.min(y, w.y + w.h));
        const dist = Math.hypot(x - testX, y - testY);
        if (dist < radius) return true;
    }
    if (areDoorsClosed) {
        for (let c of COMPUERTAS) {
            const testX = Math.max(c.x, Math.min(x, c.x + c.w));
            const testY = Math.max(c.y, Math.min(y, c.y + c.h));
            const dist = Math.hypot(x - testX, y - testY);
            if (dist < radius) return true;
        }
    }
    return false;
}

// --- DIBUJADO DE GRÁFICOS REALISTAS 3D PARA EL ARCA DE NOÉ ---

function drawMap() {
    const time = Date.now() * 0.002;

    // 1. Océano Profundo del Diluvio con Ondas Dinámicas
    ctx.fillStyle = '#0a1d37';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    ctx.lineWidth = 3;
    for (let layer = 0; layer < 3; layer++) {
        ctx.strokeStyle = layer === 0 ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.08)';
        const offset = layer * 40;
        for (let y = 80 + offset; y < MAP_HEIGHT; y += 140) {
            ctx.beginPath();
            for (let x = 0; x < MAP_WIDTH; x += 50) {
                const waveY = y + Math.sin(x * 0.015 + time * 1.5 + y) * 14;
                if (x === 0) ctx.moveTo(x, waveY);
                else ctx.lineTo(x, waveY);
            }
            ctx.stroke();
        }
    }

    // 2. Silueta del Casco del Arca
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 50;
    ctx.fillStyle = '#1c0f07';
    ctx.beginPath();
    ctx.moveTo(350, 480);
    ctx.bezierCurveTo(230, 900, 230, 1600, 360, 2030);
    ctx.lineTo(3150, 2050);
    ctx.bezierCurveTo(3440, 1950, 3560, 1400, 3500, 600);
    ctx.lineTo(3100, 380);
    ctx.lineTo(800, 380);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Suelo de Tablones de Madera de Gofer
    ctx.save();
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(340, 390, 3120, 1660);

    const plankW = 95;
    for (let x = 340; x < 3460; x += plankW) {
        const isOdd = Math.floor(x / plankW) % 2 === 0;
        ctx.fillStyle = isOdd ? '#9c663b' : '#88552f';
        ctx.fillRect(x, 390, plankW - 2, 1660);

        ctx.strokeStyle = 'rgba(30, 15, 5, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, 390, plankW - 2, 1660);

        ctx.fillStyle = 'rgba(20, 10, 5, 0.6)';
        for (let ny = 430; ny < 2050; ny += 180) {
            ctx.beginPath(); ctx.arc(x + 12, ny, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + plankW - 14, ny, 2.5, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();

    // 4. Suelos Temáticos Decorativos
    ctx.fillStyle = 'rgba(126, 34, 206, 0.15)';
    ctx.fillRect(1350, 750, 950, 650); // Comedor
    ctx.fillStyle = 'rgba(45, 212, 191, 0.12)';
    ctx.fillRect(750, 1450, 600, 600); // Medbay
    ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
    ctx.fillRect(350, 1500, 400, 550); // Capilla
    ctx.fillStyle = 'rgba(120, 53, 15, 0.2)';
    ctx.fillRect(750, 980, 600, 470);  // Biblioteca
    ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
    ctx.fillRect(1350, 1400, 950, 420); // Animales

    // 5. Muros 3D con Bisel
    walls.forEach(w => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(w.x + 8, w.y + 8, w.w, w.h);

        ctx.fillStyle = '#3a1e0f';
        ctx.fillRect(w.x, w.y, w.w, w.h);

        ctx.fillStyle = '#6b3d1b';
        ctx.fillRect(w.x + 2, w.y + 2, Math.max(1, w.w - 4), Math.min(w.h - 4, 14));

        ctx.strokeStyle = '#1a0b04';
        ctx.lineWidth = 2;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    // 6. Antorchas con Fuego Animado
    const torches = [
        { x: 1400, y: 765 }, { x: 2250, y: 765 }, { x: 1400, y: 1385 }, { x: 2250, y: 1385 },
        { x: 800, y: 995 }, { x: 1300, y: 995 },
        { x: 400, y: 1515 }, { x: 700, y: 1515 },
        { x: 800, y: 1465 }, { x: 1300, y: 1465 },
        { x: 2500, y: 815 }, { x: 3300, y: 815 }
    ];

    torches.forEach((t, i) => {
        const flicker = Math.sin(time * 6 + i) * 6;
        const radius = 60 + flicker;
        ctx.save();
        const glow = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, radius);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
        glow.addColorStop(0.6, 'rgba(245, 158, 11, 0.12)');
        glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(t.x, t.y, radius, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(t.x, t.y - 4, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(t.x, t.y - 6, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });

    // 7. BOTÓN REDONDO DE EMERGENCIA EN (1800, 1100) 360°
    ctx.save();
    const btnPulse = 46 + Math.sin(time * 4) * 3;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath(); ctx.arc(1805, 1105, 66, 0, Math.PI * 2); ctx.fill();

    const pedGrad = ctx.createRadialGradient(1790, 1090, 10, 1800, 1100, 64);
    pedGrad.addColorStop(0, '#475569');
    pedGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = pedGrad;
    ctx.beginPath(); ctx.arc(1800, 1100, 64, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.stroke();

    const redGrad = ctx.createRadialGradient(1790, 1090, 5, 1800, 1100, btnPulse);
    redGrad.addColorStop(0, '#f87171');
    redGrad.addColorStop(0.7, '#dc2626');
    redGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = redGrad;
    ctx.beginPath(); ctx.arc(1800, 1100, btnPulse, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REUNIÓN', 1800, 1104);
    ctx.restore();

    // 8. CAPILLA & ALTAR
    ctx.save();
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✝️', 550, 1860);
    ctx.fillText('🕯️', 490, 1865);
    ctx.fillText('🕯️', 610, 1865);
    ctx.fillText('🛐', 550, 1950);
    ctx.restore();

    // 9. BIBLIOTECA SAGRADA
    ctx.save();
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📜', 1000, 1130);
    ctx.fillText('📖', 1060, 1130);
    ctx.fillText('📚', 1120, 1130);
    ctx.restore();

    // 10. MÁQUINAS: Caldera y Engranaje
    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.arc(490, 730, 55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 4; ctx.stroke();

    const cogAng = time * 2;
    ctx.save();
    ctx.translate(520, 940);
    ctx.rotate(cogAng);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-35, -12, 70, 24);
    ctx.fillRect(-12, -35, 24, 70);
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.beginPath(); ctx.ellipse(580, 1250, 80, 45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 11. ENFERMERÍA
    ctx.save();
    [1540, 1720].forEach(by => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(820, by, 120, 65);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(820, by, 30, 65);
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.strokeRect(820, by, 120, 65);
    });
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(1005, 1460, 30, 10);
    ctx.fillRect(1015, 1450, 10, 30);
    ctx.restore();

    // 12. ANIMALES CON RESPIRACIÓN ANIMADA
    ctx.save();
    const breath = Math.sin(time * 3) * 3;
    ctx.font = '56px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦁', 1480, 1580 + breath);
    ctx.fillText('🐘', 1590, 1740 - breath);
    ctx.fillText('🐑', 1480, 1750);
    ctx.fillText('🐓', 1780, 1580 - breath);
    ctx.fillText('🕊️', 1940, 1560 + breath);
    ctx.fillText('🦆', 1880, 1720);
    ctx.fillText('🐢', 2120, 1600 + breath);
    ctx.fillText('🐍', 2220, 1740);
    ctx.restore();

    // 13. TIMÓN GIRATORIO
    ctx.save();
    ctx.save();
    ctx.translate(2935, 565);
    ctx.rotate(time * 0.5);
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 6; ctx.stroke();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(-4, -62, 8, 30);
        ctx.restore();
    }
    ctx.restore();
    ctx.font = '40px sans-serif';
    ctx.fillText('🗺️', 2680, 450);
    ctx.fillText('⭐', 2935, 450);
    ctx.restore();

    // 14. ALMACÉN Y NAVEGACIÓN
    ctx.save();
    ctx.font = '40px sans-serif';
    ctx.fillText('📦', 2560, 910);
    ctx.fillText('🌾', 2590, 870);
    ctx.fillText('🛢️', 3120, 920);
    ctx.fillText('🧭', 2880, 1660);
    ctx.fillText('🌍', 2650, 1660);
    ctx.restore();

    // 15. COMPUERTAS
    COMPUERTAS.forEach(c => {
        ctx.save();
        if (areDoorsClosed) {
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(c.x, c.y, c.w, c.h);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CERRADO', c.x + c.w / 2, c.y + c.h / 2 + 4);
        } else {
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(c.x, c.y, c.w, c.h);
            ctx.setLineDash([]);
        }
        ctx.restore();
    });

    // 16. VENTILADORES EN EL MAPA
    VENTS.forEach(v => {
        ctx.save();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(v.x, v.y, 25, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        [-10, 0, 10].forEach(ox => {
            ctx.beginPath(); ctx.moveTo(v.x + ox, v.y - 16); ctx.lineTo(v.x + ox, v.y + 16); ctx.stroke();
        });
        ctx.restore();
    });

    // 17. TÍTULOS DE HABITACIONES
    const roomLabels = [
        { name: 'EL COMEDOR PRINCIPAL', x: 1800, y: 920 },
        { name: 'SALA DE CÁMARAS / VIGILANCIA', x: 1825, y: 395 },
        { name: 'ELECTRICIDAD', x: 1050, y: 440 },
        { name: 'BIBLIOTECA SAGRADA', x: 1050, y: 1030 },
        { name: 'SALA DE MÁQUINAS', x: 550, y: 620 },
        { name: 'CAPILLA Y ALTAR', x: 550, y: 1540 },
        { name: 'ENFERMERÍA (MEDBAY)', x: 1050, y: 1980 },
        { name: 'HABITACIONES DE ANIMALES', x: 1825, y: 1435 },
        { name: 'SALA DE CONTROL', x: 2900, y: 405 },
        { name: 'ALMACÉN DE PROVISIONES', x: 2900, y: 830 },
        { name: 'SALA DE NAVEGACIÓN', x: 2900, y: 1410 }
    ];

    ctx.save();
    roomLabels.forEach(lbl => {
        ctx.font = 'bold 14px sans-serif';
        const txtW = ctx.measureText(lbl.name).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(lbl.x - txtW / 2 - 8, lbl.y - 15, txtW + 16, 22);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(lbl.x - txtW / 2 - 8, lbl.y - 15, txtW + 16, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(lbl.name, lbl.x, lbl.y + 1);
    });
    ctx.restore();

    // 18. TAREAS
    if (tasks && tasks.length > 0) {
        tasks.forEach((task, index) => {
            if (completedTasks.has(index)) return;

            const pulse = 24 + Math.sin(time * 4 + index) * 3;
            ctx.save();
            const grad = ctx.createRadialGradient(task.x, task.y, 4, task.x, task.y, pulse * 1.5);
            grad.addColorStop(0, 'rgba(250, 204, 21, 0.9)');
            grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(task.x, task.y, pulse * 1.5, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#facc15';
            ctx.beginPath(); ctx.arc(task.x, task.y, pulse, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 3; ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.font = 'black 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', task.x, task.y + 7);

            const badgeText = `TAREA: ${task.name.toUpperCase()}`;
            ctx.font = 'bold 11px sans-serif';
            const bW = ctx.measureText(badgeText).width;
            ctx.fillStyle = '#facc15';
            ctx.fillRect(task.x - bW / 2 - 6, task.y + pulse + 4, bW + 12, 18);
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.5;
            ctx.strokeRect(task.x - bW / 2 - 6, task.y + pulse + 4, bW + 12, 18);

            ctx.fillStyle = '#000000';
            ctx.fillText(badgeText, task.x, task.y + pulse + 17);
            ctx.restore();
        });
    }

    // 19. PARTÍCULAS
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = 1 - (p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
            particles.splice(i, 1);
        }
    }
}

function drawDeadBody(body) {
    ctx.save();
    ctx.translate(body.x, body.y + 15);

    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI, true);
    ctx.lineTo(-20, 10);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    safeRoundRect(ctx, -5, -20, 10, 20, 5);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function drawPlayer(player) {
    // Si el jugador está dentro de un ventilador, NO se dibuja como cuerpo normal
    if (player.isInVent) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    if (!player.facingRight) {
        ctx.scale(-1, 1);
    }

    if (!player.isAlive) {
        ctx.globalAlpha = 0.45;
        ctx.translate(0, Math.sin(Date.now() / 200) * 5 - 10);
    }

    const color = player.color;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';

    if (player.isAlive) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 30, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    safeRoundRect(ctx, -28, -10, 15, 30, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 22, Math.PI, 0);
    ctx.lineTo(22, 20);
    let isMoving = player.isMoving || false;
    let walkOffset = 0;
    if (isMoving && player.isAlive) {
        walkOffset = Math.sin(Date.now() / 100) * 5;
    }

    ctx.arc(12, 20 + walkOffset, 10, 0, Math.PI);
    ctx.lineTo(-2, 20);
    ctx.arc(-12, 20 - walkOffset, 10, 0, Math.PI);
    ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9bc4e2';
    ctx.beginPath();
    safeRoundRect(ctx, 5, -10, 25, 15, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(20, -5, 6, 2, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px sans-serif';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    const yOffset = player.isAlive ? -35 : -50;
    ctx.strokeText(player.name, 0, yOffset);
    ctx.fillText(player.name, 0, yOffset);
    ctx.restore();
}

// DIBUJADO DE JUDAS DENTRO DEL VENTILADOR + FLECHITAS DE NAVEGACIÓN EN PANTALLA
function drawJudasInVent(me) {
    ventArrowHitboxes = [];
    const time = Date.now() * 0.003;

    ctx.save();
    ctx.translate(me.x, me.y);

    // 1. Rejilla de ventilador abierta con brillo rojo
    ctx.fillStyle = 'rgba(220, 38, 38, 0.4)';
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.stroke();

    // 2. Cabeza y capucha de Judas asomándose por la rejilla
    ctx.fillStyle = '#1e1b4b'; // Capucha oscura
    ctx.beginPath(); ctx.arc(0, -6, 22, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

    // Ojos rojos brillantes del impostor
    ctx.fillStyle = '#f87171';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(-7, -4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 3. Buscar el ventilador actual y sus conexiones
    const currVent = VENTS.find(v => v.id === me.currentVent) || 
                     VENTS.find(v => Math.hypot(me.x - v.x, me.y - v.y) < 60) || VENTS[0];

    if (currVent && currVent.connects) {
        currVent.connects.forEach((targetId) => {
            const targetVent = VENTS.find(v => v.id === targetId);
            if (!targetVent) return;

            // Vector de dirección hacia el ventilador conectado
            const angle = Math.atan2(targetVent.y - currVent.y, targetVent.x - currVent.x);
            const distRadius = 110 + Math.sin(time * 4) * 8;
            const arrowX = currVent.x + Math.cos(angle) * distRadius;
            const arrowY = currVent.y + Math.sin(angle) * distRadius;

            // Guardar hitbox para clic/toque
            ventArrowHitboxes.push({
                x: arrowX,
                y: arrowY,
                radius: 40,
                targetId: targetId
            });

            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);

            // Flecha 3D brillante pulsante
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(25, 0);
            ctx.lineTo(-15, -18);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-15, 18);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Etiqueta del destino
            ctx.rotate(-angle); // No rotar el texto para legibilidad
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            const txt = `➡️ ${targetVent.name.toUpperCase()}`;
            const tw = ctx.measureText(txt).width;
            ctx.fillRect(-tw / 2 - 6, 22, tw + 12, 18);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1;
            ctx.strokeRect(-tw / 2 - 6, 22, tw + 12, 18);
            ctx.fillStyle = '#fef08a';
            ctx.textAlign = 'center';
            ctx.fillText(txt, 0, 35);

            ctx.restore();
        });
    }
}

let lastStepTime = 0;

function update() {
    if (players[myId]) {
        const me = players[myId];
        const CONSTANT_SPEED = 5.5; // Velocidad normal, idéntica y constante para todos los personajes
        let moved = false;
        let rawDx = 0; let rawDy = 0;

        if (!me.isInVent) {
            if (keys.w || keys.ArrowUp) rawDy -= 1;
            if (keys.s || keys.ArrowDown) rawDy += 1;
            if (keys.a || keys.ArrowLeft) rawDx -= 1;
            if (keys.d || keys.ArrowRight) rawDx += 1;
            
            if (joystickMove.x !== 0 || joystickMove.y !== 0) {
                rawDx += joystickMove.x;
                rawDy += joystickMove.y;
            }

            let dx = 0;
            let dy = 0;
            const inputLen = Math.hypot(rawDx, rawDy);
            if (inputLen > 0) {
                // Normalización exacta: misma velocidad fija sin aceleración ni ventaja diagonal
                dx = (rawDx / inputLen) * CONSTANT_SPEED;
                dy = (rawDy / inputLen) * CONSTANT_SPEED;
            }
            
            if (dx < 0) me.facingRight = false;
            if (dx > 0) me.facingRight = true;

            if ((dx !== 0 || dy !== 0) && !isMeeting) {
                me.isMoving = true;
                let nextX = me.x + dx;
                let nextY = me.y + dy;

                if (me.isAlive) {
                    nextX = Math.max(220, Math.min(MAP_WIDTH - 220, nextX));
                    nextY = Math.max(220, Math.min(MAP_HEIGHT - 230, nextY));
                    
                    if (!checkCollision(nextX, me.y, 25)) {
                        me.x = nextX;
                    }
                    if (!checkCollision(me.x, nextY, 25)) {
                        me.y = nextY;
                    }
                } else {
                    me.x = nextX;
                    me.y = nextY;
                    me.x = Math.max(20, Math.min(MAP_WIDTH - 20, me.x));
                    me.y = Math.max(20, Math.min(MAP_HEIGHT - 20, me.y));
                }

                if (Date.now() - lastStepTime > 320) {
                    lastStepTime = Date.now();
                    if (window.gameAudio) window.gameAudio.playFootstep();
                    addParticle(me.x, me.y + 25, (Math.random() - 0.5) * 1.5, -Math.random() * 1.5, 'rgba(180, 140, 90, 0.4)', 4, 15);
                }

                moved = true;
            }

            if (moved) {
                socket.emit('playerMovement', { x: me.x, y: me.y, facingRight: me.facingRight, isMoving: true });
            } else if (me.isMoving) {
                me.isMoving = false;
                socket.emit('playerMovement', { x: me.x, y: me.y, facingRight: me.facingRight, isMoving: false });
            }
        }

        camera.x = me.x - canvas.width / 2;
        camera.y = me.y - canvas.height / 2;
        camera.x = Math.max(0, Math.min(MAP_WIDTH - canvas.width, camera.x));
        camera.y = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, camera.y));

        let canKill = false;
        let canReport = false;
        let canEmergency = false;
        let canTask = false;
        let nearVent = null;
        
        let killTarget = null;
        let taskTarget = null;

        if (me.isAlive && !isMeeting) {
            btnAction.style.display = 'flex';
            btnAction.style.opacity = '0.5';
            btnAction.innerText = 'USAR';
            btnAction.style.fontSize = '14px';
            btnAction.style.borderColor = 'white';
            btnAction.style.boxShadow = 'none';
            btnAction.style.background = 'rgba(15, 23, 42, 0.85)';

            if (!me.isInVent) {
                for (let body of deadBodies) {
                    if (Math.hypot(me.x - body.x, me.y - body.y) < 160) {
                        canReport = true;
                        break;
                    }
                }
            }
            
            // Botón de emergencia redondo 360° en (1800, 1100)
            if (!me.isInVent && Math.hypot(me.x - 1800, me.y - 1100) < 190) {
                canEmergency = true;
            }

            if (!me.isImposter && !me.isInVent) {
                let minDistance = 110;
                if (tasks) {
                    tasks.forEach((task, index) => {
                        if (!completedTasks.has(index)) {
                            const dist = Math.hypot(me.x - task.x, me.y - task.y);
                            if (dist < minDistance) {
                                minDistance = dist;
                                taskTarget = task;
                                taskTarget.index = index;
                                canTask = true;
                            }
                        }
                    });
                }
            }

            if (me.isImposter && !me.isInVent) {
                let minDistance = 125;
                for (const id in players) {
                    if (id !== myId && players[id].isAlive && !players[id].isImposter && !players[id].isInVent) {
                        const dist = Math.hypot(me.x - players[id].x, me.y - players[id].y);
                        if (dist < minDistance) {
                            minDistance = dist;
                            killTarget = id;
                            canKill = true;
                        }
                    }
                }
            }

            if (me.isImposter) {
                if (me.isInVent) {
                    btnAction.style.opacity = '1';
                    btnAction.innerText = 'SALIR';
                    btnAction.style.fontSize = '14px';
                    btnAction.style.borderColor = '#10b981';
                    btnAction.style.boxShadow = '0 0 25px #10b981';
                    btnAction.style.background = 'rgba(16, 185, 129, 0.75)';
                } else {
                    for (let v of VENTS) {
                        if (Math.hypot(me.x - v.x, me.y - v.y) < 85) {
                            nearVent = v;
                            break;
                        }
                    }
                }
            }
            
            if (me.isInVent) {
                // Configurado como SALIR
            } else if (canReport) {
                btnAction.style.opacity = '1';
                btnAction.innerText = 'REPORTAR';
                btnAction.style.fontSize = '11px';
                btnAction.style.borderColor = 'orange';
                btnAction.style.boxShadow = '0 0 20px orange';
                btnAction.style.background = 'rgba(255, 165, 0, 0.6)';
            } else if (canEmergency) {
                btnAction.style.opacity = '1';
                btnAction.innerText = 'REUNIÓN';
                btnAction.style.fontSize = '12px';
                btnAction.style.borderColor = '#ef4444';
                btnAction.style.boxShadow = '0 0 25px #ef4444';
                btnAction.style.background = 'rgba(239, 68, 68, 0.7)';
            } else if (canKill) {
                btnAction.style.opacity = '1';
                btnAction.innerText = 'MATAR';
                btnAction.style.fontSize = '14px';
                btnAction.style.borderColor = '#ef4444';
                btnAction.style.boxShadow = '0 0 25px #ef4444';
                btnAction.style.background = 'rgba(239, 68, 68, 0.7)';
            } else if (nearVent) {
                btnAction.style.opacity = '1';
                btnAction.innerText = 'ENTRAR';
                btnAction.style.fontSize = '12px';
                btnAction.style.borderColor = '#f59e0b';
                btnAction.style.boxShadow = '0 0 20px #f59e0b';
                btnAction.style.background = 'rgba(245, 158, 11, 0.7)';
            } else if (canTask) {
                btnAction.style.opacity = '1';
                btnAction.innerText = 'TAREA';
                btnAction.style.fontSize = '14px';
                btnAction.style.borderColor = '#4ade80';
                btnAction.style.boxShadow = '0 0 20px #4ade80';
                btnAction.style.background = 'rgba(34, 197, 94, 0.6)';
            }
            
            if (keys[' '] || keys['e'] || keys['E'] || keys['r'] || keys['R'] || keys['v'] || keys['V']) {
                if (me.isInVent) {
                    socket.emit('exitVent');
                } else if (nearVent && (keys['v'] || keys['V'] || keys[' '])) {
                    socket.emit('enterVent', nearVent.id);
                } else if (canReport) {
                    socket.emit('reportBody');
                } else if (canKill) {
                    socket.emit('kill', killTarget);
                } else if (canEmergency) {
                    if (window.gameAudio) window.gameAudio.playEmergency();
                    socket.emit('callEmergency');
                } else if (canTask && taskModal.style.display === 'none') {
                    openTaskModal(taskTarget, taskTarget.index);
                }
                
                if ((keys['e'] || keys['E']) && Math.hypot(me.x - 1520, me.y - 490) < 70) {
                    socket.emit('toggleDoors');
                }
                keys[' '] = keys['e'] = keys['E'] = keys['r'] = keys['R'] = keys['v'] = keys['V'] = false;
            }
        }
    }
}

socket.on('doorsClosed', (data) => {
    areDoorsClosed = true;
    showNotification("⚠️ ¡COMPUERTAS DE SEGURIDAD DEL ARCA CERRADAS!");
    setTimeout(() => {
        areDoorsClosed = false;
        showNotification("Compuertas de seguridad reabiertas.");
    }, data.duration || 10000);
});

socket.on('updateTaskProgress', (percent) => {
    taskProgress = percent;
    const taskFill = document.getElementById('taskFill');
    if (taskFill) taskFill.style.width = percent + '%';
});

function updateTaskChecklist(task) {
    if (!task) return;
    const el = document.getElementById(`chk-${task.id}`);
    if (el) {
        el.classList.add('done');
        const box = el.querySelector('.box');
        if (box) box.innerText = '☑';
    }

    // Efecto de celebración con banner y estrellas
    if (taskCompleteBanner) {
        taskCompleteBanner.classList.add('show');
        setTimeout(() => taskCompleteBanner.classList.remove('show'), 2200);
    }

    if (players[myId]) {
        for (let i = 0; i < 30; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 4 + 2;
            addParticle(players[myId].x, players[myId].y, Math.cos(ang) * spd, Math.sin(ang) * spd, '#facc15', 5, 40);
        }
    }
}

function openTaskModal(task, taskIndex) {
    activeTask = task;
    activeTask.index = taskIndex;
    
    if (window.miniGameManager) {
        window.miniGameManager.startTask(task, () => {
            socket.emit('taskCompleted');
            completedTasks.add(activeTask.index);
            updateTaskChecklist(activeTask);
            showNotification(`¡Tarea completada: ${task.name}!`);
            activeTask = null;
        });
    }
}

// Map Overview Modal
const mapModal = document.getElementById('mapModal');
const btnMapOverview = document.getElementById('btnMapOverview');
const btnCloseMap = document.getElementById('btnCloseMap');
const overviewMapCanvas = document.getElementById('overviewMapCanvas');

function renderOverviewMap() {
    if (!overviewMapCanvas) return;
    const mctx = overviewMapCanvas.getContext('2d');
    mctx.clearRect(0, 0, 800, 500);

    mctx.save();
    mctx.scale(800 / MAP_WIDTH, 500 / MAP_HEIGHT);

    mctx.fillStyle = '#2d180d';
    mctx.fillRect(300, 350, 3200, 1740);

    mctx.fillStyle = '#9c6f44';
    mctx.fillRect(340, 390, 3120, 1660);

    walls.forEach(w => {
        mctx.fillStyle = '#422513';
        mctx.fillRect(w.x, w.y, w.w, w.h);
    });

    mctx.fillStyle = '#f8fafc';
    mctx.font = 'bold 36px sans-serif';
    mctx.textAlign = 'center';
    mctx.fillText('COMEDOR PRINCIPAL', 1800, 1080);
    mctx.fillText('VIGILANCIA', 1825, 600);
    mctx.fillText('ELECTRICIDAD', 1050, 700);
    mctx.fillText('BIBLIOTECA', 1050, 1200);
    mctx.fillText('SALA DE MÁQUINAS', 550, 950);
    mctx.fillText('CAPILLA', 550, 1750);
    mctx.fillText('ENFERMERÍA', 1050, 1750);
    mctx.fillText('ANIMALES', 1825, 1620);
    mctx.fillText('SALA DE CONTROL', 2900, 600);
    mctx.fillText('ALMACÉN', 2900, 1100);
    mctx.fillText('NAVEGACIÓN', 2900, 1700);

    mctx.fillStyle = '#dc2626';
    mctx.beginPath(); mctx.arc(1800, 1100, 40, 0, Math.PI * 2); mctx.fill();

    if (tasks) {
        tasks.forEach((t, i) => {
            if (!completedTasks.has(i)) {
                mctx.fillStyle = '#facc15';
                mctx.beginPath(); mctx.arc(t.x, t.y, 24, 0, Math.PI * 2); mctx.fill();
            }
        });
    }

    if (players[myId]) {
        mctx.fillStyle = '#38bdf8';
        mctx.beginPath(); mctx.arc(players[myId].x, players[myId].y, 40, 0, Math.PI * 2); mctx.fill();
        mctx.strokeStyle = '#ffffff'; mctx.lineWidth = 8; mctx.stroke();
    }
    mctx.restore();
}

if (btnMapOverview) {
    btnMapOverview.addEventListener('click', () => {
        const isOpen = mapModal.style.display === 'flex';
        mapModal.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) renderOverviewMap();
    });
}
if (btnCloseMap) {
    btnCloseMap.addEventListener('click', () => {
        mapModal.style.display = 'none';
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
        if (mapModal) {
            const isOpen = mapModal.style.display === 'flex';
            mapModal.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) renderOverviewMap();
        }
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Efecto de sacudida de pantalla (Screen Shake)
    let shakeX = 0;
    let shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.88;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

    drawMap();

    deadBodies.forEach(body => drawDeadBody(body));

    for (const id in players) {
        if (!players[id].isAlive) drawPlayer(players[id]);
    }
    for (const id in players) {
        if (players[id].isAlive) drawPlayer(players[id]);
    }

    // SI JUDAS ESTÁ DENTRO DE UN VENTILADOR, DIBUJAR SU CABEZA ASOMÁNDOSE Y LAS FLECHAS
    if (players[myId] && players[myId].isInVent && players[myId].isImposter) {
        drawJudasInVent(players[myId]);
    }

    ctx.restore();
    drawMinimap();
}

function drawMinimap() {
    if (!players[myId]) return;
    
    const minimapSize = 180;
    const margin = 16;
    const mapX = canvas.width - minimapSize - margin;
    const mapY = margin;
    
    ctx.fillStyle = 'rgba(10, 25, 47, 0.85)';
    ctx.fillRect(mapX, mapY, minimapSize, minimapSize);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, minimapSize, minimapSize);
    
    const scaleX = minimapSize / MAP_WIDTH;
    const scaleY = minimapSize / MAP_HEIGHT;
    
    ctx.fillStyle = '#78350f';
    ctx.fillRect(mapX + (300 * scaleX), mapY + (350 * scaleY), (MAP_WIDTH - 600) * scaleX, (MAP_HEIGHT - 700) * scaleY);
    
    ctx.fillStyle = '#451a03';
    walls.forEach(w => {
        ctx.fillRect(mapX + (w.x * scaleX), mapY + (w.y * scaleY), Math.max(1, w.w * scaleX), Math.max(1, w.h * scaleY));
    });
    
    if (!players[myId].isImposter) {
        ctx.fillStyle = '#facc15';
        tasks.forEach((task, index) => {
            if (!completedTasks.has(index)) {
                ctx.beginPath();
                ctx.arc(mapX + (task.x * scaleX), mapY + (task.y * scaleY), 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    const me = players[myId];
    if (!me.isInVent) {
        ctx.fillStyle = me.isImposter ? '#ef4444' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(mapX + (me.x * scaleX), mapY + (me.y * scaleY), 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

socket.on('gameOver', (data) => {
    gameState = 'GAME_OVER';

    // 1. Ocultar inmediatamente la pantalla y el mapa del juego para que NO se vea debajo
    const gScreen = document.getElementById('gameScreen');
    if (gScreen) {
        gScreen.classList.remove('active');
        gScreen.style.display = 'none';
    }

    const meetScreen = document.getElementById('meetingScreen');
    if (meetScreen) meetScreen.style.display = 'none';

    if (window.miniGameManager) window.miniGameManager.close();

    // 2. Reactivar el fondo cinematográfico de la tormenta detrás de la victoria
    if (window.stormBg) {
        window.stormBg.start();
    }

    const goScreen = document.getElementById('gameOverScreen');
    const goCard = document.getElementById('goCard');
    const goIcon = document.getElementById('goIcon');
    const goTitle = document.getElementById('goTitle');
    const goWinner = document.getElementById('goWinner');
    const goReason = document.getElementById('goReason');
    const goImpName = document.getElementById('goImposterName');
    const goCountdown = document.getElementById('goCountdownNum');

    if (goImpName) {
        goImpName.innerText = data.imposterName || 'Judas';
    }

    if (data.winner === 'Fieles') {
        if (goIcon) goIcon.innerText = '🏆✨';
        if (goTitle) {
            goTitle.innerText = '¡VICTORIA DE LOS FIELES!';
            goTitle.style.color = '#facc15';
        }
        if (goWinner) {
            goWinner.innerText = '¡Los Santos del Arca Triunfaron!';
            goWinner.style.color = '#4ade80';
        }
        if (goCard) {
            goCard.style.borderColor = '#16a34a';
            goCard.style.boxShadow = '0 0 45px rgba(34, 197, 94, 0.45)';
        }
        if (window.gameAudio) window.gameAudio.playTaskComplete();
    } else {
        if (goIcon) goIcon.innerText = '☠️⚡';
        if (goTitle) {
            goTitle.innerText = '¡VICTORIA DE JUDAS!';
            goTitle.style.color = '#ef4444';
        }
        if (goWinner) {
            goWinner.innerText = '¡Judas Saboteó la Misión del Arca!';
            goWinner.style.color = '#f87171';
        }
        if (goCard) {
            goCard.style.borderColor = '#dc2626';
            goCard.style.boxShadow = '0 0 45px rgba(239, 68, 68, 0.45)';
        }
        if (window.gameAudio) window.gameAudio.playEmergency();
    }

    if (goReason) goReason.innerText = data.reason;
    if (goScreen) goScreen.style.display = 'flex';

    // Cuenta regresiva de 12 segundos para dar tiempo suficiente
    let remaining = 12;
    if (goCountdown) goCountdown.innerText = remaining;
    if (gameOverTimer) clearInterval(gameOverTimer);
    gameOverTimer = setInterval(() => {
        remaining--;
        if (goCountdown) goCountdown.innerText = remaining;
        if (remaining <= 0) {
            clearInterval(gameOverTimer);
            gameOverTimer = null;
            gameState = 'LOBBY';
            if (goScreen) goScreen.style.display = 'none';
            socket.emit('returnToLobby');
        }
    }, 1000);
});

// Botón de regreso inmediato a la sala de espera
const btnReturnLobbyEl = document.getElementById('btnReturnToLobby');
if (btnReturnLobbyEl) {
    btnReturnLobbyEl.onclick = () => {
        if (gameOverTimer) {
            clearInterval(gameOverTimer);
            gameOverTimer = null;
        }
        gameState = 'LOBBY';
        const goScreen = document.getElementById('gameOverScreen');
        if (goScreen) goScreen.style.display = 'none';
        if (window.gameAudio) window.gameAudio.playClick();
        socket.emit('returnToLobby');
    };
}
