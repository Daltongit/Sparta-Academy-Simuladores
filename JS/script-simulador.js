document.addEventListener('DOMContentLoaded', () => {

    // --- 1. REFERENCIAS A ELEMENTOS DEL DOM ---
    const lobbyContainer = document.getElementById('lobby-container');
    const simuladorContainer = document.getElementById('simulador-container');
    const resultadosContainer = document.getElementById('resultados-container');
    const tituloMateria = document.getElementById('titulo-materia');
    const lobbyMateria = document.getElementById('lobby-materia');
    const comenzarBtn = document.getElementById('comenzar-btn');
    const cronometroDisplay = document.getElementById('cronometro');
    const preguntaNumero = document.getElementById('pregunta-numero');
    const preguntaTexto = document.getElementById('pregunta-texto');
    const opcionesContainer = document.getElementById('opciones-container');
    const navegadorPreguntas = document.getElementById('navegador-preguntas');
    const siguienteBtn = document.getElementById('siguiente-btn');
    const terminarIntentoBtn = document.getElementById('terminar-intento-btn');
    const puntajeFinalDisplay = document.getElementById('puntaje-final');
    const statsContestadas = document.getElementById('stats-contestadas');
    const statsCorrectas = document.getElementById('stats-correctas');
    const statsIncorrectas = document.getElementById('stats-incorrectas');
    const statsEnBlanco = document.getElementById('stats-en-blanco');
    const revisionContainer = document.getElementById('revision-container');
    const reiniciarBtn = document.getElementById('reiniciar-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalMensaje = document.getElementById('modal-mensaje');
    const cancelarModalBtn = document.getElementById('cancelar-modal-btn');
    const confirmarModalBtn = document.getElementById('confirmar-modal-btn');
    const modalBotones = document.querySelector('.modal-botones');

    // --- 2. VARIABLES GLOBALES DEL SIMULADOR ---
    let preguntasOriginales = [];
    let preguntasQuiz = [];
    let respuestasUsuario = [];
    let indicePreguntaActual = 0;
    let cronometroInterval;
    let tiempoRestanteSeg; // <-- Se inicializa en inicializar()
    const TOTAL_PREGUNTAS = 50;

    const materias = {
        'sociales': 'Ciencias Sociales',
        'matematicas': 'Matemáticas y Física', // Ajustado nombre si aplica
        'lengua': 'Lengua y Literatura',
        'ingles': 'Inglés'
    };

    // --- 3. INICIALIZACIÓN ---
    function inicializar() {
        const params = new URLSearchParams(window.location.search);
        const materiaKey = params.get('materia') || 'sociales';
        const nombreMateria = materias[materiaKey] || 'Desconocida';

        tituloMateria.textContent = `SIMULADOR DE: ${nombreMateria.toUpperCase()}`;
        lobbyMateria.textContent = nombreMateria;
        
        lobbyContainer.style.display = 'block';
        simuladorContainer.style.display = 'none';
        resultadosContainer.style.display = 'none';

        cargarPreguntas(materiaKey);

        // --- (MODIFICADO) Determinar Duración y Actualizar Lobby ---
        let quizDurationSeconds;
        let lobbyTiempoTexto;

        if (materiaKey === 'matematicas') {
            quizDurationSeconds = 90 * 60; // 90 minutos * 60 segundos
            lobbyTiempoTexto = "1 Hora y 30 Minutos (90 Minutos)";
        } else {
            quizDurationSeconds = 60 * 60; // 60 minutos * 60 segundos
            lobbyTiempoTexto = "1 Hora (60 Minutos)";
        }

        // Actualizar el tiempo restante inicial
        tiempoRestanteSeg = quizDurationSeconds; 

        // Actualizar el texto en el lobby (si existe el elemento)
        const lobbyTiempoDisplay = document.getElementById('lobby-tiempo');
        if (lobbyTiempoDisplay) {
            lobbyTiempoDisplay.textContent = lobbyTiempoTexto;
        }
        // --- Fin Modificación --- 

        // Listeners
        comenzarBtn.addEventListener('click', iniciarIntento);
        siguienteBtn.addEventListener('click', irPreguntaSiguiente);
        terminarIntentoBtn.addEventListener('click', confirmarTerminarIntento);
        reiniciarBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
        cancelarModalBtn.addEventListener('click', () => { modalOverlay.style.display = 'none'; });
        confirmarModalBtn.addEventListener('click', () => { modalOverlay.style.display = 'none'; finalizarIntento(false); });
    }

    // --- 4. LÓGICA DE CARGA Y PREPARACIÓN ---
    function cargarPreguntas(materia) {
        const url = `DATA/preguntas_${materia}.json`;
        fetch(url)
            .then(response => { if (!response.ok) throw new Error('No se encontró archivo.'); return response.json(); })
            .then(data => {
                preguntasOriginales = data;
                if (data.length === 0) { alert(`No hay preguntas para ${materias[materia]}.`); window.location.href = 'index.html'; }
            })
            .catch(error => { console.error(error); alert(`Error cargando preguntas de ${materias[materia]}.`); window.location.href = 'index.html'; });
    }

    function prepararQuiz() {
        const preguntasBarajadas = [...preguntasOriginales].sort(() => Math.random() - 0.5);
        preguntasQuiz = preguntasBarajadas.slice(0, TOTAL_PREGUNTAS);
        respuestasUsuario = new Array(TOTAL_PREGUNTAS).fill(null);
    }

    // --- 5. LÓGICA DEL SIMULADOR ---
    function iniciarIntento() {
        prepararQuiz();
        if (preguntasQuiz.length === 0) { alert("No se cargaron preguntas."); return; }
        lobbyContainer.style.display = 'none';
        simuladorContainer.style.display = 'grid';
        construirNavegador();
        mostrarPregunta(0);
        iniciarCronometro();
    }

    function iniciarCronometro() {
        // tiempoRestanteSeg = quizDurationSeconds; // Asegura que SIEMPRE inicie con el tiempo correcto
        // La línea de arriba es opcional si ya lo asignaste en inicializar, pero no hace daño
        
        // Actualizar display inicial
        const minutosIni = Math.floor(tiempoRestanteSeg / 60);
        const segundosIni = tiempoRestanteSeg % 60;
        cronometroDisplay.textContent = `${minutosIni.toString().padStart(2, '0')}:${segundosIni.toString().padStart(2, '0')}`;

        clearInterval(cronometroInterval); // Limpia si había uno previo
        cronometroInterval = setInterval(() => {
            tiempoRestanteSeg--;
            const minutos = Math.floor(tiempoRestanteSeg / 60);
            const segundos = tiempoRestanteSeg % 60;
            cronometroDisplay.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
            if (tiempoRestanteSeg <= 0) { finalizarIntento(true); }
        }, 1000);
    }

    function construirNavegador() {
        navegadorPreguntas.innerHTML = '';
        for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = i + 1;
            btn.dataset.indice = i;
            navegadorPreguntas.appendChild(btn);
        }
    }

    function mostrarPregunta(indice) {
        if (indice < 0 || indice >= TOTAL_PREGUNTAS) return;
        indicePreguntaActual = indice;
        const pregunta = preguntasQuiz[indice];
        preguntaNumero.textContent = `Pregunta ${indice + 1}`;
        preguntaTexto.textContent = pregunta.pregunta;
        opcionesContainer.innerHTML = '';
        pregunta.opciones.forEach(opcion => {
            const btn = document.createElement('button');
            btn.className = 'opcion-btn';
            btn.innerHTML = opcion;
            if (respuestasUsuario[indice] === opcion) btn.classList.add('selected');
            btn.addEventListener('click', () => seleccionarRespuesta(opcion));
            opcionesContainer.appendChild(btn);
        });
        siguienteBtn.disabled = (indice === TOTAL_PREGUNTAS - 1);
        actualizarNavegadorVisual();
    }

    function seleccionarRespuesta(opcion) {
        respuestasUsuario[indicePreguntaActual] = opcion;
        mostrarPregunta(indicePreguntaActual);
        const navBtn = navegadorPreguntas.querySelector(`[data-indice="${indicePreguntaActual}"]`);
        if (navBtn) navBtn.classList.add('answered');
    }

    function actualizarNavegadorVisual() {
        const botones = navegadorPreguntas.querySelectorAll('.nav-btn');
        botones.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.indice) === indicePreguntaActual) btn.classList.add('active');
        });
    }

    function irPreguntaSiguiente() {
        if (indicePreguntaActual < TOTAL_PREGUNTAS - 1) {
            mostrarPregunta(indicePreguntaActual + 1);
        }
    }

    function confirmarTerminarIntento() {
        const enBlanco = respuestasUsuario.filter(r => r === null).length;
        let mensaje = "¿Estás seguro de que deseas terminar el intento?";
        if (enBlanco > 0) mensaje += `<br><br>Todavía tienes <strong>${enBlanco} preguntas en blanco.</strong>`;
        modalMensaje.innerHTML = mensaje;
        modalBotones.style.display = 'flex';
        modalOverlay.style.display = 'flex';
    }

    // --- 6. LÓGICA DE FINALIZACIÓN Y RESULTADOS ---
    function finalizarIntento(porTiempo = false) {
        clearInterval(cronometroInterval);
        if (porTiempo) {
            modalMensaje.innerHTML = "¡Se acabó el tiempo!<br>El intento ha finalizado.";
            modalBotones.style.display = 'none';
            modalOverlay.style.display = 'flex';
            setTimeout(() => { modalOverlay.style.display = 'none'; mostrarResultadosPantalla(); }, 3000);
        } else {
            mostrarResultadosPantalla();
        }
    }

    function mostrarResultadosPantalla() {
        simuladorContainer.style.display = 'none';
        resultadosContainer.style.display = 'block';
        calcularResultados();
    }

    function calcularResultados() {
        let correctas = 0, incorrectas = 0, enBlanco = 0, puntaje = 0;
        for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
            const respUser = respuestasUsuario[i];
            const respCorrecta = preguntasQuiz[i].respuesta;
            if (respUser === null) enBlanco++;
            else if (respUser === respCorrecta) { correctas++; puntaje += 20; }
            else incorrectas++;
        }
        if (puntaje < 0) puntaje = 0;
        puntajeFinalDisplay.textContent = puntaje;
        statsContestadas.textContent = correctas + incorrectas;
        statsCorrectas.textContent = correctas;
        statsIncorrectas.textContent = incorrectas;
        statsEnBlanco.textContent = enBlanco;
        mostrarRevision();
    }

    function mostrarRevision() {
        revisionContainer.innerHTML = '';
        preguntasQuiz.forEach((pregunta, i) => {
            const respUser = respuestasUsuario[i];
            const respCorrecta = pregunta.respuesta;
            const divRevision = document.createElement('div');
            divRevision.className = 'revision-pregunta';
            let feedbackHTML = '';
            if (respUser === null) {
                feedbackHTML = `<p class="respuesta-usuario">No contestada (0 Puntos)</p><div class="feedback incorrecta">RESPUESTA<span>La respuesta correcta era: <strong>${respCorrecta}</strong></span></div>`;
            } else if (respUser === respCorrecta) {
                feedbackHTML = `<p class="respuesta-usuario">Tu respuesta: ${respUser}</p><div class="feedback correcta">CORRECTA (+20 Puntos)</div>`;
            } else {
                feedbackHTML = `<p class="respuesta-usuario">Tu respuesta: ${respUser}</p><div class="feedback incorrecta">INCORRECTA (0 Puntos)<span>La respuesta correcta era: <strong>${respCorrecta}</strong></span></div>`;
            }
            divRevision.innerHTML = `<p><span class="pregunta-num">Pregunta ${i + 1}:</span> ${pregunta.pregunta}</p>${feedbackHTML}`;
            revisionContainer.appendChild(divRevision);
        });
    }

    // --- KICKOFF ---
    inicializar();
});
