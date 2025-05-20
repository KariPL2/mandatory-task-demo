package com.example.demo.controllers;


import com.example.demo.dtos.CreateSellerDTO;
import com.example.demo.dtos.SellerDTO;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.services.SellerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sellers")
public class SellerController {

    private final SellerService sellerService;

    public SellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    @GetMapping("/me")
    public ResponseEntity<SellerDTO> getCurrentSeller(@AuthenticationPrincipal CustomUserDetails user) {
        SellerDTO seller = sellerService.getCurrentSellerInfo(user.getUsername());
        return ResponseEntity.ok(seller);
    }
    @DeleteMapping("/me")
    public void deleteUser(@AuthenticationPrincipal CustomUserDetails user) {
        sellerService.deleteByUsername(user.getUsername());
    }

    @PatchMapping("/me/add-funds/{amount}")
    public ResponseEntity<SellerDTO> addFunds(@AuthenticationPrincipal CustomUserDetails user,
                                              @PathVariable Double amount) {
        SellerDTO updatedSeller = sellerService.addFunds(user.getUsername(), amount).getBody();
        return ResponseEntity.ok(updatedSeller);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @GetMapping()
    public ResponseEntity<List<SellerDTO>> getAllSellers() {
        List<SellerDTO> sellers = sellerService.findAll();
        return ResponseEntity.ok(sellers);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @GetMapping("/{sellerId}")
    public ResponseEntity<SellerDTO> getSellerById(@PathVariable Long sellerId) {
        SellerDTO seller = sellerService.findById(sellerId);
        return ResponseEntity.ok(seller);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/{sellerId}")
    public ResponseEntity<Void> deleteSellerById(@PathVariable Long sellerId) {
        sellerService.deleteById(sellerId);
        return ResponseEntity.noContent().build();
    }






}
