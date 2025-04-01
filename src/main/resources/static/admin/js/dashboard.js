// Global Variables
const API_URL = 'http://localhost:8080/api';
let currentAdmin = null;
let cars = [];
let users = [];
let bookings = [];
let currentBookingTab = 'pending';
let monthlyRevenueChart = null;
let carUsageChart = null;

// DOM Elements
const dashboardTab = document.getElementById('dashboardTab');
const bookingsTab = document.getElementById('bookingsTab');
const carsTab = document.getElementById('carsTab');
const usersTab = document.getElementById('usersTab');
const dashboardContent = document.getElementById('dashboardContent');
const bookingsContent = document.getElementById('bookingsContent');
const carsContent = document.getElementById('carsContent');
const usersContent = document.getElementById('usersContent');
const adminName = document.getElementById('adminName');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const pendingCounter = document.getElementById('pendingCounter');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is logged in
    checkAdminAuth();

    // Set up event listeners
    setupEventListeners();

    // Load dashboard data
    loadDashboardData();
});

// Check if admin is logged in
function checkAdminAuth() {
    const user = localStorage.getItem('user');
    if (user) {
        const parsedUser = JSON.parse(user);
        if (parsedUser.role === 'ADMIN') {
            currentAdmin = parsedUser;
            adminName.textContent = currentAdmin.name;
        } else {
            // Redirect to home if not admin
            window.location.href = '../index.html';
        }
    } else {
        // Redirect to home if not logged in
        window.location.href = '../index.html';
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Tab navigation
    dashboardTab.addEventListener('click', function(e) {
        e.preventDefault();
        showTab('dashboard');
    });

    bookingsTab.addEventListener('click', function(e) {
        e.preventDefault();
        showTab('bookings');
        loadBookings();
    });

    carsTab.addEventListener('click', function(e) {
        e.preventDefault();
        showTab('cars');
        loadCars();
    });

    usersTab.addEventListener('click', function(e) {
        e.preventDefault();
        showTab('users');
        loadUsers();
    });

    // Booking tabs
    document.getElementById('pendingBookingsTab').addEventListener('click', function(e) {
        e.preventDefault();
        setBookingTab('pending');
    });

    document.getElementById('approvedBookingsTab').addEventListener('click', function(e) {
        e.preventDefault();
        setBookingTab('approved');
    });

    document.getElementById('cancelledBookingsTab').addEventListener('click', function(e) {
        e.preventDefault();
        setBookingTab('cancelled');
    });

    document.getElementById('allBookingsTab').addEventListener('click', function(e) {
        e.preventDefault();
        setBookingTab('all');
    });

    // Logout button
    adminLogoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logoutAdmin();
    });

    // Car form
    document.getElementById('carForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCarForm();
    });
}

// Show the selected tab
function showTab(tabName) {
    // Reset all tabs
    dashboardTab.classList.remove('active');
    bookingsTab.classList.remove('active');
    carsTab.classList.remove('active');
    usersTab.classList.remove('active');

    dashboardContent.classList.add('d-none');
    bookingsContent.classList.add('d-none');
    carsContent.classList.add('d-none');
    usersContent.classList.add('d-none');

    // Show selected tab
    switch (tabName) {
        case 'dashboard':
            dashboardTab.classList.add('active');
            dashboardContent.classList.remove('d-none');
            break;
        case 'bookings':
            bookingsTab.classList.add('active');
            bookingsContent.classList.remove('d-none');
            break;
        case 'cars':
            carsTab.classList.add('active');
            carsContent.classList.remove('d-none');
            break;
        case 'users':
            usersTab.classList.add('active');
            usersContent.classList.remove('d-none');
            break;
    }
}

// Set the booking tab
function setBookingTab(tabName) {
    // Reset all booking tabs
    document.getElementById('pendingBookingsTab').classList.remove('active');
    document.getElementById('approvedBookingsTab').classList.remove('active');
    document.getElementById('cancelledBookingsTab').classList.remove('active');
    document.getElementById('allBookingsTab').classList.remove('active');

    // Set active tab
    document.getElementById(`${tabName}BookingsTab`).classList.add('active');

    currentBookingTab = tabName;
    filterBookings();
}

