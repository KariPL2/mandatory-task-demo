package com.example.demo.entities;


import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"city", "seller", "keywords"})
@ToString(exclude = {"city", "seller", "keywords"})
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,unique = true)
    private String name;

    @ManyToMany(cascade = {CascadeType.MERGE })
    @JoinTable(
            name = "campaign_keyword",
            joinColumns = @JoinColumn(name = "campaign_id"),
            inverseJoinColumns = @JoinColumn(name = "keyword_id")
    )
    @Builder.Default
    private Set<Keyword> keywords = new HashSet<>();

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private double fund;

    @Column(nullable = false)
    private boolean status;

    @ManyToOne
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(nullable = false)
    private double radius;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    public void addKeyword(Keyword keyword) {
        this.keywords.add(keyword);
    }
    public void removeKeyword(Keyword keyword) {
        this.keywords.remove(keyword);

    }

}
