// Calendar and Date Picker Functionality

let flatpickrInstance = null;
let carPricePerDay = 0;

// Initialize date picker with booked dates
async function initDatePicker(carId, pricePerDay) {
    carPricePerDay = pricePerDay;

    try {
        // Get booked dates for the car
        const response = await fetch(`${API_URL}/cars/${carId}/booked-dates`);
        if (!response.ok) {
            throw new Error('Failed to fetch booked dates');
        }

        const bookedDates = await response.json();

        // Destroy existing instance if it exists
        if (flatpickrInstance) {
            flatpickrInstance.destroy();
        }

        // Convert booked dates to string format
        const disabledDates = bookedDates.map(date => {
            return typeof date === 'string' ? date : new Date(date);
        });

        // Get current date
        const today = new Date();

        // Initialize flatpickr
        flatpickrInstance = flatpickr('#dateRange', {
            mode: 'range',
            minDate: 'today',
            dateFormat: 'Y-m-d',
            disable: disabledDates,
            onClose: calculateTotalPrice,
            onChange: calculateTotalPrice
        });

        // Reset the date selection
        flatpickrInstance.clear();
        document.getElementById('totalPrice').textContent = '0';

    } catch (error) {
        console.error('Error initializing date picker:', error);
        alert('Could not load availability. Please try again.');
    }
}

// Calculate the total price based on selected dates
function calculateTotalPrice(selectedDates) {
    const totalPriceElement = document.getElementById('totalPrice');

    if (selectedDates.length === 2) {
        const startDate = new Date(selectedDates[0]);
        const endDate = new Date(selectedDates[1]);

        // Calculate difference in days
        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days

        const totalPrice = dayDiff * carPricePerDay;
        totalPriceElement.textContent = totalPrice.toFixed(2);
    } else {
        totalPriceElement.textContent = '0';
    }
}

// Check if dates are available
async function checkDatesAvailability(carId, startDate, endDate) {
    try {
        const response = await fetch(`${API_URL}/cars/${carId}/available?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) {
            throw new Error('Failed to check availability');
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking availability:', error);
        return false;
    }
}

// Format date to YYYY-MM-DD string
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Parse date range from string
function parseDateRange(dateRangeStr) {
    const dates = dateRangeStr.split(' to ');
    if (dates.length === 2) {
        return {
            startDate: dates[0],
            endDate: dates[1]
        };
    } else if (dates.length === 1 && dates[0].trim() !== '') {
        return {
            startDate: dates[0],
            endDate: dates[0]
        };
    }
    return null;
}