// Filter bookings based on current tab
function filterBookings() {
    if (!bookings || bookings.length === 0) return;

    let filteredBookings;

    switch (currentBookingTab) {
        case 'pending':
            filteredBookings = bookings.filter(booking => booking.status === 'PENDING');
            break;
        case 'approved':
            filteredBookings = bookings.filter(booking => booking.status === 'APPROVED');
            break;
        case 'cancelled':
            filteredBookings = bookings.filter(booking => booking.status === 'CANCELLED');
            break;
        case 'all':
        default:
            filteredBookings = [...bookings];
    }

    displayBookings(filteredBookings);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`);
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();

        // Update dashboard numbers
        document.getElementById('totalCars').textContent = data.totalCars;
        document.getElementById('totalBookings').textContent = data.totalBookings;
        document.getElementById('pendingBookings').textContent = data.pendingBookings;
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('totalRevenue').textContent = '$' + data.totalRevenue.toFixed(2);
        document.getElementById('monthlyRevenue').textContent = '$' + data.monthlyRevenue.toFixed(2);

        // Update pending counter badge
        pendingCounter.textContent = data.pendingBookings;
        pendingCounter.style.display = data.pendingBookings > 0 ? 'flex' : 'none';

        // Load recent bookings
        if (data.recentBookings) {
            displayRecentBookings(data.recentBookings);
        } else {
            loadRecentBookings();
        }

        // Load statistics charts
        loadMonthlyRevenueChart();
        loadCarUsageChart();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Failed to load dashboard data. Please try again.');
    }
}

// Load recent bookings for dashboard
async function loadRecentBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings`);
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        const allBookings = await response.json();

        // Sort by booking date (most recent first) and take first 5
        const recentBookings = allBookings
            .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
            .slice(0, 5);

        // Load users and cars data for display
        await loadUsersAndCars();

        displayRecentBookings(recentBookings);

    } catch (error) {
        console.error('Error loading recent bookings:', error);
        document.getElementById('recentBookingsTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Failed to load recent bookings.</td>
            </tr>
        `;
    }
}

// Display recent bookings on dashboard
function displayRecentBookings(recentBookings) {
    const tableBody = document.getElementById('recentBookingsTable');

    if (recentBookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No bookings found.</td>
            </tr>
        `;
        return;
    }

    let html = '';

    recentBookings.forEach(booking => {
        const user = users.find(u => u.id === booking.userId) || { name: 'Unknown' };
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

        html += `
            <tr>
                <td>${booking.id.substring(0, 8)}...</td>
                <td>${user.name}</td>
                <td>${car.brand} ${car.model}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td><span class="badge ${statusClass}">${booking.status}</span></td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// Load all bookings
async function loadBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings`);
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        bookings = await response.json();

        // Load users and cars data for display
        await loadUsersAndCars();

        // Apply current filter
        filterBookings();

    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsTable').innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Failed to load bookings.</td>
            </tr>
        `;
    }
}

// Display bookings
function displayBookings(filteredBookings) {
    const tableBody = document.getElementById('bookingsTable');

    if (filteredBookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No bookings found.</td>
            </tr>
        `;
        return;
    }

    let html = '';

    filteredBookings.forEach(booking => {
        const user = users.find(u => u.id === booking.userId) || { name: 'Unknown' };
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

        html += `
            <tr>
                <td>${booking.id.substring(0, 8)}...</td>
                <td>${user.name}</td>
                <td>${car.brand} ${car.model}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>$${booking.totalPrice.toFixed(2)}</td>
                <td><span class="badge ${statusClass}">${booking.status}</span></td>
                <td>
                    ${booking.status === 'PENDING' ?
                      `<button class="btn btn-sm btn-success me-1 approve-booking-btn" data-booking-id="${booking.id}">
                          <i class="fas fa-check"></i>
                      </button>
                      <button class="btn btn-sm btn-danger cancel-booking-btn" data-booking-id="${booking.id}">
                          <i class="fas fa-times"></i>
                      </button>` :
                      ''}
                    <button class="btn btn-sm btn-info view-booking-btn" data-booking-id="${booking.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    // Add event listeners to buttons
    document.querySelectorAll('.approve-booking-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            approveBooking(bookingId);
        });
    });

    document.querySelectorAll('.cancel-booking-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            cancelBooking(bookingId);
        });
    });

    document.querySelectorAll('.view-booking-btn').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            viewBooking(bookingId);
        });
    });
}

// Approve a booking
async function approveBooking(bookingId) {
    if (!confirm('Are you sure you want to approve this booking?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/bookings/${bookingId}/approve`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to approve booking');
        }

        // Reload bookings and dashboard
        loadBookings();
        loadDashboardData();

        alert('Booking approved successfully!');

    } catch (error) {
        console.error('Error approving booking:', error);
        alert('Failed to approve booking. Please try again.');
    }
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

        // Reload bookings and dashboard
        loadBookings();
        loadDashboardData();

        alert('Booking cancelled successfully!');

    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
    }
}

