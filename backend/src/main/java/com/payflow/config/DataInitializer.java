package com.payflow.config;

import com.payflow.entity.Customer;
import com.payflow.entity.User;
import com.payflow.enums.CustomerStatus;
import com.payflow.enums.UserRole;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;


@Component
@Profile("dev")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CustomerRepository customerRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Checking PayFlow initial security and demo accounts...");

        // Ensure Admin user
        userRepository.findByUsername("admin").ifPresentOrElse(
        admin -> log.info("Default ADMIN user already exists."),
        () -> {
            User admin = new User(
                    "admin",
                    "admin@payflow.internal",
                    passwordEncoder.encode("admin123"),
                    UserRole.ADMIN
            );
            userRepository.save(admin);
            log.info("Initialized default ADMIN demo user.");
        }
);

        // Ensure Demo Customer user
       userRepository.findByUsername("sarah").ifPresentOrElse(
        user -> log.info("Default CUSTOMER user already exists."),
        () -> {
            User customerUser = new User(
                    "sarah",
                    "sarah.jenkins@acme.com",
                    passwordEncoder.encode("customer123"),
                    UserRole.CUSTOMER
            );
            userRepository.save(customerUser);
            log.info("Initialized default CUSTOMER demo user.");
        }
);

        // Ensure initial customers exist
        if (customerRepository.count() == 0) {
            customerRepository.save(new Customer("Sarah Jenkins", "sarah.jenkins@acme.com", "+1-555-0199", CustomerStatus.ACTIVE));
            customerRepository.save(new Customer("Alex Mercer", "alex.mercer@fintechlab.io", "+1-555-0248", CustomerStatus.ACTIVE));
            customerRepository.save(new Customer("Elena Rostova", "elena.rostova@cloudscale.net", "+44-20-7946-0912", CustomerStatus.ACTIVE));
            customerRepository.save(new Customer("David Chen", "david.chen@nexuspay.org", "+65-6789-1234", CustomerStatus.INACTIVE));
            customerRepository.save(new Customer("Marcus Vance", "marcus.vance@vanguard.co", "+1-555-0872", CustomerStatus.ACTIVE));
            log.info("Initialized 5 default customer accounts for transaction testing.");
        }

        log.info("PayFlow system data verification completed successfully.");
    }
}
