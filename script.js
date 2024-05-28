const reservations = {
    'Cevat': [],
    'Tibet': [],
    'Dion': []
};

const openingHours = {
    'Mo': { start: '09:00', end: '18:00' },
    'Di': { start: '09:00', end: '18:00' },
    'Mi': { start: '09:00', end: '18:00' },
    'Do': { start: '09:00', end: '18:00' },
    'Fr': { start: '09:00', end: '18:00' },
    'Sa': { start: '10:00', end: '17:00' },
    'So': { start: null, end: null } // Geschlossen
};

// Lade gespeicherte Reservierungen aus dem localStorage
if (localStorage.getItem('reservations')) {
    Object.assign(reservations, JSON.parse(localStorage.getItem('reservations')));
}

document.getElementById('calendar').valueAsDate = new Date();
loadReservations();
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('current-time').innerText = `Aktuelle Uhrzeit: ${timeString}`;
}

function saveReservations() {
    localStorage.setItem('reservations', JSON.stringify(reservations));
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

function displayAvailableTimes() {
    const selectedDate = document.getElementById('calendar').value;
    const date = new Date(selectedDate);
    const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
    const hours = openingHours[day];

    const availableTimesList = document.getElementById('available-times');
    availableTimesList.innerHTML = '';

    if (!hours.start || !hours.end) {
        availableTimesList.innerHTML = '<li>Keine freien Uhrzeiten heute</li>';
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
            }
        }
        startDate.setMinutes(startDate.getMinutes() + 30);
    }

    if (availableTimesList.innerHTML === '') {
        availableTimesList.innerHTML = '<li>Keine freien Uhrzeiten heute</li>';
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

    const isReserved = reservations[barber].some(res => res.date === date && res.time === time);

    if (!isReserved) {
        reservations[barber].push({ date, time, customer });
        saveReservations();
        loadReservations();
    } else {
        alert('Dieser Termin ist bereits reserviert.');
    }

    document.getElementById('reservation-form').reset();
    document.getElementById('barber').value = barber; // Keep the selected barber
    loadAvailableTimes();
}

function deleteReservation(barber, date, time) {
    reservations[barber] = reservations[barber].filter(res => !(res.date === date && res.time === time));
    saveReservations();
    loadReservations();
}

function goToToday() {
    document.getElementById('calendar').valueAsDate = new Date();
    loadReservations();
}
