package com.example.demo.dtos;

import com.example.demo.entities.Campaign;
import com.example.demo.entities.City;
import com.example.demo.entities.Seller;

public record CampaignDTO(
        Long id,
        String name,
        String keyword,
        double price,
        double fund,
        boolean status,
        String city,
        double radius,
        String sellerName) {

    public static CampaignDTO fromEntity(Campaign campaign){
        return new CampaignDTO(
                campaign.getId(),
                campaign.getName(),
                campaign.getKeyword(),
                campaign.getPrice(),
                campaign.getFund(),
                campaign.isStatus(),
                campaign.getCity().getName(),
                campaign.getRadius(),
                campaign.getSeller().getUsername()
        );
    }
}
