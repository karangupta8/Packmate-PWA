'use client';

import { create } from 'zustand';
import { WardrobeItem, Trip, TripItem, Category } from '../db/schema';

interface AppState {
  // UI State
  activeTab: 'home' | 'wardrobe' | 'trips' | 'packing';
  theme: 'light' | 'dark';
  isLoading: boolean;
  
  // Data State
  wardrobeItems: WardrobeItem[];
  trips: Trip[];
  categories: Category[];
  currentTrip: Trip | null;
  tripItems: TripItem[];
  
  // Actions
  setActiveTab: (tab: 'home' | 'wardrobe' | 'trips' | 'packing') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setWardrobeItems: (items: WardrobeItem[]) => void;
  setTrips: (trips: Trip[]) => void;
  setCategories: (categories: Category[]) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  setTripItems: (items: TripItem[]) => void;
  addWardrobeItem: (item: WardrobeItem) => void;
  updateWardrobeItem: (id: string, updates: Partial<WardrobeItem>) => void;
  removeWardrobeItem: (id: string) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  removeTrip: (id: string) => void;
  addTripItem: (item: TripItem) => void;
  updateTripItem: (id: string, updates: Partial<TripItem>) => void;
  removeTripItem: (id: string) => void;
  clearTripItems: () => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  removeCategory: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial UI State
  activeTab: 'home',
  theme: 'light',
  isLoading: false,
  
  // Initial Data State
  wardrobeItems: [],
  trips: [],
  categories: [],
  currentTrip: null,
  tripItems: [],
  
  // UI Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Data Actions
  setWardrobeItems: (items) => set({ wardrobeItems: items }),
  setTrips: (trips) => set({ trips }),
  setCategories: (categories) => set({ categories }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTripItems: (items) => set({ tripItems: items }),
  
  addWardrobeItem: (item) =>
    set((state) => ({ wardrobeItems: [...state.wardrobeItems, item] })),
  
  updateWardrobeItem: (id, updates) =>
    set((state) => ({
      wardrobeItems: state.wardrobeItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  
  removeWardrobeItem: (id) =>
    set((state) => ({
      wardrobeItems: state.wardrobeItems.filter((item) => item.id !== id),
    })),
  
  addTrip: (trip) =>
    set((state) => ({ trips: [...state.trips, trip] })),
  
  updateTrip: (id, updates) =>
    set((state) => ({
      trips: state.trips.map((trip) =>
        trip.id === id ? { ...trip, ...updates } : trip
      ),
    })),
  
  removeTrip: (id) =>
    set((state) => ({
      trips: state.trips.filter((trip) => trip.id !== id),
    })),
  
  addTripItem: (item) =>
    set((state) => ({ tripItems: [...state.tripItems, item] })),
  
  updateTripItem: (id, updates) =>
    set((state) => ({
      tripItems: state.tripItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  
  removeTripItem: (id) =>
    set((state) => ({
      tripItems: state.tripItems.filter((item) => item.id !== id),
    })),
  
  clearTripItems: () => set({ tripItems: [] }),
  
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  
  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === id ? { ...category, ...updates } : category
      ),
    })),
  
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
    })),
}));

// Theme hook
export const useTheme = () => {
  const { theme, setTheme } = useStore();
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('packmate-theme', newTheme);
  };
  
  return { theme, setTheme, toggleTheme };
};