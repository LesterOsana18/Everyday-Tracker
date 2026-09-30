import { useEffect, useState } from "react";
import "./App.css";

type Expense = {
  id: number;
  description: string;
  amount: number;
};

const STORAGE_KEY = "expense-tracker-data";

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

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function App() {
  const [initialData] = useState(loadSavedData);
  const [baselineSalary, setBaselineSalary] = useState(initialData.baselineSalary);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const currentPeriod = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ baselineSalary, expenses }));
  }, [baselineSalary, expenses]);

  const totalSpent = expenses.reduce((total, expense) => total + expense.amount, 0);
  const remainingFunds = baselineSalary - totalSpent;
  const spendingPercent = baselineSalary > 0
    ? Math.min((totalSpent / baselineSalary) * 100, 100)
    : totalSpent > 0 ? 100 : 0;

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

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H20v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
              <path d="M4 8h13a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4M15 10.5h4" />
              <circle cx="15.5" cy="12" r=".7" />
            </svg>
          </div>
          <div className="brand-copy">
            <span className="page-eyebrow"><span aria-hidden="true" /> Overview</span>
            <h1>Expense Tracker</h1>
            <p>Keep your spending in balance.</p>
          </div>
        </div>

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
      </header>

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

      <footer className="footer-note">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5.5 9V6a4.5 4.5 0 0 1 9 0v3M4 9h12v8H4V9Z" />
          <circle cx="10" cy="13" r="1" />
        </svg>
        <span>Your expense data stays in this browser.</span>
        <span className="footer-credit">Created by Lester Osana</span>
      </footer>
    </div>
  );
}

export default App;
