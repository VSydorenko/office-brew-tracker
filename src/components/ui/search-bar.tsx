import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

/**
 * Mobile-optimized search компонент з debounce та фільтрами
 */
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilter?: () => void;
  initialValue?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Пошук...",
  onSearch,
  onFilter,
  initialValue = '',
  debounceMs = 300,
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedSearchValue = useDebounce(searchValue, debounceMs);

  useEffect(() => {
    onSearch(debouncedSearchValue);
  }, [debouncedSearchValue, onSearch]);

  const handleClear = useCallback(() => {
    setSearchValue('');
  }, []);

  return (
    <div className={`relative flex gap-2 md:gap-3 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-12 h-12 md:h-10"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {onFilter && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFilter}
          className="h-12 w-12 md:h-10 md:w-10 flex-shrink-0"
        >
          <Filter className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};