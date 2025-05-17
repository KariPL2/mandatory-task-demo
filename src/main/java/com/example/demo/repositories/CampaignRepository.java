package com.example.demo.repositories;

import com.example.demo.entities.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign,Long> {

    Optional<Campaign> findByName(String name);
    Optional<Campaign> findById(long id);

}
