const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: { origin: "*" },
    pingInterval: 10000,
    pingTimeout: 20000
});

app.use(express.static('public'));

const colors = ['#c51111', '#132ed1', '#117f2d', '#ed54ba', '#ef7d0d', '#f5f557', '#3f474e', '#d6e0f0', '#6b2fbb', '#38fedc'];

const MAP_WIDTH = 3800;
const MAP_HEIGHT = 2500;

// Paredes perimetrales y divisiones principales de habitaciones.
// NOTA: Se eliminaron obstáculos decorativos (altares, mesas, etc.) para que nadie quede atrapado y el paso sea 100% fluido!
const walls = [
    // Borde exterior del casco del Arca
    { x: 300, y: 350, w: 3200, h: 40 },  // Arriba
    { x: 300, y: 2050, w: 3200, h: 40 }, // Abajo
    { x: 300, y: 350, w: 40, h: 1740 },  // Izquierda (Popa)
    { x: 3460, y: 350, w: 40, h: 1740 }, // Derecha (Proa)

    // 1. EL COMEDOR PRINCIPAL (Centro: x 1350 to 2300, y 750 to 1400)
    // Pared izquierda Comedor (puerta amplia 960-1200)
    { x: 1350, y: 750, w: 35, h: 210 },
    { x: 1350, y: 1200, w: 35, h: 200 },

    // Pared derecha Comedor (puerta amplia 960-1200)
    { x: 2300, y: 750, w: 35, h: 210 },
    { x: 2300, y: 1200, w: 35, h: 200 },

    // Pared superior Comedor / Inferior Vigilancia (puerta compuerta 1650-1950)
    { x: 1350, y: 750, w: 300, h: 35 },
    { x: 1950, y: 750, w: 385, h: 35 },

    // Pared inferior Comedor / Superior Habitaciones (puerta amplia 1950-2250)
    { x: 1350, y: 1400, w: 600, h: 35 },
    { x: 2250, y: 1400, w: 85, h: 35 },

    // 2. SALA DE CÁMARAS / VIGILANCIA (x 1350 to 2300, y 420 to 750)
    { x: 1350, y: 420, w: 35, h: 60 },
    { x: 1350, y: 640, w: 35, h: 110 },
    { x: 2300, y: 420, w: 35, h: 330 },

    // 3. ELECTRICIDAD & PASILLO SUPERIOR (x 750 to 1350, y 420 to 980)
    { x: 750, y: 980, w: 170, h: 35 },
    { x: 1120, y: 980, w: 230, h: 35 },

    // 4. BIBLIOTECA SAGRADA (x 750 to 1350, y 980 to 1450)
    { x: 750, y: 980, w: 35, h: 200 },
    { x: 750, y: 1320, w: 35, h: 130 },

    // 5. SALA DE MÁQUINAS / BOMBAS (x 350 to 750, y 450 to 1500)
    { x: 750, y: 420, w: 35, h: 230 },
    { x: 750, y: 850, w: 35, h: 350 },
    { x: 750, y: 1350, w: 35, h: 150 },

    // 6. CAPILLA & ALTAR DE ORACIÓN (x 350 to 750, y 1500 to 2050)
    // Puerta amplia entre Máquinas y Capilla (460 a 680) - ¡Completamente libre y despejada!
    { x: 350, y: 1500, w: 110, h: 35 },
    { x: 680, y: 1500, w: 70, h: 35 },

    // 7. ENFERMERÍA (MEDBAY) (x 750 to 1350, y 1450 to 2050)
    { x: 750, y: 1450, w: 180, h: 35 },
    { x: 1150, y: 1450, w: 200, h: 35 },
    { x: 1350, y: 1450, w: 35, h: 370 },

    // 8. HABITACIONES DE ANIMALES & PASILLOS (x 1350 to 2300, y 1400 to 2050)
    { x: 1350, y: 1820, w: 130, h: 30 },
    { x: 1620, y: 1820, w: 200, h: 30 },
    { x: 1960, y: 1820, w: 340, h: 30 },
    { x: 1680, y: 1400, w: 25, h: 420 },
    { x: 2000, y: 1400, w: 25, h: 420 },

    // 9. SALA DE CONTROL / TIMÓN (x 2450 to 3350, y 380 to 800)
    { x: 2450, y: 800, w: 200, h: 35 },
    { x: 2850, y: 800, w: 500, h: 35 },

    // 10. ALMACÉN DE PROVISIONES (x 2450 to 3350, y 800 to 1380)
    { x: 2450, y: 420, w: 35, h: 580 },
    { x: 2450, y: 1180, w: 35, h: 620 },
    { x: 2450, y: 1380, w: 200, h: 35 },
    { x: 2850, y: 1380, w: 500, h: 35 },

    // 11. SALA DE NAVEGACIÓN (x 2450 to 3350, y 1380 to 2050)
    { x: 2850, y: 1620, w: 80, h: 80 }
];

