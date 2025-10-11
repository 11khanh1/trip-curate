import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortOption {
  value: string;
  label: string;
}

interface ResultsHeaderProps {
  totalResults: number;
  selectedFilters?: number;
  sortValue: string;
  sortOptions: SortOption[];
  onSortChange?: (value: string) => void;
  onClearFilters?: () => void;
}

export const ResultsHeader = ({
  totalResults,
  selectedFilters = 0,
  sortValue,
  sortOptions,
  onSortChange,
  onClearFilters,
}: ResultsHeaderProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        {selectedFilters > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              Đã chọn {selectedFilters} bộ lọc
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-primary"
              onClick={onClearFilters}
            >
              Xoá tất cả
            </Button>
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          Tìm thấy {totalResults.toLocaleString()} kết quả
        </span>
      </div>
      <Select
        value={sortValue}
        onValueChange={(value) => onSortChange?.(value)}
      >
        <SelectTrigger className="w-full text-sm sm:w-[220px]">
          <SelectValue placeholder="Sắp xếp theo" />
        </SelectTrigger>
        <SelectContent align="end">
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
