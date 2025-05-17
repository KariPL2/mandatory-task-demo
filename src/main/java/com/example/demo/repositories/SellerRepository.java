package com.example.demo.repositories;

import com.example.demo.entities.Seller;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller,Long> {

    Optional<Seller> findById(long id);
    Optional<Seller> findByUsername(String username);
    Optional<Seller> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    @EntityGraph(attributePaths = "campaigns")
    Optional<Seller> findWithCampaignsById(Long id);

}
