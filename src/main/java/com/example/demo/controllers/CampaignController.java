package com.example.demo.controllers;


import com.example.demo.dtos.CampaignDTO;
import com.example.demo.dtos.CreateCampaignDTO;
import com.example.demo.dtos.UpdateCampaignStatusDTO;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.services.CampaignService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/campaigns")
public class CampaignController {

    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @GetMapping("/{campaignId}")
    public ResponseEntity<CampaignDTO> getUserCampaignById(@AuthenticationPrincipal CustomUserDetails user,
                                                           @PathVariable Long campaignId) {
        CampaignDTO campaign = campaignService.findByUsernameAndId(user.getUsername(), campaignId);
        return ResponseEntity.ok(campaign);
    }

    @GetMapping
    public ResponseEntity<List<CampaignDTO>> getCampaigns(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String name) {
        List<CampaignDTO> campaigns;
        if (city != null) {
            campaigns = campaignService.findAllByUsernameAndCity(user.getUsername(), city);
        } else if (name != null) {
            campaigns = campaignService.findAllByUsernameAndName(user.getUsername(), name);
        } else {
            campaigns = campaignService.findAllByUsername(user.getUsername());
        }
        return ResponseEntity.ok(campaigns);
    }

    @PostMapping()
    public ResponseEntity<CampaignDTO> createCampaign(@AuthenticationPrincipal CustomUserDetails user,
                                                      @Valid @RequestBody CreateCampaignDTO campaignDTO){
        CampaignDTO createdCampaign = campaignService.createCampaign(user.getUsername(), campaignDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCampaign);
    }
    @GetMapping("/{campaignId}/status")
    public ResponseEntity<Boolean> getCampaignStatus(@AuthenticationPrincipal CustomUserDetails user,
                                                     @PathVariable Long campaignId) {
        boolean status = campaignService.getStatusByUsernameAndCampaignId(user.getUsername(), campaignId);
        return ResponseEntity.ok(status);
    }

    @PatchMapping("/{campaignId}")
    public ResponseEntity<CampaignDTO> updateCampaign(@AuthenticationPrincipal CustomUserDetails user,
                                                      @PathVariable Long campaignId,
                                                      @Valid @RequestBody CreateCampaignDTO campaignDTO) {
        CampaignDTO updatedCampaign = campaignService.updateCampaign(user.getUsername(), campaignId, campaignDTO);
        return ResponseEntity.ok(updatedCampaign);
    }
    @PatchMapping("/{campaignId}/status")
    public ResponseEntity<CampaignDTO> updateCampaignStatus(@AuthenticationPrincipal CustomUserDetails user,
                                                            @PathVariable Long campaignId,
                                                            @Valid @RequestBody UpdateCampaignStatusDTO statusDTO) { // <-- TERAZ PRZYJMUJE DTO W BODY
        // Wywołaj metodę serwisu z TRZEMA argumentami
        CampaignDTO updatedCampaign = campaignService.updateCampaignStatus(user.getUsername(), campaignId, statusDTO.status());
        return ResponseEntity.ok(updatedCampaign);
    }

    @DeleteMapping("/{campaignId}")
    public ResponseEntity<Void> deleteUserCampaign(@AuthenticationPrincipal CustomUserDetails user,
                                                   @PathVariable Long campaignId) {
        campaignService.deleteCampaign(user.getUsername(), campaignId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all/by-name/{name}")
    public ResponseEntity<CampaignDTO> getCampaignByName(@PathVariable String name) {
        CampaignDTO campaign = campaignService.findByName(name);
        return ResponseEntity.ok(campaign);
    }

    @GetMapping("/all")
    public List<CampaignDTO> getAllCampaigns() {
        return campaignService.findAll();
    }

    @GetMapping("all/by-city/{city}")
    public ResponseEntity<List<CampaignDTO>> getCampaignsByCity(@PathVariable String city) {
        List<CampaignDTO> campaigns = campaignService.findByCity(city);
        return ResponseEntity.ok(campaigns);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteCampaignById(@PathVariable Long id) {
        campaignService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search-by-location")
    public ResponseEntity<List<CampaignDTO>> searchCampaignsByLocation(
            @RequestParam String searchCityName,
            @RequestParam double searchRadius) {
        List<CampaignDTO> campaigns = campaignService.findActiveCampaignsNearSearchLocation(searchCityName, searchRadius);
        return ResponseEntity.ok(campaigns);
    }

    @GetMapping("/search-by-location-and-keywords")
    public ResponseEntity<List<CampaignDTO>> searchCampaignsByLocationAndKeywords(
            @RequestParam String searchCityName,
            @RequestParam double searchRadius,
            @RequestParam List<String> keywords) {
        List<CampaignDTO> campaigns = campaignService.findActiveCampaignsNearSearchLocationByKeywords(searchCityName, searchRadius, keywords);
        return ResponseEntity.ok(campaigns);
    }


}
