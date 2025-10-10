import { Shield, Star, Clock, CreditCard } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: <Star className="w-12 h-12 text-primary" />,
      title: "Vô vàn lựa chọn",
      description: "Với hàng trăm ngàn điểm tham quan, khách sạn & nhiều hơn nữa, chắc chắn bạn sẽ tìm thấy niềm vui."
    },
    {
      icon: <CreditCard className="w-12 h-12 text-primary" />,
      title: "Chơi vui, giá tốt",
      description: "Trải nghiệm chất lượng với giá tốt. Tích luỹ VietTravel xu để được thêm ưu đãi"
    },
    {
      icon: <Clock className="w-12 h-12 text-primary" />,
      title: "Dễ dàng và tiện lợi",
      description: "Đặt vé xác nhận ngay, miễn xếp hàng, miễn phí hủy, tiện lợi cho bạn tha hồ khám phá"
    },
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: "Đáng tin cậy",
      description: "Tham khảo đánh giá chân thực. Dịch vụ hỗ trợ tận tình, đồng hành cùng bạn mọi lúc, mọi nơi"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
