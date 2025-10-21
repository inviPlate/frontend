import React from 'react';

interface MemberNameInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  suggestions: string[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  showSuggestions: boolean;
  showAddNew?: boolean;
  onAddNew?: () => void;
}

export function MemberNameInput({
  label = 'Name',
  value,
  onChange,
  onClear,
  onBlur,
  onFocus,
  suggestions,
  isLoading,
  onSelectSuggestion,
  showSuggestions,
  showAddNew = false,
  onAddNew,
}: MemberNameInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="Start typing to search names..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={onClear}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {showSuggestions && (isLoading || suggestions.length > 0 || showAddNew) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
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
              <>
                {suggestions.map((suggestion, suggestionIndex) => (
                  <button
                    key={suggestionIndex}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    onClick={() => onSelectSuggestion(suggestion)}
                  >
                    <div className="font-medium text-gray-900">{suggestion}</div>
                  </button>
                ))}
                {showAddNew && onAddNew && (
                  <div className="px-3 py-2 border-t border-gray-200 bg-blue-50">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                      onClick={onAddNew}
                    >
                      Add "{value}" to members
                    </button>
                  </div>
                )}
              </>
            ) : (
              showAddNew && onAddNew ? (
                <div className="p-3 text-center text-gray-500">
                  No matching names found
                  <div className="mt-2">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                      onClick={onAddNew}
                    >
                      Add "{value}" to members
                    </button>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberNameInput;


