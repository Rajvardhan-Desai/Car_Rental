package com.five_star.car_rental.controller;

import com.five_star.car_rental.model.Car;
import com.five_star.car_rental.service.BookingService;
import com.five_star.car_rental.service.CarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cars")
@CrossOrigin(origins = "*")
public class CarController {

    @Autowired
    private CarService carService;

    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<Car>> getAllCars() {
        List<Car> cars = carService.getAllCars();
        return new ResponseEntity<>(cars, HttpStatus.OK);
    }

    @GetMapping("/available")
    public ResponseEntity<List<Car>> getAvailableCars() {
        List<Car> cars = carService.getAvailableCars();
        return new ResponseEntity<>(cars, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Car> getCarById(@PathVariable String id) {
        Optional<Car> car = carService.getCarById(id);
        return car.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<Car> createCar(@RequestBody Car car) {
        Car savedCar = carService.saveCar(car);
        return new ResponseEntity<>(savedCar, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Car> updateCar(@PathVariable String id, @RequestBody Car car) {
        Optional<Car> existingCar = carService.getCarById(id);
        if (existingCar.isPresent()) {
            car.setId(id);
            Car updatedCar = carService.saveCar(car);
            return new ResponseEntity<>(updatedCar, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable String id) {
        Optional<Car> car = carService.getCarById(id);
        if (car.isPresent()) {
            carService.deleteCar(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Car>> searchCars(@RequestParam(required = false) String brand,
                                                @RequestParam(required = false) Double maxPrice) {
        List<Car> cars;
        if (brand != null && !brand.isEmpty()) {
            cars = carService.searchCarsByBrand(brand);
        } else if (maxPrice != null) {
            cars = carService.getCarsByMaxPrice(maxPrice);
        } else {
            cars = carService.getAllCars();
        }
        return new ResponseEntity<>(cars, HttpStatus.OK);
    }

    @GetMapping("/{id}/booked-dates")
    public ResponseEntity<List<LocalDate>> getBookedDatesForCar(@PathVariable String id) {
        List<LocalDate> bookedDates = bookingService.getBookedDatesForCar(id);
        return new ResponseEntity<>(bookedDates, HttpStatus.OK);
    }

    @GetMapping("/{id}/available")
    public ResponseEntity<Boolean> checkCarAvailability(
            @PathVariable String id,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        boolean isAvailable = bookingService.isCarAvailableForDates(id, startDate, endDate);
        return new ResponseEntity<>(isAvailable, HttpStatus.OK);
    }
}

