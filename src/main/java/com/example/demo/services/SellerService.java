package com.example.demo.services;

import com.example.demo.dtos.CreateSellerDTO;
import com.example.demo.dtos.SellerDTO;
import com.example.demo.entities.Seller;
import com.example.demo.exceptions.BadRequestException;
import com.example.demo.exceptions.NotFoundException;
import com.example.demo.repositories.SellerRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;

    public SellerService(SellerRepository sellerRepository, PasswordEncoder passwordEncoder) {
        this.sellerRepository = sellerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public SellerDTO findByName(String username) {
        return sellerRepository.findByUsername(username)
                .map(SellerDTO::fromEntity)
                .orElseThrow(() -> new NotFoundException("Seller not found with username: " + username));
    }

    public SellerDTO findById(long id) {
        return sellerRepository.findById(id)
                .map(SellerDTO::fromEntity)
                .orElseThrow(() -> new NotFoundException("Seller not found with id: " + id));
    }

    public boolean existsByEmail(String email) {
        return sellerRepository.existsByEmail(email);
    }

    public boolean existsByName(String username) {
        return sellerRepository.existsByUsername(username);
    }

    public SellerDTO getSellerWithCampaigns(Long sellerId) {
        return sellerRepository.findById(sellerId)
                .map(SellerDTO::fromEntity)
                .orElseThrow(() -> new NotFoundException("Seller not found with id: " + sellerId));
    }

    public List<SellerDTO> findAll() {
        return sellerRepository.findAll().stream()
                .map(SellerDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public SellerDTO getCurrentSellerInfo(String username) {
        return sellerRepository.findByUsername(username)
                .map(SellerDTO::fromEntity)
                .orElseThrow(() -> new NotFoundException("Seller not found: " + username));
    }

    @Transactional
    public void deleteById(Long id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Seller not found with id: " + id));
        sellerRepository.delete(seller);
    }

    @Transactional
    public void deleteByUsername(String username) {
        Seller seller = sellerRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Seller not found with username: " + username));
        sellerRepository.delete(seller);
    }
    @Transactional
    public SellerDTO register(CreateSellerDTO createSellerDTO) {
        validateUniqueness(createSellerDTO);
        Seller seller = toEntity(createSellerDTO);
        return SellerDTO.fromEntity(sellerRepository.save(seller));
    }

    private void validateUniqueness(CreateSellerDTO createSellerDTO) {
        if (sellerRepository.existsByEmail(createSellerDTO.email())) {
            throw new BadRequestException("Email already exists");
        }
        if (sellerRepository.existsByUsername(createSellerDTO.username())) {
            throw new BadRequestException("Username already exists");
        }
        if (createSellerDTO.balance() < 0.0) {
            throw new BadRequestException("Balance cannot be negative");
        }
    }

    private Seller toEntity(CreateSellerDTO createSellerDTO) {
        Seller seller = new Seller();
        seller.setUsername(createSellerDTO.username());
        seller.setEmail(createSellerDTO.email());
        seller.setPassword(passwordEncoder.encode(createSellerDTO.password()));
        seller.setBalance(createSellerDTO.balance());
        seller.setRole("FREE_USER");
        return seller;
    }

    public ResponseEntity<SellerDTO> addFunds(String username, double amount) {
        if (amount <= 0) throw new BadRequestException("Amount must be greater than zero");

        Seller seller = sellerRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Seller not found with username: " + username));

        seller.setBalance(seller.getBalance() + amount);
        sellerRepository.save(seller);

        return ResponseEntity.ok(SellerDTO.fromEntity(seller));
    }
}
