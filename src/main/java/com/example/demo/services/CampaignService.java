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

        if(seller.getBalance() < campaignDTO.price()){
            throw new RuntimeException("Insufficient balance for seller: " + username);
        }
        City city = cityRepository.findByName(campaignDTO.city())
                .orElseThrow(() -> new RuntimeException("City not found with name: " + campaignDTO.city()));
        Set<Keyword> keywordEntities = keywordService.findKeywordsByNames(campaignDTO.keywordsNames());
        seller.setBalance(seller.getBalance() - campaignDTO.price());

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
            campaign.addKeyword(keyword); // Użyj metody pomocniczej z encji Campaign
        }

        //seller.getCampaigns().add(campaign);
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

        // === Walidacja i zarządzanie funduszami przy aktualizacji ===
        double oldFund = existingCampaign.getFund();
        double newFund = campaignDTO.fund();
        double fundDifference = newFund - oldFund;

        // Znajdź sprzedawcę (encję zarządzaną w tej samej transakcji)
        Seller seller = existingCampaign.getSeller(); // Seller jest już powiązany i zarządzany

        if (fundDifference > 0) {
            // Zwiększanie funduszu - sprawdź saldo
            if (seller.getBalance() < fundDifference) {
                throw new RuntimeException("Insufficient balance to increase campaign fund. Required: " + fundDifference + ", available: " + seller.getBalance());
            }
            seller.setBalance(seller.getBalance() - fundDifference); // Odejmij różnicę
        } else if (fundDifference < 0) {
            // Zmniejszanie funduszu - zwróć różnicę na konto sprzedawcy
            seller.setBalance(seller.getBalance() + Math.abs(fundDifference)); // Dodaj różnicę (abs)
        }
        // Zapis sprzedawcy nie jest jawnie potrzebny dzięki Transactional i zarządzanej encji


        // Znajdź encję miasta na podstawie nazwy z DTO, jeśli się zmieniła
        City city = existingCampaign.getCity(); // Obecne miasto
        if (!city.getName().equals(campaignDTO.city())) {
            city = cityRepository.findByName(campaignDTO.city()) // Znajdź nowe miasto
                    .orElseThrow(() -> new RuntimeException("City not found with name: " + campaignDTO.city()));
            existingCampaign.setCity(city); // Ustaw nowe miasto
        }

        // Znajdź NOWE encje słów kluczowych na podstawie nazw z DTO
        Set<Keyword> newKeywordEntities = keywordService.findKeywordsByNames(campaignDTO.keywordsNames());

        // --- Upewnij się, że znaleziono wszystkie NOWE słowa kluczowe (opcjonalnie) ---
        if (newKeywordEntities.size() != campaignDTO.keywordsNames().size()) {
            // Logika jak przy tworzeniu - rzuć błąd jeśli jakieś słowo nie istnieje
            Set<String> foundNames = newKeywordEntities.stream().map(Keyword::getName).collect(Collectors.toSet());
            Set<String> notFoundNames = new HashSet<>(campaignDTO.keywordsNames());
            notFoundNames.removeAll(foundNames);
            throw new RuntimeException("Following new keywords not found: " + notFoundNames);
        }
        // ---------------------------------------------------------------------


        // === Zarządzanie relacją Many-to-Many (usuń stare, dodaj nowe) ===
        Set<Keyword> keywordsToRemove = new HashSet<>(existingCampaign.getKeywords()); // Utwórz kopię obecnych słów
        for (Keyword keyword : keywordsToRemove) {
            existingCampaign.removeKeyword(keyword); // Użyj metody pomocniczej (usunie z Setu i z tabeli M2M)
        }
        for (Keyword keyword : newKeywordEntities) {
            existingCampaign.addKeyword(keyword); // Użyj metody pomocniczej (doda do Setu i do tabeli M2M)
        }


        // === Zaktualizuj pozostałe pola kampanii z DTO ===
        existingCampaign.setName(campaignDTO.name());
        // Usunięto setKeyword
        existingCampaign.setPrice(campaignDTO.price()); // Ustaw nową stawkę
        existingCampaign.setFund(newFund); // Ustaw nowy budżet
        existingCampaign.setStatus(campaignDTO.status() != null ? campaignDTO.status() : existingCampaign.isStatus()); // Ustaw status (obsługa null z DTO, zachowaj stary jeśli null)
        existingCampaign.setRadius(campaignDTO.radius()); // Ustaw nowy promień

        // Zapisz zaktualizowaną kampanię (JPA zarządzi relacją M2M i zmianami w sprzedawcy)
        Campaign updatedCampaignEntity = campaignRepository.save(existingCampaign);

        // Zwróć DTO
        return CampaignDTO.fromEntity(updatedCampaignEntity);
    }

    @Transactional // Powinna być transakcyjna
    public CampaignDTO updateCampaignStatus(String username, long id, boolean status) { // <-- Upewnij się, że sygnatura jest POPRAWNA
        // Metoda dla użytkownika - zmienia tylko status kampanii po ID
        Campaign campaign = campaignRepository.findBySeller_UsernameAndId(username, id)
                .orElseThrow(() -> new RuntimeException("Campaign not found or you are not authorized with id: " + id));

        campaign.setStatus(status); // Ustaw status na wartość z parametru

        Campaign updatedCampaign = campaignRepository.save(campaign);
        return CampaignDTO.fromEntity(updatedCampaign); // Mapowanie encji na DTO
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
