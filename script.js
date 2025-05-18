// --- USTAWIENIA ---
const BASE_API_URL = 'http://localhost:8080'; // Zaktualizuj, jeśli Twój backend działa na innym adresie/porcie
const MIN_BID = 1.00; // Minimalna kwota licytacji za słowo kluczowe

// Zmienna do przechowywania nagłówka autoryzacyjnego po "zalogowaniu"
let basicAuthHeader = null;

// Zmienne globalne do przechowywania danych
let availableCities = [];
let createSelectedKeywords = []; // Słowa kluczowe dla formularza tworzenia
let editSelectedKeywords = [];   // Słowa kluczowe dla formularza edycji
let currentSellerBalance = 0;    // Aktualne saldo sprzedawcy

// --- POMOCNICZE FUNKCJE API ---

/**
 * Wysyła żądanie fetch do API.
 * @param {string} url Pełny adres URL endpointu.
 * @param {string} method Metoda HTTP (GET, POST, PATCH, DELETE).
 * @param {object|null} body Ciało żądania (dla POST/PATCH), obiekt JS.
 * @param {boolean} requiresAuth Czy żądanie wymaga autoryzacji (domyślnie false).
 * @returns {Promise<object|null>} Promise, który rozwiązuje się z odpowiedzią JSON lub nullem w przypadku 204 No Content.
 * @throws {Error} Rzuca błąd w przypadku problemów z siecią lub odpowiedzi HTTP status >= 400.
 */
async function fetchData(url, method = 'GET', body = null, requiresAuth = false) {
    const headers = {
        // Dodaj inne nagłówki, jeśli potrzebne
    };

    // Content-Type jest domyślnie ustawiany dla metod z ciałem, ale lepiej być jawnym
    if (body !== null) {
        headers['Content-Type'] = 'application/json';
    }


    if (requiresAuth) {
        if (!basicAuthHeader) {
            console.error('[fetchData] Autoryzacja wymagana, ale dane logowania nie są ustawione. Żądanie do:', url);
            const authError = new Error('Autoryzacja wymagana, brak danych logowania.');
            authError.status = 401;
            throw authError;
        }
        headers['Authorization'] = basicAuthHeader;
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (body !== null) {
        config.body = JSON.stringify(body);
    }

    console.log(`[fetchData] Wysyłanie żądania: ${method} ${url}`, { config });

    try {
        const response = await fetch(url, config);

        console.log(`[fetchData] Otrzymano odpowiedź dla ${method} ${url}: Status ${response.status}`);

        if (!response.ok) {
            let errorBody = null;
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    errorBody = await response.json();
                    console.error('[fetchData] Ciało błędu JSON:', errorBody);
                } else {
                    const text = await response.text();
                    console.error('[fetchData] Odpowiedź błędu (nie-JSON):', text);
                    errorBody = { message: text || response.statusText || `Error status: ${response.status}` };
                }
            } catch (e) {
                console.error('[fetchData] Nie udało się odczytać ciała błędu odpowiedzi.');
                errorBody = { message: response.statusText || `Error status: ${response.status}`, parseError: e };
            }

            const error = new Error(`Błąd HTTP: ${response.status} ${response.statusText || 'Unknown Error'}`);
            error.status = response.status;
            error.statusText = response.statusText;
            error.errorBody = errorBody;
            throw error;

        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();

    } catch (error) {
        console.error('[fetchData] Błąd sieci lub błąd przed odpowiedzią serwera:', error);
        throw error;
    }
}

// --- POMOCNICZE FUNKCJE UI ---

function displayValidationErrors(errorsElement, errorBody) {
    console.log('[UI] displayValidationErrors', {errorsElement, errorBody});
    if (!errorsElement) {
        console.error('[UI] Cannot display validation errors: errors element not found.');
        return;
    }
    errorsElement.textContent = '';
    if (errorBody && errorBody.errors && Array.isArray(errorBody.errors)) {
        errorsElement.textContent = 'Błędy walidacji:\n';
        errorBody.errors.forEach(err => {
            const errorMessage = err.message || err.defaultMessage || 'Nieznany błąd walidacji pola.';
            const fieldName = err.field || err.property || '';
            errorsElement.textContent += `- ${fieldName ? fieldName + ': ' : ''}${errorMessage}\n`;
        });
    } else if (errorBody && errorBody.message) {
        errorsElement.textContent = `Błąd: ${errorBody.message}`;
    } else {
        errorsElement.textContent = 'Wystąpił nieznany błąd walidacji.';
    }
}

function displayApiError(errorsElement, error, defaultMessage = 'Wystąpił błąd podczas komunikacji z serwerem.') {
    console.log('[UI] displayApiError', {errorsElement, error, defaultMessage});
    if (!errorsElement) {
        console.error('[UI] Cannot display API error: errors element not found.');
        return;
    }
    errorsElement.textContent = '';

    if (error.status) {
        errorsElement.textContent = `Błąd HTTP: ${error.status} ${error.statusText || 'Unknown Status'}. `;
        if (error.errorBody && error.errorBody.message) {
            errorsElement.textContent += error.errorBody.message;
        } else {
            errorsElement.textContent += defaultMessage;
        }
    } else {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
            errorsElement.textContent = `Błąd połączenia z backendem. Upewnij się, że działa na ${BASE_API_URL}. Szczegóły: ${error.message}`;
        } else if (error.message.includes('Autoryzacja wymagana')) {
            errorsElement.textContent = error.message;
        }
        else {
            errorsElement.textContent = `${defaultMessage} Szczegóły błędu: ${error.message}`;
        }
    }
}


function showSection(id) {
    console.log(`[UI] Showing main section: ${id}`);
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    const section = document.getElementById(id);
    if (section) {
        section.style.display = 'block';
    } else {
        console.error(`[UI] Main section with ID "${id}" not found.`);
    }
}

/**
 * Hides all authenticated sections within #authenticated-content and shows the one specified by ID.
 * Updates navigation button active state and triggers view-specific actions.
 * @param {string} sectionIdToShow The ID of the section element to show (e.g., 'campaigns-list-section').
 */
function showAuthSection(sectionIdToShow) {
    console.log(`[UI] Switching authenticated section to: ${sectionIdToShow}`);
    document.querySelectorAll('#authenticated-content .auth-section').forEach(section => {
        section.style.display = 'none';
    });

    const sectionToShow = document.getElementById(sectionIdToShow);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
        document.querySelectorAll('#authenticated-nav .nav-button').forEach(button => {
            if (button.dataset.section === sectionIdToShow) {
                button.classList.add('active-nav');
            } else {
                button.classList.remove('active-nav');
            }
        });

        if (sectionIdToShow === 'campaigns-list-section') {
            fetchAndDisplayCampaigns();
        } else if (sectionIdToShow === 'create-campaign-section') {
            resetFormAndMessages('create-campaign-form', 'create-campaign-feedback', 'create-campaign-errors');
            createSelectedKeywords = [];
            renderSelectedKeywords(createSelectedKeywords, 'create-selected-keywords', 'create-campaign-selected-keywords-input');
        } else if (sectionIdToShow === 'add-funds-section') {
            resetFormAndMessages('add-funds-form', 'add-funds-feedback', 'add-funds-errors');
        }
    } else {
        console.error(`[UI] Authenticated section with ID "${sectionIdToShow}" not found.`);
        showAuthSection('campaigns-list-section');
    }
}


function resetFormAndMessages(formId, feedbackId, errorsId) {
    console.log(`[UI] Resetting form #${formId} and messages for #${feedbackId}, #${errorsId}`);
    const form = document.getElementById(formId);
    if (form) form.reset();
    const feedback = document.getElementById(feedbackId);
    if (feedback) feedback.textContent = '';
    const errors = document.getElementById(errorsId);
    if (errors) errors.textContent = '';
}


// --- ŁADOWANIE DANYCH POCZĄTKOWYCH ---

