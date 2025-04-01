package com.five_star.car_rental.repository;

import com.five_star.car_rental.model.Car;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarRepository extends MongoRepository<Car, String> {
    List<Car> findByAvailable(boolean available);

    List<Car> findByBrandContainingIgnoreCase(String brand);

    List<Car> findByPricePerDayLessThanEqual(double maxPrice);
}