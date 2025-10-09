import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Activities() {
  const { toast } = useToast();

  const [activities, setActivities] = useState([
    {
      id: 1,
      name: "Dịch Vụ Đón Tiễn Ưu Tiên Tại Sân Bay Tân Sơn Nhất",
      location: "TP. Hồ Chí Minh",
      price: "₫765,000",
      status: "pending",
      bookings: 1840,
      description:
        "Dịch vụ hỗ trợ thủ tục tại sân bay, giúp hành khách tiết kiệm thời gian, có nhân viên hỗ trợ tận nơi.",
      provider: "Công ty Dịch vụ Du lịch Sài Gòn Sky",
      images: [
        "https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=800",
        "https://images.unsplash.com/photo-1576601883918-0fcbf1a6aada?w=800",
      ],
      rejectReason: "",
    },
    {
      id: 2,
      name: "Tour Phú Quốc 3 Ngày 2 Đêm",
      location: "Phú Quốc",
      price: "₫2,500,000",
      status: "pending",
      bookings: 987,
      description:
        "Tham quan đảo ngọc Phú Quốc, nghỉ dưỡng tại resort 4 sao, ăn hải sản tươi sống và tham quan Vinpearl Safari.",
      provider: "Công ty Phú Quốc Travel",
      images: [
        "https://images.unsplash.com/photo-1581841313823-b9f4f0b1872e?w=800",
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800",
      ],
      rejectReason: "",
    },
  ]);

  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (id: number) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a))
    );
    setDetailDialogOpen(false);
    toast({
      title: "✅ Đã duyệt hoạt động",
      description: "Hoạt động này đã được hiển thị cho người dùng.",
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    setActivities((prev) =>
      prev.map((a) =>
        a.id === selectedActivity.id
          ? { ...a, status: "rejected", rejectReason }
          : a
      )
    );
    setRejectDialogOpen(false);
    setDetailDialogOpen(false);
    toast({
      title: "❌ Đã từ chối hoạt động",
      description: `Lý do: ${rejectReason}`,
      variant: "destructive",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Đã duyệt</Badge>;
      case "pending":
        return <Badge className="bg-yellow-400 hover:bg-yellow-500 text-black">Chờ duyệt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge>Không rõ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phê duyệt Hoạt động</h1>
          <p className="text-muted-foreground">
            Xem thông tin chi tiết để duyệt hoặc từ chối hoạt động của đối tác
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm hoạt động..." className="pl-8" />
        </div>
      </div>

      {/* Danh sách hoạt động */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hoạt động cần duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{activity.name}</h3>
                    {getStatusBadge(activity.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📍 {activity.location}</span>
                    <span>•</span>
                    <span>{activity.bookings} lượt đặt</span>
                  </div>
                  {activity.rejectReason && (
                    <p className="text-xs text-red-500 mt-1">
                      <strong>Lý do từ chối:</strong> {activity.rejectReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg text-primary">{activity.price}</p>
                    <p className="text-xs text-muted-foreground">Giá khởi điểm</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedActivity(activity);
                      setDetailDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 🧾 Dialog chi tiết hoạt động */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết hoạt động</DialogTitle>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedActivity.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt={selectedActivity.name}
                    className="rounded-lg border object-cover w-full h-40"
                  />
                ))}
              </div>

              <div className="space-y-2">
                <p><strong>Tên hoạt động:</strong> {selectedActivity.name}</p>
                <p><strong>Địa điểm:</strong> {selectedActivity.location}</p>
                <p><strong>Giá:</strong> {selectedActivity.price}</p>
                <p><strong>Đơn vị cung cấp:</strong> {selectedActivity.provider}</p>
                <p><strong>Mô tả:</strong> {selectedActivity.description}</p>
                <p><strong>Số lượt đặt:</strong> {selectedActivity.bookings}</p>
              </div>

              {/* Nút hành động */}
              {selectedActivity.status === "pending" ? (
                <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleApprove(selectedActivity.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Duyệt hoạt động
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Từ chối
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {selectedActivity.status === "approved"
                    ? "✅ Hoạt động đã được duyệt"
                    : "❌ Hoạt động đã bị từ chối"}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ❌ Dialog nhập lý do từ chối */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lý do từ chối hoạt động:</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              {" "}
              <strong>{selectedActivity?.name}</strong>
            </p>
            <Textarea
              placeholder="Nhập nội dung lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
