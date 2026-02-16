import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect when an element enters the viewport
 * @param {Object} options - Intersection Observer options
 * @returns {[React.RefObject, Boolean]} - [ref, isVisible]
 */
export function useIntersectionObserver(options = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Element is visible
        setIsVisible(true);
        // Stop observing after first visibility (optional, remove if you want continuous observation)
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.15, // Trigger when 15% of element is visible
      ...options,
    });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [options]);

  return [ref, isVisible];
}
