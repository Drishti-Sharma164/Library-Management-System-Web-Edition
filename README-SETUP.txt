# LIBRARY MANAGEMENT SYSTEM – WEB EDITION
## Installation and Setup Guide

### 1. Overview

This package extends the existing C++ Library Management System by introducing a browser-based interface powered by the **Crow C++ web framework**.

The web edition is designed to integrate with the existing application without replacing its original implementation or modifying its core library management logic.

### 2. Package Contents

The following files are included in this package:

| File | Description |
|---|---|
| `backend/include/Library.h` | Adds three read-only collection accessors to the existing Library class. |
| `backend/src/web_server.cpp` | Implements the Crow-based web server and JSON API endpoints. |
| `frontend/index.html` | Defines the dashboard and application interface. |
| `frontend/style.css` | Provides the application's visual styling and layout. |
| `frontend/script.js` | Handles browser-side interactions and API communication. |

### 3. One-Time Installation

Before extracting the package, follow these steps:

1. Stop the currently running web server. If `web_server.exe` is active, press `Ctrl + C` in its terminal.
2. Create a backup of your existing `Library_web_app` project folder.
3. Extract the ZIP package into the existing `Library_web_app` directory.
4. If Windows prompts you to replace `backend/include/Library.h`, select **Replace**. The updated file retains the existing interface and adds only three read-only getter methods.
5. Allow the package to create or replace the following files:
   - `backend/src/web_server.cpp`
   - `frontend/index.html`
   - `frontend/style.css`
   - `frontend/script.js`

**Important:** Do not replace or overwrite the original `backend/src/main.cpp`. The console-based application must remain intact.

### 4. Compilation

Open PowerShell and navigate to the backend directory:

```powershell
cd C:\Users\hp\Downloads\Library_web_app\backend
```

Compile the web server using the following command:

```powershell
g++ -std=c++17 -Iinclude -IC:\msys64\ucrt64\include src/web_server.cpp src\Book.cpp src\Library.cpp src\Librarian.cpp src\Transaction.cpp src\FileManager.cpp src\Student.cpp -o web_server.exe -lws2_32 -lmswsock
```

If compilation completes successfully, the executable `web_server.exe` will be generated in the backend directory.

### 5. Running the Application

Start the web server from the backend directory:

```powershell
.\web_server.exe
```

Once the server is running, open the following address in your web browser:

**http://localhost:18080**

The web interface will connect to the C++ backend through the configured API endpoints.

### 6. Important Operational Notes

- Always launch `web_server.exe` while the current working directory is the `backend` folder.
- The web application uses the existing files in `backend/data` for persistent storage.
- No sample records are automatically inserted during installation.
- If the data files are empty, the dashboard will initially display zero records. Books and student records can be added through the web interface.
- The original console-based application remains independent and can still be compiled and executed separately.
- Keep the server terminal running while accessing the web application.
- To stop the server, press `Ctrl + C` in the terminal.

### 7. Library Management Rules

The web edition follows the existing business rules implemented in the C++ `Library` class:

| Rule | Description |
|---|---|
| Maximum borrowing limit | A student may hold a maximum of 3 books at a time. |
| Loan duration | The standard borrowing period is 14 days. |
| Late return fine | A fine of ₹2 per day is charged for overdue books. |
| Book deletion | A book cannot be deleted while it is currently issued. |
| Student deletion | A student cannot be deleted while they have outstanding issued books. |

### 8. Project Architecture

The application consists of three main components:

- **C++ Backend:** Manages library operations, application logic, data processing and file-based storage.
- **Crow Web Server:** Handles HTTP requests and exposes backend functionality through JSON API endpoints.
- **Frontend:** Uses HTML, CSS and JavaScript to provide an interactive browser-based interface.

These components work together to provide a web-based experience while preserving the original C++ library management functionality.

---

**Project:** Library Management System – Web Edition  
**Technology Stack:** C++, Crow, Asio, HTML, CSS and JavaScript  
**Storage:** File-based data persistence
