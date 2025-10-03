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
completeButton.classList.add('primary');
document.querySelector('.controls').appendChild(completeButton);

// Ajouter un champ d'entrée pour le nom de la session dans le DOM
const sessionNameInput = document.createElement('input');
sessionNameInput.id = 'session-name';
sessionNameInput.type = 'text';
sessionNameInput.placeholder = 'Nom de la session';
sessionNameInput.classList.add('session-name-input');
document.querySelector('.pomodoro-container').insertBefore(sessionNameInput, document.querySelector('.timer-display'));

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
        sessionNameInput.setAttribute('disabled', 'true');
    } else {
        timerInput.removeAttribute('disabled');
        timerInput.classList.remove('no-hover');
        sessionNameInput.removeAttribute('disabled');
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
    const sessionName = sessionNameInput.value.trim() || generateSessionName();
    const session = {
        name: sessionName,
        timeLeft,
        isRunning,
        isPaused,
        isFinished,
        tasks: saveTasks(),
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

        sessionNameInput.value = session.name || ''; // Charger le nom de la session

        if (session.tasks) {
            loadTasks(session.tasks); // Charger les tâches
        }

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

        // Charger les tâches incomplètes par défaut
        const incompleteTasks = loadIncompleteTasks();
        if (incompleteTasks.length > 0) {
            loadTasks(incompleteTasks);
        }
    }
}

// Fonction pour charger les tâches incomplètes depuis le localStorage
function loadIncompleteTasks() {
    const incompleteTasks = JSON.parse(localStorage.getItem('incompleteTasks')) || [];
    const tasks = [];

    incompleteTasks.forEach(session => {
        session.tasks.forEach(task => {
            tasks.push({ name: task.name, validated: false });
        });
    });

    return tasks;
}

// Helper pour activer/désactiver les contrôles de tâches
function setTasksDisabled(disabled) {
    const taskInputs = document.querySelectorAll('.task-input');
    const deleteButtons = document.querySelectorAll('.delete-task');
    const addTaskBtn = document.getElementById('add-task');

    taskInputs.forEach(input => {
        if (disabled) input.setAttribute('disabled', 'true');
        else input.removeAttribute('disabled');
    });

    deleteButtons.forEach(btn => {
        if (disabled) btn.classList.add('disabled');
        else btn.classList.remove('disabled');
    });

    if (disabled) addTaskBtn.classList.add('disabled');
    else addTaskBtn.classList.remove('disabled');
}

// Correction de la fonction saveTasks pour s'assurer que les données sont bien sauvegardées
function saveTasks() {
    const tasks = [];
    const taskInputs = document.querySelectorAll('.task-input');
    taskInputs.forEach(input => {
        tasks.push({ 
            name: input.value.trim(), // Supprimer les espaces inutiles
            validated: input.dataset && input.dataset.validated === 'true' // Vérifier la présence de l'attribut
        });
    });
    return tasks;
}

// Correction de la fonction loadTasks pour s'assurer que les données sont bien restaurées
function loadTasks(tasks) {
    tasksList.innerHTML = ''; // Réinitialiser la liste des tâches
    tasks.forEach(task => {
        const taskItem = document.createElement('li');

        const taskInput = document.createElement('input');
        taskInput.type = 'text';
        taskInput.value = task.name;
        taskInput.classList.add('task-input');
        
        // Restaurer l'état validated si présent
        if (task.validated) {
            taskInput.dataset.validated = 'true';
            taskInput.classList.add('validated');
        } else {
            taskInput.dataset.validated = 'false';
        }

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-task');

        // Ajouter une image au bouton supprimer
        const deleteIcon = document.createElement('img');
        deleteIcon.src = '/assets/delete.svg';
        deleteIcon.alt = 'Supprimer';
        deleteIcon.style.width = '16px';
        deleteIcon.style.height = '16px';
        deleteButton.appendChild(deleteIcon);

        deleteButton.addEventListener('click', () => {
            tasksList.removeChild(taskItem);
            saveSession();
        });

        taskItem.appendChild(taskInput);
        taskItem.appendChild(deleteButton);
        tasksList.appendChild(taskItem);
    });

    // Si la session est en cours, en pause ou finie, désactiver les tâches
    if (isRunning || isPaused || isFinished) {
        setTasksDisabled(true);
    } else {
        setTasksDisabled(false);
    }
}

// rendre les tâches cliquables après la fin du timer pour marquer validated
function makeTasksValidatable() {
    const taskInputs = document.querySelectorAll('.task-input');
    const deleteButtons = document.querySelectorAll('.delete-task');
    const addTaskBtn = document.getElementById('add-task');

    // masquer ajout et suppression pendant validation
    if (addTaskBtn) addTaskBtn.classList.add('disabled');
    deleteButtons.forEach(btn => btn.classList.add('disabled'));

    taskInputs.forEach(input => {
        // s'assurer activé pour pouvoir cliquer
        input.removeAttribute('disabled');
        input.classList.add('clickable');
        input.style.cursor = 'pointer';

        // éviter d'attacher plusieurs fois
        if (input.__validListenerAttached) return;

        input.addEventListener('click', function () {
            if (this.dataset.validated !== 'true') {
                this.dataset.validated = 'true';
                this.classList.add('validated');

                // Ajouter le bouton "X" pour retirer la validation
                const removeValidationButton = document.createElement('button');
                removeValidationButton.textContent = 'X';
                removeValidationButton.classList.add('remove-validation');
                removeValidationButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Empêcher le clic de valider à nouveau
                    this.dataset.validated = 'false';
                    this.classList.remove('validated');
                    removeValidationButton.remove();
                    saveSession();
                });
                this.parentElement.appendChild(removeValidationButton);

                saveSession();
            }
        });

        input.__validListenerAttached = true;
    });
}

