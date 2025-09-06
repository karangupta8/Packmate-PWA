'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store/useStore';
import { WardrobeItem } from '@/lib/db/schema';
import { Package, Search } from 'lucide-react';

interface AddItemToTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: WardrobeItem[]) => void;
}

export const AddItemToTripDialog = ({ isOpen, onClose, onAddItems }: AddItemToTripDialogProps) => {
  const { wardrobeItems, tripItems, categories } = useStore();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const availableItems = useMemo(() => {
    const tripItemIds = new Set(tripItems.map(ti => ti.itemId));
    return wardrobeItems.filter(item => !tripItemIds.has(item.id));
  }, [wardrobeItems, tripItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return availableItems;
    return availableItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [availableItems, searchQuery]);

  const handleToggleItem = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  };

  const handleAddSelectedItems = () => {
    const itemsToAdd = wardrobeItems.filter(item => selectedItemIds.has(item.id));
    onAddItems(itemsToAdd);
    setSelectedItemIds(new Set()); // Reset selection
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItemIds(new Set());
      setSearchQuery('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Items from Wardrobe</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent"
                onClick={() => handleToggleItem(item.id)}
              >
                <Checkbox
                  checked={selectedItemIds.has(item.id)}
                  onCheckedChange={() => handleToggleItem(item.id)}
                />
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                    <Package size={24} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {categories.find(c => c.id === item.category)?.name || 'Uncategorized'}
                  </p>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No available items found.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAddSelectedItems} disabled={selectedItemIds.size === 0}>
            Add {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};