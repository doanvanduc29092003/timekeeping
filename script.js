
"use strict";

const monthSelect = document.getElementById("month");
const yearSelect = document.getElementById("year");
const employeeSelect = document.getElementById("employee");

for (let i = 1; i <= 12; i++) {
    monthSelect.add(new Option(`Tháng ${i}`, i));
}

monthSelect.value = new Date().getMonth() + 1;
yearSelect.value = "2026";


function updateShift() {
    const employee = employeeSelect.value;
    let shift = "";

    switch (employee) {
        case "Đoàn Văn Đức":
        case "Lê Xuân Hiển":
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


function getShiftStatus(date, shift) {
    const baseDate = new Date(2026, 6, 24);

    const diffDays = Math.round(
        (date.getTime() - baseDate.getTime()) / 86400000
    );

    const offsets = {
        A: 2,
        B: 6,
        C: 10
    };

    const offset = offsets[shift] ?? 0;
    const pos = ((diffDays + offset) % 12 + 12) % 12;

    if (pos < 4) {
        return { work: true, night: true };
    }

    if (pos < 6) {
        return { work: false, night: false };
    }

    if (pos < 10) {
        return { work: true, night: false };
    }

    return { work: false, night: false };
}

/* =========================
   Lịch âm Việt Nam, múi giờ UTC+7
========================= */

function jdFromDate(dd, mm, yy) {
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;

    let jd = dd
        + Math.floor((153 * m + 2) / 5)
        + 365 * y
        + Math.floor(y / 4)
        - Math.floor(y / 100)
        + Math.floor(y / 400)
        - 32045;

    if (jd < 2299161) {
        jd = dd
            + Math.floor((153 * m + 2) / 5)
            + 365 * y
            + Math.floor(y / 4)
            - 32083;
    }

    return jd;
}

function newMoon(k) {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = Math.PI / 180;

    let jd1 = 2415020.75933
        + 29.53058868 * k
        + 0.0001178 * T2
        - 0.000000155 * T3;

    jd1 += 0.00033 * Math.sin(
        (166.56 + 132.87 * T - 0.009173 * T2) * dr
    );

    const M = 359.2242
        + 29.10535608 * k
        - 0.0000333 * T2
        - 0.00000347 * T3;

    const Mpr = 306.0253
        + 385.81691806 * k
        + 0.0107306 * T2
        + 0.00001236 * T3;

    const F = 21.2964
        + 390.67050646 * k
        - 0.0016528 * T2
        - 0.00000239 * T3;

    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr)
        + 0.0021 * Math.sin(2 * M * dr);

    C1 -= 0.4068 * Math.sin(Mpr * dr);
    C1 += 0.0161 * Math.sin(2 * Mpr * dr);
    C1 -= 0.0004 * Math.sin(3 * Mpr * dr);
    C1 += 0.0104 * Math.sin(2 * F * dr);
    C1 -= 0.0051 * Math.sin((M + Mpr) * dr);
    C1 -= 0.0074 * Math.sin((M - Mpr) * dr);
    C1 += 0.0004 * Math.sin((2 * F + M) * dr);
    C1 -= 0.0004 * Math.sin((2 * F - M) * dr);
    C1 -= 0.0006 * Math.sin((2 * F + Mpr) * dr);
    C1 += 0.0010 * Math.sin((2 * F - Mpr) * dr);
    C1 += 0.0005 * Math.sin((2 * Mpr + M) * dr);

    let deltaT;

    if (T < -11) {
        deltaT = 0.001
            + 0.000839 * T
            + 0.0002261 * T2
            - 0.00000845 * T3
            - 0.000000081 * T * T3;
    } else {
        deltaT = -0.000278
            + 0.000265 * T
            + 0.000262 * T2;
    }

    return jd1 + C1 - deltaT;
}

function getNewMoonDay(k) {
    return Math.floor(newMoon(k) + 0.5 + 7 / 24);
}

function getSunLongitude(dayNumber) {
    const T = (dayNumber - 2451545.5 - 7 / 24) / 36525;
    const T2 = T * T;
    const dr = Math.PI / 180;

    const M = 357.52910
        + 35999.05030 * T
        - 0.0001559 * T2
        - 0.00000048 * T * T2;

    const L0 = 280.46645
        + 36000.76983 * T
        + 0.0003032 * T2;

    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2)
        * Math.sin(dr * M);

    DL += (0.019993 - 0.000101 * T)
        * Math.sin(2 * dr * M);

    DL += 0.000290 * Math.sin(3 * dr * M);

    let L = (L0 + DL) * dr;
    L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));

    return Math.floor(L / Math.PI * 6);
}

function getLunarMonth11(yy) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = Math.floor(off / 29.530588853);

    let nm = getNewMoonDay(k);

    if (getSunLongitude(nm) >= 9) {
        nm = getNewMoonDay(k - 1);
    }

    return nm;
}

function getLeapMonthOffset(a11) {
    const k = Math.floor(
        (a11 - 2415021.076998695) / 29.530588853 + 0.5
    );

    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i));

    do {
        last = arc;
        i++;
        arc = getSunLongitude(getNewMoonDay(k + i));
    } while (arc !== last && i < 14);

    return i - 1;
}

