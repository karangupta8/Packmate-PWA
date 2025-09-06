'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { categoryService } from '@/lib/db/services';
import { Category } from '@/lib/db/schema';
import { useStore } from '@/lib/store/useStore';
import { toast } from 'sonner';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const colorOptions = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
];

const iconOptions = [
  'Shirt', 'Smartphone', 'Droplets', 'FileText', 
  'Footprints', 'Watch', 'Package', 'Camera'
];

export const CategoryManager = ({ isOpen, onClose }: CategoryManagerProps) => {
  const { categories, addCategory, updateCategory, removeCategory } = useStore();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await categoryService.add({
        name: newCategoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });

      addCategory(newCategory);
      setNewCategoryName('');
      setSelectedColor(colorOptions[0]);
      setSelectedIcon(iconOptions[0]);
      setShowCreateForm(false);
      toast.success('Category created');
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async (category: Category) => {
    try {
      const updated = await categoryService.update(category.id, {
        name: category.name,
        color: category.color,
        icon: category.icon,
      });

      updateCategory(category.id, updated);
      setEditingCategory(null);
      toast.success('Category updated');
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will remove it from all items.')) {
      return;
    }

    try {
      await categoryService.delete(categoryId);
      removeCategory(categoryId);
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Category */}
          {showCreateForm ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Create New Category</h4>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}>
                    <X size={16} />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Formal Wear"
                    />
                  </div>

                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            selectedColor === color ? 'border-foreground' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Icon</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {iconOptions.map((icon) => (
                        <Button
                          key={icon}
                          variant={selectedIcon === icon ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedIcon(icon)}
                          className="h-10"
                        >
                          {icon}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateCategory} className="flex-1">
                      Create Category
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
              Add New Category
            </Button>
          )}

          {/* Existing Categories */}
          <div className="space-y-2">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-3">
                  {editingCategory?.id === category.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      />
                      
                      <div className="flex gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border ${
                              editingCategory.color === color ? 'border-foreground border-2' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingCategory({ ...editingCategory, color })}
                          />
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateCategory(editingCategory)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No categories created yet</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};