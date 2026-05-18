// ─── DOM References ──────────────────────────────────────────────────────────
const calendar = document.getElementById("calendar");
const weekView = document.getElementById("weekView");
const monthYear = document.getElementById("monthYear");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");
const todoPanel = document.getElementById("todoPanel");
const selectedDateTitle = document.getElementById("selectedDate");
const todoListEl = document.getElementById("todoList");
const todoText = document.getElementById("todoText");
const addTodoBtn = document.getElementById("addTodo");
const closeTodoBtn = document.getElementById("closeTodo");
const themeToggle = document.getElementById("themeToggle");
const monthViewBtn = document.getElementById("monthViewBtn");
const weekViewBtn = document.getElementById("weekViewBtn");
const notificationTime = document.getElementById("notificationTime");
const enableNotificationsBtn = document.getElementById("enableNotifications");
const alertBanner = document.getElementById("alertBanner");
const alertText = document.getElementById("alertText");
const pendingTasks = document.getElementById("pendingTasks");
const pendingTasksList = document.getElementById("pendingTasksList");
const statsBar = document.getElementById("statsBar");
const dayStats = document.getElementById("dayStats");
const weekdayLabels = document.getElementById("weekdayLabels");
const searchToggle = document.getElementById("searchToggle");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

// ─── State ────────────────────────────────────────────────────────────────────
let currentDate = new Date();
let selectedDate = null;
let viewMode = "month";
let notificationsEnabled = false;
let selectedPriority = "low";
let currentFilter = "all";

// ─── Theme ────────────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ─── View Toggle ──────────────────────────────────────────────────────────────
monthViewBtn.addEventListener("click", () => {
    viewMode = "month";
    monthViewBtn.classList.add("active");
    weekViewBtn.classList.remove("active");
    weekdayLabels.style.display = "grid";
    loadView();
});

weekViewBtn.addEventListener("click", () => {
    viewMode = "week";
    weekViewBtn.classList.add("active");
    monthViewBtn.classList.remove("active");
    weekdayLabels.style.display = "grid";
    loadView();
});

// ─── Today Button ─────────────────────────────────────────────────────────────
todayBtn.addEventListener("click", () => {
    currentDate = new Date();
    loadView();
});

// ─── Search ───────────────────────────────────────────────────────────────────
searchToggle.addEventListener("click", () => {
    searchPanel.classList.toggle("hidden");
    if (!searchPanel.classList.contains("hidden")) {
        searchInput.focus();
        searchResults.innerHTML = "";
    }
});

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
        searchResults.innerHTML = "";
        return;
    }

    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const matches = [];

    Object.keys(todos).forEach(dateKey => {
        todos[dateKey].forEach(todo => {
            if (todo.text.toLowerCase().includes(query)) {
                matches.push({ ...todo, dateKey });
            }
        });
    });

    if (matches.length === 0) {
        searchResults.innerHTML = `<div class="search-empty">Nenhuma tarefa encontrada</div>`;
        return;
    }

    searchResults.innerHTML = "";
    matches.slice(0, 10).forEach(todo => {
        const [y, m, d] = todo.dateKey.split("-");
        const dateFormatted = `${d.padStart(2,"0")}/${m.padStart(2,"0")}/${y}`;
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML = `
            <span>${todo.done ? "✓ " : ""}${escapeHtml(todo.text)}</span>
            <span class="search-result-date">${dateFormatted}</span>
        `;
        item.addEventListener("click", () => {
            searchPanel.classList.add("hidden");
            searchInput.value = "";
            // Navigate to that month
            currentDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            viewMode = "month";
            monthViewBtn.classList.add("active");
            weekViewBtn.classList.remove("active");
            loadView();
            setTimeout(() => openTodo(parseInt(y), parseInt(m) - 1, parseInt(d)), 100);
        });
        searchResults.appendChild(item);
    });
});

// ─── Priority Selector ────────────────────────────────────────────────────────
document.querySelectorAll(".priority-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".priority-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedPriority = btn.dataset.priority;
    });
});

// ─── Filter Bar ───────────────────────────────────────────────────────────────
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        loadTodos();
    });
});

// ─── Notifications ────────────────────────────────────────────────────────────
enableNotificationsBtn.addEventListener("click", async () => {
    if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            notificationsEnabled = true;
            enableNotificationsBtn.textContent = "✅ Lembretes ativos";
            enableNotificationsBtn.style.borderColor = "var(--priority-low)";
            enableNotificationsBtn.style.color = "var(--priority-low)";
            scheduleNotifications();
        }
    } else {
        alert("Seu navegador não suporta notificações");
    }
});

