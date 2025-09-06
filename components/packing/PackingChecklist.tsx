'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/useStore';
import { tripItemService, bagService, occasionService, outfitItemService } from '@/lib/db/services';
import { TripItem, Bag, Occasion, OutfitItem } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Package, 
  Calendar, 
  Trash2, 
  Star, 
  Luggage, 
  CheckCircle2, 
  Circle,
  Plus,
  Settings,
  MapPin,
  Clock
} from 'lucide-react';
import { BagManager } from './BagManager';
import { OccasionManager } from './OccasionManager';
import { format } from 'date-fns';

export function PackingChecklist() {
  const { 
    currentTrip, 
    tripItems, 
    setTripItems, 
    wardrobeItems, 
    categories,
    updateTripItem,
    removeTripItem
  } = useStore();
  
  const [bags, setBags] = useState<Bag[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [outfitItems, setOutfitItems] = useState<OutfitItem[]>([]);
  const [showBagManager, setShowBagManager] = useState(false);
  const [showOccasionManager, setShowOccasionManager] = useState(false);
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    if (currentTrip) {
      loadTripData();
    }
  }, [currentTrip]);

  const loadTripData = async () => {
    if (!currentTrip) return;

    try {
      const [bagsData, occasionsData] = await Promise.all([
        bagService.getByTripId(currentTrip.id),
        occasionService.getByTripId(currentTrip.id)
      ]);

      // Get outfit items for all occasions
      const allOutfitItems = [];
      for (const occasion of occasionsData) {
        const occasionOutfitItems = await outfitItemService.getByOccasionId(occasion.id);
        allOutfitItems.push(...occasionOutfitItems);
      }

      setBags(bagsData);
      setOccasions(occasionsData);
      setOutfitItems(allOutfitItems);
    } catch (error) {
      console.error('Error loading trip data:', error);
      toast.error("Failed to load trip data");
    }
  };

  // Get trip items with wardrobe details
  const tripItemsWithDetails = useMemo(() => {
    return tripItems.map(tripItem => {
      const wardrobeItem = wardrobeItems.find(item => item.id === tripItem.itemId);
      const category = categories.find(cat => cat.id === wardrobeItem?.category);
      const bag = bags.find(b => b.id === tripItem.bagId);
      
      return {
        ...tripItem,
        wardrobeItem,
        category,
        bag
      };
    }).filter(item => item.wardrobeItem);
  }, [tripItems, wardrobeItems, categories, bags]);

  // Calculate packing progress
  const packingProgress = useMemo(() => {
    const total = tripItemsWithDetails.length;
    const packed = tripItemsWithDetails.filter(item => item.packed).length;
    return { total, packed, percentage: total > 0 ? Math.round((packed / total) * 100) : 0 };
  }, [tripItemsWithDetails]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = tripItemsWithDetails.reduce((acc, item) => {
      const categoryName = item.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(item);
      return acc;
    }, {} as Record<string, typeof tripItemsWithDetails>);

    return grouped;
  }, [tripItemsWithDetails]);

  // Group items by bag
  const itemsByBag = useMemo(() => {
    const grouped = tripItemsWithDetails.reduce((acc, item) => {
      const bagName = item.bag?.name || 'Unassigned';
      if (!acc[bagName]) {
        acc[bagName] = [];
      }
      acc[bagName].push(item);
      return acc;
    }, {} as Record<string, typeof tripItemsWithDetails>);

    return grouped;
  }, [tripItemsWithDetails]);

  const handleTogglePacked = async (tripItemId: string, packed: boolean) => {
    try {
      await tripItemService.updatePacked(tripItemId, packed);
      updateTripItem(tripItemId, { packed });
      toast.success(packed ? 'Item marked as packed' : 'Item marked as unpacked');
    } catch (error) {
      toast.error('Failed to update packing status');
    }
  };

  const handleDeleteItem = async (tripItemId: string) => {
    if (!confirm('Remove this item from the trip?')) return;
    
    try {
      await tripItemService.delete(tripItemId);
      removeTripItem(tripItemId);
      toast.success("Item removed from trip");
    } catch (error) {
      toast.error("Failed to remove item from trip");
    }
  };

  const renderItemCard = (item: typeof tripItemsWithDetails[0]) => {
    const itemOccasions = outfitItems
      .filter(outfitItem => outfitItem.itemId === item.wardrobeItem?.id)
      .map(outfitItem => occasions.find(occ => occ.id === outfitItem.occasionId))
      .filter(Boolean);

    return (
      <Card key={item.id} className={`transition-all ${item.packed ? 'bg-green-50 dark:bg-green-950' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <div className="pt-1">
              <Checkbox
                checked={item.packed}
                onCheckedChange={(checked) => handleTogglePacked(item.id, checked as boolean)}
                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
            </div>

            {/* Item Image */}
            <div className="flex-shrink-0">
              {item.wardrobeItem?.image ? (
                <img
                  src={item.wardrobeItem.image}
                  alt={item.wardrobeItem.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <Package size={24} className="text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{item.wardrobeItem?.name}</h4>
                    {item.essential && (
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    )}
                    {item.packed && (
                      <CheckCircle2 size={14} className="text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category.name}
                      </Badge>
                    )}
                    {item.bag && (
                      <Badge variant="outline" className="text-xs">
                        <Luggage size={10} className="mr-1" />
                        {item.bag.name}
                      </Badge>
                    )}
                  </div>

                  {item.wardrobeItem?.tags && item.wardrobeItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.wardrobeItem.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.wardrobeItem.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.wardrobeItem.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {itemOccasions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {itemOccasions.map(occasion => (
                        <Badge key={occasion?.id} variant="default" className="text-xs">
                          <Calendar size={10} className="mr-1" />
                          {occasion?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package size={64} className="text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Trip Selected</h2>
        <p className="text-muted-foreground">
          Select a trip from the trips list to view your packing checklist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Trip Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{currentTrip.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {currentTrip.destination && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{currentTrip.destination}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    {format(new Date(currentTrip.startDate), 'MMM dd')} - {format(new Date(currentTrip.endDate), 'MMM dd')}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="outline">{currentTrip.type}</Badge>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Packing Progress</span>
              <span>{packingProgress.packed} of {packingProgress.total} items</span>
            </div>
            <Progress value={packingProgress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {packingProgress.percentage}% complete
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Management Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => setShowBagManager(true)}
          className="h-16 flex flex-col items-center gap-2"
        >
          <Luggage size={20} />
          <div className="text-center">
            <div className="font-medium">Manage Bags</div>
            <div className="text-xs text-muted-foreground">{bags.length} bags</div>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowOccasionManager(true)}
          className="h-16 flex flex-col items-center gap-2"
        >
          <Calendar size={20} />
          <div className="text-center">
            <div className="font-medium">Occasions</div>
            <div className="text-xs text-muted-foreground">{occasions.length} occasions</div>
          </div>
        </Button>
      </div>

      {/* Items Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">By Category</TabsTrigger>
          <TabsTrigger value="bags">By Bag</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {Object.entries(itemsByCategory).length > 0 ? (
            Object.entries(itemsByCategory).map(([categoryName, items]) => (
              <Card key={categoryName}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{categoryName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{items.length}</Badge>
                      <Badge variant="outline">
                        {items.filter(item => item.packed).length} packed
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map(renderItemCard)}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Items Added</h3>
                <p className="text-muted-foreground">
                  Add items to this trip from your wardrobe to start packing.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bags" className="space-y-4">
          {Object.entries(itemsByBag).length > 0 ? (
            Object.entries(itemsByBag).map(([bagName, items]) => (
              <Card key={bagName}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Luggage size={18} />
                      <span>{bagName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{items.length}</Badge>
                      <Badge variant="outline">
                        {items.filter(item => item.packed).length} packed
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map(renderItemCard)}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Luggage size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Items Added</h3>
                <p className="text-muted-foreground">
                  Add items to this trip from your wardrobe to start packing.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Bag Manager Dialog */}
      <BagManager
        isOpen={showBagManager}
        onClose={() => setShowBagManager(false)}
        tripId={currentTrip.id}
        bags={bags}
        setBags={setBags}
        tripItems={tripItems}
        setTripItems={setTripItems}
        wardrobeItems={wardrobeItems}
      />

      {/* Occasion Manager Dialog */}
      <OccasionManager
        isOpen={showOccasionManager}
        onClose={() => setShowOccasionManager(false)}
        tripId={currentTrip.id}
        occasions={occasions}
        setOccasions={setOccasions}
        outfitItems={outfitItems}
        setOutfitItems={setOutfitItems}
        wardrobeItems={wardrobeItems}
        tripItems={tripItems}
      />
    </div>
  );
}