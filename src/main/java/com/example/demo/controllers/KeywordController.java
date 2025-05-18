package com.example.demo.controllers;
import com.example.demo.services.KeywordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/keywords")
public class KeywordController {

    private final KeywordService keywordService;


    public KeywordController(KeywordService keywordService) {
        this.keywordService = keywordService;
    }

    @GetMapping("/suggest")
    public ResponseEntity<List<String>> suggestKeywords(@RequestParam(required = false) String q) {
        List<String> suggestions = keywordService.suggest(q);
        return ResponseEntity.ok(suggestions);
    }
}