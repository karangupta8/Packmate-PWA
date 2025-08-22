import { getDB, compressImage } from './database';
import { WardrobeItem, Trip, TripItem, Category } from './schema';

// Wardrobe Items Service
export const wardrobeService = {
  async getAll(): Promise<WardrobeItem[]> {
    const db = await getDB();
    return db.getAll('items');
  },

  async getById(id: string): Promise<WardrobeItem | undefined> {
    const db = await getDB();
    return db.get('items', id);
  },

  async add(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WardrobeItem> {
    const db = await getDB();
    const newItem: WardrobeItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.add('items', newItem);
    return newItem;
  },

  async update(id: string, updates: Partial<WardrobeItem>): Promise<WardrobeItem> {
    const db = await getDB();
    const existing = await db.get('items', id);
    if (!existing) throw new Error('Item not found');
    
    const updated: WardrobeItem = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    await db.put('items', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('items', id);
    // Also remove from all trips
    await tripItemService.deleteByItemId(id);
  },

  async search(query: string, category?: string, essential?: boolean): Promise<WardrobeItem[]> {
    const items = await this.getAll();
    return items.filter(item => {
      const matchesQuery = !query || 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || item.category === category;
      const matchesEssential = essential === undefined || item.essential === essential;
      
      return matchesQuery && matchesCategory && matchesEssential;
    });
  },

  async addWithImage(itemData: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'>, imageFile?: File): Promise<WardrobeItem> {
    let imageData = itemData.image;
    
    if (imageFile) {
      imageData = await compressImage(imageFile);
    }
    
    return this.add({ ...itemData, image: imageData });
  }
};

// Trips Service
export const tripService = {
  async getAll(): Promise<Trip[]> {
    const db = await getDB();
    return db.getAll('trips');
  },

  async getById(id: string): Promise<Trip | undefined> {
    const db = await getDB();
    return db.get('trips', id);
  },

  async add(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const db = await getDB();
    const newTrip: Trip = {
      ...trip,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.add('trips', newTrip);
    return newTrip;
  },

  async update(id: string, updates: Partial<Trip>): Promise<Trip> {
    const db = await getDB();
    const existing = await db.get('trips', id);
    if (!existing) throw new Error('Trip not found');
    
    const updated: Trip = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    await db.put('trips', updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('trips', id);
    // Also remove all trip items
    await tripItemService.deleteByTripId(id);
  },

  async duplicate(id: string, newName: string): Promise<Trip> {
    const original = await this.getById(id);
    if (!original) throw new Error('Trip not found');
    
    const duplicate = await this.add({
      ...original,
      name: newName,
      isTemplate: false,
    });

    // Copy all trip items
    const tripItems = await tripItemService.getByTripId(id);
    for (const tripItem of tripItems) {
      await tripItemService.add({
        tripId: duplicate.id,
        itemId: tripItem.itemId,
        packed: false,
        essential: tripItem.essential,
      });
    }

    return duplicate;
  },

  async getTemplates(): Promise<Trip[]> {
    const trips = await this.getAll();
    return trips.filter(trip => trip.isTemplate);
  }
};

// Trip Items Service
export const tripItemService = {
  async getByTripId(tripId: string): Promise<TripItem[]> {
    const db = await getDB();
    return db.getAllFromIndex('tripItems', 'by-trip', tripId);
  },

  async add(tripItem: Omit<TripItem, 'id' | 'addedAt'>): Promise<TripItem> {
    const db = await getDB();
    const newTripItem: TripItem = {
      ...tripItem,
      id: crypto.randomUUID(),
      addedAt: new Date(),
    };
    await db.add('tripItems', newTripItem);
    return newTripItem;
  },

  async updatePacked(id: string, packed: boolean): Promise<void> {
    const db = await getDB();
    const existing = await db.get('tripItems', id);
    if (existing) {
      await db.put('tripItems', { ...existing, packed });
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('tripItems', id);
  },

  async deleteByTripId(tripId: string): Promise<void> {
    const tripItems = await this.getByTripId(tripId);
    const db = await getDB();
    const tx = db.transaction('tripItems', 'readwrite');
    
    await Promise.all(
      tripItems.map(item => tx.store.delete(item.id))
    );
    await tx.done;
  },

  async deleteByItemId(itemId: string): Promise<void> {
    const db = await getDB();
    const tripItems = await db.getAllFromIndex('tripItems', 'by-item', itemId);
    const tx = db.transaction('tripItems', 'readwrite');
    
    await Promise.all(
      tripItems.map(item => tx.store.delete(item.id))
    );
    await tx.done;
  },

  async getTripProgress(tripId: string): Promise<{ total: number; packed: number }> {
    const tripItems = await this.getByTripId(tripId);
    return {
      total: tripItems.length,
      packed: tripItems.filter(item => item.packed).length,
    };
  }
};

// Categories Service
export const categoryService = {
  async getAll(): Promise<Category[]> {
    const db = await getDB();
    return db.getAll('categories');
  },

  async getById(id: string): Promise<Category | undefined> {
    const db = await getDB();
    return db.get('categories', id);
  }
};

// Settings Service
export const settingsService = {
  async get(key: string): Promise<any> {
    const db = await getDB();
    const result = await db.get('settings', key);
    return result?.value;
  },

  async set(key: string, value: any): Promise<void> {
    const db = await getDB();
    await db.put('settings', { key, value });
  }
};