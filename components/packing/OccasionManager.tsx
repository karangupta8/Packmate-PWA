'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  Edit2, 
  Trash2, 
  X, 
  Star, 
  Package, 
  ArrowLeft,
  Sun, Moon, Coffee, Wine, Camera as CameraIcon, Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { occasionService, outfitItemService } from '@/lib/db/services';
import { Occasion, OutfitItem, WardrobeItem, TripItem } from '@/lib/db/schema';
import { toast } from 'sonner';

interface OccasionManagerProps {
  tripId: string;
  occasions: Occasion[];
  setOccasions: (occasions: Occasion[]) => void;
  outfitItems: OutfitItem[];
  setOutfitItems: (items: OutfitItem[]) => void;
  wardrobeItems: WardrobeItem[];
  tripItems: TripItem[];
}

const occasionIcons: Record<string, React.ElementType> = {
  Calendar,
  Star,
  Sun,
  Moon,
  Coffee,
  Wine,
  Camera: CameraIcon,
  Music,
};
const occasionIconNames = Object.keys(occasionIcons);

const occasionColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
];

export const OccasionManager = ({ 
  tripId, 
  occasions, 
  setOccasions,
  outfitItems,
  setOutfitItems,
  wardrobeItems,
  tripItems
}: OccasionManagerProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [newOccasion, setNewOccasion] = useState({
    name: '',
    description: '',
    icon: occasionIconNames[0],
    color: occasionColors[0],
  });

  // Get trip items with wardrobe details
  const tripItemsWithDetails = useMemo(() => {
    return tripItems.map(tripItem => ({
      ...tripItem,
      item: wardrobeItems.find(item => item.id === tripItem.itemId),
    })).filter(ti => ti.item);
  }, [tripItems, wardrobeItems]);

  // Get outfit items for selected occasion
  const selectedOccasionOutfitItems = useMemo(() => {
    if (!selectedOccasion) return [];
    return outfitItems.filter(oi => oi.occasionId === selectedOccasion.id);
  }, [outfitItems, selectedOccasion]);

  const handleCreateOccasion = async () => {
    if (!newOccasion.name.trim()) return;

    try {
      const occasion = await occasionService.add({
        tripId,
        name: newOccasion.name.trim(),
        description: newOccasion.description.trim() || undefined,
        icon: newOccasion.icon,
        color: newOccasion.color,
      });

      setOccasions([...occasions, occasion]);
      setNewOccasion({ name: '', description: '', icon: occasionIconNames[0], color: occasionColors[0] });
      setShowCreateForm(false);
      toast.success('Occasion created');
    } catch (error) {
      toast.error('Failed to create occasion');
    }
  };

  const handleDeleteOccasion = async (occasionId: string) => {
    try {
      await occasionService.delete(occasionId);
      setOccasions(occasions.filter(occ => occ.id !== occasionId));
      
      // Remove outfit items from state
      setOutfitItems(outfitItems.filter(oi => oi.occasionId !== occasionId));
      
      if (selectedOccasion?.id === occasionId) {
        setSelectedOccasion(null);
      }
      
      toast.success('Occasion deleted');
    } catch (error) {
      toast.error('Failed to delete occasion');
    }
  };

  const handleToggleOutfitItem = async (tripItem: any, isSelected: boolean) => {
    if (!selectedOccasion) return;

    try {
      if (isSelected) {
        // Add to outfit
        const outfitItem = await outfitItemService.add({
          occasionId: selectedOccasion.id,
          itemId: tripItem.itemId,
        });
        setOutfitItems([...outfitItems, outfitItem]);
      } else {
        // Remove from outfit
        const outfitItem = outfitItems.find(
          oi => oi.occasionId === selectedOccasion.id && oi.itemId === tripItem.itemId
        );
        if (outfitItem) {
          await outfitItemService.delete(outfitItem.id);
          setOutfitItems(outfitItems.filter(oi => oi.id !== outfitItem.id));
        }
      }
      toast.success(isSelected ? 'Item added to outfit' : 'Item removed from outfit');
    } catch (error) {
      toast.error('Failed to update outfit');
    }
  };

  if (selectedOccasion) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedOccasion(null)}>
            <ArrowLeft size={16} />
          </Button>
          <h3 className="text-lg font-semibold">
            Plan Outfit: {selectedOccasion.name}
          </h3>
        </div>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">Selected Items: {selectedOccasionOutfitItems.length}</p>
              {selectedOccasion.description && (
                <p className="text-sm text-muted-foreground">{selectedOccasion.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Available Items</Label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {tripItemsWithDetails.map((tripItem) => {
                  const item = tripItem.item!;
                  const isInOutfit = selectedOccasionOutfitItems.some(oi => oi.itemId === item.id);
                  
                  return (
                    <div key={tripItem.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <Checkbox
                        checked={isInOutfit}
                        onCheckedChange={(checked) => handleToggleOutfitItem(tripItem, checked as boolean)}
                      />
                      
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create New Occasion */}
      {showCreateForm ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Create New Occasion</h4>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
                    <X size={16} />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="occasion-name">Occasion Name</Label>
                    <Input
                      id="occasion-name"
                      value={newOccasion.name}
                      onChange={(e) => setNewOccasion({ ...newOccasion, name: e.target.value })}
                      placeholder="e.g., Cocktail Night"
                    />
                  </div>

                  <div>
                    <Label htmlFor="occasion-description">Description (Optional)</Label>
                    <Textarea
                      id="occasion-description"
                      value={newOccasion.description}
                      onChange={(e) => setNewOccasion({ ...newOccasion, description: e.target.value })}
                      placeholder="e.g., Formal dinner at the hotel"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-2">
                      {occasionColors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newOccasion.color === color ? 'border-foreground' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewOccasion({ ...newOccasion, color })}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Icon</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {occasionIconNames.map((iconName) => {
                        const IconComponent = occasionIcons[iconName];
                        return (
                          <Button
                            key={iconName}
                            variant={newOccasion.icon === iconName ? "default" : "outline"}
                            size="icon"
                            onClick={() => setNewOccasion({ ...newOccasion, icon: iconName })}
                          >
                            <IconComponent size={18} />
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateOccasion} className="flex-1">
                      Create Occasion
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
              Add New Occasion
            </Button>
          )}

      {/* Existing Occasions */}
      <div className="space-y-2">
            {occasions.map((occasion) => {
              const outfitItemCount = outfitItems.filter(oi => oi.occasionId === occasion.id).length;
              
              return (
                <Card key={occasion.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1"
                        onClick={() => setSelectedOccasion(occasion)}
                      >
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: occasion.color }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{occasion.name}</h4>
                          {occasion.description && (
                            <p className="text-sm text-muted-foreground truncate">{occasion.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {outfitItemCount} item{outfitItemCount !== 1 ? 's' : ''} selected
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOccasion(occasion)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOccasion(occasion.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {occasions.length === 0 && (
              <div className="text-center py-8">
                <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No occasions created yet</p>
              </div>
            )}
      </div>
    </div>
  );
};