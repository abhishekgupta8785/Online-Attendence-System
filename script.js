
// ==========================================
// ATTENDIFY PRO - VERSION 3.0
// ==========================================

// DATA STORAGE

let students = JSON.parse(
    localStorage.getItem("students") || "[]"
);

let attendance = JSON.parse(
    localStorage.getItem("attendance") || "{}"
);


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function saveData() {
    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("attendance", JSON.stringify(attendance));
}

function safe(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function today() {
    const d = new Date();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function notify(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


// ==========================================
// NAVIGATION
// ==========================================

const pageInfo = {
    dashboard: ["Dashboard", "Welcome back! Here's your overview."],
    students: ["Students", "Manage all registered students."],
    attendance: ["Attendance", "Record daily student attendance."],
    reports: ["Reports", "Analyze student attendance performance."],
    settings: ["Settings", "Manage your project preferences."]
};

function openPage(page) {
    if (!pageInfo[page]) return;

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(page).classList.add("active");

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    document.getElementById("pageTitle").textContent =
        pageInfo[page][0];

    document.getElementById("pageSubtitle").textContent =
        pageInfo[page][1];

    document.getElementById("sidebar").classList.remove("open");

    renderAll();
}

document.querySelectorAll(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        openPage(button.dataset.go);
    });
});

document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});


// ==========================================
// ADD STUDENT
// ==========================================

document.getElementById("studentForm").addEventListener("submit", event => {

    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const roll = document.getElementById("rollNumber").value.trim();
    const studentClass = document.getElementById("studentClass").value.trim();

    if (!name || !roll) {
        notify("Please enter required details!");
        return;
    }

    const duplicate = students.some(student =>
        student.roll.toLowerCase() === roll.toLowerCase()
    );

    if (duplicate) {
        notify("Roll number already exists!");
        return;
    }

    students.push({
        name,
        roll,
        studentClass
    });

    saveData();

    event.target.reset();

    renderAll();

    notify("Student added successfully!");
});


// ==========================================
// DELETE STUDENT
// ==========================================

function deleteStudent(encodedRoll) {

    const roll = decodeURIComponent(encodedRoll);

    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    students = students.filter(student => student.roll !== roll);

    Object.keys(attendance).forEach(date => {
        delete attendance[date][roll];
    });

    saveData();
    renderAll();

    notify("Student deleted successfully!");
}


// ==========================================
// STUDENT TABLE
// ==========================================

function renderStudents() {

    const search = document.getElementById("studentSearch")
        .value.toLowerCase().trim();

    const filtered = students.filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.roll.toLowerCase().includes(search) ||
        (student.studentClass || "").toLowerCase().includes(search)
    );

    document.getElementById("studentCount").textContent =
        students.length + " Students";

    const table = document.getElementById("studentTable");

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr><td colspan="4" class="empty">No students found.</td></tr>
        `;
        return;
    }

    table.innerHTML = filtered.map(student => `
        <tr>
            <td>
                <span class="student-name">${safe(student.name)}</span>
                <span class="student-sub">Student</span>
            </td>
            <td>${safe(student.roll)}</td>
            <td>${safe(student.studentClass || "Not specified")}</td>
            <td>
                <button class="delete-btn"
                    onclick="deleteStudent('${encodeURIComponent(student.roll)}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

document.getElementById("studentSearch").addEventListener(
    "input", renderStudents
);


// ==========================================
// ATTENDANCE MANAGEMENT
// ==========================================

