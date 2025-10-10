import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface Location {
  id: number;
  name: string;
  activities: number;
  region: string;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([
    { id: 1, name: "TP. Hồ Chí Minh", activities: 45, region: "Miền Nam" },
    { id: 2, name: "Hà Nội", activities: 38, region: "Miền Bắc" },
    { id: 3, name: "Đà Nẵng", activities: 32, region: "Miền Trung" },
    { id: 4, name: "Nha Trang", activities: 28, region: "Miền Trung" },
    { id: 5, name: "Phú Quốc", activities: 25, region: "Miền Nam" },
    { id: 6, name: "Hội An", activities: 22, region: "Miền Trung" },
  ]);

  const initialFormData = {
    name: "",
    region: "",
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');


  // --- HANDLERS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddOrEdit = (location: Location | null) => {
    setEditingLocation(location);
    if (location) {
      setFormData({ name: location.name, region: location.region });
    } else {
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.region) {
      // toast({ title: "Lỗi", description: "Vui lòng điền đủ thông tin." });
      return;
    }

    if (editingLocation) {
      // Chỉnh sửa
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === editingLocation.id
            ? { ...loc, name: formData.name, region: formData.region }
            : loc
        )
      );
    } else {
      // Thêm mới
      const newId = Date.now();
      const newLocation: Location = {
        id: newId,
        name: formData.name,
        region: formData.region,
        activities: 0,
      };
      setLocations((prev) => [...prev, newLocation]);
    }

    setIsDialogOpen(false);
    setEditingLocation(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa điểm này không?")) {
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      // toast({ title: "Đã xóa địa điểm" });
    }
  };
  
  // Lọc danh sách
  const filteredLocations = locations.filter(loc => 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.region.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // --- JSX ---

  return (
    <div className="space-y-6">
      
      {/* HEADER CỦA TRANG (NÚT THÊM MỚI) */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Địa điểm</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleAddOrEdit(null)} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Thêm địa điểm
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Chỉnh sửa Địa điểm" : "Thêm Địa điểm mới"}</DialogTitle>
              <DialogDescription>Cập nhật thông tin địa điểm du lịch.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Tên Địa điểm *</Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="region">Khu vực (Miền) *</Label>
                <Input id="region" value={formData.region} onChange={handleInputChange} required />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit">
                  {editingLocation ? "Lưu thay đổi" : "Thêm Địa điểm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* CARD CHỨA DANH SÁCH VÀ TÌM KIẾM */}
      <Card>
        <CardHeader>
          {/* Căn chỉnh Tiêu đề và Thanh tìm kiếm */}
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách địa điểm ({filteredLocations.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Tìm địa điểm..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{location.name}</h3>
                      <p className="text-sm text-muted-foreground">{location.region}</p>
                    </div>
                    {/* Nút thao tác */}
                    <div className="flex gap-1">
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleAddOrEdit(location)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleDelete(location.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {/* Số lượng hoạt động */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 py-2 px-3 bg-muted rounded-md text-center border">
                      <p className="font-semibold text-primary">{location.activities}</p>
                      <p className="text-xs text-muted-foreground">Hoạt động</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredLocations.length === 0 && (
                <p className="text-muted-foreground italic col-span-full">Không tìm thấy địa điểm nào phù hợp.</p>
            )}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}