# My Campaigns - Platforma Zarządzania Kampaniami Reklamowymi

## Spis Treści
- [Opis Projektu](#opis-projektu)
- [Funkcjonalności](#funkcjonalności)
- [Technologie](#technologie)
- [Architektura](#architektura)
- [Instalacja i Uruchomienie](#instalacja-i-uruchomienie)
    - [Wymagania](#wymagania)
    - [Backend (Spring Boot)](#backend-spring-boot)
    - [Frontend (React)](#frontend-react)
- [API Endpoints](#api-endpoints)
- [Struktura Bazy Danych](#struktura-bazy-danych)

## Opis Projektu

`My Campaigns` to platforma umożliwiająca sprzedawcom (sellerom) tworzenie, zarządzanie i monitorowanie kampanii reklamowych. Aplikacja składa się z dwóch głównych części: backendu opartego na Spring Boot, zarządzającego logiką biznesową i danymi, oraz frontendu w React.js, zapewniającego intuicyjny interfejs użytkownika.

Główne cele projektu to:
- Umożliwienie sprzedawcom rejestracji i logowania.
- Zapewnienie funkcjonalności tworzenia, edycji i usuwania kampanii reklamowych.
- Wyświetlanie listy własnych kampanii oraz wszystkich aktywnych kampanii w systemie.
- Implementacja zaawansowanych opcji wyszukiwania kampanii (po nazwie, mieście, lokalizacji z promieniem, oraz lokalizacji ze słowami kluczowymi).
- Zarządzanie saldem konta sprzedawcy.

## Funkcjonalności

### Dla Sprzedawców (Użytkowników Zalogowanych):
- **Rejestracja Konta**: Możliwość założenia nowego konta sprzedawcy z początkowym saldem.
- **Logowanie/Wylogowywanie**: Bezpieczne uwierzytelnianie użytkowników.
- **Panel Użytkownika (Dashboard)**: Centralne miejsce do zarządzania wszystkimi operacjami.
    - Wyświetlanie aktualnego salda konta.
    - Przegląd własnych kampanii (aktywnych i nieaktywnych).
- **Tworzenie Kampanii**: Intuicyjny formularz do definiowania nowych kampanii, z możliwością przypisywania miast i słów kluczowych.
- **Edycja Kampanii**: Modyfikacja szczegółów istniejących kampanii (nazwa, słowa kluczowe, fundusz, status, miasto, cena za kliknięcie).
- **Usuwanie Kampanii**: Możliwość usunięcia kampanii.
- **Zarządzanie Słowami Kluczowymi**: Dynamiczne dodawanie i usuwanie słów kluczowych do kampanii, z sugestiami opartymi na istniejących danych.

### Funkcjonalności Ogólne:
- **Przeglądanie Wszystkich Kampanii**: Dostęp do listy wszystkich kampanii w systemie (bez konieczności logowania do pełnego panelu).
- **Zaawansowane Wyszukiwanie Kampanii**:
    - Wyszukiwanie po nazwie kampanii.
    - Wyszukiwanie po nazwie miasta.
    - Wyszukiwanie po lokalizacji (miasto + promień w kilometrach).
    - Wyszukiwanie po lokalizacji (miasto + promień) i słowach kluczowych.

## Technologie

### Backend:
- **Java 21**
- **Spring Boot 3.4.5**
- **Spring Data JPA**: Do interakcji z bazą danych.
- **Hibernate**: Implementacja JPA.
- **Gradle**: Zarządzanie zależnościami i budowaniem projektu.
- **H2 Database**: Baza danych w pamięci (domyślnie, można skonfigurować inną).
- **Lombok**: Ułatwienie pisania boilerplate code.
- **RESTful API**: Do komunikacji z frontendem.
- **Basic Authentication**: Uwierzytelnianie użytkowników.

### Frontend:
- **React.js 18+**
- **Vite**: Szybki bundler i narzędzie deweloperskie.
- **JavaScript (ES6+)**
- **HTML5 & CSS3**: Struktura i stylizacja.
- **Axios (lub wbudowany Fetch API)**: Do wykonywania zapytań HTTP.
- **React Context API**: Do zarządzania globalnym stanem (np. autoryzacja).

## Architektura

Aplikacja jest zbudowana w architekturze klient-serwer.

- **Frontend** (React.js) jest odpowiedzialny za interfejs użytkownika i wysyłanie żądań do API.
- **Backend** (Spring Boot) odpowiada za logikę biznesową, persystencję danych (H2 Database) i wystawianie RESTful API.

Komunikacja między frontendem a backendem odbywa się poprzez RESTful API. Uwierzytelnianie użytkowników realizowane jest za pomocą Basic Authentication.

---

---

## Instalacja i Uruchomienie

### Wymagania
Upewnij się, że masz zainstalowane:
- **Java Development Kit (JDK) 21**
- **Node.js 18.x lub nowszy**

### Kroki instalacji i uruchomienia

1.  **Sklonuj repozytorium**:
    Otwórz terminal i sklonuj projekt. Następnie przejdź do głównego katalogu projektu (`mandatory-task-demo`):
    ```bash
    git clone git@github.com:KariPL2/mandatory-task-demo.git
    cd mandatory-task-demo
    ```
2.  **Zbuduj Frontend**:
    Przejdź do katalogu `frontend`, zainstaluj zależności i zbuduj projekt. To wygeneruje statyczne pliki frontendu, które zostaną później spakowane razem z backendem.
    ```bash
    cd frontend
    npm install
    npm run build
    cd .. # Wróć do głównego katalogu projektu (mandatory-task-demo)
    ```
3.  **Zbuduj Backend**:
    Przejdź spowrotem do katalogu `mandatory-task-demo` i zbuduj aplikację Spring Boot. Podczas tego procesu, zbudowane pliki frontendu zostaną automatycznie skopiowane do zasobów backendu.
    ```bash
    ./gradlew build
    ```
    Ten krok stworzy wykonywalny plik `.jar` (np. `demo-0.0.1-SNAPSHOT.jar`) w katalogu `build/libs`.
4.  **Uruchom aplikację**:
    Po pomyślnym zbudowaniu obu części, uruchom aplikację Spring Boot. Spakowana aplikacja serwuje zarówno funkcjonalność backendową, jak i statyczne pliki frontendu.
    ```bash
    java -jar build/libs/demo-0.0.1-SNAPSHOT.jar
    ```
    Cała aplikacja (backend i frontend) będzie dostępna pod adresem **`http://localhost:8080`**. Otwórz przeglądarkę i przejdź pod ten adres, aby korzystać z platformy.

---
## API Endpoints

Poniżej przedstawiono kluczowe endpointy API dostępne w aplikacji wraz z przykładami użycia i wymaganymi parametrami. Bazowy URL dla wszystkich endpointów to `http://localhost:8080`.

### Uwierzytelnianie i Sprzedawcy

-   `POST /home/register`
    -   **Opis**: Rejestracja nowego konta sprzedawcy.
    -   **Wymaga**: `Content-Type: application/json`
    -   **Body**:
        ```json
        {
            "username": "nowySprzedawca",
            "email": "email@example.com",
            "password": "mojeTajneHaslo",
            "balance": 100.00
        }
        ```
    -   **Odpowiedź**: Status 200 OK w przypadku sukcesu.

-   `GET /sellers/me`
    -   **Opis**: Pobranie danych zalogowanego sprzedawcy.
    -   **Wymaga**: `Authorization: Basic [Base64_zakodowany_login_i_haslo]`
        -   Przykład: `Authorization: Basic YWRtaW46cGFzc3dvcmQ=` (dla `admin:password`)
    -   **Odpowiedź**: Dane sprzedawcy w formacie JSON.
        ```json
        {
            "id": "uuid-sprzedawcy",
            "username": "nazwaSprzedawcy",
            "email": "email@example.com",
            "balance": 123.45
        }
        ```

### Kampanie

-   `GET /campaigns`
    -   **Opis**: Pobranie listy kampanii należących do zalogowanego sprzedawcy.
    -   **Wymaga**: `Authorization: Basic [Base64_zakodowany_login_i_haslo]`
    -   **Odpowiedź**: Lista obiektów kampanii w formacie JSON.
        ```json
        [
            {
                "id": "uuid-kampanii-1",
                "name": "Kampania testowa A",
                "keywords": ["telewizory", "elektronika"],
                "price": 0.50,
                "fund": 50.00,
                "status": "ACTIVE",
                "city": "Warszawa",
                "sellerId": "uuid-sprzedawcy"
            }
        ]
        ```

-   `POST /campaigns`
    -   **Opis**: Tworzenie nowej kampanii.
    -   **Wymaga**: `Authorization: Basic [Base64_zakodowany_login_i_haslo]`, `Content-Type: application/json`
    -   **Body**:
        ```json
        {
            "name": "Nowa Kampania",
            "keywords": ["buty", "sportowe"],
            "price": 0.30,
            "fund": 100.00,
            "status": "ACTIVE",
            "city": "Kraków"
        }
        ```
    -   **Odpowiedź**: Utworzona kampania w formacie JSON.

-   `PUT /campaigns/{campaignId}`
    -   **Opis**: Edycja istniejącej kampanii.
    -   **Wymaga**: `Authorization: Basic [Base64_zakodowany_login_i_haslo]`, `Content-Type: application/json`
    -   **Path Variable**: `{campaignId}` - ID kampanii do edycji.
    -   **Body**: (Podobnie jak `POST`, ale z uwzględnieniem ID)
        ```json
        {
            "id": "uuid-kampanii-do-edycji",
            "name": "Zaktualizowana Kampania",
            "keywords": ["obuwie", "damskie"],
            "fund": 75.00,
            "status": "PAUSED",
            "city": "Wrocław"
        }
        ```
    -   **Odpowiedź**: Zaktualizowana kampania w formacie JSON.

-   `DELETE /campaigns/{campaignId}`
    -   **Opis**: Usuwanie kampanii.
    -   **Wymaga**: `Authorization: Basic [Base64_zakodowany_login_i_haslo]`
    -   **Path Variable**: `{campaignId}` - ID kampanii do usunięcia.
    -   **Odpowiedź**: Status 204 No Content w przypadku sukcesu.

-   `GET /campaigns/all`
    -   **Opis**: Pobranie listy wszystkich aktywnych kampanii w systemie.
    -   **Wymaga**: Brak uwierzytelniania.
    -   **Odpowiedź**: Lista obiektów kampanii w formacie JSON.

### Wyszukiwanie Kampanii (Publiczne)

-   `GET /campaigns/all/by-name/{name}`
    -   **Opis**: Wyszukiwanie kampanii po dokładnej nazwie.
    -   **Path Variable**: `{name}` - Nazwa kampanii.
    -   **Przykład**: `/campaigns/all/by-name/Testowa%20Kampania`

-   `GET /campaigns/all/by-city/{city}`
    -   **Opis**: Wyszukiwanie kampanii po dokładnej nazwie miasta.
    -   **Path Variable**: `{city}` - Nazwa miasta.
    -   **Przykład**: `/campaigns/all/by-city/Kraków`

-   `GET /campaigns/search-by-location?searchCityName={city}&searchRadius={radius}`
    -   **Opis**: Wyszukiwanie kampanii po lokalizacji (miasto i promień w kilometrach).
    -   **Query Parameters**:
        -   `searchCityName`: Nazwa miasta.
        -   `searchRadius`: Promień w kilometrach.
    -   **Przykład**: `/campaigns/search-by-location?searchCityName=Gdańsk&searchRadius=50`

-   `GET /campaigns/search-by-location-and-keywords?searchCityName={city}&searchRadius={radius}&keywords={keyword1}&keywords={keyword2}...`
    -   **Opis**: Wyszukiwanie kampanii po lokalizacji (miasto i promień) oraz po słowach kluczowych.
    -   **Query Parameters**:
        -   `searchCityName`: Nazwa miasta.
        -   `searchRadius`: Promień w kilometrach.
        -   `keywords`: Jedno lub więcej słów kluczowych (parametr `keywords` może być powtórzony).
    -   **Przykład**: `/campaigns/search-by-location-and-keywords?searchCityName=Poznań&searchRadius=20&keywords=elektronika&keywords=komputery`

### Słowa Kluczowe

-   `GET /keywords/suggest?q={query}`
    -   **Opis**: Sugestie słów kluczowych na podstawie wprowadzonego ciągu znaków.
    -   **Query Parameter**: `q` - Ciąg znaków do wyszukania.
    -   **Przykład**: `/keywords/suggest?q=tel`
    -   **Odpowiedź**: Lista sugerowanych słów kluczowych w formacie JSON.
        ```json
        ["telefony", "telewizory", "telekomunikacja"]
        ```

## Struktura Bazy Danych

Aplikacja wykorzystuje bazę danych H2 (domyślnie, w trybie pamięciowym) z poniższymi encjami i ich atrybutami:

-   **`SELLER`**: Reprezentuje sprzedawcę (użytkownika).
    -   `id`: Unikalny identyfikator UUID (klucz główny).
    -   `username`: Nazwa użytkownika (unikalna).
    -   `password`: Hasło użytkownika (zakodowane).
    -   `email`: Adres e-mail sprzedawcy.
    -   `balance`: Aktualne saldo konta sprzedawcy.

-   **`CAMPAIGN`**: Reprezentuje kampanię reklamową.
    -   `id`: Unikalny identyfikator UUID (klucz główny).
    -   `name`: Nazwa kampanii.
    -   `price`: Maksymalna cena za kliknięcie (CPC).
    -   `fund`: Całkowity budżet kampanii.
    -   `status`: Status kampanii (np. `ACTIVE`, `PAUSED`).
    -   `city`: Miasto, w którym kampania jest aktywna.
    -   `seller_id`: Klucz obcy do tabeli `SELLER`, wskazujący właściciela kampanii.

-   **`KEYWORD`**: Reprezentuje pojedyncze słowo kluczowe.
    -   `id`: Unikalny identyfikator UUID (klucz główny).
    -   `word`: Słowo kluczowe (unikalne).

-   **`CAMPAIGN_KEYWORDS`**: Tabela łącząca (join table) dla relacji Many-to-Many między `CAMPAIGN` a `KEYWORD`.
    -   `campaign_id`: Klucz obcy do tabeli `CAMPAIGN`.
    -   `keyword_id`: Klucz obcy do tabeli `KEYWORD`.

### Relacje:

-   **`SELLER`** ma relację **One-to-Many** z **`CAMPAIGN`**: Jeden sprzedawca może utworzyć wiele kampanii.
-   **`CAMPAIGN`** ma relację **Many-to-Many** z **`KEYWORD`**: Jedna kampania może być powiązana z wieloma słowami kluczowymi, a jedno słowo kluczowe może być powiązane z wieloma kampaniami.

