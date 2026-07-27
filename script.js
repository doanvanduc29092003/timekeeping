// Tạo danh sách tháng
const monthSelect = document.getElementById("month");

for (let i = 1; i <= 12; i++) {
    monthSelect.innerHTML += `<option value="${i}">${i}</option>`;
}

monthSelect.value = new Date().getMonth() + 1;

// Kiểm tra ngày làm

function getShiftStatus(date, shift) {

    const baseDate = new Date(2026, 6, 24);

    const diffDays = Math.floor((date - baseDate) / 86400000);

    let offset = 0;

    switch (shift) {
        case "A":
            offset = 2;
            break;
        case "B":
            offset = 0;
            break;
        case "C":
            offset = 4;
            break;
    }

    const pos = ((diffDays + offset) % 12 + 12) % 12;

    if (pos < 4) {
        return { work: true, night: true };      // 4 đêm
    }

    if (pos < 6) {
        return { work: false, night: false };    // nghỉ
    }

    if (pos < 10) {
        return { work: true, night: false };     // 4 ngày
    }

    return { work: false, night: false };        // nghỉ
}



// Hiển thị kíp theo nhân viên
function updateShift() {

    const employee = document.getElementById("employee").value;

    let shift = "";

    switch (employee) {

        case "Lê Xuân Hiển":
        case "Đoàn Văn Đức":
            shift = "A";
            break;

        case "Phạm Quang Hưng":
        case "Nguyễn Văn Tiến":
            shift = "B";
            break;

        case "Hà Xuân Diện":
        case "Hoàng Duy Tuấn":
            shift = "C";
            break;

    }

    document.getElementById("shift").value = "Kíp " + shift;

}

// Tạo lịch
function generateCalendar() {

    const month = parseInt(document.getElementById("month").value);

    const year = parseInt(document.getElementById("year").value);

    const shift = document.getElementById("shift").value.replace("Kíp ", "");

    const calendar = document.getElementById("calendar");

    calendar.innerHTML = "";

    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    dayNames.forEach(d => {
        calendar.innerHTML += `<div class="day-name">${d}</div>`;
    });

    const firstDay = new Date(year, month - 1, 1);

    const lastDay = new Date(year, month, 0);

    let start = (firstDay.getDay() + 6) % 7;

    for (let i = 0; i < start; i++) {
        calendar.innerHTML += "<div></div>";
    }

    let workDays = 0;

    let offDays = 0;

    for (let day = 1; day <= lastDay.getDate(); day++) {

        const currentDate = new Date(year, month - 1, day);

        // const work = isWorkingDay(currentDate, shift);
        const status = getShiftStatus(currentDate, shift);

        const work = status.work;
        const night = status.night;

        if (work) {
            workDays++;
        } else {
            offDays++;
        }

        calendar.innerHTML += `
        <div class="day ${work ? 'work' : 'off'}">
        <div class="day ${work
                ? (night ? "work-night" : "work-day")
                : "off"
            }">

            <div class="day-number">${day}</div>

            <div>
                ${work
                                ? (night ? "Làm đêm" : "Làm ngày")
                                : "Nghỉ"
                            }
            </div>

            <input
                type="number"
                class="ot-input"
                min="0"
                step="0.5"
                placeholder="OT giờ"
                oninput="calculateSummary()">

        </div>
        `;

    }

    window.currentWorkDays = workDays;
    window.currentOffDays = offDays;

    calculateSummary();

}

// Tính tổng
function calculateSummary() {

    const year = parseInt(document.getElementById("year").value);

    const month = parseInt(document.getElementById("month").value);

    let normalHours = 0;

    let otHours = 0;

    const days = document.querySelectorAll(".day");

    days.forEach(day => {

        if (!day.classList.contains("work")) return;

        const dayNumber = parseInt(day.querySelector(".day-number").innerText);

        const date = new Date(year, month - 1, dayNumber);

        normalHours += 11;

        if (date.getDay() == 0) {
            otHours += 3;
        } else {
            otHours += 1;
        }

    });

    document.getElementById("workDays").innerText = window.currentWorkDays;

    document.getElementById("offDays").innerText = window.currentOffDays;

    document.getElementById("normalHours").innerText = normalHours;

    document.getElementById("otHours").innerText = otHours;

    document.getElementById("totalHours").innerText = normalHours + otHours;

    document.getElementById("month").addEventListener("change", generateCalendar);
    document.getElementById("year").addEventListener("change", generateCalendar);
    document.getElementById("employee").addEventListener("change", () => {
        updateShift();
        generateCalendar();
    });

}

// Khởi tạo
updateShift();

generateCalendar();