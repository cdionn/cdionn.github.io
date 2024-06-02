const reservations = {
    'Cevat': [],
    'Tibet': [],
    'Dion': []
};

const deletedReservations = [];

const openingHours = {
    'Mo': { start: '09:00', end: '18:00' },
    'Di': { start: '09:00', end: '18:00' },
    'Mi': { start: '09:00', end: '18:00' },
    'Do': { start: '09:00', end: '18:00' },
    'Fr': { start: '09:00', end: '18:00' },
    'Sa': { start: '10:00', end: '17:00' },
    'So': { start: null, end: null } // Geschlossen
};

// Lade gespeicherte Reservierungen und Auto-Delete-Status aus dem localStorage
if (localStorage.getItem('reservations')) {
    Object.assign(reservations, JSON.parse(localStorage.getItem('reservations')));
}
if (localStorage.getItem('deletedReservations')) {
    deletedReservations.push(...JSON.parse(localStorage.getItem('deletedReservations')));
}
if (localStorage.getItem('autoDeleteStatus') === 'true') {
    document.getElementById('auto-delete').checked = true;
}

document.getElementById('calendar').valueAsDate = new Date();
populateAutoDeleteTimeOptions();
loadAutoDeleteTime();
loadReservations();
loadDeletedReservations();
updateCurrentTime();
setInterval(updateCurrentTime, 1000);
updateNextReservations();

document.addEventListener('DOMContentLoaded', () => {
    // Load server settings from localStorage
    const serverAddress = localStorage.getItem('serverAddress');
    if (serverAddress) {
        document.getElementById('server-address').value = serverAddress;
    }
    checkServerStatus();
});

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('current-time').innerText = `Aktuelle Uhrzeit: ${timeString}`;
    if (document.getElementById('auto-delete').checked) {
        checkAndDeleteExpiredReservations();
    }
}

function saveReservations() {
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

function saveDeletedReservations() {
    localStorage.setItem('deletedReservations', JSON.stringify(deletedReservations));
}

function saveAutoDeleteStatus() {
    const autoDeleteStatus = document.getElementById('auto-delete').checked;
    localStorage.setItem('autoDeleteStatus', autoDeleteStatus);
}

function saveAutoDeleteTime() {
    const autoDeleteTime = document.getElementById('auto-delete-time').value;
    localStorage.setItem('autoDeleteTime', autoDeleteTime);
}

function loadAutoDeleteTime() {
    const autoDeleteTimeSelect = document.getElementById('auto-delete-time');
    const savedTime = localStorage.getItem('autoDeleteTime') || 15; // Standardmäßig auf 15 Minuten setzen
    autoDeleteTimeSelect.value = savedTime;
}

function populateAutoDeleteTimeOptions() {
    const autoDeleteTimeSelect = document.getElementById('auto-delete-time');
    for (let i = 5; i <= 60; i += 5) {
        const option = document.createElement('option');
        option.value = i;
        option.innerText = `${i} Minuten`;
        autoDeleteTimeSelect.appendChild(option);
    }
    autoDeleteTimeSelect.value = 15; // Standardmäßig auf 15 Minuten setzen
}

function loadReservations() {
    const selectedDate = document.getElementById('calendar').value;
    document.getElementById('selected-date').innerText = selectedDate;

    const date = new Date(selectedDate);
    const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
    const hours = openingHours[day];

    const reservationsList = document.getElementById('reservations-list');
    reservationsList.innerHTML = '';

    for (let barber in reservations) {
        const barberReservations = reservations[barber].filter(res => res.date === selectedDate);
        barberReservations.sort((a, b) => a.time.localeCompare(b.time));
        const barberSection = document.createElement('div');
        barberSection.innerHTML = `<h3>${barber}</h3>`;
        barberReservations.forEach(res => {
            const reservationItem = document.createElement('div');
            reservationItem.innerText = `${res.time} - ${res.customer}`;
            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Löschen';
            deleteButton.onclick = () => deleteReservation(barber, res.date, res.time);
            reservationItem.appendChild(deleteButton);
            barberSection.appendChild(reservationItem);
        });
        reservationsList.appendChild(barberSection);
    }

    displayAvailableTimes();
    loadAvailableTimes();
}

function loadDeletedReservations() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    const selectedDate = document.getElementById('calendar').value;

    deletedReservations
        .filter(res => res.date === selectedDate)
        .forEach(res => {
            const historyItem = document.createElement('div');
            historyItem.innerText = `${res.time} - ${res.customer} (Friseur: ${res.barber})`;
            const restoreButton = document.createElement('button');
            restoreButton.innerText = 'Wiederherstellen';
            restoreButton.onclick = () => restoreReservation(res);
            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Löschen';
            deleteButton.onclick = () => permanentlyDeleteReservation(res);
            historyItem.appendChild(restoreButton);
            historyItem.appendChild(deleteButton);
            historyList.appendChild(historyItem);
        });
}

