import {useState, useCallback, useRef} from 'react';
import {NativeScrollEvent, NativeSyntheticEvent, GestureResponderEvent} from 'react-native';

/**
 * useScroll hook with debounce support for hideOnScroll functionality.
 * Hides tab bar while scrolling/touching, shows when interaction stops.
 * Supports both onScroll events and touch gestures.
 * @param debounceMs - Milliseconds to wait after interaction stops before showing tab bar
 * @returns {isScrolling, isScrolled, handleScroll, handleTouchStart, handleTouchEnd}
 */
export default function useScroll (debounceMs: number = 300) {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastScrollY = useRef<number>(0);
    const isTouching = useRef<boolean>(false);

    // Clear any existing timeout
    const clearScrollTimeout = useCallback(() => {
        if(scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = null;
        }
    }, []);

    // Start debounce for showing tab bar
    const startShowDelay = useCallback(() => {
        clearScrollTimeout();
        scrollTimeoutRef.current = setTimeout(() => {
            if(!isTouching.current) {
                setIsScrolling(false);
            }
        }, debounceMs);
    }, [debounceMs, clearScrollTimeout]);

    // Handle scroll events (when content actually scrolls)
    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent> | any) => {
        const y = e?.nativeEvent?.contentOffset?.y ?? 0;
        lastScrollY.current = y;

        // If scrolling past threshold, hide the tab bar
        if(y > 10) {
            setIsScrolling(true);
            clearScrollTimeout();
        }

        // Debounce: start timer to show tab bar after scrolling stops
        startShowDelay();
    }, [clearScrollTimeout, startShowDelay]);

    // Handle touch start - immediately hide tab bar
    const handleTouchStart = useCallback((e?: GestureResponderEvent) => {
        isTouching.current = true;
        setIsScrolling(true);
        clearScrollTimeout();
    }, [clearScrollTimeout]);

    // Handle touch end - start showing tab bar after delay
    const handleTouchEnd = useCallback((e?: GestureResponderEvent) => {
        isTouching.current = false;
        startShowDelay();
    }, [startShowDelay]);

    // Handle touch move - keeps isScrolling true while moving
    const handleTouchMove = useCallback((e?: GestureResponderEvent) => {
        if(isTouching.current) {
            setIsScrolling(true);
            clearScrollTimeout();
        }
    }, [clearScrollTimeout]);

    // Legacy alias for backward compatibility
    const isScrolled = isScrolling;

    return {
        isScrolling,
        isScrolled,
        handleScroll,
        handleTouchStart,
        handleTouchEnd,
        handleTouchMove,
    };
}
