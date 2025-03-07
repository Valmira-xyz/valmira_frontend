/**
 * Generates a consistent color based on a wallet address
 * @param address - Ethereum wallet address
 * @returns HSL color string
 */
export const generateAvatarColor = (address: string): string => {
  if (!address) return `hsl(0, 70%, 60%)`
  
  const hash = address.toLowerCase().split("").reduce((a, b) => {
    return ((a << 5) - a + b.charCodeAt(0)) | 0
  }, 0)
  
  return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`
} 