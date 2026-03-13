package com.ritma.runners.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RequestAccountRequest(
        @NotBlank @Email String email
) {
}
