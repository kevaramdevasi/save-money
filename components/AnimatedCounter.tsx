import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  style,
  prefix = '',
  suffix = '',
  duration = 1000,
}: AnimatedCounterProps) {
  // useRef to persist the Animated.Value instance between re-renders, initialized with the current value
  const animatedValue = useRef(new Animated.Value(value)).current;
  
  // useState to hold the value that is actually rendered in the Text component
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Listen to the changes in the animated value
    const listener = animatedValue.addListener((state) => {
      // Update the state, which will cause a re-render with the new value
      setDisplayValue(state.value);
    });

    // Clean up the listener when the component unmounts
    return () => {
      animatedValue.removeListener(listener);
    };
  }, [animatedValue]);

  useEffect(() => {
    // Start the animation when the `value` prop changes
    Animated.timing(animatedValue, {
      toValue: value,
      duration: duration,
      useNativeDriver: false, // This must be false for layout-affecting animations
    }).start();
  }, [value, animatedValue, duration]);

  return (
    <Text style={style}>
      {`${prefix}${Math.round(displayValue).toLocaleString()}${suffix}`}
    </Text>
  );
}
