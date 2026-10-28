// Bible Us - Fondo Dinámico del Arca de Noé en Mar Tempestuoso
// Basado fielmente en la pintura bíblica: Mar en movimiento, Arca balanceándose, lluvia y relámpago

(function() {
    let canvas = null;
    let ctx = null;
    let animId = null;
    let isRunning = false;

    const arkImage = new Image();
    let imageLoaded = false;
    arkImage.onload = () => { imageLoaded = true; };
    arkImage.src = '/ark_storm.jpg';
    if (arkImage.complete && arkImage.naturalWidth > 0) {
        imageLoaded = true;
    }

    const rainDrops = [];
    const maxRain = 260;
    const splashes = [];
    const foamParticles = [];

    let lightningTimer = 160;
    let lightningFlash = 0;
    let currentBolt = [];

    function initStorm() {
        canvas = document.getElementById('stormCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'stormCanvas';
            document.body.prepend(canvas);
        }
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '1';
        canvas.style.pointerEvents = 'none';
        canvas.style.display = 'block';

        ctx = canvas.getContext('2d');

        function resize() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initRain();
        }
        resize();
        window.addEventListener('resize', resize);

        start();
    }

    function initRain() {
        rainDrops.length = 0;
        const w = canvas ? canvas.width : window.innerWidth;
        const h = canvas ? canvas.height : window.innerHeight;
        for (let i = 0; i < maxRain; i++) {
            rainDrops.push({
                x: Math.random() * (w + 400) - 200,
                y: Math.random() * h,
                len: Math.random() * 26 + 20,
                speed: Math.random() * 12 + 22,
                thickness: Math.random() * 1.6 + 0.8,
                alpha: Math.random() * 0.45 + 0.35
            });
        }
    }

    function generateLightningBolt(startX, startY, endX, endY) {
        const points = [{ x: startX, y: startY }];
        let curX = startX;
        let curY = startY;
        const steps = 14;
        const dy = (endY - startY) / steps;

        for (let i = 0; i < steps; i++) {
            curX += (Math.random() - 0.5) * 32 + (endX - startX) / steps;
            curY += dy + (Math.random() - 0.5) * 8;
            points.push({ x: curX, y: curY });
        }
        return points;
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        loop();
    }

    function stop() {
        isRunning = false;
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    }

    function loop() {
        if (!isRunning) return;
        drawStorm();
        animId = requestAnimationFrame(loop);
    }

    function drawStorm() {
        if (!ctx || !canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        const time = Date.now() * 0.001;

        // Limpiar lienzo
        ctx.clearRect(0, 0, w, h);

        // 1. DIBUJAR PINTURA ORIGINAL COMO BASE O FONDO PROCEDURAL DEGRADADO
        const hasImage = (imageLoaded || (arkImage.complete && arkImage.naturalWidth > 0));
        let imgX = 0, imgY = 0, imgW = w, imgH = h;
        if (hasImage) {
            const scale = Math.max(w / arkImage.naturalWidth, h / arkImage.naturalHeight);
            imgW = arkImage.naturalWidth * scale;
            imgH = arkImage.naturalHeight * scale;
            imgX = (w - imgW) / 2;
            imgY = (h - imgH) / 2;

            ctx.drawImage(arkImage, imgX, imgY, imgW, imgH);
        } else {
            // Fondo de respaldo si la imagen aún carga
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
            skyGrad.addColorStop(0, '#060d1a');
            skyGrad.addColorStop(0.5, '#0b1f36');
            skyGrad.addColorStop(1, '#081726');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // 2. DARLE MOVIMIENTO AL BARCO (ARCA)
        // La barca en la pintura está ubicada aprox en x: 60%-80%, y: 50%-68%
        if (hasImage) {
            const srcArkX = arkImage.naturalWidth * 0.59;
            const srcArkY = arkImage.naturalHeight * 0.48;
            const srcArkW = arkImage.naturalWidth * 0.23;
            const srcArkH = arkImage.naturalHeight * 0.22;

            const dstArkW = srcArkW * (imgW / arkImage.naturalWidth);
            const dstArkH = srcArkH * (imgH / arkImage.naturalHeight);
            const dstArkX = imgX + imgW * 0.59;
            const dstArkY = imgY + imgH * 0.48;

            // Balanceo dinámico y cabeceo sobre olas
            const pitch = Math.sin(time * 2.2) * 0.045; // ~2.5 grados de inclinación
            const bobY = Math.sin(time * 3.0) * 5.5;    // subida y bajada vertical
            const swayX = Math.cos(time * 1.8) * 3.0;

            ctx.save();
            ctx.translate(dstArkX + dstArkW / 2 + swayX, dstArkY + dstArkH / 2 + bobY);
            ctx.rotate(pitch);

            // Re-renderizar la porción del arca con su balanceo y máscara suave
            ctx.drawImage(
                arkImage,
                srcArkX, srcArkY, srcArkW, srcArkH,
                -dstArkW / 2, -dstArkH / 2, dstArkW, dstArkH
            );

            // Linternas cálidas parpadeando en las ventanas del Arca
            const lanternGlow = Math.sin(time * 8) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(253, 224, 71, ${0.45 * lanternGlow})`;
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 14;

            // Ventanas de la cubierta del Arca
            const winX1 = -dstArkW * 0.15;
            const winY1 = -dstArkH * 0.08;
            ctx.fillRect(winX1, winY1, dstArkW * 0.05, dstArkH * 0.08);
            ctx.fillRect(winX1 + dstArkW * 0.09, winY1, dstArkW * 0.05, dstArkH * 0.08);
            ctx.fillRect(winX1 + dstArkW * 0.18, winY1, dstArkW * 0.05, dstArkH * 0.08);
            ctx.fillRect(winX1 + dstArkW * 0.27, winY1, dstArkW * 0.05, dstArkH * 0.08);

            ctx.restore();
        }

        // 3. DARLE MOVIMIENTO A LAS AGUAS (OLAS ONDULANTES Y ESPUMA BLANCA DINÁMICA)
        const seaLevel = h * 0.52;
        // Capa de agua profunda con resplandor turquesa translúcido
        for (let waveIdx = 0; waveIdx < 3; waveIdx++) {
            ctx.save();
            ctx.beginPath();
            const yOffset = seaLevel + waveIdx * 45;
            const speedMul = 1.6 + waveIdx * 0.6;
            const amp = 10 + waveIdx * 5;

            ctx.moveTo(0, h);
            ctx.lineTo(0, yOffset);

            for (let x = 0; x <= w; x += 18) {
                const sine1 = Math.sin(x * 0.007 + time * speedMul) * amp;
                const sine2 = Math.cos(x * 0.014 - time * 1.3) * (amp * 0.5);
                const cy = yOffset + sine1 + sine2;
                ctx.lineTo(x, cy);

                // Generar espuma esporádica en las crestas más altas
                if (waveIdx === 0 && Math.random() < 0.02 && foamParticles.length < 50) {
                    foamParticles.push({
                        x: x + (Math.random() - 0.5) * 10,
                        y: cy,
                        vx: -Math.random() * 2 - 1,
                        vy: -Math.random() * 2,
                        alpha: 0.8,
                        size: Math.random() * 4 + 2
                    });
                }
            }

            ctx.lineTo(w, h);
            ctx.closePath();

            if (waveIdx === 0) {
                ctx.fillStyle = 'rgba(12, 74, 96, 0.28)'; // Turquesa translúcido
                ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)'; // Cresta de espuma clara
                ctx.lineWidth = 2.5;
                ctx.stroke();
            } else if (waveIdx === 1) {
                ctx.fillStyle = 'rgba(8, 47, 73, 0.22)';
                ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(3, 20, 36, 0.18)';
            }
            ctx.fill();
            ctx.restore();
        }

        // Partículas de espuma y rocío marino
        for (let i = foamParticles.length - 1; i >= 0; i--) {
            const p = foamParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.06; // gravedad
            p.alpha -= 0.02;

            if (p.alpha <= 0 || p.y > h) {
                foamParticles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = `rgba(240, 249, 255, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4. DARLE MOVIMIENTO AL RAYO (RELÁMPAGO DINÁMICO EN EL CIELO)
        lightningTimer--;
        if (lightningTimer <= 0) {
            lightningFlash = 1.0;
            lightningTimer = Math.floor(Math.random() * 220 + 130);

            // Generar rayo en la posición de la pintura: X ~ 10-18%, Y ~ 20-45%
            const boltStartX = imgX + imgW * 0.11;
            const boltStartY = imgY + imgH * 0.28;
            const boltEndX = imgX + imgW * 0.14;
            const boltEndY = imgY + imgH * 0.48;
            currentBolt = generateLightningBolt(boltStartX, boltStartY, boltEndX, boltEndY);

            // Sonido de trueno atmosférico suave si está disponible
            if (window.gameAudio && typeof window.gameAudio.playThunder === 'function') {
                window.gameAudio.playThunder();
            }
        }

        if (lightningFlash > 0) {
            // Destello ambiental que ilumina nubes y mar
            ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlash * 0.36})`;
            ctx.fillRect(0, 0, w, h);

            // Dibujar relámpago con brillo eléctrico
            if (currentBolt.length > 1 && lightningFlash > 0.4) {
                ctx.save();
                ctx.strokeStyle = `rgba(255, 255, 255, ${lightningFlash})`;
                ctx.lineWidth = 3.5;
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 22;

                ctx.beginPath();
                ctx.moveTo(currentBolt[0].x, currentBolt[0].y);
                for (let i = 1; i < currentBolt.length; i++) {
                    ctx.lineTo(currentBolt[i].x, currentBolt[i].y);
                }
                ctx.stroke();

                // Ramificación secundaria
                if (currentBolt.length > 6) {
                    ctx.beginPath();
                    const mid = currentBolt[4];
                    ctx.moveTo(mid.x, mid.y);
                    ctx.lineTo(mid.x + 24, mid.y + 30);
                    ctx.lineTo(mid.x + 36, mid.y + 55);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                ctx.restore();
            }
            lightningFlash -= 0.04;
        }

        // 5. DARLE MOVIMIENTO A LAS GOTAS CAYENDO (LLUVIA DIAGONAL INTENSA Y SALPICADURAS)
        ctx.save();
        ctx.strokeStyle = 'rgba(215, 235, 255, 0.65)';
        ctx.lineCap = 'round';

        // Ángulo de lluvia diagonal (-18 grados)
        const rainAngle = -0.32;
        const cosAngle = Math.cos(rainAngle);
        const sinAngle = Math.sin(rainAngle);

        for (let i = 0; i < rainDrops.length; i++) {
            const r = rainDrops[i];

            ctx.lineWidth = r.thickness;
            ctx.strokeStyle = `rgba(220, 240, 255, ${r.alpha})`;

            const endX = r.x + sinAngle * r.len;
            const endY = r.y + cosAngle * r.len;

            ctx.beginPath();
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Desplazamiento
            r.x += sinAngle * r.speed;
            r.y += cosAngle * r.speed;

            // Salpicadura al tocar el agua
            if (r.y >= seaLevel + Math.random() * (h - seaLevel)) {
                if (splashes.length < 80 && Math.random() < 0.25) {
                    splashes.push({
                        x: r.x,
                        y: r.y,
                        radius: 2,
                        maxRadius: Math.random() * 7 + 4,
                        alpha: 0.7
                    });
                }
                r.y = -40;
                r.x = Math.random() * (w + 400) - 100;
            }
        }
        ctx.restore();

        // Salpicaduras concéntricas en la superficie del agua
        for (let i = splashes.length - 1; i >= 0; i--) {
            const s = splashes[i];
            s.radius += 0.45;
            s.alpha -= 0.035;

            if (s.alpha <= 0) {
                splashes.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.strokeStyle = `rgba(224, 242, 254, ${s.alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, s.radius * 1.8, s.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Auto-arrancar al cargar documento
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStorm);
    } else {
        initStorm();
    }

    window.stormBg = {
        initStorm,
        start,
        stop
    };
})();
