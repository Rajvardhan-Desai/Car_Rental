package com.five_star.car_rental.model;

import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.ArrayList;

@Document(collection = "cars")
public class Car {

    private String id;
    private String brand;
    private String model;
    private int year;
    private String color;
    private String imageUrl;
    private double pricePerDay;
    private List<String> features;
    private boolean available;

    public Car() {
        this.features = new ArrayList<>();
    }

    public Car(String brand, String model, int year, String color, String imageUrl, double pricePerDay) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.color = color;
        this.imageUrl = imageUrl;
        this.pricePerDay = pricePerDay;
        this.features = new ArrayList<>();
        this.available = true;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public double getPricePerDay() {
        return pricePerDay;
    }

    public void setPricePerDay(double pricePerDay) {
        this.pricePerDay = pricePerDay;
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}
