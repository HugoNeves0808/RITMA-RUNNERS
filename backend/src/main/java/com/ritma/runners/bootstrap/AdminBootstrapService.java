package com.ritma.runners.bootstrap;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.ritma.runners.auth.AppUserRepository;

@Component
public class AdminBootstrapService implements ApplicationRunner {

    private final AdminBootstrapProperties properties;
    private final ObjectProvider<AppUserRepository> appUserRepositoryProvider;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapService(AdminBootstrapProperties properties,
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
