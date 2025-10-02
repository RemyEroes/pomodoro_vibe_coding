let timer;
let timeLeft = 10; // 10 seconds for testing
let isRunning = false;

const timerDisplay = document.querySelector('.timer-display');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timer);
                isRunning = false;
                notifyUser();
            }
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = 10; // Reset to 10 seconds for testing
    updateDisplay();
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

startButton.addEventListener('click', () => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    startTimer();
});
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);

updateDisplay();