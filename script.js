// CodeAlpha Task 2 — Calculator
// Plain HTML/CSS/JS. No eval(): the expression is parsed
// (shunting-yard) so only numbers and + − × ÷ % are ever run.

const expressionEl = document.getElementById("expression");
const liveResultEl = document.getElementById("liveResult");
const themeToggle = document.getElementById("themeToggle");
const memIndicator = document.getElementById("memIndicator");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");

let expression = "";
let justEvaluated = false;
let error = false;

// Memory and history survive a reload.
let memory = parseFloat(localStorage.getItem("calc-memory") || "0") || 0;
let historyItems = JSON.parse(localStorage.getItem("calc-history") || "[]");

// ---------- theme (same as the gallery: dark navy default, light pale blue) ----------
const savedTheme = localStorage.getItem("calc-theme");
if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
function syncThemeButton() {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  themeToggle.textContent = light ? "☾" : "☀";
}
syncThemeButton();
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("calc-theme", next);
  syncThemeButton();
});

// ---------- evaluation ----------
const OPS = { "+": 1, "−": 1, "×": 2, "÷": 2 };

function tokenize(expr) {
  const tokens = [];
  let num = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (/[0-9.]/.test(ch)) {
      num += ch;
    } else if (ch === "(" || ch === ")") {
      if (num !== "") { tokens.push(parseFloat(num.replace("−", "-"))); num = ""; }
      tokens.push(ch);
    } else if (ch in OPS) {
      // A minus at the start, or right after another operator, is a sign.
      if (ch === "−" && num === "" && (tokens.length === 0 || typeof tokens[tokens.length - 1] === "string")) {
        num = "−";
      } else {
        if (num !== "") { tokens.push(parseFloat(num.replace("−", "-"))); num = ""; }
        tokens.push(ch);
      }
    }
  }
  if (num !== "") tokens.push(parseFloat(num.replace("−", "-")));
  return tokens;
}

function evaluate(expr) {
  const tokens = tokenize(expr);
  if (!tokens.length) return null;
  if (tokens.some((t) => typeof t === "number" && Number.isNaN(t))) return null;
  if (typeof tokens[tokens.length - 1] === "string") return null; // ends with an operator

  // Shunting-yard: to reverse-Polish, then evaluate.
  const out = [];
  const stack = [];
  for (const t of tokens) {
    if (typeof t === "number") out.push(t);
    else if (t === "(") stack.push(t);
    else if (t === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop());
      if (!stack.length) return null; // unmatched close bracket
      stack.pop(); // drop the "("
    } else {
      while (stack.length && stack[stack.length - 1] !== "(" && OPS[stack[stack.length - 1]] >= OPS[t]) out.push(stack.pop());
      stack.push(t);
    }
  }
  while (stack.length) {
    if (stack[stack.length - 1] === "(") return null; // unmatched open bracket
    out.push(stack.pop());
  }

  const values = [];
  for (const t of out) {
    if (typeof t === "number") { values.push(t); continue; }
    const b = values.pop();
    const a = values.pop();
    if (a === undefined || b === undefined) return null;
    let r;
    if (t === "+") r = a + b;
    else if (t === "−") r = a - b;
    else if (t === "×") r = a * b;
    else if (t === "÷") {
      if (b === 0) throw new Error("divide-by-zero");
      r = a / b;
    }
    values.push(r);
  }
  return values[0];
}

function format(n) {
  if (!isFinite(n)) throw new Error("divide-by-zero");
  return String(parseFloat(n.toFixed(10)));
}

// ---------- display ----------
function render() {
  expressionEl.classList.toggle("error", error);
  expressionEl.textContent = error ? "Can't divide by 0" : (expression || "0");
  if (error || !expression) { liveResultEl.textContent = ""; return; }
  // Live (real-time) result: only once there is a complete operation to show.
  const balanced = (expression.match(/\(/g) || []).length === (expression.match(/\)/g) || []).length;
  if (/[0-9%)]$/.test(expression) && /[+−×÷]/.test(expression) && balanced) {
    try {
      const result = evaluate(expression);
      liveResultEl.textContent = result === null ? "" : "= " + format(result);
    } catch (e) { liveResultEl.textContent = ""; }
  } else {
    liveResultEl.textContent = "";
  }
}

function lastNumber() {
  const m = expression.match(/([0-9.]+)$/);
  return m ? m[1] : "";
}

// ---------- input ----------
function inputDigit(ch) {
  if (error) { expression = ""; error = false; }
  if (justEvaluated) { expression = ""; justEvaluated = false; }
  if (ch === "." && lastNumber().includes(".")) return;
  if (ch === "." && lastNumber() === "") expression += "0";
  if (expression.endsWith(")")) expression += "×"; // (2+3)4 means (2+3) × 4
  expression += ch;
  render();
}

function inputOperator(op) {
  if (error) { expression = ""; error = false; }
  if (expression === "") {
    if (op === "−") expression = "−";
    render();
    return;
  }
  if (justEvaluated) justEvaluated = false;
  const last = expression[expression.length - 1];
  if (last in OPS) {
    // Allow "× −3": a minus after an operator starts a negative number.
    if (op === "−" && last !== "−") { expression += "−"; render(); return; }
    expression = expression.slice(0, -1) + op;
  } else {
    expression += op;
  }
  render();
}

function inputPercent() {
  const num = lastNumber();
  if (!num) return;
  expression = expression.slice(0, -num.length) + format(parseFloat(num) / 100);
  render();
}

