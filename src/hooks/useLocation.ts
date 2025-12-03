import { useState } from 'react';
import * as Location from 'expo-location';

export type LocationCoordinates = {
  latitude: number;
  longitude: number;
} | null;

export type LocationResult = {
  coords: LocationCoordinates;
  error: string | null;
};

export const useLocation = () => {
  const [location, setLocation] = useState<LocationCoordinates>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async (): Promise<LocationResult> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        const errorMsg = 'Permissão de localização negada. Por favor, habilite a localização nas configurações do dispositivo.';
        setError(errorMsg);
        return { coords: null, error: errorMsg };
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
      return { coords, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter localização';
      const userFriendlyMessage = 'Não foi possível obter sua localização. Verifique se o GPS está ativado e tente novamente.';
      setError(userFriendlyMessage);
      console.error('Error getting location:', errorMessage);
      return { coords: null, error: userFriendlyMessage };
    }
  };

  return {
    location,
    error,
    getCurrentLocation,
  };
};
