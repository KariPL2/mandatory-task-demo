package com.example.demo.repositories;

import com.example.demo.entities.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign,Long> {

    Optional<Campaign> findByName(String name);
    Optional<Campaign> findById(long id);

    List<Campaign> findAllBySeller_Username(String username);
    List<Campaign> findAll();
    List<Campaign> findAllBySeller_UsernameAndCity_Name(String username, String cityName);
    Optional<Campaign> findBySeller_UsernameAndId(String username, long id);
    List<Campaign> findAllByCity_Name(String cityName);

    List<Campaign> findAllBySeller_UsernameAndName(String sellerUsername, String name);

    @Query(value = """
        SELECT c.*
        FROM campaign c
        JOIN city target_city ON c.city_id = target_city.id
        WHERE c.status = true -- Tylko aktywne kampanie
        AND (
            6371 * acos(
                LEAST(1.0, GREATEST(-1.0, -- Przycinanie wartości do przedziału [-1, 1]
                    cos(radians(:searchLat)) * cos(radians(target_city.latitude)) *
                    cos(radians(target_city.longitude - :searchLon)) +
                    sin(radians(:searchLat)) * sin(radians(target_city.latitude))
                ))
            )
        ) <= :searchRadius -- Porównujemy odległość do PROMIENIA WYSZUKIWANIA
        """,
            nativeQuery = true)
    List<Campaign> findActiveCampaignsNearSearchLocation(
            @Param("searchLat") double searchLat,
            @Param("searchLon") double searchLon,
            @Param("searchRadius") double searchRadius
    );

    // Opcjonalnie, wersja z filtrowaniem po słowach kluczowych
    @Query(value = """
        SELECT DISTINCT c.*
        FROM campaign c
        JOIN campaign_keyword ck ON c.id = ck.campaign_id
        JOIN keyword k ON ck.keyword_id = k.id
        JOIN city target_city ON c.city_id = target_city.id
        WHERE c.status = true
        AND (
            6371 * acos(
                LEAST(1.0, GREATEST(-1.0, -- Przycinanie wartości do przedziału [-1, 1]
                    cos(radians(:searchLat)) * cos(radians(target_city.latitude)) *
                    cos(radians(target_city.longitude - :searchLon)) +
                    sin(radians(:searchLat)) * sin(radians(target_city.latitude))
                ))
            )
        ) <= :searchRadius
        AND k.name IN :keywords
        """,
            nativeQuery = true)
    List<Campaign> findActiveCampaignsNearSearchLocationByKeywords(
            @Param("searchLat") double searchLat,
            @Param("searchLon") double searchLon,
            @Param("searchRadius") double searchRadius,
            @Param("keywords") List<String> keywords
    );
}