function inputNegate() {
  const num = lastNumber();
  if (!num) return;
  const before = expression.slice(0, -num.length);
  // A trailing "−" before the number is its sign: drop it to make it positive.
  expression = before.endsWith("−")
    ? before.slice(0, -1) + num
    : before + "−" + num;
  render();
}

function inputBackspace() {
  if (error) { expression = ""; error = false; render(); return; }
  expression = expression.slice(0, -1);
  justEvaluated = false;
  render();
}

function inputClear() {
  expression = "";
  error = false;
  justEvaluated = false;
  render();
}

function inputEquals() {
  if (!expression || error) return;
  try {
    const result = evaluate(expression);
    if (result === null) return;
    addToHistory(expression, format(result));
    expression = format(result);
    justEvaluated = true;
    render();
  } catch (e) {
    error = true;
    render();
  }
}

// ---------- brackets ----------
function openBrackets() { return (expression.match(/\(/g) || []).length; }
function closeBrackets() { return (expression.match(/\)/g) || []).length; }

function inputBracket(b) {
  if (error) { expression = ""; error = false; }
  if (justEvaluated) { expression = ""; justEvaluated = false; }
  if (b === "(") {
    const last = expression[expression.length - 1];
    if (/[0-9)]/.test(last || "")) expression += "×"; // 2(3) means 2 × (3)
    expression += "(";
  } else {
    const last = expression[expression.length - 1];
    if (openBrackets() <= closeBrackets()) return;
    if (!/[0-9)]/.test(last || "")) return;
    expression += ")";
  }
  render();
}

// ---------- memory ----------
function syncMemIndicator() { memIndicator.hidden = memory === 0; }

function currentValue() {
  if (!expression || error) return null;
  try {
    const v = evaluate(expression);
    return v === null ? null : v;
  } catch (e) { return null; }
}

function memAdd() {
  const v = currentValue();
  if (v === null) return;
  memory = parseFloat((memory + v).toFixed(10));
  localStorage.setItem("calc-memory", String(memory));
  syncMemIndicator();
}

function memRecall() {
  if (memory === 0) return;
  if (error) { expression = ""; error = false; }
  if (justEvaluated || expression === "") { expression = String(memory); justEvaluated = false; render(); return; }
  const last = expression[expression.length - 1];
  expression += /[0-9)]/.test(last || "") ? "×" + memory : String(memory);
  render();
}

function memClear() {
  memory = 0;
  localStorage.setItem("calc-memory", "0");
  syncMemIndicator();
}

// ---------- history ----------
function addToHistory(expr, result) {
  historyItems = [{ expr, result }, ...historyItems.filter((h) => h.expr !== expr)].slice(0, 8);
  localStorage.setItem("calc-history", JSON.stringify(historyItems));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  historyEmpty.hidden = historyItems.length > 0;
  historyItems.forEach((h) => {
    const li = document.createElement("li");
    const left = document.createElement("span");
    left.textContent = h.expr;
    const right = document.createElement("span");
    right.textContent = "= " + h.result;
    li.append(left, right);
    li.addEventListener("click", () => {
      expression = h.result;
      justEvaluated = true;
      error = false;
      render();
    });
    historyList.appendChild(li);
  });
}

// ---------- copy result ----------
function copyResult(btn) {
  if (error || !expression) return;
  let text = expression;
  const live = liveResultEl.textContent;
  if (!justEvaluated && live.startsWith("= ")) text = live.slice(2);
  const done = () => {
    const old = btn.textContent;
    btn.textContent = "✓";
    setTimeout(() => { btn.textContent = old; }, 1000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}

function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { /* clipboard unavailable */ }
  document.body.removeChild(ta);
}

// Buttons
document.querySelectorAll("[data-num]").forEach((btn) =>
  btn.addEventListener("click", () => inputDigit(btn.dataset.num))
);
document.querySelectorAll("[data-op]").forEach((btn) =>
  btn.addEventListener("click", () => inputOperator(btn.dataset.op))
);
document.querySelectorAll("[data-action]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const a = btn.dataset.action;
    if (a === "clear") inputClear();
    else if (a === "backspace") inputBackspace();
    else if (a === "percent") inputPercent();
    else if (a === "negate") inputNegate();
    else if (a === "equals") inputEquals();
    else if (a === "mem-add") memAdd();
    else if (a === "mem-recall") memRecall();
    else if (a === "mem-clear") memClear();
    else if (a === "copy") copyResult(btn);
  })
);
document.querySelectorAll("[data-bracket]").forEach((btn) =>
  btn.addEventListener("click", () => inputBracket(btn.dataset.bracket))
);
document.getElementById("historyToggle").addEventListener("click", () => {
  historyPanel.hidden = !historyPanel.hidden;
});
document.getElementById("historyClear").addEventListener("click", () => {
  historyItems = [];
  localStorage.setItem("calc-history", "[]");
  renderHistory();
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  if (/^[0-9.]$/.test(e.key)) { inputDigit(e.key); }
  else if (e.key === "+") inputOperator("+");
  else if (e.key === "-") inputOperator("−");
  else if (e.key === "*") inputOperator("×");
  else if (e.key === "/") { e.preventDefault(); inputOperator("÷"); }
  else if (e.key === "%") inputPercent();
  else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); inputEquals(); }
  else if (e.key === "Escape") inputClear();
  else if (e.key === "Backspace") inputBackspace();
  else if (e.key === "(" || e.key === ")") inputBracket(e.key);
});

syncMemIndicator();
renderHistory();
render();
