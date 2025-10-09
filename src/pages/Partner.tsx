import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tour {
  id: string;
  name: string;
  location: string;
  duration: string;
  price: string;
  description: string;
  status: "pending" | "approved" | "rejected";
}

const Partner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tours, setTours] = useState<Tour[]>([
    { id: "1", name: "Tour Hạ Long 3N2Đ", location: "Quảng Ninh", duration: "3 ngày 2 đêm", price: "₫5,500,000", description: "Khám phá vịnh Hạ Long với cảnh đẹp tuyệt vời", status: "approved" },
    { id: "2", name: "Du lịch Đà Nẵng", location: "Đà Nẵng", duration: "2 ngày 1 đêm", price: "₫3,200,000", description: "Trải nghiệm biển Mỹ Khê và cầu Rồng", status: "pending" },
    { id: "3", name: "Phú Quốc Resort", location: "Kiên Giang", duration: "4 ngày 3 đêm", price: "₫7,800,000", description: "Nghỉ dưỡng tại đảo ngọc Phú Quốc", status: "approved" },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    duration: "",
    price: "",
    description: "",
  });

  const handleAddTour = () => {
    setEditingTour(null);
    setFormData({ name: "", location: "", duration: "", price: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({
      name: tour.name,
      location: tour.location,
      duration: tour.duration,
      price: tour.price,
      description: tour.description,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTour = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa tour này?")) {
      setTours(tours.filter(tour => tour.id !== id));
      toast({
        title: "Đã xóa tour",
        description: "Tour đã được xóa thành công",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTour) {
      // Update existing tour
      setTours(tours.map(tour => 
        tour.id === editingTour.id 
          ? { ...tour, ...formData }
          : tour
      ));
      toast({
        title: "Cập nhật thành công",
        description: "Tour đã được cập nhật",
      });
    } else {
      // Add new tour
      const newTour: Tour = {
        id: Date.now().toString(),
        ...formData,
        status: "pending",
      };
      setTours([...tours, newTour]);
      toast({
        title: "Thêm tour thành công",
        description: "Tour mới đang chờ admin duyệt",
      });
    }
    
    setIsDialogOpen(false);
    setFormData({ name: "", location: "", duration: "", price: "", description: "" });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return variants[status] || "secondary";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      approved: "Đã duyệt",
      pending: "Chờ duyệt",
      rejected: "Từ chối",
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quản lý Tour - Đối tác</h1>
              <p className="text-muted-foreground mt-1">
                Quản lý danh sách tour của bạn
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Danh sách Tour</CardTitle>
                <CardDescription>
                  Quản lý các tour du lịch của bạn
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddTour}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Tour
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTour ? "Chỉnh sửa Tour" : "Thêm Tour mới"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTour ? "Cập nhật thông tin tour" : "Điền thông tin tour mới. Tour sẽ cần được admin duyệt."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Tên Tour *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="VD: Tour Hạ Long 3N2Đ"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Địa điểm *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          required
                          placeholder="VD: Quảng Ninh"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Thời gian *</Label>
                        <Input
                          id="duration"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          required
                          placeholder="VD: 3 ngày 2 đêm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="price">Giá *</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="VD: ₫5,500,000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Mô tả *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        placeholder="Mô tả chi tiết về tour"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Hủy
                      </Button>
                      <Button type="submit">
                        {editingTour ? "Cập nhật" : "Thêm Tour"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Tour</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell className="font-medium">{tour.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {tour.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {tour.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-semibold">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {tour.price}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(tour.status)}>
                        {getStatusText(tour.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTour(tour)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTour(tour.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Partner;
