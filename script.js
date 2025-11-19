const calendar = document.getElementById("calendar");
const weekView = document.getElementById("weekView");
const monthYear = document.getElementById("monthYear");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
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

let currentDate = new Date();
let selectedDate = null;
let viewMode = "month";
let notificationsEnabled = false;

// Dark Mode
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

// View Mode Toggle
monthViewBtn.addEventListener("click", () => {
    viewMode = "month";
    monthViewBtn.classList.add("active");
    weekViewBtn.classList.remove("active");
    loadView();
});

weekViewBtn.addEventListener("click", () => {
    viewMode = "week";
    weekViewBtn.classList.add("active");
    monthViewBtn.classList.remove("active");
    loadView();
});

// Notifications
enableNotificationsBtn.addEventListener("click", async () => {
    if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            notificationsEnabled = true;
            enableNotificationsBtn.textContent = "✅ Lembretes Ativos";
            enableNotificationsBtn.style.background = "#10b981";
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

// Verifica tarefas urgentes e pendentes
function checkUrgentTasks() {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    
    let urgentTasks = [];
    let todayTasks = [];

    // Verifica tarefas de hoje
    if (todos[today]) {
        todos[today].forEach(todo => {
            if (!todo.done && todo.notificationTime) {
                const [hours, minutes] = todo.notificationTime.split(":");
                const taskTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                const diff = taskTime - now;
                
                // Tarefas nas próximas 30 minutos são URGENTES
                if (diff > 0 && diff < 30 * 60 * 1000) {
                    urgentTasks.push({...todo, date: today, dateFormatted: 'Hoje'});
                } else if (taskTime > now) {
                    todayTasks.push({...todo, date: today, dateFormatted: 'Hoje'});
                }
            } else if (!todo.done) {
                todayTasks.push({...todo, date: today, dateFormatted: 'Hoje'});
            }
        });
    }

    // Mostra banner de alerta para tarefas urgentes
    if (urgentTasks.length > 0) {
        alertText.textContent = `${urgentTasks.length} tarefa(s) urgente(s) nas próximas 30 minutos!`;
        alertBanner.classList.remove('hidden');
    } else {
        alertBanner.classList.add('hidden');
    }

    // Mostra seção de tarefas pendentes
    if (urgentTasks.length > 0 || todayTasks.length > 0) {
        pendingTasks.classList.remove('hidden');
        pendingTasksList.innerHTML = '';
        
        // Mostra urgentes primeiro
        urgentTasks.forEach(task => {
            const item = createPendingTaskItem(task, true);
            pendingTasksList.appendChild(item);
        });
        
        // Depois tarefas regulares
        todayTasks.forEach(task => {
            const item = createPendingTaskItem(task, false);
            pendingTasksList.appendChild(item);
        });
    } else {
        pendingTasks.classList.add('hidden');
    }
}

function createPendingTaskItem(task, isUrgent) {
    const item = document.createElement('div');
    item.className = 'pending-task-item' + (isUrgent ? ' urgent' : '');
    
    const info = document.createElement('div');
    info.className = 'task-info';
    
    const text = document.createElement('div');
    text.textContent = task.text;
    text.style.fontWeight = '600';
    
    const date = document.createElement('div');
    date.className = 'task-date';
    date.textContent = task.dateFormatted;
    
    info.appendChild(text);
    info.appendChild(date);
    
    if (task.notificationTime) {
        const badge = document.createElement('span');
        badge.className = 'task-time-badge' + (isUrgent ? ' urgent' : '');
        badge.textContent = task.notificationTime;
        item.appendChild(info);
        item.appendChild(badge);
    } else {
        item.appendChild(info);
    }
    
    item.addEventListener('click', () => {
        const [year, month, day] = task.date.split('-');
        openTodo(parseInt(year), parseInt(month) - 1, parseInt(day));
    });
    
    return item;
}

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

    // Previous month days
    for (let i = firstDay; i > 0; i--) {
        const day = document.createElement("div");
        day.classList.add("day", "inactive");
        day.textContent = lastDayPrevMonth - i + 1;
        calendar.appendChild(day);
    }

    // Current month days
    for (let d = 1; d <= lastDay; d++) {
        const day = document.createElement("div");
        day.classList.add("day");
        day.textContent = d;

        if (
            d === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            day.classList.add("today");
        }

        const dateKey = `${year}-${month + 1}-${d}`;
        if (todos[dateKey] && todos[dateKey].length > 0) {
            day.classList.add("has-todos");
            
            // Verifica se tem tarefas urgentes
            const hasUrgent = todos[dateKey].some(todo => {
                if (!todo.done && todo.notificationTime) {
                    const now = new Date();
                    const [hours, minutes] = todo.notificationTime.split(":");
                    const taskTime = new Date(year, month, d, hours, minutes);
                    const diff = taskTime - now;
                    return diff > 0 && diff < 30 * 60 * 1000;
                }
                return false;
            });
            
            if (hasUrgent) {
                day.classList.add("has-urgent");
            }
        }

        day.addEventListener("click", () => openTodo(year, month, d));
        calendar.appendChild(day);
    }
}

function loadWeekView() {
    weekView.innerHTML = "";
    
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    
    monthYear.textContent = `Semana de ${startOfWeek.toLocaleDateString("pt-BR")}`;

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        const day = document.createElement("div");
        day.classList.add("day");
        day.textContent = dayDate.getDate();
        
        const year = dayDate.getFullYear();
        const month = dayDate.getMonth();
        const dayNum = dayDate.getDate();
        
        const dateKey = `${year}-${month + 1}-${dayNum}`;
        if (todos[dateKey] && todos[dateKey].length > 0) {
            day.classList.add("has-todos");
            
            // Verifica se tem tarefas urgentes
            const hasUrgent = todos[dateKey].some(todo => {
                if (!todo.done && todo.notificationTime) {
                    const now = new Date();
                    const [hours, minutes] = todo.notificationTime.split(":");
                    const taskTime = new Date(year, month, dayNum, hours, minutes);
                    const diff = taskTime - now;
                    return diff > 0 && diff < 30 * 60 * 1000;
                }
                return false;
            });
            
            if (hasUrgent) {
                day.classList.add("has-urgent");
            }
        }

        const today = new Date();
        if (
            dayNum === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            day.classList.add("today");
        }
        
        day.addEventListener("click", () => openTodo(year, month, dayNum));
        
        weekView.appendChild(day);
    }
}

