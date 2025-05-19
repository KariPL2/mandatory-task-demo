// src/context/AuthContext.js
import React, { createContext } from 'react'; // Remove useState import

export const AuthContext = createContext(null);

// This component is not strictly necessary if using the hook directly in App.jsx,
// but can be useful for wrapping parts of the app if needed.
// For this setup, App.jsx directly uses the context provider.