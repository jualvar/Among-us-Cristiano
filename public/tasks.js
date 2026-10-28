// Bible Us - Sistema Avanzado de Mini-Juegos y Preguntas Bíblicas Desafiantes
// Incluye: Ordenar Utensilios del Tabernáculo (Éxodo 40), Medidas Sagradas en Codos (Génesis 6:15),
// Restauración de Manuscritos, Calafateo con Brea, Cordones Sagrados y Banco Exhaustivo de 30+ Preguntas Bíblicas Difíciles.

class MiniGameManager {
    constructor() {
        this.container = document.getElementById('taskAnswers');
        this.questionTitle = document.getElementById('taskQuestion');
        this.modal = document.getElementById('taskModal');
        this.onCompleteCallback = null;
    }

    startTask(task, onComplete) {
        this.onCompleteCallback = onComplete;
        this.modal.style.display = 'flex';
        this.container.innerHTML = '';

        const type = task.taskType || 'quiz';

        switch (type) {
            case 'tabernacle':
                this.renderTabernacleOrder(task);
                break;
            case 'cubits':
                this.renderCubitMath(task);
                break;
            case 'manuscript':
                this.renderManuscriptRestoration(task);
                break;
            case 'steer':
            case 'pitch':
                this.renderPitchSealing(task);
                break;
            case 'diff':
                this.renderDifferencesGame(task);
                break;
            case 'water':
                this.renderBailingWater(task);
                break;
            case 'wires':
                this.renderCordWires(task);
                break;
            case 'verse':
                this.renderVersePuzzle(task);
                break;
            case 'memory':
                this.renderMemoryGame(task);
                break;
            case 'scan':
                this.renderScanMedical(task);
                break;
            case 'quiz':
            default:
                this.renderHardBiblicalQuiz(task);
                break;
        }
    }