function toggleHistory() {
    const historyList = document.getElementById('history-list');
    historyList.classList.toggle('hidden');
}

function displayAvailableTimes() {
    const selectedDate = document.getElementById('calendar').value;
    const date = new Date(selectedDate);
    const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
    const hours = openingHours[day];

    const availableTimesList = document.getElementById('available-times');
    availableTimesList.innerHTML = '';

    if (!hours.start || !hours.end) {
        availableTimesList.innerHTML = '<li>Keine freien Uhrzeiten heute</li>';
        checkForNextAvailableDay();
        return;
    }

    const start = hours.start.split(':');
    const end = hours.end.split(':');
    const currentDate = new Date();
    const currentTime = currentDate.toTimeString().split(' ')[0].substring(0, 5);

    const startDate = new Date();
    startDate.setHours(start[0], start[1], 0, 0);

    const endDate = new Date();
    endDate.setHours(end[0], end[1], 0, 0);

    let hasAvailableTimes = false;

    while (startDate < endDate) {
        const time = startDate.toTimeString().split(' ')[0].substring(0, 5);
        if (time > currentTime || selectedDate !== currentDate.toISOString().split('T')[0]) {
            let availableBarbers = [];
            for (let barber in reservations) {
                const isReserved = reservations[barber].some(res => res.date === selectedDate && res.time === time);
                if (!isReserved) {
                    availableBarbers.push(barber);
                }
            }
            if (availableBarbers.length > 0) {
                const timeItem = document.createElement('li');
                timeItem.innerText = `${time} - Frei: ${availableBarbers.join(', ')}`;
                availableTimesList.appendChild(timeItem);
                hasAvailableTimes = true;
            }
        }
        startDate.setMinutes(startDate.getMinutes() + 30);
    }

    if (!hasAvailableTimes) {
        availableTimesList.innerHTML = '<li>Keine freien Uhrzeiten heute</li>';
        checkForNextAvailableDay();
    }
}

function checkForNextAvailableDay() {
    const currentDate = new Date(document.getElementById('calendar').value);
    let nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);

    while (true) {
        const day = nextDate.toLocaleDateString('de-DE', { weekday: 'short' });
        const hours = openingHours[day];

        if (hours.start && hours.end) {
            document.getElementById('calendar').valueAsDate = nextDate;
            loadReservations();
            loadDeletedReservations();
            break;
        }
        nextDate.setDate(nextDate.getDate() + 1);
    }
}

