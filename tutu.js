document.addEventListener("DOMContentLoaded", () => {
  const reminderList = document.getElementById("reminderList");
  const taskTextInput = document.getElementById("taskText");
  const taskTimeInput = document.getElementById("taskTime");
  const addTaskButton = document.getElementById("addTask");
  const newReminderButton = document.getElementById("newReminder");
  const modal = document.getElementById("taskModal");
  const closeModalButton = document.querySelector(".modal .close");

  // Check if the browser supports notifications
  if ("Notification" in window && navigator.serviceWorker) {
    Notification.requestPermission();
  }

  // Load tasks from local storage
  loadTasks();

  newReminderButton.addEventListener("click", () => {
    modal.style.display = "block";
    console.log("Adding a new task.");
  });

  closeModalButton.addEventListener("click", () => {
    modal.style.display = "none";
    console.log("Task addition canceled.");
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
      console.log("Task addition canceled.");
    }
  });

  addTaskButton.addEventListener("click", () => {
    const reminderText = taskTextInput.value.trim();
    const reminderTime = taskTimeInput.value;

    if (reminderText && reminderTime) {
      const currentTime = new Date();
      const [hours, minutes] = reminderTime
        .split(":")
        .map((num) => parseInt(num, 10));
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);

      if (reminderDate < currentTime) {
        alert("The selected time is in the past. Please choose a future time.");
        return;
      }

      addTask(reminderText, reminderDate.toISOString());
      taskTextInput.value = "";
      taskTimeInput.value = "";
      modal.style.display = "none";
      console.log("Task added.");
    }
  });

  reminderList.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-check")) {
      event.target.parentElement.style.textDecoration = "line-through";
      saveTasks();
    } else if (event.target.classList.contains("btn-delete")) {
      event.target.parentElement.remove();
      saveTasks();
    }
  });

  function sendNotification(reminderText) {
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("Reminder", {
          body: reminderText,
          icon: "icon.png", // Replace with your icon
        });
      });
    }
  }

  function addTask(reminderText, reminderTime) {
    const reminderItem = document.createElement("li");
    reminderItem.className = "reminder";
    new Date(reminderTime).toLocaleString()
    reminderItem.innerHTML = `
            <span class="text">${reminderText}</span>
            <button class="btn-check">✔</button>
            <button class="btn-delete">✖</button>
        `;
    reminderList.appendChild(reminderItem);

    // Schedule the notification
    const reminderDate = new Date(reminderTime);
    const timeUntilReminder = reminderDate.getTime() - Date.now();

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        sendNotification(reminderText);
      }, timeUntilReminder);
    }

    saveTasks();
  }

  function saveTasks() {
    const tasks = [];
    reminderList.querySelectorAll(".reminder").forEach((reminderItem) => {
      tasks.push({
        text: reminderItem.querySelector(".text").innerText,
        time: reminderItem.querySelector(".time").innerText,
        done: reminderItem.style.textDecoration === "line-through",
      });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("date", new Date().toDateString());
  }

  function loadTasks() {
    const savedDate = localStorage.getItem("date");
    const currentDate = new Date().toDateString();

    if (savedDate !== currentDate) {
      localStorage.removeItem("tasks");
      return;
    }

    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    tasks.forEach((task) => {
      const reminderItem = document.createElement("li");
      reminderItem.className = "reminder";
      reminderItem.innerHTML = `
                <span class="text">${task.text}</span>
                <button class="btn-check">✔</button>
                <span class="gap-tick"></span>
                <button class="btn-delete">✖</button>
            `;
      if (task.done) {
        reminderItem.style.textDecoration = "line-through";
      }
      reminderList.appendChild(reminderItem);
    });
  }
});

// Service Worker Registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function (registration) {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch(function (error) {
      console.log("Service Worker registration failed:", error);
    });
}
