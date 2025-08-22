'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Copy, Edit2, Trash2, Briefcase as Suitcase, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store/useStore';
import { TripForm } from './TripForm';
import { tripService, tripItemService } from '@/lib/db/services';
import { toast } from 'sonner';
import { Trip } from '@/lib/db/schema';

export const TripsList = () => {
  const { trips, removeTrip, addTrip, setCurrentTrip, setActiveTab } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<string | null>(null);
  const [duplicateTrip, setDuplicateTrip] = useState<Trip | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [tripProgress, setTripProgress] = useState<Record<string, { total: number; packed: number }>>({});

  useEffect(() => {
    // Load progress for all trips
    const loadProgress = async () => {
      const progress: Record<string, { total: number; packed: number }> = {};
      for (const trip of trips) {
        progress[trip.id] = await tripItemService.getTripProgress(trip.id);
      }
      setTripProgress(progress);
    };
    loadProgress();
  }, [trips]);

  const handleDeleteTrip = async (id: string) => {
    try {
      await tripService.delete(id);
      removeTrip(id);
      toast.success('Trip deleted');
    } catch (error) {
      toast.error('Failed to delete trip');
    }
    setDeleteTrip(null);
  };

  const handleDuplicateTrip = async () => {
    if (!duplicateTrip || !duplicateName.trim()) return;
    
    try {
      const newTrip = await tripService.duplicate(duplicateTrip.id, duplicateName);
      addTrip(newTrip);
      toast.success('Trip duplicated');
      setDuplicateTrip(null);
      setDuplicateName('');
    } catch (error) {
      toast.error('Failed to duplicate trip');
    }
  };

  const handleViewPacking = (trip: Trip) => {
    setCurrentTrip(trip);
    setActiveTab('packing');
  };

  const sortedTrips = trips.sort((a, b) => {
    if (a.isTemplate !== b.isTemplate) {
      return a.isTemplate ? 1 : -1; // Templates last
    }
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  if (showCreateForm) {
    return <TripForm onClose={() => setShowCreateForm(false)} />;
  }

  if (editingTrip) {
    return (
      <TripForm 
        onClose={() => setEditingTrip(null)} 
        initialData={editingTrip}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Trip Button */}
      <Button onClick={() => setShowCreateForm(true)} className="w-full">
        <Plus size={18} className="mr-2" />
        Create New Trip
      </Button>

      {/* Trips List */}
      {sortedTrips.length > 0 ? (
        <div className="space-y-3 pb-20">
          {sortedTrips.map((trip) => {
            const progress = tripProgress[trip.id] || { total: 0, packed: 0 };
            const progressPercent = progress.total > 0 ? (progress.packed / progress.total) * 100 : 0;
            
            return (
              <Card key={trip.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {trip.name}
                        {trip.isTemplate && (
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {format(trip.startDate, 'MMM dd')} - {format(trip.endDate, 'MMM dd')}
                        </div>
                        {trip.destination && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            {trip.destination}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {trip.type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Progress Bar */}
                  {progress.total > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Packing Progress</span>
                        <span>{progress.packed}/{progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewPacking(trip)}
                    >
                      <Suitcase size={14} className="mr-1" />
                      {progress.total > 0 ? 'Continue Packing' : 'Start Packing'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingTrip(trip)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setDuplicateTrip(trip);
                        setDuplicateName(`${trip.name} (Copy)`);
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteTrip(trip.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Suitcase size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No trips yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first trip to start planning your packing
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus size={18} className="mr-2" />
            Create First Trip
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTrip} onOpenChange={() => setDeleteTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone and will remove all packing items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTrip && handleDeleteTrip(deleteTrip)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Dialog */}
      <Dialog open={!!duplicateTrip} onOpenChange={() => setDuplicateTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="duplicate-name">New Trip Name</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Enter new trip name"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDuplicateTrip(null)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleDuplicateTrip} 
                className="flex-1"
                disabled={!duplicateName.trim()}
              >
                Duplicate Trip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};