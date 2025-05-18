package com.example.demo.services;


import com.example.demo.dtos.CityDTO;
import com.example.demo.repositories.CityRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CityService {

    private final CityRepository cityRepository;

    public CityService(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    public CityDTO findByName(String name) {
       return cityRepository.findByName(name)
                .map(CityDTO::fromEntity).orElseThrow(()-> new RuntimeException("City not found with name: " + name));
    }
    public CityDTO findById(long id) {
       return cityRepository.findById(id)
                .map(CityDTO::fromEntity).orElseThrow(()-> new RuntimeException("City not found with id: " + id));
    }

    public List<CityDTO> findAll(){
        return cityRepository.findAll().stream()
                .map(CityDTO::fromEntity)
                .collect(Collectors.toList());
    }


}
