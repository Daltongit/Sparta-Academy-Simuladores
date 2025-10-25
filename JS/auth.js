// JS/auth.js - Lógica compartida de autenticación y sesión

const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000;
let inactivityTimer;

function isLoggedIn() {
    const expiration = sessionStorage.getItem('sessionExpiration');
    if (!expiration || Date.now() > parseInt(expiration)) {
        clearSession();
        return false;
    }
    resetInactivityTimer();
    return true;
}

function getUserInfo() {
    if (!isLoggedIn()) return null;
    try {
        return JSON.parse(sessionStorage.getItem('userInfo'));
    } catch (e) {
        return null;
    }
}

function saveSession(userInfo) {
    const expirationTime = Date.now() + SESSION_TIMEOUT_MS;
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    sessionStorage.setItem('sessionExpiration', expirationTime.toString());
    resetInactivityTimer();
}

function clearSession() {
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('sessionExpiration');
    clearTimeout(inactivityTimer);
}

function logoutUser() {
    clearSession();
    // Reemplaza el historial para que el botón "Atrás" no funcione
    window.location.replace('login.html');
}

function checkAuth() {
    if (!isLoggedIn()) {
        // Reemplaza el historial para que el botón "Atrás" no funcione
        window.location.replace('login.html');
    }
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("Tu sesión ha expirado por inactividad.");
        logoutUser();
    }, SESSION_TIMEOUT_MS);
}

function setupActivityListeners() {
    // Reinicia el timer con cualquier interacción
    ['mousemove', 'keypress', 'click', 'scroll'].forEach(event => {
        window.addEventListener(event, resetInactivityTimer);
    });
}

// (NUEVA) Función para configurar el dropdown de usuario
function setupUserInfoDropdown() {
    const userInfo = getUserInfo();
    const userNameDisplay = document.getElementById('user-name-display');
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    const logoutButton = document.getElementById('logout-button');

    if (userInfo && userInfo.nombre && userNameDisplay) {
        userNameDisplay.textContent = `Aspirante: ${userInfo.nombre}`;
        setupActivityListeners(); // Inicia el timer de inactividad aquí

        if (dropdownBtn && dropdownContent) {
            dropdownBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Evita que el clic se propague al window
                dropdownContent.classList.toggle('show');
            });

            // Cierra el dropdown si se hace clic fuera de él
            window.addEventListener('click', (event) => {
                if (!dropdownBtn.contains(event.target) && dropdownContent.classList.contains('show')) {
                     dropdownContent.classList.remove('show');
                }
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }

    } else {
        // Si no hay info, redirige (aunque checkAuth ya debería haberlo hecho)
        logoutUser();
    }
}
