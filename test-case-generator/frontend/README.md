# SpecCheck – Frontend

React + Vite frontend for the SpecCheck AI-powered test case generator.

## Running Unit Tests

### Frontend (Vitest + React Testing Library)

```powershell
cd test-case-generator/frontend
npm install
npm run test:run
```

Runs all 6 test files (97 tests) covering Login, ProjectsView, DocumentsView, UserStoryInputView, TestCasesView, and TestCaseManagementView.

To run in watch mode:

```powershell
npm run test
```

### Backend (Jest + Supertest)

```powershell
cd test-case-generator/backend
npm install
npm test
```

Runs all 5 test files (65 tests) covering login/register, projects CRUD, file upload, test generation, and test case management routes.

## Unit Test Files

| File | Tests | Description |
|------|-------|-------------|
| `frontend/src/__tests__/Login.test.jsx` | 15 | Login, register, forgot password flows |
| `frontend/src/__tests__/ProjectsView.test.jsx` | 13 | Project cards, new project modal, delete |
| `frontend/src/__tests__/DocumentsView.test.jsx` | 10 | Document list, upload zone, empty state |
| `frontend/src/__tests__/UserStoryInputView.test.jsx` | 17 | Form validation, checkboxes, API call |
| `frontend/src/__tests__/TestCasesView.test.jsx` | 16 | Test case table, search, row expansion, Create modal |
| `frontend/src/__tests__/TestCaseManagementView.test.jsx` | 24 | Filters, status pills, edit modal, clear filters |
| `backend/__tests__/login.test.js` | 15 | POST /login, /register, /change-password |
| `backend/__tests__/projects.test.js` | 11 | GET/POST/DELETE /projects with cascade delete |
| `backend/__tests__/upload.test.js` | 10 | File upload validation, PDF, GET docs, DELETE |
| `backend/__tests__/testGen.test.js` | 11 | AI/manual ID assignment, no-context warning |
| `backend/__tests__/testCaseManagement.test.js` | 14 | GET all, PATCH edit, archive toggle, DELETE |
