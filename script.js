
window.addEventListener("load", function () {
    alert("Năm 2027 chưa upload dữ liệu ngày nghỉ lễ tết, AI CHAT CHƯA HUẤN LUYỆN XONG, VUI LÒNG THÔNG CẢM!!! 17/10/2026");
});

"use strict";

/* =========================================
   1. KHAI BÁO CÁC PHẦN TỬ
========================================= */

const monthSelect = document.getElementById("month");
const yearSelect = document.getElementById("year");
const employeeSelect = document.getElementById("employee");
const calendar = document.getElementById("calendar");
const generateBtn = document.getElementById("generateBtn");

/* =========================================
   2. LƯU DỮ LIỆU 30 NGÀY
   - Lưu riêng từng nhân viên
   - Lưu theo ngày cụ thể
   - Lưu OT và NP
   - Không lưu lịch sử chat AI
========================================= */

const STORAGE_KEY = "lichLamViec_data_v2";
const STORAGE_TTL = 30 * 24 * 60 * 60 * 1000;

function readSavedData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return {
                settings: null,
                employees: {}
            };
        }

        const data = JSON.parse(raw);
        const now = Date.now();

        data.employees = data.employees || {};

        // Xóa dữ liệu từng ngày đã quá 30 ngày.
        for (const employee of Object.keys(data.employees)) {
            const days = data.employees[employee] || {};

            for (const dateKey of Object.keys(days)) {
                const entry = days[dateKey];

                if (
                    !entry ||
                    !entry.updatedAt ||
                    now - entry.updatedAt >= STORAGE_TTL
                ) {
                    delete days[dateKey];
                }
            }

            if (Object.keys(days).length === 0) {
                delete data.employees[employee];
            }
        }

        // Lựa chọn nhân viên/tháng/năm cũng hết hạn sau 30 ngày.
        if (
            data.settings &&
            (
                !data.settings.updatedAt ||
                now - data.settings.updatedAt >= STORAGE_TTL
            )
        ) {
            data.settings = null;
        }

        return {
            settings: data.settings || null,
            employees: data.employees
        };

    } catch (error) {
        console.warn("Không đọc được dữ liệu lịch:", error);

        return {
            settings: null,
            employees: {}
        };
    }
}

let savedData = readSavedData();

function writeSavedData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(savedData)
        );
    } catch (error) {
        console.warn("Không thể lưu dữ liệu lịch:", error);
    }
}

// Tạo khóa ngày dạng YYYY-MM-DD.
function makeCalendarDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Lấy dữ liệu của riêng nhân viên đang chọn.
function getSelectedEmployeeData() {
    const employee = employeeSelect.value;

    if (!savedData.employees[employee]) {
        savedData.employees[employee] = {};
    }

    return savedData.employees[employee];
}

// Lưu lựa chọn nhân viên, tháng, năm.
function saveSettings() {
    savedData.settings = {
        employee: employeeSelect.value,
        month: monthSelect.value,
        year: yearSelect.value,
        updatedAt: Date.now()
    };

    writeSavedData();
}

// Lưu OT và NP của một ngày thuộc nhân viên đang chọn.
function saveDayData(dayElement) {
    if (!dayElement) return;

    const dateKey = dayElement.dataset.date;

    if (!dateKey) return;

    const otInput = dayElement.querySelector(".ot-input");
    const npButton = dayElement.querySelector(".np-btn");

    const employeeDays = getSelectedEmployeeData();
    const previous = employeeDays[dateKey] || {};

    employeeDays[dateKey] = {
        ot: otInput
            ? otInput.value
            : (previous.ot ?? ""),

        np: npButton
            ? npButton.classList.contains("active")
            : false,

        updatedAt: Date.now()
    };

    saveSettings();
    writeSavedData();
}

// Khôi phục OT và NP của đúng nhân viên, đúng ngày.
function restoreCalendarData() {
    const employeeDays =
        savedData.employees[employeeSelect.value] || {};

    calendar.querySelectorAll(".day[data-date]").forEach(dayElement => {
        const entry = employeeDays[dayElement.dataset.date];

        // Không có dữ liệu thì giữ lịch mặc định.
        if (!entry) return;

        const otInput = dayElement.querySelector(".ot-input");

        if (
            otInput &&
            entry.ot !== undefined &&
            entry.ot !== null
        ) {
            otInput.value = entry.ot;
        }

        const npButton = dayElement.querySelector(".np-btn");

        if (npButton && entry.np) {
            npButton.classList.add("active");
            npButton.setAttribute("aria-pressed", "true");
        } else if (npButton) {
            npButton.classList.remove("active");
            npButton.setAttribute("aria-pressed", "false");
        }
    });
}

