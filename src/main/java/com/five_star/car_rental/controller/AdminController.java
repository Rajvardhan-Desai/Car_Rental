package com.five_star.car_rental.controller;

import com.five_star.car_rental.model.Booking;
import com.five_star.car_rental.model.Car;
import com.five_star.car_rental.model.User;
import com.five_star.car_rental.service.BookingService;
import com.five_star.car_rental.service.CarService;
import com.five_star.car_rental.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private CarService carService;

    @Autowired
    private UserService userService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> dashboardData = new HashMap<>();

        // Get counts
        dashboardData.put("totalCars", carService.getAllCars().size());
        dashboardData.put("totalUsers", userService.getAllUsers().size());
        dashboardData.put("totalBookings", bookingService.getAllBookings().size());
        dashboardData.put("pendingBookings", bookingService.getPendingBookings().size());

        // Add revenue data
        List<Booking> approvedBookings = bookingService.getAllBookings()
                .stream()
                .filter(b -> "APPROVED".equals(b.getStatus()))
                .collect(Collectors.toList());

        double totalRevenue = approvedBookings.stream()
                .mapToDouble(Booking::getTotalPrice)
                .sum();

        double monthlyRevenue = approvedBookings.stream()
                .filter(b -> b.getBookingDate().getMonth() == LocalDate.now().getMonth()
                        && b.getBookingDate().getYear() == LocalDate.now().getYear())
                .mapToDouble(Booking::getTotalPrice)
                .sum();

        dashboardData.put("totalRevenue", totalRevenue);
        dashboardData.put("monthlyRevenue", monthlyRevenue);

        // Get recent activities
        List<Booking> recentBookings = bookingService.getAllBookings()
                .stream()
                .sorted((b1, b2) -> b2.getBookingDate().compareTo(b1.getBookingDate()))
                .limit(5)
                .collect(Collectors.toList());

        dashboardData.put("recentBookings", recentBookings);

        return new ResponseEntity<>(dashboardData, HttpStatus.OK);
    }

    @GetMapping("/bookings/pending")
    public ResponseEntity<List<Booking>> getPendingBookings() {
        List<Booking> pendingBookings = bookingService.getPendingBookings();
        return new ResponseEntity<>(pendingBookings, HttpStatus.OK);
    }

    @PutMapping("/bookings/{id}/approve")
    public ResponseEntity<Booking> approveBooking(@PathVariable String id) {
        Booking approvedBooking = bookingService.approveBooking(id);
        if (approvedBooking != null) {
            return new ResponseEntity<>(approvedBooking, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> roleMap) {
        String role = roleMap.get("role");
        if (role == null || (!role.equals("USER") && !role.equals("ADMIN"))) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(role);
            User updatedUser = userService.saveUser(user);
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/cars")
    public ResponseEntity<List<Car>> getAllCars() {
        List<Car> cars = carService.getAllCars();
        return new ResponseEntity<>(cars, HttpStatus.OK);
    }

    @GetMapping("/cars/{id}")
    public ResponseEntity<Car> getCarById(@PathVariable String id) {
        Optional<Car> car = carService.getCarById(id);
        return car.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/cars")
    public ResponseEntity<Car> createCar(@RequestBody Car car) {
        Car savedCar = carService.saveCar(car);
        return new ResponseEntity<>(savedCar, HttpStatus.CREATED);
    }

    @PutMapping("/cars/{id}")
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

    @DeleteMapping("/cars/{id}")
    public ResponseEntity<Void> deleteCar(@PathVariable String id) {
        Optional<Car> car = carService.getCarById(id);
        if (car.isPresent()) {
            carService.deleteCar(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/statistics/monthly-revenue")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyRevenue() {
        List<Booking> approvedBookings = bookingService.getAllBookings()
                .stream()
                .filter(b -> "APPROVED".equals(b.getStatus()))
                .collect(Collectors.toList());

        // Group bookings by month and calculate revenue
        Map<String, Double> monthlyRevenue = new HashMap<>();

        for (Booking booking : approvedBookings) {
            String monthYear = booking.getStartDate().getYear() + "-" +
                    String.format("%02d", booking.getStartDate().getMonthValue());

            monthlyRevenue.put(
                    monthYear,
                    monthlyRevenue.getOrDefault(monthYear, 0.0) + booking.getTotalPrice()
            );
        }

        // Convert to list of maps for JSON response
        List<Map<String, Object>> result = monthlyRevenue.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("month", entry.getKey());
                    item.put("revenue", entry.getValue());
                    return item;
                })
                .sorted((a, b) -> ((String)a.get("month")).compareTo((String)b.get("month")))
                .collect(Collectors.toList());

        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/statistics/car-usage")
    public ResponseEntity<List<Map<String, Object>>> getCarUsageStatistics() {
        List<Car> allCars = carService.getAllCars();
        List<Booking> approvedBookings = bookingService.getAllBookings()
                .stream()
                .filter(b -> "APPROVED".equals(b.getStatus()))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = allCars.stream()
                .map(car -> {
                    Map<String, Object> carStats = new HashMap<>();
                    carStats.put("carId", car.getId());
                    carStats.put("brand", car.getBrand());
                    carStats.put("model", car.getModel());

                    // Count bookings for this car
                    long bookingsCount = approvedBookings.stream()
                            .filter(b -> b.getCarId().equals(car.getId()))
                            .count();

                    // Calculate revenue for this car
                    double carRevenue = approvedBookings.stream()
                            .filter(b -> b.getCarId().equals(car.getId()))
                            .mapToDouble(Booking::getTotalPrice)
                            .sum();

                    carStats.put("bookingsCount", bookingsCount);
                    carStats.put("revenue", carRevenue);

                    return carStats;
                })
                .collect(Collectors.toList());

        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}