function openTodo(year, month, day) {
    selectedDate = `${year}-${month + 1}-${day}`;
    selectedDateTitle.textContent = `📝 Tarefas de ${day}/${month + 1}/${year}`;
    todoPanel.classList.remove("hidden");
    loadTodos();
}

function loadTodos() {
    todoListEl.innerHTML = "";
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const items = todos[selectedDate] || [];

    items.forEach((todo) => {
        const li = document.createElement("li");
        
        const textSpan = document.createElement("span");
        textSpan.textContent = todo.text;
        
        const rightSide = document.createElement("div");
        rightSide.style.display = "flex";
        rightSide.style.alignItems = "center";
        rightSide.style.gap = "10px";
        
        if (todo.notificationTime) {
            const timeSpan = document.createElement("span");
            timeSpan.classList.add("todo-time");
            timeSpan.textContent = `🔔 ${todo.notificationTime}`;
            rightSide.appendChild(timeSpan);
        }
        
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "🗑️";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteTodo(todo.id);
        });
        
        rightSide.appendChild(deleteBtn);
        
        if (todo.done) li.classList.add("done");

        li.appendChild(textSpan);
        li.appendChild(rightSide);
        
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

    if (notificationsEnabled) {
        scheduleNotifications();
    }
}

function toggleTodo(id) {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    const items = todos[selectedDate];
    const item = items.find((t) => t.id === id);
    item.done = !item.done;
    localStorage.setItem("todos", JSON.stringify(todos));
    loadTodos();
    checkUrgentTasks();
}

function deleteTodo(id) {
    const todos = JSON.parse(localStorage.getItem("todos") || "{}");
    todos[selectedDate] = todos[selectedDate].filter((t) => t.id !== id);
    localStorage.setItem("todos", JSON.stringify(todos));
    loadTodos();
    loadView();
}

addTodoBtn.addEventListener("click", addTodo);
todoText.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTodo();
});

closeTodoBtn.addEventListener("click", () => {
    todoPanel.classList.add("hidden");
});

prevBtn.addEventListener("click", () => {
    if (viewMode === "month") {
        currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
        currentDate.setDate(currentDate.getDate() - 7);
    }
    loadView();
});

nextBtn.addEventListener("click", () => {
    if (viewMode === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
        currentDate.setDate(currentDate.getDate() + 7);
    }
    loadView();
});

// Initialize
loadView();

if (Notification.permission === "granted") {
    notificationsEnabled = true;
    enableNotificationsBtn.textContent = "✅ Lembretes Ativos";
    enableNotificationsBtn.style.background = "#10b981";
    scheduleNotifications();
}

// Verifica tarefas urgentes a cada minuto
setInterval(checkUrgentTasks, 60000);
