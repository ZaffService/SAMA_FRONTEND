"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  growingSize?: boolean;
}

export function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  className = "",
  onComplete,
  growingSize = false,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;

    const startTyping = () => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        setProgress(currentIndex / text.length);
        currentIndex++;
        timeout = setTimeout(startTyping, speed);
      } else {
        setIsComplete(true);
        setProgress(1);
        onComplete?.();
      }
    };

    // Reset quand le texte change
    setDisplayedText("");
    setIsComplete(false);
    setProgress(0);

    // Start après le délai
    timeout = setTimeout(startTyping, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay, onComplete]);

  const fontSizeMultiplier = growingSize ? 0.75 + progress * 0.25 : 1;

  return (
    <span
      className={`font-black tracking-tight inline-block ${className}`}
      style={{
        fontSize: `${fontSizeMultiplier * 100}%`,
        lineHeight: 1.1,
        transition: "font-size 75ms ease-out",
      }}
    >
      {displayedText}
      {!isComplete && <span className="animate-pulse ml-1">|</span>}
    </span>
  );
}
