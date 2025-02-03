'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface PomodoroProps {
  onComplete?: () => void;
}

export default function Pomodoro({ onComplete }: PomodoroProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            onComplete?.(); // Chama o callback quando o timer termina
            return 25 * 60;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      // Play sound when timer ends
      const audio = new Audio('/notification.mp3');
      audio.play();
      
      // Switch between work and break
      if (isBreak) {
        setTimeLeft(25 * 60); // Back to work: 25 minutes
      } else {
        setTimeLeft(5 * 60); // Break time: 5 minutes
      }
      setIsBreak(!isBreak);
      setIsRunning(false);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRunning, timeLeft, isBreak, onComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(25 * 60);
    setIsRunning(false);
    setIsBreak(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "text-sm font-mono transition-colors",
        isBreak ? "text-green-400" : "text-turquoise"
      )}>
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
          onClick={toggleTimer}
        >
          {isRunning ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
          onClick={resetTimer}
        >
          <ArrowPathIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 