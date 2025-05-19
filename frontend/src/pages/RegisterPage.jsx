import { useState } from 'react';
import './Form.css';

// Accept the new prop from App.jsx
function RegisterPage({ onRegistrationSuccess }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        balance: 0.0,
    });
    const [isLoading, setIsLoading] = useState(false); // Add loading state for the form
    const [error, setError] = useState(null); // Add error state for the form


    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setIsLoading(true); // Set loading state

        try {
            const response = await fetch('http://localhost:8080/home/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    balance: parseFloat(formData.balance),
                }),
            });

            if (response.ok) {
                alert('Rejestracja udana!');
                // Call the callback function to navigate to the login page
                if (onRegistrationSuccess) {
                    // Add a small timeout before navigating
                    setTimeout(() => {
                        onRegistrationSuccess();
                    }, 50); // 50ms delay
                }
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Błąd rejestracji';
                setError(errorMessage); // Set error state
                alert('Błąd: ' + errorMessage);
            }
        } catch (error) {
            console.error('Błąd połączenia:', error);
            const connectionError = 'Nie można połączyć z serwerem.';
            setError(connectionError); // Set error state
            alert(connectionError);
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h2>Rejestracja</h2>
            {error && <p style={{color: 'red'}}>{error}</p>} {/* Display form-specific errors */}
            <label>
                Nazwa użytkownika:
                <input type="text" name="username" value={formData.username} onChange={handleChange} required />
            </label>
            <label>
                Email:
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>
            <label>
                Hasło:
                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </label>
            <label>
                Saldo początkowe:
                <input type="number" name="balance" step="0.01" value={formData.balance} onChange={handleChange} required />
            </label>
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Rejestrowanie...' : 'Zarejestruj się'} {/* Button text reflects loading state */}
            </button>
        </form>
    );
}

export default RegisterPage;
