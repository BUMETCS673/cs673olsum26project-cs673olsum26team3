BACKEND SETUP

Step 1: Open Terminal/Command Prompt and navigate to backend folder
cmd: cd path/to/backend
Note: Use backslashes () on Windows and forward slashes (/) on Mac

Step 2: Initialize project
cmd: npm init -y

Step 3: Install backend libraries
cmd: npm install express multer pdf-parse pdf-parse-fork tesseract.js cors

Step 4: Create server file
Action: Create server.js file in this folder

Step 5: Start backend server
cmd: node server.js

FRONTEND SETUP

Step 1: Open a new Terminal window and navigate to frontend folder
cmd: cd path/to/frontend

Step 2: Initialize React Vite project
cmd: npm create vite@latest . -- --template react

Step 3: Install icon library
cmd: npm install lucide-react

Step 4: Build interface
Action: Edit App.jsx and App.css files

Step 5: Start frontend development server
cmd: npm run dev

HOW TO RUN DOCK
- Keep both terminals open at the same time:
- Terminal 1: Run "node server.js" to keep backend active
- Terminal 2: Run "npm run dev" to keep frontend active
