const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));

let todos = [];

app.get("/", (req, res) => {
  let todoItems = "";

  todos.forEach((todo, index) => {
    todoItems += `
      <li class="todo-item" style="animation-delay: ${index * 0.07}s">
        <div class="todo-left">
          <span class="todo-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="todo-text">${todo}</span>
        </div>
        <a href="/delete/${index}" class="delete-btn" title="Delete task">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path><path d="M14 11v6"></path>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
          </svg>
        </a>
      </li>
    `;
  });

  const emptyState =
    todos.length === 0
      ? `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      </div>
      <p>Koi task nahi hai. Kuch add karo!</p>
    </div>
  `
      : "";

  const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bytecode Ajay — Tasks</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0c0c0f;
      --surface: #13131a;
      --surface2: #1c1c27;
      --border: #2a2a3d;
      --accent: #7c6dfa;
      --accent2: #fa6d9e;
      --text: #e8e8f0;
      --muted: #6b6b85;
      --danger: #fa4d6d;
      --success: #4dfaab;
    }

    html { font-size: 16px; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px 80px;
      position: relative;
      overflow-x: hidden;
    }

    /* Ambient glow background */
    body::before {
      content: '';
      position: fixed;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 400px;
      background: radial-gradient(ellipse, rgba(124,109,250,0.12) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    body::after {
      content: '';
      position: fixed;
      bottom: -10%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(ellipse, rgba(250,109,158,0.07) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      width: 100%;
      max-width: 640px;
      position: relative;
      z-index: 1;
    }

    /* Header */
    .header {
      margin-bottom: 40px;
      animation: slideDown 0.5s ease both;
    }

    .header-tag {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-tag::before {
      content: '';
      display: inline-block;
      width: 20px;
      height: 1px;
      background: var(--accent);
    }

    h1 {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2rem, 6vw, 3.2rem);
      font-weight: 800;
      line-height: 1.05;
      background: linear-gradient(135deg, #fff 30%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .header-sub {
      margin-top: 10px;
      font-size: 13px;
      color: var(--muted);
      letter-spacing: 0.02em;
    }

    /* Stats bar */
    .stats {
      display: flex;
      gap: 16px;
      margin-bottom: 28px;
      animation: slideDown 0.5s 0.1s ease both;
    }
    .stat-pill {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 6px 16px;
      font-size: 12px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stat-pill span {
      color: var(--accent);
      font-weight: 500;
    }

    /* Input form */
    .input-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 6px 6px 6px 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
      transition: border-color 0.2s, box-shadow 0.2s;
      animation: slideDown 0.5s 0.15s ease both;
    }
    .input-card:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(124,109,250,0.12);
    }

    .input-icon {
      color: var(--muted);
      flex-shrink: 0;
      display: flex;
    }

    input[type="text"] {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text);
      font-family: 'DM Mono', monospace;
      font-size: 14px;
      letter-spacing: 0.01em;
      padding: 10px 0;
    }
    input[type="text"]::placeholder { color: var(--muted); }

    button[type="submit"] {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 11px;
      padding: 10px 22px;
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 7px;
      transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
      white-space: nowrap;
    }
    button[type="submit"]:hover {
      background: #9585ff;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(124,109,250,0.35);
    }
    button[type="submit"]:active { transform: translateY(0); }

    /* Section label */
    .section-label {
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideDown 0.5s 0.2s ease both;
    }
    .section-label .count-badge {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 2px 10px;
      font-size: 11px;
      color: var(--accent);
    }

    /* Todo list */
    ul.todo-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .todo-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 14px 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      animation: itemIn 0.35s ease both;
      transition: border-color 0.2s, background 0.2s;
    }
    .todo-item:hover {
      border-color: rgba(124,109,250,0.35);
      background: var(--surface2);
    }

    .todo-left {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .todo-number {
      font-size: 11px;
      color: var(--accent);
      opacity: 0.6;
      flex-shrink: 0;
      font-weight: 500;
      letter-spacing: 0.05em;
    }

    .todo-text {
      font-size: 14px;
      color: var(--text);
      word-break: break-word;
      line-height: 1.5;
    }

    .delete-btn {
      color: var(--muted);
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      flex-shrink: 0;
      transition: color 0.18s, background 0.18s;
    }
    .delete-btn:hover {
      color: var(--danger);
      background: rgba(250,77,109,0.1);
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 52px 0 36px;
      color: var(--muted);
      animation: fadeIn 0.4s ease both;
    }
    .empty-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
    }
    .empty-state p {
      font-size: 13px;
      letter-spacing: 0.02em;
    }

    /* Footer */
    .footer {
      margin-top: 48px;
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.06em;
      animation: fadeIn 0.5s 0.4s ease both;
    }
    .footer strong { color: var(--accent); font-weight: 500; }

    /* Animations */
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes itemIn {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @media (max-width: 480px) {
      body { padding: 32px 12px 60px; }
      button[type="submit"] span { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <div class="header-tag">Task Manager</div>
      <h1>Bytecode Ajay</h1>
      <p class="header-sub">Apne tasks track karo — ek ek karke.</p>
    </div>

    <div class="stats">
      <div class="stat-pill">Total: <span>${todos.length}</span></div>
      <div class="stat-pill">Pending: <span>${todos.length}</span></div>
    </div>

    <form method="POST" action="/add" class="input-card">
      <div class="input-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <input type="text" name="task" placeholder="Naya task likho..." required autocomplete="off" />
      <button type="submit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add Task</span>
      </button>
    </form>

    ${
      todos.length > 0
        ? `
    <div class="section-label">
      Active Tasks
      <span class="count-badge">${todos.length}</span>
    </div>
    `
        : ""
    }

    <ul class="todo-list">
      ${todoItems}
    </ul>

    ${emptyState}

    <div class="footer">
      Built with <strong>Express.js</strong> · Bytecode Ajay
    </div>
  </div>
</body>
</html>`;

  res.send(html);
});

app.post("/add", (req, res) => {
  todos.push(req.body.task);
  res.redirect("/");
});

app.get("/delete/:id", (req, res) => {
  todos.splice(req.params.id, 1);
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});