function checkLineOfSight(x1, y1, x2, y2) {
    for (let w of walls) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        if (maxX >= w.x && minX <= w.x + w.w && maxY >= w.y && minY <= w.y + w.h) {
            return false;
        }
    }
    return true;
}

// 13 Tareas Bíblicas Variadas y Desafiantes (Sin tareas infantiles)
const ROOM_TASKS = [
    { id: "tabernaculo", x: 530, y: 1780, name: "Ordenar los Utensilios Sagrados", room: "CAPILLA", taskType: "tabernacle" },
    { id: "codos", x: 2950, y: 550, name: "Calcular los 300 Codos Sagrados", room: "SALA DE CONTROL", taskType: "cubits" },
    { id: "manuscrito", x: 1100, y: 1200, name: "Restaurar Manuscrito del Génesis", room: "BIBLIOTECA SAGRADA", taskType: "manuscript" },
    { id: "brea_casco", x: 580, y: 1250, name: "Calafatear con Brea el Casco (Génesis 6:14)", room: "SALA DE MÁQUINAS", taskType: "pitch" },
    { id: "achicar_agua", x: 680, y: 1350, name: "Achicar Agua de la Sentina", room: "SALA DE MÁQUINAS", taskType: "water" },
    { id: "cables_up", x: 1000, y: 560, name: "Conectar Cordones Sagrados", room: "ELECTRICIDAD", taskType: "wires" },
    { id: "cables_down", x: 1000, y: 920, name: "Reparar Farol de Proa", room: "ELECTRICIDAD", taskType: "wires" },
    { id: "diferencias", x: 2880, y: 1650, name: "Encontrar Diferencias en el Arca", room: "SALA DE NAVEGACIÓN", taskType: "diff" },
    { id: "escanear", x: 1180, y: 1650, name: "Inspección de Cuarentena Levítica", room: "ENFERMERÍA", taskType: "scan" },
    { id: "memorizar", x: 1860, y: 1680, name: "Símbolos Sagrados del Pacto", room: "AVES", taskType: "memory" },
    { id: "quiz_profetas", x: 2150, y: 820, name: "Cuestionario Bíblico Avanzado", room: "EL COMEDOR PRINCIPAL", taskType: "quiz" },
    { id: "quiz_reyes", x: 2880, y: 1050, name: "Historia y Profecías Bíblicas", room: "ALMACÉN", taskType: "quiz" },
    { id: "versiculo", x: 1520, y: 1620, name: "Armar Promesa de Isaías 40:31", room: "HABITACIONES", taskType: "verse" }
];

// Red de 6 ventiladores estratégicos, amplios, sin colisión con ninguna pared
const VENTS = [
    { id: 0, x: 920, y: 580, name: "Electricidad", connects: [1, 4] },
    { id: 1, x: 1520, y: 850, name: "Comedor Principal", connects: [0, 2, 3] },
    { id: 2, x: 2150, y: 1550, name: "Habitaciones de Animales", connects: [1, 3] },
    { id: 3, x: 2750, y: 1100, name: "Almacén de Provisiones", connects: [1, 2, 5] },
    { id: 4, x: 450, y: 1750, name: "Capilla de Oración", connects: [0] },
    { id: 5, x: 3100, y: 550, name: "Sala de Navegación", connects: [3] }
];

const rooms = {};

