import { openDB, IDBPDatabase } from 'idb';
import { PackMateDB, defaultCategories } from './schema';

let dbPromise: Promise<IDBPDatabase<PackMateDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<PackMateDB>('PackMateDB', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Items store
          const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
          itemsStore.createIndex('by-category', 'category');
          itemsStore.createIndex('by-essential', 'essential');
          itemsStore.createIndex('by-created', 'createdAt');

          // Trips store
          const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
          tripsStore.createIndex('by-date', 'startDate');
          tripsStore.createIndex('by-type', 'type');

          // Trip items store
          const tripItemsStore = db.createObjectStore('tripItems', { keyPath: 'id' });
          tripItemsStore.createIndex('by-trip', 'tripId');
          tripItemsStore.createIndex('by-item', 'itemId');

          // Categories store
          const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });

          // Settings store
          db.createObjectStore('settings', { keyPath: 'key' });

          // Initialize default categories
          defaultCategories.forEach(category => {
            categoriesStore.add(category);
          });
        }
        
        if (oldVersion < 2) {
          // Occasions store
          const occasionsStore = db.createObjectStore('occasions', { keyPath: 'id' });
          occasionsStore.createIndex('by-trip', 'tripId');

          // Outfit items store
          const outfitItemsStore = db.createObjectStore('outfitItems', { keyPath: 'id' });
          outfitItemsStore.createIndex('by-occasion', 'occasionId');

          // Bags store
          const bagsStore = db.createObjectStore('bags', { keyPath: 'id' });
          bagsStore.createIndex('by-trip', 'tripId');

          // Packing categories store
          const packingCategoriesStore = db.createObjectStore('packingCategories', { keyPath: 'id' });
          packingCategoriesStore.createIndex('by-trip', 'tripId');
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Compresses an image file to a maximum size and returns base64 string
 * Optimized version with better compression
 */
export const compressImage = (file: File, maxSizeKB = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      const maxDimension = 400; // Reduced from 800
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      let quality = 0.7; // Start with lower quality
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Reduce quality until under maxSize
      while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Export all data as JSON for backup
 */
export const exportData = async () => {
  const db = await getDB();
  const tx = db.transaction(['items', 'trips', 'tripItems', 'categories', 'settings', 'occasions', 'outfitItems', 'bags', 'packingCategories'], 'readonly');
  
  const [items, trips, tripItems, categories, settings, occasions, outfitItems, bags, packingCategories] = await Promise.all([
    tx.objectStore('items').getAll(),
    tx.objectStore('trips').getAll(),
    tx.objectStore('tripItems').getAll(),
    tx.objectStore('categories').getAll(),
    tx.objectStore('settings').getAll(),
    tx.objectStore('occasions').getAll(),
    tx.objectStore('outfitItems').getAll(),
    tx.objectStore('bags').getAll(),
    tx.objectStore('packingCategories').getAll(),
  ]);

  return {
    version: 2,
    exportDate: new Date().toISOString(),
    data: { items, trips, tripItems, categories, settings, occasions, outfitItems, bags, packingCategories }
  };
};

/**
 * Import data from JSON backup
 */
export const importData = async (jsonData: any) => {
  const db = await getDB();
  const tx = db.transaction(['items', 'trips', 'tripItems', 'categories', 'settings', 'occasions', 'outfitItems', 'bags', 'packingCategories'], 'readwrite');
  
  // Clear existing data
  await Promise.all([
    tx.objectStore('items').clear(),
    tx.objectStore('trips').clear(),
    tx.objectStore('tripItems').clear(),
    tx.objectStore('categories').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('occasions').clear(),
    tx.objectStore('outfitItems').clear(),
    tx.objectStore('bags').clear(),
    tx.objectStore('packingCategories').clear(),
  ]);

  // Import new data
  const { items, trips, tripItems, categories, settings, occasions, outfitItems, bags, packingCategories } = jsonData.data;
  
  await Promise.all([
    ...items.map((item: any) => tx.objectStore('items').add(item)),
    ...trips.map((trip: any) => tx.objectStore('trips').add(trip)),
    ...tripItems.map((tripItem: any) => tx.objectStore('tripItems').add(tripItem)),
    ...(categories || []).map((category: any) => tx.objectStore('categories').add(category)),
    ...(settings || []).map((setting: any) => tx.objectStore('settings').add(setting)),
    ...(occasions || []).map((occasion: any) => tx.objectStore('occasions').add(occasion)),
    ...(outfitItems || []).map((outfitItem: any) => tx.objectStore('outfitItems').add(outfitItem)),
    ...(bags || []).map((bag: any) => tx.objectStore('bags').add(bag)),
    ...(packingCategories || []).map((packingCategory: any) => tx.objectStore('packingCategories').add(packingCategory)),
  ]);

  await tx.done;
};