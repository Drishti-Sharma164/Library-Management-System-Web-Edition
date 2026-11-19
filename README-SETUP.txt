LIBRARY WEB APP - ONE-TIME SETUP
================================

This package adds a Crow-based web interface to your existing C++ Library Management System.
It does NOT replace your original src/main.cpp or rewrite your existing library logic.

FILES INCLUDED
--------------
backend/include/Library.h   Adds three read-only collection accessors.
backend/src/web_server.cpp  Crow web server and JSON API.
frontend/index.html         Dashboard and application pages.
frontend/style.css          Navy sidebar / light dashboard styling.
frontend/script.js          Browser-side actions and API calls.

BEFORE YOU EXTRACT
------------------
1. Close the currently running web_server.exe (in its terminal press Ctrl+C).
2. Make a backup copy of your existing Library_web_app folder.
3. Extract this ZIP into the Library_web_app folder.
4. If Windows asks whether to replace backend/include/Library.h, choose Replace.
   It is the same Library.h interface with only three read-only getters added.
5. The package creates/replaces backend/src/web_server.cpp and the three frontend files.
6. Do NOT replace src/main.cpp.

COMPILE
-------
Open PowerShell and run:

cd C:\Users\hp\Downloads\Library_web_app\backend

g++ -std=c++17 -Iinclude -IC:\msys64\ucrt64\include src\web_server.cpp src\Book.cpp src\Library.cpp src\Librarian.cpp src\Transaction.cpp src\FileManager.cpp src\Student.cpp -o web_server.exe -lws2_32 -lmswsock

If compilation succeeds, start the server:

.\web_server.exe

Then open:
http://localhost:18080

IMPORTANT
---------
- Always launch web_server.exe while the current folder is backend.
- The web app reads and writes the existing backend/data files.
- It does not automatically add sample records.
- If backend/data is empty, the dashboard will show zero records. Add books and students through the web app.
- Your existing console application remains separate and can still be compiled/run as before.
- Keep the server terminal open while using the website. Press Ctrl+C to stop it.

LIBRARY RULES
-------------
The web interface uses your existing Library class rules:
- A student can hold up to 3 books.
- Loan duration is 14 days.
- Late fine is Rs. 2 per day.
- A currently issued book cannot be deleted.
- A student who still holds books cannot be deleted.
