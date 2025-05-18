package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    public City() {
    }

    public City(String name) {
        this.name = name;
    }
}