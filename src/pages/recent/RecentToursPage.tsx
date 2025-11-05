import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import RecentTours from "@/components/recent/RecentTours";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const RecentToursPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TravelHeader />
      <main className="flex-1 bg-gradient-to-b from-muted/20 via-transparent to-transparent">
        <div className="container mx-auto px-4 py-12 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tour bạn đã xem gần đây</h1>
              <p className="text-sm text-muted-foreground">
                Tiếp tục kế hoạch khám phá của bạn từ những tour vừa xem. Chi tiết được lưu lại theo tài khoản.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/activities">
                <Sparkles className="h-4 w-4" />
                Khám phá thêm tour mới
              </Link>
            </Button>
          </div>

          <RecentTours />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecentToursPage;
