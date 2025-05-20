package com.example.demo.services;

import com.example.demo.dtos.CampaignDTO;
import com.example.demo.dtos.CreateCampaignDTO;
import com.example.demo.entities.Campaign;
import com.example.demo.entities.City;
import com.example.demo.entities.Keyword;
import com.example.demo.entities.Seller;
import com.example.demo.exceptions.InsufficientBalanceException;
import com.example.demo.exceptions.NotFoundException;
import com.example.demo.repositories.CampaignRepository;
import com.example.demo.repositories.CityRepository;
import com.example.demo.repositories.SellerRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

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

    public CampaignService(CampaignRepository campaignRepository, SellerRepository sellerRepository,
                           CityRepository cityRepository, KeywordService keywordService) {
        this.campaignRepository = campaignRepository;
        this.sellerRepository = sellerRepository;
        this.cityRepository = cityRepository;
        this.keywordService = keywordService;
    }

    @Transactional
    public CampaignDTO findByName(String name) {
        return campaignRepository.findByName(name)
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new NotFoundException("Campaign not found with name: " + name));
    }

    @Transactional
    public CampaignDTO findById(long id) {
        return campaignRepository.findById(id)
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new NotFoundException("Campaign not found with id: " + id));
    }

    @Transactional
    public List<CampaignDTO> findAllByUsername(String username) {
        return campaignRepository.findAllBySeller_Username(username)
                .stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CampaignDTO createCampaign(String username, CreateCampaignDTO campaignDTO) {
        Seller seller = sellerRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Seller not found with username: " + username));

        if (campaignRepository.findByName(campaignDTO.name()).isPresent()) {
            throw new IllegalArgumentException("Campaign with name already exists: " + campaignDTO.name());
        }

        if (seller.getBalance() < campaignDTO.price() + campaignDTO.fund()) {
            throw new InsufficientBalanceException("Insufficient balance for seller: " + username);
        }

        City city = cityRepository.findByName(campaignDTO.city())
                .orElseThrow(() -> new NotFoundException("City not found with name: " + campaignDTO.city()));

        Set<Keyword> keywordEntities = keywordService.findKeywordsByNames(campaignDTO.keywordsNames());

        seller.setBalance(seller.getBalance() - (campaignDTO.price() + campaignDTO.fund()));
        sellerRepository.flush();

        Campaign campaign = Campaign.builder()
                .name(campaignDTO.name())
                .price(campaignDTO.price())
                .fund(campaignDTO.fund())
                .status(campaignDTO.status())
                .city(city)
                .seller(seller)
                .build();

        for (Keyword keyword : keywordEntities) {
            campaign.addKeyword(keyword);
        }

        campaignRepository.save(campaign);

        return CampaignDTO.fromEntity(campaign);
    }

    @Transactional
    public List<CampaignDTO> findByCity(String cityName) {
        return campaignRepository.findAllByCity_Name(cityName)
                .stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<CampaignDTO> findAll() {
        return campaignRepository.findAll()
                .stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteById(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Campaign not found with id: " + id));
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
    public List<CampaignDTO> findAllByUsernameAndName(String username, String name) {
        return campaignRepository.findAllBySeller_UsernameAndName(username, name)
                .stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CampaignDTO updateCampaign(String username, long id, CreateCampaignDTO campaignDTO) {
        Campaign existingCampaign = campaignRepository.findBySeller_UsernameAndId(username, id)
                .orElseThrow(() -> new NotFoundException("Campaign not found or you are not authorized with id: " + id));

        double oldFund = existingCampaign.getFund();
        double newFund = campaignDTO.fund();
        double fundDifference = newFund - oldFund;

        Seller seller = sellerRepository.findById(existingCampaign.getSeller().getId())
                .orElseThrow(() -> new NotFoundException("Seller not found for campaign with id: " + id));

        if (fundDifference > 0) {
            if (seller.getBalance() < fundDifference) {
                throw new InsufficientBalanceException("Insufficient balance to increase campaign fund. Required: " + fundDifference);
            }
            seller.setBalance(seller.getBalance() - fundDifference);
        } else {
            seller.setBalance(seller.getBalance() + Math.abs(fundDifference));
        }

        sellerRepository.save(seller);
        sellerRepository.flush();

        existingCampaign.setName(campaignDTO.name());
        existingCampaign.setPrice(campaignDTO.price());
        existingCampaign.setFund(newFund);
        existingCampaign.setStatus(campaignDTO.status() != null ? campaignDTO.status() : existingCampaign.isStatus());

        if (!existingCampaign.getCity().getName().equals(campaignDTO.city())) {
            City city = cityRepository.findByName(campaignDTO.city())
                    .orElseThrow(() -> new NotFoundException("City not found with name: " + campaignDTO.city()));
            existingCampaign.setCity(city);
        }

        Set<Keyword> newKeywords = keywordService.findKeywordsByNames(campaignDTO.keywordsNames());
        Set<String> foundNames = newKeywords.stream().map(Keyword::getName).collect(Collectors.toSet());
        Set<String> notFound = new HashSet<>(campaignDTO.keywordsNames());
        notFound.removeAll(foundNames);

        if (!notFound.isEmpty()) {
            throw new NotFoundException("Following keywords not found: " + notFound);
        }

        existingCampaign.getKeywords().clear();
        for (Keyword keyword : newKeywords) {
            existingCampaign.addKeyword(keyword);
        }

        Campaign updatedCampaign = campaignRepository.save(existingCampaign);

        return CampaignDTO.fromEntity(updatedCampaign);
    }

    @Transactional
    public CampaignDTO updateCampaignStatus(String username, long id, boolean status) {
        Campaign campaign = campaignRepository.findBySeller_UsernameAndId(username, id)
                .orElseThrow(() -> new NotFoundException("Campaign not found or you are not authorized with id: " + id));

        campaign.setStatus(status);

        Campaign updatedCampaign = campaignRepository.save(campaign);
        return CampaignDTO.fromEntity(updatedCampaign);
    }

    @Transactional
    public void deleteCampaign(String username, long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Campaign not found with id: " + id));

        if (!campaign.getSeller().getUsername().equals(username)) {
            throw new IllegalArgumentException("You are not authorized to delete this campaign");
        }

        Seller seller = campaign.getSeller();
        seller.setBalance(seller.getBalance() + campaign.getFund());
        sellerRepository.save(seller);

        campaignRepository.delete(campaign);
    }

    @Transactional
    public CampaignDTO findByUsernameAndId(String username, long id) {
        return campaignRepository.findBySeller_UsernameAndId(username, id)
                .map(CampaignDTO::fromEntity)
                .orElseThrow(() -> new NotFoundException("Campaign not found with id: " + id));
    }

    @Transactional
    public boolean getStatusByUsernameAndCampaignId(String username, Long campaignId) {
        Campaign campaign = campaignRepository.findBySeller_UsernameAndId(username, campaignId)
                .orElseThrow(() -> new NotFoundException("Campaign not found with id: " + campaignId));
        return campaign.isStatus();
    }

    @Transactional
    public List<CampaignDTO> findActiveCampaignsNearSearchLocation(String searchCityName, double searchRadius) {
        City searchCity = cityRepository.findByName(searchCityName)
                .orElseThrow(() -> new NotFoundException("Search city not found: " + searchCityName));

        List<Campaign> campaigns = campaignRepository.findActiveCampaignsNearSearchLocation(
                searchCity.getLatitude(),
                searchCity.getLongitude(),
                searchRadius // Przekazanie searchRadius
        );

        return campaigns.stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<CampaignDTO> findActiveCampaignsNearSearchLocationByKeywords(String searchCityName, double searchRadius, List<String> keywords) {
        City searchCity = cityRepository.findByName(searchCityName)
                .orElseThrow(() -> new NotFoundException("Search city not found: " + searchCityName));

        List<Campaign> campaigns = campaignRepository.findActiveCampaignsNearSearchLocationByKeywords(
                searchCity.getLatitude(),
                searchCity.getLongitude(),
                searchRadius,
                keywords
        );

        return campaigns.stream()
                .map(CampaignDTO::fromEntity)
                .collect(Collectors.toList());
    }

}
