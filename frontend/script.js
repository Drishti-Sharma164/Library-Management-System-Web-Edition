const $ = (id) => document.getElementById(id);
let books = [], students = [], transactions = [];
let toastTimer;

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok || data.ok === false) throw new Error(data.message || "Something went wrong.");
  return data;
}
function notify(message) {
  const box = $("toast");
  box.textContent = message;
  box.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove("show"), 3200);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}
function go(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  $(page + "-page").classList.add("active");
  document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const titles = { dashboard:"Dashboard", books:"Books", students:"Students", circulation:"Issue / Return", transactions:"Transactions" };
  $("page-title").textContent = titles[page];
  if (page === "books") loadBooks();
  if (page === "students") loadStudents();
  if (page === "circulation") loadCirculation();
  if (page === "transactions") loadTransactions();
}
document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => go(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));

async function loadDashboard() {
  const data = await api("/api/dashboard");
  $("stat-books").textContent = data.books;
  $("stat-students").textContent = data.students;
  $("stat-available").textContent = data.available;
  $("stat-issued").textContent = data.issued;
  $("stat-overdue").textContent = data.overdue;
  await loadTransactions(true);
}
async function loadBooks() {
  const data = await api("/api/books");
  books = data.items || [];
  renderBooks();
}
function renderBooks() {
  const q = $("book-search").value.trim().toLowerCase();
  const rows = books.filter(b => [b.title,b.author,b.category,String(b.id)].some(x => String(x).toLowerCase().includes(q)));
  $("book-count").textContent = `${rows.length} book${rows.length === 1 ? "" : "s"}`;
  $("books-table").innerHTML = rows.length ? rows.map(b => `
    <tr><td><div class="book-name"><span class="book-cover">▤</span><span>${escapeHTML(b.title)}<small style="display:block;color:#a0a9b6;font-weight:400;margin-top:3px">ID #${b.id}</small></span></div></td>
    <td>${escapeHTML(b.author)}</td><td>${escapeHTML(b.category)}</td>
    <td><span class="pill ${b.available ? "available" : "issued"}">${b.available ? "Available" : "Issued"}</span></td>
    <td><button class="action-btn" onclick="editBook(${b.id})">Edit</button><button class="action-btn danger" onclick="deleteBook(${b.id})">Delete</button></td></tr>`).join("")
    : `<tr><td colspan="5"><div class="empty-state">No books found. Add your first book.</div></td></tr>`;
}
$("book-search").addEventListener("input", renderBooks);
function showBookForm(book = null) {
  $("book-form-panel").classList.remove("hidden");
  $("book-form-title").textContent = book ? "Edit book details" : "Add a new book";
  $("book-id").value = book?.id || "";
  $("book-title").value = book?.title || "";
  $("book-author").value = book?.author || "";
  $("book-category").value = book?.category || "";
  $("book-title").focus();
}
function hideBookForm() { $("book-form-panel").classList.add("hidden"); $("book-form").reset(); $("book-id").value = ""; }
$("show-book-form").addEventListener("click", () => showBookForm());
$("cancel-book-form").addEventListener("click", hideBookForm);
$("cancel-book-form-2").addEventListener("click", hideBookForm);
window.editBook = id => { const b = books.find(x => x.id === id); if (b) showBookForm(b); };
window.deleteBook = async id => {
  if (!confirm("Delete this book from the library?")) return;
  try { const r = await api(`/api/books/${id}`, { method:"DELETE" }); notify(r.message); await loadBooks(); await loadDashboard(); }
  catch(e) { notify(e.message); }
};
$("book-form").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("book-id").value;
  const body = { title:$("book-title").value, author:$("book-author").value, category:$("book-category").value };
  try {
    const r = await api(id ? `/api/books/${id}` : "/api/books", { method:id ? "PUT" : "POST", body:JSON.stringify(body) });
    notify(r.message); hideBookForm(); await loadBooks(); await loadDashboard();
  } catch(err) { notify(err.message); }
});

