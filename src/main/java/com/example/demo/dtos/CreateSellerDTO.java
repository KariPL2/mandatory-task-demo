package com.example.demo.dtos;

import jakarta.validation.constraints.*;

public record CreateSellerDTO(
        @NotBlank String username,
        @Email @NotBlank String email,
        @NotBlank String password,
        @NotNull double balance
        ) {
}
