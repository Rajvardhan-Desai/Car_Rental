// Global Variables
const API_URL = 'http://localhost:8080/api';
let currentUser = null;
let cars = [];

// DOM Elements
const carsList = document.getElementById('carsList');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const navButtons = document.getElementById('navButtons');
const userMenu = document.getElementById('userMenu');
const username = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const myBookingsBtn = document.getElementById('myBookingsBtn');
const carSearchForm = document.getElementById('carSearchForm');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const contactForm = document.getElementById('contactForm');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuth();

    // Load all cars
    loadCars();

    // Event listeners
    setupEventListeners();

    // Setup realtime validation
    setupInputValidation();
});

// Check if user is logged in
function checkAuth() {
    const user = localStorage.getItem('user');
    if (user) {
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    }
}

// Update UI based on authentication state
function updateUIForLoggedInUser() {
    if (currentUser) {
        navButtons.classList.add('d-none');
        userMenu.classList.remove('d-none');
        username.textContent = currentUser.name;
    } else {
        navButtons.classList.remove('d-none');
        userMenu.classList.add('d-none');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (FormValidation.validateLoginForm(this)) {
                loginUser();
            }
        });
    }

    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (FormValidation.validateRegisterForm(this)) {
                registerUser();
            }
        });
    }

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }

    // My Bookings button
    if (myBookingsBtn) {
        myBookingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadUserBookings();
        });
    }

    // Car search form
    if (carSearchForm) {
        carSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchCars();
        });
    }

    // Price range slider
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            priceValue.textContent = '$' + this.value;
        });
    }

    // Contact form
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (FormValidation.validateContactForm(this)) {
                handleContactForm();
            }
        });
    }
}

// Setup realtime validation for input fields
function setupInputValidation() {
    // Login form input validation
    if (loginForm) {
        const loginEmail = document.getElementById('loginEmail');
        loginEmail.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Email is required');
            } else if (!FormValidation.isValidEmail(this.value)) {
                FormValidation.showError(this, 'Please enter a valid email address');
            } else {
                FormValidation.removeError(this);
            }
        });

        const loginPassword = document.getElementById('loginPassword');
        loginPassword.addEventListener('blur', function() {
            if (!this.value) {
                FormValidation.showError(this, 'Password is required');
            } else if (!FormValidation.hasMinLength(this.value, 6)) {
                FormValidation.showError(this, 'Password must be at least 6 characters');
            } else {
                FormValidation.removeError(this);
            }
        });
    }

    // Registration form input validation
    if (registerForm) {
        const registerName = document.getElementById('registerName');
        registerName.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Name is required');
            } else {
                FormValidation.removeError(this);
            }
        });

        const registerEmail = document.getElementById('registerEmail');
        registerEmail.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Email is required');
            } else if (!FormValidation.isValidEmail(this.value)) {
                FormValidation.showError(this, 'Please enter a valid email address');
            } else {
                FormValidation.removeError(this);
            }
        });

        const registerPhone = document.getElementById('registerPhone');
        registerPhone.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Phone number is required');
            } else if (!FormValidation.isValidPhone(this.value)) {
                FormValidation.showError(this, 'Please enter a valid phone number');
            } else {
                FormValidation.removeError(this);
            }
        });

        const registerPassword = document.getElementById('registerPassword');
        registerPassword.addEventListener('blur', function() {
            if (!this.value) {
                FormValidation.showError(this, 'Password is required');
            } else if (!FormValidation.hasMinLength(this.value, 6)) {
                FormValidation.showError(this, 'Password must be at least 6 characters');
            } else {
                FormValidation.removeError(this);
            }
        });
    }

    // Contact form input validation
    if (contactForm) {
        const nameInput = document.getElementById('nameInput');
        nameInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Name is required');
            } else {
                FormValidation.removeError(this);
            }
        });

        const emailInput = document.getElementById('emailInput');
        emailInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Email is required');
            } else if (!FormValidation.isValidEmail(this.value)) {
                FormValidation.showError(this, 'Please enter a valid email address');
            } else {
                FormValidation.removeError(this);
            }
        });

        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                FormValidation.showError(this, 'Message is required');
            } else if (!FormValidation.hasMinLength(this.value, 10)) {
                FormValidation.showError(this, 'Message must be at least 10 characters');
            } else {
                FormValidation.removeError(this);
            }
        });
    }
}

