// JS/auth.js - Lógica compartida de autenticación y sesión

// Duración de la sesión en milisegundos (6 horas)
const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; 
let inactivityTimer;

// Función para verificar si el usuario está logueado
function isLoggedIn() {
    const expiration = sessionStorage.getItem('sessionExpiration');
    if (!expiration || Date.now() > parseInt(expiration)) {
        clearSession(); // Limpia si expiró
        return false;
    }
    // Reinicia el timer de inactividad si está logueado y activo
    resetInactivityTimer();
    return true;
}

// Función para obtener la información del usuario logueado
function getUserInfo() {
    if (!isLoggedIn()) return null;
    try {
        return JSON.parse(sessionStorage.getItem('userInfo'));
    } catch (e) {
        return null;
    }
}

// Función para guardar la sesión
function saveSession(userInfo) {
    const expirationTime = Date.now() + SESSION_TIMEOUT_MS;
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    sessionStorage.setItem('sessionExpiration', expirationTime.toString());
    resetInactivityTimer(); // Inicia el timer al guardar
}

// Función para limpiar la sesión
function clearSession() {
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('sessionExpiration');
    clearTimeout(inactivityTimer); // Detiene el timer
}

// Función para hacer logout
function logoutUser() {
    clearSession();
    // Redirige a login y evita que el botón "atrás" funcione
    window.location.replace('login.html'); 
}

// Función para redirigir si no está logueado
function checkAuth() {
    if (!isLoggedIn()) {
        // Usamos replace para que no quede en el historial
        window.location.replace('login.html'); 
    }
}

// --- Manejo del Timer de Inactividad ---

function resetInactivityTimer() {
    clearTimeout(inactivityTimer); // Limpia el timer anterior
    inactivityTimer = setTimeout(() => {
        // Se ejecuta si pasan 6 horas sin actividad
        alert("Tu sesión ha expirado por inactividad.");
        logoutUser();
    }, SESSION_TIMEOUT_MS);
}

// Reinicia el timer con cualquier interacción del usuario
function setupActivityListeners() {
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
}

// Llama a esta función en las páginas protegidas
// setupActivityListeners(); // Lo llamaremos desde index.html y simulador.html si está logueado


// Exportar funciones (si usaras módulos, pero aquí las hacemos globales)
// No es necesario exportar si se incluyen directamente en el HTML
