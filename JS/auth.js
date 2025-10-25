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
    window.location.replace('login.html');
}

function checkAuth() {
    if (!isLoggedIn()) {
        window.location.replace('login.html');
    }
}

// --- Manejo del Timer de Inactividad ---
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("Tu sesión ha expirado por inactividad.");
        logoutUser();
    }, SESSION_TIMEOUT_MS);
}

function setupActivityListeners() {
    ['mousemove', 'keypress', 'click', 'scroll'].forEach(event => {
        window.addEventListener(event, resetInactivityTimer, { passive: true }); // Use passive listener
    });
}

// --- Configuración Menú Escritorio ---
function setupUserInfoDropdown() {
    const userInfo = getUserInfo();
    // Usa el ID específico de escritorio
    const userNameDisplayDesktop = document.getElementById('user-name-display-desktop'); 
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    // Usa el ID específico de escritorio
    const logoutButtonDesktop = document.getElementById('logout-button-desktop'); 

    if (userInfo && userInfo.nombre && userNameDisplayDesktop) {
        userNameDisplayDesktop.textContent = `Aspirante: ${userInfo.nombre}`;
        setupActivityListeners(); // Inicia el timer de inactividad aquí

        if (dropdownBtn && dropdownContent) {
            dropdownBtn.addEventListener('click', (event) => {
                event.stopPropagation(); 
                dropdownContent.classList.toggle('show');
            });

            window.addEventListener('click', (event) => {
                if (!dropdownBtn.contains(event.target) && !dropdownContent.contains(event.target) && dropdownContent.classList.contains('show')) {
                     dropdownContent.classList.remove('show');
                }
            });
        }

        if (logoutButtonDesktop) {
            logoutButtonDesktop.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
        }

    } else if (!userInfo || !userInfo.nombre) { 
        // Solo redirige si falta la info del usuario, no si el elemento no existe (móvil)
        logoutUser();
    }
}

// --- (NUEVA) Configuración Menú Móvil ---
function setupMobileMenu() {
    const userInfo = getUserInfo();
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideNav = document.getElementById('side-nav');
    const closeNavBtn = document.getElementById('close-nav-btn');
    const overlay = document.getElementById('overlay');
    // Usa el ID específico de móvil
    const userNameDisplayMobile = document.getElementById('user-name-display-mobile');
    // Usa el ID específico de móvil
    const logoutButtonMobile = document.getElementById('logout-button-mobile');

    // Solo configura si los elementos existen (para que no falle en escritorio si no están)
    if (hamburgerBtn && sideNav && closeNavBtn && overlay && userNameDisplayMobile && logoutButtonMobile) {
        
        // Poner el nombre en el menú lateral
         if (userInfo && userInfo.nombre) {
            userNameDisplayMobile.textContent = userInfo.nombre;
         }

        // Abrir menú
        hamburgerBtn.addEventListener('click', () => {
            sideNav.classList.add('open');
            overlay.classList.add('show');
        });

        // Cerrar menú con botón X
        closeNavBtn.addEventListener('click', () => {
            sideNav.classList.remove('open');
            overlay.classList.remove('show');
        });

        // Cerrar menú haciendo clic en el overlay
        overlay.addEventListener('click', () => {
            sideNav.classList.remove('open');
            overlay.classList.remove('show');
        });

        // Botón de logout en menú lateral
        logoutButtonMobile.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
}

// --- (NUEVO) Script anti-back en login.html ---
// Añade esto al final de login.html si quieres intentar bloquear el "atrás"
/*
<script>
    // Intenta prevenir volver atrás desde la página de login
    window.onload = function() {
        if (window.history && window.history.pushState) {
            // Reemplaza la entrada actual para que "atrás" no vuelva aquí
             window.history.replaceState('forward', null, './login.html'); 
            // Añade una entrada falsa para capturar el evento "popstate" (atrás/adelante)
             window.history.pushState('forward', null, './login.html'); 

            window.addEventListener('popstate', function(event) {
                // Si el usuario intenta ir atrás, lo volvemos a empujar a login
                // Esto puede ser molesto si viene de otro sitio
                 window.history.pushState('forward', null, './login.html');
                 // console.log("Intento de navegación bloqueado"); 
            });
        }
    }
</script>
*/
// --- Fin Script anti-back ---