    // 1. ORDENAR LOS UTENSILIOS SAGRADOS DEL TABERNÁCULO (ÉXODO 40)
    renderTabernacleOrder(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">🕍 EL TABERNÁCULO: ORDENAR LOS UTENSILIOS (ÉXODO 40)</div>
            <div style="font-size: 0.78em; color: #334155; margin-top: 4px;">Asigna cada utensilio sagrado al lugar exacto ordenado por Dios:</div>
        `;

        const utensils = [
            { id: 'arca', name: 'Arca del Pacto', zone: 'santísimo', hint: 'Detrás del velo' },
            { id: 'menora', name: 'Candelabro de 7 Brazos', zone: 'santo', hint: 'Al sur en el Lugar Santo' },
            { id: 'panes', name: 'Mesa de los Panes', zone: 'santo', hint: 'Al norte en el Lugar Santo' },
            { id: 'incienso', name: 'Altar del Incienso', zone: 'santo', hint: 'Frente al velo sagrado' },
            { id: 'lavacro', name: 'Lavacro de Bronce', zone: 'atrio', hint: 'En el atrio exterior' }
        ];

        let currentIndex = 0;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '12px';
        wrapper.style.marginTop = '10px';

        const currentCard = document.createElement('div');
        currentCard.style.background = '#1e293b';
        currentCard.style.padding = '12px';
        currentCard.style.borderRadius = '10px';
        currentCard.style.textAlign = 'center';
        currentCard.style.border = '2px solid #f59e0b';

        const updateCard = () => {
            const u = utensils[currentIndex];
            currentCard.innerHTML = `
                <div style="color: #94a3b8; font-size: 0.85em;">Utensilio a ubicar (${currentIndex + 1} de ${utensils.length}):</div>
                <div style="color: #fef08a; font-size: 1.25em; font-weight: bold; margin: 4px 0;">✨ ${u.name}</div>
                <div style="color: #38bdf8; font-size: 0.85em;">Pista bíblica: <i>${u.hint}</i></div>
            `;
        };
        updateCard();
        wrapper.appendChild(currentCard);

        const zonesTitle = document.createElement('div');
        zonesTitle.style.fontSize = '0.9em';
        zonesTitle.style.fontWeight = 'bold';
        zonesTitle.style.color = '#475569';
        zonesTitle.innerText = '¿En qué estancia del Tabernáculo debe colocarse?';
        wrapper.appendChild(zonesTitle);

        const zonesContainer = document.createElement('div');
        zonesContainer.style.display = 'grid';
        zonesContainer.style.gridTemplateColumns = '1fr';
        zonesContainer.style.gap = '8px';

        const zoneOptions = [
            { key: 'santísimo', name: '🕊️ Lugar Santísimo (Kodesh Ha-Kodashim)' },
            { key: 'santo', name: '🕯️ Lugar Santo (Kodesh)' },
            { key: 'atrio', name: '🏺 Atrio Exterior (Jatzer)' }
        ];

        zoneOptions.forEach(z => {
            const btn = document.createElement('button');
            btn.className = 'task-btn';
            btn.style.padding = '12px 14px';
            btn.style.textAlign = 'left';
            btn.style.fontSize = '0.95em';
            btn.innerText = z.name;

            btn.onclick = () => {
                const u = utensils[currentIndex];
                if (z.key === u.zone) {
                    btn.style.background = '#15803d';
                    window.gameAudio.playClick();
                    currentIndex++;
                    setTimeout(() => {
                        btn.style.background = '#78350f';
                        if (currentIndex >= utensils.length) {
                            currentCard.innerHTML = `<div style="color:#4ade80; font-size:1.2em; font-weight:bold;">¡TABERNÁCULO COMPLETAMENTE SANTIFICADO Y CONSAGRADO! 🎉</div>`;
                            window.gameAudio.playTaskComplete();
                            setTimeout(() => this.finishSuccess(), 500);
                        } else {
                            updateCard();
                        }
                    }, 350);
                } else {
                    btn.style.background = '#dc2626';
                    setTimeout(() => { btn.style.background = '#78350f'; }, 400);
                }
            };
            zonesContainer.appendChild(btn);
        });

        wrapper.appendChild(zonesContainer);
        this.container.appendChild(wrapper);
    }

    // 2. CÁLCULO SAGRADO DE LOS CODOS DEL ARCA (GÉNESIS 6:15)
    renderCubitMath(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">📐 ARQUITECTURA SAGRADA: 300 CODOS (GÉNESIS 6:15)</div>
            <div style="font-size: 0.78em; color: #334155; margin-top: 4px;">Demuestra tu conocimiento de las medidas exactas reveladas por Dios:</div>
        `;

        const challenges = [
            {
                q: "Génesis 6:15: 'De 300 codos la longitud, 50 codos su anchura y 30 codos su altura'. Si 1 codo bíblico equivale a 0.5 metros, ¿cuántos metros de largo medía el Arca?",
                opts: ["150 metros", "300 metros", "75 metros", "200 metros"],
                correct: 0
            },
            {
                q: "Génesis 6:16: 'Una ventana harás al arca, y la acabarás a...'. ¿A qué distancia del techo debía rematarse?",
                opts: ["A 1 codo de elevación", "A 5 codos de elevación", "A 10 codos de elevación", "A medio codo de elevación"],
                correct: 0
            },
            {
                q: "¿Cuántos pisos o niveles ordenó Dios construir en el interior del Arca?",
                opts: ["3 niveles (bajo, segundo y tercero)", "2 niveles con altillo", "4 niveles separados", "1 solo nivel espacioso"],
                correct: 0
            }
        ];

        const chal = challenges[Math.floor(Math.random() * challenges.length)];

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '12px';
        wrapper.style.marginTop = '10px';

        const qBox = document.createElement('div');
        qBox.style.background = '#0f172a';
        qBox.style.padding = '14px';
        qBox.style.borderRadius = '10px';
        qBox.style.border = '2px solid #38bdf8';
        qBox.style.color = '#f1f5f9';
        qBox.style.fontSize = '0.92em';
        qBox.style.lineHeight = '1.4';
        qBox.innerText = chal.q;
        wrapper.appendChild(qBox);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr';
        grid.style.gap = '8px';

        chal.opts.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'task-btn';
            btn.style.textAlign = 'left';
            btn.style.padding = '12px 14px';
            btn.style.fontSize = '0.95em';
            btn.innerText = opt;

            btn.onclick = () => {
                if (idx === chal.correct) {
                    btn.style.background = '#15803d';
                    window.gameAudio.playTaskComplete();
                    setTimeout(() => this.finishSuccess(), 450);
                } else {
                    btn.style.background = '#dc2626';
                    setTimeout(() => { btn.style.background = '#78350f'; }, 400);
                }
            };
            grid.appendChild(btn);
        });

        wrapper.appendChild(grid);
        this.container.appendChild(wrapper);
    }

    // 3. RESTAURAR EL MANUSCRITO SAGRADO DEL GÉNESIS
    renderManuscriptRestoration(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">📜 BIBLIOTECA SAGRADA: MANUSCRITO DEL GÉNESIS</div>
            <div style="font-size: 0.78em; color: #334155; margin-top: 4px;">Restaura los 5 fragmentos de Génesis 1:1-2 en el orden canónico exacto:</div>
        `;

        const fragments = [
            "En el principio",
            "creó Dios",
            "los cielos",
            "y la tierra,",
            "y el Espíritu de Dios se movía sobre las aguas."
        ];

        const shuffled = [...fragments].sort(() => Math.random() - 0.5);
        const userChoice = [];

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '10px';
        wrapper.style.marginTop = '10px';

        const parchment = document.createElement('div');
        parchment.style.minHeight = '70px';
        parchment.style.background = '#fef3c7';
        parchment.style.border = '2px dashed #b45309';
        parchment.style.borderRadius = '10px';
        parchment.style.padding = '10px';
        parchment.style.color = '#78350f';
        parchment.style.fontSize = '0.95em';
        parchment.style.fontStyle = 'italic';
        parchment.style.display = 'flex';
        parchment.style.flexWrap = 'wrap';
        parchment.style.gap = '6px';
        wrapper.appendChild(parchment);

        const pool = document.createElement('div');
        pool.style.display = 'flex';
        pool.style.flexDirection = 'column';
        pool.style.gap = '6px';

        shuffled.forEach((text) => {
            const b = document.createElement('button');
            b.className = 'task-btn';
            b.style.padding = '10px 14px';
            b.style.fontSize = '0.9em';
            b.style.textAlign = 'left';
            b.innerText = text;

            b.onclick = () => {
                if (b.dataset.used) return;
                b.dataset.used = "true";
                b.style.opacity = "0.3";
                window.gameAudio.playClick();
                userChoice.push(text);

                const chip = document.createElement('span');
                chip.style.background = '#b45309';
                chip.style.color = '#fff';
                chip.style.padding = '4px 8px';
                chip.style.borderRadius = '6px';
                chip.style.fontWeight = 'bold';
                chip.innerText = text;
                parchment.appendChild(chip);

                if (userChoice.length === fragments.length) {
                    const ok = userChoice.every((val, i) => val === fragments[i]);
                    if (ok) {
                        parchment.style.borderColor = '#16a34a';
                        parchment.style.background = '#dcfce7';
                        window.gameAudio.playTaskComplete();
                        setTimeout(() => this.finishSuccess(), 450);
                    } else {
                        parchment.style.borderColor = '#dc2626';
                        setTimeout(() => {
                            parchment.innerHTML = '';
                            pool.querySelectorAll('button').forEach(btn => {
                                btn.style.opacity = "1";
                                delete btn.dataset.used;
                            });
                            userChoice.length = 0;
                            parchment.style.borderColor = '#b45309';
                        }, 750);
                    }
                }
            };
            pool.appendChild(b);
        });

        wrapper.appendChild(pool);
        this.container.appendChild(wrapper);
    }

    // 4. CALAFATEAR CON BREA EL CASCO (GÉNESIS 6:14)
    renderPitchSealing(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">🏺 MÁQUINAS: CALAFATEAR CON BREA (GÉNESIS 6:14)</div>
            <div style="font-size: 0.78em; color: #334155; margin-top: 4px;">Aplica brea hirviendo sobre cada una de las 4 grietas de agua para sellar el Arca:</div>
        `;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '12px';
        wrapper.style.marginTop = '10px';

        const statusText = document.createElement('div');
        statusText.style.fontSize = '1em';
        statusText.style.fontWeight = 'bold';
        statusText.style.color = '#b45309';
        statusText.innerText = 'Grietas activas: 4 / 4';
        wrapper.appendChild(statusText);

        const hullWall = document.createElement('div');
        hullWall.style.position = 'relative';
        hullWall.style.width = '340px';
        hullWall.style.height = '180px';
        hullWall.style.background = 'repeating-linear-gradient(0deg, #78350f, #78350f 38px, #451a03 38px, #451a03 42px)';
        hullWall.style.border = '4px solid #3e1703';
        hullWall.style.borderRadius = '14px';
        hullWall.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.7)';
        hullWall.style.overflow = 'hidden';

        const leaks = [
            { id: 1, top: '20px', left: '35px' },
            { id: 2, top: '40px', left: '220px' },
            { id: 3, top: '105px', left: '80px' },
            { id: 4, top: '120px', left: '240px' }
        ];

        let sealedCount = 0;

        leaks.forEach(leak => {
            const leakBtn = document.createElement('button');
            leakBtn.className = 'leak-target';
            leakBtn.style.position = 'absolute';
            leakBtn.style.top = leak.top;
            leakBtn.style.left = leak.left;
            leakBtn.style.width = '64px';
            leakBtn.style.height = '42px';
            leakBtn.style.background = 'radial-gradient(circle, #38bdf8 20%, transparent 70%)';
            leakBtn.style.border = '2px dashed #38bdf8';
            leakBtn.style.borderRadius = '8px';
            leakBtn.style.cursor = 'pointer';
            leakBtn.style.display = 'flex';
            leakBtn.style.alignItems = 'center';
            leakBtn.style.justifyContent = 'center';
            leakBtn.innerHTML = '<span style="font-size: 1.3em;">💧</span>';

            leakBtn.onclick = () => {
                if (leakBtn.dataset.sealed) return;
                leakBtn.dataset.sealed = 'true';
                sealedCount++;

                leakBtn.style.background = 'linear-gradient(135deg, #1c1917, #292524)';
                leakBtn.style.border = '2px solid #ca8a04';
                leakBtn.style.boxShadow = '0 0 15px #f59e0b';
                leakBtn.innerHTML = '<span style="font-size: 0.85em; color: #fde047; font-weight: bold;">✔ SELLADO</span>';

                if (window.gameAudio && typeof window.gameAudio.playSizzle === 'function') {
                    window.gameAudio.playSizzle();
                } else if (window.gameAudio) {
                    window.gameAudio.playClick();
                }

                statusText.innerText = `Grietas activas: ${4 - sealedCount} / 4`;

                if (sealedCount === 4) {
                    statusText.innerText = '¡CASCO TOTALMENTE CALAFATEADO Y PROTEGIDO! 🏺✨';
                    statusText.style.color = '#15803d';
                    window.gameAudio.playTaskComplete();
                    setTimeout(() => this.finishSuccess(), 500);
                }
            };
            hullWall.appendChild(leakBtn);
        });

        wrapper.appendChild(hullWall);
        this.container.appendChild(wrapper);
    }

    // 5. BOMBA DE ACHIQUE MANUAL DE AGUA
    renderBailingWater(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #0284c7; font-weight: bold;">🚰 BOMBA DE ACHIQUE DEL ARCA</div>
            <div style="font-size: 0.75em; color: #1e293b; margin-top: 4px;">Pulsa rítmicamente la palanca para vaciar el agua de sentina:</div>
        `;

        let waterLevel = 100;
        const pumpWrapper = document.createElement('div');
        pumpWrapper.style.display = 'flex';
        pumpWrapper.style.flexDirection = 'column';
        pumpWrapper.style.alignItems = 'center';
        pumpWrapper.style.gap = '14px';
        pumpWrapper.style.marginTop = '10px';

        const meter = document.createElement('div');
        meter.style.fontSize = '1.1em';
        meter.style.fontWeight = 'bold';
        meter.style.color = '#0369a1';
        meter.innerText = `Nivel de inundación: ${waterLevel}%`;
        pumpWrapper.appendChild(meter);

        const barFrame = document.createElement('div');
        barFrame.style.width = '240px';
        barFrame.style.height = '24px';
        barFrame.style.background = '#e2e8f0';
        barFrame.style.borderRadius = '12px';
        barFrame.style.overflow = 'hidden';
        barFrame.style.border = '2px solid #0369a1';

        const barFill = document.createElement('div');
        barFill.style.width = '100%';
        barFill.style.height = '100%';
        barFill.style.background = 'linear-gradient(90deg, #38bdf8, #0284c7)';
        barFill.style.transition = 'width 0.15s ease';
        barFrame.appendChild(barFill);
        pumpWrapper.appendChild(barFrame);

        const leverBtn = document.createElement('button');
        leverBtn.className = 'btn-primary';
        leverBtn.style.padding = '16px 28px';
        leverBtn.style.fontSize = '1.2em';
        leverBtn.style.fontWeight = 'bold';
        leverBtn.style.borderRadius = '14px';
        leverBtn.innerText = '⚙️ BOMBEAR SENTINA';

        leverBtn.onclick = () => {
            waterLevel = Math.max(0, waterLevel - 15);
            barFill.style.width = `${waterLevel}%`;
            meter.innerText = `Nivel de inundación: ${waterLevel}%`;
            window.gameAudio.playClick();

            if (waterLevel <= 0) {
                meter.innerText = '¡AGUA DE SENTINA EXPULSADA AL MAR! ✨';
                meter.style.color = '#15803d';
                window.gameAudio.playTaskComplete();
                setTimeout(() => this.finishSuccess(), 450);
            }
        };

        pumpWrapper.appendChild(leverBtn);
        this.container.appendChild(pumpWrapper);
    }

    // 6. CONECTAR CORDONES DEL TABERNÁCULO (WIRES)
    renderCordWires(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">⚡ CORDONES SAGRADOS DEL TABERNÁCULO (ÉXODO 26)</div>
            <div style="font-size: 0.75em; color: #1e293b; margin-top: 4px;">Conecta cada cordón sagrado con su color correspondiente:</div>
        `;

        const cords = [
            { name: 'Carmesí', color: '#dc2626' },
            { name: 'Azul Celeste', color: '#0284c7' },
            { name: 'Púrpura Real', color: '#7e22ce' },
            { name: 'Oro Bíblico', color: '#eab308' }
        ];

        const shuffledRight = [...cords].sort(() => Math.random() - 0.5);
        const board = document.createElement('div');
        board.style.display = 'flex';
        board.style.justifyContent = 'space-between';
        board.style.padding = '18px 24px';
        board.style.background = '#0f172a';
        board.style.borderRadius = '14px';
        board.style.border = '2px solid #334155';
        board.style.marginTop = '12px';

        const leftCol = document.createElement('div');
        leftCol.style.display = 'flex';
        leftCol.style.flexDirection = 'column';
        leftCol.style.gap = '12px';

        const rightCol = document.createElement('div');
        rightCol.style.display = 'flex';
        rightCol.style.flexDirection = 'column';
        rightCol.style.gap = '12px';

        let selected = null;
        let matched = 0;

        cords.forEach((c) => {
            const btn = document.createElement('button');
            btn.className = 'task-btn';
            btn.style.background = c.color;
            btn.style.width = '140px';
            btn.style.fontSize = '0.9em';
            btn.style.padding = '10px 12px';
            btn.innerText = `● ${c.name}`;

            btn.onclick = () => {
                if (btn.classList.contains('done-cord')) return;
                selected = { btn, color: c.color };
                window.gameAudio.playClick();
                leftCol.querySelectorAll('button').forEach(b => b.style.boxShadow = 'none');
                btn.style.boxShadow = '0 0 16px white';
            };
            leftCol.appendChild(btn);
        });

        shuffledRight.forEach((c) => {
            const btn = document.createElement('button');
            btn.className = 'task-btn';
            btn.style.background = c.color;
            btn.style.width = '140px';
            btn.style.fontSize = '0.9em';
            btn.style.padding = '10px 12px';
            btn.innerText = `${c.name} ●`;

            btn.onclick = () => {
                if (btn.classList.contains('done-cord') || !selected) return;

                if (selected.color === c.color) {
                    selected.btn.classList.add('done-cord');
                    btn.classList.add('done-cord');
                    selected.btn.style.boxShadow = 'none';
                    selected.btn.style.opacity = '0.6';
                    btn.style.opacity = '0.6';
                    selected = null;
                    matched++;
                    window.gameAudio.playClick();

                    if (matched === cords.length) {
                        window.gameAudio.playTaskComplete();
                        setTimeout(() => this.finishSuccess(), 400);
                    }
                } else {
                    selected.btn.style.boxShadow = 'none';
                    selected = null;
                }
            };
            rightCol.appendChild(btn);
        });

        board.appendChild(leftCol);
        board.appendChild(rightCol);
        this.container.appendChild(board);
    }

    // 7. ENCONTRAR 3 DIFERENCIAS
    renderDifferencesGame(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">🔍 ENCUENTRA LAS 3 DIFERENCIAS BÍBLICAS</div>
            <div style="font-size: 0.75em; color: #1e293b; margin-top: 4px;">Compara ambos mosaicos y pulsa sobre las 3 diferencias en el panel derecho:</div>
        `;

        let found = new Set();
        const diffsCount = 3;

        const info = document.createElement('div');
        info.style.fontSize = '1em';
        info.style.color = '#15803d';
        info.style.fontWeight = 'bold';
        info.style.margin = '6px 0';
        info.innerText = `Diferencias descubiertas: 0 / ${diffsCount}`;
        this.container.appendChild(info);

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '14px';
        row.style.justifyContent = 'center';
        row.style.alignItems = 'center';
        row.style.flexWrap = 'wrap';

        const panel1 = document.createElement('div');
        panel1.style.position = 'relative';
        panel1.style.width = '240px';
        panel1.style.height = '190px';
        panel1.style.background = 'radial-gradient(circle, #38bdf8, #0284c7)';
        panel1.style.border = '3px solid #78350f';
        panel1.style.borderRadius = '12px';
        panel1.style.overflow = 'hidden';
        panel1.innerHTML = `
            <div style="position: absolute; top: 12px; left: 16px; font-size: 26px;">🌈</div>
            <div style="position: absolute; top: 22px; right: 24px; font-size: 26px;">🕊️🌿</div>
            <div style="position: absolute; bottom: 35px; left: 24px; font-size: 40px;">🚢</div>
            <div style="position: absolute; bottom: 15px; right: 20px; font-size: 32px;">🦁👑</div>
            <div style="position: absolute; top: 8px; width: 100%; text-align: center; font-size: 11px; font-weight: bold; color: white;">ORIGINAL</div>
        `;

        const panel2 = document.createElement('div');
        panel2.style.position = 'relative';
        panel2.style.width = '240px';
        panel2.style.height = '190px';
        panel2.style.background = 'radial-gradient(circle, #38bdf8, #0284c7)';
        panel2.style.border = '3px solid #78350f';
        panel2.style.borderRadius = '12px';
        panel2.style.overflow = 'hidden';
        panel2.innerHTML = `
            <button id="diff1" style="position: absolute; top: 8px; left: 12px; width: 44px; height: 44px; background: none; border: 2px dashed rgba(255,255,255,0.4); border-radius: 50%; font-size: 22px; cursor: pointer;">☁️</button>
            <button id="diff2" style="position: absolute; top: 18px; right: 20px; width: 44px; height: 44px; background: none; border: 2px dashed rgba(255,255,255,0.4); border-radius: 50%; font-size: 22px; cursor: pointer;">🕊️</button>
            <div style="position: absolute; bottom: 35px; left: 24px; font-size: 40px;">🚢</div>
            <button id="diff3" style="position: absolute; bottom: 10px; right: 16px; width: 48px; height: 48px; background: none; border: 2px dashed rgba(255,255,255,0.4); border-radius: 50%; font-size: 30px; cursor: pointer;">🦁</button>
            <div style="position: absolute; top: 8px; width: 100%; text-align: center; font-size: 11px; font-weight: bold; color: white;">ENCUENTRA AQUÍ</div>
        `;

        const registerDiff = (id, el) => {
            if (found.has(id)) return;
            found.add(id);
            el.style.border = '3px solid #16a34a';
            el.style.background = 'rgba(34, 197, 94, 0.45)';
            el.style.boxShadow = '0 0 16px #4ade80';
            window.gameAudio.playClick();
            info.innerText = `Diferencias descubiertas: ${found.size} / ${diffsCount}`;

            if (found.size >= diffsCount) {
                info.innerText = `¡LAS 3 DIFERENCIAS ENCONTRADAS! 🎉`;
                window.gameAudio.playTaskComplete();
                setTimeout(() => this.finishSuccess(), 500);
            }
        };

        panel2.querySelector('#diff1').onclick = function() { registerDiff('diff1', this); };
        panel2.querySelector('#diff2').onclick = function() { registerDiff('diff2', this); };
        panel2.querySelector('#diff3').onclick = function() { registerDiff('diff3', this); };

        row.appendChild(panel1);
        row.appendChild(panel2);
        this.container.appendChild(row);
    }

    // 8. ESCANEO MÉDICO DE CUARENTENA
    renderScanMedical(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #0284c7; font-weight: bold;">🩺 INSPECCIÓN DE SALUD Y CUARENTENA (LEVÍTICO 13)</div>
            <div style="font-size: 0.75em; color: #1e293b; margin-top: 4px;">Mantén presionado el sello sagrado 3 segundos:</div>
        `;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '15px';
        wrapper.style.marginTop = '15px';

        const btn = document.createElement('button');
        btn.className = 'task-btn';
        btn.style.width = '110px';
        btn.style.height = '110px';
        btn.style.borderRadius = '50%';
        btn.style.fontSize = '2.5em';
        btn.style.background = 'radial-gradient(circle, #0284c7, #0369a1)';
        btn.innerText = '🖐️';

        const bar = document.createElement('div');
        bar.style.width = '240px';
        bar.style.height = '16px';
        bar.style.background = '#334155';
        bar.style.borderRadius = '8px';
        bar.style.overflow = 'hidden';

        const fill = document.createElement('div');
        fill.style.width = '0%';
        fill.style.height = '100%';
        fill.style.background = '#38bdf8';
        bar.appendChild(fill);

        let timer = null;
        let pct = 0;

        const press = (e) => {
            e.preventDefault();
            if (timer) return;
            window.gameAudio.playClick();
            timer = setInterval(() => {
                pct += 5;
                fill.style.width = `${pct}%`;
                if (pct >= 100) {
                    clearInterval(timer);
                    timer = null;
                    window.gameAudio.playTaskComplete();
                    setTimeout(() => this.finishSuccess(), 300);
                }
            }, 100);
        };

        const release = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
                pct = 0;
                fill.style.width = '0%';
            }
        };

        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('touchstart', press);
        btn.addEventListener('touchend', release);

        wrapper.appendChild(btn);
        wrapper.appendChild(bar);
        this.container.appendChild(wrapper);
    }

    // 9. VERSÍCULO DE ISAÍAS 40:31
    renderVersePuzzle(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">📜 SALMOS Y PROMESAS: ISAÍAS 40:31</div>
            <div style="font-size: 0.75em; color: #1e293b; margin-top: 4px;">Ordena las palabras en el orden exacto de la promesa divina:</div>
        `;

        const correctWords = ['Los', 'que', 'esperan', 'a', 'Jehová', 'tendrán', 'nuevas', 'fuerzas'];
        const shuffled = [...correctWords].sort(() => Math.random() - 0.5);

        const targetArea = document.createElement('div');
        targetArea.style.minHeight = '48px';
        targetArea.style.background = '#f8fafc';
        targetArea.style.border = '2px dashed #94a3b8';
        targetArea.style.borderRadius = '10px';
        targetArea.style.padding = '8px';
        targetArea.style.display = 'flex';
        targetArea.style.flexWrap = 'wrap';
        targetArea.style.gap = '8px';
        targetArea.style.justifyContent = 'center';
        this.container.appendChild(targetArea);

        const sourceArea = document.createElement('div');
        sourceArea.style.display = 'flex';
        sourceArea.style.flexWrap = 'wrap';
        sourceArea.style.gap = '8px';
        sourceArea.style.justifyContent = 'center';
        sourceArea.style.marginTop = '14px';

        const chosenWords = [];

        shuffled.forEach((word) => {
            const chip = document.createElement('button');
            chip.className = 'task-btn';
            chip.style.padding = '8px 14px';
            chip.style.fontSize = '0.9em';
            chip.innerText = word;

            chip.onclick = () => {
                if (chip.dataset.chosen) return;
                chip.dataset.chosen = "true";
                chip.style.opacity = "0.3";
                window.gameAudio.playClick();
                chosenWords.push(word);

                const placedChip = document.createElement('span');
                placedChip.style.background = '#0284c7';
                placedChip.style.color = 'white';
                placedChip.style.padding = '6px 12px';
                placedChip.style.borderRadius = '6px';
                placedChip.style.fontWeight = 'bold';
                placedChip.innerText = word;
                targetArea.appendChild(placedChip);

                if (chosenWords.length === correctWords.length) {
                    const match = chosenWords.every((w, i) => w === correctWords[i]);
                    if (match) {
                        targetArea.style.borderColor = '#16a34a';
                        targetArea.style.background = '#dcfce7';
                        window.gameAudio.playTaskComplete();
                        setTimeout(() => this.finishSuccess(), 450);
                    } else {
                        targetArea.style.borderColor = '#dc2626';
                        setTimeout(() => {
                            targetArea.innerHTML = '';
                            sourceArea.querySelectorAll('button').forEach(b => {
                                b.style.opacity = "1";
                                delete b.dataset.chosen;
                            });
                            chosenWords.length = 0;
                            targetArea.style.borderColor = '#94a3b8';
                        }, 700);
                    }
                }
            };
            sourceArea.appendChild(chip);
        });

        this.container.appendChild(sourceArea);
    }

    // 10. MEMORIA DE PACTOS
    renderMemoryGame(task) {
        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">🧠 MEMORIA: PACTO DEL ARCA</div>
            <div style="font-size: 0.75em; color: #1e293b; margin-top: 4px;">Encuentra las 3 parejas de símbolos sagrados:</div>
        `;

        const symbols = ['🦁', '🕊️', '🌈'];
        const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 80px)';
        grid.style.gap = '10px';
        grid.style.justifyContent = 'center';
        grid.style.marginTop = '14px';

        let first = null;
        let matched = 0;
        let lock = false;

        deck.forEach((sym) => {
            const c = document.createElement('button');
            c.className = 'task-btn';
            c.style.width = '80px';
            c.style.height = '80px';
            c.style.fontSize = '2em';
            c.innerText = '❓';

            c.onclick = () => {
                if (lock || c.dataset.done || c === first) return;
                c.innerText = sym;
                window.gameAudio.playClick();

                if (!first) {
                    first = c;
                } else {
                    lock = true;
                    if (first.dataset.sym === sym) {
                        first.dataset.done = "true";
                        c.dataset.done = "true";
                        first.style.background = '#15803d';
                        c.style.background = '#15803d';
                        first = null;
                        lock = false;
                        matched++;
                        if (matched === symbols.length) {
                            window.gameAudio.playTaskComplete();
                            setTimeout(() => this.finishSuccess(), 400);
                        }
                    } else {
                        setTimeout(() => {
                            if (first) { first.innerText = '❓'; }
                            c.innerText = '❓';
                            first = null;
                            lock = false;
                        }, 550);
                    }
                }
            };
            c.dataset.sym = sym;
            grid.appendChild(c);
        });

        this.container.appendChild(grid);
    }

    // 11. BANCO EXHAUSTIVO DE 30+ PREGUNTAS BÍBLICAS DESAFIANTES Y VARIADAS
    renderHardBiblicalQuiz(task) {
        const hardQuestions = [
            {
                q: "¿Cuáles fueron las dimensiones exactas del Arca ordenadas por Dios a Noé (Génesis 6:15)?",
                a: ["300 codos de largo, 50 de ancho y 30 de alto", "250 codos de largo, 40 de ancho y 20 de alto", "500 codos de largo, 100 de ancho y 50 de alto", "150 codos de largo, 30 de ancho y 15 de alto"],
                correct: 0
            },
            {
                q: "¿En qué mes y en qué día exacto reposó el Arca sobre los montes de Ararat (Génesis 8:4)?",
                a: ["En el mes séptimo, a los diecisiete días del mes", "En el mes primero, a los diez días del mes", "En el mes décimo, al primer día del mes", "En el mes sexto, a los catorce días del mes"],
                correct: 0
            },
            {
                q: "¿Qué ave envió Noé en primer lugar desde la ventana del Arca (Génesis 8:7)?",
                a: ["Un cuervo que salía y volvía", "Una paloma blanca", "Una golondrina veloz", "Un halcón peregrino"],
                correct: 0
            },
            {
                q: "¿Cuántas parejas de todo animal limpio mandó Dios introducir en el Arca (Génesis 7:2)?",
                a: ["Siete parejas de animales limpios", "Solo una pareja de cada especie", "Diez parejas de animales limpios", "Tres parejas de cada especie"],
                correct: 0
            },
            {
                q: "¿Qué madera específica y única ordenó Dios utilizar para construir el Arca (Génesis 6:14)?",
                a: ["Madera de Gofer", "Madera de Acacia", "Cedro del Líbano", "Roble de Basán"],
                correct: 0
            },
            {
                q: "¿Qué profeta del Antiguo Testamento menciona a Noé junto con Daniel y Job como tres varones justos (Ezequiel 14:14)?",
                a: ["El profeta Ezequiel", "El profeta Isaías", "El profeta Jeremías", "El profeta Miqueas"],
                correct: 0
            },
            {
                q: "¿A qué edad engendró Noé a sus tres hijos Sem, Cam y Jafet (Génesis 5:32)?",
                a: ["A los 500 años de edad", "A los 300 años de edad", "A los 400 años de edad", "A los 600 años de edad"],
                correct: 0
            },
            {
                q: "¿Cuál de los hijos de Noé fue el antepasado directo de Abraham y del linaje mesiánico (Génesis 11:10-26)?",
                a: ["Sem", "Cam", "Jafet", "Canaán"],
                correct: 0
            },
            {
                q: "¿Cuántos días prevalecieron con fuerza las aguas sobre la faz de la tierra tras el diluvio (Génesis 7:24)?",
                a: ["150 días continuos", "40 días continuos", "70 días continuos", "120 días continuos"],
                correct: 0
            },
            {
                q: "Según 1 Pedro 3:20, ¿cuántas personas en total fueron salvadas a través del agua en los días de Noé?",
                a: ["Ocho personas", "Cuatro personas", "Doce personas", "Setenta personas"],
                correct: 0
            },
            {
                q: "¿Cuál fue la primera señal que trajo la paloma al regresar en su segundo vuelo (Génesis 8:11)?",
                a: ["Una hoja tierna de olivo en el pico", "Una rama seca de higuera", "Una espiga dorada de trigo", "Una flor silvestre"],
                correct: 0
            },
            {
                q: "¿Qué rey de Judá fue herido con lepra por entrar al Templo a quemar incienso sobre el altar (2 Crónicas 26:16-19)?",
                a: ["El rey Uzías (Azarías)", "El rey Acaz", "El rey Manasés", "El rey Ezequías"],
                correct: 0
            },
            {
                q: "¿Cuál era el nombre hebreo original de la reina Ester (Ester 2:7)?",
                a: ["Hadasa", "Sefora", "Abigail", "Débora"],
                correct: 0
            },
            {
                q: "¿En qué monte desafió el profeta Elías a los 450 profetas de Baal con fuego del cielo (1 Reyes 18:19)?",
                a: ["Monte Carmelo", "Monte Sinaí / Horeb", "Monte Hermón", "Monte de los Olivos"],
                correct: 0
            },
            {
                q: "¿Cuál es el capítulo más largo de toda la Biblia, compuesto por 176 versículos organizados según el alfabeto hebreo?",
                a: ["Salmo 119", "Salmo 23", "Isaías 53", "1 Corintios 13"],
                correct: 0
            },
            {
                q: "¿Quién fue el sacerdote y rey de Salem a quien Abraham dio los diezmos de todo (Génesis 14:18-20, Hebreos 7)?",
                a: ["Melquisedec", "Aarón", "Eleazar", "Zadok"],
                correct: 0
            },
            {
                q: "¿Cuál fue el profeta que vio la visión del valle de los huesos secos que cobraban vida (Ezequiel 37)?",
                a: ["Ezequiel", "Jeremías", "Daniel", "Zacarías"],
                correct: 0
            },
            {
                q: "¿Cómo se llamaba el monte donde Moisés falleció contemplando la Tierra Prometida (Deuteronomio 34:1)?",
                a: ["Monte Nebo (Pisga)", "Monte Sinaí", "Monte Ararat", "Monte Hor"],
                correct: 0
            },
            {
                q: "¿A cuántas piezas de plata vendieron los hermanos de José al futuro gobernador de Egipto (Génesis 37:28)?",
                a: ["20 piezas de plata", "30 piezas de plata", "50 piezas de plata", "10 piezas de plata"],
                correct: 0
            },
            {
                q: "¿Cuál fue el juez de Israel que derrotó al ejército madianita con tan solo 300 valientes con trompetas y cántaros (Jueces 7)?",
                a: ["Gedeón", "Sansón", "Barac", "Jefté"],
                correct: 0
            },
            {
                q: "¿Qué profeta menor fue enviado a advertir a la gran ciudad de Nínive sobre su destrucción (Jonás 1:1-2)?",
                a: ["Jonás", "Nahúm", "Oseas", "Amós"],
                correct: 0
            },
            {
                q: "¿Quién fue el primer mártir cristiano registrado en las Escrituras, apedreado mientras testificaba de Cristo (Hechos 7)?",
                a: ["Esteban", "Santiago el hermano de Juan", "Felipe", "Bernabé"],
                correct: 0
            },
            {
                q: "¿En qué isla se encontraba el apóstol Juan cuando recibió la revelación del libro de Apocalipsis (Apocalipsis 1:9)?",
                a: ["En la isla de Patmos", "En la isla de Chipre", "En la isla de Creta", "En la isla de Malta"],
                correct: 0
            },
            {
                q: "¿Cuál es el fruto del Espíritu según Gálatas 5:22-23 que encabeza la lista apostólica?",
                a: ["Amor", "Paz", "Gozo", "Paciencia"],
                correct: 0
            },
            {
                q: "¿Cómo se llamaba la esposa de Moisés, hija de Jetro, sacerdote de Madián (Éxodo 2:21)?",
                a: ["Séfora", "Celia", "Miriam", "Raquel"],
                correct: 0
            },
            {
                q: "¿Cuántas vueltas en total dio el pueblo de Israel alrededor de los muros de Jericó en el séptimo día (Josué 6:4)?",
                a: ["Siete vueltas en el séptimo día", "Tres vueltas", "Doce vueltas", "Una sola vuelta"],
                correct: 0
            },
            {
                q: "¿Quién fue el hombre que vivió la mayor cantidad de años registrada en toda la historia bíblica (Génesis 5:27)?",
                a: ["Matusalén (969 años)", "Noé (950 años)", "Adán (930 años)", "Jared (962 años)"],
                correct: 0
            },
            {
                q: "¿Qué significan las palabras proféticas 'MENE, MENE, TEKEL, UPARSIN' vistas en el banquete del rey Belsasar (Daniel 5)?",
                a: ["Contó Dios tu reino, has sido pesado en balanza y tu reino es dividido", "Guerra santa perpetua", "Gloria eterna a Babilonia", "Cae el imperio asirio"],
                correct: 0
            },
            {
                q: "¿En qué ciudad nació el Mesías cumpliendo la profecía de Miqueas 5:2?",
                a: ["Belén de Judá", "Nazaret de Galilea", "Jerusalén", "Samaria"],
                correct: 0
            },
            {
                q: "¿Qué título o nombre dio el profeta Isaías al Mesías venidero en Isaías 9:6?",
                a: ["Admirable, Consejero, Dios Fuerte, Padre Eterno, Príncipe de Paz", "León de la Tribu de Judá", "Siervo de las Naciones", "Rey de los Siglos"],
                correct: 0
            }
        ];

        const q = hardQuestions[Math.floor(Math.random() * hardQuestions.length)];

        this.questionTitle.innerHTML = `
            <div style="font-size: 0.6em; color: #d97706; font-weight: bold;">📖 PREGUNTA BÍBLICA: ${task.name.toUpperCase()}</div>
            <div style="font-size: 0.88em; line-height: 1.35; margin-top: 6px; color: #0f172a; font-weight: 500;">${q.q}</div>
        `;

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr';
        grid.style.gap = '8px';
        grid.style.marginTop = '14px';

        const answersIndexed = q.a.map((text, idx) => ({ text, isCorrect: idx === q.correct }));
        answersIndexed.sort(() => Math.random() - 0.5);

        answersIndexed.forEach((item) => {
            const b = document.createElement('button');
            b.className = 'task-btn';
            b.style.textAlign = 'left';
            b.style.padding = '10px 14px';
            b.style.fontSize = '0.9em';
            b.style.lineHeight = '1.3';
            b.innerText = item.text;

            b.onclick = () => {
                if (item.isCorrect) {
                    b.style.background = '#15803d';
                    b.style.boxShadow = '0 0 15px #4ade80';
                    window.gameAudio.playTaskComplete();
                    setTimeout(() => this.finishSuccess(), 450);
                } else {
                    b.style.background = '#dc2626';
                    if (window.gameAudio && typeof window.gameAudio.playClick === 'function') {
                        window.gameAudio.playClick();
                    }
                    setTimeout(() => { b.style.background = '#78350f'; }, 400);
                }
            };
            grid.appendChild(b);
        });

        this.container.appendChild(grid);
    }

    finishSuccess() {
        this.close();
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }

    close() {
        this.modal.style.display = 'none';
        this.container.innerHTML = '';
    }
}

window.miniGameManager = new MiniGameManager();
