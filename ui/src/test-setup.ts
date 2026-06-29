import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined' && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}
