const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const DATA_FILE = path.join(__dirname, "todos.json");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadTodos() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// ─── Routes ────────────────────────────────────────────────────────────────

// GET / — serve the app shell (HTML)
app.get("/", (req, res) => {
  res.send(getHtml());
});

// GET /api/todos — return all todos as JSON
app.get("/api/todos", (req, res) => {
  res.json(loadTodos());
});

// POST /api/todos — create a new todo
app.post("/api/todos", (req, res) => {
  const { text, priority, cat, due } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Task text is required." });
  }
  const todos = loadTodos();
  const newTodo = {
    id: Date.now(),
    text: text.trim(),
    priority: ["high", "medium", "low"].includes(priority) ? priority : "medium",
    cat: cat || "General",
    due: due || null,
    done: false,
    created: Date.now(),
  };
  todos.unshift(newTodo);
  saveTodos(todos);
  res.status(201).json(newTodo);
});

// PATCH /api/todos/:id — update a todo (text, done, priority, cat, due)
app.patch("/api/todos/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todos = loadTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found." });
  const allowed = ["text", "done", "priority", "cat", "due"];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) todos[idx][key] = req.body[key];
  });
  saveTodos(todos);
  res.json(todos[idx]);
});

// DELETE /api/todos/:id — delete one todo
app.delete("/api/todos/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  let todos = loadTodos();
  const before = todos.length;
  todos = todos.filter((t) => t.id !== id);
  if (todos.length === before) return res.status(404).json({ error: "Not found." });
  saveTodos(todos);
  res.json({ ok: true });
});

// DELETE /api/todos/done/all — clear all completed todos
app.delete("/api/todos/done/all", (req, res) => {
  const todos = loadTodos().filter((t) => !t.done);
  saveTodos(todos);
  res.json({ ok: true });
});

// ─── Start ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🚀  Taskflow running → http://localhost:${PORT}\n`);
});

// ─── HTML ──────────────────────────────────────────────────────────────────

function getHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Taskflow — Stay Focused. Ship Things.</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Geist+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#08080d;--s1:#0f0f17;--s2:#161620;--s3:#1d1d2a;
  --bd:#2c2c3e;--bd2:#3a3a52;
  --t1:#f0f0f8;--t2:#a0a0c0;--t3:#5a5a80;
  --acc:#6c63ff;--acc2:#ff6584;--acc3:#43e8b0;--acc4:#ffb347;
  --r:12px;--r2:8px;--r3:20px;
}
html{font-size:16px;scroll-behavior:smooth}
body{background:var(--bg);color:var(--t1);font-family:'Bricolage Grotesque',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:48px 16px 100px;overflow-x:hidden;position:relative}

/* Ambient glows */
body::before{content:'';position:fixed;top:-30%;left:50%;transform:translateX(-50%);width:700px;height:500px;background:radial-gradient(ellipse,rgba(108,99,255,.14) 0%,transparent 70%);pointer-events:none;z-index:0}
body::after{content:'';position:fixed;bottom:-20%;right:-10%;width:450px;height:450px;background:radial-gradient(ellipse,rgba(255,101,132,.07) 0%,transparent 70%);pointer-events:none;z-index:0}

/* Noise overlay */
.noise{position:fixed;inset:0;pointer-events:none;opacity:.03;z-index:999;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

.app{width:100%;max-width:760px;position:relative;z-index:1}

/* ── Header ── */
.top{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap}
.brand{display:flex;flex-direction:column;gap:4px}
.brand-tag{font-family:'Geist Mono',monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);display:flex;align-items:center;gap:8px}
.brand-tag::before{content:'';width:24px;height:1px;background:var(--acc);display:block}
h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;letter-spacing:-.03em;line-height:1;background:linear-gradient(135deg,#fff 20%,var(--acc) 80%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.brand-sub{font-size:12px;color:var(--t3);font-family:'Geist Mono',monospace;margin-top:2px}

/* Stats */
.stats{display:flex;gap:8px;flex-wrap:wrap}
.stat{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r3);padding:6px 14px;font-family:'Geist Mono',monospace;font-size:11px;color:var(--t2);display:flex;align-items:center;gap:5px;transition:border-color .2s}
.stat .n{font-size:14px;font-weight:600;color:var(--t1)}
.stat.s-done .n{color:var(--acc3)}
.stat.s-total .n{color:var(--acc)}

