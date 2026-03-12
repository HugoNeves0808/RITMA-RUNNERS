package com.ritma.runners.auth.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.ritma.runners.auth.config.AuthSeedProperties;
import com.ritma.runners.auth.repository.AppUserRepository;

@Component
public class AuthSeedService implements ApplicationRunner {

    private final AuthSeedProperties properties;
    private final ObjectProvider<AppUserRepository> appUserRepositoryProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthSeedService(AuthSeedProperties properties,
                           ObjectProvider<AppUserRepository> appUserRepositoryProvider,
                           PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.appUserRepositoryProvider = appUserRepositoryProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        AppUserRepository repository = appUserRepositoryProvider.getIfAvailable();
        if (!properties.enabled() || repository == null) {
            return;
        }

        if (repository.existsByEmail(properties.email())) {
            return;
        }

        repository.createAdminUser(
                properties.email(),
                passwordEncoder.encode(properties.password())
        );
    }
}
