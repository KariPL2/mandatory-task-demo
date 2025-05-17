package com.example.demo.services;


import com.example.demo.dtos.CreateSellerDTO;
import com.example.demo.dtos.SellerDTO;
import com.example.demo.entities.Seller;
import com.example.demo.repositories.SellerRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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

    public List<SellerDTO> findAll() {
        return sellerRepository.findAll().stream()
                .map(SellerDTO::fromEntity)
                .collect(Collectors.toList());
    }
    public SellerDTO register(CreateSellerDTO createSellerDTO) {
        validateUniqness(createSellerDTO);

        Seller seller = toEntity(createSellerDTO);
        Seller savedSeller = sellerRepository.save(seller);
        return SellerDTO.fromEntity(savedSeller);
    }


    private void validateUniqness(CreateSellerDTO createSellerDTO){
        if (sellerRepository.findByEmail(createSellerDTO.email()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (sellerRepository.existsByUsername(createSellerDTO.username())) {
            throw new RuntimeException("Username already exists");
        }
    }

    private Seller toEntity(CreateSellerDTO createSellerDTO) {
        Seller seller = new Seller();
        seller.setUsername(createSellerDTO.username());
        seller.setEmail(createSellerDTO.email());
        seller.setPassword(createSellerDTO.password());//passwordEncoder.encode(createSellerDTO.password()));
        Double balance = createSellerDTO.balance();
        seller.setBalance(balance != null ? balance : 0.0);
        return seller;
    }

}
