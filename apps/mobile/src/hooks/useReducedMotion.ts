import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Mirrors prefers-reduced-motion on web. Components should still show state
 * changes (opacity/color) when this is true — just drop the movement.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
      if (mounted) setReduced(!!v);
    });
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (v) => setReduced(!!v));
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
