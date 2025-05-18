package com.example.demo.config;


import com.example.demo.entities.Seller;
import com.example.demo.repositories.SellerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer implements CommandLineRunner {

    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializer(SellerRepository sellerRepository, PasswordEncoder passwordEncoder) {
        this.sellerRepository = sellerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (sellerRepository.findByUsername("admin").isEmpty()) {
            Seller admin = new Seller();
            admin.setUsername("admin");
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode("admin"));
            admin.setBalance(0.0);
            admin.setRole("ROLE_ADMIN");
            sellerRepository.save(admin);
        }
    }
}