// Load all cars from the API
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
        carsList.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    Failed to load cars. Please try again later.
                </div>
            </div>
        `;
    }
}

// Display cars in the UI
function displayCars(carsToDisplay) {
    if (!carsList) return;

    if (carsToDisplay.length === 0) {
        carsList.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    No cars found matching your criteria.
                </div>
            </div>
        `;
        return;
    }

    let carsHTML = '';
    carsToDisplay.forEach(car => {
        carsHTML += `
            <div class="col-md-4 mb-4">
                <div class="card car-card h-100">
                    <div class="car-img" style="background-image: url('${car.imageUrl || 'https://via.placeholder.com/300x200?text=Car+Image'}')"></div>
                    <div class="card-body">
                        <h5 class="card-title">${car.brand} ${car.model}</h5>
                        <p class="card-text text-muted">${car.year} · ${car.color}</p>
                        <p class="car-price">$${car.pricePerDay}/day</p>
                        <button class="btn btn-primary view-car-btn" data-car-id="${car.id}">View Details</button>
                    </div>
                </div>
            </div>
        `;
    });

    carsList.innerHTML = carsHTML;

    // Add event listeners to view car buttons
    document.querySelectorAll('.view-car-btn').forEach(button => {
        button.addEventListener('click', function() {
            const carId = this.getAttribute('data-car-id');
            openCarModal(carId);
        });
    });
}

// Open car details modal
function openCarModal(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;

    // Set car details in the modal
    document.getElementById('carModalTitle').textContent = `${car.brand} ${car.model}`;
    document.getElementById('carModalImg').style.backgroundImage = `url('${car.imageUrl || 'https://via.placeholder.com/600x400?text=Car+Image'}')`;
    document.getElementById('carBrandModel').textContent = `${car.brand} ${car.model}`;
    document.getElementById('carYear').textContent = car.year;
    document.getElementById('carColor').textContent = car.color;
    document.getElementById('carPrice').textContent = car.pricePerDay;
    document.getElementById('carId').value = car.id;

    // Clear and populate features
    const featuresElement = document.getElementById('carFeatures');
    featuresElement.innerHTML = '';

    if (car.features && car.features.length > 0) {
        car.features.forEach(feature => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `<i class="fas fa-check text-success me-2"></i> ${feature}`;
            featuresElement.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = 'No features listed';
        featuresElement.appendChild(li);
    }

    // Initialize date picker with booked dates
    initDatePicker(car.id, car.pricePerDay);

    // Show the modal
    const carModal = new bootstrap.Modal(document.getElementById('carModal'));
    carModal.show();
}

// Search cars based on form inputs
function searchCars() {
    const brand = document.getElementById('brandInput').value.trim();
    const maxPrice = priceRange.value;

    let filteredCars = cars;

    if (brand) {
        filteredCars = filteredCars.filter(car =>
            car.brand.toLowerCase().includes(brand.toLowerCase())
        );
    }

    if (maxPrice) {
        filteredCars = filteredCars.filter(car => car.pricePerDay <= maxPrice);
    }

    displayCars(filteredCars);
}

// Login user
async function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        const user = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        currentUser = user;

        // Close modal and update UI
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();

        updateUIForLoggedInUser();

        showSuccessMessage('Login successful! Welcome back.');
    } catch (error) {
        loginError.textContent = error.message;
    }
}

// Register user
async function registerUser() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const role = "USER";

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password,role })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Registration failed');
        }

        const user = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        currentUser = user;

        // Close modal and update UI
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        registerModal.hide();

        updateUIForLoggedInUser();

        showSuccessMessage('Registration successful! Welcome to Car Booking System.');
    } catch (error) {
        registerError.textContent = error.message;
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('user');
    currentUser = null;
    updateUIForLoggedInUser();
    window.location.href = 'index.html';
}

// Show success message
function showSuccessMessage(message) {
    document.getElementById('successMessage').textContent = message;
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();
}

// Handle contact form submission
function handleContactForm() {
    const name = document.getElementById('nameInput').value;
    const email = document.getElementById('emailInput').value;
    const message = document.getElementById('messageInput').value;

    // In a real application, you would send this data to the server
    console.log('Contact form submitted:', { name, email, message });

    // Clear the form
    document.getElementById('nameInput').value = '';
    document.getElementById('emailInput').value = '';
    document.getElementById('messageInput').value = '';

    // Show success message
    showSuccessMessage('Thank you for your message! We will get back to you soon.');
}