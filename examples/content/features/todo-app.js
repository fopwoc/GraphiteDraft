const storageKey = "graphite-draft-example-todos";
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const empty = document.querySelector("#todo-empty");
const clear = document.querySelector("#todo-clear");
const initialTodos = [
  { id: "pick-up-paycheck", label: "Pick up Paycheck", done: false },
  { id: "cash-paycheck", label: "Cash Paycheck", done: false },
  { id: "get-milk", label: "Get Milk", done: false }
];

let todos = readTodos();

function readTodos() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return initialTodos.map((todo) => ({ ...todo }));
    const saved = JSON.parse(stored);
    if (Array.isArray(saved)) return saved;
  } catch {}
  return initialTodos.map((todo) => ({ ...todo }));
}

function saveTodos() {
  localStorage.setItem(storageKey, JSON.stringify(todos));
}

function renderTodos() {
  list.replaceChildren();
  empty.hidden = todos.length > 0;
  clear.hidden = !todos.some((todo) => todo.done);

  for (const todo of todos) {
    const item = document.createElement("li");
    item.className = "task-list-item";
    item.dataset.done = String(todo.done);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `Mark ${todo.label} complete`);
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const label = document.createElement("span");
    label.textContent = todo.label;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      todos = todos.filter((candidate) => candidate.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    item.append(checkbox, label, remove);
    list.append(item);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const label = input.value.trim();
  if (!label) return;
  todos.push({ id: crypto.randomUUID(), label, done: false });
  input.value = "";
  saveTodos();
  renderTodos();
  input.focus();
});

clear.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.done);
  saveTodos();
  renderTodos();
});

renderTodos();
