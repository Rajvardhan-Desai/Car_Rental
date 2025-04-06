// Global Variables
const API_URL = 'http://localhost:8080/api';
let currentAdmin = null;
let cars = [];
let users = [];
let bookings = [];
let currentBookingTab = 'pending';
let monthlyRevenueChart = null;
let carUsageChart = null;
let currentActiveTab = 'dashboard';

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
    checkAdminAuth();
    setupEventListeners();
    setupInputValidation();
    switchTab('dashboard'); // Unified initial load
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
            window.location.href = '../index.html';
        }
    } else {
        window.location.href = '../index.html';
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Booking sub-tabs
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
        if (FormValidation.validateCarForm(this)) {
            saveCarForm();
        }
    });

    // Main tab navigation (updated selector)
    document.querySelectorAll('.admin-sidebar .nav-link').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.id.replace('Tab', '');
            switchTab(tabName);
        });
    });
}

// Setup input validation for admin forms
function setupInputValidation() {
    // Car form validation
    const carFormBrand = document.getElementById('carFormBrand');
    const carFormModel = document.getElementById('carFormModel');
    const carFormYear = document.getElementById('carFormYear');
    const carFormColor = document.getElementById('carFormColor');
    const carFormPrice = document.getElementById('carFormPrice');

    if (carFormBrand) {
        carFormBrand.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Brand is required');
            } else {
                FormValidation.removeError(this);
            }
        });
    }

    if (carFormModel) {
        carFormModel.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Model is required');
            } else {
                FormValidation.removeError(this);
            }
        });
    }

    if (carFormYear) {
        carFormYear.addEventListener('blur', function() {
            const currentYear = new Date().getFullYear();
            const yearValue = parseInt(this.value);

            if (!this.value) {
                FormValidation.showError(this, 'Year is required');
            } else if (isNaN(yearValue) || yearValue < 1900 || yearValue > currentYear + 1) {
                FormValidation.showError(this, `Year must be between 1900 and ${currentYear + 1}`);
            } else {
                FormValidation.removeError(this);
            }
        });
    }

    if (carFormColor) {
        carFormColor.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Color is required');
            } else {
                FormValidation.removeError(this);
            }
        });
    }

    if (carFormPrice) {
        carFormPrice.addEventListener('blur', function() {
            const priceValue = parseFloat(this.value);

            if (!this.value) {
                FormValidation.showError(this, 'Price is required');
            } else if (isNaN(priceValue) || priceValue <= 0) {
                FormValidation.showError(this, 'Price must be a positive number');
            } else {
                FormValidation.removeError(this);
            }
        });
    }

    // User role update validation
    const userRoleSelect = document.getElementById('userRoleSelect');
    if (userRoleSelect) {
        userRoleSelect.addEventListener('change', function() {
            if (!this.value || (this.value !== 'USER' && this.value !== 'ADMIN')) {
                FormValidation.showError(this, 'Please select a valid role');
            } else {
                FormValidation.removeError(this);
            }
        });
    }
}

// Switch to the selected tab and load data
function switchTab(tabName) {
    // Remove active class from previous tab
    document.getElementById(`${currentActiveTab}Tab`).classList.remove('active');

    // Add active class to new tab
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Show/hide corresponding content
    showTab(tabName);

    // Update current active tab
    currentActiveTab = tabName;

    // Load data for the tab
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'cars':
            loadCars();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

// Show the selected tab content
function showTab(tabName) {
    dashboardContent.classList.add('d-none');
    bookingsContent.classList.add('d-none');
    carsContent.classList.add('d-none');
    usersContent.classList.add('d-none');

    switch (tabName) {
        case 'dashboard':
            dashboardContent.classList.remove('d-none');
            break;
        case 'bookings':
            bookingsContent.classList.remove('d-none');
            break;
        case 'cars':
            carsContent.classList.remove('d-none');
            break;
        case 'users':
            usersContent.classList.remove('d-none');
            break;
    }
}

// Set the booking tab
function setBookingTab(tabName) {
    document.getElementById('pendingBookingsTab').classList.remove('active');
    document.getElementById('approvedBookingsTab').classList.remove('active');
    document.getElementById('cancelledBookingsTab').classList.remove('active');
    document.getElementById('allBookingsTab').classList.remove('active');

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
        console.log('Dashboard Data:', data);

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
        showErrorMessage('Failed to load dashboard data. Please try again.');
    }
}

