// src/components/SearchCampaigns.jsx
import React, { useState, useCallback, useRef } from 'react'; // Import useRef
import CampaignList from './CampaignList';
import Typeahead from './Typeahead';
import '../pages/Form.css';

function SearchCampaigns({ onSearch }) {
    const [searchCriteria, setSearchCriteria] = useState({
        type: 'all', // 'all', 'name', 'city', 'location', 'location_keywords'
        value: '', // for name or city search
        searchCityName: '', // for location search
        searchRadius: 1, // for location search - UWAGA: TO POLE ZOSTAJE!
        keywords: [], // for location_keywords search
    });
    const [keywordSuggestions, setKeywordSuggestions] = useState([]);
    const [loadingKeywords, setLoadingKeywords] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const isHandlingSelection = useRef(false);

    const apiBaseUrl = 'http://localhost:8080';

    const handleTypeChange = (e) => {
        setSearchCriteria({
            type: e.target.value,
            value: '',
            searchCityName: '',
            searchRadius: 1, // Reset to default min
            keywords: [], // Clear keywords on type change
        });
        setSearchResults([]); // Clear results on type change
        setError(null); // Clear error on type change
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchCriteria(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const fetchKeywordSuggestions = async (query) => {
        if (query.length < 2) {
            setKeywordSuggestions([]);
            return;
        }
        setLoadingKeywords(true);
        try {
            const response = await fetch(`${apiBaseUrl}/keywords/suggest?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch keyword suggestions');
            }
            const data = await response.json();
            setKeywordSuggestions(data);
        } catch (err) {
            console.error('Error fetching keyword suggestions:', err);
            setKeywordSuggestions([]);
        } finally {
            setLoadingKeywords(false);
        }
    };

    // Handler for selecting a keyword from Typeahead suggestions
    const handleKeywordSelect = (keyword) => {
        console.log("SearchCampaigns: Selected keyword received:", keyword);
        console.log("SearchCampaigns: Current keywords before update:", searchCriteria.keywords);

        if (!searchCriteria.keywords.includes(keyword)) {
            isHandlingSelection.current = true; // Set flag when starting selection handling

            setSearchCriteria(prev => {
                const updatedKeywords = [...prev.keywords, keyword];
                console.log("SearchCampaigns: New keywords array to set:", updatedKeywords);
                return {
                    ...prev,
                    keywords: updatedKeywords
                };
            });


            // Reset flag after a short delay
            setTimeout(() => {
                isHandlingSelection.current = false;
            }, 300); // Adjust delay if needed

        } else {
            console.log("SearchCampaigns: Keyword already exists:", keyword);
        }
        setKeywordSuggestions([]); // Clear suggestions after selection
    };


    // Handler for removing a keyword from the selected list
    const handleRemoveKeyword = (keywordToRemove) => {
        // Ignore remove calls if a selection is currently being handled
        if (isHandlingSelection.current) {
            console.log("SearchCampaigns: Ignoring remove call during selection handling.");
            return;
        }

        console.log("SearchCampaigns: Removing keyword:", keywordToRemove);
        setSearchCriteria(prev => {
            const updatedKeywords = prev.keywords.filter(keyword => keyword !== keywordToRemove);
            console.log("SearchCampaigns: Keywords after removal:", updatedKeywords);
            return {
                ...prev,
                keywords: updatedKeywords
            };
        });
    };

    // Use useCallback for the remove button click handler
    const handleRemoveButtonClick = useCallback((event, keywordToRemove) => {
        console.log("SearchCampaigns: Remove button handler triggered for:", keywordToRemove);
        event.stopPropagation(); // Stop propagation
        handleRemoveKeyword(keywordToRemove); // Call the remove handler
    }, [handleRemoveKeyword]); // Dependency: handleRemoveKeyword


    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSearchResults([]); // Clear previous results

        let url = `${apiBaseUrl}/campaigns/all`; // Default for 'all'

        try {
            let response;
            switch (searchCriteria.type) {
                case 'all':
                    url = `${apiBaseUrl}/campaigns/all`;
                    response = await fetch(url);
                    break;
                case 'name':
                    if (!searchCriteria.value.trim()) {
                        alert('Please enter a campaign name.');
                        setIsLoading(false);
                        return;
                    }
                    url = `${apiBaseUrl}/campaigns/all/by-name/${encodeURIComponent(searchCriteria.value.trim())}`;
                    response = await fetch(url);
                    if (!response.ok) {
                        if (response.status === 404) {
                            setSearchResults([]);
                            setIsLoading(false);
                            return;
                        }
                        const errorText = await response.text();
                        console.error("Search by Name API Error Response:", response.status, response.statusText, errorText);
                        throw new Error(`Failed to search by name: ${response.status} ${response.statusText}`);
                    }
                    const nameData = await response.json();
                    setSearchResults([nameData]);
                    setIsLoading(false);
                    if (onSearch) onSearch([nameData]);
                    return;
                case 'city':
                    if (!searchCriteria.value.trim()) {
                        alert('Please enter a city name.');
                        setIsLoading(false);
                        return;
                    }
                    url = `${apiBaseUrl}/campaigns/all/by-city/${encodeURIComponent(searchCriteria.value.trim())}`;
                    response = await fetch(url);
                    break;
                case 'location':
                    if (!searchCriteria.searchCityName.trim() || searchCriteria.searchRadius <= 0) {
                        alert('Please enter both city name and a valid radius.');
                        setIsLoading(false);
                        return;
                    }
                    url = `${apiBaseUrl}/campaigns/search-by-location?searchCityName=${encodeURIComponent(searchCriteria.searchCityName.trim())}&searchRadius=${searchCriteria.searchRadius}`;
                    response = await fetch(url);
                    break;
                case 'location_keywords':
                    if (!searchCriteria.searchCityName.trim() || searchCriteria.searchRadius <= 0 || searchCriteria.keywords.length === 0) {
                        alert('Please enter city name, a valid radius, and at least one keyword.');
                        setIsLoading(false);
                        return;
                    }
                    url = `${apiBaseUrl}/campaigns/search-by-location-and-keywords?searchCityName=${encodeURIComponent(searchCriteria.searchCityName.trim())}&searchRadius=${searchCriteria.searchRadius}&${searchCriteria.keywords.map(k => `keywords=${encodeURIComponent(k)}`).join('&')}`;
                    response = await fetch(url);
                    break;
                default:
                    setIsLoading(false);
                    return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Search API Error Response:', response.status, response.statusText, errorText);
                if (response.status === 404) {
                    setSearchResults([]);
                } else {
                    throw new Error(`Failed to fetch search results: ${response.statusText}`);
                }
            } else {
                const data = await response.json();
                setSearchResults(data);
                if (onSearch) onSearch(data);
            }

        } catch (err) {
            setError(err.message);
            console.error('Search error:', err);
            setSearchResults([]);
            if (onSearch) onSearch([]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="form-container">
            <h2>Szukaj Kampanii</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <label>
                Typ wyszukiwania:
                <select name="type" value={searchCriteria.type} onChange={handleTypeChange}>
                    <option value="all">Wszystkie Kampanie</option>
                    <option value="name">Wg Nazwy Kampanii (dokładna)</option>
                    <option value="city">Wg Miasta</option>
                    <option value="location">Wg Lokalizacji (Miasto + Promień)</option>
                    <option value="location_keywords">Wg Lokalizacji i Słów Kluczowych</option>
                </select>
            </label>

            {searchCriteria.type === 'name' && (
                <label>
                    Nazwa Kampanii:
                    <input
                        type="text"
                        name="value"
                        value={searchCriteria.value}
                        onChange={handleInputChange}
                        required={searchCriteria.type === 'name'}
                    />
                </label>
            )}

            {searchCriteria.type === 'city' && (
                <label>
                    Miasto:
                    <input
                        type="text"
                        name="value"
                        value={searchCriteria.value}
                        onChange={handleInputChange}
                        required={searchCriteria.type === 'city'}
                    />
                </label>
            )}

            {(searchCriteria.type === 'location' || searchCriteria.type === 'location_keywords') && (
                <>
                    <label>
                        Miasto:
                        <input
                            type="text"
                            name="searchCityName"
                            value={searchCriteria.searchCityName}
                            onChange={handleInputChange}
                            required
                        />
                    </label>
                    <label>
                        Promień (km):
                        <input
                            type="number"
                            name="searchRadius"
                            value={searchCriteria.searchRadius}
                            onChange={handleInputChange}
                            required
                            min="1"
                        />
                    </label>
                </>
            )}

            {searchCriteria.type === 'location_keywords' && (
                <label>
                    Słowa Kluczowe:
                    <div className="selected-keywords">
                        {searchCriteria.keywords.map(keyword => (
                            <span key={keyword} className="keyword-tag">
                                {keyword}
                                {/* Use the memoized click handler */}
                                <button
                                    type="button"
                                    onClick={(event) => handleRemoveButtonClick(event, keyword)}
                                >
                                    x
                                </button>
                            </span>
                        ))}
                    </div>
                    <Typeahead
                        onInputChange={fetchKeywordSuggestions}
                        suggestions={keywordSuggestions}
                        // Pass the new handleKeywordSelect function to onSelect
                        onSelect={handleKeywordSelect}
                        placeholder="Dodaj słowa kluczowe"
                    />
                    {loadingKeywords && <p>Ładowanie sugestii...</p>}
                </label>
            )}

            <button type="button" onClick={handleSearch} disabled={isLoading}>
                {isLoading ? 'Szukanie...' : 'Szukaj'}
            </button>

            {/* Removed direct display here, Dashboard handles displaying search results */}
            {/*
            {searchResults.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Wyniki wyszukiwania:</h3>
                    <CampaignList campaigns={searchResults} isUserCampaigns={false} />
                </div>
            )}
             {searchResults.length === 0 && !isLoading && error && <p style={{ color: 'orange' }}>Brak wyników dla podanych kryteriów lub wystąpił błąd.</p>}
             {searchResults.length === 0 && !isLoading && !error && (searchCriteria.type !== 'all' || (searchCriteria.type === 'all' && Date.now())) && <p>Wprowadź kryteria wyszukiwania i kliknij Szukaj.</p>}
             */}

        </div>
    );
}

export default SearchCampaigns;