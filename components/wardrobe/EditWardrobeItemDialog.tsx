'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store/useStore';
import { WardrobeItem } from '@/lib/db/schema';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface EditWardrobeItemDialogProps {
  item: WardrobeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: WardrobeItem, imageFile?: File) => void;
}

export const EditWardrobeItemDialog = ({ item, isOpen, onClose, onSave }: EditWardrobeItemDialogProps) => {
  const { categories } = useStore();
  const [formData, setFormData] = useState<Partial<WardrobeItem>>({});
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>();

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setImagePreview(item.image);
      setImageFile(undefined);
    }
  }, [item]);

  if (!item) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(undefined);
    setImagePreview(undefined);
    setFormData(prev => ({ ...prev, image: undefined }));
  };

  const handleSaveChanges = async () => {
    if (!formData.name?.trim()) {
      toast.error("Item name is required.");
      return;
    }
    onSave(formData as WardrobeItem, imageFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="edit-item-name">Item Name</Label>
            <Input id="edit-item-name" name="name" value={formData.name || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="edit-item-category">Category</Label>
            <Select
              value={formData.category || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="edit-item-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-item-tags">Tags (comma-separated)</Label>
            <Input id="edit-item-tags" name="tags" value={formData.tags?.join(', ') || ''} onChange={handleTagChange} />
          </div>
          <div>
            <Label htmlFor="edit-item-notes">Notes</Label>
            <Textarea id="edit-item-notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-item-essential"
              checked={formData.essential}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, essential: !!checked }))}
            />
            <Label htmlFor="edit-item-essential">Essential Item</Label>
          </div>
          <div>
            <Label htmlFor="edit-item-image">Image</Label>
            <Input id="edit-item-image" type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
            {imagePreview && (
              <div className="relative w-24 h-24">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X size={12} />
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};