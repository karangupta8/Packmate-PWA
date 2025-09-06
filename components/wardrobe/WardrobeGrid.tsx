'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Star, Edit, Trash2, Package, Briefcase as Suitcase, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useStore } from '@/lib/store/useStore';
import { AddItemForm } from './AddItemForm';
import { TripSelectionDialog } from './TripSelectionDialog';
import { EditWardrobeItemDialog } from './EditWardrobeItemDialog';
import { wardrobeService } from '@/lib/db/services';
import { WardrobeItem } from '@/lib/db/schema';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/db/database';

export const WardrobeGrid = () => {
  const { wardrobeItems, categories, removeWardrobeItem, updateWardrobeItem } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [essentialFilter, setEssentialFilter] = useState<string>('all');
  const [deleteItem, setDeleteItem] = useState<string | null>(null);
  
  // Multi-select and trip addition states
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showTripSelectionDialog, setShowTripSelectionDialog] = useState(false);
  const [itemsToAddToTrip, setItemsToAddToTrip] = useState<WardrobeItem[]>([]);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);

  const filteredItems = useMemo(() => {
    return wardrobeItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesEssential = essentialFilter === 'all' || 
        (essentialFilter === 'essential' && item.essential) ||
        (essentialFilter === 'regular' && !item.essential);
      
      return matchesSearch && matchesCategory && matchesEssential;
    });
  }, [wardrobeItems, searchQuery, selectedCategory, essentialFilter]);

  const handleDeleteItem = async (id: string) => {
    if (multiSelectMode) {
      toast.error('Exit multi-select mode to delete items');
      return;
    }
    
    try {
      await wardrobeService.delete(id);
      removeWardrobeItem(id);
      toast.success('Item removed from wardrobe');
    } catch (error) {
      toast.error('Failed to remove item');
    }
    setDeleteItem(null);
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

      updateWardrobeItem(updatedItem.id, updatedItem);
      
      toast.success("Item updated successfully.");
      setEditingItem(null);
    } catch (error) {
      toast.error("Failed to update item.");
    }
  };

  const handleToggleMultiSelect = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedItems(new Set());
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    if (checked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleAddSingleItemToTrip = (item: WardrobeItem) => {
    setItemsToAddToTrip([item]);
    setShowTripSelectionDialog(true);
  };

  const handleAddSelectedItemsToTrip = () => {
    const items = wardrobeItems.filter(item => selectedItems.has(item.id));
    if (items.length === 0) {
      toast.error('No items selected');
      return;
    }
    setItemsToAddToTrip(items);
    setShowTripSelectionDialog(true);
  };

  const handleTripSelectionClose = () => {
    setShowTripSelectionDialog(false);
    setItemsToAddToTrip([]);
    // Exit multi-select mode after successful addition
    if (multiSelectMode) {
      setMultiSelectMode(false);
      setSelectedItems(new Set());
    }
  };

  if (showAddForm) {
    return <AddItemForm onClose={() => setShowAddForm(false)} />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={essentialFilter} onValueChange={setEssentialFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="essential">Essential Only</SelectItem>
              <SelectItem value="regular">Regular Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setShowAddForm(true)} className="flex-1">
          <Plus size={18} className="mr-2" />
          Add New Item
        </Button>
        
        <Button 
          variant={multiSelectMode ? "secondary" : "outline"} 
          onClick={handleToggleMultiSelect}
          className="flex-1"
        >
          {multiSelectMode ? (
            <>
              <X size={18} className="mr-2" />
              Cancel ({selectedItems.size})
            </>
          ) : (
            <>
              <Check size={18} className="mr-2" />
              Select Multiple
            </>
          )}
        </Button>
      </div>

      {/* Multi-select Actions */}
      {multiSelectMode && selectedItems.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <Button size="sm" onClick={handleAddSelectedItemsToTrip}>
              <Suitcase size={16} className="mr-1" />
              Add to Trip
            </Button>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 pb-20">
          {filteredItems.map((item) => {
            const category = categories.find(cat => cat.id === item.category);
            const isSelected = selectedItems.has(item.id);
            
            return (
              <Card 
                key={item.id} 
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  multiSelectMode && isSelected && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="aspect-square relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package size={32} className="text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Essential Star */}
                  {item.essential && (
                    <div className="absolute top-2 right-2">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                  
                  {/* Multi-select Checkbox */}
                  {multiSelectMode && (
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                        className="bg-white/90 border-2"
                      />
                    </div>
                  )}
                  
                  {/* Single Item Add to Trip Button */}
                  {!multiSelectMode && (
                    <div className="absolute bottom-2 right-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 bg-white/90 hover:bg-white flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSingleItemToTrip(item);
                        }}
                      >
                        <Suitcase className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  {category && (
                    <p className="text-xs text-muted-foreground mb-2">{category.name}</p>
                  )}
                  
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {!multiSelectMode && (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {wardrobeItems.length === 0
              ? "Add your first item to start building your wardrobe"
              : "Try adjusting your search or filters"}
          </p>
          {wardrobeItems.length === 0 && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={18} className="mr-2" />
              Add First Item
            </Button>
          )}
        </div>
      )}

      {/* Trip Selection Dialog */}
      <TripSelectionDialog
        isOpen={showTripSelectionDialog}
        onClose={handleTripSelectionClose}
        itemsToAdd={itemsToAddToTrip}
      />

      {/* Edit Item Dialog */}
      <EditWardrobeItemDialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleUpdateItem}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your wardrobe? This action cannot be undone and will remove it from all trips.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && handleDeleteItem(deleteItem)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};