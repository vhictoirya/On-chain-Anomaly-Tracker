import React from 'react';
import { Heart, Code } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
            <Code className="w-4 h-4" />
            <span className="text-sm">
              Built with React, TypeScript & FastAPI
            </span>
          </div>
          <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
            Made with <Heart className="w-4 h-4 text-red-500" /> for blockchain security
          </div>
        </div>
      </div>
    </footer>
  );
};