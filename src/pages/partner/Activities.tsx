import { useState, useEffect, useMemo } from "react";
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
import { Plus, Edit, Trash2, MapPin, List, Image, Calendar, Loader2, Eye, Send, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

// ---------------------------- INTERFACES ----------------------------
interface ItineraryItem {
  day: number;
  title: string;
  detail: string;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  destination: string;
  base_price: number;
  policy: string;
  tags: string[];
  media: string[];
  itinerary: string[];
  schedule?: {
    id?: string;
    start_date: string;
    end_date: string;
    seats_total: number;
    seats_available: number;
    season_price: number;
  } | null;
  status: "pending" | "approved" | "rejected";
}

// IMPROVEMENT: Tách riêng FormData để quản lý state của form dễ dàng hơn
type FormData = {
    title: string;
    description: string;
    destination: string;
    base_price: number;
    policy: string;
    tagsString: string;
    imageUrlsString: string;
    itineraryItems: ItineraryItem[];
    start_date: string;
    end_date: string;
    seats_total: number;
    seats_available: number;
    season_price: number;
}


// ---------------------------- COMPONENT ----------------------------
export default function PartnerActivities() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false); 
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  

  // Giả lập hàm toast để code chạy được
  const toast = ({ title, description, variant }: any) => {
    console.log(`[TOAST - ${variant || "default"}]: ${title} - ${description}`);
    alert(`${title}: ${description}`);
  };

  const initialFormData: FormData = {
    title: "",
    description: "",
    destination: "",
    base_price: 4500000,
    policy: "",
    tagsString: "",
    imageUrlsString: "",
    itineraryItems: [{ day: 1, title: "", detail: "" }],
    start_date: "2025-12-20",
    end_date: "2025-12-22",
    seats_total: 30,
    seats_available: 30,
    season_price: 5000000,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const mediaList = useMemo(() => {
    if (!selectedTour || !Array.isArray(selectedTour.media)) return [];
    return selectedTour.media
      .map((url) => (typeof url === "string" ? url.trim() : ""))
      .filter((url, idx, arr) => url && arr.indexOf(url) === idx);
  }, [selectedTour]);

  useEffect(() => {
    if (!isDetailOpen) {
      setSelectedImageIndex(0);
      return;
    }
    if (!mediaList.length) {
      setSelectedImageIndex(0);
    } else {
      setSelectedImageIndex((prev) => (prev < mediaList.length ? prev : 0));
    }
  }, [isDetailOpen, mediaList]);

  // ---------------------------- UTILS & API ----------------------------

  // Chuẩn hoá dữ liệu trả về từ API (tags text[], media/itinerary jsonb, schedule có thể null)
  const parsePgArray = (val: any): string[] => {
    if (Array.isArray(val)) return val as string[];
    if (typeof val !== "string") return [];
    const trimmed = val.trim();
    if (!trimmed || trimmed === "{}") return [];
    const inside = trimmed.replace(/^{|}$/g, "");
    if (!inside) return [];
    const items = inside.match(/"((?:[^"\\]|\\.)*)"|([^,]+)/g) || [];
    return items
      .map((raw) => {
        let s = raw.trim();
        if (s.startsWith('"') && s.endsWith('"')) {
          s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        return s;
      })
      .filter(Boolean);
  };

  const parseMaybeJsonArray = (v: any): string[] => {
    if (Array.isArray(v)) return v as string[];
    if (typeof v === "string") {
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Nếu là chuỗi URLs phân tách bởi dấu phẩy, chuyển thành mảng
        if (v.includes(",")) {
          return v.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return v ? [v] : [];
      }
    }
    return [];
  };

  const uniqueNonEmptyUrls = (arr: any): string[] => {
    if (!Array.isArray(arr)) return [];
    const set = new Set<string>();
    for (const x of arr) {
      if (typeof x !== "string") continue;
      const s = x.trim();
      if (!s) continue;
      // Chỉ nhận http/https hoặc data URI
      if (/^(https?:\/\/|data:)/i.test(s)) {
        set.add(s);
      }
    }
    return Array.from(set);
  };

  const normalizeSchedule = (raw: any) => {
    if (!raw) return null;
    return {
      id: raw.id ? String(raw.id) : undefined,
      start_date: String(raw.start_date ?? ""),
      end_date: String(raw.end_date ?? ""),
      seats_total: Number(raw.seats_total ?? 0),
      seats_available: Number(raw.seats_available ?? 0),
      season_price: Number(raw.season_price ?? 0),
    };
  };

  const normalizeTourFromAPI = (t: any): Tour => ({
    id: String(t.id),
    title: t.title || "",
    description: t.description || "",
    destination: t.destination || "",
    base_price: Number(t.base_price ?? 0),
    policy: t.policy || "",
    tags: parsePgArray(t.tags),
    media: uniqueNonEmptyUrls(parseMaybeJsonArray(t.media)),
    itinerary: parseMaybeJsonArray(t.itinerary),
    schedule: normalizeSchedule(t.schedule),
    status: (t.status as Tour["status"]) || "pending",
  });

  const getTokenHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchTours = async () => {
  setIsLoading(true);
  try {
    const res = await axios.get("/partner/tours", { headers: getTokenHeader() });
    // Nếu backend trả về mảng thuần:
    const raw = Array.isArray(res.data) ? res.data : (res.data.tours || []);
    const data: Tour[] = raw.map(normalizeTourFromAPI);
    setTours(data);
  } catch (err: any) {
    console.error("Error fetching tours:", err);
    toast({
      title: "Lỗi tải Tour",
      description: err?.response?.data?.message || "Không thể tải danh sách tour.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => { fetchTours(); }, []);
  
  // IMPROVEMENT: Hàm này an toàn hơn, xử lý cả trường hợp input không phải mảng
  const parseItineraryString = (itinerary: string[] | undefined | null): ItineraryItem[] => {
    if (!Array.isArray(itinerary)) return [{ day: 1, title: 'N/A', detail: 'Hành trình không có sẵn.' }];
    
    return itinerary.map((line, index) => {
        const parts = line.split(":");
        const dayMatch = parts[0]?.match(/\d+/);
        // Fallback về index + 1 nếu không tìm thấy số ngày
        const day = dayMatch ? parseInt(dayMatch[0], 10) : index + 1;
        
        const content = parts.slice(1).join(':').trim(); 
        const detailParts = content.split(" - ");
        
        return {
            day: day,
            title: detailParts[0]?.trim() || "Hoạt động trong ngày", 
            detail: detailParts.slice(1).join(" - ")?.trim() || "Chưa có chi tiết.", 
        };
    });
  }

  const postTour = async (payload: any, isEdit = false, id?: string) => {
    setIsSubmitting(true);
    try {
      const url = isEdit ? "/partner/tours/${id}" : "/partner/tours";
      const method = isEdit ? 'put' : 'post';

      const res = await axios({
        method: method,
        url: url,
        data: payload,
        headers: {
          "Content-Type": "application/json",
          ...getTokenHeader(),
        },
      });

      toast({
        title: "Thành công",
        description: res.data.message || (isEdit ? "Tour đã được cập nhật." : "Tour đã được tạo."),
      });

      await fetchTours(); 
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || `Không thể ${isEdit ? "cập nhật" : "tạo"} tour.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTourForApproval = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn gửi yêu cầu duyệt tour này không?")) return;
    try {
      await axios.put(
        "/partner/tours/${id}",
        { status: 'pending' },
        { headers: { 'Content-Type': 'application/json', ...getTokenHeader() } }
      );

      toast({
        title: "Gửi duyệt thành công",
        description: "Tour đã chuyển sang trạng thái 'Chờ duyệt'.",
      });

      await fetchTours();
    } catch (err: any) {
      console.error("Error submitting tour:", err);
      toast({
        title: "Lỗi gửi yêu cầu",
        description: err.response?.data?.message || "Không thể gửi yêu cầu duyệt tour.",
        variant: "destructive",
      });
    }
  }


  const handleDeleteTour = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tour này không?")) {
        try {
            await axios.delete("/partner/tours/${id}", {
                headers: getTokenHeader(),
            });
            toast({ title: "Xóa thành công", description: "Tour đã bị xóa." });
            setTours((prev) => prev.filter((t) => t.id !== id));
        } catch (err: any) {
            console.error("Error deleting tour:", err);
            toast({
                title: "Lỗi xóa Tour",
                description: err.response?.data?.message || "Không thể xóa tour.",
                variant: "destructive",
            });
        }
    }
  };
  
  // ---------------------------- EFFECTS ----------------------------

  useEffect(() => {
    fetchTours();
  }, []); 

  useEffect(() => {
    if (editingTour) {
      const parsedItinerary = parseItineraryString(editingTour.itinerary);
      setFormData({
        title: editingTour.title || "",
        description: editingTour.description || "",
        destination: editingTour.destination || "",
        base_price: editingTour.base_price || 0,
        policy: editingTour.policy || "",
        tagsString: Array.isArray(editingTour.tags) ? editingTour.tags.join(", ") : "",
        imageUrlsString: Array.isArray(editingTour.media) ? editingTour.media.join("\n") : "",
        itineraryItems: parsedItinerary.length > 0 ? parsedItinerary : initialFormData.itineraryItems,
        start_date: editingTour.schedule?.start_date?.split('T')[0] || initialFormData.start_date,
        end_date: editingTour.schedule?.end_date?.split('T')[0] || initialFormData.end_date,
        seats_total: editingTour.schedule?.seats_total ?? initialFormData.seats_total,
        seats_available: editingTour.schedule?.seats_available ?? initialFormData.seats_available,
        season_price: editingTour.schedule?.season_price ?? initialFormData.season_price,
      });
      setIsDialogOpen(true);
    } else {
        setFormData(initialFormData);
    }
  }, [editingTour]);

  useEffect(() => {
    if (!isDialogOpen) {
        setEditingTour(null);
    }
  }, [isDialogOpen])

  // ---------------------------- HANDLERS ----------------------------

  const handleViewTour = async (id: string) => {
      setSelectedTour(null);
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      try {
          const res = await axios.get("/partner/tours/${id}", {
              headers: getTokenHeader(),
          });
          
          const raw = res.data.tour || res.data;
          const tourData: Tour = normalizeTourFromAPI(raw);
          setSelectedTour(tourData);

      } catch (err: any) {
          toast({
              title: "Lỗi",
              description: "Không thể tải chi tiết tour. Vui lòng thử lại.",
              variant: "destructive",
          });
          setIsDetailOpen(false);
      } finally {
          setIsDetailLoading(false);
      }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    // IMPROVEMENT: Chuyển đổi sang số an toàn hơn
    if (["base_price", "season_price", "seats_total", "seats_available"].includes(id)) {
        setFormData((prev) => ({ ...prev, [id]: Number(value) || 0 }));
    } else {
        setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleAddTour = () => {
    setEditingTour(null); 
    setFormData(initialFormData); 
    setIsDialogOpen(true);
  };

  const handleItineraryChange = (
    index: number,
    field: "title" | "detail",
    value: string
  ) => {
    const newItems = [...formData.itineraryItems];
    newItems[index][field] = value;
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
      const newItems = formData.itineraryItems.filter((_, i) => i !== index);
      const reIndexedItems = newItems.map((item, i) => ({ ...item, day: i + 1 }));

      setFormData({ ...formData, itineraryItems: reIndexedItems });
    } else {
      toast({
        title: "Cảnh báo",
        description: "Cần có ít nhất một mục trong hành trình.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.itineraryItems.some(item => !item.title || !item.detail)) {
        toast({
            title: "Thiếu thông tin hành trình",
            description: "Tiêu đề và Chi tiết hoạt động trong Hành trình không được để trống.",
            variant: "destructive",
        });
        return;
    }

    const tagsArray = formData.tagsString.split(",").map((t) => t.trim()).filter(Boolean);
    const mediaArray = formData.imageUrlsString
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean);
    const itineraryStrings = formData.itineraryItems.map(
      (i) => `Ngày ${i.day}: ${i.title} - ${i.detail}`
    );

    const schedulePayload: any = {
      start_date: formData.start_date,
      end_date: formData.end_date,
      seats_total: Number(formData.seats_total),
      seats_available: Math.min(Number(formData.seats_available), Number(formData.seats_total)),
      season_price: Number(formData.season_price),
    };
    if (editingTour?.schedule?.id) {
      schedulePayload.id = editingTour.schedule.id;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      destination: formData.destination,
      base_price: Number(formData.base_price),
      policy: formData.policy,
      tags: tagsArray,
      media: mediaArray,
      itinerary: itineraryStrings,
      schedule: schedulePayload,
    };

    await postTour(payload, !!editingTour, editingTour?.id);
  };

  const getStatusBadge = (status: string): "default" | "secondary" | "destructive" => {
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
  
  // FIX: Khai báo biến currentImage trước khi sử dụng
  const currentImage = mediaList[selectedImageIndex];

  // ---------------------------- RENDER ----------------------------
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Tour</h1>
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
                  ? "Cập nhật thông tin tour. Tour sẽ chuyển sang 'Chờ duyệt' sau khi cập nhật."
                  : "Điền thông tin chi tiết tour."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 border p-4 rounded-lg">
                    <Label htmlFor="title">Tên Tour *</Label>
                    <Input id="title" value={formData.title} onChange={handleInputChange} required />

                    <Label htmlFor="description">Mô tả *</Label>
                    <Textarea id="description" value={formData.description} onChange={handleInputChange} required rows={3} />

                    <Label htmlFor="destination">Địa điểm *</Label>
                    <Input id="destination" value={formData.destination} onChange={handleInputChange} required />

                    <Label htmlFor="policy">Chính sách *</Label>
                    <Textarea id="policy" value={formData.policy} onChange={handleInputChange} rows={3} required />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="base_price">Giá cơ bản</Label>
                            <Input id="base_price" type="number" value={formData.base_price} onChange={handleInputChange} required min="0" />
                        </div>
                        <div>
                            <Label htmlFor="season_price">Giá mùa cao điểm</Label>
                            <Input id="season_price" type="number" value={formData.season_price} onChange={handleInputChange} required min="0" />
                        </div>
                        <div>
                            <Label htmlFor="tagsString">Tags (cách nhau dấu phẩy)</Label>
                            <Input id="tagsString" value={formData.tagsString} onChange={handleInputChange} placeholder="biển, resort, 3n2d" />
                        </div>
                    </div>

                    <Label htmlFor="imageUrlsString">Ảnh (mỗi dòng một URL)</Label>
                    <Textarea
                      id="imageUrlsString"
                      value={formData.imageUrlsString}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder={"https://example.com/img1.jpg\nhttps://example.com/img2.jpg"}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start_date">Ngày bắt đầu</Label>
                            <Input id="start_date" type="date" value={formData.start_date} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="end_date">Ngày kết thúc</Label>
                            <Input id="end_date" type="date" value={formData.end_date} onChange={handleInputChange} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="seats_total">Tổng chỗ</Label>
                            <Input id="seats_total" type="number" value={formData.seats_total} onChange={handleInputChange} required min="1" />
                        </div>
                        <div>
                            <Label htmlFor="seats_available">Còn trống</Label>
                            <Input id="seats_available" type="number" value={formData.seats_available} onChange={handleInputChange} required min="0" max={formData.seats_total} />
                        </div>
                    </div>
                </div>

              {/* Hành trình */}
              <div className="space-y-4 border p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" /> Hành trình
                  </h3>
                  <Button type="button" size="sm" onClick={addItineraryItem}>
                    <Plus className="h-4 w-4 mr-2" /> Thêm Ngày
                  </Button>
                </div>

                {formData.itineraryItems.map((item, i) => (
                  <Card key={i} className="p-3 border-l-4 border-primary/50">
                    <CardHeader className="p-0 pb-2 flex-row justify-between items-center">
                      <CardTitle className="text-base font-bold text-gray-800">Ngày {item.day}</CardTitle>
                      {formData.itineraryItems.length > 1 && (
                        <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeItineraryItem(i)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input value={item.title} onChange={(e) => handleItineraryChange(i, "title", e.target.value)} placeholder="Tiêu đề ngày" required />
                      <Input value={item.detail} onChange={(e) => handleItineraryChange(i, "detail", e.target.value)} placeholder="Chi tiết hoạt động" required />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>
                  ) : (
                    editingTour ? "Cập nhật" : "Thêm Tour"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
              <DialogHeader>
                  <DialogTitle>{selectedTour ? selectedTour.title : "Đang tải chi tiết..."}</DialogTitle>
                  <DialogDescription>
                      {selectedTour ? (
                          <>
                              Chi tiết đầy đủ của tour. Trạng thái hiện tại: 
                              <Badge variant={getStatusBadge(selectedTour.status)} className="ml-2">
                                  {getStatusText(selectedTour.status)}
                              </Badge>
                          </>
                      ) : "Vui lòng chờ trong giây lát..."}
                  </DialogDescription>
              </DialogHeader>

              {isDetailLoading ? ( 
                  <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : !selectedTour ? (
                  <div className="text-center py-10">Không thể tải dữ liệu tour.</div>
              ) : (
                  <div className="space-y-6 pt-4">
                      <Card>
                          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><List className="h-4 w-4"/> Thông tin cơ bản</CardTitle></CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <p className="text-sm font-semibold">Địa điểm:</p>
                                  <p className="font-medium">{selectedTour.destination}</p>
                              </div>
                              <div>
                                  <p className="text-sm font-semibold">Giá cơ bản:</p>
                                  <p className="font-medium">{selectedTour.base_price.toLocaleString("vi-VN")}₫</p>
                              </div>
                              <div className="col-span-2">
                                  <p className="text-sm font-semibold">Mô tả:</p>
                                  <p className="text-gray-600 whitespace-pre-wrap">{selectedTour.description}</p>
                              </div>
                              <div className="col-span-2">
                                  <p className="text-sm font-semibold">Chính sách:</p>
                                  <p className="text-gray-600 whitespace-pre-wrap">{selectedTour.policy}</p>
                              </div>
                              <div className="col-span-2">
                                  <p className="text-sm font-semibold">Tags:</p>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                      {Array.isArray(selectedTour.tags) && selectedTour.tags.map((tag, i) => (
                                          <Badge key={i} variant="secondary">{tag}</Badge>
                                      ))}
                                  </div>
                              </div>
                          </CardContent>
                      </Card>

                      {selectedTour.schedule ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-4 w-4"/> Lịch trình & Chỗ ngồi</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-semibold">Ngày đi:</p>
                              <p className="font-medium">{selectedTour.schedule.start_date?.split('T')[0]}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Ngày về:</p>
                              <p className="font-medium">{selectedTour.schedule.end_date?.split('T')[0]}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Giá cao điểm:</p>
                              <p className="font-medium">{selectedTour.schedule.season_price?.toLocaleString("vi-VN")}₫</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Tổng chỗ:</p>
                              <p className="font-medium">{selectedTour.schedule.seats_total}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Còn trống:</p>
                              <p className="font-medium">{selectedTour.schedule.seats_available}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-4 w-4"/> Lịch trình & Chỗ ngồi</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">Chưa có lịch trình cho tour này.</p>
                          </CardContent>
                        </Card>
                      )}

                      <Card>
                          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-4 w-4"/> Hành trình chi tiết</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                              {parseItineraryString(selectedTour.itinerary).map((item, i) => (
                                  <div key={i} className="border-l-4 border-orange-400 pl-4">
                                      <p className="font-semibold text-gray-800">Ngày {item.day}: {item.title}</p>
                                      <p className="text-sm text-gray-600">{item.detail}</p>
                                  </div>
                              ))}
                          </CardContent>
                      </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Image className="h-4 w-4" /> Bộ sưu tập ảnh
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {mediaList.length > 0 ? (
                              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                                <div className="relative w-full overflow-hidden rounded-xl border bg-muted aspect-[16/9]">
                                  {/* FIX: Kiểm tra `currentImage` tồn tại trước khi render img */}
                                  {currentImage ? (
                                    <img
                                      src={currentImage}
                                      alt={`Ảnh tour ${selectedImageIndex + 1}`}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        // Ẩn ảnh nếu có lỗi tải
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                        // Hoặc có thể thay thế bằng ảnh placeholder
                                        // e.currentTarget.src = "/placeholder.png"; 
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                                      Không thể hiển thị ảnh.
                                    </div>
                                  )}

                                  {mediaList.length > 1 && (
                                    <>
                                      <button
                                        type="button"
                                        className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white ${
                                          selectedImageIndex === 0 ? "opacity-40 cursor-not-allowed" : ""
                                        }`}
                                        onClick={() => setSelectedImageIndex((idx) => Math.max(idx - 1, 0))}
                                        disabled={selectedImageIndex === 0}
                                        aria-label="Ảnh trước"
                                      >
                                        <ChevronLeft className="h-5 w-5" />
                                      </button>
                                      <button
                                        type="button"
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white ${
                                          selectedImageIndex === mediaList.length - 1 ? "opacity-40 cursor-not-allowed" : ""
                                        }`}
                                        onClick={() => setSelectedImageIndex((idx) => Math.min(idx + 1, mediaList.length - 1))}
                                        disabled={selectedImageIndex === mediaList.length - 1}
                                        aria-label="Ảnh tiếp theo"
                                      >
                                        <ChevronRight className="h-5 w-5" />
                                      </button>
                                    </>
                                  )}
                                  <span className="absolute bottom-3 right-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white">
                                    {Math.min(selectedImageIndex + 1, mediaList.length)} / {mediaList.length}
                                  </span>
                                </div>

                                <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto">
                                  {mediaList.map((url, idx) => (
                                    <button
                                      type="button"
                                      key={`${url}-${idx}`}
                                      onClick={() => setSelectedImageIndex(idx)}
                                      className={`flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border transition focus:outline-none focus:ring-2 focus:ring-primary ${
                                        idx === selectedImageIndex
                                          ? "border-primary ring-1 ring-primary"
                                          : "border-transparent opacity-80 hover:opacity-100"
                                      }`}
                                      aria-label={`Chọn ảnh ${idx + 1}`}
                                    >
                                      <img
                                        src={url}
                                        alt={`Thumbnail ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                                        }}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Chưa có ảnh nào cho tour này.</p>
                            )}
                          </CardContent>
                        </Card>
                  </div>
              )}

              <div className="flex justify-end pt-4">
                  {selectedTour && (
                    <Button
                      variant="secondary"
                      className="mr-2"
                      onClick={() => {
                        setIsDetailOpen(false);
                        setEditingTour(selectedTour);
                      }}
                      disabled={selectedTour.status === 'approved'}
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
              </div>
          </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Tour đã đăng</CardTitle>
          <CardDescription>Tour cần được admin duyệt trước khi hiển thị công khai.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
              <span className="text-lg text-muted-foreground">Đang tải danh sách Tour...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Tour</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Chưa có tour nào được đăng.
                    </TableCell>
                  </TableRow>
                ) : (
                  tours.map((tour) => (
                    <TableRow key={tour.id}>
                      <TableCell className="font-medium max-w-xs truncate">{tour.title}</TableCell>
                      <TableCell>{tour.destination}</TableCell>
                      <TableCell>{(tour.base_price || 0).toLocaleString("vi-VN")}₫</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(tour.status)}>{getStatusText(tour.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* IMPROVEMENT: Thêm aria-label cho các nút icon */}
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleViewTour(tour.id)} aria-label="Xem chi tiết tour">
                            <Eye className="h-4 w-4" />
                          </Button>

                          {(tour.status === 'rejected') && (
                            <Button variant="default" size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => submitTourForApproval(tour.id)} aria-label="Gửi duyệt lại tour">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTour(tour)} disabled={tour.status === 'approved'} aria-label="Chỉnh sửa tour">
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-red-600" onClick={() => handleDeleteTour(tour.id)} disabled={tour.status === 'approved'} aria-label="Xóa tour">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
