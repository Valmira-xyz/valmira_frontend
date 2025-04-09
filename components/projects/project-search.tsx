'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface ProjectSearchProps {
  placeholder?: string;
  className?: string;
}

export function ProjectSearch({
  placeholder = 'Search projects',
  className = '',
}: ProjectSearchProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="h-9 pl-9 max-w-[300px] bg-background"
      />
    </div>
  );
}