// View booking details
function viewBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const user = users.find(u => u.id === booking.userId) || { name: 'Unknown', email: 'Unknown', phone: 'Unknown' };
    const car = cars.find(c => c.id === booking.carId) || { brand: 'Unknown', model: 'Unknown', year: 'Unknown', color: 'Unknown' };

    const startDate = new Date(booking.startDate).toLocaleDateString();
    const endDate = new Date(booking.endDate).toLocaleDateString();
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString();

    // Populate booking information
    document.getElementById('bookingDetailId').textContent = booking.id;
    document.getElementById('bookingDetailStartDate').textContent = startDate;
    document.getElementById('bookingDetailEndDate').textContent = endDate;
    document.getElementById('bookingDetailPrice').textContent = '$' + booking.totalPrice.toFixed(2);

    let statusBadge = '';
    switch (booking.status) {
        case 'PENDING':
            statusBadge = '<span class="badge bg-warning">PENDING</span>';
            break;
        case 'APPROVED':
            statusBadge = '<span class="badge bg-success">APPROVED</span>';
            break;
        case 'CANCELLED':
            statusBadge = '<span class="badge bg-danger">CANCELLED</span>';
            break;
        default:
            statusBadge = '<span class="badge bg-secondary">UNKNOWN</span>';
    }

    document.getElementById('bookingDetailStatus').innerHTML = statusBadge;
    document.getElementById('bookingDetailBookingDate').textContent = bookingDate;

    // Populate user information
    document.getElementById('bookingDetailUserName').textContent = user.name;
    document.getElementById('bookingDetailUserEmail').textContent = user.email;
    document.getElementById('bookingDetailUserPhone').textContent = user.phone || 'N/A';

    // Populate car information
    document.getElementById('bookingDetailCarBrand').textContent = car.brand;
    document.getElementById('bookingDetailCarModel').textContent = car.model;
    document.getElementById('bookingDetailCarYear').textContent = car.year;
    document.getElementById('bookingDetailCarColor').textContent = car.color;

    // Show/hide action buttons based on booking status
    const actionsDiv = document.getElementById('bookingDetailActions');
    const approveBtn = document.getElementById('bookingDetailApproveBtn');
    const cancelBtn = document.getElementById('bookingDetailCancelBtn');

    if (booking.status === 'PENDING') {
        actionsDiv.style.display = 'block';

        // Set up action buttons
        approveBtn.onclick = () => {
            approveBookingFromModal(booking.id);
        };

        cancelBtn.onclick = () => {
            cancelBookingFromModal(booking.id);
        };
    } else {
        actionsDiv.style.display = 'none';
    }

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('viewBookingModal'));
    modal.show();
}

