import React, { createContext, useState, useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export const OrientationContext = createContext({
  isPortrait: true,
});

export const OrientationProvider = ({ children }) => {
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const checkInitialOrientation = async () => {
      const orientation = await ScreenOrientation.getOrientationAsync();
      updateOrientation(orientation);
    };
    checkInitialOrientation();

    const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      updateOrientation(orientationInfo.orientation);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  const updateOrientation = (orientation) => {
    setIsPortrait(
      orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
      orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
    );
  };

  return (
    <OrientationContext.Provider value={{ isPortrait }}>
      {children}
    </OrientationContext.Provider>
  );
};