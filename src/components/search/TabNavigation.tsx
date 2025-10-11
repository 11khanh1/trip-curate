import { UtensilsCrossed, Compass, Car, Hotel } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "all", label: "Tất cả", icon: UtensilsCrossed },
  { id: "tours", label: "Tour & Trải nghiệm", icon: Compass },
  { id: "transport", label: "Phương tiện", icon: Car },
  { id: "hotels", label: "Khách sạn", icon: Hotel },
];

export const TabNavigation = () => {
  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4">
        <nav className="flex gap-8 overflow-x-auto">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={cn(
                "flex items-center gap-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap text-sm font-medium",
                index === 0
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
