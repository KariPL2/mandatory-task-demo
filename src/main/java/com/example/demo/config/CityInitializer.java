package com.example.demo.config;

import com.example.demo.entities.City;
import com.example.demo.repositories.CityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class CityInitializer implements CommandLineRunner {

    private final CityRepository cityRepository;

    public CityInitializer(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (cityRepository.count() == 0) {
            List<City> cities = List.of(
                    new City("Warszawa"),
                    new City("Kraków"),
                    new City("Wrocław"),
                    new City("Poznań"),
                    new City("Gdańsk"),
                    new City("Szczecin"),
                    new City("Bydgoszcz"),
                    new City("Lublin"),
                    new City("Katowice"),
                    new City("Białystok"),
                    new City("Gdynia"),
                    new City("Częstochowa"),
                    new City("Radom"),
                    new City("Toruń"),
                    new City("Rzeszów"),
                    new City("Gliwice"),
                    new City("Zabrze"),
                    new City("Olsztyn"),
                    new City("Opole"),
                    new City("Kielce")
            );

            cityRepository.saveAll(cities);
        }
    }
}
