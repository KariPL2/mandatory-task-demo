package com.example.demo.services;

import com.example.demo.entities.Keyword;
import com.example.demo.repositories.KeywordRepository;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class KeywordService {

    private final KeywordRepository keywordRepository;

    public KeywordService(KeywordRepository keywordRepository) {
        this.keywordRepository = keywordRepository;
    }

    public List<String> suggest(String query) {
        if (query == null || query.trim().isEmpty()) {
            return keywordRepository.findAll().stream()
                    .limit(10)
                    .map(Keyword::getName)
                    .collect(Collectors.toList());
        }

        return keywordRepository.findByNameContainingIgnoreCase(query).stream()
                .map(Keyword::getName)
                .collect(Collectors.toList());
    }


    public Set<Keyword> findKeywordsByNames(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return new HashSet<>();
        }
        List<Keyword> foundKeywords = keywordRepository.findByNameInIgnoreCase(names);

        return new HashSet<>(foundKeywords);
    }
}