'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { HomePage } from '@/components/home/HomePage';
import { WardrobeGrid } from '@/components/wardrobe/WardrobeGrid';
import { TripsList } from '@/components/trips/TripsList';
import { PackingChecklist } from '@/components/packing/PackingChecklist';
import { useStore, useTheme } from '@/lib/store/useStore';
import { wardrobeService, tripService, categoryService, settingsService } from '@/lib/db/services';
import { tripItemService } from '@/lib/db/services';

export default function Home() {
  const { 
    activeTab,
    setWardrobeItems,
    setTrips,
    setCategories,
    setLoading,
    currentTrip,
    setTripItems,
    clearTripItems
  } = useStore();
  
  const { theme, setTheme } = useTheme();

  // Initialize data and theme
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      
      try {
        // Load saved theme
        const savedTheme = localStorage.getItem('packmate-theme') || 
                          await settingsService.get('theme') || 
                          'light';
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');

        // Load data
        const [items, trips, categories] = await Promise.all([
          wardrobeService.getAll(),
          tripService.getAll(),
          categoryService.getAll(),
        ]);

        setWardrobeItems(items);
        setTrips(trips);
        setCategories(categories);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load trip items when current trip changes
  useEffect(() => {
    const loadTripItems = async () => {
      if (currentTrip) {
        try {
          const items = await tripItemService.getByTripId(currentTrip.id);
          setTripItems(items);
        } catch (error) {
          console.error('Failed to load trip items:', error);
        }
      } else {
        clearTripItems();
      }
    };

    loadTripItems();
  }, [currentTrip]);
  // Apply theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    settingsService.set('theme', theme);
  }, [theme]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'wardrobe':
        return <WardrobeGrid />;
      case 'trips':
        return <TripsList />;
      case 'packing':
        return <PackingChecklist />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container max-w-md mx-auto px-4 py-4">
        {renderActiveTab()}
      </main>
      
      <Navigation />
    </div>
  );
}