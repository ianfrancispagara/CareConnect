declare module "@theme-toggles/react" {
  import { CSSProperties, ComponentType } from "react";

  export interface ToggleProps {
    duration?: number;
    toggled?: boolean;
    toggle?: () => void;
    reversed?: boolean;
    style?: CSSProperties;
    className?: string;
  }

  export const Within: ComponentType<ToggleProps>;
  // Add other exports as needed
}
