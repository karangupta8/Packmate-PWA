'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Star, Package, RotateCcw, Check, Search, Briefcase as Suitcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/lib/store/useStore';
import { wardrobeService, tripItemService } from '@/lib/db/services';
import { WardrobeItem, TripItem } from '@/lib/db/schema';
import { toast } from 'sonner';

export const PackingChecklist = () => {
  const { 
    currentTrip, 
    setCurrentTrip, 
    setActiveTab, 
    wardrobeItems, 
    tripItems, 
    setTripItems,
    categories 
  } = useStore();
  
  const [mode, setMode] = useState<'packing' | 'return'>('packing');
  const [showAddItems, setShowAddItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableItems, setAvailableItems] = useState<WardrobeItem[]>([]);

  useEffect(() => {
    if (currentTrip) {
      loadTripItems();
      loadAvailableItems();
    }
  }, [currentTrip]);

  const loadTripItems = async () => {
    if (!currentTrip) return;
    const items = await tripItemService.getByTripId(currentTrip.id);
    setTripItems(items);
  };

  const loadAvailableItems = async () => {
    const items = await wardrobeService.getAll();
    const tripItemIds = tripItems.map(ti => ti.itemId);
    const available = items.filter(item => !tripItemIds.includes(item.id));
    setAvailableItems(available);
  };

  const tripItemsWithDetails = useMemo(() => {
    return tripItems.map(tripItem => ({
      ...tripItem,
      item: wardrobeItems.find(item => item.id === tripItem.itemId),
    })).filter(ti => ti.item);
  }, [tripItems, wardrobeItems]);

  const filteredAvailableItems = useMemo(() => {
    return availableItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [availableItems, searchQuery]);

  const progress = useMemo(() => {
    const total = tripItems.length;
    const packed = tripItems.filter(item => item.packed).length;
    return { total, packed, percentage: total > 0 ? (packed / total) * 100 : 0 };
  }, [tripItems]);

  const essentialItems = tripItemsWithDetails.filter(ti => ti.essential);
  const regularItems = tripItemsWithDetails.filter(ti => !ti.essential);

  const handleTogglePacked = async (tripItemId: string, packed: boolean) => {
    try {
      await tripItemService.updatePacked(tripItemId, packed);
      setTripItems(tripItems.map(item => 
        item.id === tripItemId ? { ...item, packed } : item
      ));
      
      const action = mode === 'packing' ? (packed ? 'packed' : 'unpacked') : (packed ? 'still packed' : 'returned');
      toast.success(`Item ${action}`);
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleAddItemToTrip = async (item: WardrobeItem) => {
    if (!currentTrip) return;
    
    try {
      const tripItem = await tripItemService.add({
        tripId: currentTrip.id,
        itemId: item.id,
        packed: false,
        essential: item.essential,
      });
      
      setTripItems([...tripItems, tripItem]);
      setAvailableItems(availableItems.filter(i => i.id !== item.id));
      toast.success('Item added to trip');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleResetAll = async () => {
    try {
      const resetValue = mode === 'packing' ? false : true;
      
      await Promise.all(
        tripItems.map(item => tripItemService.updatePacked(item.id, resetValue))
      );
      
      setTripItems(tripItems.map(item => ({ ...item, packed: resetValue })));
      
      const action = mode === 'packing' ? 'unpacked all items' : 'marked all items as packed';
      toast.success(`Successfully ${action}`);
    } catch (error) {
      toast.error('Failed to reset items');
    }
  };

  if (!currentTrip) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No trip selected</h3>
        <p className="text-muted-foreground mb-4">
          Select a trip from your trips list to start packing
        </p>
        <Button onClick={() => setActiveTab('trips')}>
          Go to Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentTrip(null)}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{currentTrip.name}</h2>
          <p className="text-sm text-muted-foreground">
            {progress.packed}/{progress.total} items {mode === 'packing' ? 'packed' : 'returned'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddItems(true)}
        >
          <Plus size={16} className="mr-1" />
          Add Items
        </Button>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <Tabs value={mode} onValueChange={(value: string) => setMode(value as 'packing' | 'return')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packing">Packing Mode</TabsTrigger>
          <TabsTrigger value="return">Return Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="packing" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Check items as you pack them
            </p>
            <Button variant="outline" size="sm" onClick={handleResetAll}>
              <RotateCcw size={14} className="mr-1" />
              Unpack All
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="return" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Uncheck items as you unpack them
            </p>
            <Button variant="outline" size="sm" onClick={handleResetAll}>
              <Check size={14} className="mr-1" />
              Pack All
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Items List */}
      <div className="space-y-4 pb-20">
        {/* Essential Items */}
        {essentialItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                Essential Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {essentialItems.map((tripItem) => {
                const item = tripItem.item!;
                const category = categories.find(cat => cat.id === item.category);
                const isChecked = mode === 'packing' ? tripItem.packed : !tripItem.packed;
                
                return (
                  <div key={tripItem.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => 
                        handleTogglePacked(tripItem.id, mode === 'packing' ? checked as boolean : !checked)
                      }
                      className="min-w-[18px]"
                    />
                    
                    <div className="flex items-center space-x-3 flex-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        {category && (
                          <p className="text-sm text-muted-foreground">{category.name}</p>
                        )}
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Regular Items */}
        {regularItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Regular Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {regularItems.map((tripItem) => {
                const item = tripItem.item!;
                const category = categories.find(cat => cat.id === item.category);
                const isChecked = mode === 'packing' ? tripItem.packed : !tripItem.packed;
                
                return (
                  <div key={tripItem.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => 
                        handleTogglePacked(tripItem.id, mode === 'packing' ? checked as boolean : !checked)
                      }
                      className="min-w-[18px]"
                    />
                    
                    <div className="flex items-center space-x-3 flex-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        {category && (
                          <p className="text-sm text-muted-foreground">{category.name}</p>
                        )}
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {tripItems.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No items in this trip</h3>
            <p className="text-muted-foreground mb-4">
              Add items from your wardrobe to start packing
            </p>
            <Button onClick={() => setShowAddItems(true)}>
              <Plus size={18} className="mr-2" />
              Add Items
            </Button>
          </div>
        )}
      </div>

      {/* Add Items Dialog */}
      <Dialog open={showAddItems} onOpenChange={setShowAddItems}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Items to Trip</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search wardrobe items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredAvailableItems.map((item) => {
                const category = categories.find(cat => cat.id === item.category);
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-accent"
                    onClick={() => handleAddItemToTrip(item)}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <Package size={16} className="text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        {item.essential && (
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {category && (
                        <p className="text-sm text-muted-foreground">{category.name}</p>
                      )}
                    </div>
                    
                    <Button size="sm" variant="outline">
                      Add
                    </Button>
                  </div>
                );
              })}

              {filteredAvailableItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {availableItems.length === 0
                      ? "All wardrobe items are already in this trip"
                      : "No items found matching your search"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};