async function fetchAndDisplayHomeMessage() {
    console.log('[Init] Fetching home message...');
    const messageElement = document.getElementById('home-message');
    try {
        const response = await fetch(`${BASE_API_URL}/home`);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Błąd HTTP: ${response.status} ${response.statusText}. Body: ${text}`);
        }
        const message = await response.text();
        if (messageElement) messageElement.textContent = message;
        console.log('[Init] Home message fetched successfully.');
    } catch (error) {
        console.error('[Init] Error fetching home message:', error);
        if (messageElement) {
            if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                messageElement.textContent = `Błąd połączenia z backendem. Upewnij się, że backend działa na ${BASE_API_URL}.`;
            } else {
                messageElement.textContent = 'Nie udało się załadować komunikatu powitalnego.';
            }
        }
    }
}

async function fetchAndPopulateCities() {
    console.log('[Init] Fetching and populating cities...');
    // Usunięto odwołania do citiesListElement, aby nie wyświetlać listy miast na stronie głównej
    const createCampaignTownSelect = document.getElementById('create-campaign-town');
    const editCampaignTownSelect = document.getElementById('edit-campaign-town');

    [createCampaignTownSelect, editCampaignTownSelect].forEach(select => {
        if(select) {
            select.innerHTML = '<option value="">Wczytywanie...</option>';
            select.disabled = true;
        }
    });

    try {
        const cities = await fetchData(`${BASE_API_URL}/cities`, 'GET', null, false);

        availableCities = cities || [];
        console.log('[Init] Cities fetched successfully:', availableCities);

        [createCampaignTownSelect, editCampaignTownSelect].forEach(select => {
            if(select) {
                select.innerHTML = '<option value="">Wybierz miasto</option>';
                select.disabled = false;
            }
        });

        if (availableCities.length > 0) {
            availableCities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.name;
                option.textContent = city.name;
                if(createCampaignTownSelect) createCampaignTownSelect.appendChild(option.cloneNode(true));
                if(editCampaignTownSelect) editCampaignTownSelect.appendChild(option);
            });
        }

    } catch (error) {
        console.error('[Init] Error fetching cities:', error);
        // Usunięto wyświetlanie błędów na liście miast
        [createCampaignTownSelect, editCampaignTownSelect].forEach(select => {
            if(select) {
                select.innerHTML = '<option value="">Nie udało się załadować miast</option>';
                select.disabled = true;
            }
        });
    }
}


// --- OBSŁUGA AUTORYZACJI I SEKCJI ---

document.getElementById('login-button')?.addEventListener('click', function() {
    console.log('[Auth] --- KLIKNIĘTO PRZYCISK PREPARE LOGIN ---');
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const feedbackElement = document.getElementById('login-feedback');
    const errorsElement = document.getElementById('login-errors');
    const testAuthButton = document.getElementById('test-auth-button');

    if (!usernameInput || !passwordInput || !feedbackElement || !errorsElement || !testAuthButton) {
        console.error('[Auth] Missing one or more login elements in DOM!');
        return;
    }

    feedbackElement.textContent = '';
    errorsElement.textContent = '';
    testAuthButton.style.display = 'none';

    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username && password) {
        const credentials = btoa(`${username}:${password}`);
        basicAuthHeader = `Basic ${credentials}`;

        feedbackElement.textContent = 'Dane logowania zostały przygotowane. Kliknij "Test Authentication" aby się zalogować.';
        errorsElement.textContent = '';
        testAuthButton.style.display = 'block';

        console.log('[Auth] Credentials prepared.');

    } else {
        errorsElement.textContent = 'Proszę podać nazwę użytkownika i hasło.';
        basicAuthHeader = null;
        console.log('[Auth] Missing username or password.');
    }
});


document.getElementById('test-auth-button')?.addEventListener('click', async function() {
    console.log('[Auth] --- KLIKNIĘTO PRZYCISK TEST AUTHENTICATION ---');
    const feedbackElement = document.getElementById('auth-test-feedback');
    const loginErrorsElement = document.getElementById('login-errors');

    if (!feedbackElement || !loginErrorsElement) {
        console.error('[Auth] Missing auth test feedback/errors elements in DOM!');
        return;
    }

    feedbackElement.textContent = 'Testowanie autoryzacji...';
    loginErrorsElement.textContent = '';

    try {
        const sellerData = await fetchData(`${BASE_API_URL}/sellers/me`, 'GET', null, true);

        if (sellerData) {
            feedbackElement.textContent = `Autoryzacja pomyślna! Zalogowany jako: ${sellerData.username}`;
            console.log('[Auth] Authentication successful.', sellerData);

            const publicSection = document.getElementById('public-section');
            const authenticatedSection = document.getElementById('authenticated-section');
            if (publicSection && authenticatedSection) {
                publicSection.style.display = 'none';
                authenticatedSection.style.display = 'block';
            } else {
                console.error('[Auth] Missing public or authenticated main section elements in DOM!');
            }

            const testAuthButton = document.getElementById('test-auth-button');
            if(testAuthButton) testAuthButton.style.display = 'none';

            document.getElementById('login-feedback').textContent = '';
            document.getElementById('login-errors').textContent = '';

            fetchAndDisplaySellerInfo();
            fetchAndDisplayCampaigns();

            showAuthSection('campaigns-list-section');

            console.log('[Auth] Authentication successful: switched views and fetching user data.');

        } else {
            feedbackElement.textContent = 'Autoryzacja pomyślna, ale nie otrzymano danych użytkownika.';
            console.log('[Auth] Authentication successful, but no seller data.');
        }

    } catch (error) {
        console.error('[Auth] Authentication test failed:', error);
        basicAuthHeader = null;
        document.getElementById('login-feedback').textContent = '';
        const testAuthButton = document.getElementById('test-auth-button');
        if(testAuthButton) testAuthButton.style.display = 'none';
        feedbackElement.textContent = '';

        if (loginErrorsElement) {
            if (error.status === 401) {
                loginErrorsElement.textContent = 'Autoryzacja nie powiodła się: Niepoprawne dane logowania (401 Unauthorized).';
            } else if (error.status === 403) {
                loginErrorsElement.textContent = 'Autoryzacja nie powiodła się: Brak uprawnień (403 Forbidden).';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                loginErrorsElement.textContent = `Błąd połączenia z backendem podczas próby autoryzacji. Upewnij się, że backend działa na ${BASE_API_URL}.`;
            }
            else {
                displayApiError(loginErrorsElement, error, 'Autoryzacja nie powiodła się.');
            }
        } else {
            console.error('[Auth] Missing login errors element in DOM to display message!');
            alert('Autoryzacja nie powiodła się. Sprawdź dane logowania (szczegóły w konsoli).');
        }
        console.log('[Auth] Authentication test error handling finished.');
    }
});


document.getElementById('logout-button')?.addEventListener('click', function() {
    console.log('[Auth] --- KLIKNIĘTO PRZYCISK LOGOUT ---');
    basicAuthHeader = null;
    currentSellerBalance = 0;

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
    const loginFeedback = document.getElementById('login-feedback');
    if(loginFeedback) loginFeedback.textContent = '';
    const loginErrors = document.getElementById('login-errors');
    if(loginErrors) loginErrors.textContent = '';

    resetFormAndMessages('registration-form', 'registration-feedback', 'registration-errors');

    const sellerUsernameEl = document.getElementById('seller-username-display');
    const sellerBalanceEl = document.getElementById('seller-balance-display');
    const campaignsListEl = document.getElementById('campaigns-list');

    if(sellerUsernameEl) sellerUsernameEl.textContent = '';
    if(sellerBalanceEl) sellerBalanceEl.textContent = '0.00';
    if(campaignsListEl) campaignsListEl.innerHTML = '<p>Zaloguj się, aby zobaczyć kampanie.</p>';

    const publicSection = document.getElementById('public-section');
    const authenticatedSection = document.getElementById('authenticated-section');
    if(publicSection && authenticatedSection) {
        publicSection.style.display = 'block';
        authenticatedSection.style.display = 'none';
    } else {
        console.error('[Auth] Missing public or authenticated main section elements in DOM on logout!');
    }

    console.log('[Auth] User logged out.');
});


document.getElementById('authenticated-nav')?.addEventListener('click', function(event) {
    const target = event.target;
    if (target.tagName === 'BUTTON' && target.dataset.section) {
        console.log(`[Nav] --- KLIKNIĘTO PRZYCISK NAWIGACJI: ${target.dataset.section} ---`);
        const sectionId = target.dataset.section;
        showAuthSection(sectionId);
    } else {
        console.log('[Nav] Kliknięto w elemencie nawigacji, ale nie na przycisku nawigacji.');
    }
});


// --- FUNKCJE ZALOGOWANEGO UŻYTKOWNIKA ---

async function fetchAndDisplaySellerInfo() {
    console.log('[Seller] Fetching seller info...');
    const usernameElement = document.getElementById('seller-username-display');
    const balanceElement = document.getElementById('seller-balance-display');
    const createFundInput = document.getElementById('create-campaign-fund');
    const editFundInput = document.getElementById('edit-campaign-fund');

    if(usernameElement) usernameElement.textContent = 'Wczytywanie...';
    if(balanceElement) balanceElement.textContent = '...';

    try {
        const sellerData = await fetchData(`${BASE_API_URL}/sellers/me`, 'GET', null, true);
        console.log('[Seller] Seller /me response:', sellerData);
        if (sellerData) {
            if(usernameElement) usernameElement.textContent = sellerData.username;
            if(balanceElement) {
                // Sprawdzamy, czy dane salda z backendu istnieją i są liczbą
                if (sellerData.balance != null && typeof sellerData.balance === 'number') {
                    balanceElement.textContent = sellerData.balance.toFixed(2); // Ustaw sformatowane saldo
                    // Log, który pokazuje, jaką wartość próbowano ustawić w elemencie UI
                    console.log('[Seller] Successfully read balance from response and updated display:', sellerData.balance.toFixed(2));
                } else {
                    // Jeśli dane salda są niepoprawne, wyświetl błąd
                    balanceElement.textContent = 'Brak danych';
                    console.error('[Seller] Balance data from /me is missing or not a number:', sellerData.balance);
                }
            } else {
                console.error('[Seller] Balance display element (#seller-balance-display) not found in DOM!');
            }
            currentSellerBalance = sellerData.balance;

            console.log('[Seller] Seller info fetched.', sellerData);

            if(createFundInput) createFundInput.max = currentSellerBalance;
            if(editFundInput) editFundInput.max = currentSellerBalance;

        } else {
            if(usernameElement) usernameElement.textContent = 'Brak danych';
            if(balanceElement) balanceElement.textContent = 'Brak danych';
            currentSellerBalance = 0;
            console.log('[Seller] Seller info fetched, but no data.');
        }

    } catch (error) {
        console.error('[Seller] Error fetching seller info:', error);
        if(usernameElement) usernameElement.textContent = 'Błąd';
        if(balanceElement) balanceElement.textContent = 'Błąd';
        currentSellerBalance = 0;
        if (error.status === 401 || error.status === 403) {
            alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
            document.getElementById('logout-button')?.click();
        }
    }
}

async function fetchAndDisplayCampaigns() {
    console.log('[Campaigns] Fetching campaigns...');
    const campaignsListElement = document.getElementById('campaigns-list');
    const feedbackElement = document.getElementById('campaigns-feedback');
    const errorsElement = document.getElementById('campaigns-errors');

    if (!campaignsListElement || !feedbackElement || !errorsElement) {
        console.error('[Campaigns] Missing campaigns list/feedback/errors elements in DOM! Cannot fetch campaigns.');
        return;
    }

    campaignsListElement.innerHTML = '<p>Wczytywanie kampanii...</p>';
    feedbackElement.textContent = '';
    errorsElement.textContent = '';

    try {
        const campaigns = await fetchData(`${BASE_API_URL}/campaigns`, 'GET', null, true);
        console.log('[Campaigns] Campaigns fetched.', campaigns);
        renderCampaigns(campaigns || []);
    } catch (error) {
        console.error('[Campaigns] Error fetching campaigns:', error);
        campaignsListElement.innerHTML = '<p>Nie udało się załadować kampanii.</p>';
        displayApiError(errorsElement, error, 'Nie udało się załadować kampanii.');
        if (error.status === 401 || error.status === 403) {
            alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
            document.getElementById('logout-button')?.click();
        }
    }
}

// Renderuj listę kampanii - Użyj DOKŁADNYCH NAZW PÓL Z ODPOWIEDZI BACKENDU GET /campaigns!
function renderCampaigns(campaigns) {
    console.log('[Campaigns] Rendering campaigns:', campaigns);
    const campaignsListElement = document.getElementById('campaigns-list');
    if (!campaignsListElement) {
        console.error('[Campaigns] Cannot render campaigns: campaigns list element not found.');
        return;
    }
    campaignsListElement.innerHTML = '';

    if (!campaigns || campaigns.length === 0) {
        campaignsListElement.innerHTML = '<p>Nie masz jeszcze żadnych kampanii.</p>';
        console.log('[Campaigns] No campaigns to render or campaigns list is empty/null.');
        return;
    }

    campaigns.forEach(campaign => {
        // *** SPRAWDŹ TEN LOG W KONSOLI PO ZAŁADOWANIU LISTY! ***
        // Pokaże DOKŁADNE NAZWY PÓL, które backend zwraca dla KAŻDEJ kampanii na liście.
        // console.log('[Campaigns] Rendering campaign item, data:', campaign);
        // Jeśli nadal widzisz N/A we frontendzie, oznacza to, że NAZWA POLA poniżej jest BŁĘDNA.
        // Porównaj nazwy użyte PONIŻEJ z nazwami pól w obiekcie w logu powyżej i POPRAW je.

        const campaignDiv = document.createElement('div');
        campaignDiv.classList.add('campaign-item');
        campaignDiv.dataset.campaignId = campaign.id; // Zakładamy, że ID to 'id'. SPRAWDŹ W LOGU!

        campaignDiv.innerHTML = `
            <h4>${campaign.name} (ID: ${campaign.id})</h4> <p><strong>Słowa kluczowe:</strong> ${
            // >>> NAJWYGODNIEJ SPRAWDZIĆ W LOGU 'Rendering campaign item, data:' <<<
            // ZASTĄP 'keywordsNames' FAKTYCZNĄ NAZWĄ POLA SŁÓW KLUCZOWYCH Z ODPOWIEDZI GET /campaigns
            // JEŚLI backend zwraca np. pole "tags" zamiast "keywordsNames", zmień poniżej na campaign.tags
            campaign.keywordsNames && Array.isArray(campaign.keywordsNames) && campaign.keywordsNames.length > 0 // Użyto 'keywordsNames' jako najbardziej prawdopodobnej nazwy
                ? campaign.keywordsNames.join(', ') // Użyto 'keywordsNames' jako najbardziej prawdopodobnej nazwy
                : 'Brak słów kluczowych'
        }</p>
            <p><strong>Kwota licytacji:</strong> $${
            // >>> NAJWYGODNIEJ SPRAWDZIĆ W LOGU 'Rendering campaign item, data:' <<<
            // ZASTĄP 'price' FAKTYCZNĄ NAZWĄ POLA LICYTACJI Z ODPOWIEDZI GET
            // JEŚLI backend zwraca np. pole "bidAmount" zamiast "price", zmień poniżej na campaign.bidAmount
            campaign.price != null ? campaign.price.toFixed(2) : 'N/A' // Użyto 'price' jako najbardziej prawdopodobnej nazwy
        }</p>
            <p><strong>Budżet kampanii:</strong> $${
            // >>> NAJWYGODNIEJ SPRAWDZIĆ W LOGU 'Rendering campaign item, data:' <<<
            // ZASTĄP 'fund' FAKTYCZNĄ NAZWĄ POLA BUDŻETU Z ODPOWIEDZI GET
            // JEŚLI backend zwraca np. pole "currentFund" zamiast "fund", zmień poniżej na campaign.currentFund
            campaign.fund != null ? campaign.fund.toFixed(2) : 'N/A' // Użyto 'fund' jako najbardziej prawdopodobnej nazwy
        }</p>
            <p><strong>Status:</strong>
                <select class="campaign-status-select" data-campaign-id="${campaign.id}">
                    <option value="true" ${campaign.status ? 'selected' : ''}>Aktywna</option> <option value="false" ${!campaign.status ? 'selected' : ''}>Nieaktywna</option>
                </select>
            </p>
            <p><strong>Miasto:</strong> ${
            // >>> NAJWYGODNIEJ SPRAWDZIĆ W LOGU 'Rendering campaign item, data:' <<<
            // ZASTĄP 'city' FAKTYCZNĄ NAZWĄ POLA MIASTA Z ODPOWIEDZI GET
            // JEŚLI backend zwraca np. pole "cityName" zamiast "city", zmień poniżej na campaign.cityName
            campaign.city || 'N/A' // Użyto 'city' jako najbardziej prawdopodobnej nazwy
        }</p>
            <p><strong>Promień:</strong> ${
            // >>> NAJWYGODNIEJ SPRAWDZIĆ W LOGU 'Rendering campaign item, data:' <<<
            // ZASTĄP 'radius' FAKTYCZNĄ NAZWĄ POLA PROMIENIA Z ODPOWIEDZI GET
            // JEŚLI backend zwraca np. pole "rangeKm" zamiast "radius", zmień poniżej na campaign.rangeKm
            campaign.radius != null ? campaign.radius : 'N/A' // Użyto 'radius' jako najbardziej prawdopodobnej nazwy
        } km</p>
            <button class="edit-campaign-button" data-campaign-id="${campaign.id}">Edytuj</button>
            <button class="delete-campaign-button" data-campaign-id="${campaign.id}">Usuń</button>
            <hr>
        `;
        campaignsListElement.appendChild(campaignDiv);
    });
    console.log('[Campaigns] Finished rendering campaigns.');
}


// --- OBSŁUGA FORMULARZY I AKCJI KAMPANII ---

const registrationForm = document.getElementById('registration-form');

if (registrationForm) {
    console.log('Listener: Registration form (#registration-form) found. Attaching submit listener.');
    registrationForm.addEventListener('submit', async function(event) {
        console.log('--- START: HANDLER SUBMIT FORMULARZA REJESTRACJI ---');
        event.preventDefault();
        console.log('preventDefault() executed.');

        const usernameInput = document.getElementById('reg-username');
        const emailInput = document.getElementById('reg-email');
        const passwordInput = document.getElementById('reg-password');
        const balanceInput = document.getElementById('reg-balance');
        const feedbackElement = document.getElementById('registration-feedback');
        const errorsElement = document.getElementById('registration-errors');

        if (!usernameInput || !emailInput || !passwordInput || !balanceInput || !feedbackElement || !errorsElement) {
            console.error('BŁĄD: Brak jednego lub więcej wymaganych elementów formularza rejestracji w DOM podczas submitu!');
            if(errorsElement) errorsElement.textContent = 'Wystąpił błąd konfiguracji strony (brak elementów formularza).';
            return;
        }
        console.log('All registration form elements found in DOM.');

        const username = usernameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const balance = parseFloat(balanceInput.value);

        const registrationData = { username, email, password, balance };
        console.log('Collected registration data:', registrationData);

        feedbackElement.textContent = 'Rejestracja w toku...';
        errorsElement.textContent = '';
        console.log('Set "in progress" message.');

        try {
            console.log('Attempting to call fetchData for registration...');
            const result = await fetchData(`${BASE_API_URL}/home/register`, 'POST', registrationData, false);
            console.log('fetchData for registration completed.', result);

            if (result) {
                feedbackElement.textContent = `Użytkownik ${result.username} zarejestrowany pomyślnie! Możesz teraz przygotować dane do logowania.`;
                resetFormAndMessages('registration-form', 'registration-feedback', 'registration-errors');
                console.log('Registration success: displayed message and reset form.');
            } else {
                console.log('Registration success: fetchData returned no result.');
                feedbackElement.textContent = 'Rejestracja zakończona pomyślnie, ale serwer nie zwrócił szczegółów użytkownika.';
                resetFormAndMessages('registration-form', 'registration-feedback', 'registration-errors');
            }

        } catch (error) {
            console.error('Error during registration fetch:', error);
            feedbackElement.textContent = '';
            if (error.status === 400 && error.errorBody) {
                displayValidationErrors(errorsElement, error.errorBody);
            } else if (error.status === 409) {
                errorsElement.textContent = 'Rejestracja nie powiodła się: Użytkownik o podanej nazwie lub emailu już istnieje.';
            } else {
                displayApiError(errorsElement, error, 'Rejestracja nie powiodła się.');
            }
            console.log('Registration error handling finished.');
        }
        console.log('--- END: HANDLER SUBMIT FORMULARZA REJESTRACJI ---');
    });
} else {
    console.error('BŁĄD KRYTYCZNY: Nie znaleziono elementu FORMULARZA REJESTRACJI o ID "registration-form"! Listener submit nie został podłączony.');
    const publicSection = document.getElementById('public-section');
    if(publicSection) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = 'Błąd konfiguracji strony: Formularz rejestracji nie został znaleziony.';
        publicSection.insertBefore(errorDiv, publicSection.firstChild);
    }
}


const createCampaignForm = document.getElementById('create-campaign-form');

if (createCampaignForm) {
    console.log('Listener: Create Campaign form (#create-campaign-form) found. Attaching submit listener.');
    createCampaignForm.addEventListener('submit', async function(event) {
        console.log('--- START: HANDLER SUBMIT FORMULARZA TWORZENIA KAMPANII ---');
        event.preventDefault();
        console.log('preventDefault() executed.');

        const nameInput = document.getElementById('create-campaign-name');
        const keywordsInput = document.getElementById('create-campaign-keywords');
        const hiddenKeywordsInput = document.getElementById('create-campaign-selected-keywords-input');
        const bidInput = document.getElementById('create-campaign-bid');
        const fundInput = document.getElementById('create-campaign-fund');
        const statusSelect = document.getElementById('create-campaign-status');
        const townSelect = document.getElementById('create-campaign-town');
        const radiusInput = document.getElementById('create-campaign-radius');
        const feedbackElement = document.getElementById('create-campaign-feedback');
        const errorsElement = document.getElementById('create-campaign-errors');

        if (!nameInput || !keywordsInput || !hiddenKeywordsInput || !bidInput || !fundInput || !statusSelect || !townSelect || !radiusInput || !feedbackElement || !errorsElement) {
            console.error('BŁĄD: Brak jednego lub więcej wymaganych elementów formularza tworzenia kampanii w DOM podczas submitu!');
            if(errorsElement) errorsElement.textContent = 'Wystąpił błąd konfiguracji strony (brak elementów formularza).';
            return;
        }
        console.log('All required create campaign form elements found in DOM.');

        const name = nameInput.value;
        const bid = parseFloat(bidInput.value);
        const fund = parseFloat(fundInput.value);
        const status = statusSelect.value === 'true';
        const town = townSelect.value;
        const radius = parseInt(radiusInput.value, 10);
        let keywords = [];
        try {
            keywords = JSON.parse(hiddenKeywordsInput.value || '[]');
        } catch (e) {
            console.error('Error parsing create form keywords JSON:', e);
            if(errorsElement) errorsElement.textContent = 'Błąd: Nie udało się odczytać słów kluczowych.';
            feedbackElement.textContent = '';
            return;
        }

        if (!name) {
            errorsElement.textContent = 'Nazwa kampanii jest wymagana.';
            feedbackElement.textContent = '';
            return;
        }
        if (keywords.length === 0) {
            errorsElement.textContent = 'Proszę wybrać co najmniej jedno słowo kluczowe.';
            feedbackElement.textContent = '';
            return;
        }
        if (isNaN(bid) || bid < MIN_BID) {
            errorsElement.textContent = `Minimalna kwota licytacji to $${MIN_BID.toFixed(2)}.`;
            feedbackElement.textContent = '';
            return;
        }
        if (isNaN(fund) || fund <= 0.01) {
            errorsElement.textContent = 'Budżet kampanii musi być większy niż 0.01.';
            feedbackElement.textContent = '';
            return;
        }
        if (fund > currentSellerBalance) {
            errorsElement.textContent = `Niewystarczające środki na koncie. Dostępne: $${currentSellerBalance.toFixed(2)}. Budżet kampanii: $${fund.toFixed(2)}.`;
            feedbackElement.textContent = '';
            return;
        }
        if (isNaN(radius) || radius < 1) {
            errorsElement.textContent = 'Proszę podać poprawny promień (co najmniej 1 km).';
            feedbackElement.textContent = '';
            return;
        }
        if (!town) {
            errorsElement.textContent = 'Proszę wybrać miasto.';
            feedbackElement.textContent = '';
            return;
        }
        console.log('Create form client-side validation passed.');

        const campaignData = {
            name: name,
            keywordsNames: keywords,
            price: bid,
            fund: fund,
            status: status,
            city: town,
            radius: radius
        };
        console.log('Prepared create campaign data (DTO names):', campaignData);

        feedbackElement.textContent = 'Tworzenie kampanii...';
        errorsElement.textContent = '';

        try {
            console.log('Attempting to call fetchData for create campaign...');
            const createdCampaign = await fetchData(`${BASE_API_URL}/campaigns`, 'POST', campaignData, true);
            console.log('fetchData for create campaign completed.', createdCampaign);

            if (createdCampaign) {
                feedbackElement.textContent = `Kampania "${createdCampaign.name}" utworzona pomyślnie!`;
                resetFormAndMessages('create-campaign-form', 'create-campaign-feedback', 'create-campaign-errors');
                createSelectedKeywords = [];
                renderSelectedKeywords(createSelectedKeywords, 'create-selected-keywords', 'create-campaign-selected-keywords-input');

                fetchAndDisplayCampaigns();
                fetchAndDisplaySellerInfo();

                showAuthSection('campaigns-list-section');

                console.log('Create campaign success: displayed message, reset form, refreshed lists, switched view.');

            } else {
                feedbackElement.textContent = '';
                errorsElement.textContent = 'Operacja tworzenia kampanii nie zwróciła danych.';
                console.log('Create campaign success: fetchData returned no data.');
            }

        } catch (error) {
            console.error('Error during create campaign fetch:', error);
            feedbackElement.textContent = '';
            if (error.status === 400 && error.errorBody) {
                displayValidationErrors(errorsElement, error.errorBody);
            } else if (error.status === 401 || error.status === 403) {
                displayApiError(errorsElement, error, 'Nie udało się utworzyć kampanii (problem autoryzacji).');
                alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
                document.getElementById('logout-button')?.click();
            } else {
                displayApiError(errorsElement, error, 'Nie udało się utworzyć kampanii.');
            }
            console.log('Create campaign error handling finished.');
        }
        console.log('--- END: HANDLER SUBMIT FORMULARZA TWORZENIA KAMPANII ---');
    });
} else {
    console.error('BŁĄD KRYTYCZNY: Nie znaleziono elementu FORMULARZA TWORZENIA KAMPANII o ID "create-campaign-form"! Listener submit nie został podłączony.');
    const createCampaignSection = document.getElementById('create-campaign-section');
    if(createCampaignSection) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = 'Błąd konfiguracji strony: Formularz tworzenia kampanii nie został znaleziony.';
        createCampaignSection.insertBefore(errorDiv, createCampaignSection.firstChild);
    }
}


const addFundsForm = document.getElementById('add-funds-form');

if (addFundsForm) {
    console.log('Listener: Add Funds form (#add-funds-form) found. Attaching submit listener.');
    addFundsForm.addEventListener('submit', async function(event) {
        console.log('--- START: HANDLER SUBMIT FORMULARZA DODAWANIA ŚRODKÓW ---');
        event.preventDefault();
        console.log('preventDefault() executed.');

        const amountInput = document.getElementById('add-funds-amount');
        const feedbackElement = document.getElementById('add-funds-feedback');
        const errorsElement = document.getElementById('add-funds-errors');

        if (!amountInput || !feedbackElement || !errorsElement) {
            console.error('BŁĄD: Brak jednego lub więcej wymaganych elementów formularza dodawania środków w DOM!');
            if(errorsElement) errorsElement.textContent = 'Wystąpił błąd konfiguracji strony (brak elementów formularza).';
            return;
        }
        console.log('All add funds form elements found in DOM.');

        feedbackElement.textContent = 'Dodawanie środków...';
        errorsElement.textContent = '';
        console.log('Set "in progress" message for add funds.');

        const amount = parseFloat(amountInput.value);

        if (isNaN(amount) || amount <= 0.01) {
            errorsElement.textContent = 'Proszę podać poprawną kwotę (większą niż 0.01).';
            feedbackElement.textContent = '';
            console.log('Add funds validation failed.');
            return;
        }
        console.log(`Attempting to add funds: ${amount}`);

        try {
            console.log('Attempting to call fetchData for add funds...');
            const updatedSeller = await fetchData(`${BASE_API_URL}/sellers/me/add-funds/${amount}`, 'PATCH', null, true);
            console.log('fetchData for add funds completed.', updatedSeller);

            if (updatedSeller) {
                feedbackElement.textContent = `Środki dodane pomyślnie. Nowe saldo: $${updatedSeller.balance.toFixed(2)}`;
                amountInput.value = '';
                fetchAndDisplaySellerInfo();

                console.log('Add funds success: displayed message, reset form, refreshed balance.');

            } else {
                feedbackElement.textContent = '';
                errorsElement.textContent = 'Operacja dodawania środków zakończona, ale nie otrzymano danych.';
                console.log('Add funds success: fetchData returned no data.');
            }

        } catch (error) {
            console.error('Error during add funds fetch:', error);
            feedbackElement.textContent = '';
            if (error.status === 400 && error.errorBody) {
                displayValidationErrors(errorsElement, error.errorBody);
            } else if (error.status === 401 || error.status === 403) {
                displayApiError(errorsElement, error, 'Nie udało się dodać środków (problem autoryzacji).');
                alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
                document.getElementById('logout-button')?.click();
            } else {
                displayApiError(errorsElement, error, 'Nie udało się dodać środków.');
            }
            console.log('Add funds error handling finished.');
        }
        console.log('--- END: HANDLER SUBMIT FORMULARZA DODAWANIA ŚRODKÓW ---');
    });
} else {
    console.error('BŁĄD KRYTYCZNY: Nie znaleziono elementu FORMULARZA DODAWANIA ŚRODKÓW o ID "add-funds-form"! Listener submit nie został podłączony.');
    const addFundsSection = document.getElementById('add-funds-section');
    if(addFundsSection) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = 'Błąd konfiguracji strony: Formularz dodawania środków nie został znaleziony.';
        addFundsSection.insertBefore(errorDiv, addFundsSection.firstChild);
    }
}


document.getElementById('campaigns-list')?.addEventListener('click', async function(event) {
    console.log('[Campaigns List] Click event detected.');
    const target = event.target;
    const campaignItem = target.closest('.campaign-item');

    if (!campaignItem) {
        console.log('[Campaigns List] Click not on a campaign item.');
        return;
    }

    const campaignId = campaignItem.dataset.campaignId;
    const feedbackElement = document.getElementById('campaigns-feedback');
    const errorsElement = document.getElementById('campaigns-errors');

    if (!feedbackElement || !errorsElement) {
        console.error('[Campaigns List] Missing feedback/errors elements for campaigns list!');
        return;
    }

    feedbackElement.textContent = '';
    errorsElement.textContent = '';
    console.log(`[Campaigns List] Action detected for Campaign ID: ${campaignId}`);


    // Obsługa przycisku EDYTUJ
    if (target.classList.contains('edit-campaign-button')) {
        console.log(`[Campaigns List] Edit button clicked for Campaign ID: ${campaignId}`);
        const editCampaignSection = document.getElementById('edit-campaign-section');
        const editCampaignIdInput = document.getElementById('edit-campaign-id');
        const editCampaignIdDisplay = document.getElementById('edit-campaign-id-display');

        const nameInput = document.getElementById('edit-campaign-name');
        const bidInput = document.getElementById('edit-campaign-bid');
        const fundInput = document.getElementById('edit-campaign-fund');
        const statusSelect = document.getElementById('edit-campaign-status');
        const townSelect = document.getElementById('edit-campaign-town');
        const radiusInput = document.getElementById('edit-campaign-radius');
        const keywordsInput = document.getElementById('edit-campaign-keywords');
        const selectedKeywordsDiv = document.getElementById('edit-selected-keywords');
        const hiddenKeywordsInput = document.getElementById('edit-campaign-selected-keywords-input');
        const editFeedbackElement = document.getElementById('edit-campaign-feedback');
        const editErrorsElement = document.getElementById('edit-campaign-errors');


        if (!editCampaignSection || !editCampaignIdInput || !editCampaignIdDisplay || !nameInput || !bidInput || !fundInput || !statusSelect || !townSelect || !radiusInput || !keywordsInput || !selectedKeywordsDiv || !hiddenKeywordsInput || !editFeedbackElement || !editErrorsElement) {
            console.error('[Campaigns List] BŁĄD KRYTYCZNY: Brak jednego lub więcej wymaganych elementów formularza edycji w DOM! Nie można załadować formularza.');
            displayApiError(errorsElement, {message: "Błąd konfiguracji strony: Nie znaleziono wszystkich elementów formularza edycji kampanii."}, 'Wystąpił błąd strony.');
            showAuthSection('campaigns-list-section');
            return;
        }
        console.log('[Campaigns List] All required edit form elements found in DOM.');

        showAuthSection('edit-campaign-section');

        editCampaignIdInput.value = campaignId;
        editCampaignIdDisplay.textContent = campaignId;

        editFeedbackElement.textContent = `Wczytywanie danych kampanii ${campaignId}...`;
        editErrorsElement.textContent = '';

        console.log(`[Campaigns List] Attempting to fetch data for editing Campaign ID: ${campaignId}`);

        try {
            const campaignData = await fetchData(`${BASE_API_URL}/campaigns/${campaignId}`, 'GET', null, true);
            console.log('[Campaigns List] Fetch data for edit completed.', campaignData); // *** SPRAWDŹ TEN OBIEKT W KONSOLI PO KLIKNIĘCIU 'EDTUJ'! ***


            if(campaignData) {
                editFeedbackElement.textContent = '';
                editErrorsElement.textContent = '';

                // Wypełnij formularz edycji danymi POBRANYMI Z BACKENDU
                // Użyj nazw pól, które widzisz w obiekcie 'campaignData' w konsoli powyżej.
                // Jeśli nadal widzisz PUSTE POLA w formularzu edycji, nazwa pola poniżej jest BŁĘDNA - sprawdź log campaignData i popraw!
                nameInput.value = campaignData.name; // Zakładamy, że nazwa to 'name'. SPRAWDŹ W LOGU!
                bidInput.value = campaignData.price; // Użyto 'price' jako najbardziej prawdopodobnej nazwy. SPRAWDŹ W LOGU!
                fundInput.value = campaignData.fund; // Użyto 'fund' jako najbardziej prawdopodobnej nazwy. SPRAWDŹ W LOGU!
                statusSelect.value = campaignData.status != null ? campaignData.status.toString() : ''; // Zakładamy, że status to 'status'. SPRAWDŹ W LOGU!
                townSelect.value = campaignData.city; // Użyto 'city' jako najbardziej prawdopodobnej nazwy. SPRAWDŹ W LOGU!
                radiusInput.value = campaignData.radius; // Użyto 'radius' jako najbardziej prawdopodobnej nazwy. SPRAWDŹ W LOGU!


                // Dla słów kluczowych:
                // Użyto 'keywordsNames' jako najbardziej prawdopodobnej nazwy. SPRAWDŹ W LOGU!
                const fetchedKeywords = campaignData.keywordsNames;
                editSelectedKeywords = fetchedKeywords && Array.isArray(fetchedKeywords) ? fetchedKeywords : [];
                renderSelectedKeywords(editSelectedKeywords, 'edit-selected-keywords', 'edit-campaign-selected-keywords-input');
                keywordsInput.value = '';


                console.log('[Campaigns List] Edit form populated and shown.');

            } else {
                editFeedbackElement.textContent = '';
                editErrorsElement.textContent = `Nie udało się wczytać danych kampanii ID: ${campaignId}.`;
                console.log('[Campaigns List] Fetch data for edit returned no data.');
                showAuthSection('campaigns-list-section');
            }

        } catch (error) {
            console.error(`[Campaigns List] Error during fetch for editing Campaign ID ${campaignId}:`, error);
            editFeedbackElement.textContent = '';
            displayApiError(editErrorsElement, error, 'Nie udało się wczytać danych kampanii do edycji.');
            showAuthSection('campaigns-list-section');
            if (error.status === 401 || error.status === 403) {
                alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
                document.getElementById('logout-button')?.click();
            }
        }
    }

    // Obsługa przycisku USUŃ
    if (target.classList.contains('delete-campaign-button')) {
        console.log(`[Campaigns List] Delete button clicked for Campaign ID: ${campaignId}`);
        if (confirm(`Czy na pewno chcesz usunąć kampanię "${campaignItem.querySelector('h4').textContent.split(' (ID:')[0]}" (ID: ${campaignId})?`)) {
            feedbackElement.textContent = `Usuwanie kampanii ${campaignId}...`;
            console.log(`[Campaigns List] Confirm delete for Campaign ID: ${campaignId}`);
            try {
                console.log(`Attempting to call fetchData for deleting Campaign ID: ${campaignId}...`);
                await fetchData(`${BASE_API_URL}/campaigns/${campaignId}`, 'DELETE', null, true);
                console.log(`Delete completed for Campaign ID: ${campaignId}`);

                feedbackElement.textContent = `Kampania ID ${campaignId} usunięta pomyślnie.`;
                console.log(`[Campaigns List] Delete successful for Campaign ID: ${campaignId}`);
                fetchAndDisplayCampaigns();
                fetchAndDisplaySellerInfo();

            } catch (error) {
                console.error(`[Campaigns List] Error during delete for Campaign ID ${campaignId}:`, error);
                feedbackElement.textContent = '';
                displayApiError(errorsElement, error, 'Nie udało się usunąć kampanii.');
                if (error.status === 401 || error.status === 403) {
                    alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
                    document.getElementById('logout-button')?.click();
                }
            }
        } else {
            console.log(`[Campaigns List] Delete cancelled for Campaign ID: ${campaignId}`);
        }
    }
    // Obsługa zmiany statusu kampanii
    if (target.classList.contains('campaign-status-select')) {
        console.log('[Campaigns List] Change event detected on status select.');
        const selectElement = target;
        const campaignId = selectElement.dataset.campaignId;
        const newStatus = selectElement.value === 'true';
        const feedbackElement = document.getElementById('campaigns-feedback');
        const errorsElement = document.getElementById('campaigns-errors');

        if (!feedbackElement || !errorsElement) {
            console.error('[Campaigns List] Missing feedback/errors elements for status change!');
            selectElement.value = (!newStatus).toString();
            return;
        }

        feedbackElement.textContent = `Zmienianie statusu kampanii ${campaignId}...`;
        errorsElement.textContent = '';
        console.log(`[Campaigns List] Status change requested for Campaign ID: ${campaignId} to ${newStatus}`);

        try {
            console.log(`Attempting to call fetchData for changing status for Campaign ID: ${campaignId} to ${newStatus}...`);
            const updatedCampaign = await fetchData(`${BASE_API_URL}/campaigns/${campaignId}/status`, 'PATCH', { status: newStatus }, true);
            console.log('[Campaigns List] Status change fetch completed.', updatedCampaign);

            if (updatedCampaign) {
                const updatedStatus = updatedCampaign.status != null ? (updatedCampaign.status ? 'Aktywna' : 'Nieaktywna') : (newStatus ? 'Aktywna' : 'Nieaktywna');
                feedbackElement.textContent = `Status kampanii ID ${campaignId} zmieniony na: ${updatedStatus}.`;
                console.log('[Campaigns List] Status change successful.');
                // Refresh the single campaign item in the list if needed, or just rely on fetchAndDisplayCampaigns()
                // fetchAndDisplayCampaigns(); // Uncomment if you want to fully refresh the list
            } else {
                feedbackElement.textContent = '';
                errorsElement.textContent = `Operacja zmiany statusu dla kampanii ID ${campaignId} nie zwróciła danych.`;
                selectElement.value = (!newStatus).toString();
                console.log('[Campaigns List] Status change success, but no data returned. Reverting select.');
            }

        } catch (error) {
            console.error(`[Campaigns List] Error during status change for Campaign ID ${campaignId}:`, error);
            feedbackElement.textContent = '';
            displayApiError(errorsElement, error, 'Nie udało się zmienić statusu kampanii.');
            selectElement.value = (!newStatus).toString();
            if (error.status === 401 || error.status === 403) {
                alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
                document.getElementById('logout-button')?.click();
            }
            console.log('Status change error handling finished. Reverting select.');
        }
    } else {
        console.log('[Campaigns List] Click/Change event not on edit/delete button or status select.');
    }
});


const editCampaignForm = document.getElementById('edit-campaign-form');

if (editCampaignForm) {
    console.log('Listener: Edit Campaign form (#edit-campaign-form) found. Attaching submit listener.');
    editCampaignForm.addEventListener('submit', async function(event) {
        console.log('--- START: HANDLER SUBMIT FORMULARZA EDYCJI KAMPANII ---');
        event.preventDefault();
        console.log('preventDefault() executed.');

        const campaignId = document.getElementById('edit-campaign-id')?.value;
        const feedbackElement = document.getElementById('edit-campaign-feedback');
        const errorsElement = document.getElementById('edit-campaign-errors');

        if (!campaignId || !feedbackElement || !errorsElement) {
            console.error('BŁĄD: Missing campaign ID or feedback/errors elements for edit submit!');
            if(errorsElement) errorsElement.textContent = 'Wystąpił błąd: Brak ID kampanii lub elementów komunikatu.';
            showAuthSection('campaigns-list-section');
            return;
        }
        console.log(`Edit submit for Campaign ID: ${campaignId}`);

        feedbackElement.textContent = `Zapisywanie zmian dla kampanii ${campaignId}...`;
        errorsElement.textContent = '';
        console.log('Set "saving" message for edit form.');


        const nameInput = document.getElementById('edit-campaign-name');
        const bidInput = document.getElementById('edit-campaign-bid');
        const fundInput = document.getElementById('edit-campaign-fund');
        const statusSelect = document.getElementById('edit-campaign-status');
        const townSelect = document.getElementById('edit-campaign-town');
        const radiusInput = document.getElementById('edit-campaign-radius');
        const hiddenKeywordsInput = document.getElementById('edit-campaign-selected-keywords-input');

        if (!nameInput || !bidInput || !fundInput || !statusSelect || !townSelect || !radiusInput || !hiddenKeywordsInput) {
            console.error('BŁĄD: Brak jednego lub więcej wymaganych pól input w formularzu edycji podczas submitu!');
            if(errorsElement) errorsElement.textContent = 'Wystąpił błąd konfiguracji strony (brak pól formularza).';
            feedbackElement.textContent = '';
            return;
        }
        console.log('All required edit form input elements found in DOM for submit.');

        const name = nameInput.value;
        const bid = parseFloat(bidInput.value);
        const fund = parseFloat(fundInput.value);
        const status = statusSelect.value === 'true';
        const town = townSelect.value;
        const radius = parseInt(radiusInput.value, 10);
        let keywords = [];
        try {
            keywords = JSON.parse(hiddenKeywordsInput.value || '[]');
        } catch (e) {
            console.error('Error parsing edit form keywords JSON during submit:', e);
            if(errorsElement) errorsElement.textContent = 'Błąd: Nie udało się odczytać słów kluczowych.';
            feedbackElement.textContent = '';
            return;
        }


        if (!name) { errorsElement.textContent = 'Nazwa kampanii jest wymagana.'; feedbackElement.textContent = ''; return; }
        if (keywords.length === 0) { errorsElement.textContent = 'Proszę wybrać co najmniej jedno słowo kluczowe.'; feedbackElement.textContent = ''; return; }
        if (isNaN(bid) || bid < MIN_BID) { errorsElement.textContent = `Minimalna kwota licytacji to $${MIN_BID.toFixed(2)}.`; feedbackElement.textContent = ''; return; }
        if (isNaN(fund) || fund <= 0.01) { errorsElement.textContent = 'Budżet kampanii musi być większy niż 0.01.'; feedbackElement.textContent = ''; return; }
        // Fund validation against seller balance is done in backend
        if (isNaN(radius) || radius < 1) { errorsElement.textContent = 'Proszę podać poprawny promień (co najmniej 1 km).'; feedbackElement.textContent = ''; return; }
        if (!town) { errorsElement.textContent = 'Proszę wybrać miasto.'; feedbackElement.textContent = ''; return; }
        console.log('Edit form client-side validation passed.');


        const updatedCampaignData = {
            name: name,
            keywordsNames: keywords, // Użyto 'keywordsNames' (zgodnie z DTO)
            price: bid,              // Użyto 'price' (zgodnie z DTO)
            fund: fund,              // Użyto 'fund' (zgodnie z DTO)
            status: status,
            city: town,              // Użyto 'city' (zgodnie z DTO)
            radius: radius
        };
        console.log('Prepared update campaign data (DTO names):', updatedCampaignData);


        feedbackElement.textContent = `Zapisywanie zmian dla kampanii ${campaignId}...`;
        errorsElement.textContent = '';


        try {
            console.log(`Attempting to call fetchData for updating Campaign ID: ${campaignId}`);
            const updatedCampaign = await fetchData(`${BASE_API_URL}/campaigns/${campaignId}`, 'PATCH', updatedCampaignData, true);
            console.log('fetchData for update completed.', updatedCampaign);

            if (updatedCampaign) {
                feedbackElement.textContent = `Zmiany dla kampanii "${updatedCampaign.name}" zapisane pomyślnie.`;
                showAuthSection('campaigns-list-section');

                resetFormAndMessages('edit-campaign-form', 'edit-campaign-feedback', 'edit-campaign-errors');
                editSelectedKeywords = [];
                renderSelectedKeywords(editSelectedKeywords, 'edit-selected-keywords', 'edit-campaign-selected-keywords-input');

                fetchAndDisplayCampaigns();
                fetchAndDisplaySellerInfo(); // Odśwież saldo sprzedawcy

                console.log('Edit success: displayed message, hid form, refreshed lists.');

            } else {
                feedbackElement.textContent = '';
                errorsElement.textContent = `Operacja edycji kampanii ${campaignId} nie zwróciła danych.`;
                console.log('Edit success: fetchData returned no data.');
            }

        } catch (error) {
            console.error(`Error during update campaign fetch for ID ${campaignId}:`, error);
            feedbackElement.textContent = '';
            if (error.status === 400 && error.errorBody) {
                displayValidationErrors(errorsElement, error.errorBody);
            } else if (error.status === 401 || error.status === 403) {
                displayApiError(errorsElement, error, 'Nie udało się zapisać zmian w kampanii (problem autoryzacji).');
                alert('Sesja wygasła lub brak dostępu. Proszę zalogować się ponownie.');
                document.getElementById('logout-button')?.click();
            } else {
                displayApiError(errorsElement, error, 'Nie udało się zapisać zmian w kampanii.');
            }
            console.log('Edit error handling finished.');
        }
        console.log('--- END: HANDLER SUBMIT FORMULARZA EDYCJI KAMPANII ---');
    });
} else {
    console.error('BŁĄD KRYTYCZNY: Nie znaleziono elementu FORMULARZA EDYCJI KAMPANII o ID "edit-campaign-form"! Listener submit nie został podłączony.');
    const editCampaignSection = document.getElementById('edit-campaign-section');
    if(editCampaignSection) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = 'Błąd konfiguracji strony: Formularz edycji kampanii nie został znaleziony.';
        editCampaignSection.insertBefore(errorDiv, editCampaignSection.firstChild);
    }
}

document.getElementById('cancel-edit-button')?.addEventListener('click', function() {
    console.log('[Edit Form] --- KLIKNIĘTO PRZYCISK ANULUJ EDYCJĘ ---');
    showAuthSection('campaigns-list-section');

    resetFormAndMessages('edit-campaign-form', 'edit-campaign-feedback', 'edit-campaign-errors');
    editSelectedKeywords = [];
    renderSelectedKeywords(editSelectedKeywords, 'edit-selected-keywords', 'edit-campaign-selected-keywords-input');
    console.log('[Edit Form] Cancel action complete. Switched to campaigns list.');
});


// --- Funkcje dla słów kluczowych (Typeahead) ---

/**
 * Renderuje wybrane słowa kluczowe jako tagi i aktualizuje ukryte pole JSON.
 * @param {string[]} keywordsArray Tablica słów kluczowych.
 * @param {string} selectedKeywordsDivId ID diva, gdzie renderowane są tagi.
 * @param {string} hiddenInputId ID ukrytego inputa, gdzie zapisywany jest JSON.
 */
function renderSelectedKeywords(keywordsArray, selectedKeywordsDivId, hiddenInputId) {
    console.log(`[Keywords] Rendering selected keywords for #${selectedKeywordsDivId}:`, keywordsArray);
    const selectedKeywordsDiv = document.getElementById(selectedKeywordsDivId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!selectedKeywordsDiv || !hiddenInput) {
        console.error(`[Keywords] Missing selected keywords div (#${selectedKeywordsDivId}) or hidden input (#${hiddenInputId})! Cannot render keywords.`);
        return;
    }

    selectedKeywordsDiv.innerHTML = '';

    if (keywordsArray && Array.isArray(keywordsArray) && keywordsArray.length > 0) {
        keywordsArray.forEach(keyword => {
            const tagSpan = document.createElement('span');
            tagSpan.classList.add('keyword-tag');
            tagSpan.textContent = keyword;

            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-keyword');
            removeButton.textContent = 'x';
            removeButton.type = 'button';
            removeButton.dataset.keyword = keyword;

            tagSpan.appendChild(removeButton);
            selectedKeywordsDiv.appendChild(tagSpan);
        });
        hiddenInput.value = JSON.stringify(keywordsArray);
        hiddenInput.setCustomValidity('');
        console.log(`[Keywords] Rendered ${keywordsArray.length} tags.`);
    } else {
        hiddenInput.value = '';
        const minKeywords = parseInt(hiddenInput.dataset.minKeywords || '0', 10);
        if (minKeywords > 0) {
            hiddenInput.setCustomValidity(`Wybierz co najmniej ${minKeywords} słowo kluczowe.`);
            console.log(`[Keywords] No keywords selected, set custom validity.`);
        } else {
            hiddenInput.setCustomValidity('');
            console.log(`[Keywords] No keywords selected.`);
        }
    }
}

/**
 * Konfiguruje funkcjonalność typeahead (autouzupełniania) dla pola słów kluczowych.
 * @param {string} inputId ID pola input.
 * @param {string} suggestionsId ID diva na sugestie.
 * @param {string} selectedKeywordsDivId ID diva na wybrane tagi słów kluczowych.
 * @param {string} hiddenInputId ID ukrytego inputa na JSON słów kluczowych.
 * @param {string[]} selectedKeywordsArray Tablica JS przechowująca aktualnie wybrane słowa kluczowe.
 */
function setupKeywordTypeahead(inputId, suggestionsId, selectedKeywordsDivId, hiddenInputId, selectedKeywordsArray) {
    console.log(`[Keywords] Setting up typeahead for input: #${inputId}`);
    const keywordInput = document.getElementById(inputId);
    const suggestionsDiv = document.getElementById(suggestionsId);
    const selectedKeywordsDiv = document.getElementById(selectedKeywordsDivId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!keywordInput || !suggestionsDiv || !selectedKeywordsDiv || !hiddenInput) {
        console.error(`[Keywords] Missing elements for typeahead setup (input: #${inputId}, suggestions: #${suggestionsId}, selected: #${selectedKeywordsDivId}, hidden: #${hiddenInputId})! Typeahead not configured.`);
        return;
    }
    console.log(`[Keywords] All typeahead elements found for #${inputId}.`);

    keywordInput.addEventListener('focus', () => {
        console.log(`[Keywords] Input #${inputId} focused.`);
        if (suggestionsDiv.children.length > 0) {
            suggestionsDiv.style.display = 'block';
        }
    });
    keywordInput.addEventListener('blur', (event) => {
        console.log(`[Keywords] Input #${inputId} blurred.`);
        setTimeout(() => {
            if (!suggestionsDiv.contains(event.relatedTarget)) {
                suggestionsDiv.style.display = 'none';
            }
        }, 100);
    });


    keywordInput.addEventListener('input', async function() {
        const query = keywordInput.value.trim();
        console.log(`[Keywords] Input event on #${inputId}. Query: "${query}"`);

        if (query.length < 2) {
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
            console.log('[Keywords] Query too short, hiding suggestions.');
            return;
        }

        try {
            console.log(`[Keywords] Fetching suggestions for "${query}"...`);
            const suggestions = await fetchData(`${BASE_API_URL}/keywords/suggest?q=${encodeURIComponent(query)}`, 'GET', null, false);
            console.log('[Keywords] Suggestions fetched:', suggestions);

            suggestionsDiv.innerHTML = '';
            if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
                suggestions.forEach(keyword => {
                    if (!selectedKeywordsArray.includes(keyword)) {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.classList.add('suggestion-item');
                        suggestionItem.textContent = keyword;
                        suggestionItem.addEventListener('mousedown', function() {
                            console.log(`[Keywords] Suggestion "${keyword}" clicked for #${inputId}.`);
                            if (!selectedKeywordsArray.includes(keyword)) {
                                selectedKeywordsArray.push(keyword);
                                renderSelectedKeywords(selectedKeywordsArray, selectedKeywordsDivId, hiddenInputId);
                                keywordInput.value = '';
                            }
                            suggestionsDiv.style.display = 'none';
                            console.log('[Keywords] Suggestion processed, hiding div.');
                        });
                        suggestionsDiv.appendChild(suggestionItem);
                    }
                });
                suggestionsDiv.style.display = (suggestionsDiv.children.length > 0) ? 'block' : 'none';
                console.log(`[Keywords] Rendered ${suggestionsDiv.children.length} suggestions.`);
            } else {
                suggestionsDiv.style.display = 'none';
                console.log('[Keywords] No suggestions found, hiding div.');
            }

        } catch (error) {
            console.error('[Keywords] Error during suggestion fetch:', error);
            suggestionsDiv.innerHTML = '<div>Nie udało się załadować sugestii.</div>';
            suggestionsDiv.style.display = 'block';
        }
    });

    selectedKeywordsDiv.addEventListener('click', function(event) {
        console.log('[Keywords] Click event on selected keywords div.');
        if (event.target.classList.contains('remove-keyword')) {
            const keywordToRemove = event.target.dataset.keyword;
            console.log(`[Keywords] Remove keyword clicked: "${keywordToRemove}"`);
            const index = selectedKeywordsArray.indexOf(keywordToRemove);
            if (index > -1) {
                selectedKeywordsArray.splice(index, 1);
                renderSelectedKeywords(selectedKeywordsArray, selectedKeywordsDivId, hiddenInputId);
                console.log(`[Keywords] Keyword "${keywordToRemove}" removed.`);
            }
        } else {
            console.log('[Keywords] Click event not on a remove button.');
        }
    });

    renderSelectedKeywords(selectedKeywordsArray, selectedKeywordsDivId, hiddenInputId);
    console.log('[Keywords] Initial render of selected keywords completed.');
}


