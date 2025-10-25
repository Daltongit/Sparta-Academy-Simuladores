// JS/script-login.js - Lógica de la página de login

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usuarioInput = document.getElementById('usuario');
    const contrasenaInput = document.getElementById('contrasena');
    const errorMensaje = document.getElementById('error-mensaje');

    // Referencias al Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalNombreAspirante = document.getElementById('modal-nombre-aspirante');
    const continuarBtn = document.getElementById('continuar-btn');

    // Redirigir si ya está logueado (evita ver login si ya hay sesión)
    if (isLoggedIn()) {
        // Usamos replace para evitar que login.html quede en el historial
        window.location.replace('index.html');
        return; // Detiene la ejecución del resto del script
    }

    // Cargar usuarios
    let usuarios = [];
    fetch('DATA/usuarios.json')
        .then(response => response.json())
        .then(data => {
            usuarios = data;
        })
        .catch(error => {
            console.error('Error cargando usuarios:', error);
            errorMensaje.textContent = 'Error al cargar datos de usuario. Intente más tarde.';
            errorMensaje.style.display = 'block';
        });

    // Manejar envío del formulario
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que la página se recargue
        errorMensaje.style.display = 'none'; // Oculta errores previos

        const usuario = usuarioInput.value.trim();
        const contrasena = contrasenaInput.value;

        // Buscar al usuario
        const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.contrasena === contrasena);

        if (usuarioEncontrado) {
            // ¡Login exitoso!
            const userInfo = { nombre: usuarioEncontrado.nombre };
            saveSession(userInfo);

            // Mostrar modal de bienvenida
            modalNombreAspirante.textContent = userInfo.nombre;
            modalOverlay.style.display = 'flex';

        } else {
            // Login fallido
            errorMensaje.textContent = 'Usuario o contraseña incorrectos.';
            errorMensaje.style.display = 'block';
            contrasenaInput.value = ''; // Limpia el campo de contraseña
        }
    });

    // Manejar botón "Continuar" del modal
    continuarBtn.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
        // (MODIFICADO) Usamos replace para evitar que login.html quede en el historial
        window.location.replace('index.html');
    });
});
