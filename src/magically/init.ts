import { init } from "magically-sdk";
import { MagicallyConfig } from "./config";

// Initialize SDK with project configuration
export const initialize = () => {
    init(MagicallyConfig);
}