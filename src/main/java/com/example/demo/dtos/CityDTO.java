package com.example.demo.dtos;

import com.example.demo.entities.City;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CityDTO(
        @NotNull Long id,
        @NotBlank String name,
        double latitude,
        double longitude
) {
    public static CityDTO fromEntity(City city) {
        return new CityDTO(city.getId(), city.getName(), city.getLatitude(), city.getLongitude());
    }
}
