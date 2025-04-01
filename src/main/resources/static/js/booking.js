// Booking Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createBooking();
        });
    }
});

// Create a new booking
async function createBooking() {
    // Check if user is logged in
    if (!currentUser) {
        // Show login modal
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        return;
    }

    const carId = document.getElementById('carId').value;
    const dateRange = document.getElementById('dateRange').value;

    if (!dateRange) {
        alert('Please select booking dates');
        return;
    }

    const dates = parseDateRange(dateRange);
    if (!dates) {
        alert('Invalid date range');
        return;
    }

    const totalPrice = parseFloat(document.getElementById('totalPrice').textContent);

    try {
        // Create booking
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                carId: carId,
                startDate: dates.startDate,
                endDate: dates.endDate,
                totalPrice: totalPrice
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create booking');
        }

        const booking = await response.json();

        // Close the car modal
        const carModal = bootstrap.Modal.getInstance(document.getElementById('carModal'));
        carModal.hide();

        // Show success message
        showSuccessMessage('Booking created successfully! The booking is pending approval.');

    } catch (error) {
        alert(error.message);
    }
}

// Load user bookings
async function loadUserBookings() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/bookings/user/${currentUser.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        const bookings = await response.json();
        displayUserBookings(bookings);

        // Show bookings modal
        const bookingsModal = new bootstrap.Modal(document.getElementById('bookingsModal'));
        bookingsModal.show();

    } catch (error) {
        console.error('Error loading bookings:', error);
        alert('Failed to load bookings. Please try again.');
    }
}

// Display user bookings in the modal
function displayUserBookings(bookings) {
    const tableBody = document.getElementById('bookingsTableBody');
    const noBookingsMessage = document.getElementById('noBookingsMessage');

    if (bookings.length === 0) {
        tableBody.innerHTML = '';
        noBookingsMessage.classList.remove('d-none');
        return;
    }

    noBookingsMessage.classList.add('d-none');

    // Sort bookings by start date (most recent first)
    bookings.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    let bookingsHTML = '';

    bookings.forEach(booking => {
        const car = cars.find(c => c.id === booking.carId) || { brand: 'Unknown', model: 'Unknown' };
        const startDate = new Date(booking.startDate).toLocaleDateString();
        const endDate = new Date(booking.endDate).toLocaleDateString();

        let statusClass = '';
        switch (booking.status) {
            case 'PENDING':
                statusClass = 'bg-warning';
                break;
            case 'APPROVED':
                statusClass = 'bg-success';
                break;
            case 'CANCELLED':
                statusClass = 'bg-danger';
                break;
            default:
                statusClass = 'bg-secondary';
        }

        bookingsHTML += `
            <tr>
                <td>${car.brand} ${car.model}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>$${booking.totalPrice.toFixed(2)}</td>
                <td><span class="badge ${statusClass}">${booking.status}</span></td>
                <td>
                    ${booking.status === 'PENDING' ?
                      `<button class="btn btn-sm btn-danger cancel-booking-btn" data-booking-id="${booking.id}">Cancel</button>` :
                      ''}
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = bookingsHTML;

    // Add event listeners to cancel buttons
    document.querySelectorAll('.cancel-booking-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            cancelBooking(bookingId);
        });
    });
}

// Cancel a booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to cancel booking');
        }

        // Reload bookings
        loadUserBookings();

    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
    }
}