function scheduleNotifications() {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    Object.keys(todos).forEach(dateKey => {
        todos[dateKey].forEach(todo => {
            if (todo.notificationTime && !todo.done) {
                const [year, month, day] = dateKey.split("-");
                const [hours, minutes] = todo.notificationTime.split(":");
                const notifDate = new Date(year, month - 1, day, hours, minutes);
                const now = new Date();
                const timeUntil = notifDate - now;
                if (timeUntil > 0) {
                    setTimeout(() => {
                        new Notification("📝 Lembrete de Tarefa", {
                            body: todo.text,
                            icon: "https://cdn-icons-png.flaticon.com/512/2387/2387635.png"
                        });
                    }, timeUntil);
                }
            }
        });
    });
}

// ─── Urgent Task Check ────────────────────────────────────────────────────────
function checkUrgentTasks() {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    let urgentTasks = [];
    let todayTasks = [];

    if (todos[today]) {
        todos[today].forEach(todo => {
            if (!todo.done && todo.notificationTime) {
                const [hours, minutes] = todo.notificationTime.split(":");
                const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                const diff = taskTime - now;
                if (diff > 0 && diff < 30 * 60 * 1000) {
                    urgentTasks.push({ ...todo, date: today, dateFormatted: "Hoje" });
                } else if (taskTime > now) {
                    todayTasks.push({ ...todo, date: today, dateFormatted: "Hoje" });
                }
            } else if (!todo.done) {
                todayTasks.push({ ...todo, date: today, dateFormatted: "Hoje" });
            }
        });
    }

    if (urgentTasks.length > 0) {
        alertText.textContent = `${urgentTasks.length} tarefa(s) urgente(s) nas próximas 30 minutos!`;
        alertBanner.classList.remove("hidden");
    } else {
        alertBanner.classList.add("hidden");
    }

    if (urgentTasks.length > 0 || todayTasks.length > 0) {
        pendingTasks.classList.remove("hidden");
        pendingTasksList.innerHTML = "";
        urgentTasks.forEach(task => pendingTasksList.appendChild(createPendingTaskItem(task, true)));
        todayTasks.forEach(task => pendingTasksList.appendChild(createPendingTaskItem(task, false)));
    } else {
        pendingTasks.classList.add("hidden");
    }

    updateMonthStats();
}

function createPendingTaskItem(task, isUrgent) {
    const item = document.createElement("div");
    item.className = "pending-task-item" + (isUrgent ? " urgent" : "");

    const info = document.createElement("div");
    info.className = "task-info";

    const text = document.createElement("div");
    text.textContent = task.text;
    text.style.fontWeight = "500";

    const date = document.createElement("div");
    date.className = "task-date";
    date.textContent = task.dateFormatted;

    info.appendChild(text);
    info.appendChild(date);

    if (task.notificationTime) {
        const badge = document.createElement("span");
        badge.className = "task-time-badge" + (isUrgent ? " urgent" : "");
        badge.textContent = task.notificationTime;
        item.appendChild(info);
        item.appendChild(badge);
    } else {
        item.appendChild(info);
    }

    item.addEventListener("click", () => {
        const [year, month, day] = task.date.split("-");
        openTodo(parseInt(year), parseInt(month) - 1, parseInt(day));
    });

    return item;
}

// ─── Month Stats ──────────────────────────────────────────────────────────────
function updateMonthStats() {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let total = 0, done = 0;

    Object.keys(todos).forEach(key => {
        const [y, m] = key.split("-").map(Number);
        if (y === year && m === month + 1) {
            todos[key].forEach(t => { total++; if (t.done) done++; });
        }
    });

    if (total > 0) {
        statsBar.textContent = `${done}/${total} concluídas este mês`;
    } else {
        statsBar.textContent = "";
    }
}

// ─── View Management ──────────────────────────────────────────────────────────
function loadView() {
    if (viewMode === "month") {
        calendar.style.display = "grid";
        weekView.classList.remove("active");
        loadMonthView();
    } else {
        calendar.style.display = "none";
        weekView.classList.add("active");
        loadWeekView();
    }
    checkUrgentTasks();
}

function buildDayDots(todos, dateKey) {
    const items = todos[dateKey] || [];
    if (items.length === 0) return null;

    const container = document.createElement("div");
    container.className = "day-dots";

    items.slice(0, 6).forEach(todo => {
        const dot = document.createElement("div");
        dot.className = `day-dot ${todo.done ? "done" : (todo.priority || "low")}`;
        container.appendChild(dot);
    });

    return container;
}