// Approve booking from modal
async function approveBookingFromModal(bookingId) {
    if (!confirm('Are you sure you want to approve this booking?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/bookings/${bookingId}/approve`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to approve booking');
        }

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewBookingModal'));
        modal.hide();

        // Reload bookings and dashboard
        loadBookings();
        loadDashboardData();

        alert('Booking approved successfully!');

    } catch (error) {
        console.error('Error approving booking:', error);
        alert('Failed to approve booking. Please try again.');
    }
}

// Cancel booking from modal
async function cancelBookingFromModal(bookingId) {
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

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewBookingModal'));
        modal.hide();

        // Reload bookings and dashboard
        loadBookings();
        loadDashboardData();

        alert('Booking cancelled successfully!');

    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
    }
}

// Load all cars
async function loadCars() {
    try {
        const response = await fetch(`${API_URL}/cars`);
        if (!response.ok) {
            throw new Error('Failed to fetch cars');
        }

        cars = await response.json();
        displayCars(cars);

    } catch (error) {
        console.error('Error loading cars:', error);
        document.getElementById('carsTable').innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Failed to load cars.</td>
            </tr>
        `;
    }
}

// Display cars
function displayCars(carsToDisplay) {
    const tableBody = document.getElementById('carsTable');

    if (carsToDisplay.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">No cars found.</td>
            </tr>
        `;
        return;
    }

    let html = '';

    carsToDisplay.forEach(car => {
        html += `
            <tr>
                <td>${car.id.substring(0, 8)}...</td>
                <td>
                    <img src="${car.imageUrl || 'https://via.placeholder.com/50x30?text=Car'}"
                         alt="${car.brand} ${car.model}" width="50" height="30"
                         style="object-fit: cover; border-radius: 4px;">
                </td>
                <td>${car.brand}</td>
                <td>${car.model}</td>
                <td>${car.year}</td>
                <td>$${car.pricePerDay.toFixed(2)}</td>
                <td>
                    <span class="badge ${car.available ? 'bg-success' : 'bg-danger'}">
                        ${car.available ? 'Yes' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary me-1 edit-car-btn" data-car-id="${car.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-car-btn" data-car-id="${car.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    // Add event listeners to buttons
    document.querySelectorAll('.edit-car-btn').forEach(button => {
        button.addEventListener('click', function() {
            const carId = this.getAttribute('data-car-id');
            openCarFormModal(carId);
        });
    });

    document.querySelectorAll('.delete-car-btn').forEach(button => {
        button.addEventListener('click', function() {
            const carId = this.getAttribute('data-car-id');
            deleteCar(carId);
        });
    });
}

// Open car form modal for add/edit
function openCarFormModal(carId = null) {
    const modal = new bootstrap.Modal(document.getElementById('carFormModal'));
    const form = document.getElementById('carForm');
    const titleElement = document.getElementById('carFormTitle');
    const submitButton = document.getElementById('carFormSubmit');
    const errorElement = document.getElementById('carFormError');

    // Reset the form
    form.reset();
    errorElement.textContent = '';

    if (carId) {
        // Edit mode
        titleElement.textContent = 'Edit Car';
        submitButton.textContent = 'Update Car';

        const car = cars.find(c => c.id === carId);
        if (!car) return;

        // Populate form fields
        document.getElementById('carFormId').value = car.id;
        document.getElementById('carFormBrand').value = car.brand;
        document.getElementById('carFormModel').value = car.model;
        document.getElementById('carFormYear').value = car.year;
        document.getElementById('carFormColor').value = car.color;
        document.getElementById('carFormPrice').value = car.pricePerDay;
        document.getElementById('carFormImage').value = car.imageUrl || '';
        document.getElementById('carFormFeatures').value = car.features ? car.features.join(', ') : '';
        document.getElementById('carFormAvailable').checked = car.available;

    } else {
        // Add mode
        titleElement.textContent = 'Add New Car';
        submitButton.textContent = 'Add Car';
        document.getElementById('carFormId').value = '';
    }

    modal.show();
}

// Save car form (add/edit)
async function saveCarForm() {
    const carId = document.getElementById('carFormId').value;
    const brand = document.getElementById('carFormBrand').value;
    const model = document.getElementById('carFormModel').value;
    const year = parseInt(document.getElementById('carFormYear').value);
    const color = document.getElementById('carFormColor').value;
    const pricePerDay = parseFloat(document.getElementById('carFormPrice').value);
    const imageUrl = document.getElementById('carFormImage').value;
    const featuresStr = document.getElementById('carFormFeatures').value;
    const available = document.getElementById('carFormAvailable').checked;

    // Parse features
    const features = featuresStr.split(',')
                               .map(feature => feature.trim())
                               .filter(feature => feature);

    // Create car object
    const car = {
        brand,
        model,
        year,
        color,
        pricePerDay,
        imageUrl,
        features,
        available
    };

    // If editing, add ID
    if (carId) {
        car.id = carId;
    }

    try {
        const url = carId ? `${API_URL}/cars/${carId}` : `${API_URL}/cars`;
        const method = carId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(car)
        });

        if (!response.ok) {
            throw new Error('Failed to save car');
        }

        // Close modal and reload cars
        const modal = bootstrap.Modal.getInstance(document.getElementById('carFormModal'));
        modal.hide();

        loadCars();
        loadDashboardData();

        alert(`Car ${carId ? 'updated' : 'added'} successfully!`);

    } catch (error) {
        console.error('Error saving car:', error);
        document.getElementById('carFormError').textContent = error.message;
    }
}

// Delete car
async function deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cars/${carId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete car');
        }

        // Reload cars and dashboard
        loadCars();
        loadDashboardData();

        alert('Car deleted successfully!');

    } catch (error) {
        console.error('Error deleting car:', error);
        alert('Failed to delete car. Please try again.');
    }
}

// Load all users
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        users = await response.json();
        displayUsers(users);

    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Failed to load users.</td>
            </tr>
        `;
    }
}

// Display users
function displayUsers(usersToDisplay) {
    const tableBody = document.getElementById('usersTable');

    if (usersToDisplay.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No users found.</td>
            </tr>
        `;
        return;
    }

    let html = '';

    usersToDisplay.forEach(user => {
        html += `
            <tr>
                <td>${user.id.substring(0, 8)}...</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>
                    <span class="badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">
                        ${user.role}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info view-user-btn" data-user-id="${user.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    // Add event listeners to buttons
    document.querySelectorAll('.view-user-btn').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            viewUser(userId);
        });
    });
}

