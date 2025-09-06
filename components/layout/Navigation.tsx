'use client';

import { Home, Shirt, Briefcase as Suitcase, CheckSquare, Settings, Sun, Moon } from 'lucide-react';
import { useStore, useTheme } from '@/lib/store/useStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Navigation = () => {
  const { activeTab, setActiveTab } = useStore();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'wardrobe' as const, label: 'Wardrobe', icon: Shirt },
    { id: 'trips' as const, label: 'Trips', icon: Suitcase },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border">
      <div className="flex items-center justify-between px-1 py-2 max-w-md mx-auto">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-colors min-w-[50px] min-h-[44px]',
              activeTab === id
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon size={18} />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </button>
        ))}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="min-h-[44px] min-w-[40px]"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
      </div>
    </div>
  );
};