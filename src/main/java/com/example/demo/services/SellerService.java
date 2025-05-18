package com.example.demo.services;


import com.example.demo.dtos.CreateSellerDTO;
import com.example.demo.dtos.SellerDTO;
import com.example.demo.entities.Seller;
import com.example.demo.repositories.SellerRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.PasswordAuthentication;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SellerService {


    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;

    public SellerService(SellerRepository sellerRepository ,PasswordEncoder passwordEncoder) {
        this.sellerRepository = sellerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public SellerDTO findByName(String username) {
        return sellerRepository.findByUsername(username).map(SellerDTO::fromEntity).orElseThrow(() -> new RuntimeException("Seller not found with name: " + username));
    }
    public SellerDTO findById(long id) {
        return sellerRepository.findById(id).map(SellerDTO::fromEntity).orElseThrow( () -> new RuntimeException("Seller not found with id: " + id));
    }
    public boolean existsByEmail(String email) {
        return sellerRepository.existsByEmail(email);
    }
    public boolean existsByName(String username) {
        return sellerRepository.existsByUsername(username);
    }
    public SellerDTO getSellerWithCampaigns(Long sellerId) {
        return sellerRepository.findById(sellerId).map(SellerDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Seller not found"));
    }

    public List<SellerDTO> findAll() {
        return sellerRepository.findAll().stream()
                .map(SellerDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public SellerDTO getCurrentSellerInfo(String username) {
        return sellerRepository.findByUsername(username)
                .map(SellerDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Seller not found: " + username));
    }

    public void deleteById(Long id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Seller not found with id: " + id));
        sellerRepository.delete(seller);
    }

    public void deleteByUsername(String username) {
        Seller seller = sellerRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Seller not found with id: " + username));
        sellerRepository.delete(seller);
    }

    public SellerDTO register(CreateSellerDTO createSellerDTO) {
        validateUniqness(createSellerDTO);

        Seller seller = toEntity(createSellerDTO);
        Seller savedSeller = sellerRepository.save(seller);
        return SellerDTO.fromEntity(savedSeller);
    }


    private void validateUniqness(CreateSellerDTO createSellerDTO){
        if (sellerRepository.existsByEmail(createSellerDTO.email())) {
            throw new RuntimeException("Email already exists");
        }
        if (sellerRepository.existsByUsername(createSellerDTO.username())) {
            throw new RuntimeException("Username already exists");
        }
        if(createSellerDTO.balance()< 0.0)
            throw new RuntimeException("Balance cannot be negative");
    }

    private Seller toEntity(CreateSellerDTO createSellerDTO) {
        Seller seller = new Seller();
        seller.setUsername(createSellerDTO.username());
        seller.setEmail(createSellerDTO.email());
        seller.setPassword(passwordEncoder.encode(createSellerDTO.password()));
        Double balance = createSellerDTO.balance();
        seller.setBalance(balance != null ? balance : 0.0);
        seller.setRole("FREE_USER");
        return seller;
    }

    public ResponseEntity<SellerDTO> addFunds(String username, double amount) {
        Seller seller = sellerRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Seller not found with username: " + username));
        if(amount <= 0)
            throw new RuntimeException("Amount must be greater than zero");

        seller.setBalance(seller.getBalance() + amount);
        sellerRepository.save(seller);
        return ResponseEntity.ok(SellerDTO.fromEntity(seller));
    }

}
