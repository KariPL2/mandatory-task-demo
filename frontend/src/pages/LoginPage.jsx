import React, { useState } from 'react';

function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        const authHeader = 'Basic ' + btoa(username + ':' + password);

        fetch('http://localhost:8080/sellers/me', {
            headers: {
                'Authorization': authHeader
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Invalid credentials');
                return res.json();
            })
            .then(user => {
                setError(null);
                onLogin({ username, password, user }); // przekazujesz dane wyżej (np. do kontekstu)
            })
            .catch(err => setError(err.message));
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <button type="submit">Zaloguj się</button>
            {error && <p style={{color: 'red'}}>{error}</p>}
        </form>
    );

}
export default LoginPage;