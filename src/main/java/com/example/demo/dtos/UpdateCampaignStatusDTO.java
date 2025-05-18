package com.example.demo.dtos;

import jakarta.validation.constraints.NotNull;

public record UpdateCampaignStatusDTO(
        @NotNull Boolean status
) {}