/* Progress */
.progress-bar{width:100%;height:4px;background:var(--s2);border-radius:4px;margin-bottom:28px;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--acc),var(--acc3));border-radius:4px;transition:width .5s cubic-bezier(.4,0,.2,1)}

/* ── Input card ── */
.input-wrap{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:16px;margin-bottom:20px;display:flex;flex-direction:column;gap:12px;transition:border-color .2s,box-shadow .2s}
.input-wrap:focus-within{border-color:var(--acc);box-shadow:0 0 0 4px rgba(108,99,255,.1)}
.input-row{display:flex;gap:10px;align-items:center}
.plus-icon{color:var(--t3);flex-shrink:0}
.task-input{flex:1;background:transparent;border:none;outline:none;color:var(--t1);font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:500}
.task-input::placeholder{color:var(--t3)}
.add-btn{background:var(--acc);color:#fff;border:none;border-radius:10px;padding:10px 22px;font-family:'Bricolage Grotesque',sans-serif;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;white-space:nowrap;flex-shrink:0}
.add-btn:hover{background:#8880ff;transform:translateY(-1px);box-shadow:0 8px 24px rgba(108,99,255,.35)}
.add-btn:active{transform:translateY(0)}
.add-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}

/* Meta row */
.meta-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.meta-label{font-size:11px;color:var(--t3);font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:.1em;flex-shrink:0}
.pill-group{display:flex;gap:4px;flex-wrap:wrap}
.pill-btn{background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;color:var(--t2);transition:all .15s;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:.05em}
.pill-btn:hover{border-color:var(--bd2);color:var(--t1)}
.pill-btn.cat-active{background:rgba(108,99,255,.15);border-color:var(--acc);color:var(--acc)}
.pill-btn.pri-active[data-p="high"]{background:rgba(255,101,132,.15);border-color:var(--acc2);color:var(--acc2)}
.pill-btn.pri-active[data-p="medium"]{background:rgba(255,179,71,.15);border-color:var(--acc4);color:var(--acc4)}
.pill-btn.pri-active[data-p="low"]{background:rgba(67,232,176,.15);border-color:var(--acc3);color:var(--acc3)}
.due-input{background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--t2);font-family:'Geist Mono',monospace;outline:none;cursor:pointer;transition:border-color .2s;color-scheme:dark}
.due-input:focus{border-color:var(--acc)}

/* ── Toolbar ── */
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;justify-content:space-between}
.filter-group{display:flex;gap:4px;background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:4px}
.flt-btn{background:transparent;border:none;border-radius:7px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;color:var(--t2);transition:all .15s;font-family:'Bricolage Grotesque',sans-serif}
.flt-btn:hover{color:var(--t1)}
.flt-btn.active{background:var(--s3);color:var(--t1);box-shadow:0 1px 4px rgba(0,0,0,.3)}
.right-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.search-wrap{position:relative;display:flex;align-items:center}
.search-wrap svg{position:absolute;left:10px;color:var(--t3);pointer-events:none;width:14px;height:14px}
.search-inp{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:8px 12px 8px 32px;font-size:13px;color:var(--t1);outline:none;font-family:'Bricolage Grotesque',sans-serif;transition:border-color .2s;width:200px}
.search-inp::placeholder{color:var(--t3)}
.search-inp:focus{border-color:var(--acc)}
.sort-sel{background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:8px 12px;font-size:12px;color:var(--t2);font-family:'Bricolage Grotesque',sans-serif;cursor:pointer;outline:none;transition:border-color .2s;color-scheme:dark}
.sort-sel:focus{border-color:var(--acc)}

