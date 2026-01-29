/**
 * Fact Card Overlay Component
 *
 * Displays fact cards over the puzzle video at strategic intervals
 * to maintain viewer engagement
 */

import React, { useEffect, useState } from 'react';
import { FactCard } from '../../types-longform';

interface FactCardOverlayProps {
  factCards: FactCard[];
  sceneStartTime: number; // Timestamp when scene started (Date.now())
  isActive: boolean;
}

interface ActiveCard extends FactCard {
  id: string;
  isVisible: boolean;
  shouldRemove: boolean;
}

export const FactCardOverlay: React.FC<FactCardOverlayProps> = ({
  factCards,
  sceneStartTime,
  isActive,
}) => {
  const [activeCards, setActiveCards] = useState<ActiveCard[]>([]);

  useEffect(() => {
    if (!isActive || factCards.length === 0) {
      setActiveCards([]);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Schedule all fact cards
    factCards.forEach((card, index) => {
      const showDelay = card.timestamp * 1000; // Convert to milliseconds
      const hideDuration = card.duration * 1000;

      // Timer to show card
      const showTimer = setTimeout(() => {
        const newCard: ActiveCard = {
          ...card,
          id: `fact-${index}-${Date.now()}`,
          isVisible: true,
          shouldRemove: false,
        };

        setActiveCards(prev => [...prev, newCard]);

        // Timer to hide card
        const hideTimer = setTimeout(() => {
          setActiveCards(prev =>
            prev.map(c =>
              c.id === newCard.id
                ? { ...c, isVisible: false, shouldRemove: true }
                : c
            )
          );

          // Timer to remove card from DOM
          const removeTimer = setTimeout(() => {
            setActiveCards(prev => prev.filter(c => c.id !== newCard.id));
          }, 500); // Wait for fade-out animation

          timers.push(removeTimer);
        }, hideDuration);

        timers.push(hideTimer);
      }, showDelay);

      timers.push(showTimer);
    });

    // Cleanup
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      setActiveCards([]);
    };
  }, [factCards, sceneStartTime, isActive]);

  if (!isActive) return null;

  return (
    <div className="fact-card-overlay fixed inset-0 pointer-events-none z-30">
      {activeCards.map(card => {
        const positionClasses = {
          top: 'top-8 left-1/2 -translate-x-1/2',
          bottom: 'bottom-8 left-1/2 -translate-x-1/2',
          side: 'top-1/2 right-8 -translate-y-1/2',
          center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        };

        const animationClasses = {
          fade: 'animate-fade-in',
          slide: 'animate-slide-up',
          pop: 'animate-pop-in',
        };

        const typeStyles = {
          fact: 'bg-blue-500/90 border-blue-400',
          quote: 'bg-purple-500/90 border-purple-400',
          question: 'bg-cyan-500/90 border-cyan-400',
          countdown: 'bg-orange-500/90 border-orange-400',
          statistic: 'bg-green-500/90 border-green-400',
        };

        return (
          <div
            key={card.id}
            className={`
              absolute ${positionClasses[card.position]}
              ${animationClasses[card.animation || 'fade']}
              ${typeStyles[card.type]}
              px-6 py-4 rounded-lg border-2 shadow-2xl
              max-w-md
              transition-opacity duration-500
              ${card.isVisible ? 'opacity-100' : 'opacity-0'}
              ${card.shouldRemove ? 'pointer-events-none' : ''}
            `}
          >
            <p className="text-white text-base font-semibold text-center leading-relaxed">
              {card.content}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default FactCardOverlay;
