'use client';

import { Settings, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store/useStore';
import { exportData, importData } from '@/lib/db/database';
import { toast } from 'sonner';

export const Header = () => {
  const { activeTab } = useStore();

  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'PackMate';
      case 'wardrobe':
        return 'My Wardrobe';
      case 'trips':
        return 'My Trips';
      case 'packing':
        return 'Packing List';
      default:
        return 'PackMate';
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packmate-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importData(data);
        toast.success('Data imported successfully');
        window.location.reload();
      } catch (error) {
        toast.error('Failed to import data');
      }
    };
    input.click();
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-foreground">{getTitle()}</h1>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleExport}>
            <Download size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleImport}>
            <Upload size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};