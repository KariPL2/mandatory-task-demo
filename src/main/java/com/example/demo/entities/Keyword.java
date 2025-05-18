package com.example.demo.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@EqualsAndHashCode(exclude = "campaigns")
@ToString(exclude = "campaigns")
public class Keyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @ManyToMany(mappedBy = "keywords")
    private Set<Campaign> campaigns = new HashSet<>();

    public Keyword(String name) {
        this.name = name;
    }

    public void addCampaign(Campaign campaign) {
        this.campaigns.add(campaign);
        campaign.getKeywords().add(this);
    }

    public void removeCampaign(Campaign campaign) {
        this.campaigns.remove(campaign);
        campaign.getKeywords().remove(this);
    }


}