/* ── Section header ── */
.section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.section-title{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--t3);font-family:'Geist Mono',monospace;display:flex;align-items:center;gap:10px}
.cnt-badge{background:var(--s2);border:1px solid var(--bd);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--acc)}
.clear-btn{background:transparent;border:1px solid var(--bd);border-radius:6px;padding:4px 12px;font-size:11px;color:var(--t3);cursor:pointer;font-family:'Geist Mono',monospace;transition:all .15s}
.clear-btn:hover{border-color:var(--acc2);color:var(--acc2)}

/* ── Todo list ── */
.todo-list{display:flex;flex-direction:column;gap:8px}
.todo-item{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);padding:14px 16px;display:flex;align-items:flex-start;gap:12px;transition:all .2s;position:relative;overflow:hidden;animation:slideIn .3s ease both}
.todo-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px;transition:width .2s}
.todo-item[data-p="high"]::before{background:var(--acc2)}
.todo-item[data-p="medium"]::before{background:var(--acc4)}
.todo-item[data-p="low"]::before{background:var(--acc3)}
.todo-item:hover{border-color:var(--bd2);background:var(--s2);transform:translateX(2px)}
.todo-item.is-done{opacity:.5}
.todo-item.is-done .todo-text{text-decoration:line-through;color:var(--t3)}

/* Checkbox */
.chk-wrap{flex-shrink:0;margin-top:1px;cursor:pointer;user-select:none}
.chk{width:20px;height:20px;border-radius:6px;border:2px solid var(--bd2);display:flex;align-items:center;justify-content:center;transition:all .18s}
.chk:hover{border-color:var(--acc)}
.chk.checked{background:var(--acc);border-color:var(--acc)}
.chk svg{opacity:0;transition:opacity .15s;width:11px;height:11px;stroke:#fff;stroke-width:3;fill:none}
.chk.checked svg{opacity:1}

/* Content */
.todo-main{flex:1;min-width:0}
.todo-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:7px}
.todo-text{font-size:15px;font-weight:500;line-height:1.45;color:var(--t1);word-break:break-word}
.todo-right{display:flex;align-items:center;gap:6px;flex-shrink:0}
.todo-num{font-size:10px;font-family:'Geist Mono',monospace;color:var(--t3);letter-spacing:.05em;margin-top:2px}
.actions{display:flex;gap:2px}
.act-btn{background:transparent;border:none;color:var(--t3);cursor:pointer;padding:5px;border-radius:6px;transition:all .15s;display:flex;align-items:center;line-height:0}
.act-btn.edit:hover{background:rgba(108,99,255,.12);color:var(--acc)}
.act-btn.del:hover{background:rgba(255,101,132,.1);color:var(--acc2)}

