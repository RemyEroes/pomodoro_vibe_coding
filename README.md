<h1 align="center" id="title">🍅Pomodoro🍅</h1>

<p id="description">A playful animated Pomodoro timer web app with a short break mode and a mini tomato-throwing game when a work session completes. Built with plain HTML CSS and vanilla JavaScript.</p>

<h2>🚀 Demo</h2>

[https://pomodoro.remy-eroes.site](https://pomodoro.remy-eroes.site)

<h2>📸 Project Screenshots:</h2>

<img src="https://pomodoro.remy-eroes.site/images/pomodoro-screen.png" alt="project-screenshot" width="100%" height="100%">

  
  
<h2>✨ Features</h2>

Here're some of the project's best features:

<ul>
    <li>💼☕️ Work & Break modes</li>
    <ul>
        <li>Default work length: 25 minutes (customizable)</li>
        <li>Default break length: 5 minutes (customizable)</li>
        <li>Toggle between modes with a floating mode switch</li>
        <li>When a work session completes the app can automatically activate break mode</li>
    </ul>
    <li>🍅 Mini tomato game</li>
    <ul>
        <li>When a work session ends a playful tomato-throwing mini-game is launched where you can click to throw tomatoes at tasks</li>
        <li>The mini-game is disabled for break sessions (Complete button appears instead)</li>
    </ul>
    <li>⏰ Smooth timer animations</li>
    <ul>
        <li>Animated timer appearance on load and smooth transitions when switching modes</li>
    </ul>
    <li>💾 Session persistence</li>
    <ul>
        <li>Current session tasks and state are stored in \`localStorage\` so you can reload the page and continue</li>
        <li>Completed sessions are saved separately and grouped by date in the Completed Tasks panel</li>
    </ul>
    <li>📝 Tasks</li>
    <ul>
        <li>Add simple task entries per session</li>
        <li>Mark tasks as completed when a work session finishes (interactive mini-game) and keep incomplete tasks for the next session</li>
    </ul>
    <li>🔔 Notifications & Service Worker</li>
    <ul>
        <li>Uses the Notification API with a registered Service Worker to notify when a session or break ends</li>
    </ul>
</ul>
  
  
<h2>💻 Built with</h2>

Technologies used in the project:

*   HTML
*   CSS
*   JAVASCRIPT

🧑🏽‍💻 How to run locally
------------------

1. Serve the folder with a static server (recommended):

   - Using VS Code Live Server extension

2. Open the page in a modern browser (Chrome, Firefox, or Edge). The app uses `localStorage`, the Notifications API and a Service Worker:

- Allow notifications when prompted to receive end-of-session alerts.
- The app redirects to `http://localhost:5500` when not running on `localhost`.

🗒️ Usage notes
-----------

- Session name: you can type a custom session title. If left empty, a default name based on the current date/time is used.
- Break mode: when activated, the timer and UI switch to a brown color scheme and tasks are hidden.
- Complete button: when the timer reaches zero, you can use the "Complete" button to save the session and start a break automatically.
- Reset: resets the timer and clears the saved session. If you're in break mode, reset keeps you in break mode (the timer goes back to 5:00).

🧩 Developer notes
---------------

- `script.js` stores the current session under the `pomodoroSession` key in `localStorage` and completed sessions under `completedSessions`.
- The code attempts to be defensive: it restores timer state on page load and resumes running timers where appropriate.
- The mini-game and many UI behaviors are implemented via DOM manipulation and the Web Animations API; you can adjust animation durations and easing directly in `script.js`.

License
-------

This project is provided as-is for learning and demo purposes. No license file included.


<p align="center">
Made with ❤️ by <strong>Rémy Eroes</strong>
</p>
