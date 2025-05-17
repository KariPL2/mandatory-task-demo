package com.example.demo.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSellerDTO(
        @NotBlank String username,
        @Email @NotBlank String email,
        @NotBlank String password,
        @NotNull Double balance
) {
}
