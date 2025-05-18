package com.example.demo.repositories;

import com.example.demo.entities.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Long> {

    List<Keyword> findByNameContainingIgnoreCase(String name);

    List<Keyword> findByNameInIgnoreCase(Collection<String> names);

    Optional<Keyword> findByName(String name);

}