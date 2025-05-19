package com.example.demo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.session.config.annotation.web.http.EnableSpringHttpSession;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableSpringHttpSession
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // *** UMIEŚĆ WSZYSTKIE REGULY permitAll() NA POCZĄTKU ***

                        // Permit OPTIONS requests (often needed for CORS preflight)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Permit access to Swagger UI and API docs
                        .requestMatchers("/swagger-ui/**", "/v3/**").permitAll()

                        // Permit access to home and registration endpoints
                        .requestMatchers("/home","/home/**").permitAll()

                        // Permit access to cities endpoint
                        .requestMatchers("/cities","/cities/**").permitAll()

                        // Permit access to keyword suggestions endpoint
                        .requestMatchers("/keywords/suggest").permitAll()

                        // Permit access to public campaign endpoints
                        .requestMatchers("/campaigns/all").permitAll()
                        .requestMatchers("/campaigns/all/by-name/**").permitAll()
                        .requestMatchers("/campaigns/all/by-city/**").permitAll()
                        .requestMatchers("/campaigns/search-by-location").permitAll()
                        .requestMatchers("/campaigns/search-by-location-and-keywords").permitAll()

                        // Permit access to the root path and paths handled by the SPA controller
                        // TE REGULY SĄ TERAZ WYŻEJ, ALE ZOSTAWIMY JE TUTAJ TEŻ DLA JASNOŚCI,
                        // CHOĆ KOLEJNOŚĆ W TYM BLOKU JEST KLUCZOWA
                        .requestMatchers("/").permitAll() // Allow access to the root path
                        .requestMatchers("/{path:[^\\.]*}/**").permitAll() // Allow access to paths without a dot (SPA routes)

                        // *** KONIEC REGUL permitAll() ***


                        // Require authentication for user-specific endpoints
                        .requestMatchers("/sellers/me", "/sellers/me/**").authenticated()
                        .requestMatchers("/campaigns","/campaigns/**").authenticated() // User's own campaigns (GET, POST, PATCH, DELETE)

                        // Require ADMIN role for admin endpoints
                        .requestMatchers("/sellers/**").hasRole("ADMIN")
                        .requestMatchers("/campaigns/admin/**").hasRole("ADMIN")

                        // Any other request must be authenticated (this comes last)
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
