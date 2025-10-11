import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const FilterSidebarKlook = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState([0, 10000000]);

  return (
    <aside className="w-full space-y-6">
      {/* Date Filter */}
      <div className="bg-card rounded-lg p-5 border">
        <h3 className="font-semibold text-base mb-4">Ngày</h3>
        
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 text-sm",
              selectedDate === "today" && "bg-accent/10 border-accent text-accent"
            )}
            onClick={() => setSelectedDate("today")}
          >
            Hôm nay
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 text-sm",
              selectedDate === "tomorrow" && "bg-accent/10 border-accent text-accent"
            )}
            onClick={() => setSelectedDate("tomorrow")}
          >
            Ngày mai
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full text-sm"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Mọi ngày
        </Button>
      </div>

      {/* Price Filter */}
      <div className="bg-card rounded-lg p-5 border">
        <h3 className="font-semibold text-base mb-4">Giá</h3>
        
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={10000000}
          step={100000}
          className="my-6"
        />
        
        <div className="flex items-center gap-3 text-sm">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">₫</label>
            <input
              type="text"
              value={priceRange[0].toLocaleString()}
              className="w-full px-3 py-2 border rounded text-sm"
              readOnly
            />
          </div>
          <span className="text-muted-foreground mt-5">-</span>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">₫</label>
            <input
              type="text"
              value={priceRange[1].toLocaleString()}
              className="w-full px-3 py-2 border rounded text-sm"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Location Filter */}
      <div className="bg-card rounded-lg p-5 border">
        <h3 className="font-semibold text-base mb-3">Địa điểm</h3>
        <div className="text-sm text-muted-foreground mb-3">
          Dịch vụ có "ha long bay cruise" ở các điểm đến khác
        </div>
        <Button variant="ghost" size="sm" className="text-primary p-0 h-auto font-normal">
          Xem tất cả
        </Button>
      </div>

      {/* Other Filters */}
      <div className="bg-card rounded-lg p-5 border">
        <h3 className="font-semibold text-base mb-4">Khác</h3>
        <Button variant="outline" size="sm" className="w-full text-sm border-accent text-accent">
          Xác nhận tức thời
        </Button>
      </div>
    </aside>
  );
};
