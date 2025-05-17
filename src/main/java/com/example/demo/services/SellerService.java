package com.example.demo.services;


import com.example.demo.dtos.SellerDTO;
import com.example.demo.repositories.SellerRepository;
import org.springframework.stereotype.Service;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;

    public SellerService(SellerRepository sellerRepository ) {
        this.sellerRepository = sellerRepository;
    }

    public SellerDTO findByName(String username) {
        return sellerRepository.findByUsername(username).map(SellerDTO::fromEntity).orElseThrow(() -> new RuntimeException("Seller not found with name: " + username));
    }
    public SellerDTO findById(long id) {
        return sellerRepository.findById(id).map(SellerDTO::fromEntity).orElseThrow( () -> new RuntimeException("Seller not found with id: " + id));
    }
    public SellerDTO findByEmail(String email) {
        return sellerRepository.findByEmail(email).map(SellerDTO::fromEntity).orElseThrow(() -> new RuntimeException("Seller not found with email: " + email));
    }
    public boolean existsByEmail(String email) {
        return sellerRepository.existsByEmail(email);
    }
    public boolean existsByName(String username) {
        return sellerRepository.existsByUsername(username);
    }
    public SellerDTO getSellerWithCampaigns(Long sellerId) {
        return sellerRepository.findWithCampaignsById(sellerId).map(SellerDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
    }

}
