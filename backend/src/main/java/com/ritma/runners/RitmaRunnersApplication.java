package com.ritma.runners;

import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RitmaRunnersApplication {

    public static void main(String[] args) {
        SpringApplication.run(RitmaRunnersApplication.class, args);
    }
}
