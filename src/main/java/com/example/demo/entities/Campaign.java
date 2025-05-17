package com.example.demo.entities;


import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,unique = true)
    private String name;

    @Column(nullable=false)
    private String keyword;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private double fund;

    @Column(nullable = false)
    private boolean status;

    @ManyToOne
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(nullable = false)
    private double radius;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

}