function convertSolarToLunar(dd, mm, yy) {
    const dayNumber = jdFromDate(dd, mm, yy);

    const k = Math.floor(
        (dayNumber - 2415021.076998695) / 29.530588853
    );

    let monthStart = getNewMoonDay(k + 1);

    if (monthStart > dayNumber) {
        monthStart = getNewMoonDay(k);
    }

    let a11 = getLunarMonth11(yy);
    let b11 = a11;
    let lunarYear;

    if (a11 >= monthStart) {
        lunarYear = yy;
        a11 = getLunarMonth11(yy - 1);
    } else {
        lunarYear = yy + 1;
        b11 = getLunarMonth11(yy + 1);
    }

    const lunarDay = dayNumber - monthStart + 1;
    const diff = Math.floor((monthStart - a11) / 29);

    let lunarMonth = diff + 11;
    let lunarLeap = 0;

    if (b11 - a11 > 365) {
        const leapDiff = getLeapMonthOffset(a11);

        if (diff >= leapDiff) {
            lunarMonth = diff + 10;

            if (diff === leapDiff) {
                lunarLeap = 1;
            }
        }
    }

    if (lunarMonth > 12) {
        lunarMonth -= 12;
    }

    if (lunarMonth >= 11 && diff < 4) {
        lunarYear--;
    }

    return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

function generateCalendar() {
    const month = Number(monthSelect.value);
    const year = Number(yearSelect.value);

    const shift = document.getElementById("shift")
        .value.replace("Kíp ", "");

    const calendar = document.getElementById("calendar");

    calendar.innerHTML = "";

    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    dayNames.forEach(name => {
        calendar.insertAdjacentHTML(
            "beforeend",
            `<div class="day-name">${name}</div>`
        );
    });

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const start = (firstDay.getDay() + 6) % 7;

    for (let i = 0; i < start; i++) {
        calendar.insertAdjacentHTML("beforeend", "<div></div>");
    }

    let workDays = 0;
    let offDays = 0;

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month - 1, day);
        const status = getShiftStatus(currentDate, shift);

        if (status.work) {
            workDays++;
        } else {
            offDays++;
        }

        const className = status.work
            ? (status.night ? "work-night" : "work-day")
            : "off";

        const label = status.work
            ? (status.night ? "Làm đêm" : "Làm ngày")
            : "Nghỉ";

        // Lấy ngày âm tương ứng với ngày dương
        const lunar = convertSolarToLunar(day, month, year);
        const lunarDay = lunar[0];
        const lunarMonth = lunar[1];
        const lunarYear = lunar[2];
        const lunarLeap = lunar[3];

        // const lunarText = lunarDay === 1
        //     ? `1/${lunarMonth}${lunarLeap ? " nhuận" : ""}`
        //     : `${lunarDay} âm`;
        
        const lunarText = `${lunarDay}/${lunarMonth}/${lunarYear}${lunarLeap ? " nhuận" : ""} âm`;

        calendar.insertAdjacentHTML("beforeend", `
            <div class="day ${className}">
                <div class="day-header">
                    <span class="day-number">${day}</span>
                    <span class="lunar-inline">${lunarText}</span>
                </div>

                <div>${label}</div>

                <input
                    type="number"
                    class="ot-input"
                    min="0"
                    step="0.5"
                    placeholder="OT giờ"
                    aria-label="Giờ tăng ca ngày ${day}"
                >

                ${status.work ? `
                    <button type="button" class="np-btn">NP</button>
                ` : ""}
            </div>
        `);
    }

    window.currentWorkDays = workDays;
    window.currentOffDays = offDays;

    calculateSummary();
}

function calculateSummary() {
    const year = Number(yearSelect.value);
    const month = Number(monthSelect.value);

    let normalHours = 0;
    let otHours = 0;
    let npDays = 0;

    document.querySelectorAll("#calendar .day").forEach(day => {
        const isWorkDay = day.classList.contains("work-day")
            || day.classList.contains("work-night")
            || day.classList.contains("work");

        if (!isWorkDay) return;

        const npBtn = day.querySelector(".np-btn");
        const isNP = npBtn && npBtn.classList.contains("active");

        if (isNP) {
            npDays++;
            return;
        }

        const dayNumber = Number(
            day.querySelector(".day-number").textContent
        );

        const date = new Date(year, month - 1, dayNumber);

        // Mỗi ngày làm tính 11 giờ hành chính
        normalHours += 11;

        // Chủ nhật mặc định 3 giờ OT, ngày khác 1 giờ
        const defaultOT = date.getDay() === 0 ? 3 : 1;

        const otInput = day.querySelector(".ot-input");

        const enteredOT = otInput && otInput.value !== ""
            ? Number(otInput.value)
            : defaultOT;

        otHours += Math.max(0, enteredOT || 0);
    });

    document.getElementById("workDays").textContent =
        window.currentWorkDays - npDays;

    document.getElementById("offDays").textContent =
        window.currentOffDays + npDays;

    document.getElementById("normalHours").textContent = normalHours;
    document.getElementById("otHours").textContent = otHours;

    document.getElementById("totalHours").textContent =
        normalHours + otHours;
}

document.getElementById("generateBtn").addEventListener(
    "click",
    generateCalendar
);

employeeSelect.addEventListener("change", () => {
    updateShift();
    generateCalendar();
});

monthSelect.addEventListener("change", generateCalendar);
yearSelect.addEventListener("change", generateCalendar);

document.getElementById("calendar").addEventListener("click", event => {
    if (event.target.classList.contains("np-btn")) {
        event.target.classList.toggle("active");
        calculateSummary();
    }
});

document.getElementById("calendar").addEventListener("input", event => {
    if (event.target.classList.contains("ot-input")) {
        calculateSummary();
    }
});

/* =========================
   KHỞI CHẠY
========================= */

updateShift();
generateCalendar();