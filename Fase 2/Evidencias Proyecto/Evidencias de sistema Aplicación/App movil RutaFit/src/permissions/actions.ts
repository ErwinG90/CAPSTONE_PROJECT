import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { PermissionStatus } from './types';

export const requestLocationPermission = async (): Promise<PermissionStatus> => {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

  if (status !== Location.PermissionStatus.GRANTED) {
    if (status === Location.PermissionStatus.DENIED && !canAskAgain) {
      manualPermissionRequest();
      return PermissionStatus.BLOCKED;
    }
    return PermissionStatus.DENIED;
  }
  return PermissionStatus.GRANTED;
};

export const checkLocationPermission = async (): Promise<PermissionStatus> => {
  const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return PermissionStatus.GRANTED;
    case Location.PermissionStatus.DENIED:
      return canAskAgain ? PermissionStatus.DENIED : PermissionStatus.BLOCKED;
    case Location.PermissionStatus.UNDETERMINED:
    default:
      return PermissionStatus.UNDETERMINED;
  }
};

const manualPermissionRequest = () => {
  Alert.alert(
    'Permiso de ubicación necesario',
    'Para continuar, habilita la ubicación para RutaFit en los ajustes del sistema.',
    [
      { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
      { text: 'Cancelar', style: 'destructive' },
    ]
  );
};
