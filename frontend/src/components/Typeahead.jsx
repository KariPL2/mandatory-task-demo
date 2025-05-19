// src/components/Typeahead.jsx
import React, { useState, useEffect, useRef } from 'react';
// Reusing Form.css for suggestions list styles

function Typeahead({ onInputChange, suggestions, onSelect, placeholder }) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);

    const handleChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        onInputChange(value);
        setShowSuggestions(true);
    };

    const handleSelectSuggestion = (suggestion, event) => {
        console.log("Typeahead: Suggestion clicked:", suggestion);
        // event.stopPropagation(); // Keep or remove, timeout is often more effective here

        // Call the parent's select handler immediately to update the state
        onSelect(suggestion);

        // Introduce a small delay before clearing input and hiding suggestions
        // This allows the state update and re-render to potentially complete
        // before the underlying area becomes clickable again.
        setTimeout(() => {
            setInputValue('');
            setShowSuggestions(false);
        }, 100); // Try a 100ms delay

    };

    // Hide suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [inputRef]);


    return (
        <div style={{ position: 'relative' }} ref={inputRef}>
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                placeholder={placeholder}
            />
            {showSuggestions && suggestions && suggestions.length > 0 && (
                <ul className="suggestions-list" style={{ position: 'absolute', width: '100%', zIndex: 100 }}>
                    {suggestions.map((suggestion, index) => (
                        // Pass the event object to the handler
                        <li key={index} onClick={(event) => handleSelectSuggestion(suggestion, event)}>
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Typeahead;