function loadMonthView() {
    calendar.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYear.textContent = currentDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDayPrevMonth = new Date(year, month, 0).getDate();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");

    for (let i = firstDay; i > 0; i--) {
        const day = document.createElement("div");
        day.classList.add("day", "inactive");
        day.textContent = lastDayPrevMonth - i + 1;
        calendar.appendChild(day);
    }

    for (let d = 1; d <= lastDay; d++) {
        const day = document.createElement("div");
        day.classList.add("day");

        const numSpan = document.createElement("span");
        numSpan.textContent = d;
        day.appendChild(numSpan);

        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            day.classList.add("today");
        }

        const dateKey = `${year}-${month + 1}-${d}`;
        const dots = buildDayDots(todos, dateKey);
        if (dots) {
            day.classList.add("has-todos");
            day.appendChild(dots);

            const hasUrgent = (todos[dateKey] || []).some(todo => {
                if (!todo.done && todo.notificationTime) {
                    const now = new Date();
                    const [hours, minutes] = todo.notificationTime.split(":");
                    const taskTime = new Date(year, month, d, hours, minutes);
                    const diff = taskTime - now;
                    return diff > 0 && diff < 30 * 60 * 1000;
                }
                return false;
            });
            if (hasUrgent) day.classList.add("has-urgent");
        }

        day.addEventListener("click", () => openTodo(year, month, d));
        calendar.appendChild(day);
    }

    updateMonthStats();
}

function loadWeekView() {
    weekView.innerHTML = "";

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const startStr = startOfWeek.toLocaleDateString("pt-BR");
    const endDate = new Date(startOfWeek);
    endDate.setDate(startOfWeek.getDate() + 6);
    const endStr = endDate.toLocaleDateString("pt-BR");
    monthYear.textContent = `${startStr} — ${endStr}`;

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const day = document.createElement("div");
        day.classList.add("day");

        const year = dayDate.getFullYear();
        const month = dayDate.getMonth();
        const dayNum = dayDate.getDate();

        const numSpan = document.createElement("span");
        numSpan.textContent = dayNum;
        day.appendChild(numSpan);

        const dateKey = `${year}-${month + 1}-${dayNum}`;
        const dots = buildDayDots(todos, dateKey);
        if (dots) {
            day.classList.add("has-todos");
            day.appendChild(dots);
        }

        const today = new Date();
        if (dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            day.classList.add("today");
        }

        day.addEventListener("click", () => openTodo(year, month, dayNum));
        weekView.appendChild(day);
    }
}

// ─── Todo Panel ───────────────────────────────────────────────────────────────
function openTodo(year, month, day) {
    selectedDate = `${year}-${month + 1}-${day}`;
    const dateFormatted = new Date(year, month, day).toLocaleDateString("pt-BR", {
        weekday: "long", day: "numeric", month: "long"
    });
    selectedDateTitle.textContent = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
    todoPanel.classList.remove("hidden");
    currentFilter = "all";
    document.querySelectorAll(".filter-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === "all");
    });
    loadTodos();
    todoText.focus();
}

function loadTodos() {
    todoListEl.innerHTML = "";
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    let items = todos[selectedDate] || [];

    // Apply filter
    if (currentFilter === "pending") items = items.filter(t => !t.done);
    if (currentFilter === "done") items = items.filter(t => t.done);

    // Update day stats
    const all = todos[selectedDate] || [];
    const doneCount = all.filter(t => t.done).length;
    dayStats.textContent = all.length > 0
        ? `${doneCount}/${all.length} concluídas`
        : "";

    if (items.length === 0) {
        const empty = document.createElement("li");
        empty.style.cssText = "color:var(--text-muted);font-size:.85rem;text-align:center;padding:20px;cursor:default;border:none;background:transparent;";
        empty.textContent = currentFilter === "all" ? "Nenhuma tarefa para este dia" : "Nenhuma tarefa nesta categoria";
        todoListEl.appendChild(empty);
        return;
    }

    // Sort: pending first, then by priority (high > medium > low), then done
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    items.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (priorityOrder[a.priority || "low"] || 2) - (priorityOrder[b.priority || "low"] || 2);
    });

    items.forEach(todo => {
        const li = document.createElement("li");
        li.dataset.priority = todo.priority || "low";
        if (todo.done) li.classList.add("done");

        const textSpan = document.createElement("span");
        textSpan.className = "todo-text";
        textSpan.textContent = todo.text;

        const right = document.createElement("div");
        right.className = "todo-right";

        if (todo.notificationTime) {
            const timeSpan = document.createElement("span");
            timeSpan.className = "todo-time";
            timeSpan.textContent = todo.notificationTime;
            right.appendChild(timeSpan);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.title = "Excluir";
        deleteBtn.addEventListener("click", e => {
            e.stopPropagation();
            deleteTodo(todo.id);
        });
        right.appendChild(deleteBtn);

        li.appendChild(textSpan);
        li.appendChild(right);
        li.addEventListener("click", () => toggleTodo(todo.id));
        todoListEl.appendChild(li);
    });
}

