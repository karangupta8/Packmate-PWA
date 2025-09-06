'use client';

import React, { useState, useMemo } from 'react';
import { TripItem, Bag, WardrobeItem } from '@/lib/db/schema';
import { tripItemService } from '@/lib/db/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Package, 
  RefreshCcw, 
  Star, 
  Luggage, 
  CheckCircle2, 
  Undo2,
  MoreVertical,
  RotateCcw,
  ArrowRight,
  Hotel,
  Home
} from 'lucide-react';

interface RepackingManagerProps {
  tripId: string;
  bags: Bag[];
  tripItems: TripItem[];
  setTripItems: (items: TripItem[]) => void;
  wardrobeItems: WardrobeItem[];
  categories: any[];
  updateTripItem: (id: string, updates: Partial<TripItem>) => void;
}

export function RepackingManager({
  tripId,
  bags,
  tripItems,
  setTripItems,
  wardrobeItems,
  categories,
  updateTripItem
}: RepackingManagerProps) {
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

  // Group items by their status for repacking view
  const { packedItems, unpackedItems } = useMemo(() => {
    const packed = tripItemsWithDetails.filter(item => item.packed);
    const unpacked = tripItemsWithDetails.filter(item => !item.packed);
    
    return {
      packedItems: packed,
      unpackedItems: unpacked
    };
  }, [tripItemsWithDetails]);

  // Repacking progress
  const repackingProgress = useMemo(() => {
    const total = unpackedItems.length;
    const repacked = 0; // We could add a 'repacked' field to track this
    return { total, repacked, percentage: total > 0 ? Math.round((repacked / total) * 100) : 100 };
  }, [unpackedItems]);

  const handleTogglePacked = async (tripItemId: string, packed: boolean) => {
    try {
      await tripItemService.updatePacked(tripItemId, packed);
      updateTripItem(tripItemId, { packed });
      
      if (packed) {
        toast.success('Item repacked successfully');
      } else {
        toast.success('Item unpacked');
      }
    } catch (error) {
      toast.error('Failed to update packing status');
    }
  };

  const handleRepackAll = async () => {
    try {
      const promises = unpackedItems.map(item => 
        tripItemService.updatePacked(item.id, true)
      );
      
      await Promise.all(promises);
      
      // Update local state
      const updatedItems = tripItems.map(item => 
        unpackedItems.some(ui => ui.id === item.id) 
          ? { ...item, packed: true }
          : item
      );
      
      setTripItems(updatedItems);
      toast.success(`Repacked ${unpackedItems.length} items`);
    } catch (error) {
      toast.error('Failed to repack all items');
    }
  };

  const handleUnpackAll = async () => {
    try {
      const promises = packedItems.map(item => 
        tripItemService.updatePacked(item.id, false)
      );
      
      await Promise.all(promises);
      
      // Update local state
      const updatedItems = tripItems.map(item => ({ ...item, packed: false }));
      
      setTripItems(updatedItems);
      toast.success(`Unpacked ${packedItems.length} items`);
    } catch (error) {
      toast.error('Failed to unpack all items');
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

  const renderItemCard = (item: typeof tripItemsWithDetails[0], showPackedState = true) => {
    return (
      <Card key={item.id} className={`transition-all ${item.packed && showPackedState ? 'bg-green-50 dark:bg-green-950' : ''}`}>
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
                    {item.packed && showPackedState && (
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
                    <div className="flex flex-wrap gap-1">
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
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Repacking Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Hotel size={24} className="text-orange-600" />
            <div>
              <h2 className="text-xl font-bold">Repacking Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Organize your items for repacking when staying at hotels or moving locations
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleUnpackAll}
              disabled={packedItems.length === 0}
              className="flex-1"
            >
              <Undo2 size={16} className="mr-2" />
              Unpack All ({packedItems.length})
            </Button>
            <Button 
              variant="default"
              onClick={handleRepackAll}
              disabled={unpackedItems.length === 0}
              className="flex-1"
            >
              <RefreshCcw size={16} className="mr-2" />
              Repack All ({unpackedItems.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unpacked Items - Items to Repack */}
      {unpackedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-orange-600" />
                <span>Items to Repack</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{unpackedItems.length}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRepackAll}
                  disabled={unpackedItems.length === 0}
                >
                  <RefreshCcw size={14} className="mr-1" />
                  Repack All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unpackedItems.map(item => renderItemCard(item, false))}
          </CardContent>
        </Card>
      )}

      {/* Packed Items - Ready to Go */}
      {packedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-600" />
                <span>Repacked Items</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">
                  {packedItems.length} ready
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnpackAll}
                  disabled={packedItems.length === 0}
                >
                  <Undo2 size={14} className="mr-1" />
                  Unpack All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {packedItems.map(item => renderItemCard(item))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {tripItemsWithDetails.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Items to Repack</h3>
            <p className="text-muted-foreground">
              Add items to this trip first to use the repacking assistant.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <RefreshCcw size={20} />
            Repacking Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Use "Unpack All" when you arrive at your destination to mark items as needing repacking</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Check off items as you repack them to keep track of your progress</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Reassign items to different bags if your packing strategy changes</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p>Essential items are marked with a star - pack these first</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