// Khôi phục lựa chọn trước đó.
function restoreSettings() {
    const settings = savedData.settings;

    if (!settings) return;

    if (
        settings.employee !== undefined &&
        Array.from(employeeSelect.options).some(
            option => option.value === settings.employee
        )
    ) {
        employeeSelect.value = settings.employee;
    }

    if (
        settings.month !== undefined &&
        Array.from(monthSelect.options).some(
            option => option.value === String(settings.month)
        )
    ) {
        monthSelect.value = String(settings.month);
    }

    if (
        settings.year !== undefined &&
        Array.from(yearSelect.options).some(
            option => option.value === String(settings.year)
        )
    ) {
        yearSelect.value = String(settings.year);
    }
}

// Ghi lại dữ liệu sau khi dọn các bản ghi hết hạn.
writeSavedData();

/* =========================================
   3. KHỞI TẠO THÁNG
========================================= */

for (let i = 1; i <= 12; i++) {
    monthSelect.add(new Option(`Tháng ${i}`, i));
}

const initialDate = new Date();

monthSelect.value = String(initialDate.getMonth() + 1);

// Chọn năm hiện tại nếu năm đó có trong danh sách.
if (
    Array.from(yearSelect.options).some(
        option => Number(option.value) === initialDate.getFullYear()
    )
) {
    yearSelect.value = String(initialDate.getFullYear());
} else {
    yearSelect.value = "2026";
}

// Áp dụng lựa chọn đã lưu.
restoreSettings();

/* =========================================
   4. XÁC ĐỊNH KÍP LÀM VIỆC
========================================= */

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

/* =========================================
   5. TÍNH CA LÀM VIỆC
========================================= */

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
        return {
            work: true,
            night: true
        };
    }

    if (pos < 6) {
        return {
            work: false,
            night: false
        };
    }

    if (pos < 10) {
        return {
            work: true,
            night: false
        };
    }

    return {
        work: false,
        night: false
    };
}

/* =========================================
   6. LỊCH ÂM VIỆT NAM - UTC+7
========================================= */

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

    let C1 = (0.1734 - 0.000393 * T)
        * Math.sin(M * dr)
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

    L -= Math.PI * 2 * Math.floor(
        L / (Math.PI * 2)
    );

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

    let arc = getSunLongitude(
        getNewMoonDay(k + i)
    );

    do {
        last = arc;
        i++;

        arc = getSunLongitude(
            getNewMoonDay(k + i)
        );
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

    return [
        lunarDay,
        lunarMonth,
        lunarYear,
        lunarLeap
    ];
}

/* =========================================
   7. TẠO LỊCH VÀ ĐÁNH DẤU NGÀY HÔM NAY
========================================= */