function renderAttendance() {

    const date = document.getElementById("attendanceDate").value;

    const search = document.getElementById("attendanceSearch")
        .value.toLowerCase().trim();

    const records = attendance[date] || {};

    const filtered = students.filter(student =>
        student.name.toLowerCase().includes(search) ||
        student.roll.toLowerCase().includes(search)
    );

    const table = document.getElementById("attendanceTable");

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr><td colspan="3" class="empty">
                No students available. Add students first.
            </td></tr>
        `;

        document.getElementById("attendanceSummary").textContent =
            "No student records available.";

        return;
    }

    table.innerHTML = filtered.map(student => {

        const status = records[student.roll] || "";

        return `
            <tr>
                <td>
                    <span class="student-name">${safe(student.name)}</span>
                </td>
                <td>${safe(student.roll)}</td>
                <td>
                    <select class="status-select"
                        id="status-${encodeURIComponent(student.roll)}">
                        <option value="">Select Status</option>
                        <option value="Present" ${status === "Present" ? "selected" : ""}>
                            Present
                        </option>
                        <option value="Absent" ${status === "Absent" ? "selected" : ""}>
                            Absent
                        </option>
                    </select>
                </td>
            </tr>
        `;
    }).join("");

    const marked = Object.keys(records).length;
    const present = Object.values(records).filter(s => s === "Present").length;
    const absent = Object.values(records).filter(s => s === "Absent").length;

    document.getElementById("attendanceSummary").textContent =
        `Marked: ${marked} | Present: ${present} | Absent: ${absent}`;
}

document.getElementById("attendanceDate").addEventListener(
    "change", renderAttendance
);

document.getElementById("attendanceSearch").addEventListener(
    "input", renderAttendance
);


// ==========================================
// SAVE ATTENDANCE
// ==========================================

document.getElementById("saveAttendance").addEventListener("click", () => {

    const date = document.getElementById("attendanceDate").value;

    if (!date) {
        notify("Please select a date!");
        return;
    }

    if (date > today()) {
        notify("Future date attendance is not allowed!");
        return;
    }

    if (students.length === 0) {
        notify("Please add students first!");
        return;
    }

    const records = {};

    for (const student of students) {

        const select = document.getElementById(
            "status-" + encodeURIComponent(student.roll)
        );

        if (!select) {
            notify("Please clear the attendance search first!");
            return;
        }

        if (!select.value) {
            notify("Please mark every student's attendance!");
            return;
        }

        records[student.roll] = select.value;
    }

    attendance[date] = records;

    saveData();
    renderAll();

    notify("Attendance saved successfully!");
});


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

function renderDashboard() {

    const records = attendance[today()] || {};

    const present = Object.values(records)
        .filter(status => status === "Present").length;

    const absent = Object.values(records)
        .filter(status => status === "Absent").length;

    const total = students.length;

    const rate = total
        ? (present / total * 100)
        : 0;

    document.getElementById("totalStudents").textContent = total;
    document.getElementById("presentCount").textContent = present;
    document.getElementById("absentCount").textContent = absent;

    document.getElementById("attendanceRate").textContent =
        rate.toFixed(1) + "%";

    document.getElementById("donutPercent").textContent =
        rate.toFixed(0) + "%";

    const unmarked = Math.max(0, total - present - absent);

    const presentAngle = total ? present / total * 360 : 0;
    const absentAngle = total ? absent / total * 360 : 0;

    document.getElementById("donutChart").style.background =
        `conic-gradient(
            #17a879 0deg ${presentAngle}deg,
            #e65c67 ${presentAngle}deg ${presentAngle + absentAngle}deg,
            #c5c6d1 ${presentAngle + absentAngle}deg 360deg
        )`;
}


// ==========================================
// RECENT STUDENTS
// ==========================================

function renderRecentStudents() {

    const box = document.getElementById("recentStudents");

    const recent = students.slice(-5).reverse();

    if (recent.length === 0) {
        box.innerHTML = `<div class="empty">No students added yet.</div>`;
        return;
    }

    box.innerHTML = recent.map(student => `
        <div class="student-item">
            <span class="student-name">${safe(student.name)}</span>
            <span class="student-sub">${safe(student.roll)}</span>
        </div>
    `).join("");
}


// ==========================================
// WEEKLY ATTENDANCE CHART
// ==========================================

function renderWeeklyChart() {

    const chart = document.getElementById("weeklyChart");

    let html = "";

    for (let i = 6; i >= 0; i--) {

        const date = new Date();
        date.setDate(date.getDate() - i);

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        const records = attendance[key] || {};

        const present = Object.values(records)
            .filter(status => status === "Present").length;

        const total = Object.keys(records).length;

        const percentage = total
            ? present / total * 100
            : 0;

        html += `
            <div class="chart-day">
                <div class="bar-track">
                    <div class="bar"
                        title="${percentage.toFixed(0)}%"
                        style="height:${Math.max(3, percentage)}%">
                    </div>
                </div>
                <span>${date.toLocaleDateString("en-IN", {weekday:"short"})}</span>
            </div>
        `;
    }

    chart.innerHTML = html;
}


// ==========================================
// REPORTS
// ==========================================

function getStudentStats(student) {

    let present = 0;
    let absent = 0;

    Object.values(attendance).forEach(records => {

        if (records[student.roll] === "Present") present++;

        if (records[student.roll] === "Absent") absent++;

    });

    const total = present + absent;

    const percentage = total
        ? present / total * 100
        : 0;

    return {present, absent, total, percentage};
}

function renderReports() {

    let totalPresent = 0;
    let totalAbsent = 0;

    const table = document.getElementById("reportTable");

    if (students.length === 0) {
        table.innerHTML = `
            <tr><td colspan="5" class="empty">No report data available.</td></tr>
        `;
    } else {

        table.innerHTML = students.map(student => {

            const stats = getStudentStats(student);

            totalPresent += stats.present;
            totalAbsent += stats.absent;

            return `
                <tr>
                    <td class="student-name">${safe(student.name)}</td>
                    <td>${safe(student.roll)}</td>
                    <td>${stats.present}</td>
                    <td>${stats.absent}</td>
                    <td>
                        <strong>${stats.percentage.toFixed(1)}%</strong>
                        <div class="progress">
                            <div class="progress-fill"
                                style="width:${stats.percentage}%"></div>
                        </div>
                    </td>
                </tr>
            `;

        }).join("");
    }

    const totalRecords = totalPresent + totalAbsent;

    const rate = totalRecords
        ? totalPresent / totalRecords * 100
        : 0;

    document.getElementById("reportTotal").textContent = students.length;
    document.getElementById("reportPresent").textContent = totalPresent;
    document.getElementById("reportAbsent").textContent = totalAbsent;
    document.getElementById("reportRate").textContent = rate.toFixed(1) + "%";
}


// ==========================================
// EXPORT CSV
// ==========================================

document.getElementById("exportReport").addEventListener("click", () => {

    const rows = [
        ["Student Name", "Roll Number", "Present", "Absent", "Percentage"]
    ];

    students.forEach(student => {

        const stats = getStudentStats(student);

        rows.push([
            student.name,
            student.roll,
            stats.present,
            stats.absent,
            stats.percentage.toFixed(1) + "%"
        ]);
    });

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\r\n");

    downloadFile(
        "\uFEFF" + csv,
        "attendance-report.csv",
        "text/csv;charset=utf-8"
    );

    notify("CSV report downloaded!");
});


// ==========================================
// BACKUP DATA
// ==========================================

document.getElementById("backupData").addEventListener("click", () => {

    const backup = {
        students,
        attendance,
        backupDate: new Date().toISOString()
    };

    downloadFile(
        JSON.stringify(backup, null, 2),
        "attendance-backup.json",
        "application/json"
    );

    notify("Backup downloaded!");
});

function downloadFile(content, filename, type) {

    const blob = new Blob([content], {type});

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}


// ==========================================
// RESET DATA
// ==========================================

document.getElementById("resetData").addEventListener("click", () => {

    if (!confirm("This will permanently clear all project records from this browser. Continue?")) {
        return;
    }

    students = [];
    attendance = {};

    saveData();

    renderAll();

    notify("All project data has been reset!");
});


// ==========================================
// DARK MODE
// ==========================================

document.getElementById("themeToggle").addEventListener("click", () => {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "attendifyTheme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
});

if (localStorage.getItem("attendifyTheme") === "dark") {
    document.body.classList.add("dark");
}


// ==========================================
// INITIALIZE
// ==========================================

document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

document.getElementById("attendanceDate").value = today();

function renderAll() {
    renderStudents();
    renderRecentStudents();
    renderAttendance();
    renderDashboard();
    renderWeeklyChart();
    renderReports();
}

renderAll();
