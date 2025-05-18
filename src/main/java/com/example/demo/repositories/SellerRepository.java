package com.example.demo.repositories;

import com.example.demo.entities.Seller;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller,Long> {
    @EntityGraph(attributePaths = {"campaigns"})
    Optional<Seller> findById(long id);

    @EntityGraph(attributePaths = {"campaigns"})
    Optional<Seller> findByUsername(String username);


    boolean existsByEmail(String email);
    boolean existsByUsername(String username);



    @EntityGraph(attributePaths = {"campaigns"})
    List<Seller> findAll();
}
