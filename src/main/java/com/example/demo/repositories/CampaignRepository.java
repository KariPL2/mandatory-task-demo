package com.example.demo.repositories;

import com.example.demo.entities.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
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

}
