package com.five_star.car_rental.repository;

import com.five_star.car_rental.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserId(String userId);
    List<Booking> findByCarId(String carId);
    List<Booking> findByStatus(String status);

    // Find bookings that overlap with a date range
    List<Booking> findByCarIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndStatusNot(
            String carId, LocalDate endDate, LocalDate startDate, String status);
}