function generateCalendar() {
    const month = Number(monthSelect.value);
    const year = Number(yearSelect.value);

    const shift = document.getElementById("shift")
        .value.replace("Kíp ", "");

    calendar.innerHTML = "";

    const today = new Date();

    const isCurrentMonth =
        year === today.getFullYear() &&
        month === today.getMonth() + 1;

    const dayNames = [
        "T2", "T3", "T4", "T5", "T6", "T7", "CN"
    ];

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
        calendar.insertAdjacentHTML(
            "beforeend",
            "<div></div>"
        );
    }

    let workDays = 0;
    let offDays = 0;

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(
            year,
            month - 1,
            day
        );

        const status = getShiftStatus(
            currentDate,
            shift
        );

        if (status.work) {
            workDays++;
        } else {
            offDays++;
        }

        const className = status.work
            ? (status.night ? "work-night" : "work-day")
            : "off";

        const isToday =
            isCurrentMonth &&
            day === today.getDate();

        const todayClass = isToday ? " today" : "";

        const label = status.work
            ? (status.night ? "Làm đêm" : "Làm ngày")
            : "Nghỉ";

        // Chuyển đổi ngày dương sang ngày âm.
        const lunar = convertSolarToLunar(
            day,
            month,
            year
        );

        const lunarDay = lunar[0];
        const lunarMonth = lunar[1];
        const lunarYear = lunar[2];
        const lunarLeap = lunar[3];

        const lunarText =
            `${lunarDay}/${lunarMonth}/${lunarYear}` +
            `${lunarLeap ? " nhuận" : ""} âm`;

        calendar.insertAdjacentHTML("beforeend", `
            <div class="day ${className}${todayClass}" data-date="${makeCalendarDateKey(year, month, day)}">
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
                    <button
                        type="button"
                        class="np-btn"
                        aria-label="Đánh dấu nghỉ phép ngày ${day}"
                        aria-pressed="false"
                    >NP</button>
                ` : ""}
            </div>
        `);
    }

    window.currentWorkDays = workDays;
    window.currentOffDays = offDays;

    // Chỉ khôi phục dữ liệu của người đang được chọn.
    restoreCalendarData();

    calculateSummary();
    saveSettings();
}

/* =========================================
   8. TÍNH CÔNG VÀ GIỜ LÀM
========================================= */

function calculateSummary() {
    const year = Number(yearSelect.value);
    const month = Number(monthSelect.value);

    let normalHours = 0;
    let otHours = 0;
    let npDays = 0;

    document.querySelectorAll("#calendar .day").forEach(day => {
        const isWorkDay =
            day.classList.contains("work-day") ||
            day.classList.contains("work-night") ||
            day.classList.contains("work");

        if (!isWorkDay) {
            return;
        }

        const npBtn = day.querySelector(".np-btn");

        const isNP =
            npBtn && npBtn.classList.contains("active");

        if (isNP) {
            npDays++;
            return;
        }

        const dayNumber = Number(
            day.querySelector(".day-number").textContent
        );

        const date = new Date(
            year,
            month - 1,
            dayNumber
        );

        // Mỗi ngày làm tính 11 giờ hành chính.
        normalHours += 11;

        // Chủ nhật mặc định 3 giờ OT, ngày khác 1 giờ.
        const defaultOT = date.getDay() === 0 ? 3 : 1;

        const otInput = day.querySelector(".ot-input");

        const enteredOT =
            otInput && otInput.value !== ""
                ? Number(otInput.value)
                : defaultOT;

        otHours += Math.max(0, enteredOT || 0);
    });

    document.getElementById("workDays").textContent =
        window.currentWorkDays - npDays;

    document.getElementById("offDays").textContent =
        window.currentOffDays + npDays;

    document.getElementById("normalHours").textContent =
        normalHours;

    document.getElementById("otHours").textContent =
        otHours;

    document.getElementById("totalHours").textContent =
        normalHours + otHours;
}

/* =========================================
   9. CẬP NHẬT NGÀY HÔM NAY
========================================= */

function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

let lastObservedDate = new Date();

function updateTodayHighlight() {
    const now = new Date();

    if (
        getLocalDateKey(now) ===
        getLocalDateKey(lastObservedDate)
    ) {
        return;
    }

    const previousDate = lastObservedDate;

    const wasShowingPreviousCurrentMonth =
        Number(monthSelect.value) ===
            previousDate.getMonth() + 1 &&
        Number(yearSelect.value) ===
            previousDate.getFullYear();

    lastObservedDate = now;

    if (wasShowingPreviousCurrentMonth) {
        const newYearExists = Array.from(
            yearSelect.options
        ).some(
            option =>
                Number(option.value) === now.getFullYear()
        );

        if (newYearExists) {
            monthSelect.value = String(
                now.getMonth() + 1
            );

            yearSelect.value = String(
                now.getFullYear()
            );
        }
    }

    // Vẽ lại khi ngày thực tế thay đổi.
    generateCalendar();
}

setInterval(updateTodayHighlight, 10000);

/* =========================================
   10. CÁC SỰ KIỆN CỦA LỊCH
========================================= */

generateBtn.addEventListener(
    "click",
    generateCalendar
);

employeeSelect.addEventListener("change", () => {
    updateShift();
    generateCalendar();
});

monthSelect.addEventListener(
    "change",
    generateCalendar
);

yearSelect.addEventListener(
    "change",
    generateCalendar
);

// Đánh dấu hoặc bỏ đánh dấu nghỉ phép.
calendar.addEventListener("click", event => {
    if (event.target.classList.contains("np-btn")) {
        event.target.classList.toggle("active");

        event.target.setAttribute(
            "aria-pressed",
            event.target.classList.contains("active")
                ? "true"
                : "false"
        );

        // Lưu NP của nhân viên đang chọn và ngày đang bấm.
        saveDayData(event.target.closest(".day"));

        calculateSummary();
    }
});

// Lưu giờ OT ngay khi thay đổi.
calendar.addEventListener("input", event => {
    if (event.target.classList.contains("ot-input")) {
        saveDayData(event.target.closest(".day"));
        calculateSummary();
    }
});

// Lưu lựa chọn hiện tại.
[employeeSelect, monthSelect, yearSelect].forEach(select => {
    select.addEventListener("change", saveSettings);
});

// Lưu lần cuối khi rời trang.
window.addEventListener("pagehide", writeSavedData);

/* =========================================
   11. TRỢ LÝ AI CHAT
   Không lưu nội dung trò chuyện
========================================= */

(() => {
    const API_URL =

        //chú ý đoạn nay, nếu bạn deploy lên server khác thì cần đổi lại URL backend Node.js
        "https://timekeeping-1-hgmy.onrender.com/api/chat";
        // "http://localhost:3000/api/chat";

    const toggle = document.getElementById("aiToggle");
    const chat = document.getElementById("aiChat");
    const closeBtn = document.getElementById("aiClose");
    const form = document.getElementById("aiForm");
    const input = document.getElementById("aiInput");
    const messages = document.getElementById("aiMessages");
    const sendBtn = document.getElementById("aiSend");

    if (
        !toggle ||
        !chat ||
        !closeBtn ||
        !form ||
        !input ||
        !messages ||
        !sendBtn
    ) {
        console.warn(
            "Chưa tìm thấy đầy đủ giao diện AI chat."
        );

        return;
    }

    const welcomeMessage =
        "Xin chào! Tôi là trợ lý AI. Bạn muốn hỏi điều gì?";

    function addMessage(text, type) {
        const element = document.createElement("div");

        element.className =
            "ai-message " +
            (type === "user" ? "ai-user" : "ai-bot");

        element.textContent = text;

        messages.appendChild(element);
        messages.scrollTop = messages.scrollHeight;

        return element;
    }

    function clearChat() {
        messages.replaceChildren();
        addMessage(welcomeMessage, "bot");
        input.value = "";
    }

    function openChat() {
        chat.classList.add("ai-open");
        chat.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
        input.focus();
    }

    function closeChat() {
        chat.classList.remove("ai-open");
        chat.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");

        // Đóng khung chat thì xóa nội dung trò chuyện.
        clearChat();
    }

    toggle.addEventListener("click", () => {
        if (chat.classList.contains("ai-open")) {
            closeChat();
        } else {
            openChat();
        }
    });

    closeBtn.addEventListener("click", closeChat);

    async function sendMessage(text) {
        const question = text.trim();

        if (!question || sendBtn.disabled) {
            return;
        }

        if (question.length > 2000) {
            addMessage(
                "Câu hỏi tối đa 2000 ký tự. Vui lòng rút gọn.",
                "bot"
            );

            return;
        }

        addMessage(question, "user");
        input.value = "";

        input.disabled = true;
        sendBtn.disabled = true;

        const loading = addMessage(
            "AI đang suy nghĩ...",
            "bot"
        );

        loading.classList.add("ai-loading");

        try {
            const response = await fetch(API_URL, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: question
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Yêu cầu AI thất bại."
                );
            }

            loading.textContent =
                data.reply || "AI chưa có câu trả lời.";

        } catch (error) {
            console.error("Lỗi AI:", error);

            loading.textContent =
                "Không kết nối được AI. Hãy kiểm tra " +
                "backend Node.js, API key và địa chỉ máy chủ.";

        } finally {
            loading.classList.remove("ai-loading");

            input.disabled = false;
            sendBtn.disabled = false;

            messages.scrollTop = messages.scrollHeight;

            if (chat.classList.contains("ai-open")) {
                input.focus();
            }
        }
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        sendMessage(input.value);
    });

    // Enter để gửi; Shift + Enter để xuống dòng.
    input.addEventListener("keydown", event => {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.isComposing
        ) {
            event.preventDefault();
            form.requestSubmit();
        }
    });
})();

/* =========================================
   12. KHỞI CHẠY WEBSITE
========================================= */

updateShift();
generateCalendar();
