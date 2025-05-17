package com.example.demo.services;

import com.example.demo.dtos.CampaignDTO;
import com.example.demo.repositories.CampaignRepository;
import org.springframework.stereotype.Service;

@Service
public class CampaignService {

    private final CampaignRepository campaignRepository;

    public CampaignService(CampaignRepository campaignRepository) {
        this.campaignRepository = campaignRepository;
    }

    public CampaignDTO findByName(String name) {
        return campaignRepository.findByName(name)
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Campaign not found with name: " + name));
    }

    public CampaignDTO findById(long id) {
        return campaignRepository.findById(id)
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));
    }
}