// View user details
function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Get user bookings
    const userBookings = bookings.filter(b => b.userId === userId);

    // Populate user information
    document.getElementById('userDetailId').textContent = user.id;
    document.getElementById('userDetailName').textContent = user.name;
    document.getElementById('userDetailEmail').textContent = user.email;
    document.getElementById('userDetailPhone').textContent = user.phone || 'N/A';

    let roleBadge = '';
    if (user.role === 'ADMIN') {
        roleBadge = '<span class="badge bg-danger">ADMIN</span>';
    } else {
        roleBadge = '<span class="badge bg-primary">USER</span>';
    }
    document.getElementById('userDetailRole').innerHTML = roleBadge;

    // Set current role in select
    document.getElementById('userRoleSelect').value = user.role;

    // Populate user bookings
    const bookingsTableBody = document.getElementById('userDetailBookings');

    if (userBookings.length === 0) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">No bookings found</td>
            </tr>
        `;
    } else {
        let bookingsHTML = '';

        userBookings.forEach(booking => {
            const car = cars.find(c => c.id === booking.carId) || { brand: 'Unknown', model: 'Unknown' };
            const startDate = new Date(booking.startDate).toLocaleDateString();
            const endDate = new Date(booking.endDate).toLocaleDateString();

            let statusBadge = '';
            switch (booking.status) {
                case 'PENDING':
                    statusBadge = '<span class="badge bg-warning">PENDING</span>';
                    break;
                case 'APPROVED':
                    statusBadge = '<span class="badge bg-success">APPROVED</span>';
                    break;
                case 'CANCELLED':
                    statusBadge = '<span class="badge bg-danger">CANCELLED</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">UNKNOWN</span>';
            }

            bookingsHTML += `
                <tr>
                    <td>${car.brand} ${car.model}</td>
                    <td>${startDate} to ${endDate}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });

        bookingsTableBody.innerHTML = bookingsHTML;
    }

    // Set up update role button
    document.getElementById('updateUserRoleBtn').onclick = () => {
        updateUserRole(user.id);
    };

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
    modal.show();
}

