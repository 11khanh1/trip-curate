import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, MapPin, List, Image, DollarSign, Calendar , Tag } from "lucide-react";
// Giả định bạn có hook useToast và thư viện axios
// import { useToast } from "@/hooks/use-toast";
// import axios from "axios";

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
  duration: number; // số ngày (days)
  base_price: number;
  policy: string;
  tags: string[];
  media: {
    images: string[];
  };
  itinerary: ItineraryItem[];
}

interface Tour extends Omit<TourAPI, "duration" | "base_price"> {
  id: string;
  duration: string; // "X ngày Y đêm" (string for display)
  price: string; // "₫X,XXX,XXX" (string for display)
  status: "pending" | "approved" | "rejected";
  base_price: number;
}

// Hàm chuyển đổi data từ form sang API và ngược lại
const formatTourData = (tour: TourAPI | Tour): Tour => ({
    id: (tour as Tour).id || Math.random().toString(36).substring(2, 9), // ID giả nếu chưa có
    title: tour.title,
    description: tour.description,
    destination: tour.destination,
    duration: `${tour.duration} ngày`,
    price: `₫${tour.base_price.toLocaleString("vi-VN")}`,
    base_price: tour.base_price,
    policy: tour.policy,
    tags: tour.tags,
    media: tour.media,
    itinerary: tour.itinerary,
    status: (tour as Tour).status || "pending",
});


