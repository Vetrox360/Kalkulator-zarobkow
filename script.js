// script.js
const HOURLY_RATE_EUR = 12.41;
const EXCHANGE_RATE_PLN = 4.33;
const SECONDS_IN_HOUR = 3600;
const earningsElementEUR = document.getElementById("earningsEUR");
const earningsElementPLN = document.getElementById("earningsPLN");
const totalHoursElement = document.getElementById("totalHours");
const startHourInput = document.getElementById("startHour");
const endHourInput = document.getElementById("endHour");
const manualHoursInput = document.getElementById("manualHours");
const resetButton = document.getElementById("resetButton");
let startHourGlobal;
let endHourGlobal;
let intervalID;

function loadFromLocalStorage() {
    const earningsEUR = parseFloat(localStorage.getItem("earningsEUR")) || 0;
    const totalHours = parseFloat(localStorage.getItem("totalHours")) || 0;
    const savedStartHour = localStorage.getItem("startHour");
    const savedEndHour = localStorage.getItem("endHour");

    if (savedStartHour && savedEndHour) {
        startHourGlobal = savedStartHour;
        endHourGlobal = savedEndHour;
        startHourInput.value = startHourGlobal;
        endHourInput.value = endHourGlobal;
        clearInterval(intervalID);
        intervalID = setInterval(incrementEarnings, 1000);
    }

    updateDisplay(earningsEUR, totalHours);
}

function saveToLocalStorage(earningsEUR, totalHours) {
    localStorage.setItem("earningsEUR", earningsEUR);
    localStorage.setItem("totalHours", totalHours);
    if (startHourGlobal && endHourGlobal) {
        localStorage.setItem("startHour", startHourGlobal);
        localStorage.setItem("endHour", endHourGlobal);
    }
}

function updateDisplay(earningsEUR, totalHours) {
    earningsElementEUR.textContent = earningsEUR.toFixed(2);
    earningsElementPLN.textContent = (earningsEUR * EXCHANGE_RATE_PLN).toFixed(2);
    totalHoursElement.textContent = totalHours.toFixed(2);
}

function calculateEarnings(currentTime, startHour, endHour) {
    const start = new Date();
    const [startH, startM] = startHour.split(':').map(Number);
    start.setHours(startH, startM, 0, 0);

    const end = new Date();
    const [endH, endM] = endHour.split(':').map(Number);
    end.setHours(endH, endM, 0, 0);

    if (currentTime >= end) {
        return (end - start) / 1000 / SECONDS_IN_HOUR; // All hours are worked
    } else if (currentTime >= start) {
        return (currentTime - start) / 1000 / SECONDS_IN_HOUR; // Partial hours are worked
    } else {
        return 0; // No hours are worked yet
    }
}

document.getElementById("workForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const startHour = startHourInput.value;
    const endHour = endHourInput.value;

    startHourGlobal = startHour;
    endHourGlobal = endHour;

    const currentTime = new Date();

    const workedHours = calculateEarnings(currentTime, startHour, endHour);
    let earningsEUR = parseFloat(localStorage.getItem("earningsEUR")) || 0;
    let totalHours = parseFloat(localStorage.getItem("totalHours")) || 0;

    earningsEUR += workedHours * HOURLY_RATE_EUR;
    totalHours += workedHours;

    saveToLocalStorage(earningsEUR, totalHours);
    updateDisplay(earningsEUR, totalHours);

    clearInterval(intervalID);
    intervalID = setInterval(incrementEarnings, 1000);
});

document.getElementById("addManualHours").addEventListener("click", () => {
    const manualHours = parseFloat(manualHoursInput.value);
    if (!isNaN(manualHours) && manualHours > 0) {
        let earningsEUR = parseFloat(localStorage.getItem("earningsEUR")) || 0;
        let totalHours = parseFloat(localStorage.getItem("totalHours")) || 0;

        earningsEUR += manualHours * HOURLY_RATE_EUR;
        totalHours += manualHours;

        saveToLocalStorage(earningsEUR, totalHours);
        updateDisplay(earningsEUR, totalHours);
    }
});

function incrementEarnings() {
    const currentTime = new Date();
    const [endH, endM] = endHourGlobal.split(':').map(Number);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    if (currentTime >= end) {
        clearInterval(intervalID);
        return;
    }

    let earningsEUR = parseFloat(localStorage.getItem("earningsEUR")) || 0;
    let totalHours = parseFloat(localStorage.getItem("totalHours")) || 0;

    earningsEUR += HOURLY_RATE_EUR / SECONDS_IN_HOUR;
    totalHours += 1 / SECONDS_IN_HOUR;

    saveToLocalStorage(earningsEUR, totalHours);
    updateDisplay(earningsEUR, totalHours);
}

resetButton.addEventListener("click", () => {
    clearInterval(intervalID);
    saveToLocalStorage(0, 0);
    updateDisplay(0, 0);
    startHourGlobal = null;
    endHourGlobal = null;
    localStorage.removeItem("startHour");
    localStorage.removeItem("endHour");
});

loadFromLocalStorage();