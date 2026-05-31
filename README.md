# SpecCheck — AI-Powered Test Case Generator

> **CS673 Software Engineering | Team 3 Project**
>
> SpecCheck is a web tool that helps software teams save time on testing. Instead of writing tests by hand, users can upload product documents (like PDFs or images). The AI reads these files to understand the product, then automatically writes accurate test steps from a user story.

---

## 🚀 Key Features

### 👥 User Roles
*   **QA Engineer:** Can upload documents, generate test cases, and check the results.
*   **QA Lead:** Can do everything a QA Engineer does, plus see charts that show how new changes might impact old features.
*   **Developer:** Can view finished test cases to understand the rules before writing code.

### 🧠 Core Functions
*   **Document Upload & Memory:** Upload PDFs and images (PNG/JPEG). The system reads the text and saves it into a smart database so the AI can use it as background knowledge.
*   **Context Search:** When you type a user story, the app automatically finds the right information from your uploaded files to guide the AI.
*   **Smart Test Generation:** Creates 5 to 15 targeted tests (happy paths, bad inputs, and edge cases). You can edit, approve, or delete the tests before saving them.
*   **Document Dashboard:** View and manage your uploaded files. If you delete a file, the AI immediately forgets that information.
*   **Easy Export (Coming Soon):** Download test cases as CSV or Text files to import them directly into Jira or TestRail.

---

## 🛠️ Technology Stack

| Part | Tools Used |
| :--- | :--- |
| **Frontend** | JavaScript, HTML, CSS |
| **Backend** | Node.js / Express *(built to connect smoothly with Django setup)* |
| **Database** | MongoDB & Vector Database (for document memory) |
| **AI Tools** | OpenAI API / Claude API, `pdf-parse`, `Tesseract.js` (for reading image text) |
| **Management** | Jira, GitHub Issues |
| **Testing** | Playwright (for UI tests), PyTest (for backend tests) |

---

## 📐 Limits & Goals

### System Limits
*   Upload up to **10 files** at one time.
*   Each file must be smaller than **20 MB**.
*   Supported file formats: `.pdf`, `.png`, `.jpeg`.

### Speed Goals
*   Dashboard loading: Less than `2 seconds`.
*   File reading and saving: Less than `10 seconds per file`.
*   AI test generation: Less than `15 seconds`.

---

## 💻 Git & Code Rules

### 🌿 Branch Strategy
*   `main`: Safe code for live demos. We never write code directly here.
*   `development`: The main workplace. All features must be tested here first.
*   `feature/feature-name`: For working on a single task.
*   `bugfix/bug-name`: For fixing problems found during testing.

### 📝 Commit Message Labels
Every code save (commit) must start with one of these words so the team knows how the code was made:
*   `[HUMAN]` — Written 100% by a team member.
*   `[AI]` — Generated completely by an AI tool.
*   `[HYBRID]` — Written by a human and improved with AI help.

### 🔄 CI/CD Code Safety
*   We use **GitHub Actions** to automatically build and test the app every time someone wants to merge code.
*   Your code can only merge into the `development` branch if it **passes all tests** and gets at least **1 approval** from a teammate.

---

## 🧪 Running Unit Tests

Frontend unit tests use **Vitest** and **React Testing Library**.

```bash
cd test-case-generator/frontend
npm test
```

To run in watch mode during development:

```bash
npm run test:watch
```

The test suite covers the **Test Case Dashboard** feature:

| Test | What it checks |
| :--- | :--- |
| Initial render | All 10 mock test cases are displayed and stats bar shows correct counts |
| Search by title | Typing a keyword filters cards to only matching titles |
| Status filter | Selecting a status (e.g. Draft) shows only cards with that status |
| Archive toggle | Clicking Archive on an Active card switches the button to Restore |
| Delete with confirm | Confirming deletion removes the card and decreases the total count |

---

## 🔗 Project Links

*   **GitHub Repository:** [Team 3 Code](https://github.com/BUMETCS673/cs673olsum26project-cs673olsum26team3)
*   **Risk Sheet:** [Google Sheets Link](https://docs.google.com/spreadsheets/d/1TGf5X4D6LBQliZie8Sje-MLOzPqzJq3oUjNYyLj5sdw/edit?usp=sharing)