async function loadStudents() {
  const data = await api("/api/students");
  students = data.items || [];
  renderStudents();
}
function renderStudents() {
  const q = $("student-search").value.trim().toLowerCase();
  const rows = students.filter(s => [s.name,s.contact,String(s.id)].some(x => String(x).toLowerCase().includes(q)));
  $("student-count").textContent = `${rows.length} student${rows.length === 1 ? "" : "s"}`;
  $("students-table").innerHTML = rows.length ? rows.map(s => `
    <tr><td>${escapeHTML(s.name)}<small style="display:block;color:#a0a9b6;font-weight:400;margin-top:3px">ID #${s.id}</small></td>
    <td>${escapeHTML(s.contact)}</td><td>${s.issuedCount} / 3</td>
    <td><button class="action-btn" onclick="editStudent(${s.id})">Edit</button><button class="action-btn danger" onclick="deleteStudent(${s.id})">Delete</button></td></tr>`).join("")
    : `<tr><td colspan="4"><div class="empty-state">No students found. Register a student.</div></td></tr>`;
}
$("student-search").addEventListener("input", renderStudents);
function showStudentForm(student = null) {
  $("student-form-panel").classList.remove("hidden");
  $("student-form-title").textContent = student ? "Edit student details" : "Register a student";
  $("student-id").value = student?.id || "";
  $("student-name").value = student?.name || "";
  $("student-contact").value = student?.contact || "";
  $("student-name").focus();
}
function hideStudentForm() { $("student-form-panel").classList.add("hidden"); $("student-form").reset(); $("student-id").value = ""; }
$("show-student-form").addEventListener("click", () => showStudentForm());
$("cancel-student-form").addEventListener("click", hideStudentForm);
$("cancel-student-form-2").addEventListener("click", hideStudentForm);
window.editStudent = id => { const s = students.find(x => x.id === id); if (s) showStudentForm(s); };
window.deleteStudent = async id => {
  if (!confirm("Delete this student? Students with issued books cannot be deleted.")) return;
  try { const r = await api(`/api/students/${id}`, { method:"DELETE" }); notify(r.message); await loadStudents(); await loadDashboard(); }
  catch(e) { notify(e.message); }
};
$("student-form").addEventListener("submit", async e => {
  e.preventDefault();
  const id = $("student-id").value;
  const body = { name:$("student-name").value, contact:$("student-contact").value };
  try {
    const r = await api(id ? `/api/students/${id}` : "/api/students", { method:id ? "PUT" : "POST", body:JSON.stringify(body) });
    notify(r.message); hideStudentForm(); await loadStudents(); await loadDashboard();
  } catch(err) { notify(err.message); }
});

async function loadCirculation() {
  const [s,b,t] = await Promise.all([api("/api/students"), api("/api/books"), api("/api/transactions")]);
  students = s.items || []; books = b.items || []; transactions = t.items || [];
  $("issue-student").innerHTML = `<option value="">Choose a student</option>` + students.map(x => `<option value="${x.id}">${escapeHTML(x.name)} (#${x.id}) · ${x.issuedCount}/3 books</option>`).join("");
  $("issue-book").innerHTML = `<option value="">Choose an available book</option>` + books.filter(x => x.available).map(x => `<option value="${x.id}">${escapeHTML(x.title)} (#${x.id})</option>`).join("");
  $("return-record").innerHTML = `<option value="">Choose an issued book</option>` + transactions.filter(x => !x.returned).map(x => `<option value="${x.studentId}|${x.bookId}">${escapeHTML(x.book)} — ${escapeHTML(x.student)} (#${x.bookId})</option>`).join("");
}
$("issue-form").addEventListener("submit", async e => {
  e.preventDefault();
  const body = { studentId:Number($("issue-student").value), bookId:Number($("issue-book").value), date:$("issue-date").value };
  try { const r = await api("/api/issue", { method:"POST", body:JSON.stringify(body) }); notify(r.message); $("issue-form").reset(); await loadCirculation(); await loadDashboard(); }
  catch(err) { notify(err.message); }
});
$("return-form").addEventListener("submit", async e => {
  e.preventDefault();
  const [studentId,bookId] = $("return-record").value.split("|").map(Number);
  if (!studentId || !bookId) return;
  const body = { studentId, bookId, date:$("return-date").value };
  try { const r = await api("/api/return", { method:"POST", body:JSON.stringify(body) }); notify(`${r.message}${r.fine ? ` Fine: ₹${r.fine}` : ""}`); $("return-form").reset(); await loadCirculation(); await loadDashboard(); }
  catch(err) { notify(err.message); }
});

async function loadTransactions(forDashboard = false) {
  const data = await api("/api/transactions");
  transactions = data.items || [];
  if (!forDashboard) renderTransactions();
  const recent = [...transactions].reverse().slice(0,4);
  $("recent-activity").innerHTML = recent.length ? recent.map(t => `
    <div class="recent-item"><span class="recent-symbol">${t.returned ? "✓" : "↗"}</span><div><b>${escapeHTML(t.book)} · ${t.returned ? "Returned" : "Issued"}</b><small>${escapeHTML(t.student)} · ${escapeHTML(t.issueDate)}</small></div></div>`).join("")
    : `<div class="empty-state">No transactions to show yet.</div>`;
}
function renderTransactions() {
  $("transactions-table").innerHTML = transactions.length ? [...transactions].reverse().map(t => {
    const status = t.returned ? "Returned" : (t.overdue ? "Overdue" : "Issued");
    return `<tr><td>${escapeHTML(t.student)}<small style="display:block;color:#a0a9b6;font-weight:400;margin-top:3px">#${t.studentId}</small></td>
      <td>${escapeHTML(t.book)}</td><td>${escapeHTML(t.issueDate)}</td><td>${escapeHTML(t.dueDate)}</td>
      <td>${t.returnDate ? escapeHTML(t.returnDate) : "—"}</td><td>₹${t.fine}</td>
      <td><span class="pill ${status.toLowerCase()}">${status}</span></td></tr>`;
  }).join("") : `<tr><td colspan="7"><div class="empty-state">No transactions have been recorded yet.</div></td></tr>`;
}

async function startApp() {
  try { await loadDashboard(); }
  catch (error) { notify(error.message); }
}
startApp();
