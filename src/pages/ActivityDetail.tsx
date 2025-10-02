import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Star, MapPin, Heart, ChevronRight, Calendar, Users, Check, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import TourCard from "@/components/TourCard";

const ActivityDetail = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Mock data - trong thực tế sẽ fetch từ API hoặc database
  const activity = {
    id: id || "1",
    title: "Dịch Vụ Đón Tiễn Ưu Tiên Tại Sân Bay Tân Sơn Nhất (SGN) - Hồ Chí Minh",
    locationName: "Thành phố Hồ Chí Minh",
    region: "VIỆT NAM",
    category: "Dịch vụ du lịch",
    rating: 4.4,
    reviewCount: 1840,
    bookedCount: 25400,
    price: 765000,
    originalPrice: 850000,
    discount: 10,
    duration: "1-2 giờ",
    images: [
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    ],
    highlights: [
      "Tiết kiệm thời gian chờ đợi với dịch vụ ưu tiên",
      "Hỗ trợ 24/7 với đội ngũ chuyên nghiệp",
      "Đảm bảo an toàn và đúng giờ",
      "Miễn phí hủy đặt trước 24 giờ",
    ],
    description: "Trải nghiệm dịch vụ đón tiễn sân bay cao cấp với xe riêng và tài xế chuyên nghiệp. Dịch vụ này giúp bạn di chuyển thoải mái từ sân bay đến khách sạn hoặc ngược lại mà không phải lo lắng về việc tìm taxi hay giao thông công cộng.",
    packages: [
      {
        id: "1",
        name: "Gói Tiêu chuẩn",
        description: "Xe sedan 4 chỗ",
        price: 765000,
        features: ["Xe sedan 4 chỗ", "Tài xế tiếng Việt", "Nước uống miễn phí"],
      },
      {
        id: "2", 
        name: "Gói Cao cấp",
        description: "Xe SUV 7 chỗ",
        price: 950000,
        features: ["Xe SUV 7 chỗ", "Tài xế tiếng Anh/Việt", "Nước uống + WiFi"],
      },
    ],
    termsAndConditions: [
      {
        title: "Xác nhận",
        content: "Xác nhận ngay tức thì. Nếu bạn không nhận được email xác nhận đơn hàng, hãy liên hệ với chúng tôi",
      },
      {
        title: "Điều kiện sử dụng",
        content: "Vui lòng có mặt tại điểm đón đúng giờ. Trường hợp muộn quá 15 phút sẽ bị hủy mà không hoàn lại tiền.",
      },
      {
        title: "Chính sách hủy",
        content: "Miễn phí hủy trước 24 giờ. Hủy trong vòng 24 giờ sẽ không được hoàn tiền.",
      },
    ],
    faqs: [
      {
        question: "Dịch vụ này có bao gồm phí cao tốc không?",
        answer: "Có, tất cả các loại phí đường bộ và cao tốc đã được bao gồm trong giá.",
      },
      {
        question: "Tôi có thể thay đổi thời gian đón không?",
        answer: "Có, bạn có thể thay đổi thời gian trước 24 giờ bằng cách liên hệ với chúng tôi.",
      },
      {
        question: "Xe có điều hòa không?",
        answer: "Tất cả xe đều được trang bị điều hòa và giữ sạch sẽ.",
      },
    ],
    importantNotes: [
      {
        title: "Xác nhận",
        items: [
          "Xác nhận ngay tức thì. Nếu bạn không nhận được email xác nhận đơn hàng, hãy liên hệ với chúng tôi",
        ],
      },
      {
        title: "Hướng dẫn đặt",
        items: [
          "Vui lòng cung cấp thông tin chính xác khi đặt. Không thể thay đổi sau khi xác nhận.",
          "Đảm bảo kiểm tra email xác nhận và lưu lại mã đặt chỗ của bạn.",
        ],
      },
      {
        title: "Điều kiện sử dụng",
        items: [
          "Miễn phí cho trẻ em từ 0-5 tuổi nếu bé không sử dụng ghế riêng",
          "Vui lòng có mặt tại điểm đón đúng giờ. Trường hợp muộn quá 15 phút sẽ bị hủy.",
        ],
      },
      {
        title: "Thông tin thêm",
        items: [
          "Có dịch vụ hỗ trợ cho khách có nhu cầu đặc biệt",
          "Vui lòng liên hệ trước nếu bạn cần hỗ trợ đặc biệt",
        ],
      },
    ],
    addOns: [
      {
        id: "1",
        title: "Bảo hiểm du lịch",
        description: "Bảo vệ chuyến đi của bạn với bảo hiểm toàn diện",
        price: 150000,
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
      },
      {
        id: "2",
        title: "Hướng dẫn viên tiếng Anh",
        description: "Thuê hướng dẫn viên chuyên nghiệp",
        price: 500000,
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
      },
    ],
    location: {
      name: "Sân bay Tân Sơn Nhất",
      address: "Trường Sơn, Phường 2, Tân Bình, Thành phố Hồ Chí Minh",
      coordinates: { lat: 10.8188, lng: 106.6519 },
    },
    relatedActivities: [
      {
        id: "2",
        title: "Tour Thành phố Hồ Chí Minh 1 ngày",
        location: "Thành phố Hồ Chí Minh",
        rating: 4.6,
        reviewCount: 2500,
        price: 450000,
        originalPrice: 550000,
        discount: 18,
        duration: "8 giờ",
        category: "Tour du lịch",
        image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop",
        features: ["Hướng dẫn viên", "Bữa trưa", "Vé tham quan"],
      },
      {
        id: "3",
        title: "Chuyến tham quan Đồng bằng sông Cửu Long",
        location: "Miền Tây",
        rating: 4.7,
        reviewCount: 1800,
        price: 650000,
        originalPrice: 750000,
        discount: 13,
        duration: "1 ngày",
        category: "Tour du lịch",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop",
        features: ["Du thuyền", "Bữa trưa", "Hướng dẫn viên"],
      },
      {
        id: "4",
        title: "Vé Landmark 81 SkyView",
        location: "Quận Bình Thạnh",
        rating: 4.5,
        reviewCount: 3200,
        price: 250000,
        originalPrice: 300000,
        discount: 17,
        duration: "2 giờ",
        category: "Điểm tham quan",
        image: "https://images.unsplash.com/photo-1555881698-7497e38b9e62?w=800&h=600&fit=crop",
        features: ["Vé vào cửa", "Audio guide"],
      },
    ],
    reviews: [
      {
        id: "1",
        author: "Nguyễn Văn A",
        rating: 5,
        date: "2024-01-15",
        comment: "Dịch vụ tuyệt vời, tài xế rất nhiệt tình và đúng giờ!",
      },
      {
        id: "2",
        author: "Trần Thị B",
        rating: 4,
        date: "2024-01-10",
        comment: "Xe sạch sẽ, tài xế lịch sự. Giá hợp lý.",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/activities">Hoạt động</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{activity.locationName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={activity.images[selectedImage]} 
                  alt={activity.title}
                  className="w-full h-[400px] object-cover"
                />
                <Button
                  variant="ghost" 
                  size="icon"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {activity.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${activity.title} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title and basic info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{activity.category}</span>
                </div>
                
                <h1 className="text-3xl font-bold text-foreground">{activity.title}</h1>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold ml-1">{activity.rating}/5</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {activity.reviewCount.toLocaleString()} Đánh giá
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{activity.bookedCount.toLocaleString()}+ Đã đặt</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.locationName}</span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {activity.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger 
                  value="packages"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Các gói dịch vụ
                </TabsTrigger>
                <TabsTrigger 
                  value="details"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Về dịch vụ này
                </TabsTrigger>
                <TabsTrigger 
                  value="notes"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Những điều cần lưu ý
                </TabsTrigger>
                <TabsTrigger 
                  value="terms"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Điều khoản
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
                >
                  Đánh giá
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-foreground">{activity.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="packages" className="mt-6">
                <div className="space-y-4">
                  {activity.packages.map((pkg) => (
                    <Card key={pkg.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">{pkg.name}</h3>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-primary">
                              ₫ {pkg.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <ul className="space-y-2">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold mb-4">Thông tin chi tiết</h3>
                  <p className="text-foreground mb-4">{activity.description}</p>
                  <p className="text-foreground">
                    Dịch vụ của chúng tôi đảm bảo mang đến trải nghiệm tốt nhất cho khách hàng 
                    với đội ngũ tài xế chuyên nghiệp, xe hiện đại và sạch sẽ. Chúng tôi cam kết 
                    đúng giờ và phục vụ tận tâm.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <div className="space-y-6">
                  {activity.importantNotes.map((note, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <h4 className="font-semibold text-foreground text-lg">{note.title}</h4>
                      </div>
                      <ul className="space-y-2 ml-8">
                        {note.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="terms" className="mt-6">
                <div className="space-y-6">
                  {activity.termsAndConditions.map((term, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-foreground mb-2">{term.title}</h4>
                      <p className="text-muted-foreground">{term.content}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-foreground">{activity.rating}</div>
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(activity.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.reviewCount.toLocaleString()} đánh giá
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {activity.reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{review.author}</span>
                                <span className="text-sm text-muted-foreground">{review.date}</span>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                              <p className="text-muted-foreground">{review.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Địa điểm</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">{activity.location.name}</h4>
                      <p className="text-muted-foreground flex items-start gap-2">
                        <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>{activity.location.address}</span>
                      </p>
                    </div>
                    <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.086097468119!2d${activity.location.coordinates.lng}!3d${activity.location.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM1BMIS4!5e0!3m2!1svi!2s!4v1234567890123!5m2!1svi!2s`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Câu hỏi thường gặp</h2>
              <div className="space-y-4">
                {activity.faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-foreground mb-2">{faq.question}</h4>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      ₫ {activity.price.toLocaleString()}
                    </span>
                    {activity.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        ₫ {activity.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {activity.discount && (
                    <Badge variant="destructive">Giảm {activity.discount}%</Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Chọn ngày</label>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Chọn ngày
                    </Button>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Số lượng</label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="text-lg font-semibold">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tổng cộng</span>
                    <span className="font-semibold text-foreground">
                      ₫ {(activity.price * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Đặt ngay
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Xác nhận tức thì</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Miễn phí hủy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Vé điện tử</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add-ons */}
            {activity.addOns && activity.addOns.length > 0 && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Thêm vào trải nghiệm của bạn
                  </h3>
                  <div className="space-y-3">
                    {activity.addOns.map((addon) => (
                      <div key={addon.id} className="flex gap-3 p-3 border rounded-lg hover:border-primary transition-colors cursor-pointer">
                        <img 
                          src={addon.image} 
                          alt={addon.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground">{addon.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            ₫ {addon.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Activities */}
        {activity.relatedActivities && activity.relatedActivities.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Bạn có thể sẽ thích</h2>
              <Link to="/activities" className="text-primary hover:underline flex items-center gap-1">
                Xem tất cả
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activity.relatedActivities.map((related) => (
                <TourCard key={related.id} {...related} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ActivityDetail;