function loadAvailableTimes() {
    const selectedDate = document.getElementById('calendar').value;
    const barber = document.getElementById('barber').value;
    const availableTimes = document.getElementById('time');
    const timeLabel = document.getElementById('time-label');
    const noTimesMessage = document.getElementById('no-times-message');
    const reserveButton = document.getElementById('reserve-button');
    const customerNameField = document.getElementById('customer-name');
    const customerNameLabel = document.getElementById('customer-name-label');
    const reservationHeading = document.getElementById('reservation-heading');
    availableTimes.innerHTML = '';

    const date = new Date(selectedDate);
    const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
    const hours = openingHours[day];

    if (!hours.start || !hours.end) {
        availableTimes.style.display = 'none';
        timeLabel.style.display = 'none';
        noTimesMessage.style.display = 'block';
        reserveButton.style.display = 'none';
        customerNameField.style.display = 'none';
        customerNameLabel.style.display = 'none';
        reservationHeading.style.display = 'none';
        return;
    }

    const start = hours.start.split(':');
    const end = hours.end.split(':');
    const currentDate = new Date();
    const currentTime = currentDate.toTimeString().split(' ')[0].substring(0, 5);

    const reservationsForBarber = reservations[barber].filter(res => res.date === selectedDate);

    const startDate = new Date();
    startDate.setHours(start[0], start[1], 0, 0);

    const endDate = new Date();
    endDate.setHours(end[0], end[1], 0, 0);

    let hasAvailableTimes = false;

    while (startDate < endDate) {
        const time = startDate.toTimeString().split(' ')[0].substring(0, 5);
        if (time > currentTime || selectedDate !== currentDate.toISOString().split('T')[0]) {
            const isReserved = reservationsForBarber.some(res => res.time === time);
            if (!isReserved) {
                const timeOption = document.createElement('option');
                timeOption.value = time;
                timeOption.innerText = time;
                availableTimes.appendChild(timeOption);
                hasAvailableTimes = true;
            }
        }
        startDate.setMinutes(startDate.getMinutes() + 30);
    }

    if (hasAvailableTimes) {
        availableTimes.style.display = 'block';
        timeLabel.style.display = 'block';
        noTimesMessage.style.display = 'none';
        reserveButton.style.display = 'block';
        customerNameField.style.display = 'block';
        customerNameLabel.style.display = 'block';
        reservationHeading.style.display = 'block';
    } else {
        availableTimes.style.display = 'none';
        timeLabel.style.display = 'none';
        noTimesMessage.style.display = 'block';
        reserveButton.style.display = 'none';
        customerNameField.style.display = 'none';
        customerNameLabel.style.display = 'none';
        reservationHeading.style.display = 'none';
    }
}