function createRoomData() {
    return {
        players: {},
        deadBodies: [],
        gameState: 'LOBBY',
        hostId: null,
        globalTaskProgress: 0,
        MAX_TASKS: 1,
        colorIndex: 0,
        isMeeting: false,
        meetingTimer: null,
        votes: {},
        meetingTimeLeft: 0,
        meetingInterval: null,
        disconnectedPlayers: {}
    };
}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function startMeeting(roomCode, callerId) {
    const room = rooms[roomCode];
    if (!room || room.isMeeting) return;
    
    room.isMeeting = true;
    room.votes = {};
    room.meetingTimeLeft = 35;
    
    // Forzar a cualquier impostor en ventilador a salir
    for (let id in room.players) {
        if (room.players[id].isInVent) {
            room.players[id].isInVent = false;
        }
    }

    // Centrar jugadores alrededor del pedestal de emergencia en Comedor (1800, 1100)
    let pIdx = 0;
    const totalP = Math.max(1, Object.keys(room.players).length);
    for (let id in room.players) {
        if (room.players[id].isAlive) {
            const angle = (pIdx / totalP) * Math.PI * 2;
            room.players[id].x = 1800 + Math.cos(angle) * 260;
            room.players[id].y = 1100 + Math.sin(angle) * 160;
            pIdx++;
        }
    }
    
    io.to(roomCode).emit('meetingStarted', { callerId, time: room.meetingTimeLeft, players: room.players });
    
    room.meetingInterval = setInterval(() => {
        room.meetingTimeLeft--;
        io.to(roomCode).emit('meetingTimer', room.meetingTimeLeft);
        if (room.meetingTimeLeft <= 0) {
            endMeeting(roomCode);
        }
    }, 1000);
}

function endMeeting(roomCode) {
    const room = rooms[roomCode];
    if (!room || !room.isMeeting) return;
    
    room.isMeeting = false;
    clearInterval(room.meetingInterval);
    
    const voteCounts = {};
    let maxVotes = 0;
    let ejectedId = null;
    let tie = false;
    
    for (let id in room.votes) {
        const votedFor = room.votes[id];
        if (votedFor !== 'skip') {
            voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
            if (voteCounts[votedFor] > maxVotes) {
                maxVotes = voteCounts[votedFor];
                ejectedId = votedFor;
                tie = false;
            } else if (voteCounts[votedFor] === maxVotes) {
                tie = true;
            }
        }
    }
    
    if (ejectedId && !tie) {
        if (room.players[ejectedId]) {
            room.players[ejectedId].isAlive = false;
        }
    } else {
        ejectedId = null;
    }
    
    room.deadBodies = [];
    
    io.to(roomCode).emit('meetingEnded', { ejectedId, players: room.players, tie });
    
    setTimeout(() => {
        checkWinCondition(roomCode);
    }, 1200);
}

function checkWinCondition(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.gameState !== 'PLAYING') return;

    let faithfulAlive = 0;
    let imposterAlive = 0;

    for (let id in room.players) {
        if (room.players[id].isAlive) {
            if (room.players[id].isImposter) {
                imposterAlive++;
            } else {
                faithfulAlive++;
            }
        }
    }

    let imposterName = '';
    for (let id in room.players) {
        if (room.players[id].isImposter) {
            imposterName = room.players[id].name;
            break;
        }
    }

    if (imposterAlive === 0 || room.globalTaskProgress >= room.MAX_TASKS) {
        room.gameState = 'GAME_OVER';
        io.to(roomCode).emit('gameOver', { 
            winner: 'Fieles', 
            reason: imposterAlive === 0 ? '¡Judas fue descubierto y expulsado del Arca!' : '¡Todas las tareas bíblicas completadas con éxito!',
            imposterName: imposterName || 'Judas'
        });
        resetGameToLobby(roomCode);
    } else if (imposterAlive >= faithfulAlive) {
        room.gameState = 'GAME_OVER';
        io.to(roomCode).emit('gameOver', { 
            winner: 'Judas', 
            reason: '¡Judas saboteó la misión del Arca y engañó a la tripulación!',
            imposterName: imposterName || 'Judas'
        });
        resetGameToLobby(roomCode);
    }
}

function resetGameToLobby(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    
    if (room.resetTimer) clearTimeout(room.resetTimer);
    
    const performReset = () => {
        if (!rooms[roomCode]) return;
        const r = rooms[roomCode];
        r.gameState = 'LOBBY';
        r.deadBodies = [];
        r.globalTaskProgress = 0;
        
        for (let id in r.players) {
            r.players[id].isAlive = true;
            r.players[id].isImposter = false;
            r.players[id].isInVent = false;
            r.players[id].completedTasks = [];
        }
        
        io.to(roomCode).emit('lobbyUpdate', { players: r.players, hostId: r.hostId, roomCode: roomCode });
    };

    room.resetTimer = setTimeout(performReset, 12000);
}

