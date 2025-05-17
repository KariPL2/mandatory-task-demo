package com.example.demo.dtos;

import com.example.demo.entities.Campaign;
import com.example.demo.entities.Seller;

import java.util.List;
import java.util.stream.Collectors;

public record SellerDTO(
        Long id,
        String username,
        String email,
        double balance,
        List<String> campaigns
){
    public static SellerDTO fromEntity(Seller seller){
        return new SellerDTO(
                seller.getId(),
                seller.getUsername(),
                seller.getEmail(),
                seller.getBalance(),
                seller.getCampaigns().stream()
                        .map(Campaign::getName)
                        .collect(Collectors.toList())
        );
    }
}
