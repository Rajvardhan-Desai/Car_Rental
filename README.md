# Five Star Car Rental Service 

A web-based car rental management system built with Spring Boot and MongoDB.

## Features

- User authentication and authorization
- Car inventory management
- Booking and reservation system
- Admin dashboard for managing bookings, cars, and users
- RESTful API for client applications

## Technology Stack
- **Frontend**: HTML,CSS,JavaScript
- **Backend**: Spring Boot 3.4.4
- **Database**: MongoDB Atlas
- **Security**: Spring Security
- **Build Tool**: Maven

## Prerequisites

- Java 17+
- Maven 3.6+
- MongoDB Atlas account (or local MongoDB installation)

## Setup and Installation

# Method 1 : Command Line
1. Clone the repository
   ```bash
   git clone https://github.com/Rajvardhan-Desai/Car_Rental.git
   cd Car_Rental
   ```
2. Configure database connection
   - Create a .env file in the project root with:
   ```bash
   DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/CarRental
   DB_NAME=CarRental
   ```
   - Ensure your application.properties includes:
     ```properties
      spring.config.import=optional:file:.env[.properties]
     ```
3. Build the project
   ```bash
       mvn clean install
    ```
4. Run the application
   ```bash
     mvn spring-boot:run
   ```
   
5. Access the applicationAccess the application
  - Open your browser and navigate to `http://localhost:8080`

# Method 2: Using IntelliJ IDEA

Clone the repository
```bash
git clone https://github.com/Rajvardhan-Desai/Car_Rental.git
```

Open the project in IntelliJ IDEA
1. Select "File" > "Open"
2. Navigate to the cloned repository folder
3. Select the pom.xml file and click "Open as Project"

Configure database connection
1. Create a .env file in the project root with:
```
DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/CarRental
DB_NAME=CarRental
```
2. Ensure your application.properties includes:
```
spring.config.import=optional:file:.env[.properties]
```

Build the project
1. Navigate to the Maven tab (usually on the right side)
2. Run "clean" and then "install"
3. Alternatively, use the Maven toolbar buttons

Run the application
1. Locate the main class FiveStarCarRentalWebApplication
2. Right-click on it and select "Run"
3. Or use the green "play" button in the toolbar after selecting the main class

Access the application
Open your browser and navigate to http://localhost:8080


# API Endpoints

## Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user

## Cars
- `GET /api/cars` - Get all available cars
- `GET /api/cars/{id}` - Get car details
- `POST /api/cars` - Add new car (Admin)
- `PUT /api/cars/{id}` - Update car details (Admin)
- `DELETE /api/cars/{id}` - Remove car (Admin)

## Bookings
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking
