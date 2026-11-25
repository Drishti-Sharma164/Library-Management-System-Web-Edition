FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    g++ \
    libasio-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY frontend ./frontend
COPY backend ./backend

WORKDIR /app/backend

RUN g++ -std=c++17 -O2 -pthread \
    -Iinclude \
    src/web_server.cpp \
    src/Book.cpp \
    src/Library.cpp \
    src/Librarian.cpp \
    src/Transaction.cpp \
    src/FileManager.cpp \
    src/Student.cpp \
    -o web_server

EXPOSE 10000

CMD ["./web_server"]
