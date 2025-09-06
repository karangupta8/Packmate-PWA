'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { tripService } from '@/lib/db/services';
import { useStore } from '@/lib/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(50, 'Name must be under 50 characters'),
  destination: z.string().max(100, 'Destination must be under 100 characters').optional(),
  startDate: z.date({ message: 'Start date is required' }),
  endDate: z.date({ message: 'End date is required' }),
  type: z.enum(['Business', 'Vacation', 'Weekend', 'Other']),
  description: z.string().max(200, 'Description must be under 200 characters').optional(),
  travelers: z.number().int().min(1, 'Must have at least 1 traveler').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isTemplate: z.boolean(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type TripFormData = z.infer<typeof tripSchema>;

interface TripFormProps {
  initialData?: Partial<TripFormData & { id: string }>;
  trip?: any;
  onSave?: (data: TripFormData) => Promise<void>;
  onCancel?: () => void;
}

export const TripForm = ({ initialData, trip, onSave, onCancel }: TripFormProps) => {
  const { addTrip, updateTrip, setLoading } = useStore();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Use either initialData or trip for backwards compatibility
  const tripData = initialData || trip;

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: tripData?.name || '',
      destination: tripData?.destination || '',
      startDate: tripData?.startDate ? new Date(tripData.startDate) : new Date(),
      endDate: tripData?.endDate ? new Date(tripData.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      type: tripData?.type || 'Vacation',
      description: tripData?.description || '',
      travelers: tripData?.travelers || 1,
      priority: tripData?.priority || 'medium',
      isTemplate: tripData?.isTemplate || false,
    },
  });

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  const onSubmit = async (data: TripFormData) => {
    try {
      setLoading(true);
      
      // Use custom onSave if provided, otherwise use default logic
      if (onSave) {
        await onSave(data);
      } else if (tripData?.id) {
        const updatedTrip = await tripService.update(tripData.id, data);
        updateTrip(tripData.id, updatedTrip);
        toast.success('Trip updated');
      } else {
        const trip = await tripService.add(data);
        addTrip(trip);
        toast.success('Trip created');
      }
      
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      toast.error('Failed to save trip');
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Trip Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Summer Vacation"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              {...register('destination')}
              placeholder="e.g., Tokyo, Japan"
              className={errors.destination ? 'border-destructive' : ''}
            />
            {errors.destination && (
              <p className="text-sm text-destructive">{errors.destination.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="e.g., Family trip to see the sights"
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedStartDate && "text-muted-foreground",
                      errors.startDate && "border-destructive"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {watchedStartDate ? format(watchedStartDate, "MMM dd") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={watchedStartDate}
                    onSelect={(date) => {
                      if (date) {
                        setValue('startDate', date);
                        // Auto-adjust end date if it's before the new start date
                        if (watchedEndDate && date > watchedEndDate) {
                          setValue('endDate', new Date(date.getTime() + 24 * 60 * 60 * 1000));
                        }
                        setStartDateOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedEndDate && "text-muted-foreground",
                      errors.endDate && "border-destructive"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {watchedEndDate ? format(watchedEndDate, "MMM dd") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={watchedEndDate}
                    onSelect={(date) => {
                      if (date) {
                        setValue('endDate', date);
                        setEndDateOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      const minDate = watchedStartDate || new Date();
                      return date < new Date(minDate.setHours(0, 0, 0, 0));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Trip Type */}
            <div className="space-y-2">
              <Label>Trip Type</Label>
              <Select 
                defaultValue={tripData?.type || 'Vacation'} 
                onValueChange={(value: 'Business' | 'Vacation' | 'Weekend' | 'Other') => setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Weekend">Weekend</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Travelers */}
            <div className="space-y-2">
              <Label htmlFor="travelers">Travelers</Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                {...register('travelers')}
                className={errors.travelers ? 'border-destructive' : ''}
              />
              {errors.travelers && (
                <p className="text-sm text-destructive">{errors.travelers.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              defaultValue={tripData?.priority || 'medium'}
              onValueChange={(value: 'low' | 'medium' | 'high') => setValue('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTemplate"
              defaultChecked={tripData?.isTemplate}
              onCheckedChange={(checked) => setValue('isTemplate', checked as boolean)}
            />
            <Label htmlFor="isTemplate" className="cursor-pointer">
              Save as reusable template
            </Label>
          </div>
        </div>

        <div className="flex gap-2 pt-6">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {tripData?.id ? 'Update' : 'Create'} Trip
          </Button>
        </div>
      </form>
  );
};