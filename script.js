let timer;
let timeLeft = 25 * 60; // 25 minutes par défaut
let isRunning = false;
let isPaused = false;
let isFinished = false;
let taskIdCounter = 0; // Compteur global pour générer des IDs uniques

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

// Ajouter la date actuelle à la session sauvegardée
function saveSession() {
    const sessionName = sessionNameInput.value.trim() || generateSessionName();
    const session = {
        name: sessionName,
        timeLeft,
        isRunning,
        isPaused,
        isFinished,
        date: new Date().toISOString(), // Ajouter la date actuelle
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
    const noTasksMessage = document.getElementById('no-tasks-message');
    const addTaskButton = document.getElementById('add-task');

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

        if (session.tasks && session.tasks.length > 0) {
            loadTasks(session.tasks); // Charger les tâches
            if (noTasksMessage) noTasksMessage.remove(); // Supprimer le message si des tâches existent
        } else {
            // Afficher le message "No tasks defined" si aucune tâche n'est présente
            if (!noTasksMessage) {
                const message = document.createElement('h5');
                message.id = 'no-tasks-message';
                message.textContent = 'No tasks defined';
                document.getElementById('tasks-list').appendChild(message);
            }
        }

        // Désactiver le bouton d'ajout de tâches si la session est en cours
        if (isRunning) {
            addTaskButton.classList.add('disabled');
            addTaskButton.setAttribute('disabled', 'true');
        } else {
            addTaskButton.classList.remove('disabled');
            addTaskButton.removeAttribute('disabled');
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
            if (noTasksMessage) noTasksMessage.remove(); // Supprimer le message si des tâches existent
        } else {
            // Afficher le message "No tasks defined" si aucune tâche n'est présente
            if (!noTasksMessage) {
                const message = document.createElement('h5');
                message.id = 'no-tasks-message';
                message.textContent = 'No tasks defined';
                message.style.marginTop = '30px';
                document.getElementById('tasks-list').appendChild(message);
            }
        }
    }
}

