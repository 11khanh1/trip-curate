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
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign, Image, List, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios"; 

// Interface cho cấu trúc JSON tour backend
interface ItineraryItem {
  day: number;
  title: string;
  detail: string;
}

interface TourAPI {
  title: string;
  description: string;
  destination: string;
  duration: number; // Chỉ là số ngày
  base_price: number;
  policy: string;
  tags: string[];
  media: {
    images: string[];
  };
  itinerary: ItineraryItem[];
}


interface Tour extends Omit<TourAPI, 'duration' | 'base_price'> {
  id: string;
  duration: string; 
  price: string; 
  status: "pending" | "approved" | "rejected";
  base_price: number;
}


const Partner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tours, setTours] = useState<Tour[]>([
    { id: "1", title: "Tour Hạ Long 3N2Đ", destination: "Quảng Ninh", duration: "3 ngày 2 đêm", price: "₫5,500,000", description: "Khám phá vịnh Hạ Long với cảnh đẹp tuyệt vời", status: "approved", base_price: 5500000, policy: "Miễn phí hủy trước 7 ngày", tags: ["bien", "nghi-duong"], media: { images: ["https://cdn.example.com/halong1.jpg"] }, itinerary: [] },
    { id: "2", title: "Du lịch Đà Nẵng", destination: "Đà Nẵng", duration: "2 ngày 1 đêm", price: "₫3,200,000", description: "Trải nghiệm biển Mỹ Khê và cầu Rồng", status: "pending", base_price: 3200000, policy: "Hủy trong vòng 24h mất 50%", tags: ["bien", "thanh-pho"], media: { images: ["https://cdn.example.com/danang1.jpg"] }, itinerary: [] },
    { id: "3", title: "Phú Quốc Resort", destination: "Kiên Giang", duration: "4 ngày 3 đêm", price: "₫7,800,000", description: "Nghỉ dưỡng tại đảo ngọc Phú Quốc", status: "approved", base_price: 7800000, policy: "Không hoàn tiền", tags: ["nghi-duong", "dao"], media: { images: ["https://cdn.example.com/phuquoc1.jpg"] }, itinerary: [] },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cập nhật state formData theo cấu trúc backend và giao diện
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    destination: string;
    durationDays: number; // Số ngày (number) cho backend
    base_price: number; // Giá (number) cho backend
    policy: string;
    tagsString: string; // String: "tag1, tag2" cho dễ nhập
    imageUrlsString: string; // String: "url1, url2" cho dễ nhập
    itineraryItems: ItineraryItem[]; // Mảng hành trình
  }>({
    title: "",
    description: "",
    destination: "",
    durationDays: 1,
    base_price: 0,
    policy: "",
    tagsString: "",
    imageUrlsString: "",
    itineraryItems: [{ day: 1, title: "", detail: "" }],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'durationDays' || id === 'base_price' ? Number(value) : value,
    }));
  };

  const handleAddTour = () => {
    setEditingTour(null);
    setFormData({
      title: "", description: "", destination: "", durationDays: 3, base_price: 5500000, policy: "", tagsString: "bien, nghi-duong", imageUrlsString: "", itineraryItems: [{ day: 1, title: "", detail: "" }]
    });
    setIsDialogOpen(true);
  };

  const handleItineraryChange = (index: number, field: keyof ItineraryItem, value: string | number) => {
    const newItems = [...formData.itineraryItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, itineraryItems: newItems });
  };

  const addItineraryItem = () => {
    setFormData({
      ...formData,
      itineraryItems: [
        ...formData.itineraryItems,
        { day: formData.itineraryItems.length + 1, title: "", detail: "" }
      ]
    });
  };

  const removeItineraryItem = (index: number) => {
    if (formData.itineraryItems.length > 1) {
      const newItems = formData.itineraryItems.filter((_, i) => i !== index).map((item, i) => ({ ...item, day: i + 1 }));
      setFormData({ ...formData, itineraryItems: newItems });
    } else {
      toast({ title: "Cảnh báo", description: "Cần có ít nhất một mục trong hành trình.", variant: "destructive" });
    }
  };


  const postNewTour = async (tourData: TourAPI): Promise<Tour> => {
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/partner/tours", tourData, {
      });
      const newTourFromAPI: TourAPI & { id: string } = response.data;


      const newTourForState: Tour = {
        id: newTourFromAPI.id,
        title: newTourFromAPI.title,
        description: newTourFromAPI.description,
        destination: newTourFromAPI.destination,
        duration: `${newTourFromAPI.duration} ngày`, // Chuyển đổi lại
        price: `₫${newTourFromAPI.base_price.toLocaleString('vi-VN')}`, // Chuyển đổi lại
        base_price: newTourFromAPI.base_price,
        policy: newTourFromAPI.policy,
        tags: newTourFromAPI.tags,
        media: newTourFromAPI.media,
        itinerary: newTourFromAPI.itinerary,
        status: "pending", // Mặc định là pending khi thêm mới
      };

      setTours((prev) => [...prev, newTourForState]);
      toast({
        title: "Thêm tour thành công 🎉",
        description: "Tour mới đã được gửi và đang chờ admin duyệt.",
      });
      return newTourForState;

    } catch (error) {
      console.error("Lỗi khi thêm tour:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm tour. Vui lòng thử lại.",
        variant: "destructive",
      });
      throw error; // Ném lỗi để dừng việc đóng dialog
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({
      title: tour.title,
      description: tour.description,
      destination: tour.destination,
      durationDays: tour.base_price ? Number(tour.duration.split(' ')[0]) : 1, // Lấy số ngày từ chuỗi hiển thị
      base_price: tour.base_price || 0,
      policy: tour.policy,
      tagsString: tour.tags.join(', '),
      imageUrlsString: tour.media.images.join(', '),
      itineraryItems: tour.itinerary.length > 0 ? tour.itinerary : [{ day: 1, title: "", detail: "" }],
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTour = (id: string) => {
    // **LƯU Ý:** Bạn cần thêm logic gọi API DELETE tại đây nếu muốn tích hợp backend
    if (confirm("Bạn có chắc muốn xóa tour này?")) {
      setTours(tours.filter(tour => tour.id !== id));
      toast({
        title: "Đã xóa tour",
        description: "Tour đã được xóa thành công",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const imagesArray = formData.imageUrlsString.split(',').map(url => url.trim()).filter(url => url.length > 0);
    const itineraryData = formData.itineraryItems.filter(item => item.title && item.detail);

    if (itineraryData.length === 0) {
      toast({ title: "Thiếu dữ liệu", description: "Vui lòng thêm ít nhất một mục chi tiết cho hành trình.", variant: "destructive" });
      return;
    }

    const tourPayload: TourAPI = {
      title: formData.title,
      description: formData.description,
      destination: formData.destination,
      duration: formData.durationDays,
      base_price: formData.base_price,
      policy: formData.policy,
      tags: tagsArray,
      media: {
        images: imagesArray,
      },
      itinerary: itineraryData,
    };

    if (editingTour) {
      // **Chỉnh sửa Tour:** Cần gọi API PUT/PATCH /api/partner/tours/{id}
      // Hiện tại vẫn dùng logic mock để cập nhật state cục bộ.
      // Thay thế bằng logic gọi API thực tế khi có endpoint.
      const updatedTour: Tour = {
        ...editingTour,
        ...tourPayload,
        duration: `${tourPayload.duration} ngày`,
        price: `₫${tourPayload.base_price.toLocaleString('vi-VN')}`,
        status: "pending", // Giả định chỉnh sửa cần admin duyệt lại
      };

      setTours(tours.map(tour =>
        tour.id === editingTour.id
          ? updatedTour
          : tour
      ));
      toast({
        title: "Cập nhật thành công",
        description: "Tour đã được cập nhật và đang chờ admin duyệt lại.",
      });
      setIsDialogOpen(false);
    } else {
      // Thêm Tour Mới: Gọi API POST
      try {
        await postNewTour(tourPayload);
        setIsDialogOpen(false);
      } catch (error) {
        // Lỗi đã được xử lý trong postNewTour
      }
    }

    setFormData({
      title: "", description: "", destination: "", durationDays: 1, base_price: 0, policy: "", tagsString: "", imageUrlsString: "", itineraryItems: [{ day: 1, title: "", detail: "" }]
    });
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTour ? "Chỉnh sửa Tour" : "Thêm Tour mới"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTour ? "Cập nhật thông tin tour" : "Điền thông tin tour mới chi tiết theo cấu trúc backend. Tour sẽ cần được admin duyệt."}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Phần Thông tin cơ bản */}
                    <div className="space-y-4 border p-4 rounded-lg">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <List className="h-5 w-5" /> Thông tin cơ bản
                      </h3>
                      <div>
                        <Label htmlFor="title">Tên Tour *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          placeholder="VD: Tour Hạ Long 3N2Đ"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="destination">Địa điểm *</Label>
                          <Input
                            id="destination"
                            value={formData.destination}
                            onChange={handleInputChange}
                            required
                            placeholder="VD: Quảng Ninh"
                          />
                        </div>
                        <div>
                          <Label htmlFor="durationDays">Số ngày *</Label>
                          <Input
                            id="durationDays"
                            type="number"
                            min="1"
                            value={formData.durationDays}
                            onChange={handleInputChange}
                            required
                            placeholder="VD: 3 (ngày)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="base_price">Giá (VNĐ) *</Label>
                          <Input
                            id="base_price"
                            type="number"
                            min="1000"
                            step="1000"
                            value={formData.base_price}
                            onChange={handleInputChange}
                            required
                            placeholder="VD: 5500000 (không bao gồm đơn vị tiền)"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Mô tả *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          placeholder="Mô tả chi tiết, hấp dẫn về tour..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="policy">Chính sách hủy *</Label>
                        <Input
                          id="policy"
                          value={formData.policy}
                          onChange={handleInputChange}
                          required
                          placeholder="VD: Miễn phí hủy trước 7 ngày"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tagsString">Tags (Ngăn cách bằng dấu phẩy, không khoảng trắng) *</Label>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="tagsString"
                            value={formData.tagsString}
                            onChange={handleInputChange}
                            required
                            placeholder="VD: bien, nghi-duong, cao-cap"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Sử dụng dấu phẩy (`,`) để ngăn cách. Ví dụ: `bien, nghi-duong`</p>
                      </div>
                    </div>

                    {/* Phần Media */}
                    <div className="space-y-4 border p-4 rounded-lg">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Image className="h-5 w-5" /> Ảnh Tour
                      </h3>
                      <div>
                        <Label htmlFor="imageUrlsString">URLs Hình ảnh (Ngăn cách bằng dấu phẩy)</Label>
                        <Textarea
                          id="imageUrlsString"
                          value={formData.imageUrlsString}
                          onChange={handleInputChange}
                          placeholder="Dán URL hình ảnh, mỗi URL cách nhau bằng dấu phẩy. VD: https://cdn.example.com/h1.jpg, https://cdn.example.com/h2.jpg"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Phần Hành trình */}
                    <div className="space-y-4 border p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <MapPin className="h-5 w-5" /> Chi tiết Hành trình *
                        </h3>
                        <Button type="button" size="sm" onClick={addItineraryItem} disabled={isSubmitting}>
                          <Plus className="h-4 w-4 mr-2" /> Thêm Ngày
                        </Button>
                      </div>
                      {formData.itineraryItems.map((item, index) => (
                        <Card key={index} className="p-3 border-l-4 border-primary">
                          <CardHeader className="p-0 pb-2 flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold">
                              Ngày {item.day}
                            </CardTitle>
                            {formData.itineraryItems.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeItineraryItem(index)}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </CardHeader>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`itinerary-title-${index}`}>Tiêu đề</Label>
                              <Input
                                id={`itinerary-title-${index}`}
                                value={item.title}
                                onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                                required
                                placeholder={`VD: Ngày ${item.day}: Hà Nội → Hạ Long`}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`itinerary-detail-${index}`}>Chi tiết hoạt động</Label>
                              <Input
                                id={`itinerary-detail-${index}`}
                                value={item.detail}
                                onChange={(e) => handleItineraryChange(index, 'detail', e.target.value)}
                                required
                                placeholder="VD: Check-in du thuyền, ăn tối..."
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                      {formData.itineraryItems.length === 0 && <p className="text-sm text-destructive">Vui lòng thêm ít nhất một mục trong hành trình.</p>}
                    </div>

                    {/* Nút Submit/Cancel */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                        Hủy
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (editingTour ? "Đang cập nhật..." : "Đang thêm...") : (editingTour ? "Cập nhật Tour" : "Thêm Tour")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* ... Phần hiển thị Table vẫn giữ nguyên ... */}
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
                    <TableCell className="font-medium">{tour.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {tour.destination}
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
            {/* ... Hết phần hiển thị Table ... */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Partner;