import { useState } from "react";
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
  duration: number;
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
  duration: string;
  price: string;
  status: "pending" | "approved" | "rejected";
  base_price: number;
}

const Partner = () => {
  const { toast } = useToast();

  const [tours, setTours] = useState<Tour[]>([
    {
      id: "1",
      title: "Tour Hạ Long 3N2Đ",
      destination: "Quảng Ninh",
      duration: "3 ngày 2 đêm",
      price: "₫5,500,000",
      description: "Khám phá vịnh Hạ Long với cảnh đẹp tuyệt vời",
      status: "approved",
      base_price: 5500000,
      policy: "Miễn phí hủy trước 7 ngày",
      tags: ["bien", "nghi-duong"],
      media: { images: ["https://cdn.example.com/halong1.jpg"] },
      itinerary: [],
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
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
    setFormData({
      title: "",
      description: "",
      destination: "",
      durationDays: 3,
      base_price: 5500000,
      policy: "",
      tagsString: "bien, nghi-duong",
      imageUrlsString: "",
      itineraryItems: [{ day: 1, title: "", detail: "" }],
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

  const postNewTour = async (tourData: TourAPI): Promise<Tour> => {
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/partner/tours", tourData);
      const newTourFromAPI: TourAPI & { id: string } = response.data;

      const newTourForState: Tour = {
        id: newTourFromAPI.id,
        title: newTourFromAPI.title,
        description: newTourFromAPI.description,
        destination: newTourFromAPI.destination,
        duration: `${newTourFromAPI.duration} ngày`,
        price: `₫${newTourFromAPI.base_price.toLocaleString("vi-VN")}`,
        base_price: newTourFromAPI.base_price,
        policy: newTourFromAPI.policy,
        tags: newTourFromAPI.tags,
        media: newTourFromAPI.media,
        itinerary: newTourFromAPI.itinerary,
        status: "pending",
      };

      setTours((prev) => [...prev, newTourForState]);
      toast({
        title: "Thêm tour thành công 🎉",
        description: "Tour mới đang chờ admin duyệt.",
      });
      return newTourForState;
    } catch (error) {
      console.error("Lỗi khi thêm tour:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm tour. Vui lòng thử lại.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tagsString.split(",").map((tag) => tag.trim());
    const imagesArray = formData.imageUrlsString.split(",").map((url) => url.trim());
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

    if (editingTour) {
      const updatedTour: Tour = {
        ...editingTour,
        ...tourPayload,
        duration: `${tourPayload.duration} ngày`,
        price: `₫${tourPayload.base_price.toLocaleString("vi-VN")}`,
        status: "pending",
      };
      setTours((prev) => prev.map((t) => (t.id === editingTour.id ? updatedTour : t)));
      toast({
        title: "Cập nhật thành công",
        description: "Tour đã được cập nhật và đang chờ duyệt lại.",
      });
    } else {
      await postNewTour(tourPayload);
    }

    setIsDialogOpen(false);
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
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddTour}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Tour
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTour ? "Chỉnh sửa Tour" : "Thêm Tour mới"}</DialogTitle>
                <DialogDescription>
                  {editingTour
                    ? "Cập nhật thông tin tour."
                    : "Điền thông tin tour chi tiết, tour sẽ cần được admin duyệt."}
                </DialogDescription>
              </DialogHeader>

              {/* Form thêm/chỉnh sửa */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <List className="h-5 w-5" /> Thông tin cơ bản
                  </h3>
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
                      <Input id="base_price" type="number" value={formData.base_price} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Mô tả *</Label>
                    <Textarea id="description" value={formData.description} onChange={handleInputChange} required />
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Image className="h-5 w-5" /> Ảnh Tour
                  </h3>
                  <Textarea id="imageUrlsString" value={formData.imageUrlsString} onChange={handleInputChange} placeholder="URL hình ảnh, cách nhau bằng dấu phẩy" />
                </div>

                {/* Hành trình */}
                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5" /> Hành trình
                    </h3>
                    <Button type="button" size="sm" onClick={addItineraryItem}>
                      <Plus className="h-4 w-4 mr-2" /> Thêm Ngày
                    </Button>
                  </div>

                  {formData.itineraryItems.map((item, i) => (
                    <Card key={i} className="p-3 border-l-4 border-primary">
                      <CardHeader className="p-0 pb-2 flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold">Ngày {item.day}</CardTitle>
                        {formData.itineraryItems.length > 1 && (
                          <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeItineraryItem(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </CardHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <Input value={item.title} onChange={(e) => handleItineraryChange(i, "title", e.target.value)} placeholder="Tiêu đề ngày" />
                        <Input value={item.detail} onChange={(e) => handleItineraryChange(i, "detail", e.target.value)} placeholder="Chi tiết hoạt động" />
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Đang lưu..." : editingTour ? "Cập nhật" : "Thêm Tour"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setTours(tours.filter((t) => t.id !== tour.id))}>
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
  );
};

export default Partner;
