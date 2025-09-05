import { useState, useEffect, useCallback } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

interface HeadSuggestion {
  id: number;
  head: string;
  particulars: string;
  type: 'income' | 'expense';
}

interface HeadAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onHeadSelect?: (head: HeadSuggestion) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'income' | 'expense' | 'all';
  yearId?: number;
}

export function HeadAutocomplete({
  value,
  onChange,
  onHeadSelect,
  placeholder = "Start typing to search existing heads...",
  label = "Head",
  required = false,
  disabled = false,
  className = "",
  type = 'all',
  yearId
}: HeadAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<HeadSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const axiosInstance = useAxios();

  // Clear suggestions when value changes
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.trim().length < 2) return;

      setIsLoadingSuggestions(true);
      try {
        let url = `${API_PATHS.BUDGET_HEADS}?search=${encodeURIComponent(searchTerm)}&pageSize=10`;
        
        // Add type filter if specified
        if (type !== 'all') {
          url += `&type=${type}`;
        }
        
        // Add year filter if specified
        if (yearId) {
          url += `&yearId=${yearId}`;
        }

        const response = await axiosInstance.get(url);
        const suggestions = response.data.data || [];
        setSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error fetching head suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    [axiosInstance, type, yearId]
  );

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);

    // Trigger search if input is long enough
    if (inputValue.trim().length >= 2) {
      debouncedSearch(inputValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: HeadSuggestion) => {
    onChange(suggestion.head);
    if (onHeadSelect) {
      onHeadSelect(suggestion);
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (value.trim().length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Small delay to allow suggestion click to register first
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          required={required}
          disabled={disabled}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={`w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />
        
        {value && !disabled && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={clearInput}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoadingSuggestions ? (
              <div className="p-3 text-center text-gray-500">
                <div className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </div>
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="font-medium text-gray-900">{suggestion.head}</div>
                  <div className="text-sm text-gray-500">{suggestion.particulars}</div>
                  <div className="text-xs text-gray-400 capitalize">{suggestion.type}</div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">No matching heads found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
