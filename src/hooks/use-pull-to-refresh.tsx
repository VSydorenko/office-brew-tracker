import { useState, useEffect } from 'react';

/**
 * Hook для pull-to-refresh функціональності
 */
export const usePullToRefresh = (onRefresh: () => Promise<void> | void) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const threshold = 80; // Мінімальна відстань для refresh

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
        setIsPulling(distance > threshold);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && isPulling) {
      await onRefresh();
    }
    
    setStartY(0);
    setPullDistance(0);
    setIsPulling(false);
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pullDistance]);

  return { isPulling, pullDistance };
};