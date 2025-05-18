package com.example.demo.controllers;

import com.example.demo.dtos.CityDTO;
import com.example.demo.services.CityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/cities")
public class CityController {

    private final CityService cityService;

    public CityController(CityService cityService) {
        this.cityService = cityService;
    }

    @GetMapping
    public ResponseEntity<List<CityDTO>> getAllCities() {
        List<CityDTO> cities = cityService.findAll();
        return ResponseEntity.ok(cities);
    }
}
