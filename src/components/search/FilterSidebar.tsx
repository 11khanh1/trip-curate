import { useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const QUICK_DATES = [
  { id: "today", label: "Hôm nay", description: "Khởi hành trong ngày" },
  { id: "tomorrow", label: "Ngày mai", description: "Sẵn sàng ngay" },
  { id: "weekend", label: "Cuối tuần", description: "Thêm thời gian khám phá" },
];

const POPULAR_LOCATIONS = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Phú Quốc", "Hạ Long", "Sapa"];

export const FilterSidebarKlook = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState([0, 10_000_000]);

  return (
    <aside className="space-y-4">
      <div className="overflow-hidden rounded-2xl border bg-card/95 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Bộ lọc</p>
            <h3 className="text-sm font-semibold text-foreground">Tinh chỉnh kết quả</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-sm text-primary">
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
                  onClick={() => setSelectedDate(option.id)}
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
              <Button variant="outline" size="sm" className="mt-1 w-full justify-start gap-2">
                <Clock className="h-4 w-4" />
                Chọn ngày khác
              </Button>
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
                onValueChange={setPriceRange}
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
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Địa điểm phổ biến</h4>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-primary">
                Xem tất cả
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR_LOCATIONS.map((location) => (
                <Badge
                  key={location}
                  variant="outline"
                  className="cursor-pointer border-primary/30 bg-primary/5 text-xs text-primary transition-colors hover:bg-primary/10"
                >
                  {location}
                </Badge>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Tiện ích ưa thích</h4>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2 text-sm">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  HOT
                </Badge>
                Xác nhận tức thời
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 text-sm">
                Miễn phí huỷ
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 text-sm">
                Đón tại khách sạn
              </Button>
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
};
