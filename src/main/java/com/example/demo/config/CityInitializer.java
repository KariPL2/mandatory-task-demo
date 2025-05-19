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
                    new City("Warszawa", 52.2297, 21.0122),
                    new City("Kraków", 50.0647, 19.9450),
                    new City("Wrocław", 51.1079, 17.0385),
                    new City("Poznań", 52.4095, 16.9319),
                    new City("Gdańsk", 54.3520, 18.6466),
                    new City("Szczecin", 53.4285, 14.5530),
                    new City("Bydgoszcz", 53.1236, 18.0076),
                    new City("Lublin", 51.2465, 22.5684),
                    new City("Katowice", 50.2649, 19.0238),
                    new City("Białystok", 53.1325, 23.1688),
                    new City("Gdynia", 54.5189, 18.5305),
                    new City("Częstochowa", 50.8117, 19.0743),
                    new City("Radom", 51.4025, 21.1541),
                    new City("Toruń", 53.0099, 18.5819),
                    new City("Rzeszów", 50.0368, 22.0037),
                    new City("Gliwice", 50.2934, 18.6688),
                    new City("Zabrze", 50.3466, 18.7834),
                    new City("Olsztyn", 53.7784, 20.4808),
                    new City("Opole", 50.6668, 17.9392),
                    new City("Kielce", 50.8661, 20.6285)
            );

            cityRepository.saveAll(cities);
        }
    }
}
