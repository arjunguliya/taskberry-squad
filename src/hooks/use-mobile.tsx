
import * as React from "react"

// Update the breakpoint to match Tailwind's md breakpoint
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Function to check if we're on mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initialize on mount
    checkIfMobile()
    
    // Set up event listener for window resize
    window.addEventListener("resize", checkIfMobile)
    
    // Clean up event listener
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return !!isMobile
}
