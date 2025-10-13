import React, { useEffect } from 'react';
import { View, Text, Pressable, AppState } from 'react-native';
import { usePermissionsStore } from './store';
import { PermissionStatus } from './types';

export default function RequestLocationView() {
  const { locationStatus, requestLocationPermission, checkLocationPermission } =
    usePermissionsStore();

  useEffect(() => {
    // primer chequeo al montar
    checkLocationPermission();

    // re-chequear al volver desde Ajustes
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') checkLocationPermission();
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 12, textAlign: 'center' }}>
        Para ver el mapa, permite el acceso a tu ubicación.
      </Text>

      <Pressable
        onPress={requestLocationPermission}
        style={{
          backgroundColor: '#49129C',
          paddingVertical: 12,
          paddingHorizontal: 22,
          borderRadius: 100,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Habilitar ubicación</Text>
      </Pressable>

      <Text style={{ opacity: 0.7 }}>
        Estado actual: {locationStatus}
        {locationStatus === PermissionStatus.BLOCKED ? ' (gestiónalo en Ajustes)' : ''}
      </Text>
    </View>
  );
}
