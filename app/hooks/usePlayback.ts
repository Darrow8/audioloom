import { useContext } from "react";
import { PlaybackContext } from "@/state/PlaybackContext";

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
};