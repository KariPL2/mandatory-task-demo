package com.example.demo.controllers;

import com.example.demo.dtos.CreateSellerDTO;
import com.example.demo.dtos.SellerDTO;
import com.example.demo.services.SellerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/home")
public class HomeController {

    private final SellerService sellerService;

    public HomeController(SellerService sellerService) {
        this.sellerService = sellerService;
    }
    @GetMapping
    public String getHome() {
        return "Hello Home";
    }

    @PostMapping("/register")
    public ResponseEntity<SellerDTO> register(@Valid @RequestBody CreateSellerDTO seller) {
        SellerDTO savedSeller = sellerService.register(seller);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSeller);
    }


}
