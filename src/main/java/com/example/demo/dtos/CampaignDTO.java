package com.example.demo.dtos;

import com.example.demo.entities.Campaign;
import com.example.demo.entities.City;
import com.example.demo.entities.Keyword;
import com.example.demo.entities.Seller;

import java.util.Set;
import java.util.stream.Collectors;

public record CampaignDTO(
        Long id,
        String name,
        Set<String> keywordsNames,
        double price,
        double fund,
        boolean status,
        String city,
        String sellerName) {

    public static CampaignDTO fromEntity(Campaign campaign){
        return new CampaignDTO(
                campaign.getId(),
                campaign.getName(),
                campaign.getKeywords().stream().map(Keyword::getName).collect(Collectors.toSet()),
                campaign.getPrice(),
                campaign.getFund(),
                campaign.isStatus(),
                campaign.getCity().getName(),
                campaign.getSeller().getUsername()
        );
    }
}
