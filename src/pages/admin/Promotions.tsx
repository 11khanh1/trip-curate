import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Tag, Percent, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Interface cho Khuyến mãi
interface Promotion {
  id: number;
  name: string;
  discount: string; // Ex: "40%"
  code: string;
  status: "active" | "expired" | "inactive";
  used: number;
  description: string;
  startDate?: string;
  endDate?: string;
}

// Interface cho Form
interface PromotionForm {
    name: string;
    discountValue: number;
    isPercentage: boolean;
    code: string;
    description: string;
    startDate: string;
    endDate: string;
}

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: 1, name: "Sale Sinh Nhật", discount: "40%", code: "BIRTHDAY40", status: "active", used: 234, description: "Áp dụng cho mọi tour trong tháng sinh nhật.", startDate: "2025-10-01", endDate: "2025-10-31" },
    { id: 2, name: "Giảm giá mùa hè", discount: "25%", code: "SUMMER25", status: "active", used: 156, description: "Khuyến mãi hấp dẫn cho tour biển.", startDate: "2025-06-01", endDate: "2025-08-31" },
    { id: 3, name: "Flash Sale", discount: "50%", code: "FLASH50", status: "expired", used: 489, description: "Chỉ trong 24 giờ đầu tháng.", startDate: "2025-09-01", endDate: "2025-09-02" },
  ]);

  const initialFormData: PromotionForm = {
    name: "",
    discountValue: 10,
    isPercentage: true,
    code: "",
    description: "",
    startDate: "",
    endDate: "",
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionForm>(initialFormData);

  // Hàm chuyển đổi form data sang format Promotion
  const transformFormDataToPromo = (data: PromotionForm, id?: number): Promotion => {
    const discountStr = data.isPercentage ? `${data.discountValue}%` : `₫${data.discountValue.toLocaleString('vi-VN')}`;
    const now = new Date().toISOString().split('T')[0];
    const isActive = data.endDate && data.endDate >= now;

    return {
        id: id || Date.now(),
        name: data.name,
        discount: discountStr,
        code: data.code.toUpperCase(),
        status: isActive ? 'active' : 'expired',
        used: id ? promotions.find(p => p.id === id)?.used || 0 : 0,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
    };
  };

  // Mở Dialog và đặt dữ liệu cho form
  const handleEdit = (promo: Promotion) => {
    const isPercentage = promo.discount.includes('%');
    const discountValue = isPercentage 
        ? parseFloat(promo.discount.replace('%', ''))
        : parseFloat(promo.discount.replace(/₫|,/g, ''));

    setFormData({
        name: promo.name,
        discountValue: discountValue,
        isPercentage: isPercentage,
        code: promo.code,
        description: promo.description,
        startDate: promo.startDate || '',
        endDate: promo.endDate || '',
    });
    setEditingPromo(promo);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPromo(null);
    setFormData(initialFormData);
    // Tạo mã code ngẫu nhiên
    setFormData(prev => ({ 
        ...prev, 
        code: 'PROMO_' + Math.random().toString(36).substring(2, 5).toUpperCase()
    }));
    setIsDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ 
        ...prev, 
        [id]: id === 'discountValue' ? Number(value) : value 
    }));
  };
  
  const handleDiscountTypeChange = (isPercentage: boolean) => {
    setFormData(prev => ({ ...prev, isPercentage }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPromo) {
      const updatedPromo = transformFormDataToPromo(formData, editingPromo.id);
      setPromotions(promotions.map(p => p.id === updatedPromo.id ? updatedPromo : p));
    } else {
      const newPromo = transformFormDataToPromo(formData);
      setPromotions([newPromo, ...promotions]);
    }
    setIsDialogOpen(false);
  };
  
  const handleDelete = (id: number) => {
      if(window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi này không?")) {
          setPromotions(promotions.filter(p => p.id !== id));
          // toast({ title: "Đã xóa khuyến mãi" }); // Dùng toast nếu có
      }
  }


  return (
    <div className="space-y-6">
      {/* HEADER CỦA TRANG (ĐÃ BỎ TIÊU ĐỀ H1) */}
      <div className="flex items-center justify-end">
        
        {/* THÊM flex-grow ĐỂ ĐẢM BẢO NÚT NẰM GÓC PHẢI */}
        <div className="flex-grow" /> 
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
                onClick={handleCreate} 
                className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo khuyến mãi mới
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Chỉnh sửa Khuyến mãi" : "Tạo Khuyến mãi mới"}</DialogTitle>
              <DialogDescription>Cấu hình chi tiết mã giảm giá, mức chiết khấu và thời hạn áp dụng.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                
                <div className="grid grid-cols-2 gap-4">
                    {/* Tên Khuyến mãi */}
                    <div className="space-y-1">
                        <Label htmlFor="name">Tên khuyến mãi</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    {/* Mã code */}
                    <div className="space-y-1">
                        <Label htmlFor="code">Mã giảm giá</Label>
                        <Input id="code" value={formData.code} onChange={handleChange} required disabled={!!editingPromo} />
                        {editingPromo && <p className="text-xs text-muted-foreground">Mã code không thể thay đổi.</p>}
                    </div>
                </div>

                {/* Mức giảm giá */}
                <div className="space-y-1">
                    <Label>Mức giảm giá</Label>
                    <div className="flex rounded-md shadow-sm">
                        <Input 
                            id="discountValue" 
                            type="number" 
                            value={formData.discountValue} 
                            onChange={handleChange} 
                            min={formData.isPercentage ? 1 : 1000}
                            required 
                            className="rounded-r-none"
                        />
                        <div className="inline-flex items-center rounded-r-md border border-l-0 bg-muted px-3 text-muted-foreground">
                            {formData.isPercentage ? '%' : 'VNĐ'}
                        </div>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="icon" 
                            className="ml-2"
                            onClick={() => handleDiscountTypeChange(!formData.isPercentage)}
                            title="Đổi loại giảm giá"
                        >
                            <Percent className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Thời gian áp dụng */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="startDate">Ngày bắt đầu</Label>
                        <Input id="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="endDate">Ngày kết thúc</Label>
                        <Input id="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                    </div>
                </div>

                {/* Mô tả */}
                <div className="space-y-1">
                    <Label htmlFor="description">Mô tả chi tiết</Label>
                    <Textarea id="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Mô tả điều kiện và phạm vi áp dụng..." />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                    <Button type="submit">
                        {editingPromo ? "Lưu thay đổi" : "Tạo khuyến mãi"}
                    </Button>
                </div>
            </form>

          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => (
          <Card key={promo.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Background trang trí */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-bl-full" /> 
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{promo.name}</CardTitle>
                  <p className="text-3xl font-bold text-primary mt-2">{promo.discount}</p>
                </div>
                <Badge variant={promo.status === "active" ? "default" : "secondary"}>
                  {promo.status === "active" ? "Đang áp dụng" : "Hết hạn"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                
                <div className="flex items-center justify-between text-xs py-2">
                    <div className="flex items-center text-muted-foreground gap-1"><Calendar className="h-3 w-3" /> Bắt đầu: <span className="text-foreground font-medium">{promo.startDate}</span></div>
                    <div className="flex items-center text-muted-foreground gap-1"><Calendar className="h-3 w-3" /> Kết thúc: <span className="text-foreground font-medium">{promo.endDate}</span></div>
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-md border border-dashed border-primary/50">
                  <span className="text-sm text-muted-foreground">Mã giảm giá</span>
                  <span className="font-mono font-semibold text-gray-800">{promo.code}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đã sử dụng</span>
                  <span className="font-medium">{promo.used} lần</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(promo)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Chỉnh sửa
                  </Button>
                  <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(promo.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}