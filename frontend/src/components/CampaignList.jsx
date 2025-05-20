import React, { useState, useCallback } from 'react';
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

    const handleRemoveKeyword = useCallback((keywordToRemove) => {
        console.log("CampaignList: Remove button clicked for:", keywordToRemove);
    }, []);

    const handleRemoveButtonClick = useCallback((event, keywordToRemove) => {
        console.log("CampaignList: Remove button handler triggered for:", keywordToRemove);
        event.stopPropagation();
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
                            <p><strong>Sprzedawca:</strong> {campaign.sellerName}</p>
                            <p><strong>Słowa kluczowe:</strong> {campaign.keywordsNames ? campaign.keywordsNames.join(', ') : 'Brak'}</p>
                            <p><strong>Budżet:</strong> {campaign.fund !== undefined && campaign.fund !== null ? campaign.fund.toFixed(2) : 'N/A'} PLN</p>
                            <p><strong>Cena:</strong> {campaign.price !== undefined && campaign.price !== null ? campaign.price.toFixed(2) : 'N/A'} PLN</p>
                            <p><strong>Status:</strong> {campaign.status ? 'Aktywna' : 'Nieaktywna'}</p>
                            {/* USUNIĘTO ODWOLANIE DO 'radius' */}
                            <p><strong>Lokalizacja:</strong> {campaign.city}</p>


                            {isUserCampaigns && (
                                <div className="campaign-actions">
                                    <button onClick={() => handleStatusChange(campaign)}>
                                        Zmień Status na {campaign.status ? 'Nieaktywna' : 'Aktywna'}
                                    </button>
                                    <button onClick={() => handleEditClick(campaign)} style={{ backgroundColor: '#2196f3', marginLeft: '0.5rem' }}>Edytuj</button>
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