io.on('connection', (socket) => {
    let currentRoom = null;
    let playerToken = null;

    socket.on('returnToLobby', () => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        if (room.resetTimer) {
            clearTimeout(room.resetTimer);
            room.resetTimer = null;
        }
        room.gameState = 'LOBBY';
        room.deadBodies = [];
        room.globalTaskProgress = 0;
        for (let id in room.players) {
            room.players[id].isAlive = true;
            room.players[id].isImposter = false;
            room.players[id].isInVent = false;
            room.players[id].completedTasks = [];
        }
        io.to(currentRoom).emit('lobbyUpdate', { players: room.players, hostId: room.hostId, roomCode: currentRoom });
    });

    socket.on('reconnectSession', (data) => {
        const { roomCode, token } = data;
        const room = rooms[roomCode];
        if (!room) return socket.emit('sessionRestoreFailed', 'La sala ya no existe.');

        let targetId = null;
        for (let id in room.players) {
            if (room.players[id].token === token) {
                targetId = id;
                break;
            }
        }

        if (targetId) {
            const oldPlayer = room.players[targetId];
            delete room.players[targetId];
            
            if (room.disconnectedPlayers[token]) {
                clearTimeout(room.disconnectedPlayers[token]);
                delete room.disconnectedPlayers[token];
            }

            oldPlayer.id = socket.id;
            oldPlayer.disconnected = false;
            room.players[socket.id] = oldPlayer;
            currentRoom = roomCode;
            playerToken = token;
            socket.join(roomCode);

            if (room.hostId === targetId) {
                room.hostId = socket.id;
            }

            socket.emit('sessionRestored', {
                roomCode,
                player: oldPlayer,
                gameState: room.gameState,
                tasks: ROOM_TASKS,
                vents: VENTS,
                players: room.players,
                taskProgress: (room.globalTaskProgress / Math.max(1, room.MAX_TASKS)) * 100,
                isMeeting: room.isMeeting,
                deadBodies: room.deadBodies
            });

            io.to(roomCode).emit('playerReconnected', { playerId: socket.id, name: oldPlayer.name });
            return;
        }

        socket.emit('sessionRestoreFailed', 'Sesión expirada.');
    });

    socket.on('createRoom', (data) => {
        const playerName = typeof data === 'object' ? data.name : data;
        const clientToken = (typeof data === 'object' && data.token) ? data.token : `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const roomCode = generateRoomCode();
        rooms[roomCode] = createRoomData();
        const room = rooms[roomCode];
        
        currentRoom = roomCode;
        playerToken = clientToken;
        socket.join(roomCode);
        
        const assignedColor = colors[room.colorIndex % colors.length];
        room.colorIndex++;
        
        room.players[socket.id] = {
            id: socket.id,
            token: clientToken,
            name: playerName || `Noé${Math.floor(Math.random() * 1000)}`,
            x: 1800 + (Math.random() * 160 - 80),
            y: 1100 + (Math.random() * 100 - 50),
            color: assignedColor,
            isImposter: false,
            isAlive: true,
            isInVent: false,
            facingRight: true,
            lastKillTime: 0
        };
        
        room.hostId = socket.id;
        socket.emit('roomJoined', { roomCode, token: clientToken, players: room.players, hostId: room.hostId });
        io.to(roomCode).emit('lobbyUpdate', { players: room.players, hostId: room.hostId });
    });

    socket.on('joinRoom', (data) => {
        const roomCode = data.code ? data.code.toUpperCase() : '';
        const playerName = data.name;
        const clientToken = data.token || `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const room = rooms[roomCode];
        
        if (!room) {
            socket.emit('gameError', 'Sala no encontrada.');
            return;
        }
        if (room.gameState !== 'LOBBY') {
            socket.emit('gameError', 'El juego ya ha comenzado en esta sala.');
            return;
        }
        
        currentRoom = roomCode;
        playerToken = clientToken;
        socket.join(roomCode);
        
        const assignedColor = colors[room.colorIndex % colors.length];
        room.colorIndex++;
        
        room.players[socket.id] = {
            id: socket.id,
            token: clientToken,
            name: playerName || `Fiel${Math.floor(Math.random() * 1000)}`,
            x: 1800 + (Math.random() * 160 - 80),
            y: 1100 + (Math.random() * 100 - 50),
            color: assignedColor,
            isImposter: false,
            isAlive: true,
            isInVent: false,
            facingRight: true,
            lastKillTime: 0
        };
        
        if (Object.keys(room.players).length === 1) {
            room.hostId = socket.id;
        }
        
        socket.emit('roomJoined', { roomCode, token: clientToken, players: room.players, hostId: room.hostId });
        io.to(roomCode).emit('lobbyUpdate', { players: room.players, hostId: room.hostId });
    });

    socket.on('startGame', () => {
        if (!currentRoom) return;
        const room = rooms[currentRoom];
        
        if (socket.id === room.hostId && room.gameState === 'LOBBY') {
            const playerKeys = Object.keys(room.players);
            if (playerKeys.length < 1) return;

            room.gameState = 'PLAYING';

            const imposterIndex = Math.floor(Math.random() * playerKeys.length);
            let faithfulCount = 0;
            playerKeys.forEach((key, index) => {
                room.players[key].isImposter = (index === imposterIndex);
                room.players[key].isInVent = false;
                room.players[key].lastKillTime = Date.now() + 5000;
                if (!room.players[key].isImposter) faithfulCount++;

                const angle = (index / Math.max(1, playerKeys.length)) * Math.PI * 2;
                room.players[key].x = 1800 + Math.cos(angle) * 260;
                room.players[key].y = 1100 + Math.sin(angle) * 160;
            });

            // Ajuste de barra: Mínimo 12 tareas para que no se llene rápido
            room.MAX_TASKS = Math.max(12, faithfulCount * 6);
            room.globalTaskProgress = 0;
            room.deadBodies = [];

            io.to(currentRoom).emit('gameStarted', {
                players: room.players,
                tasks: ROOM_TASKS,
                vents: VENTS,
                mapWidth: MAP_WIDTH,
                mapHeight: MAP_HEIGHT
            });
        }
    });

    // SISTEMA DE VENTILACIÓN PARA JUDAS (SIN MODAL, FLUIDO)
    socket.on('enterVent', (ventId) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        const p = room.players[socket.id];
        if (!p || !p.isAlive || !p.isImposter || p.isInVent) return;

        const vent = VENTS.find(v => v.id === ventId);
        if (!vent) return;
        if (Math.hypot(p.x - vent.x, p.y - vent.y) > 110) return;

        p.isInVent = true;
        p.currentVent = ventId;
        p.x = vent.x;
        p.y = vent.y;

        // Ocultar al jugador para los fieles
        socket.broadcast.to(currentRoom).emit('playerEnteredVent', { playerId: socket.id, ventId });
        socket.emit('ventEntered', { currentVent: vent, allVents: VENTS });
    });

    socket.on('moveVent', (targetVentId) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        const p = room.players[socket.id];
        if (!p || !p.isAlive || !p.isImposter || !p.isInVent) return;

        const targetVent = VENTS.find(v => v.id === targetVentId);
        if (!targetVent) return;

        p.currentVent = targetVentId;
        p.x = targetVent.x;
        p.y = targetVent.y;

        socket.emit('ventMoved', { currentVent: targetVent });

        for (let id in room.players) {
            if (id !== socket.id && room.players[id].isImposter) {
                io.to(id).emit('imposterVentMoved', { playerId: socket.id, ventId: targetVentId });
            }
        }
    });

    socket.on('exitVent', () => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        const p = room.players[socket.id];
        if (!p || !p.isAlive || !p.isImposter || !p.isInVent) return;

        const vent = VENTS.find(v => v.id === p.currentVent) || VENTS[0];
        p.isInVent = false;
        p.x = vent.x;
        p.y = vent.y + 20;

        io.to(currentRoom).emit('playerExitedVent', { playerId: socket.id, x: p.x, y: p.y });
        socket.emit('ventExited', { x: p.x, y: p.y });
    });

    socket.on('toggleDoors', () => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        if (room.doorsCooldown && Date.now() < room.doorsCooldown) return;
        room.doorsCooldown = Date.now() + 20000;
        io.to(currentRoom).emit('doorsClosed', { duration: 10000 });
    });

    socket.on('disconnect', () => {
        if (currentRoom && rooms[currentRoom]) {
            const room = rooms[currentRoom];
            const p = room.players[socket.id];
            
            if (p) {
                p.disconnected = true;
                const token = p.token;

                room.disconnectedPlayers[token] = setTimeout(() => {
                    if (room.players[socket.id] && room.players[socket.id].disconnected) {
                        delete room.players[socket.id];
                        delete room.disconnectedPlayers[token];

                        const remainingKeys = Object.keys(room.players);
                        if (remainingKeys.length === 0) {
                            delete rooms[currentRoom];
                        } else {
                            if (socket.id === room.hostId) {
                                room.hostId = remainingKeys[0];
                            }
                            if (room.gameState === 'LOBBY') {
                                io.to(currentRoom).emit('lobbyUpdate', { players: room.players, hostId: room.hostId });
                            } else {
                                io.to(currentRoom).emit('playerDisconnected', socket.id);
                                checkWinCondition(currentRoom);
                            }
                        }
                    }
                }, 60000);

                io.to(currentRoom).emit('playerConnectionLost', { playerId: socket.id, name: p.name });
            }
        }
    });

    socket.on('playerMovement', (movementData) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        const p = room.players[socket.id];
        
        if (p && p.isAlive) {
            p.x = movementData.x;
            p.y = movementData.y;
            p.facingRight = movementData.facingRight;
            p.isMoving = movementData.isMoving;
            
            if (!p.isInVent) {
                socket.broadcast.to(currentRoom).emit('playerMoved', p);
            }
        }
    });

    socket.on('kill', (targetId) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        
        const killer = room.players[socket.id];
        const victim = room.players[targetId];

        if (killer && killer.isImposter && killer.isAlive && !killer.isInVent) {
            const now = Date.now();
            if (now - (killer.lastKillTime || 0) < 25000) {
                const remaining = Math.ceil((25000 - (now - killer.lastKillTime)) / 1000);
                socket.emit('gameError', `Espera ${remaining}s para volver a eliminar.`);
                return;
            }

            if (victim && victim.isAlive && !victim.isImposter && !victim.isInVent) {
                const dist = Math.hypot(killer.x - victim.x, killer.y - victim.y);
                if (dist < 130 && checkLineOfSight(killer.x, killer.y, victim.x, victim.y)) {
                    victim.isAlive = false;
                    killer.lastKillTime = now;

                    const body = {
                        id: `body_${Date.now()}_${targetId}`,
                        x: victim.x,
                        y: victim.y,
                        color: victim.color
                    };
                    room.deadBodies.push(body);

                    io.to(currentRoom).emit('playerKilled', { 
                        killerId: socket.id, 
                        targetId: targetId, 
                        body: body 
                    });
                    checkWinCondition(currentRoom);
                }
            }
        }
    });

    socket.on('reportBody', () => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        
        const player = room.players[socket.id];
        if (player && player.isAlive && !room.isMeeting && !player.isInVent) {
            let nearBody = false;
            for (let body of room.deadBodies) {
                if (Math.hypot(player.x - body.x, player.y - body.y) < 160) {
                    nearBody = true;
                    break;
                }
            }
            if (nearBody) {
                startMeeting(currentRoom, socket.id);
            }
        }
    });
    
    socket.on('callEmergency', () => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        
        const player = room.players[socket.id];
        if (player && player.isAlive && !room.isMeeting && !player.isInVent) {
            const dist = Math.hypot(player.x - 1800, player.y - 1100);
            if (dist < 200) {
                startMeeting(currentRoom, socket.id);
            }
        }
    });
    
    socket.on('joinVoice', () => {
        if (currentRoom) socket.broadcast.to(currentRoom).emit('userJoinedVoice', socket.id);
    });
    
    socket.on('voiceSignal', (data) => {
        if (currentRoom) io.to(data.to).emit('voiceSignal', { from: socket.id, ...data });
    });

    socket.on('castVote', (targetId) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        
        if (room.isMeeting && room.players[socket.id] && room.players[socket.id].isAlive && !room.votes[socket.id]) {
            room.votes[socket.id] = targetId;
            io.to(currentRoom).emit('voteUpdate', room.votes);
            
            let allVoted = true;
            for (let id in room.players) {
                if (room.players[id].isAlive && !room.votes[id]) {
                    allVoted = false;
                    break;
                }
            }
            if (allVoted) endMeeting(currentRoom);
        }
    });

    socket.on('taskCompleted', () => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const room = rooms[currentRoom];
        
        const player = room.players[socket.id];
        if (player && player.isAlive && !player.isImposter) {
            room.globalTaskProgress++;
            const pct = Math.min(100, (room.globalTaskProgress / room.MAX_TASKS) * 100);
            io.to(currentRoom).emit('updateTaskProgress', pct);
            checkWinCondition(currentRoom);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ark server listening on *:${PORT}`);
});
