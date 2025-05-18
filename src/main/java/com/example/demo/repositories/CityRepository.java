package com.example.demo.repositories;

import com.example.demo.entities.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CityRepository extends JpaRepository<City,Long> {
    Optional<City> findByName(String name);
    Optional<City> findById(long id);
    List<City> findAllByName(String name);

    List<City> findAll();
}
