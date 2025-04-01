package com.five_star.car_rental.service;

import com.five_star.car_rental.model.Booking;
import com.five_star.car_rental.model.Car;
import com.five_star.car_rental.repository.BookingRepository;
import com.five_star.car_rental.repository.CarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CarRepository carRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<Booking> getBookingById(String id) {
        return bookingRepository.findById(id);
    }

    public List<Booking> getBookingsByUserId(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getBookingsByCarId(String carId) {
        return bookingRepository.findByCarId(carId);
    }

    public List<Booking> getPendingBookings() {
        return bookingRepository.findByStatus("PENDING");
    }

    public Booking saveBooking(Booking booking) {
        // Calculate total price
        if (booking.getTotalPrice() == 0) {
            Optional<Car> carOpt = carRepository.findById(booking.getCarId());
            if (carOpt.isPresent()) {
                Car car = carOpt.get();
                long days = ChronoUnit.DAYS.between(booking.getStartDate(), booking.getEndDate()) + 1;
                booking.setTotalPrice(car.getPricePerDay() * days);
            }
        }
        return bookingRepository.save(booking);
    }

    public Booking approveBooking(String id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            booking.setStatus("APPROVED");
            return bookingRepository.save(booking);
        }
        return null;
    }

    public Booking cancelBooking(String id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            booking.setStatus("CANCELLED");
            return bookingRepository.save(booking);
        }
        return null;
    }

    public boolean isCarAvailableForDates(String carId, LocalDate startDate, LocalDate endDate) {
        List<Booking> overlappingBookings = bookingRepository
                .findByCarIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndStatusNot(
                        carId, endDate, startDate, "CANCELLED");

        return overlappingBookings.isEmpty();
    }

    public List<LocalDate> getBookedDatesForCar(String carId) {
        List<Booking> bookings = bookingRepository.findByCarId(carId);
        List<LocalDate> bookedDates = new java.util.ArrayList<>();

        bookings.stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .forEach(booking -> {
                    LocalDate date = booking.getStartDate();
                    while (!date.isAfter(booking.getEndDate())) {
                        bookedDates.add(date);
                        date = date.plusDays(1);
                    }
                });

        return bookedDates;
    }
}