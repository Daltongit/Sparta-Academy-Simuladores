// JS/script-simulador.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. REFERENCIAS A ELEMENTOS DEL DOM ---
    const lobbyContainer = document.getElementById('lobby-container');
    const simuladorContainer = document.getElementById('simulador-container');
    const resultadosContainer = document.getElementById('resultados-container');
    const tituloMateria = document.getElementById('titulo-materia');
    const lobbyMateria = document.getElementById('lobby-materia');
    const lobbyPreguntasDisplay = document.getElementById('lobby-preguntas');
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
    let preguntasPorMateria = {}; // Objeto para guardar preguntas por materia
    let preguntasQuiz = [];
    let respuestasUsuario = [];
    let indicePreguntaActual = 0;
    let cronometroInterval;
    let tiempoRestanteSeg;
    let TOTAL_PREGUNTAS_QUIZ = 50;

    const materias = {
        'sociales': 'Ciencias Sociales',
        'matematicas': 'Matemáticas y Física',
        'lengua': 'Lengua y Literatura',
        'ingles': 'Inglés',
        'general': 'General (Todas)'
    };
    // Orden para el modo general
    const ordenGeneral = ['sociales', 'matematicas', 'lengua', 'ingles'];

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

        let quizDurationSeconds;
        let lobbyTiempoTexto;

        if (materiaKey === 'matematicas') {
            quizDurationSeconds = 90 * 60;
            lobbyTiempoTexto = "1 Hora y 30 Minutos (90 Minutos)";
            TOTAL_PREGUNTAS_QUIZ = 50;
        } else if (materiaKey === 'general') {
            quizDurationSeconds = 180 * 60;
            lobbyTiempoTexto = "3 Horas (180 Minutos)";
            TOTAL_PREGUNTAS_QUIZ = 200;
        } else {
            quizDurationSeconds = 60 * 60;
            lobbyTiempoTexto = "1 Hora (60 Minutos)";
            TOTAL_PREGUNTAS_QUIZ = 50;
        }

        tiempoRestanteSeg = quizDurationSeconds;

        const lobbyTiempoDisplay = document.getElementById('lobby-tiempo');
        if (lobbyTiempoDisplay) lobbyTiempoDisplay.textContent = lobbyTiempoTexto;
        if (lobbyPreguntasDisplay) lobbyPreguntasDisplay.textContent = TOTAL_PREGUNTAS_QUIZ;

        cargarPreguntas(materiaKey); // Llamar DESPUÉS de setear variables

        // Listeners
        comenzarBtn.addEventListener('click', iniciarIntento);
        siguienteBtn.addEventListener('click', irPreguntaSiguiente);
        terminarIntentoBtn.addEventListener('click', confirmarTerminarIntento);
        reiniciarBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
        cancelarModalBtn.addEventListener('click', () => { modalOverlay.style.display = 'none'; });
        confirmarModalBtn.addEventListener('click', () => { modalOverlay.style.display = 'none'; finalizarIntento(false); });
    }

    // --- 4. LÓGICA DE CARGA Y PREPARACIÓN ---
    async function cargarPreguntas(materia) {
        preguntasPorMateria = {}; // Limpiar datos previos
        let cargaExitosa = true;

        if (materia === 'general') {
            // Cargar todas las materias definidas en ordenGeneral
            try {
                const promesas = ordenGeneral.map(m =>
                    fetch(`DATA/preguntas_${m}.json`)
                        .then(res => res.ok ? res.json() : Promise.reject(`Fallo al cargar ${m}`))
                        .then(data => ({ materia: m, preguntas: data })) // Guardar con su key
                );
                const resultados = await Promise.all(promesas);

                resultados.forEach(res => {
                    if (res.preguntas.length < 50) { // Verificar si hay suficientes preguntas
                       console.warn(`Advertencia: La materia '${res.materia}' tiene solo ${res.preguntas.length} preguntas. Se usarán todas.`);
                       //throw new Error(`La materia '${res.materia}' no tiene suficientes preguntas (se necesitan 50).`);
                    }
                    preguntasPorMateria[res.materia] = res.preguntas;
                });

                // Verificar si se cargó al menos una materia
                 if (Object.keys(preguntasPorMateria).length === 0) {
                     throw new Error("No se cargaron preguntas de ninguna materia.");
                 }


            } catch (error) {
                console.error("Error cargando preguntas generales:", error);
                alert(`Error al cargar las preguntas generales. ${error.message || ''}`);
                window.location.href = 'index.html';
                cargaExitosa = false;
            }
        } else {
            // Cargar una sola materia
            const url = `DATA/preguntas_${materia}.json`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('No se encontró archivo.');
                const data = await response.json();
                 if (data.length < TOTAL_PREGUNTAS_QUIZ) { // Verificar cantidad para materias individuales
                     console.warn(`Advertencia: La materia '${materia}' tiene solo ${data.length} preguntas. Se usarán todas.`);
                    //throw new Error(`La materia '${materia}' no tiene suficientes preguntas (se necesitan ${TOTAL_PREGUNTAS_QUIZ}).`);
                }
                preguntasPorMateria[materia] = data; // Guardar aunque sea una sola
            } catch (error) {
                console.error(error);
                alert(`Error cargando preguntas de ${materias[materia]}. ${error.message || ''}`);
                window.location.href = 'index.html';
                cargaExitosa = false;
            }
        }
    }


    function prepararQuiz() {
        const params = new URLSearchParams(window.location.search);
        const materiaKey = params.get('materia') || 'sociales';
        preguntasQuiz = []; // Limpiar quiz anterior

        if (materiaKey === 'general') {
            // Barajar y tomar 50 de cada materia en orden
            ordenGeneral.forEach(materia => {
                if (preguntasPorMateria[materia] && preguntasPorMateria[materia].length > 0) {
                    const preguntasMateriaBarajadas = [...preguntasPorMateria[materia]].sort(() => Math.random() - 0.5);
                    // Tomar hasta 50, o menos si no hay suficientes
                    const preguntasSeleccionadas = preguntasMateriaBarajadas.slice(0, 50); 
                    preguntasQuiz = preguntasQuiz.concat(preguntasSeleccionadas);
                } else {
                    console.warn(`No hay preguntas cargadas para ${materia} en modo general.`);
                }
            });
             // Actualizar TOTAL_PREGUNTAS_QUIZ por si alguna materia no tenía 50
            TOTAL_PREGUNTAS_QUIZ = preguntasQuiz.length; 
            if (lobbyPreguntasDisplay) lobbyPreguntasDisplay.textContent = TOTAL_PREGUNTAS_QUIZ;

        } else {
            // Tomar 50 (o menos) de la materia única cargada
             if (preguntasPorMateria[materiaKey] && preguntasPorMateria[materiaKey].length > 0) {
                const preguntasBarajadas = [...preguntasPorMateria[materiaKey]].sort(() => Math.random() - 0.5);
                 // Tomar hasta TOTAL_PREGUNTAS_QUIZ (50 o 90) o menos si no hay suficientes
                preguntasQuiz = preguntasBarajadas.slice(0, TOTAL_PREGUNTAS_QUIZ); 
                 // Actualizar por si no había suficientes
                 TOTAL_PREGUNTAS_QUIZ = preguntasQuiz.length;
                 if (lobbyPreguntasDisplay) lobbyPreguntasDisplay.textContent = TOTAL_PREGUNTAS_QUIZ;
            } else {
                 console.error(`No hay preguntas cargadas para la materia ${materiaKey}`);
                 preguntasQuiz = []; // Asegurar que esté vacío si falla
                 TOTAL_PREGUNTAS_QUIZ = 0;
            }
        }

        // Inicializar el array de respuestas del usuario con el tamaño correcto
        respuestasUsuario = new Array(TOTAL_PREGUNTAS_QUIZ).fill(null);
    }


    // --- 5. LÓGICA DEL SIMULADOR --- (Sin cambios significativos, ya usan TOTAL_PREGUNTAS_QUIZ)
    function iniciarIntento() {
        prepararQuiz();
        if (preguntasQuiz.length === 0) { alert("No se cargaron preguntas para iniciar."); return; }
        lobbyContainer.style.display = 'none';
        simuladorContainer.style.display = 'grid';
        construirNavegador();
        mostrarPregunta(0);
        iniciarCronometro();
    }

    function iniciarCronometro() {
        const minutosIni = Math.floor(tiempoRestanteSeg / 60);
        const segundosIni = tiempoRestanteSeg % 60;
        cronometroDisplay.textContent = `${minutosIni.toString().padStart(2, '0')}:${segundosIni.toString().padStart(2, '0')}`;
        clearInterval(cronometroInterval);
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
        for (let i = 0; i < TOTAL_PREGUNTAS_QUIZ; i++) {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = i + 1;
            btn.dataset.indice = i;
            navegadorPreguntas.appendChild(btn);
        }
    }

    function mostrarPregunta(indice) {
        if (indice < 0 || indice >= TOTAL_PREGUNTAS_QUIZ) return;
        indicePreguntaActual = indice;
        const pregunta = preguntasQuiz[indice];
        // Asegurarse de que 'pregunta' existe antes de acceder a sus propiedades
        if (!pregunta) {
             console.error(`Intento de mostrar pregunta inválida en índice ${indice}`);
             // Podrías mostrar un mensaje de error o ir a la siguiente si es posible
             if(indice < TOTAL_PREGUNTAS_QUIZ - 1) irPreguntaSiguiente();
             else finalizarIntento(false); // Si es la última y falla, terminar
             return;
        }
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
        siguienteBtn.disabled = (indice === TOTAL_PREGUNTAS_QUIZ - 1);
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
        if (indicePreguntaActual < TOTAL_PREGUNTAS_QUIZ - 1) {
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

    // (MODIFICADO)
    function calcularResultados() {
        let correctas = 0, incorrectas = 0, enBlanco = 0, puntaje = 0;
        // Calcula puntos por pregunta basado en el total REAL de preguntas cargadas
        const puntosPorPregunta = TOTAL_PREGUNTAS_QUIZ > 0 ? (1000 / TOTAL_PREGUNTAS_QUIZ) : 0; 

        for (let i = 0; i < TOTAL_PREGUNTAS_QUIZ; i++) {
            const respUser = respuestasUsuario[i];
            if (preguntasQuiz[i]) { // Verifica que la pregunta exista
                const respCorrecta = preguntasQuiz[i].respuesta;
                if (respUser === null) enBlanco++;
                else if (respUser === respCorrecta) { correctas++; puntaje += puntosPorPregunta; }
                else incorrectas++;
            } else {
                 console.error("Error: Pregunta no encontrada en índice", i, "durante el cálculo.");
                 enBlanco++; // Contar como en blanco si falta
            }
        }

        puntaje = Math.round(puntaje); // Redondear puntaje final
        if (puntaje < 0) puntaje = 0;

        puntajeFinalDisplay.textContent = puntaje;
        statsContestadas.textContent = correctas + incorrectas;
        statsCorrectas.textContent = correctas;
        statsIncorrectas.textContent = incorrectas;
        statsEnBlanco.textContent = enBlanco;

        mostrarRevision(puntosPorPregunta);
    }

    // (MODIFICADO)
    function mostrarRevision(puntosPorPregunta) {
        revisionContainer.innerHTML = '';
        preguntasQuiz.forEach((pregunta, i) => {
            const respUser = respuestasUsuario[i];
            const respCorrecta = pregunta.respuesta;
            const divRevision = document.createElement('div');
            divRevision.className = 'revision-pregunta';
            let feedbackHTML = '';
            const puntosCorrecta = Math.round(puntosPorPregunta); // Puntos redondeados a mostrar

            if (respUser === null) {
                feedbackHTML = `<p class="respuesta-usuario">No contestada (0 Puntos)</p><div class="feedback incorrecta">RESPUESTA<span>La respuesta correcta era: <strong>${respCorrecta}</strong></span></div>`;
            } else if (respUser === respCorrecta) {
                feedbackHTML = `<p class="respuesta-usuario">Tu respuesta: ${respUser}</p><div class="feedback correcta">CORRECTA (+${puntosCorrecta} Puntos)</div>`;
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