// Fonction pour charger les tâches incomplètes depuis le localStorage
function loadIncompleteTasks() {
    const incompleteTasks = JSON.parse(localStorage.getItem('incompleteTasks')) || [];
    const tasks = [];

    incompleteTasks.forEach(task => {
        tasks.push({ name: task, validated: false });
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

            // Vérifier s'il reste des tâches, sinon afficher le message "No tasks defined"
            const remainingTasks = document.querySelectorAll('.task-input');
            const noTasksMessage = document.getElementById('no-tasks-message');
            if (remainingTasks.length === 0 && !noTasksMessage) {
                const message = document.createElement('h5');
                message.id = 'no-tasks-message';
                message.textContent = 'No tasks defined';
                message.style.marginTop = '30px';
                tasksList.appendChild(message);
            }

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

    // ajouter une classe "timer-finished" au body
    document.body.classList.add('timer-finished');

    // Lancer le mini-jeu
    startTomatoGame();

    // Afficher un message ou notifier l'utilisateur
    notifyUser();
}

// Fonction pour démarrer le minuteur
function startTimer() {
    if (!isRunning) {
        // Vérifier si aucune tâche n'est définie
        const taskInputs = document.querySelectorAll('.task-input');
        const noTasksMessage = document.getElementById('no-tasks-message');

        if (taskInputs.length === 0) {
            if (!noTasksMessage) {
                const message = document.createElement('h5');
                message.id = 'no-tasks-message';
                message.textContent = 'No tasks defined';
                document.getElementById('tasks-list').appendChild(message);
            }
        } else if (noTasksMessage) {
            noTasksMessage.remove(); // Supprimer le message si des tâches existent
        }

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

// Fonction pour mettre en pause le minuteur
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

// Fonction pour réinitialiser le minuteur
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
    const sessionName = sessionNameInput.value.trim() || generateSessionName();

    document.body.classList.remove('timer-finished');

    const allTasks = saveTasks();
    const validatedTasks = allTasks.filter(t => t.validated);
    const notValidated = allTasks.filter(t => !t.validated);

    const completedSession = {
        name: sessionName,
        timeLeft: 0,
        isRunning: false,
        isPaused: false,
        isFinished: false,
        isCompleted: true,
        date: new Date().toISOString(), // Ajouter la date actuelle
        tasks: validatedTasks
    };
    saveCompletedSession(completedSession);

    if (notValidated.length) {
        const existing = JSON.parse(localStorage.getItem('incompleteTasks')) || [];
        notValidated.forEach(task => {
            existing.push(task.name);
        });
        localStorage.setItem('incompleteTasks', JSON.stringify(existing));
    }

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

    const incompleteTasks = loadIncompleteTasks();
    if (incompleteTasks.length > 0) {
        loadTasks(incompleteTasks);
    }

    // load completed tasks in the list
    loadCompletedTasks()
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

    // Ajouter un ID unique à la tâche
    const taskId = `task-${taskIdCounter++}`;
    taskInput.dataset.taskId = taskId;

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

        // Vérifier s'il reste des tâches, sinon afficher le message "No tasks defined"
        const remainingTasks = document.querySelectorAll('.task-input');
        const noTasksMessage = document.getElementById('no-tasks-message');
        if (remainingTasks.length === 0 && !noTasksMessage) {
            const message = document.createElement('h5');
            message.id = 'no-tasks-message';
            message.textContent = 'No tasks defined';
            message.style.marginTop = '30px';
            tasksList.appendChild(message);
        }

        saveSession();
    });

    taskItem.appendChild(taskInput);
    taskItem.appendChild(deleteButton);
    tasksList.appendChild(taskItem);

    // Supprimer le message "No tasks defined" si une tâche est ajoutée
    const noTasksMessage = document.getElementById('no-tasks-message');
    if (noTasksMessage) {
        noTasksMessage.remove();
    }

    saveSession();
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

// Mini-jeu des tomates
function startTomatoGame() {
    const body = document.body;

    // Ajouter le curseur personnalisé
    const crosshair = document.createElement('img');
    crosshair.src = '/assets/Crosshair.svg';
    crosshair.alt = 'Crosshair';
    crosshair.style.position = 'absolute';
    crosshair.style.width = '30px';
    crosshair.style.height = '30px';
    crosshair.style.pointerEvents = 'none';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.zIndex = '1000';
    body.appendChild(crosshair);

    // Suivre la position de la souris
    document.addEventListener('mousemove', (event) => {
        crosshair.style.left = `${event.pageX}px`;
        crosshair.style.top = `${event.pageY}px`;
    });

    let lastRandomIndex = -1; // Stocker le dernier index aléatoire

    function spawnTomato() {
        const tomato = document.createElement('img');
        tomato.src = '/tomatoes-title/tomato-clear.png';
        tomato.alt = 'Tomato';
        tomato.style.position = 'absolute';
        tomato.style.width = '80px';
        tomato.style.height = '80px';
        tomato.style.left = '50%';
        tomato.style.bottom = '-100px'; // Commencer en dehors de l'écran
        tomato.style.transform = 'translate(-50%, 0)';
        tomato.style.zIndex = '999';
        tomato.style.userSelect = 'none'; // Empêcher le glisser-déposer
        tomato.style.pointerEvents = 'none'; // Empêcher les interactions avec la tomate
        document.body.appendChild(tomato);

        // random rotation
        const randomRotation = Math.floor(Math.random() * 360);

        // Animation de bounce depuis le bas
        tomato.animate([
            { bottom: '-100px', transform: `translate(-50%, 0) scale(0.8) rotate(${randomRotation}deg)`, opacity: 0 },
            { bottom: '20px', transform: `translate(-50%, 0) scale(1.2) rotate(${randomRotation}deg)`, opacity: 1 },
            { bottom: '0', transform: `translate(-50%, 0) scale(1.2) rotate(${randomRotation}deg)` }
        ], {
            duration: 800,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Gérer le clic pour lancer la tomate
        document.addEventListener('click', (event) => {

            if (event.target.classList.contains('task-input')) {
                const taskId = event.target.dataset.taskId;
                tomato.dataset.taskId = taskId; // Associer la tomate à la tâche
            }

            if (event.target.getAttribute('id') === 'complete') {
                // Ne pas lancer la tomate si on clique sur le bouton "Complete"
                removeAllTomatoes();
                tomato.remove();
                crosshair.remove();
                return;
            }

            // animation de click du crosshair
            crosshair.animate([
                { transform: 'translate(-50%, -50%) scale(1)' },
                { transform: 'translate(-50%, -50%) scale(0.7)' },
                { transform: 'translate(-50%, -50%) scale(1)' }
            ], {
                duration: 200,
                easing: 'ease-out',
                fill: 'forwards'
            });


            setTimeout(() => {
                spawnTomato(); // Générer une nouvelle tomate
            }, 200);

            const targetX = event.pageX;
            let targetY = event.pageY + 40;

            targetY = window.innerHeight - targetY;

            const distance = Math.hypot(targetX - window.innerWidth / 2, targetY);
            const duration = Math.min(400, Math.max(300, distance * 1.5)); // Réduire la durée pour une animation plus rapide

            // Animation de la tomate sans easing
            const animation = tomato.animate([
                { bottom: '0', left: '50%' },
                { bottom: `${targetY}px`, left: `${targetX}px` }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.11, 0, 0.5, 0)', // Pas de easing
                fill: 'forwards'
            });

            animation.onfinish = () => {
                tomato.style.bottom = `${targetY}px`;
                tomato.style.left = `${targetX}px`;
                tomato.style.transform = 'translate(-50%, 0) scale(1.3)';

                // Générer un index aléatoire différent du précédent
                let randomIndex;
                do {
                    randomIndex = Math.floor(Math.random() * 4) + 1;
                } while (randomIndex === lastRandomIndex);
                lastRandomIndex = randomIndex;

                tomato.src = `/tomatoes-title/tomato-${randomIndex}.png`;
            };
        }, { once: true });

        
    }

    spawnTomato();
}

function removeTomatoesByTaskId(taskId) {
    const tomatoes = document.querySelectorAll(`img[data-task-id="${taskId}"]`);
    tomatoes.forEach(tomato => tomato.remove());
}

// Modifier la logique de dévalidation des tâches
function makeTasksValidatable() {
    const taskInputs = document.querySelectorAll('.task-input');
    const deleteButtons = document.querySelectorAll('.delete-task');
    const addTaskBtn = document.getElementById('add-task');

    if (addTaskBtn) addTaskBtn.classList.add('disabled');
    deleteButtons.forEach(btn => btn.classList.add('disabled'));

    taskInputs.forEach(input => {
        input.removeAttribute('disabled');
        //readonly pour éviter modification
        input.setAttribute('readonly', 'true');
        input.classList.add('clickable');

        if (input.__validListenerAttached) return;

        input.addEventListener('click', function () {
            if (this.dataset.validated !== 'true') {
                this.dataset.validated = 'true';
                this.classList.add('validated');

                const removeValidationButton = document.createElement('button');
                removeValidationButton.classList.add('remove-validation');
                // Ajouter une image au bouton retirer la validation
                const removeIcon = document.createElement('img');
                removeIcon.src = '/assets/back.svg';
                removeIcon.alt = 'Retirer la validation';
                removeIcon.style.width = '16px';
                removeIcon.style.height = '16px';
                removeValidationButton.appendChild(removeIcon);

                removeValidationButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.dataset.validated = 'false';
                    this.classList.remove('validated');
                    removeValidationButton.remove();

                    // Supprimer les tomates associées à cette tâche
                    const taskId = this.dataset.taskId;
                    removeTomatoesByTaskId(taskId);

                    saveSession();
                });
                this.parentElement.appendChild(removeValidationButton);

                saveSession();
            }
        });

        input.__validListenerAttached = true;
    });
}

function removeAllTomatoes() {
    // toutes img[src*="tomato"]sauf tomates dans le h1
    const tomatoes = Array.from(document.querySelectorAll('img[src*="tomato"]')).filter(img => !img.closest('h1'));
    tomatoes.forEach((tomato, index) => {
        const delay = Math.random() * 500; // Délai aléatoire entre 0 et 0.5s
        setTimeout(() => {
            const animation = tomato.animate([
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(50px)' }
            ], {
                duration: 500,
                easing: 'ease-out',
                fill: 'forwards'
            });

            animation.onfinish = () => {
                tomato.remove();
            };
        }, delay);
    });
}

// Fonction pour charger les tâches complétées depuis le localStorage
function loadCompletedTasks() {
    const completedTasks = JSON.parse(localStorage.getItem('completedSessions')) || [];
    const completedTasksList = document.getElementById('completed-tasks-list');
    completedTasksList.innerHTML = '';

    const today = new Date();
    const formatDate = (date) => {
        const options = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('fr-FR', options);
    };

    const groupByDate = completedTasks.reduce((acc, task) => {
        const taskDate = new Date(task.date);
        const diffDays = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24));
        let label;

        if (diffDays === 0) label = "Aujourd'hui";
        else if (diffDays === 1) label = "Hier";
        else if (diffDays === 2) label = "Avant-hier";
        else label = formatDate(taskDate);

        if (!acc[label]) acc[label] = [];
        acc[label].push(task);
        return acc;
    }, {});

    Object.keys(groupByDate).forEach((dateLabel) => {
        const dateHeader = document.createElement('li');
        dateHeader.classList.add('date-header');
        dateHeader.textContent = dateLabel;
        completedTasksList.appendChild(dateHeader);

        groupByDate[dateLabel].forEach((task) => {
            if (!task.tasks.length === 0) return;
            task.tasks.forEach(t => {
                const taskItem = document.createElement('li');
                taskItem.textContent = t.name;
                taskItem.classList.add('task-item');

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-completed-task');
                deleteButton.innerHTML = `<img src="assets/delete.svg" alt="Supprimer">`;
                deleteButton.addEventListener('click', () => deleteCompletedTask(t));

                taskItem.appendChild(deleteButton);
                completedTasksList.appendChild(taskItem);
            });
        });
    });
}

// Fonction pour supprimer une tâche complétée
function deleteCompletedTask(taskToDelete) {
    let completedTasks = JSON.parse(localStorage.getItem('completedSessions')) || [];

    completedTasks = completedTasks.map(session => {
        return {
            ...session,
            tasks: session.tasks.filter(task => task.name !== taskToDelete.name)
        };
    }).filter(session => session.tasks.length > 0); // Supprimer les sessions sans tâches restantes

    localStorage.setItem('completedSessions', JSON.stringify(completedTasks));
    loadCompletedTasks();
}

// Charger les tâches complétées au rechargement de la page
window.addEventListener('load', loadCompletedTasks);