// LoadingScreen.jsx
import React from 'react';
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-cream flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#2D6A4F] rounded-2xl flex items-center justify-center text-white text-3xl font-syne font-bold mx-auto mb-4 animate-pulse">E</div>
        <p className="text-gray-500 text-sm">Loading EcoTrade...</p>
      </div>
    </div>
  );
}
