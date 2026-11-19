#include "crow.h"
#include "Library.h"

#ifdef DELETE
#undef DELETE
#endif

#include <fstream>
#include <iostream>
#include <memory>
#include <string>

static std::string readFile(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) return "";
    return std::string(std::istreambuf_iterator<char>(file), std::istreambuf_iterator<char>());
}

static crow::response jsonResponse(crow::json::wvalue value, int status = 200) {
    crow::response response(status);
    response.set_header("Content-Type", "application/json; charset=utf-8");
    response.body = value.dump();
    return response;
}

static crow::json::wvalue messageResponse(bool ok, const std::string& message) {
    crow::json::wvalue out;
    out["ok"] = ok;
    out["message"] = message;
    return out;
}

static std::string getString(const crow::json::rvalue& body, const char* key) {
    if (!body.has(key) || body[key].t() != crow::json::type::String) return "";
    return body[key].s();
}

static int getInt(const crow::json::rvalue& body, const char* key) {
    if (!body.has(key)) return 0;
    try {
        if (body[key].t() == crow::json::type::Number) return static_cast<int>(body[key].i());
        if (body[key].t() == crow::json::type::String) return std::stoi(body[key].s());
    } catch (...) {}
    return 0;
}

int main() {
    // Run this executable from the backend folder so "data" points to backend/data.
    Library library("data", true);
    library.load();

    crow::SimpleApp app;

    CROW_ROUTE(app, "/")([] {
        std::string page = readFile("../frontend/index.html");
        if (page.empty()) return crow::response(404, "Cannot find ../frontend/index.html");
        crow::response response(page);
        response.set_header("Content-Type", "text/html; charset=utf-8");
        return response;
    });

    CROW_ROUTE(app, "/style.css")([] {
        std::string css = readFile("../frontend/style.css");
        if (css.empty()) return crow::response(404, "Cannot find ../frontend/style.css");
        crow::response response(css);
        response.set_header("Content-Type", "text/css; charset=utf-8");
        return response;
    });

    CROW_ROUTE(app, "/script.js")([] {
        std::string js = readFile("../frontend/script.js");
        if (js.empty()) return crow::response(404, "Cannot find ../frontend/script.js");
        crow::response response(js);
        response.set_header("Content-Type", "application/javascript; charset=utf-8");
        return response;
    });

    CROW_ROUTE(app, "/api/dashboard")([&library] {
        int available = 0, issued = 0, overdue = 0;
        for (const auto& book : library.getBooks()) {
            if (book.isAvailable()) ++available;
            else ++issued;
        }
        for (const auto& txn : library.getTransactions())
            if (txn.isOverdueAsOf(Utils::todayDays())) ++overdue;

        crow::json::wvalue out;
        out["books"] = static_cast<int>(library.bookCount());
        out["students"] = static_cast<int>(library.studentCount());
        out["transactions"] = static_cast<int>(library.transactionCount());
        out["available"] = available;
        out["issued"] = issued;
        out["overdue"] = overdue;
        return jsonResponse(std::move(out));
    });

    CROW_ROUTE(app, "/api/books").methods(crow::HTTPMethod::GET)
    ([&library](const crow::request& req) {
        std::string query = req.url_params.get("q") ? req.url_params.get("q") : "";
        auto found = library.searchBooks(query);
        crow::json::wvalue::list list;
        for (const Book* book : found) {
            crow::json::wvalue item;
            item["id"] = book->getId();
            item["title"] = book->getTitle();
            item["author"] = book->getAuthor();
            item["category"] = book->getCategory();
            item["available"] = book->isAvailable();
            list.push_back(std::move(item));
        }
        crow::json::wvalue out;
        out["items"] = std::move(list);
        return jsonResponse(std::move(out));
    });

    CROW_ROUTE(app, "/api/books").methods(crow::HTTPMethod::POST)
    ([&library](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return jsonResponse(messageResponse(false, "Invalid JSON request."), 400);
        std::string title = getString(body, "title");
        std::string author = getString(body, "author");
        std::string category = getString(body, "category");
        if (title.empty() || author.empty() || category.empty())
            return jsonResponse(messageResponse(false, "Enter title, author and category."), 400);
        int id = library.addBook(title, author, category);
        auto out = messageResponse(true, "Book added successfully. Book ID: " + std::to_string(id));
        out["id"] = id;
        return jsonResponse(std::move(out), 201);
    });

    CROW_ROUTE(app, "/api/books/<int>").methods(crow::HTTPMethod::PUT)
    ([&library](const crow::request& req, int id) {
        auto body = crow::json::load(req.body);
        if (!body) return jsonResponse(messageResponse(false, "Invalid JSON request."), 400);
        Result result = library.updateBook(id, getString(body, "title"),
                                           getString(body, "author"), getString(body, "category"));
        return jsonResponse(messageResponse(result.ok, result.msg), result.ok ? 200 : 404);
    });

    CROW_ROUTE(app, "/api/books/<int>").methods(crow::HTTPMethod::DELETE)
    ([&library](int id) {
        Result result = library.removeBook(id);
        return jsonResponse(messageResponse(result.ok, result.msg), result.ok ? 200 : 400);
    });

    CROW_ROUTE(app, "/api/students").methods(crow::HTTPMethod::GET)
    ([&library] {
        crow::json::wvalue::list list;
        for (const auto& student : library.getStudents()) {
            crow::json::wvalue item;
            item["id"] = student.getId();
            item["name"] = student.getName();
            item["contact"] = student.getContact();
            item["issuedCount"] = student.issuedCount();
            list.push_back(std::move(item));
        }
        crow::json::wvalue out;
        out["items"] = std::move(list);
        return jsonResponse(std::move(out));
    });

    CROW_ROUTE(app, "/api/students").methods(crow::HTTPMethod::POST)
    ([&library](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return jsonResponse(messageResponse(false, "Invalid JSON request."), 400);
        std::string name = getString(body, "name");
        std::string contact = getString(body, "contact");
        if (name.empty() || contact.empty())
            return jsonResponse(messageResponse(false, "Enter student name and contact."), 400);
        int id = library.registerStudent(name, contact);
        return jsonResponse(messageResponse(true, "Student registered. Student ID: " + std::to_string(id)), 201);
    });

    CROW_ROUTE(app, "/api/students/<int>").methods(crow::HTTPMethod::PUT)
    ([&library](const crow::request& req, int id) {
        auto body = crow::json::load(req.body);
        if (!body) return jsonResponse(messageResponse(false, "Invalid JSON request."), 400);
        Result result = library.updateStudent(id, getString(body, "name"), getString(body, "contact"));
        return jsonResponse(messageResponse(result.ok, result.msg), result.ok ? 200 : 404);
    });

    CROW_ROUTE(app, "/api/students/<int>").methods(crow::HTTPMethod::DELETE)
    ([&library](int id) {
        Result result = library.deleteStudent(id);
        return jsonResponse(messageResponse(result.ok, result.msg), result.ok ? 200 : 400);
    });

    CROW_ROUTE(app, "/api/issue").methods(crow::HTTPMethod::POST)
    ([&library](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return jsonResponse(messageResponse(false, "Invalid JSON request."), 400);
        Result result = library.issueBook(getInt(body, "studentId"), getInt(body, "bookId"),
                                          getString(body, "date"));
        return jsonResponse(messageResponse(result.ok, result.msg), result.ok ? 200 : 400);
    });

    CROW_ROUTE(app, "/api/return").methods(crow::HTTPMethod::POST)
    ([&library](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) return jsonResponse(messageResponse(false, "Invalid JSON request."), 400);
        int fine = 0;
        Result result = library.returnBook(getInt(body, "studentId"), getInt(body, "bookId"),
                                           getString(body, "date"), fine);
        auto out = messageResponse(result.ok, result.msg);
        out["fine"] = fine;
        return jsonResponse(std::move(out), result.ok ? 200 : 400);
    });

    CROW_ROUTE(app, "/api/transactions")([&library] {
        crow::json::wvalue::list list;
        const long today = Utils::todayDays();
        for (const auto& txn : library.getTransactions()) {
            const Student* student = library.findStudent(txn.getStudentId());
            const Book* book = library.findBook(txn.getBookId());
            crow::json::wvalue item;
            item["id"] = txn.getId();
            item["studentId"] = txn.getStudentId();
            item["student"] = student ? student->getName() : "Unknown student";
            item["bookId"] = txn.getBookId();
            item["book"] = book ? book->getTitle() : "Unknown book";
            item["issueDate"] = txn.getIssueDate();
            item["dueDate"] = txn.dueDate();
            item["returnDate"] = txn.getReturnDate() == "NULL" ? "" : txn.getReturnDate();
            item["returned"] = txn.isReturned();
            item["overdue"] = txn.isOverdueAsOf(today);
            item["fine"] = txn.fineAsOf(today);
            list.push_back(std::move(item));
        }
        crow::json::wvalue out;
        out["items"] = std::move(list);
        return jsonResponse(std::move(out));
    });

    CROW_ROUTE(app, "/api/health")([] {
        return jsonResponse(messageResponse(true, "Library web server is running."));
    });

    std::cout << "Library web app: http://localhost:18080\n";
    app.port(18080).multithreaded().run();
}
