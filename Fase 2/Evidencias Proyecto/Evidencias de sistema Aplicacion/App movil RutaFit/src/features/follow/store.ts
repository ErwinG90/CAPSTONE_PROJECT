import { create } from 'zustand';

// Coordinates from backend: [longitude, latitude]
export type BackendCoord = [number, number];

export type FollowingRoute = {
    id: string;
    nombre: string;
    coordinates: BackendCoord[]; // GeoJSON order [lon, lat]
    distanciaKm?: number;
};

interface FollowState {
    followingRoute: FollowingRoute | null;
    setFollowingRoute: (route: FollowingRoute) => void;
    clearFollowingRoute: () => void;
}

export const useFollowStore = create<FollowState>()((set) => ({
    followingRoute: null,
    setFollowingRoute: (route) => set({ followingRoute: route }),
    clearFollowingRoute: () => set({ followingRoute: null }),
}));
