let timer;
let timeLeft = 25 * 60; // 25 minutes par défaut
let isRunning = false;
let isPaused = false;

const timerInput = document.getElementById('timer-input');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');

// Fonction pour formater le temps en MM:SS
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fonction pour parser le temps depuis l'input (format MM:SS)
function parseTimeFromInput() {
    const value = timerInput.value.replace(/[^\d:]/g, ''); // Ne garder que les chiffres et ':'
    const parts = value.split(':');
    
    if (parts.length === 2) {
        const minutes = Math.max(0, Math.min(59, parseInt(parts[0]) || 0));
        const seconds = Math.max(0, Math.min(59, parseInt(parts[1]) || 0));
        return minutes * 60 + seconds;
    } else if (parts.length === 1 && parts[0]) {
        // Si on tape juste des chiffres, considérer comme des minutes
        const minutes = Math.max(0, Math.min(99, parseInt(parts[0]) || 0));
        return minutes * 60;
    }
    
    return 25 * 60; // Valeur par défaut
}

// Fonction pour formater automatiquement la saisie
function formatInput(event) {
    let value = event.target.value.replace(/[^\d]/g, ''); // Ne garder que les chiffres
    
    if (value.length >= 3) {
        // Insérer automatiquement les ':'
        const minutes = value.substring(0, value.length - 2);
        const seconds = value.substring(value.length - 2);
        value = `${minutes}:${seconds}`;
    }
    
    event.target.value = value;
}

function updateDisplay() {
    // Ne mettre à jour que si l'input n'est pas en focus (pour éviter d'interrompre la saisie)
    if (document.activeElement !== timerInput) {
        timerInput.value = formatTime(timeLeft);
    }
}

// Fonction pour mettre à jour la visibilité et les styles des boutons
function updateButtonVisibility() {
    if (isRunning) {
        startButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        resetButton.style.display = 'none';
        pauseButton.classList.add('primary');
        resetButton.classList.remove('secondary');
    } else {
        pauseButton.style.display = 'none';
        if (timeLeft === 25 * 60) { // Temps par défaut
            startButton.style.display = 'inline-block';
            resetButton.style.display = 'none';
            startButton.textContent = 'Start'; // Revenir à "Start" si reset ou temps par défaut
            startButton.classList.add('primary');
            resetButton.classList.remove('secondary');
        } else {
            startButton.style.display = 'inline-block';
            resetButton.style.display = 'inline-block';
            startButton.textContent = isPaused ? 'Resume' : 'Start'; // Afficher "Resume" si en pause
            startButton.classList.add('primary');
            resetButton.classList.add('secondary');
        }
    }
}

function updateInputState() {
    if (isRunning || isPaused) {
        timerInput.setAttribute('disabled', 'true');
        timerInput.classList.add('no-hover');
    } else {
        timerInput.removeAttribute('disabled');
        timerInput.classList.remove('no-hover');
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        isPaused = false;
        updateButtonVisibility();
        updateInputState();
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timer);
                isRunning = false;
                isPaused = false;
                updateButtonVisibility();
                updateInputState();
                notifyUser();
            }
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = true;
    startButton.textContent = 'Resume'; // Mettre à jour le texte en "Resume" lors de la pause
    updateButtonVisibility();
    updateInputState();
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    timeLeft = 25 * 60; // Remettre au temps par défaut
    startButton.textContent = 'Start'; // Revenir à "Start" après un reset
    updateDisplay();
    updateButtonVisibility();
    updateInputState();
}


function notifyUser() {
    if (Notification.permission === 'granted') {
        new Notification('Pomodoro terminé !', {
            body: 'Prenez une pause bien méritée.',
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Pomodoro terminé !', {
                    body: 'Prenez une pause bien méritée.',
                });
            }
        });
    }
}

// Gestion des événements
startButton.addEventListener('click', () => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Si le timer n'est pas en cours, mettre à jour avec la valeur saisie
    if (!isRunning) {
        timeLeft = parseTimeFromInput();
    }
    startTimer();
});

pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

// Gestion de la saisie dans l'input
timerInput.addEventListener('input', (event) => {
    formatInput(event);
    if (!isRunning) {
        timeLeft = parseTimeFromInput();
        updateDisplay();
        updateButtonVisibility();
    }
});

// Mettre à jour le timer quand on quitte l'input (blur)
timerInput.addEventListener('blur', () => {
    if (!isRunning) {
        timeLeft = parseTimeFromInput();
        updateDisplay();
    }
});

// Permettre l'entrée avec Enter
timerInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        timerInput.blur();
        if (!isRunning) {
            timeLeft = parseTimeFromInput();
            startTimer();
        }
    }
});

// Empêcher les caractères non numériques (sauf backspace, delete, arrows, etc.)
timerInput.addEventListener('keydown', (event) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const isNumber = event.key >= '0' && event.key <= '9';
    
    if (!isNumber && !allowedKeys.includes(event.key)) {
        event.preventDefault();
    }
});

// Initialiser l'affichage et les boutons
updateDisplay();
updateButtonVisibility();
updateInputState();