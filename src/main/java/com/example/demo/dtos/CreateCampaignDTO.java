package com.example.demo.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateCampaignDTO(
        @NotBlank String name,
        @NotEmpty List<String> keywordsNames,
        @NotNull Double price,
        @NotNull Double fund,
        Boolean status,
        @NotBlank String city,
        @NotNull Double radius
) {
}
