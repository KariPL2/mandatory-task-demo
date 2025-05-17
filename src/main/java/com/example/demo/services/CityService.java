package com.example.demo.services;


import com.example.demo.repositories.CityRepository;
import org.springframework.stereotype.Service;

@Service
public class CityService {

    private final CityRepository cityRepository;

    public CityService(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    public boolean findByName(String name) {
        return cityRepository.findByName(name).orElseThrow(() -> new RuntimeException("City not found with name: " + name)) != null;
    }
    public boolean findById(long id) {
        return cityRepository.findById(id).orElseThrow( () -> new RuntimeException("City not found with id: " + id)) != null;
    }


}
