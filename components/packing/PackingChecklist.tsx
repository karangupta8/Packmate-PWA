'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store/useStore';
import { tripItemService, bagService, occasionService, outfitItemService, wardrobeService } from '@/lib/db/services';
import { TripItem, Bag, Occasion, OutfitItem, WardrobeItem } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Package, 
  Calendar, 
  Trash2, 
  Star, 
  Luggage, 
  CheckCircle2, 
  Plus,
  Settings,
  MapPin,
  Clock,
  MoreVertical,
  Edit,
  RefreshCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BagManager } from './BagManager';
import { OccasionManager } from './OccasionManager';
import { RepackingManager } from './RepackingManager';
import { format } from 'date-fns';
import { AddItemToTripDialog } from './AddItemToTripDialog';
import { CategoryManager } from './CategoryManager';
import { EditWardrobeItemDialog } from '../wardrobe/EditWardrobeItemDialog';
import { compressImage } from '@/lib/db/database';

export function PackingChecklist() {
  const { 
    currentTrip, 
    tripItems, 
    setTripItems, 
    wardrobeItems, 
    setWardrobeItems,
    categories,
    updateTripItem,
    removeTripItem
  } = useStore();
  
  const [bags, setBags] = useState<Bag[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [outfitItems, setOutfitItems] = useState<OutfitItem[]>([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [activeTab, setActiveTab] = useState('category');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

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
      const outfitItemPromises = occasionsData.map(occasion =>
        outfitItemService.getByOccasionId(occasion.id)
      );
      const allOutfitItems = (await Promise.all(outfitItemPromises)).flat();

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

  const toggleCategoryCollapse = (categoryName: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const occasionsByItemId = useMemo(() => {
    const map = new Map<string, Occasion[]>();
    if (!occasions.length || !outfitItems.length) {
      return map;
    }
    for (const outfitItem of outfitItems) {
      if (!outfitItem.itemId) continue;
      if (!map.has(outfitItem.itemId)) {
        map.set(outfitItem.itemId, []);
      }
      const occasion = occasions.find(o => o.id === outfitItem.occasionId);
      if (occasion) {
        map.get(outfitItem.itemId)!.push(occasion);
      }
    }
    return map;
  }, [outfitItems, occasions]);

  const handleTogglePacked = async (tripItemId: string, packed: boolean) => {
    try {
      await tripItemService.updatePacked(tripItemId, packed);
      updateTripItem(tripItemId, { packed });
      toast.success(packed ? 'Item marked as packed' : 'Item marked as unpacked');
    } catch (error) {
      toast.error('Failed to update packing status');
    }
  };

  const handleAddItemToTrip = async (itemsToAdd: WardrobeItem[]) => {
    if (!currentTrip) return;
    try {
        const newTripItems: TripItem[] = [];
        for (const item of itemsToAdd) {
            const newTripItem = await tripItemService.add({
                tripId: currentTrip.id,
                itemId: item.id,
                packed: false,
                essential: item.essential,
            });
            newTripItems.push(newTripItem);
        }
        setTripItems([...tripItems, ...newTripItems]);
        toast.success(`${itemsToAdd.length} item(s) added to the trip.`);
        setShowAddItemDialog(false);
    } catch (error) {
        toast.error("Failed to add items to trip.");
    }
  };

  const handleAssignBag = async (tripItemId: string, bagId: string | null) => {
    try {
        const bagIdToSet = bagId === null ? undefined : bagId;
        await tripItemService.update(tripItemId, { bagId: bagIdToSet });
        updateTripItem(tripItemId, { bagId: bagIdToSet });
        toast.success(bagId ? 'Item assigned to bag' : 'Item unassigned');
    } catch (error) {
        toast.error('Failed to assign bag');
    }
  };

  const handleAssignOccasion = async (wardrobeItemId: string, occasionId: string) => {
    if (!wardrobeItemId) return;
    const isAssigned = outfitItems.some(oi => oi.occasionId === occasionId && oi.itemId === wardrobeItemId);
    if (isAssigned) {
        toast.info("Item is already in this occasion's outfit.");
        return;
    }
    try {
        const newOutfitItem = await outfitItemService.add({
            occasionId: occasionId,
            itemId: wardrobeItemId,
        });
        setOutfitItems([...outfitItems, newOutfitItem]);
        toast.success('Item added to occasion outfit');
    } catch (error) {
        toast.error('Failed to add item to occasion');
    }
  };

  const handleAssignCategory = async (wardrobeItemId: string, categoryId: string) => {
    if (!wardrobeItemId) return;
    try {
        const updatedItem = await wardrobeService.update(wardrobeItemId, { category: categoryId });
        setWardrobeItems(
          wardrobeItems.map(item => item.id === wardrobeItemId ? updatedItem : item)
        );
        toast.success('Item category changed.');
    } catch (error) {
        toast.error('Failed to change category');
    }
  };

  const handleUpdateItem = async (itemToUpdate: WardrobeItem, imageFile?: File) => {
    if (!itemToUpdate) return;
    try {
      const updates: Partial<WardrobeItem> = {
        name: itemToUpdate.name,
        category: itemToUpdate.category,
        tags: itemToUpdate.tags,
        essential: itemToUpdate.essential,
        notes: itemToUpdate.notes,
        image: itemToUpdate.image,
      };

      if (imageFile) {
        updates.image = await compressImage(imageFile);
      }

      const updatedItem = await wardrobeService.update(itemToUpdate.id, updates);

      setWardrobeItems(
        wardrobeItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
      );
      toast.success("Item updated successfully.");
      setEditingItem(null);
    } catch (error) {
      toast.error("Failed to update item.");
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
    const itemOccasions = occasionsByItemId.get(item.wardrobeItem?.id ?? '') || [];

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
                  <Package className="w-8 h-8 text-muted-foreground" />
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
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    )}
                    {item.packed && (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingItem(item.wardrobeItem!)}>
                      <Edit size={14} className="mr-2" />
                      Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Assign to Bag</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {bags.map(bag => (
                            <DropdownMenuItem key={bag.id} onClick={() => handleAssignBag(item.id, bag.id)}>
                              {bag.name}
                            </DropdownMenuItem>
                          ))}
                          {item.bagId && (
                            <DropdownMenuItem onClick={() => handleAssignBag(item.id, null)}>
                              Unassign
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Add to Occasion</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {occasions.map(occasion => (
                            <DropdownMenuItem key={occasion.id} onClick={() => handleAssignOccasion(item.wardrobeItem!.id, occasion.id)}>
                              {occasion.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Change Category</DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {categories.map(cat => (
                            <DropdownMenuItem key={cat.id} onClick={() => handleAssignCategory(item.wardrobeItem!.id, cat.id)}>
                              {cat.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 size={14} className="mr-2" />
                      Remove from Trip
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setShowAddItemDialog(true)}>
          <Plus size={16} className="mr-2" /> Add Items
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setShowCategoryManager(true)}>
          <Settings size={16} className="mr-2" /> Manage Categories
        </Button>
      </div>

      {/* Items Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="bags">Bags ({bags.length})</TabsTrigger>
          <TabsTrigger value="occasions">Occasions ({occasions.length})</TabsTrigger>
          <TabsTrigger value="repacking">
            <RefreshCcw size={14} className="mr-1" />
            Repack
          </TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="space-y-4">
          {Object.entries(itemsByCategory).length > 0 ? (
            Object.entries(itemsByCategory).map(([categoryName, items]) => {
              const isCollapsed = collapsedCategories[categoryName];
              return (
                <Card key={categoryName}>
                  <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleCategoryCollapse(categoryName)}>
                    <CardTitle className="flex items-center justify-between">
                      <span>{categoryName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{items.length}</Badge>
                        <Badge variant="outline">
                          {items.filter(item => item.packed).length} packed
                        </Badge>
                        {isCollapsed ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronUp className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {!isCollapsed && <CardContent className="space-y-3">{items.map(renderItemCard)}</CardContent>}
                </Card>
              );
            })
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
          <BagManager
            tripId={currentTrip.id}
            bags={bags}
            setBags={setBags}
            tripItems={tripItems}
            setTripItems={setTripItems}
            wardrobeItems={wardrobeItems}
          />
        </TabsContent>

        <TabsContent value="occasions" className="space-y-4">
          <OccasionManager
            tripId={currentTrip.id}
            occasions={occasions}
            setOccasions={setOccasions}
            outfitItems={outfitItems}
            setOutfitItems={setOutfitItems}
            wardrobeItems={wardrobeItems}
            tripItems={tripItems}
          />
        </TabsContent>

        <TabsContent value="repacking" className="space-y-4">
          <RepackingManager
            tripId={currentTrip.id}
            bags={bags}
            tripItems={tripItems}
            setTripItems={setTripItems}
            wardrobeItems={wardrobeItems}
            categories={categories}
            updateTripItem={updateTripItem}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddItemToTripDialog
        isOpen={showAddItemDialog}
        onClose={() => setShowAddItemDialog(false)}
        onAddItems={handleAddItemToTrip}
      />
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
      <EditWardrobeItemDialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleUpdateItem}
      />
    </div>
  );
}