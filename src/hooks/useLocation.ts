import { useState } from 'react';
import * as Location from 'expo-location';

export type LocationCoordinates = {
  latitude: number;
  longitude: number;
} | null;

export const useLocation = () => {
  const [location, setLocation] = useState<LocationCoordinates>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async (): Promise<LocationCoordinates> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Permissão de localização negada');
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(coords);
      setError(null);
      return coords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter localização';
      setError(errorMessage);
      console.error('Error getting location:', err);
      return null;
    }
  };

  return {
    location,
    error,
    getCurrentLocation,
  };
};
