// src/components/EditCampaignForm.jsx
import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Typeahead from './Typeahead';
import { AuthContext } from '../context/AuthContext';
import '../pages/Form.css';

function EditCampaignForm({ campaign, onCampaignEdited, onCancel }) {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: campaign.name,
        keywords: campaign.keywords || [],
        price: campaign.price,
        campaignFund: campaign.campaignFund,
        status: campaign.status,
        city: campaign.city,
        // USUNIĘTO:
        // radius: campaign.radius,
    });
    const [cities, setCities] = useState([]);
    const [keywordSuggestions, setKeywordSuggestions] = useState([]);
    const [loadingCities, setLoadingCities] = useState(true);
    const [loadingKeywords, setLoadingKeywords] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const isHandlingSelection = useRef(false);
    const isRemoving = useRef(false);


    const apiBaseUrl = 'http://localhost:8080';

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/cities`);
                if (!response.ok) {
                    throw new Error('Failed to fetch cities');
                }
                const data = await response.json();
                setCities(data);
            } catch (err) {
                console.error('Error fetching cities:', err);
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, []);

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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleKeywordSelect = (keyword) => {
        console.log("Form: Selected keyword received:", keyword);
        console.log("Form: Current keywords before update:", formData.keywords);

        if (!formData.keywords.includes(keyword)) {
            isHandlingSelection.current = true;

            const updatedKeywords = [...formData.keywords, keyword];
            console.log("Form: New keywords array to set:", updatedKeywords);

            setFormData(prev => ({
                ...prev,
                keywords: updatedKeywords
            }));

            setTimeout(() => {
                isHandlingSelection.current = false;
            }, 300);

        } else {
            console.log("Form: Keyword already exists:", keyword);
        }
        setKeywordSuggestions([]);
    };

    const handleRemoveKeyword = useCallback((keywordToRemove) => {
        if (isRemoving.current) {
            console.log("Form: Ignoring remove call, removal already in progress.");
            return;
        }

        if (isHandlingSelection.current) {
            console.log("Form: Ignoring remove call during selection handling.");
            return;
        }

        console.log("Form: Removing keyword:", keywordToRemove);

        isRemoving.current = true;

        setFormData(prev => {
            const updatedKeywords = prev.keywords.filter(keyword => keyword !== keywordToRemove);
            console.log("Form: Keywords after removal:", updatedKeywords);

            setTimeout(() => {
                isRemoving.current = false;
                console.log("Form: Removal process flagged as complete.");
            }, 50);

            return {
                ...prev,
                keywords: updatedKeywords
            };
        });

    }, []);


    const handleRemoveButtonClick = useCallback((event, keywordToRemove) => {
        event.stopPropagation();
        handleRemoveKeyword(keywordToRemove);
    }, [handleRemoveKeyword]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (formData.keywords.length === 0) {
            setError("Proszę wybrać co najmniej jedno słowo kluczowe.");
            setIsLoading(false);
            return;
        }
        const price = parseFloat(formData.price);
        const campaignFund = parseFloat(formData.campaignFund);
        if (isNaN(price) || price <= 0) {
            setError("Cena musi być dodatnią liczbą.");
            setIsLoading(false);
            return;
        }
        if (isNaN(campaignFund) || campaignFund <= 0) {
            setError("Budżet kampanii musi być dodatnią liczbą.");
            setIsLoading(false);
            return;
        }


        try {
            const response = await fetch(`${apiBaseUrl}/campaigns/${campaign.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(user.username + ':' + user.password)}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    keywordsNames: formData.keywords,
                    price: price,
                    fund: campaignFund,
                    status: formData.status,
                    city: formData.city,
                    // USUNIĘTO:
                    // radius: parseInt(formData.radius, 10),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Edit Campaign API Error:", response.status, errorData);
                throw new Error(errorData.message || 'Failed to update campaign');
            }

            const updatedCampaign = await response.json();
            alert('Kampania zaktualizowana pomyślnie!');
            if (onCampaignEdited) {
                onCampaignEdited(updatedCampaign);
            }

        } catch (err) {
            setError(err.message);
            console.error('Error updating campaign:', err);
            alert('Błąd podczas aktualizacji kampanii: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h3>Edytuj Kampanię: {campaign.name}</h3>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <label>
                Nazwa Kampanii:
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                />
            </label>
            <label>
                Słowa Kluczowe:
                <div className="selected-keywords">
                    {formData.keywords.map(keyword => (
                        <span key={keyword} className="keyword-tag">
                            {keyword}
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
                    onSelect={handleKeywordSelect}
                    placeholder="Dodaj słowa kluczowe"
                />
                {loadingKeywords && <p>Ładowanie sugestii...</p>}
            </label>
            <label>
                Cena :
                <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                />
            </label>
            <label>
                Budżet Kampanii:
                <input
                    type="number"
                    name="campaignFund"
                    step="0.01"
                    value={formData.campaignFund}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                />
            </label>
            <label>
                Status:
                <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                /> Aktywna
            </label>
            <label>
                Miasto:
                {loadingCities ? (
                    <p>Ładowanie miast...</p>
                ) : (
                    <select name="city" value={formData.city} onChange={handleInputChange} required>
                        <option value="">-- Wybierz Miasto --</option>
                        {cities.map(city => (
                            <option key={city.id} value={city.name}>{city.name}</option>
                        ))}
                    </select>
                )}
            </label>
            {/* USUNIĘTO CAŁY BLOK LABEL DLA PROMIENIA:
            <label>
                Promień (km):
                <input
                    type="number"
                    name="radius"
                    value={formData.radius}
                    onChange={handleInputChange}
                    required
                    min="0"
                />
            </label>
            */}

            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Zapisywanie...' : 'Zapisz Zmiany'}
            </button>
            <button type="button" onClick={onCancel} style={{ backgroundColor: '#6c757d', marginTop: '0.5rem' }} disabled={isLoading}>Anuluj</button>
        </form>
    );
}

export default EditCampaignForm;