// --- INICJALIZACJA ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired. Script start.");

    const minBidDisplay = document.getElementById('min-bid-display');
    const editMinBidDisplay = document.getElementById('edit-min-bid-display');
    const createCampaignBidInput = document.getElementById('create-campaign-bid');
    const editCampaignBidInput = document.getElementById('edit-campaign-bid');

    if(minBidDisplay) minBidDisplay.textContent = MIN_BID.toFixed(2);
    if(editMinBidDisplay) editMinBidDisplay.textContent = MIN_BID.toFixed(2);
    if(createCampaignBidInput) createCampaignBidInput.min = MIN_BID;
    if(editCampaignBidInput) editCampaignBidInput.min = MIN_BID;

    console.log(`Min bid set to ${MIN_BID}.`);

    fetchAndDisplayHomeMessage();
    fetchAndPopulateCities(); // Nadal potrzebne do wypełniania dropdownów miast w formularzach

    setupKeywordTypeahead('create-campaign-keywords', 'create-keyword-suggestions', 'create-selected-keywords', 'create-campaign-selected-keywords-input', createSelectedKeywords);
    setupKeywordTypeahead('edit-campaign-keywords', 'edit-keyword-suggestions', 'edit-selected-keywords', 'edit-campaign-selected-keywords-input', editSelectedKeywords);

    const publicSection = document.getElementById('public-section');
    const authenticatedSection = document.getElementById('authenticated-section');

    if(publicSection && authenticatedSection) {
        showSection('public-section');
        console.log('Initial main section visibility set (showing public).');
    } else {
        console.error('ERROR: Public or authenticated section element not found! Cannot control initial visibility.');
    }

    const authenticatedNav = document.getElementById('authenticated-nav');
    if (authenticatedNav) {
        console.log('Listener: Authenticated nav (#authenticated-nav) found. Attaching click listener.');
        authenticatedNav.addEventListener('click', function(event) {
            const target = event.target;
            if (target.tagName === 'BUTTON' && target.classList.contains('nav-button') && target.dataset.section) {
                console.log(`[Nav] --- KLIKNIĘTO PRZYCISK NAWIGACJI: ${target.dataset.section} ---`);
                const sectionId = target.dataset.section;
                showAuthSection(sectionId);
            } else {
                console.log('[Nav] Kliknięto w elemencie nawigacji, ale nie na przycisku nawigacji (wymagana klasa .nav-button).');
            }
        });
        console.log('Nav click listener attached to #authenticated-nav.');
    } else {
        console.error('BŁĄD KRYTYCZNY: Nie znaleziono elementu NAWIGACJI ZALOGOWANEGO UŻYTKOWNIKA o ID "authenticated-nav"! Nav listeners not attached.');
    }

    console.log("Script initialization complete. Waiting for user interaction.");
});

window.addEventListener('error', event => {
    console.error('UNHANDLED ERROR CAUGHT BY WINDOW LISTENER:', event.error || event);
});