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
  createdAt: Date;
  updatedAt: Date;
}

export interface TripItem {
  id: string;
  tripId: string;
  itemId: string;
  packed: boolean;
  essential: boolean;
  addedAt: Date;
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