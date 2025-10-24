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
    const navegadorPreguntas = document.getElementById('navegador-preguntas');
    const anteriorBtn = document.getElementById('anterior-btn');
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

    // --- 2. VARIABLES GLOBALES DEL SIMULADOR ---
    let preguntasOriginales = [];      // Todas las preguntas (ej. 200)
    let preguntasQuiz = [];            // Las 50 preguntas aleatorias para este intento
    let respuestasUsuario = [];        // Array para guardar las respuestas (50 posiciones)
    let indicePreguntaActual = 0;
    let cronometroInterval;
    let tiempoRestanteSeg = 3600;      // 1 hora = 3600 segundos
    const TOTAL_PREGUNTAS = 50;

    const materias = {
        'sociales': 'Ciencias Sociales',
        'matematicas': 'Matemáticas',
        'lengua': 'Lengua y Literatura',
        'ingles': 'Inglés'
    };

    // --- 3. INICIALIZACIÓN ---
    function inicializar() {
        // Obtener la materia de la URL (ej: simulador.html?materia=sociales)
        const params = new URLSearchParams(window.location.search);
        const materiaKey = params.get('materia') || 'sociales'; // Default a sociales
        const nombreMateria = materias[materiaKey] || 'Desconocida';

        // Configurar el Lobby
        tituloMateria.textContent = `SIMULADOR DE: ${nombreMateria.toUpperCase()}`;
        lobbyMateria.textContent = nombreMateria;
        
        // Mostrar solo el lobby
        lobbyContainer.style.display = 'block';
        simuladorContainer.style.display = 'none';
        resultadosContainer.style.display = 'none';

        // Cargar las preguntas de la materia seleccionada
        cargarPreguntas(materiaKey);

        // Listeners de botones
        comenzarBtn.addEventListener('click', iniciarIntento);
        anteriorBtn.addEventListener('click', irPreguntaAnterior);
        siguienteBtn.addEventListener('click', irPreguntaSiguiente);
        terminarIntentoBtn.addEventListener('click', confirmarTerminarIntento);
        reiniciarBtn.addEventListener('click', () => {
            window.location.href = 'index.html'; // Volver a la página principal
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
        // Barajar todas las preguntas
        const preguntasBarajadas = [...preguntasOriginales].sort(() => Math.random() - 0.5);
        // Tomar las primeras 50
        preguntasQuiz = preguntasBarajadas.slice(0, TOTAL_PREGUNTAS);
        // Inicializar el array de respuestas del usuario
        respuestasUsuario = new Array(TOTAL_PREGUNTAS).fill(null);
    }

    // --- 5. LÓGICA DEL SIMULADOR ---
    function iniciarIntento() {
        prepararQuiz();
        if (preguntasQuiz.length === 0) {
            alert("No se pudieron cargar las preguntas para el intento.");
            return;
        }

        // Ocultar lobby, mostrar simulador
        lobbyContainer.style.display = 'none';
        simuladorContainer.style.display = 'grid'; // Usamos grid como en el CSS

        construirNavegador();
        mostrarPregunta(0);
        iniciarCronometro();
    }

    function iniciarCronometro() {
        cronometroInterval = setInterval(() => {
            tiempoRestanteSeg--;
            
            const minutos = Math.floor(tiempoRestanteSeg / 60);
            const segundos = tiempoRestanteSeg % 60;
            
            // Formatear a MM:SS
            cronometroDisplay.textContent = 
                `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

            if (tiempoRestanteSeg <= 0) {
                finalizarIntento(true); // true = finalizado por tiempo
            }
        }, 1000);
    }

    function construirNavegador() {
        navegadorPreguntas.innerHTML = ''; // Limpiar
        for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = i + 1;
            btn.dataset.indice = i; // Guardar el índice
            btn.addEventListener('click', () => mostrarPregunta(i));
            navegadorPreguntas.appendChild(btn);
        }
    }

    function mostrarPregunta(indice) {
        // Validar índice
        if (indice < 0 || indice >= TOTAL_PREGUNTAS) return;
        
        indicePreguntaActual = indice;
        const pregunta = preguntasQuiz[indice];

        // Actualizar textos
        preguntaNumero.textContent = `Pregunta ${indice + 1}`;
        preguntaTexto.textContent = pregunta.pregunta;

        // Limpiar y crear opciones
        opcionesContainer.innerHTML = '';
        pregunta.opciones.forEach(opcion => {
            const btn = document.createElement('button');
            btn.className = 'opcion-btn';
            btn.innerHTML = opcion; // Usar innerHTML por si hay formato
            
            // Marcar si ya fue seleccionada
            if (respuestasUsuario[indice] === opcion) {
                btn.classList.add('selected');
            }

            btn.addEventListener('click', () => seleccionarRespuesta(opcion));
            opcionesContainer.appendChild(btn);
        });

        // Actualizar botones de navegación
        anteriorBtn.disabled = (indice === 0);
        siguienteBtn.disabled = (indice === TOTAL_PREGUNTAS - 1);

        // Actualizar navegador visual
        actualizarNavegadorVisual();
    }

    function seleccionarRespuesta(opcion) {
        respuestasUsuario[indicePreguntaActual] = opcion;
        mostrarPregunta(indicePreguntaActual); // Volver a dibujar para mostrar selección
        
        // Marcar como "contestada" en el navegador
        const navBtn = navegadorPreguntas.querySelector(`[data-indice="${indicePreguntaActual}"]`);
        if (navBtn) {
            navBtn.classList.add('answered');
        }

        // (Opcional) Avanzar automáticamente
        // if(indicePreguntaActual < TOTAL_PREGUNTAS - 1) {
        //     irPreguntaSiguiente();
        // }
    }

    function actualizarNavegadorVisual() {
        const botones = navegadorPreguntas.querySelectorAll('.nav-btn');
        botones.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.indice) === indicePreguntaActual) {
                btn.classList.add('active');
            }
        });
    }

    function irPreguntaAnterior() {
        mostrarPregunta(indicePreguntaActual - 1);
    }

    function irPreguntaSiguiente() {
        mostrarPregunta(indicePreguntaActual + 1);
    }

    function confirmarTerminarIntento() {
        const enBlanco = respuestasUsuario.filter(r => r === null).length;
        let mensaje = "¿Estás seguro de que deseas terminar el intento?";
        if (enBlanco > 0) {
            mensaje += `\n\nTodavía tienes ${enBlanco} preguntas en blanco.`;
        }
        
        if (confirm(mensaje)) {
            finalizarIntento(false); // false = finalizado por usuario
        }
    }

    // --- 6. LÓGICA DE FINALIZACIÓN Y RESULTADOS ---
    function finalizarIntento(porTiempo = false) {
        clearInterval(cronometroInterval); // Detener el cronómetro
        
        if (porTiempo) {
            alert("¡Se acabó el tiempo! El intento ha finalizado.");
        }

        // Ocultar simulador, mostrar resultados
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
                // puntaje += 0;
            } else if (respuestaUser === respuestaCorrecta) {
                correctas++;
                puntaje += 20; // +20 por correcta
            } else {
                incorrectas++;
                puntaje -= 10; // -10 por incorrecta
            }
        }

        // Asegurar que el puntaje no sea negativo
        if (puntaje < 0) {
            puntaje = 0;
        }

        // Mostrar estadísticas
        puntajeFinalDisplay.textContent = puntaje;
        statsContestadas.textContent = correctas + incorrectas;
        statsCorrectas.textContent = correctas;
        statsIncorrectas.textContent = incorrectas;
        statsEnBlanco.textContent = enBlanco;

        // Mostrar revisión
        mostrarRevision();
    }

    function mostrarRevision() {
        revisionContainer.innerHTML = ''; // Limpiar

        preguntasQuiz.forEach((pregunta, i) => {
            const respuestaUser = respuestasUsuario[i];
            const respuestaCorrecta = pregunta.respuesta;

            const divRevision = document.createElement('div');
            divRevision.className = 'revision-pregunta';

            let feedbackHTML = '';
            if (respuestaUser === null) {
                feedbackHTML = `
                    <p class="respuesta-usuario">No contestada</p>
                    <div class="feedback incorrecta">
                        INCORRECTA
                        <span>La respuesta correcta era: <strong>${respuestaCorrecta}</strong></span>
                    </div>`;
            } else if (respuestaUser === respuestaCorrecta) {
                feedbackHTML = `
                    <p class="respuesta-usuario">Tu respuesta: ${respuestaUser}</p>
                    <div class="feedback correcta">CORRECTA</div>`;
            } else {
                feedbackHTML = `
                    <p class="respuesta-usuario">Tu respuesta: ${respuestaUser}</p>
                    <div class="feedback incorrecta">
                        INCORRECTA
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