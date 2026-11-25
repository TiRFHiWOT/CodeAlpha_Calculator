# CodeAlpha — Task 2: Calculator

Basic calculator built with plain HTML, CSS and JavaScript — no frameworks.

## Files
- `index.html` — display screen and buttons
- `styles.css` — blue theme (deep navy dark mode, soft pale blue light mode), Poppins, flat, no gradients or shadows
- `script.js` — input handling and calculation (no `eval()`; the expression is parsed with the shunting-yard algorithm)

## Features
- All arithmetic operations: + − × ÷
- Display screen showing the expression, with a **live result** underneath as you type (real-time result display)
- Clear (C), backspace (⌫), percent (%), plus/minus (±)
- Divide by zero shows "Can't divide by 0"
- Keyboard support: digits, `+ - * /`, `.`, `%`, `(`, `)`, Enter / `=` to calculate, Esc to clear, Backspace to delete
- Brackets `( )` for longer sums, e.g. (2 + 3) × 4
- Memory: M+ saves the current value, MR recalls it, MC clears it (an M badge shows while a value is stored)
- Copy result: the ⧉ button copies the answer
- History: the clock button in the top bar opens your recent calculations — tap one to bring its answer back, Clear empties the list. History and memory are saved in the browser.
- Light / dark mode toggle, remembered in the browser
- Responsive: works on phone and desktop

## Run it
Open `index.html` in a browser, or serve the folder, e.g. `python3 -m http.server` and open http://localhost:8000

## Submission
GitHub repo name for CodeAlpha: `CodeAlpha_Calculator`
