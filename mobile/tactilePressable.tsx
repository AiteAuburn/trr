import { Pressable as NativePressable, type PressableProps } from "react-native";

/** Shared touch feedback without adding layout wrappers or changing callbacks. */
export function TactilePressable({ style, ...props }: PressableProps) {
  return (
    <NativePressable
      {...props}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        state.pressed && !props.disabled ? { opacity: 0.76 } : null
      ]}
    />
  );
}