// Show error message
function showErrorMessage(message) {
    // Create a toast notification
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';

    const toastHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-danger text-white">
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    toastContainer.innerHTML = toastHTML;
    document.body.appendChild(toastContainer);

    // Remove toast after 5 seconds
    setTimeout(() => {
        document.body.removeChild(toastContainer);
    }, 5000);
}

// Show success message
function showSuccessMessage(message) {
    // Create a toast notification
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';

    const toastHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-success text-white">
                <strong class="me-auto">Success</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    toastContainer.innerHTML = toastHTML;
    document.body.appendChild(toastContainer);

    // Remove toast after 5 seconds
    setTimeout(() => {
        document.body.removeChild(toastContainer);
    }, 5000);
}

// Load recent bookings for dashboard
async function loadRecentBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings`);
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }
        const allBookings = await response.json();
        const recentBookings = allBookings
            .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
            .slice(0, 5);
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
        await loadUsersAndCars();
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
        loadBookings();
        loadDashboardData();
        showSuccessMessage('Booking approved successfully!');
    } catch (error) {
        console.error('Error approving booking:', error);
        showErrorMessage('Failed to approve booking. Please try again.');
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
        loadBookings();
        loadDashboardData();
        showSuccessMessage('Booking cancelled successfully!');
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showErrorMessage('Failed to cancel booking. Please try again.');
    }
}

// View booking details
function viewBooking(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    document.getElementById('bookingDetailId').textContent = booking.id;
    document.getElementById('bookingDetailStartDate').textContent = new Date(booking.startDate).toLocaleDateString();
    document.getElementById('bookingDetailEndDate').textContent = new Date(booking.endDate).toLocaleDateString();
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
    document.getElementById('bookingDetailBookingDate').textContent = new Date(booking.bookingDate).toLocaleDateString();

    const user = users.find(u => u.id === booking.userId) || { name: 'Unknown', email: 'Unknown', phone: 'Unknown' };
    const car = cars.find(c => c.id === booking.carId) || { brand: 'Unknown', model: 'Unknown', year: 'Unknown', color: 'Unknown' };

    document.getElementById('bookingDetailUserName').textContent = user.name;
    document.getElementById('bookingDetailUserEmail').textContent = user.email;
    document.getElementById('bookingDetailUserPhone').textContent = user.phone || 'N/A';
    document.getElementById('bookingDetailCarBrand').textContent = car.brand;
    document.getElementById('bookingDetailCarModel').textContent = car.model;
    document.getElementById('bookingDetailCarYear').textContent = car.year;
    document.getElementById('bookingDetailCarColor').textContent = car.color;

    const actionsDiv = document.getElementById('bookingDetailActions');
    const approveBtn = document.getElementById('bookingDetailApproveBtn');
    const cancelBtn = document.getElementById('bookingDetailCancelBtn');

    if (booking.status === 'PENDING') {
        actionsDiv.style.display = 'block';
        approveBtn.onclick = () => approveBookingFromModal(booking.id);
        cancelBtn.onclick = () => cancelBookingFromModal(booking.id);
    } else {
        actionsDiv.style.display = 'none';
    }

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
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewBookingModal'));
        modal.hide();
        loadBookings();
        loadDashboardData();
        showSuccessMessage('Booking approved successfully!');
    } catch (error) {
        console.error('Error approving booking:', error);
        showErrorMessage('Failed to approve booking. Please try again.');
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewBookingModal'));
        modal.hide();
        loadBookings();
        loadDashboardData();
        showSuccessMessage('Booking cancelled successfully!');
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showErrorMessage('Failed to cancel booking. Please try again.');
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
                <td><img src="${car.imageUrl || 'https://via.placeholder.com/50x30?text=Car'}" alt="${car.brand} ${car.model}" width="50" height="30" style="object-fit: cover; border-radius: 4px;"></td>
                <td>${car.brand}</td>
                <td>${car.model}</td>
                <td>${car.year}</td>
                <td>$${car.pricePerDay.toFixed(2)}</td>
                <td><span class="badge ${car.available ? 'bg-success' : 'bg-danger'}">${car.available ? 'Yes' : 'No'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary me-1 edit-car-btn" data-car-id="${car.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-car-btn" data-car-id="${car.id}"><i class="fas fa-trash"></i></button>
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

    form.reset();
    errorElement.textContent = '';

    // Clear all validation errors
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    if (carId) {
        titleElement.textContent = 'Edit Car';
        submitButton.textContent = 'Update Car';
        const car = cars.find(c => c.id === carId);
        if (!car) return;
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

    const features = featuresStr.split(',').map(feature => feature.trim()).filter(feature => feature);

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
        const modal = bootstrap.Modal.getInstance(document.getElementById('carFormModal'));
        modal.hide();
        loadCars();
        loadDashboardData();
        showSuccessMessage(`Car ${carId ? 'updated' : 'added'} successfully!`);
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
        loadCars();
        loadDashboardData();
        showSuccessMessage('Car deleted successfully!');
    } catch (error) {
        console.error('Error deleting car:', error);
        showErrorMessage('Failed to delete car. Please try again.');
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
                <td><span class="badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">${user.role}</span></td>
                <td>
                    <button class="btn btn-sm btn-info view-user-btn" data-user-id="${user.id}"><i class="fas fa-eye"></i></button>
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
    document.getElementById('userDetailId').textContent = user.id;
    document.getElementById('userDetailName').textContent = user.name;
    document.getElementById('userDetailEmail').textContent = user.email;
    document.getElementById('userDetailPhone').textContent = user.phone || 'N/A';
    document.getElementById('userDetailRole').innerHTML = `<span class="badge ${user.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'}">${user.role}</span>`;
    document.getElementById('userRoleSelect').value = user.role;

    const userBookings = bookings.filter(b => b.userId === userId);
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

    document.getElementById('updateUserRoleBtn').onclick = () => updateUserRole(user.id);
    const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
    modal.show();
}

// Update user role
async function updateUserRole(userId) {
    const newRole = document.getElementById('userRoleSelect').value;
    if (!newRole || (newRole !== 'USER' && newRole !== 'ADMIN')) {
        FormValidation.showError(document.getElementById('userRoleSelect'), 'Please select a valid role');
        return;
    }

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
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewUserModal'));
        modal.hide();
        loadUsers();
        showSuccessMessage('User role updated successfully!');
    } catch (error) {
        console.error('Error updating user role:', error);
        showErrorMessage('Failed to update user role. Please try again.');
    }
}

// Load users and cars for booking display
async function loadUsersAndCars() {
    try {
        if (users.length === 0) {
            const usersResponse = await fetch(`${API_URL}/users`);
            if (usersResponse.ok) {
                users = await usersResponse.json();
            }
        }
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
        if (!response.ok) throw new Error('Failed to fetch monthly revenue data');
        const data = await response.json();
        console.log('Monthly Revenue Data:', data);
        if (data.length === 0) {
            document.getElementById('monthlyRevenueChart').innerHTML = 'No revenue data available.';
            return;
        }
        const chartLabels = data.map(item => item.month);
        const chartData = data.map(item => item.revenue);
        if (monthlyRevenueChart) {
            monthlyRevenueChart.destroy();
        }
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
                                return ' ' + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Revenue: ' + context.raw.toFixed(2);
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
        if (!response.ok) throw new Error('Failed to fetch car usage data');
        const data = await response.json();
        console.log('Car Usage Data:', data);
        if (data.length === 0) {
            document.getElementById('carUsageChart').innerHTML = 'No car usage data available.';
            return;
        }
        const chartLabels = data.map(item => `${item.brand} ${item.model}`);
        const bookingsData = data.map(item => item.bookingsCount);
        const revenueData = data.map(item => item.revenue);
        if (carUsageChart) {
            carUsageChart.destroy();
        }
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
                                return ' ' + value;
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
                                    return label + ': '+ context.raw.toFixed(2);
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