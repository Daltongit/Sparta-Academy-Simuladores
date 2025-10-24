// --- 1. Elementos del HTML ---
const preguntaTexto = document.getElementById('pregunta-texto');
const opcionesContainer = document.getElementById('opciones-container');
const temporizadorDisplay = document.getElementById('temporizador');
const simuladorCont = document.getElementById('simulador-container');
const resultadosCont = document.getElementById('resultados-container');
const puntajeFinalDisplay = document.getElementById('puntaje-final');
const reiniciarBtn = document.getElementById('reiniciar-btn');

// --- 2. Variables del Simulador ---
let preguntasBarajadas = [];
let indicePreguntaActual = 0;
let puntaje = 0;
let temporizador;
let tiempoRestante = 15; // Tiempo por pregunta (configurable)

// --- 3. Cargar las preguntas desde el JSON ---
fetch('preguntas.json')
    .then(response => response.json())
    .then(preguntas => {
        // --- 4. Función para barajar (Aleatorio) ---
        // Esto cumple tu requisito de que sean aleatorias
        preguntasBarajadas = preguntas.sort(() => Math.random() - 0.5);
        iniciarSimulador();
    })
    .catch(error => {
        console.error("¡Error al cargar las preguntas!", error);
        preguntaTexto.textContent = "Error: No se pudo cargar el archivo preguntas.json. Revisa que el archivo exista y no tenga errores.";
    });

function iniciarSimulador() {
    indicePreguntaActual = 0;
    puntaje = 0;
    // Ocultar resultados y mostrar simulador (para reinicios)
    resultadosCont.style.display = 'none';
    simuladorCont.style.display = 'block';
    mostrarSiguientePregunta();
}

// --- 5. Lógica del Temporizador ---
function iniciarTemporizador() {
    tiempoRestante = 15; // Reinicia el tiempo
    temporizadorDisplay.textContent = tiempoRestante;

    clearInterval(temporizador); // Limpia el temporizador anterior

    temporizador = setInterval(() => {
        tiempoRestante--;
        temporizadorDisplay.textContent = tiempoRestante;
        if (tiempoRestante <= 0) {
            // Si se acaba el tiempo, pasa a la siguiente (sin puntos)
            clearInterval(temporizador);
            irSiguientePregunta();
        }
    }, 1000); // 1000ms = 1 segundo
}

// --- 6. Mostrar la Pregunta y Opciones ---
function mostrarSiguientePregunta() {
    // Limpiar opciones anteriores
    opcionesContainer.innerHTML = ''; 
    
    // Obtener la pregunta actual
    const pregunta = preguntasBarajadas[indicePreguntaActual];
    preguntaTexto.textContent = pregunta.pregunta;

    // Crear botones para cada opción
    pregunta.opciones.forEach(opcion => {
        const boton = document.createElement('button');
        boton.textContent = opcion;
        boton.classList.add('opcion-btn');
        boton.addEventListener('click', () => seleccionarRespuesta(opcion));
        opcionesContainer.appendChild(boton);
    });

    // Iniciar el temporizador para esta pregunta
    iniciarTemporizador();
}

// --- 7. Lógica de Selección y Puntuación ---
function seleccionarRespuesta(opcionSeleccionada) {
    clearInterval(temporizador); // Detener el tiempo
    
    const respuestaCorrecta = preguntasBarajadas[indicePreguntaActual].respuesta;

    // Comprobar si es correcta y sumar puntos
    if (opcionSeleccionada === respuestaCorrecta) {
        puntaje++;
    }

    // ¡¡IMPORTANTE!!
    // Aquí NO mostramos si fue correcta o incorrecta.
    // Simplemente pasamos a la siguiente.
    irSiguientePregunta();
}

function irSiguientePregunta() {
    indicePreguntaActual++; // Mover al siguiente índice

    // Comprobar si quedan más preguntas
    if (indicePreguntaActual < preguntasBarajadas.length) {
        mostrarSiguientePregunta();
    } else {
        // Si no hay más, mostrar resultados
        mostrarResultados();
    }
}

// --- 8. Mostrar Resultados Finales ---
function mostrarResultados() {
    simuladorCont.style.display = 'none'; // Ocultar el simulador
    resultadosCont.style.display = 'block'; // Mostrar resultados

    // Muestra el puntaje, pero NO las respuestas correctas.
    puntajeFinalDisplay.textContent = `${puntaje} / ${preguntasBarajadas.length}`;
    
    // Añadimos el listener para el nuevo botón de reiniciar
    reiniciarBtn.addEventListener('click', () => {
        location.reload(); // La forma más fácil de reiniciar todo
    });
}
