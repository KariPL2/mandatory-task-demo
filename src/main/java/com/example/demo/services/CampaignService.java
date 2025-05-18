package com.example.demo.services;

import com.example.demo.dtos.CampaignDTO;
import com.example.demo.dtos.CreateCampaignDTO;
import com.example.demo.entities.Campaign;
import com.example.demo.entities.City;
import com.example.demo.entities.Keyword;
import com.example.demo.entities.Seller;
import com.example.demo.repositories.CampaignRepository;
import com.example.demo.repositories.CityRepository;
import com.example.demo.repositories.SellerRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final SellerRepository sellerRepository;
    private final CityRepository cityRepository;
    private final KeywordService keywordService;

    public CampaignService(CampaignRepository campaignRepository, SellerRepository sellerRepository
    , CityRepository cityRepository, KeywordService keywordService) {
        this.campaignRepository = campaignRepository;
        this.sellerRepository = sellerRepository;
        this.cityRepository = cityRepository;
        this.keywordService = keywordService;
    }
    @Transactional
    public CampaignDTO findByName(String name) {
        return campaignRepository.findByName(name)
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Campaign not found with name: " + name));
    }
    @Transactional
    public CampaignDTO findById(long id) {
        return campaignRepository.findById(id)
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));
    }

    @Transactional
    public List<CampaignDTO> findAllByUsername(String username) {
        List<Campaign> campaigns = campaignRepository.findAllBySeller_Username(username);
        return campaigns.stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }
    @Transactional
    public CampaignDTO createCampaign(String username, CreateCampaignDTO campaignDTO) {
        Seller seller = sellerRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Seller not found with username: " + username));

        if(seller.getBalance() < campaignDTO.price()+campaignDTO.fund()){
            throw new RuntimeException("Insufficient balance for seller: " + username);
        }
        City city = cityRepository.findByName(campaignDTO.city())
                .orElseThrow(() -> new RuntimeException("City not found with name: " + campaignDTO.city()));
        Set<Keyword> keywordEntities = keywordService.findKeywordsByNames(campaignDTO.keywordsNames());
        seller.setBalance(seller.getBalance() - (campaignDTO.price()+campaignDTO.fund()));
        sellerRepository.flush();
        Campaign campaign = Campaign.builder()
                .name(campaignDTO.name())
                .price(campaignDTO.price())
                .fund(campaignDTO.fund())
                .status(campaignDTO.status())
                .city(city)
                .radius(campaignDTO.radius())
                .seller(seller)
                .build();

        for (Keyword keyword : keywordEntities) {
            campaign.addKeyword(keyword);
        }

        campaignRepository.save(campaign);

        return CampaignDTO.fromEntity(campaign);
    }
    @Transactional
    public List<CampaignDTO> findByCity(String city) {
        return campaignRepository.findAllBySeller_Username(city)
                .stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }
    @Transactional
    public List<CampaignDTO> findAll(){
        return campaignRepository.findAll()
                .stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public void deleteById(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));
        campaignRepository.delete(campaign);
    }
    @Transactional
    public List<CampaignDTO> findAllByUsernameAndCity(String username, String cityName) {
        return campaignRepository.findAllBySeller_UsernameAndCity_Name(username, cityName)
                .stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }
    @Transactional
    public CampaignDTO updateCampaign(String username, long id, CreateCampaignDTO campaignDTO) {
        Campaign existingCampaign = campaignRepository.findBySeller_UsernameAndId(username, id)
                .orElseThrow(() -> new RuntimeException("Campaign not found or you are not authorized with id: " + id));

        double oldFund = existingCampaign.getFund();
        double newFund = campaignDTO.fund();
        double fundDifference = newFund - oldFund;

        Seller seller = sellerRepository.findById(existingCampaign.getSeller().getId())
                .orElseThrow(() -> new RuntimeException("Seller not found even though linked to campaign ID: " + id));


        if (fundDifference > 0) {
            if (seller.getBalance() < fundDifference) {
                throw new RuntimeException("Insufficient balance to increase campaign fund. Required: " + fundDifference + ", available: " + seller.getBalance());
            }
            seller.setBalance(seller.getBalance() - fundDifference);
        } else if (fundDifference < 0) {
            seller.setBalance(seller.getBalance() + Math.abs(fundDifference));
        }
        sellerRepository.save(seller);
        sellerRepository.flush();

        existingCampaign.setName(campaignDTO.name());
        existingCampaign.setPrice(campaignDTO.price());
        existingCampaign.setFund(newFund);
        existingCampaign.setStatus(campaignDTO.status() != null ? campaignDTO.status() : existingCampaign.isStatus());
        existingCampaign.setRadius(campaignDTO.radius());


        City city = existingCampaign.getCity();
        if (!city.getName().equals(campaignDTO.city())) {
            city = cityRepository.findByName(campaignDTO.city())
                    .orElseThrow(() -> new RuntimeException("City not found with name: " + campaignDTO.city()));
            existingCampaign.setCity(city);
        }


        Set<Keyword> newKeywordEntities = keywordService.findKeywordsByNames(campaignDTO.keywordsNames());

        if (newKeywordEntities.size() != campaignDTO.keywordsNames().size()) {
            Set<String> foundNames = newKeywordEntities.stream().map(Keyword::getName).collect(Collectors.toSet());
            Set<String> notFoundNames = new HashSet<>(campaignDTO.keywordsNames());
            notFoundNames.removeAll(foundNames);
            throw new RuntimeException("Following new keywords not found: " + notFoundNames);
        }

        Set<Keyword> currentKeywordsCopy = new HashSet<>(existingCampaign.getKeywords());
        for (Keyword keyword : currentKeywordsCopy) {
            existingCampaign.removeKeyword(keyword);
        }
        for (Keyword keyword : newKeywordEntities) {
            existingCampaign.addKeyword(keyword);
        }

        Campaign updatedCampaignEntity = campaignRepository.save(existingCampaign);

        return CampaignDTO.fromEntity(updatedCampaignEntity);
    }

    @Transactional
    public CampaignDTO updateCampaignStatus(String username, long id, boolean status) {
        Campaign campaign = campaignRepository.findBySeller_UsernameAndId(username, id)
                .orElseThrow(() -> new RuntimeException("Campaign not found or you are not authorized with id: " + id));

        campaign.setStatus(status);

        Campaign updatedCampaign = campaignRepository.save(campaign);
        return CampaignDTO.fromEntity(updatedCampaign);
    }
    @Transactional
    public void deleteCampaign(String username, long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));

        if (!campaign.getSeller().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to delete this campaign");
        }

        campaignRepository.delete(campaign);
    }
    @Transactional
    public CampaignDTO findByUsernameAndId(String username, long id) {
        return campaignRepository.findBySeller_UsernameAndId(username, id)
                .stream()
                .findFirst()
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));
    }
    @Transactional
    public boolean getStatusByUsernameAndCampaignId(String username, Long campaignId) {
        Campaign campaign = campaignRepository.findBySeller_UsernameAndId(username, campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        return campaign.isStatus();
    }

}
