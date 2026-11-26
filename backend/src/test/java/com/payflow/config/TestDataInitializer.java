package com.payflow.config;



import com.payflow.entity.User;
import com.payflow.enums.UserRole;
import com.payflow.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@TestConfiguration
public class TestDataInitializer {

    @Bean
    CommandLineRunner initializeTestAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User(
                        "admin",
                        "admin@payflow.internal",
                        passwordEncoder.encode("admin123"),
                        UserRole.ADMIN
                );

                userRepository.save(admin);
            }
        };
    }
}
