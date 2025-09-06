'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Calendar, MapPin, Users, Star, Package, Search, Filter, MoreVertical, Edit, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/lib/store/useStore';
import { TripForm } from './TripForm';
import { toast } from 'sonner';
import { tripService, tripItemService, occasionService, bagService, outfitItemService, wardrobeService } from '@/lib/db/services';
import { Trip, WardrobeItem, TripItem } from '@/lib/db/schema';

// Helper function to determine trip status
const getTripStatus = (trip: any) => {
  const now = new Date();
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  if (now < startDate) {
    return { status: 'Upcoming', variant: 'secondary' as const };
  } else if (now >= startDate && now <= endDate) {
    return { status: 'Active', variant: 'default' as const };
  } else {
    return { status: 'Completed', variant: 'outline' as const };
  }
};

export const TripsList = () => {
  const { 
    trips, 
    setTrips, 
    currentTrip, 
    setCurrentTrip, 
    setActiveTab,
    tripItems,
    setTripItems,
    wardrobeItems,
    setWardrobeItems
  } = useStore();
  
  const [showTripForm, setShowTripForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const importFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const tripsData = await tripService.getAll();
      setTrips(tripsData);
    } catch (error) {
      toast.error('Failed to load trips');
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch =
        trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trip.destination || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (statusFilter === 'all') return true;
      
      const { status } = getTripStatus(trip);
      return status.toLowerCase() === statusFilter;
    });
  }, [trips, searchQuery, statusFilter]);

  const tripStats = useMemo(() => {
    const itemsByTrip = tripItems.reduce((acc, item) => {
      if (!acc[item.tripId]) {
        acc[item.tripId] = [];
      }
      acc[item.tripId].push(item);
      return acc;
    }, {} as Record<string, TripItem[]>);

    const stats = new Map<string, { itemCount: number; packedCount: number }>();
    for (const trip of trips) {
      const itemsInTrip = itemsByTrip[trip.id] || [];
      stats.set(trip.id, {
        itemCount: itemsInTrip.length,
        packedCount: itemsInTrip.filter(item => item.packed).length,
      });
    }
    return stats;
  }, [trips, tripItems]);

  const handleCreateTrip = () => {
    setEditingTrip(null);
    setShowTripForm(true);
  };

  const handleEditTrip = (trip: any) => {
    setEditingTrip(trip);
    setShowTripForm(true);
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    try {
      await tripService.delete(tripId);
      setTrips(trips.filter(trip => trip.id !== tripId));
      
      if (currentTrip?.id === tripId) {
        setCurrentTrip(null);
      }
      
      toast.success('Trip deleted successfully');
    } catch (error) {
      toast.error('Failed to delete trip');
    }
  };

  const handleSelectTrip = (trip: any) => {
    setCurrentTrip(trip);
    setActiveTab('packing');
  };

  const handleExportTrip = async (trip: any) => {
    try {
      // Get all trip data
      const [tripItemsData, occasionsData, bagsData] = await Promise.all([
        tripItemService.getByTripId(trip.id),
        occasionService.getByTripId(trip.id),
        bagService.getByTripId(trip.id)
      ]);

      // Get outfit items for all occasions
      const allOutfitItems = [];
      for (const occasion of occasionsData) {
        const items = await outfitItemService.getByOccasionId(occasion.id);
        allOutfitItems.push(...items);
      }

      // Get wardrobe items for this trip
      const tripWardrobeItems = wardrobeItems.filter(item => 
        tripItemsData.some(ti => ti.itemId === item.id)
      );

      const exportData = {
        trip,
        tripItems: tripItemsData,
        wardrobeItems: tripWardrobeItems,
        occasions: occasionsData,
        outfitItems: allOutfitItems,
        bags: bagsData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Trip exported successfully');
    } catch (error) {
      toast.error('Failed to export trip');
    }
  };

  const handleImportTrip = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.trip || !importData.wardrobeItems) {
        throw new Error('Invalid import file format');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _t, createdAt: _tc, updatedAt: _tu, ...tripData } = importData.trip;
      // Create new trip
      const newTrip = await tripService.add({
        ...tripData,
        name: `${importData.trip.name} (Imported)`
      });

      // Import wardrobe items
      const wardrobeItemMap = new Map();
      const newWardrobeItems: WardrobeItem[] = [];
      for (const item of importData.wardrobeItems) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _i, createdAt: _ic, updatedAt: _iu, ...itemData } = item;
        const newItem = await wardrobeService.add(itemData);
        newWardrobeItems.push(newItem);
        wardrobeItemMap.set(item.id, newItem.id);
      }

      // Import trip items
      const newTripItems: TripItem[] = [];
      if (importData.tripItems) {
        for (const tripItem of importData.tripItems) {
          const newItemId = wardrobeItemMap.get(tripItem.itemId);
          if (newItemId) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _ti, addedAt: _ta, ...tripItemData } = tripItem;
            const newTripItem = await tripItemService.add({
              ...tripItemData,
              tripId: newTrip.id,
              itemId: newItemId
            });
            newTripItems.push(newTripItem);
          }
        }
      }

      // Import occasions and outfit items
      if (importData.occasions) {
        for (const occasion of importData.occasions) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _o, createdAt: _oc, ...occasionData } = occasion;
          const newOccasion = await occasionService.add({
            ...occasionData,
            tripId: newTrip.id
          });

          // Import outfit items for this occasion
          if (importData.outfitItems) {
            const occasionOutfitItems = importData.outfitItems.filter(
              (oi: any) => oi.occasionId === occasion.id
            );
            
            for (const outfitItem of occasionOutfitItems) {
              const newItemId = wardrobeItemMap.get(outfitItem.itemId);
              if (newItemId) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _oi, addedAt: _oa, ...outfitItemData } = outfitItem;
                await outfitItemService.add({
                  ...outfitItemData,
                  occasionId: newOccasion.id,
                  itemId: newItemId
                });
              }
            }
          }
        }
      }

      // Import bags
      if (importData.bags) {
        for (const bag of importData.bags) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _b, createdAt: _bc, ...bagData } = bag;
          await bagService.add({
            ...bagData,
            tripId: newTrip.id
          });
        }
      }

      // Update local store state to reflect imported data
      setWardrobeItems([...wardrobeItems, ...newWardrobeItems]);
      setTripItems([...tripItems, ...newTripItems]);
      await loadTrips();

      toast.success('Trip imported successfully');
    } catch (error) {
      toast.error('Failed to import trip. Please check the file format.');
      console.error("Import failed:", error);
    }

    // Reset file input
    if (importFileInputRef.current) {
      importFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Trips</h2>
          <p className="text-muted-foreground">
            Plan and organize your travel adventures
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => importFileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" />
            Import
          </Button>
          <input
            type="file"
            ref={importFileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImportTrip}
          />
          <Button onClick={handleCreateTrip}>
            <Plus size={16} className="mr-2" />
            New Trip
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter size={16} className="mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trips</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map((trip) => {
          const { status, variant } = getTripStatus(trip);
          const stats = tripStats.get(trip.id) || { itemCount: 0, packedCount: 0 };
          
          return (
            <Card 
              key={trip.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => handleSelectTrip(trip)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{trip.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {trip.destination}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={variant}>{status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditTrip(trip);
                        }}>
                          <Edit size={14} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleExportTrip(trip);
                        }}>
                          <Download size={14} className="mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(trip.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{trip.travelers || 1} traveler{trip.travelers && trip.travelers > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {trip.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trip.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Packing Progress</span>
                    <span>{stats.itemCount > 0 ? `${stats.packedCount}/${stats.itemCount}` : '0/0'}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: stats.itemCount > 0 ? `${(stats.packedCount / stats.itemCount) * 100}%` : '0%' 
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {stats.itemCount} items
                    </span>
                  </div>
                  {trip.priority === 'high' && (
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {trips.length === 0 ? 'No trips yet' : 'No trips found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {trips.length === 0 
              ? 'Create your first trip to start planning your adventure'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {trips.length === 0 && (
            <Button onClick={handleCreateTrip}>
              <Plus size={18} className="mr-2" />
              Create Your First Trip
            </Button>
          )}
        </div>
      )}

      {/* Trip Form Dialog */}
      <Dialog open={showTripForm} onOpenChange={setShowTripForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTrip ? 'Edit Trip' : 'Create New Trip'}
            </DialogTitle>
          </DialogHeader>
          <TripForm
            trip={editingTrip}
            onSave={async (tripData) => {
              try {
                if (editingTrip) {
                  const updatedTrip = await tripService.update(editingTrip.id, tripData);
                  setTrips(trips.map(trip => 
                    trip.id === editingTrip.id ? updatedTrip : trip
                  ));
                  toast.success('Trip updated successfully');
                } else {
                  const newTrip = await tripService.add(tripData);
                  setTrips([...trips, newTrip]);
                  toast.success('Trip created successfully');
                }
                setShowTripForm(false);
              } catch (error) {
                toast.error(editingTrip ? 'Failed to update trip' : 'Failed to create trip');
              }
            }}
            onCancel={() => setShowTripForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};