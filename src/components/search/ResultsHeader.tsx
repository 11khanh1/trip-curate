import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  keyword?: string;
  onSortChange?: (value: string) => void;
  onClearFilters?: () => void;
}

export const ResultsHeader = ({
  totalResults,
  selectedFilters = 0,
  sortValue,
  sortOptions,
  keyword,
  onSortChange,
  onClearFilters,
}: ResultsHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card/95 px-5 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kết quả phù hợp
          </span>
          {keyword ? (
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              Từ khóa: {keyword}
            </Badge>
          ) : null}
        </div>
        <div className="text-xl font-semibold text-foreground">
          {totalResults.toLocaleString("vi-VN")} trải nghiệm được tìm thấy
        </div>
        {selectedFilters > 0 && onClearFilters ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Đang áp dụng {selectedFilters} bộ lọc
            <Button variant="link" size="sm" className="h-auto px-0 text-primary" onClick={onClearFilters}>
              Xoá tất cả
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sắp xếp để ưu tiên những lựa chọn phù hợp nhất với hành trình của bạn.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={sortValue} onValueChange={(value) => onSortChange?.(value)}>
          <SelectTrigger className="w-full rounded-full border-muted bg-muted/40 text-sm sm:w-[220px]">
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
    </div>
  );
};
