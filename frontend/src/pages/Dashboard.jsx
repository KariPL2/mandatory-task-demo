// src/pages/Dashboard.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import CampaignList from '../components/CampaignList';
import CreateCampaignForm from '../components/CreateCampaignForm';
import SearchCampaigns from '../components/SearchCampaigns';
import './Form.css';
import './Dashboard.css';

function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    const [sellerData, setSellerData] = useState(null);
    const [userCampaigns, setUserCampaigns] = useState([]);
    const [allCampaigns, setAllCampaigns] = useState([]);
    const [displayMode, setDisplayMode] = useState('user');
    const [isLoading, setIsLoading] = useState(true); // Initial loading for all essential dashboard data
    const [error, setError] = useState(null);

    const apiBaseUrl = 'http://localhost:8080';

    // Fetch seller data (including balance)
    const fetchSellerData = async () => {
        console.log("Fetching seller data...");
        // Add a safeguard check for user here too
        if (!user || !user.username || !user.password) {
            console.error("fetchSellerData called without valid user context.");
            setSellerData(null);
            // Optionally set an error specific to auth context missing
            setError(prevErr => prevErr ? `${prevErr}, Authentication context missing for seller data fetch.` : 'Authentication context missing for seller data fetch.');
            return null;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/sellers/me`, {
                headers: {
                    'Authorization': `Basic ${btoa(user.username + ':' + user.password)}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Fetch Seller Data Error Response:", response.status, response.statusText, errorText);
                setSellerData(null);
                throw new Error(`Failed to fetch seller data: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Seller data fetched successfully:", data);
            setSellerData(data);
            return data;
        } catch (err) {
            console.error('Error fetching seller data:', err);
            setSellerData(null);
            // Append this error to the main error state via the throw above
            return null;
        } finally {
            console.log("Fetch seller data finished.");
        }
    };


    // Fetch user's campaigns (requires auth)
    const fetchUserCampaigns = async (city = null, name = null) => {
        console.log("Fetching user campaigns...");
        // Add a safeguard check for user here too
        if (!user || !user.username || !user.password) {
            console.error("fetchUserCampaigns called without valid user context.");
            setUserCampaigns([]);
            // Optionally set an error specific to auth context missing
            setError(prevErr => prevErr ? `${prevErr}, Authentication context missing for user campaigns fetch.` : 'Authentication context missing for user campaigns fetch.');
            return [];
        }

        let url = `${apiBaseUrl}/campaigns`;
        if (city) {
            url += `?city=${encodeURIComponent(city)}`;
        } else if (name) {
            url += `?name=${encodeURIComponent(name)}`;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Basic ${btoa(user.username + ':' + user.password)}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Fetch User Campaigns Error Response:", response.status, response.statusText, errorText);
                setUserCampaigns([]);
                throw new Error(`Failed to fetch user campaigns: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            console.log("Data received from /campaigns API:", data);

            const hasInvalidCampaign = data.some(campaign =>
                campaign === null ||
                typeof campaign.fund !== 'number' || campaign.fund === null ||
                typeof campaign.price !== 'number' || campaign.price === null
            );

            if (hasInvalidCampaign) {
                console.error("Warning: Data from /campaigns API contains invalid campaign objects (missing or null fund/price).", data);
            } else {
                console.log("Data from /campaigns API looks valid.");
            }

            setUserCampaigns(data);
            return data;
        } catch (err) {
            console.error('Error fetching user campaigns:', err);
            setUserCampaigns([]);
            setError(prevErr => prevErr ? `${prevErr} and Failed to fetch user campaigns: ${err.message}` : `Failed to fetch user campaigns: ${err.message}`);
            return [];
        } finally {
            console.log("Fetch user campaigns finished.");
        }
    };

    // Fetch all campaigns (for viewing others) - DOES NOT require auth
    const fetchAllCampaigns = async () => {
        setIsLoading(true); // Use main loading state for this button action
        setError(null);
        console.log("Fetching all campaigns...");
        try {
            const response = await fetch(`${apiBaseUrl}/campaigns/all`); // <-- Removed headers
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Fetch All Campaigns Error Response:", response.status, response.statusText, errorText);
                throw new Error(`Failed to fetch all campaigns: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("All campaigns data fetched successfully:", data);
            setAllCampaigns(data);
            setDisplayMode('all');
            setError(null);
        } catch (err) {
            console.error('Error fetching all campaigns:', err);
            setError(`Failed to fetch all campaigns: ${err.message}`);
            setAllCampaigns([]);
        } finally {
            setIsLoading(false);
            console.log("Fetch all campaigns finished.");
        }
    };


    // Initial data fetch on component mount or when user context changes
    useEffect(() => {
        let isMounted = true;

        console.log("Dashboard useEffect triggered. Current user:", user);

        // *** Move the user check here, at the top level of useEffect ***
        if (!user || !user.username || !user.password) {
            console.log("User context not fully available yet, skipping initial load.");
            // Set loading to false if no user is present
            if(isMounted) setIsLoading(false);
            // Optionally clear any previous data if user logs out
            if(isMounted) setSellerData(null);
            if(isMounted) setUserCampaigns([]);
            if(isMounted) setAllCampaigns([]); // Clear all campaigns too if needed
            return; // Stop the effect if user is not ready
        }

        // If user is available, proceed with loading data
        const loadInitialData = async () => {
            console.log("Starting initial data load (user is available)...");
            if(isMounted) setIsLoading(true);
            if(isMounted) setError(null); // Clear errors at the start of the load

            try {
                // Fetch both simultaneously using Promise.all to wait for both
                const [sellerDataResult, userCampaignsResult] = await Promise.all([
                    fetchSellerData(), // These functions now set their own state internally
                    fetchUserCampaigns() // These functions now set their own state internally
                ]);

                // After both promises settle, log the state
                if (isMounted) {
                    console.log("Initial load Promise.all settled.");
                    // Use a timeout to log state after potential re-renders
                    setTimeout(() => {
                        console.log("State after initial load (delayed) - sellerData:", sellerData); // This might still log previous state
                        console.log("State after initial load (delayed) - userCampaigns:", userCampaigns); // This might still log previous state
                        console.log("Current error state (delayed):", error);
                    }, 0);


                    // Check if critical data failed to load (seller data OR user campaigns)
                    if (!sellerDataResult && userCampaignsResult.length === 0) {
                        console.log("Initial load: Both seller data and user campaigns failed to load.");
                        // The individual fetch functions already append to the main error state.
                    } else if (error) {
                        console.log("Initial load: Some data loaded, but errors occurred:", error);
                    } else {
                        console.log("Initial load: Essential data loaded successfully.");
                    }
                }


            } catch (err) {
                // This catch block will now receive errors thrown by fetchSellerData or fetchUserCampaigns
                console.error("Promise.all caught an error during initial load:", err);
                if(isMounted) setError(prevErr => prevErr ? `${prevErr} and Promise.all error: ${err.message}` : `Promise.all error: ${err.message}`);
            } finally {
                if(isMounted) setIsLoading(false); // Set loading to false after Promise.all settles
                console.log("Initial load: Loading state set to false.");
            }
        };

        loadInitialData();

        return () => {
            isMounted = false;
            console.log("Dashboard useEffect cleanup: Component unmounting or dependencies changed.");
        };

    }, [user]); // Depends on user context


    const handleCampaignCreated = (newCampaign) => {
        console.log("Campaign created, refetching data...");
        fetchUserCampaigns();
        fetchSellerData(); // Refetch balance as fund is deducted
        setDisplayMode('user'); // Go back to user campaigns view
    };

    const handleCampaignUpdated = () => {
        console.log("Campaign updated, refetching data...");
        fetchUserCampaigns();
        fetchSellerData(); // Refetch balance if fund/bid can be updated
    };

    const handleCampaignDeleted = () => {
        console.log("Campaign deleted, refetching data...");
        fetchUserCampaigns();
        fetchSellerData(); // Refetch balance if fund is returned
    };

    const handleSearchCampaigns = (campaigns) => {
        console.log("Search performed, setting results.");
        setAllCampaigns(campaigns);
        setDisplayMode('search-results');
    };


    // Render logic
    // Show full loading screen only on initial load with no data AND displayMode is 'user'
    if (isLoading && !sellerData && userCampaigns.length === 0 && displayMode === 'user') {
        console.log("Rendering: Initial loading screen.");
        return <div>Loading...</div>;
    }

    // Show a critical error screen if essential data failed to load and we are on the user view
    if (error && !sellerData && userCampaigns.length === 0 && displayMode === 'user' && !isLoading) {
        console.log("Rendering: Critical error screen.");
        return <div style={{ color: 'red' }}>Critical Error: Could not load dashboard data. {error}</div>;
    }

    console.log("Rendering: Dashboard content. isLoading:", isLoading, "sellerData:", sellerData, "userCampaigns count:", userCampaigns.length, "displayMode:", displayMode, "error:", error);

    return (
        <div className="dashboard-container">
            <h1>Panel Użytkownika</h1>

            {/* Balance Info - show if sellerData is available */}
            {sellerData ? (
                <div className="balance-info">
                    <h2>Saldo: {sellerData.balance !== undefined && sellerData.balance !== null ? sellerData.balance.toFixed(2) : 'N/A'} PLN</h2>
                    <p>Użytkownik: {sellerData.username}</p>
                </div>
            ) : (
                // Show message if sellerData is null AND user is logged in AND not currently in the initial loading phase
                // Also check if user exists before trying to access user.username
                user && user.username && !isLoading && <p style={{color: 'orange'}}>Could not load balance information for user: {user.username}</p>
            )}
            {/* Show a non-critical error message if some part failed but not critically */}
            {error && (sellerData || userCampaigns.length > 0 || allCampaigns.length > 0) && (
                <p style={{ color: 'orange' }}>Some data may be missing. {error}</p>
            )}


            <div className="dashboard-buttons">
                <button onClick={() => { setDisplayMode('user'); if (!isLoading) fetchUserCampaigns(); }} disabled={isLoading}>Moje Kampanie</button>
                <button onClick={() => setDisplayMode('create')} disabled={isLoading}>Utwórz Nową Kampanię</button>
                <button onClick={fetchAllCampaigns} disabled={isLoading}>Przeglądaj Wszystkie Kampanie</button>
                <button onClick={() => setDisplayMode('search')} disabled={isLoading}>Szukaj Kampanii</button>
                <button onClick={logout} style={{ backgroundColor: '#f44336' }} disabled={isLoading}>Wyloguj</button>
            </div>

            {/* Conditional Rendering based on displayMode */}
            {displayMode === 'user' && (
                <>
                    <h2>Moje Kampanie</h2>
                    {isLoading ? (
                        <p>Ładowanie kampanii użytkownika...</p>
                    ) : userCampaigns.length > 0 ? (
                        <CampaignList
                            campaigns={userCampaigns}
                            isUserCampaigns={true}
                            onCampaignUpdated={handleCampaignUpdated}
                            onCampaignDeleted={handleCampaignDeleted}
                            userToken={user.token}
                            userPassword={user.password}
                            userName={user.username}
                        />
                    ) : (
                        <p>Nie masz żadnych kampanii.</p>
                    )}
                </>
            )}

            {displayMode === 'create' && (
                // CreateCampaignForm manages its own loading state, pass down user auth details
                <CreateCampaignForm
                    onCampaignCreated={handleCampaignCreated}
                    onCancel={() => setDisplayMode('user')}
                    userToken={user.token}
                    userPassword={user.password}
                    userName={user.username}
                />
            )}

            {displayMode === 'all' && (
                <>
                    <h2>Wszystkie Kampanie</h2>
                    {isLoading ? (
                        <p>Ładowanie wszystkich kampanii...</p>
                    ) : allCampaigns.length > 0 ? (
                        <CampaignList campaigns={allCampaigns} isUserCampaigns={false} />
                    ) : (
                        <p>Brak kampanii do wyświetlenia.</p>
                    )}
                </>
            )}

            {displayMode === 'search' && (
                // SearchCampaigns manages its own loading state
                <SearchCampaigns onSearch={handleSearchCampaigns} />
            )}

            {displayMode === 'search-results' && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>Wyniki wyszukiwania:</h2>
                    {isLoading ? (
                        <p>Ładowanie wyników wyszukiwania...</p>
                    ) : allCampaigns.length > 0 ? (
                        <CampaignList campaigns={allCampaigns} isUserCampaigns={false} />
                    ) : (
                        <p>Brak wyników wyszukiwania dla podanych kryteriów.</p>
                    )}
                </div>
            )}

        </div>
    );
}

export default Dashboard;
