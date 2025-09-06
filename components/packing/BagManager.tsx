'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Luggage, Edit2, Trash2, X, Package, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bagService, tripItemService } from '@/lib/db/services';
import { Bag, TripItem, WardrobeItem, bagTypes } from '@/lib/db/schema';
import { toast } from 'sonner';

interface BagManagerProps {
  tripId: string;
  bags: Bag[];
  setBags: (bags: Bag[]) => void;
  tripItems: TripItem[];
  setTripItems: (items: TripItem[]) => void;
  wardrobeItems: WardrobeItem[];
}

const bagColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
];

export const BagManager = ({ 
  tripId, 
  bags, 
  setBags,
  tripItems,
  setTripItems,
  wardrobeItems
}: BagManagerProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assign'>('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [editingBag, setEditingBag] = useState<Bag | null>(null);
  const [newBag, setNewBag] = useState({
    name: '',
    type: 'suitcase' as Bag['type'],
    color: bagColors[0],
    maxWeight: '',
    notes: ''
  });

  useEffect(() => {
    if (editingBag) {
      setShowCreateForm(false);
    }
  }, [editingBag]);

  // Get trip items with wardrobe details
  const tripItemsWithDetails = useMemo(() => {
    return tripItems.map(tripItem => ({
      ...tripItem,
      item: wardrobeItems.find(item => item.id === tripItem.itemId),
    })).filter(ti => ti.item);
  }, [tripItems, wardrobeItems]);

  // Get items for selected bag
  const selectedBagItems = useMemo(() => {
    if (!selectedBag) return [];
    return tripItemsWithDetails.filter(ti => ti.bagId === selectedBag.id);
  }, [tripItemsWithDetails, selectedBag]);

  // Get unassigned items
  const unassignedItems = useMemo(() => {
    return tripItemsWithDetails.filter(ti => !ti.bagId);
  }, [tripItemsWithDetails]);

  const handleCreateBag = async () => {
    if (!newBag.name.trim()) return;

    try {
      const bag = await bagService.add({
        tripId,
        name: newBag.name.trim(),
        type: newBag.type,
        color: newBag.color,
        maxWeight: newBag.maxWeight ? parseInt(newBag.maxWeight) : undefined,
        notes: newBag.notes.trim() || undefined,
      });

      setBags([...bags, bag]);
      setNewBag({ name: '', type: 'suitcase', color: bagColors[0], maxWeight: '', notes: '' });
      setShowCreateForm(false);
      toast.success('Bag created');
    } catch (error) {
      toast.error('Failed to create bag');
    }
  };

  const handleUpdateBag = async () => {
    if (!editingBag || !editingBag.name.trim()) return;

    try {
      const updatedBag = await bagService.update(editingBag.id, {
        name: editingBag.name.trim(),
        type: editingBag.type,
        color: editingBag.color,
        maxWeight: editingBag.maxWeight ? Number(editingBag.maxWeight) : undefined,
        notes: editingBag.notes?.trim() || undefined,
      });
      setBags(bags.map(b => b.id === updatedBag.id ? updatedBag : b));
      setEditingBag(null);
      toast.success('Bag updated');
    } catch (error) {
      toast.error('Failed to update bag');
    }
  };

  const handleDeleteBag = async (bagId: string) => {
    try {
      await bagService.delete(bagId);
      setBags(bags.filter(bag => bag.id !== bagId));
      
      // Unassign items from this bag
      const updatedTripItems = tripItems.map(item => 
        item.bagId === bagId ? { ...item, bagId: undefined } : item
      );
      setTripItems(updatedTripItems);
      
      if (selectedBag?.id === bagId) {
        setSelectedBag(null);
      }
      
      toast.success('Bag deleted');
    } catch (error) {
      toast.error('Failed to delete bag');
    }
  };

  const handleAssignItemToBag = async (tripItemId: string, bagId: string | null) => {
    try {
      const bagIdToSet = bagId === null ? undefined : bagId;
      await tripItemService.update(tripItemId, { bagId: bagIdToSet });
      setTripItems(tripItems.map(item => 
        item.id === tripItemId ? { ...item, bagId: bagIdToSet } : item
      ));
      toast.success(bagId ? 'Item assigned to bag' : 'Item unassigned from bag');
    } catch (error) {
      toast.error('Failed to assign item');
    }
  };

  const getBagTypeIcon = (type: Bag['type']) => {
    const bagType = bagTypes.find(bt => bt.id === type);
    return bagType?.icon || 'Luggage';
  };

  if (selectedBag) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedBag(null)}>
            <ArrowLeft size={16} />
          </Button>
          <h3 className="text-lg font-semibold">
            {selectedBag.name} Contents
          </h3>
        </div>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: selectedBag.color }}
                />
                <span className="font-medium">{selectedBag.name}</span>
                <Badge variant="outline" className="text-xs">
                  {bagTypes.find(bt => bt.id === selectedBag.type)?.name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedBagItems.length} item{selectedBagItems.length !== 1 ? 's' : ''} assigned
              </p>
              {selectedBag.maxWeight && (
                <p className="text-sm text-muted-foreground">
                  Max weight: {selectedBag.maxWeight}kg
                </p>
              )}
            </div>

            <div className="space-y-2">
              {selectedBagItems.length > 0 ? (
                selectedBagItems.map((tripItem) => {
                  const item = tripItem.item!;
                  
                  return (
                    <div key={tripItem.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className="flex items-center space-x-3 flex-1">
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
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignItemToBag(tripItem.id, null)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No items assigned to this bag</p>
                </div>
              )}
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assign">Assign Items ({unassignedItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Create New Bag */}
            {showCreateForm ? (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Create New Bag</h4>
                    <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
                      <X size={16} />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bag-name">Bag Name</Label>
                      <Input
                        id="bag-name"
                        value={newBag.name}
                        onChange={(e) => setNewBag({ ...newBag, name: e.target.value })}
                        placeholder="e.g., Main Suitcase"
                      />
                    </div>

                    <div>
                      <Label>Bag Type</Label>
                      <Select value={newBag.type} onValueChange={(value: Bag['type']) => setNewBag({ ...newBag, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bagTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2 mt-2">
                        {bagColors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newBag.color === color ? 'border-foreground' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewBag({ ...newBag, color })}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="max-weight">Max Weight (kg) - Optional</Label>
                      <Input
                        id="max-weight"
                        type="number"
                        value={newBag.maxWeight}
                        onChange={(e) => setNewBag({ ...newBag, maxWeight: e.target.value })}
                        placeholder="e.g., 23"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCreateBag} className="flex-1">
                        Create Bag
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                <Plus size={16} className="mr-2" />
                Add New Bag
              </Button>
            )}

            {/* Existing Bags */}
            <div className="space-y-2">
              {bags.map((bag) => {
                const bagItems = tripItemsWithDetails.filter(ti => ti.bagId === bag.id);
                
                return (
                  <Card key={bag.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    {editingBag?.id === bag.id ? (
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`bag-name-${bag.id}`}>Bag Name</Label>
                            <Input
                              id={`bag-name-${bag.id}`}
                              value={editingBag.name}
                              onChange={(e) => setEditingBag({ ...editingBag, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Bag Type</Label>
                            <Select value={editingBag.type} onValueChange={(value: Bag['type']) => setEditingBag({ ...editingBag, type: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {bagTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Color</Label>
                            <div className="flex gap-2 mt-2">
                              {bagColors.map((color) => (
                                <button
                                  key={color}
                                  className={`w-8 h-8 rounded-full border-2 ${editingBag.color === color ? 'border-foreground' : 'border-transparent'}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => setEditingBag({ ...editingBag, color })}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateBag} className="flex-1">Save</Button>
                            <Button variant="outline" onClick={() => setEditingBag(null)}>Cancel</Button>
                          </div>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-start gap-3 flex-1 min-w-0"
                            onClick={() => setSelectedBag(bag)}
                          >
                            <div 
                              className="w-4 h-4 rounded-full mt-1 flex-shrink-0" 
                              style={{ backgroundColor: bag.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{bag.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {bagTypes.find(bt => bt.id === bag.type)?.name}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {bagItems.length} item{bagItems.length !== 1 ? 's' : ''} assigned
                              </p>
                              {bagItems.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {bagItems.slice(0, 3).map(({ item }) => item!.name).join(', ')}
                                  {bagItems.length > 3 ? ` and ${bagItems.length - 3} more` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditingBag(bag)}><Edit2 size={14} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBag(bag.id)}><Trash2 size={14} /></Button>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {bags.length === 0 && (
                <div className="text-center py-8">
                  <Luggage size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No bags created yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assign" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
                  {unassignedItems.map((tripItem) => {
                    const item = tripItem.item!;
                    
                    return (
                      <div key={tripItem.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                        <div className="flex items-center space-x-2 flex-1">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              <Package size={12} className="text-muted-foreground" />
                            </div>
                          )}
                          <span className="text-sm font-medium truncate">{item.name}</span>
                        </div>
                        
                        <Select onValueChange={(bagId) => handleAssignItemToBag(tripItem.id, bagId)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {bags.map((bag) => (
                              <SelectItem key={bag.id} value={bag.id}>
                                {bag.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  
                  {unassignedItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All items are assigned to bags
                    </p>
                  )}
                </div>
              </div>

              {bags.length === 0 && (
                <div className="text-center py-8">
                  <Luggage size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No bags available</p>
                  <p className="text-sm text-muted-foreground">Create bags first to assign items</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
};