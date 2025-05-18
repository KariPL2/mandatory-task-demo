package com.example.demo.security;

import com.example.demo.entities.Seller;
import com.example.demo.repositories.SellerRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final SellerRepository sellerRepository;

    public CustomUserDetailsService(SellerRepository sellerRepository) {
        this.sellerRepository = sellerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Seller seller = sellerRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new CustomUserDetails(seller);
    }

}