function addTodo() {
    if (todoText.value.trim() === "") return;

    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    if (!todos[selectedDate]) todos[selectedDate] = [];

    const newTodo = {
        id: Date.now(),
        text: todoText.value.trim(),
        done: false,
        priority: selectedPriority,
    };

    if (notificationTime.value) {
        newTodo.notificationTime = notificationTime.value;
    }

    todos[selectedDate].push(newTodo);
    localStorage.setItem("todos", JSON.stringify(todos));

    todoText.value = "";
    notificationTime.value = "";
    loadTodos();
    loadView();

    if (notificationsEnabled) scheduleNotifications();
}

function toggleTodo(id) {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const item = todos[selectedDate].find(t => t.id === id);
    if (item) item.done = !item.done;
    localStorage.setItem("todos", JSON.stringify(todos));
    loadTodos();
    loadView();
    checkUrgentTasks();
}

function deleteTodo(id) {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    todos[selectedDate] = todos[selectedDate].filter(t => t.id !== id);
    localStorage.setItem("todos", JSON.stringify(todos));
    loadTodos();
    loadView();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
addTodoBtn.addEventListener("click", addTodo);
todoText.addEventListener("keypress", e => { if (e.key === "Enter") addTodo(); });
closeTodoBtn.addEventListener("click", () => todoPanel.classList.add("hidden"));

prevBtn.addEventListener("click", () => {
    if (viewMode === "month") currentDate.setMonth(currentDate.getMonth() - 1);
    else currentDate.setDate(currentDate.getDate() - 7);
    loadView();
});

nextBtn.addEventListener("click", () => {
    if (viewMode === "month") currentDate.setMonth(currentDate.getMonth() + 1);
    else currentDate.setDate(currentDate.getDate() + 7);
    loadView();
});

// Fechar painéis ao clicar fora
document.addEventListener("click", e => {
    if (!searchPanel.classList.contains("hidden") &&
        !searchPanel.contains(e.target) &&
        e.target !== searchToggle) {
        searchPanel.classList.add("hidden");
    }
});

// ─── Settings Modal ───────────────────────────────────────────────────────────
const settingsToggle = document.getElementById("settingsToggle");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const paletteGrid = document.getElementById("paletteGrid");
const clearDataBtn = document.getElementById("clearDataBtn");

const PALETTES = ["indigo", "original"];

function openSettingsModal() {
    settingsOverlay.classList.remove("hidden");
    settingsModal.classList.remove("hidden");
    updateActivePalette();
}

function closeSettingsModal() {
    settingsOverlay.classList.add("hidden");
    settingsModal.classList.add("hidden");
}

function updateActivePalette() {
    const current = localStorage.getItem("palette") || "indigo";
    document.querySelectorAll(".palette-option").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.palette === current);
    });
}

function applyPalette(name) {
    PALETTES.forEach(p => document.body.classList.remove(`palette-${p}`));
    if (name !== "indigo") document.body.classList.add(`palette-${name}`);
    localStorage.setItem("palette", name);
    updateActivePalette();
}

// Load saved palette on startup
const savedPalette = localStorage.getItem("palette") || "indigo";
applyPalette(savedPalette);

settingsToggle.addEventListener("click", openSettingsModal);
closeSettings.addEventListener("click", closeSettingsModal);
settingsOverlay.addEventListener("click", closeSettingsModal);

paletteGrid.addEventListener("click", e => {
    const btn = e.target.closest(".palette-option");
    if (btn) applyPalette(btn.dataset.palette);
});

clearDataBtn.addEventListener("click", () => {
    if (confirm("Tem certeza? Isso apagará TODAS as tarefas permanentemente.")) {
        localStorage.removeItem("todos");
        closeSettingsModal();
        loadView();
        todoPanel.classList.add("hidden");
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadView();

if (Notification.permission === "granted") {
    notificationsEnabled = true;
    enableNotificationsBtn.textContent = "✅ Lembretes ativos";
    enableNotificationsBtn.style.borderColor = "var(--priority-low)";
    enableNotificationsBtn.style.color = "var(--priority-low)";
    scheduleNotifications();
}

setInterval(checkUrgentTasks, 60000);