export default function PartnerActivities() {
  // Thay thế bằng hook thực tế nếu có
  const toast = ({ title, description, variant }: { title: string, description: string, variant?: string }) => {
    console.log(`[TOAST - ${variant || 'default'}]: ${title} - ${description}`);
    alert(`${title}: ${description}`);
  };

  const [tours, setTours] = useState<Tour[]>([
    {
      id: "1",
      title: "Tour Hạ Long 3N2Đ",
      destination: "Quảng Ninh",
      duration: "3 ngày",
      price: "₫5,500,000",
      description: "Khám phá vịnh Hạ Long với cảnh đẹp tuyệt vời",
      status: "approved",
      base_price: 5500000,
      policy: "Miễn phí hủy trước 7 ngày",
      tags: ["bien", "nghi-duong"],
      media: { images: ["https://cdn.example.com/halong1.jpg"] },
      itinerary: [{ day: 1, title: "Ngày 1", detail: "Khởi hành và thăm hang" }],
    },
    {
        id: "2",
        title: "Tour Đà Lạt mộng mơ 2N1Đ",
        destination: "Lâm Đồng",
        duration: "2 ngày",
        price: "₫2,800,000",
        description: "Khám phá thành phố sương mù",
        status: "pending",
        base_price: 2800000,
        policy: "Không hoàn tiền",
        tags: ["lang-man", "ui"],
        media: { images: ["https://cdn.example.com/dalat1.jpg"] },
        itinerary: [{ day: 1, title: "Ngày 1", detail: "Tham quan Vườn hoa" }],
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData = {
    title: "",
    description: "",
    destination: "",
    durationDays: 3,
    base_price: 5500000,
    policy: "",
    tagsString: "",
    imageUrlsString: "",
    itineraryItems: [{ day: 1, title: "", detail: "" }],
  };

  const [formData, setFormData] = useState(initialFormData);

  // Cập nhật form data khi editingTour thay đổi
  useEffect(() => {
    if (editingTour) {
        setFormData({
            title: editingTour.title,
            description: editingTour.description,
            destination: editingTour.destination,
            durationDays: Number(editingTour.duration.split(' ')[0]),
            base_price: editingTour.base_price,
            policy: editingTour.policy,
            tagsString: editingTour.tags.join(', '),
            imageUrlsString: editingTour.media.images.join(', '),
            itineraryItems: editingTour.itinerary.length > 0 ? editingTour.itinerary : [{ day: 1, title: "", detail: "" }],
        });
        setIsDialogOpen(true);
    }
  }, [editingTour]);


  // ---------- FUNCTIONS ----------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === "durationDays" || id === "base_price" ? Number(value) : value,
    }));
  };

  const handleAddTour = () => {
    setEditingTour(null);
    setFormData(initialFormData);
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
        { day: formData.itineraryItems.length + 1, title: "", detail: "" },
      ],
    });
  };

  const removeItineraryItem = (index: number) => {
    if (formData.itineraryItems.length > 1) {
      const newItems = formData.itineraryItems
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, day: i + 1 }));
      setFormData({ ...formData, itineraryItems: newItems });
    } else {
      toast({
        title: "Cảnh báo",
        description: "Cần có ít nhất một mục trong hành trình.",
        variant: "destructive",
      });
    }
  };

  const postTour = async (tourData: TourAPI, isEdit: boolean = false, id?: string): Promise<Tour> => {
    setIsSubmitting(true);
    // Thay thế bằng Axios thực tế
    try {
      // Mock API call
      // const response = await axios.post("/api/partner/tours", tourData);
      
      const newTourFromAPI: TourAPI & { id: string } = {
          ...tourData,
          id: id || Math.random().toString(36).substring(2, 9),
      };

      const newTourForState: Tour = formatTourData(newTourFromAPI);

      if (isEdit) {
          setTours((prev) => prev.map((t) => (t.id === id ? newTourForState : t)));
      } else {
          setTours((prev) => [...prev, newTourForState]);
      }
      
      toast({
        title: isEdit ? "Cập nhật thành công 🎉" : "Thêm tour thành công 🎉",
        description: isEdit ? "Tour đã được cập nhật và đang chờ admin duyệt lại." : "Tour mới đang chờ admin duyệt.",
        variant: "default",
      });
      return newTourForState;
    } catch (error) {
      console.error("Lỗi khi xử lý tour:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xử lý tour. Vui lòng thử lại.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tagsString.split(",").map((tag) => tag.trim()).filter(tag => tag.length > 0);
    const imagesArray = formData.imageUrlsString.split(",").map((url) => url.trim()).filter(url => url.length > 0);
    const itineraryData = formData.itineraryItems.filter((i) => i.title && i.detail);

    const tourPayload: TourAPI = {
      title: formData.title,
      description: formData.description,
      destination: formData.destination,
      duration: formData.durationDays,
      base_price: formData.base_price,
      policy: formData.policy,
      tags: tagsArray,
      media: { images: imagesArray },
      itinerary: itineraryData,
    };

    try {
        if (editingTour) {
            await postTour(tourPayload, true, editingTour.id);
        } else {
            await postTour(tourPayload, false);
        }
        setIsDialogOpen(false);
        setEditingTour(null);
    } catch (error) {
        // Xử lý lỗi postTour
    }
  };

  const handleDeleteTour = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tour này không? Hành động này không thể hoàn tác.")) {
        setTours(tours.filter((t) => t.id !== id));
        toast({
            title: "Xóa thành công",
            description: "Tour đã được xóa khỏi danh sách.",
        });
    }
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

  // ---------- JSX ----------
  return (
    <div className="space-y-6">
      {/* HEADER CỦA TRANG (CHỈ CÓ NÚT Ở GÓC PHẢI) */}
      <div className="flex items-center justify-between"> 
        
        {/* 1. PHẦN TỬ GIÃN NỞ (ĐẨY NÚT SANG PHẢI) */}
        <div className="flex-grow">
          {/* Bạn có thể thêm tiêu đề nhỏ nếu muốn: */}
          {/* <h1 className="text-3xl font-bold tracking-tight">Quản lý Tour</h1> */}
        </div>

        {/* 2. DIALOG/BUTTON (CĂN BÊN PHẢI) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleAddTour}
              className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm Tour mới
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader>
              <DialogTitle>{editingTour ? "Chỉnh sửa Tour" : "Thêm Tour mới"}</DialogTitle>
              <DialogDescription>
                {editingTour
                  ? "Cập nhật thông tin tour. Tour sẽ chuyển sang trạng thái chờ duyệt lại."
                  : "Điền thông tin tour chi tiết, tour sẽ cần được admin duyệt trước khi hiển thị."}
              </DialogDescription>
            </DialogHeader>

            {/* Form thêm/chỉnh sửa */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Thông tin cơ bản */}
              <div className="space-y-4 border p-4 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                  <List className="h-5 w-5" /> Thông tin cơ bản
                </h3>
                {/* ... (các trường Input) ... */}
                <div>
                  <Label htmlFor="title">Tên Tour *</Label>
                  <Input id="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="destination">Địa điểm *</Label>
                    <Input id="destination" value={formData.destination} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="durationDays">Số ngày *</Label>
                    <Input id="durationDays" type="number" min="1" value={formData.durationDays} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="base_price">Giá (VNĐ) *</Label>
                    <Input id="base_price" type="number" min="0" value={formData.base_price} onChange={handleInputChange} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Mô tả *</Label>
                  <Textarea id="description" value={formData.description} onChange={handleInputChange} required rows={4} />
                </div>
                <div>
                    <Label htmlFor="policy">Chính sách *</Label>
                    <Textarea id="policy" value={formData.policy} onChange={handleInputChange} required placeholder="Ví dụ: Chính sách hủy tour, đổi lịch" />
                </div>
              </div>

              {/* Media & Tags */}
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                        <Image className="h-5 w-5" /> Ảnh Tour
                    </h3>
                    <Textarea id="imageUrlsString" value={formData.imageUrlsString} onChange={handleInputChange} placeholder="URL hình ảnh, cách nhau bằng dấu phẩy" rows={3} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                        <Tag className="h-5 w-5" /> Tags
                    </h3>
                    <Input id="tagsString" value={formData.tagsString} onChange={handleInputChange} placeholder="Tags, cách nhau bằng dấu phẩy (ví dụ: bien, nghi-duong)" />
                </div>
              </div>

              {/* Hành trình */}
              <div className="space-y-4 border p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" /> Hành trình
                  </h3>
                  <Button type="button" size="sm" onClick={addItineraryItem}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm Ngày
                  </Button>
                </div>

                {formData.itineraryItems.map((item, i) => (
                  <Card key={i} className="p-3 border-l-4 border-primary/50">
                    <CardHeader className="p-0 pb-2 flex-row items-center justify-between">
                      <CardTitle className="text-base font-bold text-gray-800">Ngày {item.day}</CardTitle>
                      {formData.itineraryItems.length > 1 && (
                        <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeItineraryItem(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </CardHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <Input value={item.title} onChange={(e) => handleItineraryChange(i, "title", e.target.value)} placeholder="Tiêu đề ngày (ví dụ: Khám phá vịnh)" />
                      <Input value={item.detail} onChange={(e) => handleItineraryChange(i, "detail", e.target.value)} placeholder="Chi tiết hoạt động (ví dụ: Chèo Kayak, ăn trưa)" />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.title || !formData.destination}>
                  {isSubmitting ? "Đang lưu..." : editingTour ? "Cập nhật" : "Thêm Tour"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bảng Danh sách Tour */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Tour đã đăng</CardTitle>
          <CardDescription>Các tour cần được admin duyệt trước khi hiển thị trên trang bán hàng.</CardDescription>
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
              {tours.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Chưa có tour nào được đăng.</TableCell></TableRow>
              ) : (
                tours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell className="font-medium">{tour.title}</TableCell>
                    <TableCell>{tour.destination}</TableCell>
                    <TableCell>{tour.duration}</TableCell>
                    <TableCell>{tour.price}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(tour.status)}>
                        {getStatusText(tour.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTour(tour)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* Nút Xem chi tiết (Chỉ là mock) */}
                        <Button variant="ghost" size="sm">
                            <Calendar className="h-4 w-4" /> 
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-red-600" onClick={() => handleDeleteTour(tour.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

}