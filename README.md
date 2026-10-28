# 🚢 El Arca de Noé - Bible Us (Multijugador en Tiempo Real)

Juego multijugador online cooperativo y de deducción bíblica inspirado en la historia del Arca de Noé (Génesis 6-9) y la dinámica social de *Among Us*.

---

## 🌟 Características Principales

1. **Multijugador en Tiempo Real:** Desarrollado con Node.js, Express y WebSockets con Socket.io.
2. **Roles Secretos:**
   - **Los Fieles:** Construyen y preparan el Arca cumpliendo tareas bíblicas interactivas para salvar a la creación.
   - **Judas (El Infiltrado):** Sabotea las misiones y puede viajar por conductos subterráneos de ventilación sin ser visto.
3. **Pintura Dinámica en Vivo:** Fondo cinematográfico de la tormenta del Génesis animado con olas ondulantes, balanceo del Arca, linternas cálidas parpadeantes, relámpagos ramificados y lluvia torrencial.
4. **Música en Piano Acústico:** Pista de piano solista del himno *"Sublime Gracia"* (Amazing Grace) con reproducción continua y controles de audio.
5. **Minijuegos Bíblicos Desafiantes:**
   - 🕍 *Ordenar los Utensilios Sagrados del Tabernáculo* (Éxodo 40: Lugar Santísimo, Lugar Santo, Atrio).
   - 📐 *Cálculo Sagrado de los 300 Codos del Arca* (Génesis 6:15).
   - 📜 *Restaurar el Manuscrito del Génesis* (Génesis 1:1-2).
   - 🏺 *Calafatear con Brea el Casco* (Génesis 6:14).
   - ⚡ *Conectar Cordones Sagrados del Tabernáculo* (Éxodo 26).
   - 🚰 *Bomba de Achique de Sentina con Manómetro Hidráulico*.
   - 🔍 *Encontrar 3 Diferencias en los Registros del Diluvio*.
   - 🩺 *Inspección de Cuarentena y Salud Levítica* (Levítico 13).
   - 📖 *Banco de más de 30 Preguntas Bíblicas Difíciles* con referencias bíblicas exactas.
6. **Controles Adaptables:**
   - PC: Teclas WASD o Flechas de dirección.
   - Celulares / Tablets: Joystick virtual táctil en pantalla y bloqueo forzado en modo horizontal (*landscape*).
7. **Flujo de Partidas Completo:**
   - Pantalla de inicio para crear o unirse con código de 4 letras.
   - Sala de espera centrada con conteo de tripulantes y asignación de anfitrión.
   - Reuniones de emergencia con votación bíblica y chat en vivo.
   - Pantalla completa de **¡VICTORIA O DERROTA!** con revelación del infiltrado y botón para regresar a la sala de espera.

---

## 🚀 Despliegue con Jules (Google Cloud)

Para trabajar o desplegar este proyecto con **Jules**:

1. **Subir a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: El Arca de Noe - Bible Us release v1.0"
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

2. **Conectar a Jules:**
   - Abre [Jules](https://jules.google/) o la extensión de Jules para GitHub.
   - Selecciona el repositorio de GitHub vinculado.
   - Jules clonará el código y podrá ejecutar pruebas, refactorizaciones, añadir nuevas tareas bíblicas o desplegarlo en Google Cloud Run / App Engine.

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
- Node.js versión 18 o superior.

### Pasos
1. Descarga y extrae el paquete en una carpeta.
2. Abre una terminal dentro del directorio del proyecto.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. Abre en tu navegador favorito:
   ```text
   http://localhost:3000
   ```

---

## 📁 Estructura del Proyecto

```text
├── server.js              # Servidor Socket.io, lógica de salas, colisiones y sincronización
├── package.json           # Dependencias (express, socket.io) y scripts de arranque
├── .gitignore             # Exclusión de node_modules y logs
├── README.md              # Documentación técnica y guía de despliegue
└── public/
    ├── index.html         # Estructura del juego, HUD, modales y controles
    ├── style.css          # Estilos visuales, animaciones, diseño responsive y temas
    ├── game.js            # Motor del cliente, renderizado en canvas, cámara y física
    ├── tasks.js           # Minijuegos bíblicos interactivos y preguntas bíblicas
    ├── storm_bg.js        # Fondo cinematográfico animado en tiempo real
    ├── audio.js           # Pista de piano de Sublime Gracia y efectos procedurales
    ├── voice.js           # Soporte de audio chat / comunicación
    ├── nipplejs.min.js    # Librería para joystick táctil en dispositivos móviles
    ├── ark_storm.jpg      # Pintura original del Arca en el mar tempestuoso
    ├── sublime_gracia_piano.ogg  # Pista de piano acústico solista
    └── sublime_gracia_piano.mp3  # Pista de audio alternativa
```

---

## 📜 Licencia
Este proyecto es de código abierto bajo la licencia MIT.
Melodía de *Sublime Gracia* y arreglos en dominio público / Creative Commons.
