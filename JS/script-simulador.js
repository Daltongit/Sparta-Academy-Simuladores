document.addEventListener('DOMContentLoaded', () => {

    // --- 1. REFERENCIAS A ELEMENTOS DEL DOM ---
    // Contenedores de Pantallas
    const lobbyContainer = document.getElementById('lobby-container');
    const simuladorContainer = document.getElementById('simulador-container');
    const resultadosContainer = document.getElementById('resultados-container');

    // Elementos del Lobby
    const tituloMateria = document.getElementById('titulo-materia');
    const lobbyMateria = document.getElementById('lobby-materia');
    const comenzarBtn = document.getElementById('comenzar-btn');

    // Elementos del Simulador
    const cronometroDisplay = document.getElementById('cronometro');
    const preguntaNumero = document.getElementById('pregunta-numero');
    const preguntaTexto = document.getElementById('pregunta-texto');
    const opcionesContainer = document.getElementById('opciones-container');
    const navegadorPreguntas = document.getElementById('navegador-preguntas'); // (HA VUELTO)
    // const anteriorBtn = document.getElementById('anterior-btn'); // Sigue eliminado
    const siguienteBtn = document.getElementById('siguiente-btn');
    const terminarIntentoBtn = document.getElementById('terminar-intento-btn');

    // Elementos de Resultados
    const puntajeFinalDisplay = document.getElementById('puntaje-final');
    const statsContestadas = document.getElementById('stats-contestadas');
    const statsCorrectas = document.getElementById('stats-correctas');
    const statsIncorrectas = document.getElementById('stats-incorrectas');
    const statsEnBlanco = document.getElementById('stats-en-blanco');
    const revisionContainer = document.getElementById('revision-container');
    const reiniciarBtn = document.getElementById('reiniciar-btn');

    // (NUEVO) Elementos del Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalMensaje = document.getElementById('modal-mensaje');
    const cancelarModalBtn = document.getElementById('cancelar-modal-btn');
    const confirmarModalBtn = document.getElementById('confirmar-modal-btn');

    // --- 2. VARIABLES GLOBALES DEL SIMULADOR ---
    let preguntasOriginales = [];
    let preguntasQuiz = [];
    let respuestasUsuario = [];
    let indicePreguntaActual = 0;
    let cronometroInterval;
    let tiempoRestanteSeg = 3600;
    const TOTAL_PREGUNTAS = 50;

    const materias = {
        'sociales': 'Ciencias Sociales',
        'matematicas': 'Matemáticas',
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

        // Listeners de botones
        comenzarBtn.addEventListener('click', iniciarIntento);
        siguienteBtn.addEventListener('click', irPreguntaSiguiente);
        terminarIntentoBtn.addEventListener('click', confirmarTerminarIntento); // (Ahora abre el modal)
        reiniciarBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // (NUEVO) Listeners del Modal
        cancelarModalBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
        confirmarModalBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            finalizarIntento(false); // false = finalizado por usuario
        });
    }

    // --- 4. LÓGICA DE CARGA Y PREPARACIÓN ---
    function cargarPreguntas(materia) {
        const url = `DATA/preguntas_${materia}.json`;
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se encontró el archivo de preguntas.');
                }
                return response.json();
            })
            .then(data => {
                preguntasOriginales = data;
                if (data.length === 0) {
                    alert(`No hay preguntas cargadas para ${materias[materia]}. Volviendo al inicio.`);
                    window.location.href = 'index.html';
                }
            })
            .catch(error => {
                console.error(error);
                alert(`Error al cargar las preguntas de ${materias[materia]}. Volviendo al inicio.`);
                window.location.href = 'index.html';
            });
    }

    function prepararQuiz() {
        const preguntasBarajadas = [...preguntasOriginales].sort(() => Math.random() - 0.5);
        preguntasQuiz = preguntasBarajadas.slice(0, TOTAL_PREGUNTAS);
        respuestasUsuario = new Array(TOTAL_PREGUNTAS).fill(null);
    }

    // --- 5. LÓGICA DEL SIMULADOR ---
    function iniciarIntento() {
        prepararQuiz();
        if (preguntasQuiz.length === 0) {
            alert("No se pudieron cargar las preguntas para el intento.");
            return;
        }

        lobbyContainer.style.display = 'none';
        simuladorContainer.style.display = 'grid'; 

        construirNavegador(); // (HA VUELTO)
        mostrarPregunta(0);
        iniciarCronometro();
    }

    function iniciarCronometro() {
        cronometroInterval = setInterval(() => {
            tiempoRestanteSeg--;
            
            const minutos = Math.floor(tiempoRestanteSeg / 60);
            const segundos = tiempoRestanteSeg % 60;
            
            cronometroDisplay.textContent = 
                `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

            if (tiempoRestanteSeg <= 0) {
                finalizarIntento(true);
            }
        }, 1000);
    }

    // (HA VUELTO)
    function construirNavegador() {
        navegadorPreguntas.innerHTML = ''; // Limpiar
        for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = i + 1;
            btn.dataset.indice = i;
            // IMPORTANTE: ¡No agregamos addEventListener!
            // Es solo visual, no clickeable.
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
            
            if (respuestasUsuario[indice] === opcion) {
                btn.classList.add('selected');
            }

            btn.addEventListener('click', () => seleccionarRespuesta(opcion));
            opcionesContainer.appendChild(btn);
        });

        siguienteBtn.disabled = (indice === TOTAL_PREGUNTAS - 1);

        actualizarNavegadorVisual(); // (HA VUELTO)
    }

    function seleccionarRespuesta(opcion) {
        respuestasUsuario[indicePreguntaActual] = opcion;
        mostrarPregunta(indicePreguntaActual);
        
        // (HA VUELTO) Marcar como "contestada" en el navegador
        const navBtn = navegadorPreguntas.querySelector(`[data-indice="${indicePreguntaActual}"]`);
        if (navBtn) {
            navBtn.classList.add('answered');
        }
    }

    // (HA VUELTO)
    function actualizarNavegadorVisual() {
        const botones = navegadorPreguntas.querySelectorAll('.nav-btn');
        botones.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.indice) === indicePreguntaActual) {
                btn.classList.add('active');
            }
        });
    }

    function irPreguntaSiguiente() {
        if (indicePreguntaActual < TOTAL_PREGUNTAS - 1) {
            mostrarPregunta(indicePreguntaActual + 1);
        }
    }

    // (MODIFICADO)
    function confirmarTerminarIntento() {
        const enBlanco = respuestasUsuario.filter(r => r === null).length;
        let mensaje = "¿Estás seguro de que deseas terminar el intento?";
        
        if (enBlanco > 0) {
            mensaje += `<br><br>Todavía tienes <strong>${enBlanco} preguntas en blanco.</strong>`;
        }
        
        // Mostrar el modal personalizado
        modalMensaje.innerHTML = mensaje;
        modalOverlay.style.display = 'flex';
    }

    // --- 6. LÓGICA DE FINALIZACIÓN Y RESULTADOS ---
    function finalizarIntento(porTiempo = false) {
        clearInterval(cronometroInterval); 
        
        if (porTiempo) {
            // (NUEVO) Usamos el modal para avisar que se acabó el tiempo
            modalMensaje.innerHTML = "¡Se acabó el tiempo! El intento ha finalizado.";
            modalOverlay.style.display = 'flex';
            // Ocultamos los botones de cancelar/confirmar
            document.querySelector('.modal-botones').style.display = 'none';
            // Esperamos 3 segundos y luego mostramos resultados
            setTimeout(() => {
                modalOverlay.style.display = 'none';
                mostrarResultadosPantalla();
            }, 3000);
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
        let correctas = 0;
        let incorrectas = 0;
        let enBlanco = 0;
        let puntaje = 0;

        for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
            const pregunta = preguntasQuiz[i];
            const respuestaUser = respuestasUsuario[i];
            const respuestaCorrecta = pregunta.respuesta;

            if (respuestaUser === null) {
                enBlanco++;
            } else if (respuestaUser === respuestaCorrecta) {
                correctas++;
                puntaje += 20; // +20 por correcta
            } else {
                incorrectas++;
                // Sin penalización
            }
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
            const respuestaUser = respuestasUsuario[i];
            const respuestaCorrecta = pregunta.respuesta;

            const divRevision = document.createElement('div');
            divRevision.className = 'revision-pregunta';

            let feedbackHTML = '';
            if (respuestaUser === null) {
                feedbackHTML = `
                    <p class="respuesta-usuario">No contestada (0 Puntos)</p>
                    <div class="feedback incorrecta">
                        RESPUESTA
                        <span>La respuesta correcta era: <strong>${respuestaCorrecta}</strong></span>
                    </div>`;
            } else if (respuestaUser === respuestaCorrecta) {
                feedbackHTML = `
                    <p class="respuesta-usuario">Tu respuesta: ${respuestaUser}</p>
                    <div class="feedback correcta">CORRECTA (+20 Puntos)</div>`;
            } else {
                feedbackHTML = `
                    <p class="respuesta-usuario">Tu respuesta: ${respuestaUser}</p>
                    <div class="feedback incorrecta">
                        INCORRECTA (0 Puntos)
                        <span>La respuesta correcta era: <strong>${respuestaCorrecta}</strong></span>
                    </div>`;
            }

            divRevision.innerHTML = `
                <p><span class="pregunta-num">Pregunta ${i + 1}:</span> ${pregunta.pregunta}</p>
                ${feedbackHTML}
            `;
            
            revisionContainer.appendChild(divRevision);
        });
    }

    // --- KICKOFF ---
    inicializar();
});
