import { DBSchema } from 'idb';

export interface PackMateDB extends DBSchema {
  items: {
    key: 'items';
    value: WardrobeItem;
    indexes: {
      'by-category': string;
      'by-essential': boolean;
      'by-created': Date;
    };
  };
  trips: {
    key: 'trips';
    value: Trip;
    indexes: {
      'by-date': Date;
      'by-type': string;
    };
  };
  tripItems: {
    key: 'tripItems';
    value: TripItem;
    indexes: {
      'by-trip': string;
      'by-item': string;
    };
  };
  categories: {
    key: 'categories';
    value: Category;
  };
  settings: {
    key: 'settings';
    value: any;
  };
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  essential: boolean;
  image?: string; // Base64 compressed image
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  name: string;
  destination?: string;
  startDate: Date;
  endDate: Date;
  type: 'Business' | 'Vacation' | 'Weekend' | 'Other';
  isTemplate: boolean;
  travelers?: number;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface TripItem {
  id: string;
  tripId: string;
  itemId: string;
  packed: boolean;
  essential: boolean;
  categoryId?: string;
  bagId?: string;
  addedAt: Date;
}

export interface Occasion {
  id: string;
  tripId: string;
  name: string;
  description?: string;
  date?: Date;
  icon: string;
  color: string;
  createdAt: Date;
}

export interface OutfitItem {
  id: string;
  occasionId: string;
  itemId: string;
  addedAt: Date;
}

export interface Bag {
  id: string;
  tripId: string;
  name: string;
  type: 'carry-on' | 'suitcase' | 'backpack' | 'duffel' | 'tote' | 'other';
  color: string;
  maxWeight?: number;
  notes?: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const defaultCategories: Category[] = [
  { id: 'tops', name: 'Tops', icon: 'Shirt', color: '#3b82f6' },
  { id: 'bottoms', name: 'Bottoms', icon: 'Briefcase', color: '#8b5cf6' },
  { id: 'shoes', name: 'Shoes', icon: 'Footprints', color: '#f59e0b' },
  { id: 'accessories', name: 'Accessories', icon: 'Watch', color: '#10b981' },
  { id: 'electronics', name: 'Electronics', icon: 'Smartphone', color: '#ef4444' },
  { id: 'toiletries', name: 'Toiletries', icon: 'Droplets', color: '#06b6d4' },
  { id: 'other', name: 'Other', icon: 'Package', color: '#6b7280' },
];

export const bagTypes = [
  { id: 'carry-on', name: 'Carry-On', icon: 'Briefcase' },
  { id: 'suitcase', name: 'Suitcase', icon: 'Package' },
  { id: 'backpack', name: 'Backpack', icon: 'Backpack' },
  { id: 'duffel', name: 'Duffel Bag', icon: 'Package2' },
  { id: 'tote', name: 'Tote Bag', icon: 'ShoppingBag' },
  { id: 'other', name: 'Other', icon: 'Luggage' },
];