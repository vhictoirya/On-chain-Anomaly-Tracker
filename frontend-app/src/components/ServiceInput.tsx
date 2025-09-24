import React, { useState } from 'react';
import { Search, Hash, Wallet } from 'lucide-react';
import { detectInputType } from '../utils/validation';

interface SearchInputProps {
  onSearch: (value: string, type: 'address' | 'transaction') => void;
  isLoading?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading = false }) => {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'address' | 'transaction' | 'invalid' | null>(null);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const type = detectInputType(value);
      setInputType(type);
    } else {
      setInputType(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && inputType && inputType !== 'invalid') {
      onSearch(input.trim(), inputType);
    }
  };

  const getInputIcon = () => {
    if (inputType === 'address') return <Wallet className="w-5 h-5 text-green-500" />;
    if (inputType === 'transaction') return <Hash className="w-5 h-5 text-blue-500" />;
    return <Search className="w-5 h-5 text-gray-400" />;
  };

  const getPlaceholder = () => {
    return "Enter Ethereum address (0x...) or transaction hash (0x...)";
  };

  const isValidInput = inputType && inputType !== 'invalid';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {getInputIcon()}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={getPlaceholder()}
            className={`w-full pl-12 pr-32 py-4 text-lg rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-100 ${
              inputType === 'invalid' && input.trim()
                ? 'border-red-300 bg-red-50'
                : isValidInput
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!isValidInput || isLoading}
            className="absolute inset-y-0 right-0 px-6 m-1 bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        
        {input.trim() && (
          <div className="mt-2 text-sm">
            {inputType === 'address' && (
              <span className="text-green-600 flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                Ethereum Address detected
              </span>
            )}
            {inputType === 'transaction' && (
              <span className="text-blue-600 flex items-center gap-1">
                <Hash className="w-4 h-4" />
                Transaction Hash detected
              </span>
            )}
            {inputType === 'invalid' && (
              <span className="text-red-600">
                Invalid format. Please enter a valid Ethereum address or transaction hash.
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
};