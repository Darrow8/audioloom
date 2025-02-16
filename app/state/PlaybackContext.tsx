import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PlaybackContextType {
  playbackPositions: Record<string, number>;
  updatePosition: (podId: string, position: number) => void;
}

export const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined
);

interface PlaybackProviderProps {
  children: ReactNode;
}

export const PlaybackProvider: React.FC<PlaybackProviderProps> = ({ children }) => {
  const [playbackPositions, setPlaybackPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const storedPositions = await AsyncStorage.getItem("playbackPositions");
        setPlaybackPositions(storedPositions ? JSON.parse(storedPositions) : {});
      } catch (error) {
        console.error("Error loading playback positions:", error);
      }
    };
    loadPositions();
  }, []);

  const updatePosition = async (podId: string, position: number) => {
    const updatedPositions = { ...playbackPositions, [podId]: position };
    setPlaybackPositions(updatedPositions);
    try {
      await AsyncStorage.setItem("playbackPositions", JSON.stringify(updatedPositions));
    } catch (error) {
      console.error("Error saving playback position:", error);
    }
  };

  return (
    <PlaybackContext.Provider value={{ playbackPositions, updatePosition }}>
      {children}
    </PlaybackContext.Provider>
  );
};