// Update user role
async function updateUserRole(userId) {
    const newRole = document.getElementById('userRoleSelect').value;

    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
            throw new Error('Failed to update user role');
        }

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewUserModal'));
        modal.hide();

        // Reload users
        loadUsers();

        alert('User role updated successfully!');

    } catch (error) {
        console.error('Error updating user role:', error);
        alert('Failed to update user role. Please try again.');
    }
}

// Load users and cars for booking display
async function loadUsersAndCars() {
    try {
        // Load users if not already loaded
        if (users.length === 0) {
            const usersResponse = await fetch(`${API_URL}/users`);
            if (usersResponse.ok) {
                users = await usersResponse.json();
            }
        }

        // Load cars if not already loaded
        if (cars.length === 0) {
            const carsResponse = await fetch(`${API_URL}/cars`);
            if (carsResponse.ok) {
                cars = await carsResponse.json();
            }
        }
    } catch (error) {
        console.error('Error loading users and cars:', error);
    }
}

// Load monthly revenue chart
async function loadMonthlyRevenueChart() {
    try {
        const response = await fetch(`${API_URL}/admin/statistics/monthly-revenue`);
        if (!response.ok) {
            throw new Error('Failed to fetch monthly revenue data');
        }

        const data = await response.json();

        if (data.length === 0) {
            document.getElementById('monthlyRevenueChart').innerHTML = 'No revenue data available.';
            return;
        }

        // Format data for chart
        const chartLabels = data.map(item => item.month);
        const chartData = data.map(item => item.revenue);

        // Destroy existing chart if it exists
        if (monthlyRevenueChart) {
            monthlyRevenueChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('monthlyRevenueChart').getContext('2d');
        monthlyRevenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Monthly Revenue',
                    data: chartData,
                    backgroundColor: 'rgba(52, 152, 219, 0.6)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return ' + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Revenue:  + context.raw.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading monthly revenue chart:', error);
        document.getElementById('monthlyRevenueChart').innerHTML = 'Failed to load revenue chart.';
    }
}

// Load car usage statistics chart
async function loadCarUsageChart() {
    try {
        const response = await fetch(`${API_URL}/admin/statistics/car-usage`);
        if (!response.ok) {
            throw new Error('Failed to fetch car usage data');
        }

        const data = await response.json();

        if (data.length === 0) {
            document.getElementById('carUsageChart').innerHTML = 'No car usage data available.';
            return;
        }

        // Format data for chart
        const chartLabels = data.map(item => `${item.brand} ${item.model}`);
        const bookingsData = data.map(item => item.bookingsCount);
        const revenueData = data.map(item => item.revenue);

        // Destroy existing chart if it exists
        if (carUsageChart) {
            carUsageChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('carUsageChart').getContext('2d');
        carUsageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Number of Bookings',
                        data: bookingsData,
                        backgroundColor: 'rgba(46, 204, 113, 0.6)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Revenue',
                        data: revenueData,
                        backgroundColor: 'rgba(231, 76, 60, 0.6)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        type: 'linear',
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Bookings'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        type: 'linear',
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Revenue'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: function(value) {
                                return ' + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                if (label === 'Revenue') {
                                    return label + ':  + context.raw.toFixed(2);
                                }
                                return label + ': ' + context.raw;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading car usage chart:', error);
        document.getElementById('carUsageChart').innerHTML = 'Failed to load car usage chart.';
    }
}

// Logout admin
function logoutAdmin() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}