const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));

let todos = [];

app.get("/", (req, res) => {
  let html = `
    <h1>Todo App V2 </h1>

    <form method="POST" action="/add">
      <input type="text" name="task" placeholder="Enter Your task here" required />
      <button>Add Task</button>
    </form>

    <ul>
  `;

  todos.forEach((todo, index) => {
    html += `
      <li>
        ${todo}
        <a href="/delete/${index}">Delete</a>
      </li>
    `;
  });

  html += `</ul>`;

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