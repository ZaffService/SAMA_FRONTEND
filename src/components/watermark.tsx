"use client";

import { useEffect, useState } from "react";

interface WatermarkProps {
  studentId: string;
  studentEmail: string;
  className?: string;
}

export function Watermark({
  studentId,
  studentEmail,
  className = "",
}: WatermarkProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Changer la position du filigrane toutes les 5 secondes pour le rendre plus difficile à masquer
    const interval = setInterval(() => {
      setPosition({
        x: Math.random() * 80 + 10, // Entre 10% et 90%
        y: Math.random() * 80 + 10,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        opacity: 0.7,
        fontSize: "12px",
        color: "rgba(255, 255, 255, 0.8)",
        background: "rgba(0, 0, 0, 0.5)",
        padding: "4px 8px",
        borderRadius: "4px",
        fontFamily: "monospace",
        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      <div className="text-xs">
        <div>ID: {studentId}</div>
        <div>{studentEmail}</div>
        <div className="text-[10px] mt-1">
          {new Date().toLocaleString("fr-FR")}
        </div>
      </div>
    </div>
  );
}

// Hook pour obtenir les données de l'étudiant (version mockée)
export function useStudentData() {
  const [studentData, setStudentData] = useState<{
    id: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    // Données mockées pour la démo
    const mockStudentData = {
      id: "student-demo-001",
      email: "etudiant@bibocom.fr",
    };

    // Simulation d'un délai
    setTimeout(() => {
      setStudentData(mockStudentData);
      console.log("✅ Watermark data mockée chargée");
    }, 100);
  }, []);

  return studentData;
}
