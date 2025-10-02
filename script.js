let timer;
let timeLeft = 25 * 60; // 25 minutes par défaut
let isRunning = false;
let isPaused = false;
let isFinished = false;

const timerInput = document.getElementById('timer-input');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');

// Ajouter un bouton "Complete" dans le DOM
const completeButton = document.createElement('button');
completeButton.id = 'complete';
completeButton.textContent = 'Complete';
completeButton.style.display = 'none';
completeButton.classList.add('secondary');
document.querySelector('.controls').appendChild(completeButton);

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
        completeButton.style.display = 'none';
        pauseButton.classList.add('primary');
        resetButton.classList.remove('secondary');
    } else {
        pauseButton.style.display = 'none';
        if (timeLeft === 25 * 60) { // Temps par défaut
            startButton.style.display = 'inline-block';
            resetButton.style.display = 'none';
            completeButton.style.display = 'none';
            startButton.textContent = 'Start'; // Revenir à "Start" si reset ou temps par défaut
            startButton.classList.add('primary');
            resetButton.classList.remove('secondary');
        } else if (isFinished) {
            startButton.style.display = 'none';
            resetButton.style.display = 'none';
            completeButton.style.display = 'inline-block';
        } else {
            startButton.style.display = 'inline-block';
            resetButton.style.display = 'inline-block';
            completeButton.style.display = 'none';
            startButton.textContent = isPaused ? 'Resume' : 'Start'; // Afficher "Resume" si en pause
            startButton.classList.add('primary');
            resetButton.classList.add('secondary');
        }
    }
}

function updateInputState() {
    if (isRunning || isPaused || isFinished) {
        timerInput.setAttribute('disabled', 'true');
        timerInput.classList.add('no-hover');
    } else {
        timerInput.removeAttribute('disabled');
        timerInput.classList.remove('no-hover');
    }
}

// Fonction pour générer un nom de session basé sur la date et l'heure actuelles
function generateSessionName() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return now.toLocaleString('fr-FR', options).replace(',', ' |');
}

// Fonction pour sauvegarder l'état de la session dans le localStorage
function saveSession() {
    const session = {
        name: generateSessionName(),
        timeLeft,
        isRunning,
        isPaused
    };
    localStorage.setItem('pomodoroSession', JSON.stringify(session));
}

// Fonction pour sauvegarder une session complétée dans un tableau
function saveCompletedSession(session) {
    const completedSessions = JSON.parse(localStorage.getItem('completedSessions')) || [];
    completedSessions.push(session);
    localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
}

// Fonction pour charger une session depuis le localStorage
function loadSession() {
    const sessionData = localStorage.getItem('pomodoroSession');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.isCompleted) {
            resetTimer(); // Charger comme s'il n'y avait pas de session en cours
            return;
        }

        timeLeft = session.timeLeft;
        isRunning = session.isRunning;
        isPaused = session.isPaused;
        isFinished = timeLeft === 0; // Définir isFinished à true si le temps est écoulé

        updateDisplay();
        updateButtonVisibility();
        updateInputState();

        if (isRunning) {
            // Reprendre le timer immédiatement si la session est en cours
            timer = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                    saveSession();
                } else {
                    clearInterval(timer);
                    isRunning = false;
                    isPaused = false;
                    isFinished = true;
                    saveSession();
                    handleSessionEnd();
                }
            }, 1000);
        } else if (isFinished) {
            handleSessionEnd(); // Gérer la fin de session si le temps est déjà écoulé
        }
    } else {
        resetTimer();
    }
}

function handleSessionEnd() {
    // Mettre à jour le localStorage pour indiquer que la session est terminée
    const session = {
        name: generateSessionName(),
        timeLeft: 0,
        isRunning: false,
        isPaused: false
    };
    localStorage.setItem('pomodoroSession', JSON.stringify(session));

    // Cacher tous les boutons
    startButton.style.display = 'none';
    pauseButton.style.display = 'none';
    resetButton.style.display = 'none';

    // Afficher un message ou notifier l'utilisateur
    notifyUser();
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        isPaused = false;
        isFinished = false;
        saveSession(); // Sauvegarder l'état
        updateButtonVisibility();
        updateInputState();
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
                saveSession(); // Sauvegarder l'état à chaque seconde
            } else {
                clearInterval(timer);
                isRunning = false;
                isPaused = false;
                isFinished = true;
                saveSession(); // Sauvegarder l'état final
                updateButtonVisibility();
                updateInputState();
                handleSessionEnd();
            }
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = true;
    isFinished = false;
    saveSession(); // Sauvegarder l'état
    startButton.textContent = 'Resume'; // Mettre à jour le texte en "Resume" lors de la pause
    updateButtonVisibility();
    updateInputState();
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    isFinished = false;
    timeLeft = 25 * 60; // Remettre au temps par défaut
    localStorage.removeItem('pomodoroSession'); // Supprimer la session
    startButton.textContent = 'Start'; // Revenir à "Start" après un reset
    updateDisplay();
    updateButtonVisibility();
    updateInputState();
}

function handleSessionComplete() {
    // Marquer la session comme complétée dans le localStorage
    const session = {
        name: generateSessionName(),
        timeLeft: 0,
        isRunning: false,
        isPaused: false,
        isFinished: false,
        isCompleted: true
    };
    saveCompletedSession(session); // Ajouter la session au tableau des sessions complétées

    // Réinitialiser l'affichage comme s'il n'y avait pas de session en cours
    timeLeft = 25 * 60;
    isRunning = false;
    isPaused = false;
    isFinished = false;
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

// Charger la session au rechargement de la page
window.addEventListener('load', loadSession);

// Ajouter un gestionnaire d'événement pour le bouton "Complete"
completeButton.addEventListener('click', handleSessionComplete);