function addReservation(event) {
    event.preventDefault();
    let customer = document.getElementById('customer-name').value.trim();
    const barber = document.getElementById('barber').value;
    const time = document.getElementById('time').value;
    const date = document.getElementById('calendar').value;

    if (!customer) {
        customer = 'Kunde';
    }

    const reservation = { customer_name: customer, barber, date, time };

    fetch(`${localStorage.getItem('serverAddress')}/reservations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservation)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add reservation');
        }
        return response.text();
    })
    .then(data => {
        console.log(data);
        // Update local storage and UI
        if (!reservations[barber]) {
            reservations[barber] = [];
        }
        reservations[barber].push({ date, time, customer });
        saveReservations();
        loadReservations();
        loadDeletedReservations();
        updateNextReservations();
    })
    .catch(error => {
        console.error('Error:', error);
    });

    // Reset the form but not the auto-delete checkbox and auto-delete time
    const autoDeleteStatus = document.getElementById('auto-delete').checked;
    const autoDeleteTime = document.getElementById('auto-delete-time').value;
    document.getElementById('reservation-form').reset();
    document.getElementById('barber').value = barber; // Keep the selected barber
    document.getElementById('auto-delete').checked = autoDeleteStatus;
    document.getElementById('auto-delete-time').value = autoDeleteTime;
    loadAvailableTimes();
}

function deleteReservation(barber, date, time) {
    const reservationIndex = reservations[barber].findIndex(res => res.date === date && res.time === time);
    if (reservationIndex !== -1) {
        const deletedReservation = reservations[barber].splice(reservationIndex, 1)[0];
        deletedReservations.push({ ...deletedReservation, barber });
        saveReservations();
        saveDeletedReservations();
        loadReservations();
        loadDeletedReservations();
        updateNextReservations(); // Update next reservations
    }
}

function restoreReservation(reservation) {
    reservations[reservation.barber].push({
        date: reservation.date,
        time: reservation.time,
        customer: reservation.customer
    });
    const index = deletedReservations.indexOf(reservation);
    if (index !== -1) {
        deletedReservations.splice(index, 1);
    }
    saveReservations();
    saveDeletedReservations();
    loadReservations();
    loadDeletedReservations();
    updateNextReservations(); // Update next reservations
}

function permanentlyDeleteReservation(reservation) {
    const index = deletedReservations.indexOf(reservation);
    if (index !== -1) {
        deletedReservations.splice(index, 1);
    }
    saveDeletedReservations();
    loadDeletedReservations();
}

function checkAndDeleteExpiredReservations() {
    const now = new Date();
    const autoDeleteTime = parseInt(localStorage.getItem('autoDeleteTime')) || 15;
    for (let barber in reservations) {
        reservations[barber] = reservations[barber].filter(res => {
            const resTime = new Date(`${res.date}T${res.time}`);
            return now - resTime <= autoDeleteTime * 60 * 1000; // Auto-Delete-Zeit
        });
    }
    saveReservations();
    loadReservations();
}

function goToToday() {
    document.getElementById('calendar').valueAsDate = new Date();
    loadReservations();
    loadDeletedReservations();
    updateNextReservations(); // Update next reservations
}

function updateNextReservations() {
    const selectedDate = document.getElementById('calendar').value;
    const now = new Date();
    const nextReservationCevatList = document.getElementById('next-reservation-cevat-list');
    const nextReservationTibetList = document.getElementById('next-reservation-tibet-list');
    const nextReservationDionList = document.getElementById('next-reservation-dion-list');

    nextReservationCevatList.innerHTML = '';
    nextReservationTibetList.innerHTML = '';
    nextReservationDionList.innerHTML = '';

    const barbers = ['Cevat', 'Tibet', 'Dion'];

    barbers.forEach(barber => {
        const nextReservationList = document.getElementById(`next-reservation-${barber.toLowerCase()}-list`);
        const barberReservations = reservations[barber]
            .filter(res => res.date === selectedDate && new Date(`${res.date}T${res.time}`) > now)
            .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

        if (barberReservations.length > 0) {
            const nextReservation = barberReservations[0];
            const reservationItem = document.createElement('div');
            reservationItem.innerText = `${nextReservation.time} - ${nextReservation.customer}`;
            nextReservationList.appendChild(reservationItem);
        } else {
            const noReservationItem = document.createElement('div');
            noReservationItem.innerText = 'Keine kommenden Reservierungen';
            nextReservationList.appendChild(noReservationItem);
        }
    });
}

function toggleSettings() {
    document.getElementById('settings-container').classList.toggle('hidden');
}

function saveServerSettings() {
    const serverAddress = document.getElementById('server-address').value;
    localStorage.setItem('serverAddress', serverAddress);
    checkServerStatus();
}

function checkServerStatus() {
    const serverAddress = localStorage.getItem('serverAddress');
    if (!serverAddress) {
        updateServerStatus('Disconnected');
        return;
    }

    fetch(`${serverAddress}/status`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                updateServerStatus('Connected');
                synchronizeData();
            } else {
                updateServerStatus('Disconnected');
            }
        })
        .catch(() => {
            updateServerStatus('Disconnected');
        });
}

function updateServerStatus(status) {
    document.getElementById('status-indicator').innerText = status;
}

function synchronizeData() {
    const reservationsData = localStorage.getItem('reservations');
    const deletedReservationsData = localStorage.getItem('deletedReservations');

    fetch(`${localStorage.getItem('serverAddress')}/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reservations: reservationsData ? JSON.parse(reservationsData) : {},
            deletedReservations: deletedReservationsData ? JSON.parse(deletedReservationsData) : []
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            console.log('Data synchronized successfully');
        } else {
            console.error('Failed to synchronize data');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
