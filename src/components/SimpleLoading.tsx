"use client";

import React from "react";

export default function SimpleLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Chargement...
        </h2>
        <p className="text-gray-500">Veuillez patienter</p>
      </div>
    </div>
  );
}