/* Tags */
.todo-meta{display:flex;gap:5px;align-items:center;flex-wrap:wrap}
.tag{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;font-family:'Geist Mono',monospace;text-transform:uppercase;letter-spacing:.05em}
.tag.t-cat{background:rgba(108,99,255,.12);color:#a09aff;border:1px solid rgba(108,99,255,.2)}
.tag.t-high{background:rgba(255,101,132,.1);color:#ff8faa;border:1px solid rgba(255,101,132,.18)}
.tag.t-medium{background:rgba(255,179,71,.1);color:#ffc96b;border:1px solid rgba(255,179,71,.18)}
.tag.t-low{background:rgba(67,232,176,.1);color:#65f0c5;border:1px solid rgba(67,232,176,.18)}
.due-tag{font-size:10px;font-family:'Geist Mono',monospace;color:var(--t3);display:flex;align-items:center;gap:4px}
.due-tag.overdue{color:var(--acc2)}
.due-tag.today-due{color:var(--acc3)}

/* Edit input */
.edit-input{width:100%;background:var(--s3);border:1px solid var(--acc);border-radius:6px;padding:6px 10px;color:var(--t1);font-family:'Bricolage Grotesque',sans-serif;font-size:15px;outline:none;margin-bottom:6px}
.edit-actions{display:flex;gap:6px;margin-bottom:8px}
.edit-save-btn{background:var(--acc);color:#fff;border:none;border-radius:6px;padding:4px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Bricolage Grotesque',sans-serif}
.edit-cancel-btn{background:transparent;border:1px solid var(--bd);border-radius:6px;padding:4px 12px;font-size:12px;color:var(--t2);cursor:pointer;font-family:'Bricolage Grotesque',sans-serif}

/* Done section */
.done-section{margin-top:24px}
.collapse-btn{background:transparent;border:none;color:var(--t3);cursor:pointer;font-family:'Geist Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.12em;display:flex;align-items:center;gap:6px;padding:0;transition:color .15s}
.collapse-btn:hover{color:var(--t2)}
.collapse-icon{transition:transform .25s}
.collapse-icon.open{transform:rotate(180deg)}

/* Empty */
.empty{text-align:center;padding:60px 20px;color:var(--t3);animation:fadeIn .4s ease}
.empty-icon{width:80px;height:80px;margin:0 auto 18px;background:var(--s2);border:1px solid var(--bd);border-radius:20px;display:flex;align-items:center;justify-content:center;color:var(--t3)}
.empty p{font-size:13px;font-family:'Geist Mono',monospace;letter-spacing:.03em}

/* Toast */
.toast-wrap{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{background:var(--s2);border:1px solid var(--bd2);border-radius:10px;padding:10px 20px;font-size:13px;font-family:'Geist Mono',monospace;color:var(--t1);animation:toastIn .3s ease;display:flex;align-items:center;gap:8px;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,.4)}
.toast.success{border-color:var(--acc3);color:var(--acc3)}
.toast.error{border-color:var(--acc2);color:var(--acc2)}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* Footer */
.footer{margin-top:48px;text-align:center;font-size:11px;font-family:'Geist Mono',monospace;color:var(--t3);letter-spacing:.06em}
.footer strong{color:var(--acc);font-weight:500}
#clockEl{color:var(--t2)}

/* Animations */
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}

/* Responsive */
@media(max-width:520px){
  body{padding:28px 10px 80px}
  .add-btn span{display:none}
  .search-inp{width:140px}
  h1{font-size:2rem}
  .meta-row{gap:6px}
}
</style>
</head>
<body>
<div class="noise"></div>

<div class="app">
  <!-- Header -->
  <div class="top">
    <div class="brand">
      <div class="brand-tag">Task Manager</div>
      <h1>Taskflow</h1>
      <div class="brand-sub">// stay focused. ship things.</div>
    </div>
    <div class="stats" id="stats">
      <div class="stat s-total"><span class="n" id="sTot">0</span> total</div>
      <div class="stat"><span class="n" id="sAct">0</span> active</div>
      <div class="stat s-done"><span class="n" id="sDone">0</span> done</div>
      <div class="stat"><span class="n" id="sPct">0%</span> complete</div>
    </div>
  </div>

  <!-- Progress bar -->
  <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>

  <!-- Input -->
  <div class="input-wrap">
    <div class="input-row">
      <svg class="plus-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <input type="text" id="taskInput" class="task-input" placeholder="Add a new task…" autocomplete="off"/>
      <button class="add-btn" id="addBtn" onclick="handleAdd()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Task</span>
      </button>
    </div>
    <div class="meta-row">
      <span class="meta-label">Priority</span>
      <div class="pill-group" id="priBtns">
        <button class="pill-btn pri-active" data-p="medium" onclick="setPriority(this)">Med</button>
        <button class="pill-btn" data-p="high" onclick="setPriority(this)">High</button>
        <button class="pill-btn" data-p="low" onclick="setPriority(this)">Low</button>
      </div>
      <span class="meta-label" style="margin-left:8px">Category</span>
      <div class="pill-group" id="catBtns">
        <button class="pill-btn cat-active" data-c="General" onclick="setCat(this)">General</button>
        <button class="pill-btn" data-c="Work" onclick="setCat(this)">Work</button>
        <button class="pill-btn" data-c="Personal" onclick="setCat(this)">Personal</button>
        <button class="pill-btn" data-c="Dev" onclick="setCat(this)">Dev</button>
        <button class="pill-btn" data-c="Design" onclick="setCat(this)">Design</button>
      </div>
      <span class="meta-label" style="margin-left:8px">Due</span>
      <input type="date" id="dueInput" class="due-input"/>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="filter-group">
      <button class="flt-btn active" data-f="all" onclick="setFilter(this,'all')">All</button>
      <button class="flt-btn" data-f="active" onclick="setFilter(this,'active')">Active</button>
      <button class="flt-btn" data-f="high" onclick="setFilter(this,'high')">High Priority</button>
      <button class="flt-btn" data-f="today" onclick="setFilter(this,'today')">Due Today</button>
    </div>
    <div class="right-tools">
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="searchInp" class="search-inp" placeholder="Search…" oninput="render()"/>
      </div>
      <select id="sortSel" class="sort-sel" onchange="render()">
        <option value="created">Sort: Recent</option>
        <option value="priority">Sort: Priority</option>
        <option value="due">Sort: Due Date</option>
        <option value="alpha">Sort: A–Z</option>
      </select>
    </div>
  </div>

  <!-- Active tasks -->
  <div class="section-hd">
    <div class="section-title">Active Tasks <span class="cnt-badge" id="activeCount">0</span></div>
    <button class="clear-btn" onclick="clearDone()">Clear completed</button>
  </div>
  <div class="todo-list" id="activeList"></div>

  <!-- Empty state -->
  <div class="empty" id="emptyState" style="display:none">
    <div class="empty-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    </div>
    <p id="emptyMsg">No tasks yet — add one above!</p>
  </div>

  <!-- Completed section -->
  <div class="done-section" id="doneSection" style="display:none">
    <div class="section-hd">
      <div class="section-title">Completed <span class="cnt-badge" id="doneCount">0</span></div>
      <button class="collapse-btn" onclick="toggleDone()">
        <svg class="collapse-icon" id="collapseIcon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        <span id="collapseLabel">Show</span>
      </button>
    </div>
    <div class="todo-list" id="doneList" style="display:none"></div>
  </div>

  <div class="footer">
    Built with <strong>Express.js</strong> · Taskflow · <span id="clockEl"></span>
  </div>
</div>

<!-- Toast container -->
<div class="toast-wrap" id="toastWrap"></div>

<script>
// ── State ────────────────────────────────────────────────────────────────
let todos = [];
let currentPriority = 'medium';
let currentCat = 'General';
let currentFilter = 'all';
let showDone = false;

// ── Boot ─────────────────────────────────────────────────────────────────
(async function init() {
  await loadTodos();
  render();
  setInterval(updateClock, 1000);
  updateClock();
})();

// ── API calls ────────────────────────────────────────────────────────────
async function loadTodos() {
  const res = await fetch('/api/todos');
  todos = await res.json();
}

async function apiAdd(data) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add task');
  return res.json();
}

async function apiPatch(id, data) {
  const res = await fetch('/api/todos/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

async function apiDelete(id) {
  const res = await fetch('/api/todos/' + id, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
}

async function apiClearDone() {
  const res = await fetch('/api/todos/done/all', { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear');
}

// ── Handlers ─────────────────────────────────────────────────────────────
function setPriority(btn) {
  currentPriority = btn.dataset.p;
  document.querySelectorAll('#priBtns .pill-btn').forEach(b => b.classList.remove('pri-active'));
  btn.classList.add('pri-active');
}

function setCat(btn) {
  currentCat = btn.dataset.c;
  document.querySelectorAll('#catBtns .pill-btn').forEach(b => b.classList.remove('cat-active'));
  btn.classList.add('cat-active');
}

function setFilter(btn, f) {
  currentFilter = f;
  document.querySelectorAll('.flt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

async function handleAdd() {
  const inp = document.getElementById('taskInput');
  const text = inp.value.trim();
  if (!text) { inp.focus(); return; }
  const btn = document.getElementById('addBtn');
  btn.disabled = true;
  try {
    const due = document.getElementById('dueInput').value || null;
    const todo = await apiAdd({ text, priority: currentPriority, cat: currentCat, due });
    todos.unshift(todo);
    inp.value = '';
    render();
    toast('Task added!', 'success');
  } catch (e) {
    toast('Failed to add task', 'error');
  } finally {
    btn.disabled = false;
    inp.focus();
  }
}

async function toggleCheck(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  render();
  try {
    await apiPatch(id, { done: t.done });
    toast(t.done ? 'Task completed!' : 'Task reopened', 'success');
  } catch {
    t.done = !t.done;
    render();
    toast('Update failed', 'error');
  }
}

async function deleteTask(id) {
  const prev = [...todos];
  todos = todos.filter(x => x.id !== id);
  render();
  try {
    await apiDelete(id);
    toast('Task deleted', '');
  } catch {
    todos = prev;
    render();
    toast('Delete failed', 'error');
  }
}

async function clearDone() {
  const prev = [...todos];
  todos = todos.filter(t => !t.done);
  render();
  try {
    await apiClearDone();
    toast('Completed tasks cleared', '');
  } catch {
    todos = prev;
    render();
    toast('Clear failed', 'error');
  }
}

function toggleDone() {
  showDone = !showDone;
  document.getElementById('doneList').style.display = showDone ? 'flex' : 'none';
  document.getElementById('collapseLabel').textContent = showDone ? 'Hide' : 'Show';
  const icon = document.getElementById('collapseIcon');
  icon.classList.toggle('open', showDone);
}

// ── Edit ─────────────────────────────────────────────────────────────────
function startEdit(id) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  const textEl = document.getElementById('txt_' + id);
  const wrapEl = document.getElementById('ew_' + id);
  textEl.style.display = 'none';
  wrapEl.innerHTML =
    '<input class="edit-input" id="ei_' + id + '" value="' + esc(t.text) + '"/>' +
    '<div class="edit-actions">' +
    '<button class="edit-save-btn" onclick="saveEdit(' + id + ')">Save</button>' +
    '<button class="edit-cancel-btn" onclick="cancelEdit(' + id + ')">Cancel</button>' +
    '</div>';
  const ei = document.getElementById('ei_' + id);
  ei.focus(); ei.select();
  ei.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') cancelEdit(id);
  });
}

async function saveEdit(id) {
  const ei = document.getElementById('ei_' + id);
  if (!ei) return;
  const text = ei.value.trim();
  if (!text) return;
  const t = todos.find(x => x.id === id);
  if (!t) return;
  const old = t.text;
  t.text = text;
  render();
  try {
    await apiPatch(id, { text });
    toast('Task updated', 'success');
  } catch {
    t.text = old;
    render();
    toast('Update failed', 'error');
  }
}

function cancelEdit(id) {
  const textEl = document.getElementById('txt_' + id);
  const wrapEl = document.getElementById('ew_' + id);
  if (textEl) textEl.style.display = '';
  if (wrapEl) wrapEl.innerHTML = '';
}

// ── Render ────────────────────────────────────────────────────────────────
const priOrder = { high: 0, medium: 1, low: 2 };

function getFiltered() {
  const q = document.getElementById('searchInp').value.toLowerCase();
  const sort = document.getElementById('sortSel').value;
  let active = todos.filter(t => !t.done);
  if (currentFilter === 'high') active = active.filter(t => t.priority === 'high');
  else if (currentFilter === 'today') active = active.filter(t => isToday(t.due));
  if (q) active = active.filter(t => t.text.toLowerCase().includes(q));
  active.sort((a, b) => {
    if (sort === 'priority') return priOrder[a.priority] - priOrder[b.priority];
    if (sort === 'due') return (a.due || '9999').localeCompare(b.due || '9999');
    if (sort === 'alpha') return a.text.localeCompare(b.text);
    return b.created - a.created;
  });
  return active;
}

function render() {
  const active = getFiltered();
  const done = todos.filter(t => t.done);
  const total = todos.length;
  const doneCount = done.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Stats
  document.getElementById('sTot').textContent = total;
  document.getElementById('sAct').textContent = todos.filter(t => !t.done).length;
  document.getElementById('sDone').textContent = doneCount;
  document.getElementById('sPct').textContent = pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('activeCount').textContent = active.length;

  // Active list
  const al = document.getElementById('activeList');
  al.innerHTML = '';
  const searchQ = document.getElementById('searchInp').value.toLowerCase();
  if (active.length === 0 && done.length === 0) {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('emptyMsg').textContent = 'No tasks yet — add one above!';
  } else if (active.length === 0) {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('emptyMsg').textContent = searchQ ? 'No tasks match your search.' : 'No tasks match this filter.';
  } else {
    document.getElementById('emptyState').style.display = 'none';
    active.forEach((t, i) => al.appendChild(makeTodoEl(t, i, false)));
  }

  // Done list
  const ds = document.getElementById('doneSection');
  const dl = document.getElementById('doneList');
  document.getElementById('doneCount').textContent = doneCount;
  if (doneCount > 0) {
    ds.style.display = 'block';
    dl.innerHTML = '';
    done.forEach((t, i) => dl.appendChild(makeTodoEl(t, i, true)));
  } else {
    ds.style.display = 'none';
  }
}

function makeTodoEl(t, idx, isDone) {
  const div = document.createElement('div');
  div.className = 'todo-item' + (isDone ? ' is-done' : '');
  div.dataset.p = t.priority;
  div.style.animationDelay = (idx * 0.04) + 's';

  const overdue = !isDone && isOverdue(t.due);
  const todayDue = !isDone && isToday(t.due);

  div.innerHTML =
    '<div class="chk-wrap" onclick="toggleCheck(' + t.id + ')">' +
      '<div class="chk ' + (t.done ? 'checked' : '') + '">' +
        '<svg viewBox="0 0 24 24"><polyline points="20 6 9 20 4 14.5"/></svg>' +
      '</div>' +
    '</div>' +
    '<div class="todo-main">' +
      '<div class="todo-top">' +
        '<div class="todo-text" id="txt_' + t.id + '">' + esc(t.text) + '</div>' +
        '<div class="todo-right">' +
          '<div class="todo-num">#' + String(idx + 1).padStart(2, '0') + '</div>' +
          '<div class="actions">' +
            '<button class="act-btn edit" onclick="startEdit(' + t.id + ')" title="Edit">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            '</button>' +
            '<button class="act-btn del" onclick="deleteTask(' + t.id + ')" title="Delete">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="ew_' + t.id + '"></div>' +
      '<div class="todo-meta">' +
        '<span class="tag t-cat">' + esc(t.cat || 'General') + '</span>' +
        '<span class="tag t-' + t.priority + '">' + t.priority + '</span>' +
        (t.due ? '<span class="due-tag' + (overdue ? ' overdue' : todayDue ? ' today-due' : '') + '">' +
          (overdue ? '⚠ Overdue · ' : todayDue ? '● Today · ' : '') + formatDate(t.due) + '</span>' : '') +
      '</div>' +
    '</div>';

  return div;
}

// ── Utilities ─────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return d < n;
}

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateClock() {
  const el = document.getElementById('clockEl');
  if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg, type) {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── Keyboard shortcut ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleAdd();
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    document.getElementById('searchInp').focus();
  }
});
document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdd();
});
</script>
</body>
</html>`;
}