function handleSessionEnd() {
    // Marquer la session comme finie et sauvegarder l'état (incluant tasks)
    isFinished = true;
    isRunning = false;
    isPaused = false;
    saveSession();

    // Cacher tous les boutons
    startButton.style.display = 'none';
    pauseButton.style.display = 'none';
    resetButton.style.display = 'none';

    // Rendre les tâches cliquables pour validation
    makeTasksValidatable();

    // Afficher un message ou notifier l'utilisateur
    notifyUser();
}

function startTimer() {
    if (!isRunning) {
        // Supprimer les tâches incomplètes du localStorage
        localStorage.removeItem('incompleteTasks');

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
    sessionNameInput.value = ''; // Effacer le nom de la session

    // Supprimer les tâches de l'UI et réactiver les contrôles
    if (typeof tasksList !== 'undefined' && tasksList) {
        tasksList.innerHTML = '';
    }
    // Réactiver le bouton d'ajout et les boutons supprimer
    if (typeof setTasksDisabled === 'function') {
        setTasksDisabled(false);
    }

    updateDisplay();
    updateButtonVisibility();
    updateInputState();
}

// Modification de handleSessionComplete pour charger les tâches incomplètes après avoir complété une session
function handleSessionComplete() {
    // Vérifier si le champ de nom de session est vide, sinon générer un nom par défaut
    const sessionName = sessionNameInput.value.trim() || generateSessionName();

    // Récupérer les tâches (avec validated)
    const allTasks = saveTasks();
    const validatedTasks = allTasks.filter(t => t.validated);
    const notValidated = allTasks.filter(t => !t.validated);

    // Créer la session complétée avec les tâches validées
    const completedSession = {
        name: sessionName,
        timeLeft: 0,
        isRunning: false,
        isPaused: false,
        isFinished: false,
        isCompleted: true,
        tasks: validatedTasks
    };
    saveCompletedSession(completedSession);

    // Sauvegarder les tâches non validées séparément
    if (notValidated.length) {
        const existing = JSON.parse(localStorage.getItem('incompleteTasks')) || [];
        existing.push({ sessionName, date: new Date().toISOString(), tasks: notValidated });
        localStorage.setItem('incompleteTasks', JSON.stringify(existing));
    }

    // Nettoyage localStorage et UI
    localStorage.removeItem('pomodoroSession');
    timeLeft = 25 * 60;
    isRunning = false;
    isPaused = false;
    isFinished = false;
    sessionNameInput.value = '';
    if (typeof tasksList !== 'undefined' && tasksList) tasksList.innerHTML = '';
    if (typeof setTasksDisabled === 'function') setTasksDisabled(false);
    updateDisplay();
    updateButtonVisibility();
    updateInputState();

    // Charger les tâches incomplètes immédiatement
    const incompleteTasks = loadIncompleteTasks();
    if (incompleteTasks.length > 0) {
        loadTasks(incompleteTasks);
    }
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

    // Si le champ de nom de session est vide, y mettre le nom par défaut
    if (!sessionNameInput.value.trim()) {
        sessionNameInput.value = generateSessionName();
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

// Ajouter un gestionnaire d'événement pour le bouton "Ajouter une tâche"
const addTaskButton = document.getElementById('add-task');
const tasksList = document.getElementById('tasks-list');

addTaskButton.addEventListener('click', () => {
    const taskItem = document.createElement('li');

    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.placeholder = 'Nom de la tâche';
    taskInput.classList.add('task-input');

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-task');

    // Ajouter une image au bouton supprimer
    const deleteIcon = document.createElement('img');
    deleteIcon.src = '/assets/delete.svg';
    deleteIcon.alt = 'Supprimer';
    deleteIcon.style.width = '16px';
    deleteIcon.style.height = '16px';
    deleteButton.appendChild(deleteIcon);

    deleteButton.addEventListener('click', () => {
        tasksList.removeChild(taskItem);
    });

    taskItem.appendChild(taskInput);
    taskItem.appendChild(deleteButton);
    tasksList.appendChild(taskItem);
});

// Désactiver les champs de tâches au démarrage
function disableTasks() {
    const taskInputs = document.querySelectorAll('.task-input');
    taskInputs.forEach(input => input.setAttribute('disabled', 'true'));

    const addTaskButton = document.getElementById('add-task');
    addTaskButton.classList.add('disabled'); // Ajouter une classe "disabled" au bouton "Ajouter une tâche"

    // Ajouter une classe "disabled" aux boutons "Supprimer"
    const deleteButtons = document.querySelectorAll('.delete-task');
    deleteButtons.forEach(button => button.classList.add('disabled'));
}

// Modifier le bouton "Start" pour désactiver les tâches
startButton.addEventListener('click', () => {
    disableTasks();
    const tasks = saveTasks();
    const session = JSON.parse(localStorage.getItem('pomodoroSession')) || {};
    session.tasks = tasks;
    localStorage.setItem('pomodoroSession', JSON.stringify(session));
});