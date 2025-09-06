import { DBSchema } from 'idb';

export interface PackMateDB extends DBSchema {
  items: {
    key: string;
    value: WardrobeItem;
    indexes: {
      'by-category': string;
      'by-essential': boolean;
      'by-created': Date;
    };
  };
  trips: {
    key: string;
    value: Trip;
    indexes: {
      'by-date': Date;
      'by-type': string;
    };
  };
  tripItems: {
    key: string;
    value: TripItem;
    indexes: {
      'by-trip': string;
      'by-item': string;
    };
  };
  categories: {
    key: string;
    value: Category;
  };
  settings: {
    key: string;
    value: any;
  };
  occasions: {
    key: string;
    value: Occasion;
    indexes: {
      'by-trip': string;
    };
  };
  outfitItems: {
    key: string;
    value: OutfitItem;
    indexes: {
      'by-occasion': string;
    };
  };
  bags: {
    key: string;
    value: Bag;
    indexes: {
      'by-trip': string;
    };
  };
  packingCategories: {
    key: string;
    value: PackingCategory;
    indexes: {
      'by-trip': string;
    };
  };
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  essential: boolean;
  image?: string; // Base64 compressed image
  notes?: string;
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

export interface PackingCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  tripId: string;
  order: number;
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

export const defaultPackingCategories: PackingCategory[] = [
  { id: 'clothing', name: 'Clothing', icon: 'Shirt', color: '#3b82f6', tripId: '', order: 1 },
  { id: 'shoes', name: 'Shoes', icon: 'Footprints', color: '#f59e0b', tripId: '', order: 2 },
  { id: 'accessories', name: 'Accessories', icon: 'Watch', color: '#10b981', tripId: '', order: 3 },
  { id: 'electronics', name: 'Electronics', icon: 'Smartphone', color: '#ef4444', tripId: '', order: 4 },
  { id: 'toiletries', name: 'Toiletries', icon: 'Droplets', color: '#06b6d4', tripId: '', order: 5 },
  { id: 'documents', name: 'Documents', icon: 'FileText', color: '#8b5cf6', tripId: '', order: 6 },
  { id: 'other', name: 'Other', icon: 'Package', color: '#6b7280', tripId: '', order: 7 },
];

export const bagTypes = [
  { id: 'carry-on', name: 'Carry-On', icon: 'Briefcase' },
  { id: 'suitcase', name: 'Suitcase', icon: 'Package' },
  { id: 'backpack', name: 'Backpack', icon: 'Backpack' },
  { id: 'duffel', name: 'Duffel Bag', icon: 'Package2' },
  { id: 'tote', name: 'Tote Bag', icon: 'ShoppingBag' },
  { id: 'other', name: 'Other', icon: 'Luggage' },
];