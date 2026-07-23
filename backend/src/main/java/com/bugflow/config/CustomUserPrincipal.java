package com.bugflow.config;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CustomUserPrincipal {
    private final Long id;
    private final String email;
    private final String role;
}
