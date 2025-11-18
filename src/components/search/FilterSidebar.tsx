import { Calendar, Clock, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUICK_DATES = [
  { id: "today", label: "Hôm nay", description: "Khởi hành trong ngày" },
  { id: "tomorrow", label: "Ngày mai", description: "Sẵn sàng ngay" },
] as const;

const POPULAR_LOCATIONS = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Phú Quốc", "Hạ Long", "Sapa"];

export type QuickDateFilter = (typeof QUICK_DATES)[number]["id"];

export interface SearchFilterState {
  quickDate: QuickDateFilter | null;
  priceRange: [number, number];
  destinations: string[];
  customDestination: string;
  departureDate: string | null;
  startDate: string | null;
  durationRange: [number | null, number | null];
}

interface FilterSidebarProps {
  filters: SearchFilterState;
  onFiltersChange: (next: Partial<SearchFilterState>) => void;
  onReset: () => void;
}

export const FilterSidebarKlook = ({ filters, onFiltersChange, onReset }: FilterSidebarProps) => {
  const selectedDate = filters.quickDate;
  const priceRange = filters.priceRange;
  const selectedDestinations = filters.destinations;
  const customDestination = filters.customDestination;
  const departureDate = filters.departureDate ?? "";
  const startDate = filters.startDate ?? "";
  const [durationMin, durationMax] = filters.durationRange;

  const handleDateSelect = (value: QuickDateFilter) => {
    const nextValue = selectedDate === value ? null : value;
    onFiltersChange({ quickDate: nextValue });
  };

  const handlePriceRangeChange = (value: number[]) => {
    if (!Array.isArray(value) || value.length !== 2) return;
    onFiltersChange({ priceRange: [value[0], value[1]] as [number, number] });
  };

  const handleDestinationToggle = (location: string) => {
    const exists = selectedDestinations.includes(location);
    const next = exists
      ? selectedDestinations.filter((item) => item !== location)
      : [...selectedDestinations, location];
    onFiltersChange({ destinations: next });
  };

  const handleDateInputChange = (field: "departureDate" | "startDate", value: string) => {
    const trimmed = value.trim();
    onFiltersChange({ [field]: trimmed.length > 0 ? trimmed : null } as Partial<SearchFilterState>);
  };

  const handleDurationInputChange = (index: 0 | 1, value: string) => {
    const parsed = Number(value);
    const normalized = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    const currentRange: [number | null, number | null] = [...filters.durationRange];
    currentRange[index] = normalized;
    onFiltersChange({ durationRange: currentRange });
  };

  return (
    <aside className="space-y-4">
      <div className="overflow-hidden rounded-2xl border bg-card/95 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bộ lọc</p>
            <h3 className="text-sm font-semibold text-foreground">Tinh chỉnh kết quả</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm text-primary" onClick={onReset}>
            Đặt lại
          </Button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Thời gian khởi hành
            </div>
            <div className="mt-3 grid gap-2">
              {QUICK_DATES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleDateSelect(option.id)}
                  className={cn(
                    "flex items-start justify-between rounded-xl border px-3 py-2 text-left transition-colors",
                    selectedDate === option.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-muted/60 hover:bg-muted"
                  )}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Lịch trình cụ thể
            </div>
            <div className="grid gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ngày khởi hành</p>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(event) => handleDateInputChange("departureDate", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Từ ngày</p>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => handleDateInputChange("startDate", event.target.value)}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Phạm vi giá (₫)
            </div>
            <div className="mt-4">
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                max={10_000_000}
                step={100_000}
                className="my-5"
              />
              <div className="flex items-center justify-between text-sm">
                <div className="rounded-lg border bg-muted/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Thấp nhất</p>
                  <p className="font-semibold text-foreground">
                    ₫ {priceRange[0].toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/60 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Cao nhất</p>
                  <p className="font-semibold text-foreground">
                    ₫ {priceRange[1].toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Thời lượng (ngày)
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tối thiểu</p>
                <Input
                  type="number"
                  min={0}
                  value={durationMin ?? ""}
                  onChange={(event) => handleDurationInputChange(0, event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tối đa</p>
                <Input
                  type="number"
                  min={0}
                  value={durationMax ?? ""}
                  onChange={(event) => handleDurationInputChange(1, event.target.value)}
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Địa điểm phổ biến</h4>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_LOCATIONS.map((location) => (
                <Badge
                  key={location}
                  variant="outline"
                  className={cn(
                    "cursor-pointer border-primary/30 bg-primary/5 text-xs text-primary transition-colors hover:bg-primary/10",
                    selectedDestinations.includes(location) && "border-primary bg-primary/15 text-primary"
                  )}
                  onClick={() => handleDestinationToggle(location)}
                >
                  {location}
                </Badge>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Hoặc nhập địa điểm khác</p>
              <Input
                placeholder="VD: Nha Trang"
                value={customDestination}
                onChange={(event) => onFiltersChange({ customDestination: event.target.value })}
              />
            </div>
          </section>

        </div>
      </div>
    </aside>
  );
};
