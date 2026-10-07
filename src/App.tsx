import { useEffect, useState } from "react";
import "./App.css";

type Expense = {
  id: number;
  description: string;
  amount: number;
};

type Task = {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
};

type ActiveTab = "expenses" | "tasks";
type TaskFilter = "all" | "open" | "completed";

const STORAGE_KEY = "expense-tracker-data";
const TASKS_STORAGE_KEY = "expense-tracker-tasks";

type StoredData = {
  baselineSalary: number;
  expenses: Expense[];
};

function loadSavedData(): StoredData {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return { baselineSalary: 19000, expenses: [] };
  }

  try {
    const data = JSON.parse(savedData);
    return {
      baselineSalary:
        typeof data.baselineSalary === "number" ? data.baselineSalary : 19000,
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
    };
  } catch {
    console.error("Unable to load saved expense data.");
    return { baselineSalary: 19000, expenses: [] };
  }
}

function loadSavedTasks(): Task[] {
  const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!savedTasks) return [];

  try {
    const data: unknown = JSON.parse(savedTasks);
    if (!Array.isArray(data)) return [];

    return data.flatMap((savedTask): Task[] => {
      if (typeof savedTask !== "object" || savedTask === null) return [];
      const task = savedTask as Record<string, unknown>;
      if (
        typeof task.id !== "string" ||
        typeof task.title !== "string" ||
        typeof task.dueDate !== "string" ||
        typeof task.completed !== "boolean"
      ) return [];

      return [{
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        dueTime: typeof task.dueTime === "string" ? task.dueTime : "",
        completed: task.completed,
      }];
    });
  } catch {
    console.error("Unable to load saved task data.");
    return [];
  }
}

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatTaskSchedule = (task: Task) => {
  const date = task.dueDate
    ? `Due ${new Date(`${task.dueDate}T00:00:00`).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`
    : "";
  const time = task.dueTime
    ? new Date(`1970-01-01T${task.dueTime}:00`).toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    })
    : "";

  return [date, time].filter(Boolean).join(" · ");
};

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("expenses");
  const [initialData] = useState(loadSavedData);
  const [baselineSalary, setBaselineSalary] = useState(initialData.baselineSalary);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [tasks, setTasks] = useState<Task[]>(loadSavedTasks);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const currentPeriod = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ baselineSalary, expenses }));
  }, [baselineSalary, expenses]);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const totalSpent = expenses.reduce((total, expense) => total + expense.amount, 0);
  const remainingFunds = baselineSalary - totalSpent;
  const spendingPercent = baselineSalary > 0
    ? Math.min((totalSpent / baselineSalary) * 100, 100)
    : totalSpent > 0 ? 100 : 0;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const openTasks = tasks.length - completedTasks;
  const visibleTasks = tasks.filter((task) => {
    if (taskFilter === "open") return !task.completed;
    if (taskFilter === "completed") return task.completed;
    return true;
  });

  const handleAddExpense = () => {
    const parsedAmount = Number(amount);
    if (!description.trim() || parsedAmount <= 0) return;

    setExpenses((currentExpenses) => [
      ...currentExpenses,
      { id: Date.now(), description: description.trim(), amount: parsedAmount },
    ]);
    setDescription("");
    setAmount("");
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses((currentExpenses) => currentExpenses.filter((expense) => expense.id !== id));
  };

  const handleClearExpenses = () => {
    if (expenses.length === 0) return;

    const confirmed = window.confirm(
      `Clear all ${expenses.length} expense${expenses.length === 1 ? "" : "s"}? This will remove the records from this browser.`,
    );

    if (confirmed) setExpenses([]);
  };

  const handleAddTask = () => {
    const title = taskTitle.trim();
    if (!title) return;

    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        dueDate: taskDueDate,
        dueTime: taskDueTime,
        completed: false,
      },
    ]);
    setTaskTitle("");
    setTaskDueDate("");
    setTaskDueTime("");
  };

  const handleToggleTask = (id: string) => {
    setTasks((currentTasks) => currentTasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    ));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  };

  const handleClearCompletedTasks = () => {
    if (completedTasks === 0) return;

    const confirmed = window.confirm(
      `Clear all ${completedTasks} completed task${completedTasks === 1 ? "" : "s"}? This will remove them from this browser.`,
    );

    if (confirmed) setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));
  };

  return (
    <div className={`app${activeTab === "tasks" ? " tasks-mode" : ""}`}>
      <header className="header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              {activeTab === "expenses" ? (
                <>
                  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H20v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
                  <path d="M4 8h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4M15 10.5h4" />
                  <circle cx="15.5" cy="12" r=".7" />
                </>
              ) : (
                <>
                  <rect x="4.5" y="5" width="15" height="15" rx="3" />
                  <path d="m8 12 2.2 2.2L16.5 8" />
                </>
              )}
            </svg>
          </div>
          <div className="brand-copy">
            <span className="page-eyebrow"><span aria-hidden="true" /> Everyday Tracker</span>
            <h1>{activeTab === "expenses" ? "Expense Tracker" : "Task Tracker"}</h1>
            <p>{activeTab === "expenses" ? "Keep your spending in balance." : "Keep your plans moving forward."}</p>
          </div>
        </div>

        {activeTab === "expenses" ? (
          <div className="salary-control">
            <div className="salary-heading">
              <label htmlFor="salary">Monthly baseline</label>
              <span className="period-badge">{currentPeriod}</span>
            </div>
            <div className="salary-input">
              <span aria-hidden="true">₱</span>
              <input
                id="salary"
                type="number"
                min="0"
                step="0.01"
                value={baselineSalary}
                onChange={(event) => setBaselineSalary(Number(event.target.value))}
              />
            </div>
          </div>
        ) : (
          <span className="period-badge tasks-period">{currentPeriod}</span>
        )}
      </header>

      <nav className="view-tabs" aria-label="Tracker views">
        <button
          className={activeTab === "expenses" ? "view-tab active" : "view-tab"}
          type="button"
          onClick={() => setActiveTab("expenses")}
          aria-current={activeTab === "expenses" ? "page" : undefined}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H17v12H5.5A2.5 2.5 0 0 1 3 13.5v-7Z" />
            <path d="M3 7h10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3m9-4h3" />
          </svg>
          Expenses
        </button>
        <button
          className={activeTab === "tasks" ? "view-tab active" : "view-tab"}
          type="button"
          onClick={() => setActiveTab("tasks")}
          aria-current={activeTab === "tasks" ? "page" : undefined}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3.5" y="3.5" width="13" height="13" rx="3" />
            <path d="m6.5 10 2.2 2.2 4.8-5" />
          </svg>
          Tasks
        </button>
      </nav>

      {activeTab === "expenses" ? (
        <main className="content">
          <section className="summary" aria-label="Expense summary">
            <div className={`summary-card balance-card${remainingFunds < 0 ? " over-budget" : ""}`}>
              <div className="summary-topline">
                <span className="summary-label">Remaining balance</span>
                <span className="budget-status">
                  <span className="status-dot" aria-hidden="true" />
                  {remainingFunds < 0 ? "Over budget" : "On track"}
                </span>
              </div>
              <strong>{formatCurrency(remainingFunds)}</strong>
              <span className="summary-context">of {formatCurrency(baselineSalary)} monthly income</span>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Monthly income spent"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(spendingPercent)}
              >
                <span style={{ width: `${spendingPercent}%` }} />
              </div>
              <span className="progress-caption">{Math.round(spendingPercent)}% of income used</span>
            </div>

            <div className="summary-card spent-card">
              <span className="summary-label">Total spent</span>
              <strong>{formatCurrency(totalSpent)}</strong>
              <span className="summary-context">Across {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}</span>
            </div>
          </section>

          <section className="dashboard">
            <div className="card expense-form">
              <div className="section-heading">
                <span className="heading-icon" aria-hidden="true">＋</span>
                <div>
                  <h2>Add an expense</h2>
                  <p>Record a new purchase or bill.</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Expense detail</label>
                <input
                  id="description"
                  type="text"
                  placeholder="e.g., Internet bill"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAddExpense();
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <div className="amount-input">
                  <span aria-hidden="true">₱</span>
                  <input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleAddExpense();
                    }}
                  />
                  <span className="currency-code">PHP</span>
                </div>
              </div>

              <button className="add-button" type="button" onClick={handleAddExpense}>
                <span aria-hidden="true">＋</span> Add expense
              </button>
            </div>

            <div className="card expense-list">
              <div className="card-header">
                <div>
                  <h2>Expense record</h2>
                  <p>Your latest spending activity</p>
                </div>
                <div className="list-actions">
                  <span className="item-count">{expenses.length} {expenses.length === 1 ? "item" : "items"}</span>
                  {expenses.length > 0 && (
                    <button className="clear-button" type="button" onClick={handleClearExpenses}>
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none">
                      <path d="M10 14.5A4.5 4.5 0 0 1 14.5 10H38v28H14.5A4.5 4.5 0 0 1 10 33.5v-19Z" />
                      <path d="M10 16h21a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5H10" />
                      <circle cx="28" cy="24" r="2" />
                    </svg>
                  </div>
                  <p>No expenses yet</p>
                  <span>Your spending entries will appear here.</span>
                </div>
              ) : (
                <div className="expense-items">
                  {expenses.map((expense, index) => (
                    <div className="expense-item" key={expense.id}>
                      <div className="expense-description">
                        <span className={`expense-dot expense-color-${index % 4}`} aria-hidden="true">
                          <svg viewBox="0 0 20 20" fill="none">
                            <path d="M5 3.5h7l3 3v10H5v-13Z" />
                            <path d="M12 3.5v3h3M7.5 10h5M7.5 13h5" />
                          </svg>
                        </span>
                        <strong>{expense.description}</strong>
                      </div>
                      <div className="expense-item-right">
                        <span>{formatCurrency(expense.amount)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                          aria-label={`Delete ${expense.description}`}
                        >
                          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M4.5 6h11M8 6V4.5h4V6m2 0-.6 9.5H6.6L6 6m2.5 2.5v4.5m3-4.5v4.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      ) : (
        <main className="content">
          <section className="summary task-summary" aria-label="Task summary">
            <div className="summary-card task-summary-card">
              <span className="summary-label">Open tasks</span>
              <strong>{openTasks}</strong>
              <span className="summary-context">Ready when you are</span>
            </div>
            <div className="summary-card task-summary-card completed-summary-card">
              <span className="summary-label">Completed</span>
              <strong>{completedTasks}</strong>
              <span className="summary-context">{tasks.length === 0 ? "Your progress starts here" : `Out of ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}</span>
            </div>
          </section>

          <section className="dashboard">
            <div className="card task-form">
              <div className="section-heading">
                <span className="heading-icon" aria-hidden="true">＋</span>
                <div>
                  <h2>Add a task</h2>
                  <p>Make a little progress today.</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-title">Task</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g., Prepare presentation"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleAddTask();
                  }}
                />
              </div>

              <div className="task-schedule-fields">
                <div className="form-group">
                  <label htmlFor="task-due-date">Due date <span className="optional-label">Optional</span></label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={taskDueDate}
                    onChange={(event) => setTaskDueDate(event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="task-due-time">Time <span className="optional-label">Optional</span></label>
                  <input
                    id="task-due-time"
                    type="time"
                    value={taskDueTime}
                    onChange={(event) => setTaskDueTime(event.target.value)}
                  />
                </div>
              </div>

              <button className="add-button" type="button" onClick={handleAddTask}>
                <span aria-hidden="true">＋</span> Add task
              </button>
            </div>

            <div className="card task-list">
              <div className="card-header task-card-header">
                <div>
                  <h2>Your tasks</h2>
                  <p>One step at a time.</p>
                </div>
                <div className="list-actions">
                  <span className="item-count">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
                  {completedTasks > 0 && (
                    <button className="clear-button" type="button" onClick={handleClearCompletedTasks}>
                      Clear completed
                    </button>
                  )}
                </div>
              </div>

              <div className="task-filters" role="group" aria-label="Filter tasks">
                {(["all", "open", "completed"] as TaskFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={taskFilter === filter ? "task-filter active" : "task-filter"}
                    onClick={() => setTaskFilter(filter)}
                    aria-pressed={taskFilter === filter}
                  >
                    {filter === "all" ? "All" : filter === "open" ? "Open" : "Completed"}
                  </button>
                ))}
              </div>

              {tasks.length === 0 ? (
                <div className="empty-state task-empty-state">
                  <div className="empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none">
                      <rect x="9" y="8" width="30" height="32" rx="7" />
                      <path d="m16 20 4 4 9-9M16 32h16" />
                    </svg>
                  </div>
                  <p>No tasks yet</p>
                  <span>Add a task to give your day some direction.</span>
                </div>
              ) : visibleTasks.length === 0 ? (
                <div className="filtered-empty">No {taskFilter} tasks to show.</div>
              ) : (
                <div className="task-items">
                  {visibleTasks.map((task) => (
                    <div className={`task-item${task.completed ? " task-completed" : ""}`} key={task.id}>
                      <label className="task-check">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          aria-label={`${task.completed ? "Mark as open" : "Complete"}: ${task.title}`}
                        />
                        <span className="checkmark" aria-hidden="true" />
                      </label>
                      <div className="task-copy">
                        <strong>{task.title}</strong>
                        {(task.dueDate || task.dueTime) && (
                          <span className="task-due-date">
                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
                              <path d="M5.5 2v3M10.5 2v3M2.5 6.5h11M8 8.5v2l1.5 1" />
                            </svg>
                            {formatTaskSchedule(task)}
                          </span>
                        )}
                      </div>
                      <button
                        className="task-delete"
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        aria-label={`Delete task: ${task.title}`}
                      >
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="M4.5 6h11M8 6V4.5h4V6m2 0-.6 9.5H6.6L6 6m2.5 2.5v4.5m3-4.5v4.5" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      )}
      <footer className="footer-note">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5.5 9V6a4.5 4.5 0 0 1 9 0v3M4 9h12v8H4V9Z" />
          <circle cx="10" cy="13" r="1" />
        </svg>
        <span>Your {activeTab === "expenses" ? "expense" : "task"} data stays in this browser.</span>
        <span className="footer-credit">Created by Lester Osana</span>
      </footer>
    </div>
  );
}

export default App;
