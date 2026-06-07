import { useEffect, useRef } from 'react'

export function useSmoothScroll(
  ref: React.RefObject<HTMLDivElement | null>,
  active: boolean = true
) {
  const targetRef = useRef(0)
  const currentRef = useRef(0)
  const animatingRef = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element || !active) return

    const handleWheel = (e: WheelEvent) => {
      // If touchpad (high frequency, small or fractional deltas), let browser handle it natively
      // Touchpad deltas are usually not multiples of 120 and are often very small (< 40) or fractional
      const isTouchpad = Math.abs(e.deltaY) < 40 || !Number.isInteger(e.deltaY)
      if (isTouchpad) {
        // Stop any active scroll animation to let native touchpad physics take over
        animatingRef.current = false
        return
      }

      e.preventDefault()

      // Set target scroll top
      const maxScroll = element.scrollHeight - element.clientHeight
      if (maxScroll <= 0) return

      // Initialize targets if not animating
      if (!animatingRef.current) {
        targetRef.current = element.scrollTop
        currentRef.current = element.scrollTop
      }

      // Add wheel delta to target
      targetRef.current = Math.max(0, Math.min(maxScroll, targetRef.current + e.deltaY * 1.25))

      if (!animatingRef.current) {
        animatingRef.current = true
        animate()
      }
    }

    const animate = () => {
      if (!animatingRef.current || !ref.current) return

      const diff = targetRef.current - currentRef.current
      if (Math.abs(diff) < 0.5) {
        ref.current.scrollTop = targetRef.current
        animatingRef.current = false
        return
      }

      // Smooth interpolation (lerp)
      currentRef.current += diff * 0.16 // Lerp factor (0.16 is fast, responsive, and smooth)
      ref.current.scrollTop = currentRef.current

      requestAnimationFrame(animate)
    }

    // Passive: false is required to allow preventDefault() on wheel scroll
    element.addEventListener('wheel', handleWheel, { passive: false })

    // Sync scroll target when user drags the scrollbar
    const handleScroll = () => {
      if (!animatingRef.current && ref.current) {
        targetRef.current = ref.current.scrollTop
        currentRef.current = ref.current.scrollTop
      }
    }
    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('wheel', handleWheel)
      element.removeEventListener('scroll', handleScroll)
      animatingRef.current = false
    }
  }, [ref, active])
}
