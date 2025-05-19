// src/components/CampaignList.jsx
import React, { useState, useCallback } from 'react'; // Import useCallback
import EditCampaignForm from './EditCampaignForm';
import './CampaignList.css';

function CampaignList({ campaigns, isUserCampaigns, onCampaignUpdated, onCampaignDeleted, userToken, userPassword, userName }) {
    const [editingCampaignId, setEditingCampaignId] = useState(null);
    const apiBaseUrl = 'http://localhost:8080';

    const handleStatusChange = async (campaign) => {
        const newStatus = !campaign.status; // Toggle status
        try {
            const response = await fetch(`${apiBaseUrl}/campaigns/${campaign.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${btoa(userName + ':' + userPassword)}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update campaign status');
            }

            if (onCampaignUpdated) {
                onCampaignUpdated();
            }

        } catch (error) {
            console.error('Error updating campaign status:', error);
            alert('Błąd przy zmianie statusu kampanii: ' + error.message);
        }
    };

    const handleDelete = async (campaignId) => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            try {
                const response = await fetch(`${apiBaseUrl}/campaigns/${campaignId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Basic ${btoa(userName + ':' + userPassword)}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete campaign');
                }

                if (onCampaignDeleted) {
                    onCampaignDeleted();
                }

            } catch (error) {
                console.error('Error deleting campaign:', error);
                alert('Błąd przy usuwaniu kampanii.');
            }
        }
    };

    const handleEditClick = (campaign) => {
        setEditingCampaignId(campaign.id);
    };

    const handleCancelEdit = () => {
        setEditingCampaignId(null);
    };

    const handleCampaignEdited = () => {
        setEditingCampaignId(null);
        if (onCampaignUpdated) {
            onCampaignUpdated();
        }
    };

    // This useCallback definition was causing the error because useCallback wasn't imported
    // It seems this specific handler is not actually used in CampaignList's JSX currently,
    // as the remove button is rendered within the form components.
    // Keeping the definition here in case it's needed elsewhere or in future updates.
    const handleRemoveKeyword = useCallback((keywordToRemove) => {
        console.log("CampaignList: Remove button clicked for:", keywordToRemove);
        // The actual state update happens in the parent (form component)
    }, []);


    // This useCallback definition was also causing the error
    // Similarly, this handler is likely not used in CampaignList's JSX
    const handleRemoveButtonClick = useCallback((event, keywordToRemove) => {
        console.log("CampaignList: Remove button handler triggered for:", keywordToRemove);
        event.stopPropagation();
        // This would call a prop like onRemoveKeyword(keywordToRemove)
        // passed down from the form component if the button was rendered here.
        // Since the button is in the form, this handler is not used in CampaignList currently.
    }, []);


    if (!campaigns || campaigns.length === 0) {
        return <p>{isUserCampaigns ? 'Nie masz żadnych kampanii.' : 'Brak kampanii do wyświetlenia.'}</p>;
    }

    return (
        <div className="campaign-list">
            {campaigns.map(campaign => (
                <div key={campaign.id} className="campaign-item">
                    {editingCampaignId === campaign.id ? (
                        <EditCampaignForm
                            campaign={campaign}
                            onCampaignEdited={handleCampaignEdited}
                            onCancel={handleCancelEdit}
                            userToken={userToken}
                            userPassword={userPassword}
                            userName={userName}
                        />
                    ) : (
                        <>
                            <h3>{campaign.name}</h3>
                            {/* Use 'sellerName' from backend response */}
                            <p><strong>Sprzedawca:</strong> {campaign.sellerName}</p>
                            {/* Use 'keywordsNames' from backend response */}
                            <p><strong>Słowa kluczowe:</strong> {campaign.keywordsNames ? campaign.keywordsNames.join(', ') : 'Brak'}</p>
                            {/* Use 'fund' from backend response and add safety check */}
                            <p><strong>Budżet:</strong> {campaign.fund !== undefined && campaign.fund !== null ? campaign.fund.toFixed(2) : 'N/A'} PLN</p>
                            {/* Use 'price' from backend response and add safety check */}
                            <p><strong>Stawka:</strong> {campaign.price !== undefined && campaign.price !== null ? campaign.price.toFixed(2) : 'N/A'} PLN</p>
                            <p><strong>Status:</strong> {campaign.status ? 'Aktywna' : 'Nieaktywna'}</p>
                            {/* Use 'city' and 'radius' from backend response and add safety check for radius*/}
                            <p><strong>Lokalizacja:</strong> {campaign.city}, Promień: {campaign.radius !== undefined && campaign.radius !== null ? campaign.radius : 'N/A'} km</p>


                            {isUserCampaigns && (
                                <div className="campaign-actions">
                                    <button onClick={() => handleStatusChange(campaign)}>
                                        Zmień Status na {campaign.status ? 'Nieaktywna' : 'Aktywna'}
                                    </button>
                                    <button onClick={() => handleEditClick(campaign)} style={{ backgroundColor: '#2196f3', marginLeft: '0.5rem' }}>Edytuj</button>
                                    {/* The delete button calls handleDelete directly */}
                                    <button onClick={() => handleDelete(campaign.id)} style={{ backgroundColor: '#f44336', marginLeft: '0.5rem' }}>Usuń</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}

export default CampaignList;
