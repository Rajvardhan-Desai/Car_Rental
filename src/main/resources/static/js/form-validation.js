// Form validation utils
const FormValidation = {
    // Show error message
    showError(input, message) {
        const formGroup = input.parentElement;
        formGroup.classList.add('has-error');

        // Check if error message element already exists
        let errorElement = formGroup.querySelector('.error-message');

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message text-danger small mt-1';
            formGroup.appendChild(errorElement);
        }

        errorElement.textContent = message;
        input.classList.add('is-invalid');
    },

    // Remove error message
    removeError(input) {
        const formGroup = input.parentElement;
        const errorElement = formGroup.querySelector('.error-message');

        if (errorElement) {
            formGroup.removeChild(errorElement);
        }

        input.classList.remove('is-invalid');
        formGroup.classList.remove('has-error');
    },

    // Validate email format
    isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },

    // Validate phone number
    isValidPhone(phone) {
        const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return re.test(String(phone));
    },

    // Check if a string has minimum length
    hasMinLength(str, minLength) {
        return str.length >= minLength;
    },

    // Check if a date is valid and in the future
    isValidFutureDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return !isNaN(date.getTime()) && date >= today;
    },

    // Check if end date is after start date
    isEndDateAfterStartDate(startDateStr, endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate;
    },

    // Validate car form
    validateCarForm(form) {
        let isValid = true;

        // Brand validation
        const brand = form.querySelector('#carFormBrand');
        if (!brand.value.trim()) {
            this.showError(brand, 'Brand is required');
            isValid = false;
        } else {
            this.removeError(brand);
        }

        // Model validation
        const model = form.querySelector('#carFormModel');
        if (!model.value.trim()) {
            this.showError(model, 'Model is required');
            isValid = false;
        } else {
            this.removeError(model);
        }

        // Year validation
        const year = form.querySelector('#carFormYear');
        const currentYear = new Date().getFullYear();
        const yearValue = parseInt(year.value);

        if (!year.value) {
            this.showError(year, 'Year is required');
            isValid = false;
        } else if (isNaN(yearValue) || yearValue < 1900 || yearValue > currentYear + 1) {
            this.showError(year, `Year must be between 1900 and ${currentYear + 1}`);
            isValid = false;
        } else {
            this.removeError(year);
        }

        // Color validation
        const color = form.querySelector('#carFormColor');
        if (!color.value.trim()) {
            this.showError(color, 'Color is required');
            isValid = false;
        } else {
            this.removeError(color);
        }

        // Price validation
        const price = form.querySelector('#carFormPrice');
        const priceValue = parseFloat(price.value);

        if (!price.value) {
            this.showError(price, 'Price is required');
            isValid = false;
        } else if (isNaN(priceValue) || priceValue <= 0) {
            this.showError(price, 'Price must be a positive number');
            isValid = false;
        } else {
            this.removeError(price);
        }

        return isValid;
    },

    // Validate login form
    validateLoginForm(form) {
        let isValid = true;

        // Email validation
        const email = form.querySelector('#loginEmail');
        if (!email.value.trim()) {
            this.showError(email, 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email.value)) {
            this.showError(email, 'Please enter a valid email address');
            isValid = false;
        } else {
            this.removeError(email);
        }

        // Password validation
        const password = form.querySelector('#loginPassword');
        if (!password.value) {
            this.showError(password, 'Password is required');
            isValid = false;
        } else if (!this.hasMinLength(password.value, 6)) {
            this.showError(password, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            this.removeError(password);
        }

        return isValid;
    },

    // Validate registration form
    validateRegisterForm(form) {
        let isValid = true;

        // Name validation
        const name = form.querySelector('#registerName');
        if (!name.value.trim()) {
            this.showError(name, 'Name is required');
            isValid = false;
        } else {
            this.removeError(name);
        }

        // Email validation
        const email = form.querySelector('#registerEmail');
        if (!email.value.trim()) {
            this.showError(email, 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email.value)) {
            this.showError(email, 'Please enter a valid email address');
            isValid = false;
        } else {
            this.removeError(email);
        }

        // Phone validation
        const phone = form.querySelector('#registerPhone');
        if (!phone.value.trim()) {
            this.showError(phone, 'Phone number is required');
            isValid = false;
        } else if (!this.isValidPhone(phone.value)) {
            this.showError(phone, 'Please enter a valid phone number');
            isValid = false;
        } else {
            this.removeError(phone);
        }

        // Password validation
        const password = form.querySelector('#registerPassword');
        if (!password.value) {
            this.showError(password, 'Password is required');
            isValid = false;
        } else if (!this.hasMinLength(password.value, 6)) {
            this.showError(password, 'Password must be at least 6 characters');
            isValid = false;
        } else {
            this.removeError(password);
        }

        return isValid;
    },

    // Validate booking form
    validateBookingForm(form) {
        let isValid = true;

        // Date range validation
        const dateRange = form.querySelector('#dateRange');
        if (!dateRange.value) {
            this.showError(dateRange, 'Please select dates for your booking');
            isValid = false;
        } else {
            this.removeError(dateRange);

            // Further validate the date range
            const dates = dateRange.value.split(' to ');
            if (dates.length === 2) {
                const startDate = dates[0];
                const endDate = dates[1];

                if (!this.isValidFutureDate(startDate)) {
                    this.showError(dateRange, 'Start date must be today or later');
                    isValid = false;
                } else if (!this.isEndDateAfterStartDate(startDate, endDate)) {
                    this.showError(dateRange, 'End date must be after start date');
                    isValid = false;
                }
            }
        }

        return isValid;
    },

    // Validate contact form
    validateContactForm(form) {
        let isValid = true;

        // Name validation
        const name = form.querySelector('#nameInput');
        if (!name.value.trim()) {
            this.showError(name, 'Name is required');
            isValid = false;
        } else {
            this.removeError(name);
        }

        // Email validation
        const email = form.querySelector('#emailInput');
        if (!email.value.trim()) {
            this.showError(email, 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email.value)) {
            this.showError(email, 'Please enter a valid email address');
            isValid = false;
        } else {
            this.removeError(email);
        }

        // Message validation
        const message = form.querySelector('#messageInput');
        if (!message.value.trim()) {
            this.showError(message, 'Message is required');
            isValid = false;
        } else if (!this.hasMinLength(message.value, 10)) {
            this.showError(message, 'Message must be at least 10 characters');
            isValid = false;
        } else {
            this.removeError(message);
        }

        return isValid;
    }
}