"use client";

import { useEffect, useState } from "react";

interface AnimatedMascotProps {
  message?: string;
}

export function AnimatedMascot({
  message = "Connecte-toi !",
}: AnimatedMascotProps) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isWaving, setIsWaving] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Mouvement des yeux qui suivent (simplifié pour éviter les problèmes d'hydratation)
  useEffect(() => {
    const positions = [
      { x: 0, y: 0 },
      { x: 1, y: -0.5 },
      { x: -1, y: 0.5 },
      { x: 0.5, y: -1 },
      { x: -0.5, y: 1 },
    ];
    let index = 0;
    const interval = setInterval(() => {
      setEyePosition(positions[index]);
      index = (index + 1) % positions.length;
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Clignement des yeux
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Animation de salut
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1000);
    }, 4000);
    return () => clearInterval(waveInterval);
  }, []);

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-2xl"
        style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.3))" }}
      >
        {/* Cercle de fond avec gradient */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE4B5" />
            <stop offset="100%" stopColor="#FFD89B" />
          </linearGradient>
          <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D1B0E" />
            <stop offset="100%" stopColor="#4A2F1A" />
          </linearGradient>
          <linearGradient
            id="shirtGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#0052CC" />
          </linearGradient>
        </defs>

        {/* Corps/T-shirt */}
        <ellipse
          cx="100"
          cy="175"
          rx="45"
          ry="30"
          fill="url(#shirtGradient)"
          className="animate-pulse"
          style={{ animationDuration: "3s" }}
        />

        {/* Cou */}
        <rect
          x="90"
          y="140"
          width="20"
          height="20"
          fill="url(#bgGradient)"
          rx="5"
        />

        {/* Tête */}
        <ellipse cx="100" cy="90" rx="55" ry="60" fill="url(#bgGradient)" />

        {/* Cheveux arrière */}
        <path
          d="M50 70 Q45 30 80 25 Q100 20 120 25 Q155 30 150 70 Q148 50 130 40 Q100 30 70 40 Q52 50 50 70"
          fill="url(#hairGradient)"
        />

        {/* Cheveux devant (frange) */}
        <path
          d="M60 65 Q65 45 85 42 Q95 40 100 42 Q75 50 70 65 Z"
          fill="url(#hairGradient)"
        />
        <path
          d="M140 65 Q135 45 115 42 Q105 40 100 42 Q125 50 130 65 Z"
          fill="url(#hairGradient)"
        />

        {/* Oreilles */}
        <ellipse cx="48" cy="90" rx="8" ry="12" fill="url(#bgGradient)" />
        <ellipse cx="152" cy="90" rx="8" ry="12" fill="url(#bgGradient)" />

        {/* Sourcils avec expression amicale */}
        <path
          d="M65 70 Q75 65 85 70"
          fill="none"
          stroke="#4A2F1A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M115 70 Q125 65 135 70"
          fill="none"
          stroke="#4A2F1A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Yeux */}
        <g className="transition-transform duration-500">
          {/* Oeil gauche */}
          <ellipse
            cx="75"
            cy="85"
            rx={isBlinking ? 10 : 10}
            ry={isBlinking ? 2 : 12}
            fill="white"
            className="transition-all duration-100"
          />
          {!isBlinking && (
            <>
              <circle
                cx={75 + eyePosition.x}
                cy={85 + eyePosition.y}
                r="6"
                fill="#2D1B0E"
                className="transition-all duration-300"
              />
              <circle
                cx={73 + eyePosition.x}
                cy={83 + eyePosition.y}
                r="2"
                fill="white"
              />
            </>
          )}

          {/* Oeil droit */}
          <ellipse
            cx="125"
            cy="85"
            rx={isBlinking ? 10 : 10}
            ry={isBlinking ? 2 : 12}
            fill="white"
            className="transition-all duration-100"
          />
          {!isBlinking && (
            <>
              <circle
                cx={125 + eyePosition.x}
                cy={85 + eyePosition.y}
                r="6"
                fill="#2D1B0E"
                className="transition-all duration-300"
              />
              <circle
                cx={123 + eyePosition.x}
                cy={83 + eyePosition.y}
                r="2"
                fill="white"
              />
            </>
          )}
        </g>

        {/* Nez */}
        <ellipse cx="100" cy="100" rx="4" ry="5" fill="#E8B88A" />

        {/* Joues roses */}
        <ellipse cx="60" cy="105" rx="10" ry="6" fill="#FFB6C1" opacity="0.6" />
        <ellipse
          cx="140"
          cy="105"
          rx="10"
          ry="6"
          fill="#FFB6C1"
          opacity="0.6"
        />

        {/* Sourire */}
        <path
          d="M80 115 Q100 135 120 115"
          fill="none"
          stroke="#2D1B0E"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Dents visibles dans le sourire */}
        <path d="M85 117 Q100 125 115 117" fill="white" stroke="none" />

        {/* Bras gauche (statique) */}
        <ellipse cx="55" cy="165" rx="12" ry="18" fill="url(#shirtGradient)" />
        <ellipse cx="50" cy="175" rx="8" ry="8" fill="url(#bgGradient)" />

        {/* Bras droit (qui salue) */}
        <g
          style={{
            transformOrigin: "145px 160px",
            transform: isWaving ? "rotate(-20deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease-in-out",
          }}
        >
          <ellipse
            cx="145"
            cy="160"
            rx="12"
            ry="20"
            fill="url(#shirtGradient)"
          />
          <g
            style={{
              transformOrigin: "155px 145px",
              transform: isWaving ? "rotate(-30deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease-in-out 0.1s",
            }}
          >
            <ellipse cx="155" cy="145" rx="8" ry="12" fill="url(#bgGradient)" />
            {/* Main qui fait coucou */}
            <ellipse
              cx="160"
              cy="135"
              rx="10"
              ry="10"
              fill="url(#bgGradient)"
            />
            {/* Doigts */}
            <ellipse cx="155" cy="125" rx="3" ry="6" fill="url(#bgGradient)" />
            <ellipse cx="162" cy="124" rx="3" ry="6" fill="url(#bgGradient)" />
            <ellipse cx="169" cy="126" rx="3" ry="5" fill="url(#bgGradient)" />
          </g>
        </g>

        {/* Lunettes stylées (optionnel, donne un côté studieux) */}
        <circle
          cx="75"
          cy="85"
          r="15"
          fill="none"
          stroke="#333"
          strokeWidth="2"
        />
        <circle
          cx="125"
          cy="85"
          r="15"
          fill="none"
          stroke="#333"
          strokeWidth="2"
        />
        <path d="M90 85 L110 85" stroke="#333" strokeWidth="2" />
        <path d="M60 85 L48 80" stroke="#333" strokeWidth="2" />
        <path d="M140 85 L152 80" stroke="#333" strokeWidth="2" />
      </svg>

      {/* Bulle de dialogue animée */}
      <div
        className={`absolute -top-2 -right-4 bg-white rounded-2xl px-4 py-2 shadow-lg transform transition-all duration-500 ${
          isWaving ? "scale-110 -translate-y-2" : "scale-100"
        }`}
      >
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white transform rotate-45" />
        <p className="text-sm font-semibold text-gray-800 relative z-10">
          {isWaving ? "Salut ! 👋" : message}
        </p>
      </div>

      {/* Particules/étoiles flottantes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-300 rounded-full animate-float opacity-80" />
        <div className="absolute top-12 right-8 w-3 h-3 bg-pink-300 rounded-full animate-float-delayed opacity-80" />
        <div className="absolute bottom-20 left-8 w-2 h-2 bg-blue-300 rounded-full animate-float opacity-80" />
        <div className="absolute bottom-32 right-4 w-2 h-2 bg-green-300 rounded-full animate-float-delayed opacity-80" />
      </div>
    </div>
  );
}
