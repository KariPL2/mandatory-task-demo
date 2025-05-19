import React, { useState, useEffect } from 'react';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { AuthContext } from './context/AuthContext';
import './App.css';
import './pages/Form.css';

function App() {
    const [page, setPage] = useState('home'); // home, login, register, dashboard
    const [userData, setUserData] = useState(null); // { username, password, user }

    // Check for saved user data on mount (optional, for persistence)
    useEffect(() => {
        const savedUser = localStorage.getItem('userData');
        if (savedUser) {
            setUserData(JSON.parse(savedUser));
            setPage('dashboard'); // Go directly to dashboard if user data is found
        }
    }, []);

    const handleLogin = (data) => {
        setUserData(data);
        localStorage.setItem('userData', JSON.stringify(data)); // Save user data (optional)
        setPage('dashboard'); // Go to dashboard after login
    };

    const handleLogout = () => {
        setUserData(null);
        localStorage.removeItem('userData'); // Clear saved user data (optional)
        setPage('home'); // Go back to home after logout
    };

    // New handler for successful registration
    const handleRegistrationSuccess = () => {
        setPage('login'); // Navigate to the login page
    };


    // Provide auth context value
    const authContextValue = {
        user: userData, // User data includes username, password, and fetched user info
        login: handleLogin,
        logout: handleLogout,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
                {/* Show home buttons only if not logged in and on home page */}
                {page === 'home' && !userData && (
                    <>
                        <h1>Witaj na stronie</h1>
                        <button onClick={() => setPage('login')} style={{ marginRight: '1rem' }}>
                            Zaloguj się
                        </button>
                        <button onClick={() => setPage('register')}>Zarejestruj się</button>
                    </>
                )}

                {/* Render LoginPage if page is 'login' */}
                {page === 'login' && <LoginPage onLogin={handleLogin} />}

                {/* Render RegisterPage if page is 'register' */}
                {/* Pass the new callback function */}
                {page === 'register' && <RegisterPage onRegistrationSuccess={handleRegistrationSuccess} />}

                {/* Render Dashboard if logged in */}
                {userData && <Dashboard />}

                {/* If logged in and page is home (e.g., after manual URL change), redirect to dashboard */}
                {/* This case is now less likely due to useEffect redirect */}
                {/* {page === 'home' && userData && <Dashboard />} */}

            </div>
        </AuthContext.Provider>
    );
}

export default App;
