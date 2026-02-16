import { useIntersectionObserver } from './useIntersectionObserver';

/**
 * Custom hook for scroll reveal animations
 * Wraps useIntersectionObserver to apply reveal class
 * @param {Object} options - Additional Intersection Observer options
 * @returns {[React.RefObject, String]} - [ref, revealClass]
 */
export function useScrollReveal(options = {}) {
  const [ref, isVisible] = useIntersectionObserver(options);
  const revealClass = isVisible ? 'revealed' : '';

  return [ref, revealClass];
}
