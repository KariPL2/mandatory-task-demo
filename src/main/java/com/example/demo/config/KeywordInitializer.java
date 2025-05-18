package com.example.demo.config;

import com.example.demo.entities.Keyword;
import com.example.demo.repositories.KeywordRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class KeywordInitializer implements CommandLineRunner {

    private final KeywordRepository keywordRepository;

    public KeywordInitializer(KeywordRepository keywordRepository) {
        this.keywordRepository = keywordRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (keywordRepository.count() == 0) {
            List<Keyword> initialKeywords = List.of(
                    new Keyword("elektronika"),
                    new Keyword("telefony"),
                    new Keyword("laptopy"),
                    new Keyword("telewizory"),
                    new Keyword("moda"),
                    new Keyword("sukienki"),
                    new Keyword("spodnie"),
                    new Keyword("koszule"),
                    new Keyword("dom i ogród"),
                    new Keyword("meble"),
                    new Keyword("narzędzia"),
                    new Keyword("rośliny"),
                    new Keyword("sport"),
                    new Keyword("buty sportowe"),
                    new Keyword("odzież sportowa"),
                    new Keyword("akcesoria fitness"),
                    new Keyword("książki"),
                    new Keyword("gry planszowe"),
                    new Keyword("zabawki dla dzieci")
            );

            keywordRepository.saveAll(initialKeywords);
        }
    }
}