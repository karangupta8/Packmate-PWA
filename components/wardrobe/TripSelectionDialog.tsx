'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tripService, tripItemService } from '@/lib/db/services';
import { useStore } from '@/lib/store/useStore';
import { Trip, WardrobeItem } from '@/lib/db/schema';
import { toast } from 'sonner';

interface TripSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemsToAdd: WardrobeItem[];
}

export const TripSelectionDialog = ({ isOpen, onClose, itemsToAdd }: TripSelectionDialogProps) => {
  const { trips, addTrip, tripItems, setTripItems } = useStore();
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const handleAddToTrip = async (trip: Trip) => {
    if (itemsToAdd.length === 0) return;
    
    setLoading(true);
    setSelectedTrip(trip);
    
    try {
      const newTripItems = [];
      
      for (const item of itemsToAdd) {
        // Check if item is already in this trip
        const existingTripItem = tripItems.find(
          ti => ti.tripId === trip.id && ti.itemId === item.id
        );
        
        if (!existingTripItem) {
          const tripItem = await tripItemService.add({
            tripId: trip.id,
            itemId: item.id,
            packed: false,
            essential: item.essential,
          });
          newTripItems.push(tripItem);
        }
      }
      
      if (newTripItems.length > 0) {
        setTripItems([...tripItems, ...newTripItems]);
        
        const itemText = itemsToAdd.length === 1 ? 'item' : 'items';
        const addedText = newTripItems.length === itemsToAdd.length 
          ? `${newTripItems.length} ${itemText}` 
          : `${newTripItems.length} of ${itemsToAdd.length} ${itemText}`;
        
        toast.success(`Added ${addedText} to ${trip.name}`);
        
        if (newTripItems.length < itemsToAdd.length) {
          const skipped = itemsToAdd.length - newTripItems.length;
          toast.info(`${skipped} ${skipped === 1 ? 'item was' : 'items were'} already in this trip`);
        }
      } else {
        const itemText = itemsToAdd.length === 1 ? 'Item is' : 'Items are';
        toast.info(`${itemText} already in ${trip.name}`);
      }
      
      onClose();
    } catch (error) {
      toast.error('Failed to add items to trip');
    } finally {
      setLoading(false);
      setSelectedTrip(null);
    }
  };

  const availableTrips = trips.filter(trip => !trip.isTemplate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {itemsToAdd.length === 1 ? 'Item' : `${itemsToAdd.length} Items`} to Trip
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Items Preview */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Items to add:</p>
            <div className="flex flex-wrap gap-1">
              {itemsToAdd.slice(0, 3).map((item) => (
                <Badge key={item.id} variant="secondary" className="text-xs">
                  {item.name}
                </Badge>
              ))}
              {itemsToAdd.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{itemsToAdd.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Trip List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {availableTrips.length > 0 ? (
              availableTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedTrip?.id === trip.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => !loading && handleAddToTrip(trip)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{trip.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {format(trip.startDate, 'MMM dd')} - {format(trip.endDate, 'MMM dd')}
                          </div>
                          {trip.destination && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span className="truncate">{trip.destination}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {trip.type}
                        </Badge>
                        {loading && selectedTrip?.id === trip.id && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No trips available</p>
                <p className="text-sm text-muted-foreground">
                  Create a trip first to add items to it
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};