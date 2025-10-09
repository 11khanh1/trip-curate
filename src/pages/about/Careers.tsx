import TravelHeader from "@/components/TravelHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MapPin, Clock } from "lucide-react";

const Careers = () => {
  const jobOpenings = [
    {
      id: 1,
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Hà Nội, Việt Nam",
      type: "Full-time",
    },
    {
      id: 2,
      title: "Product Manager",
      department: "Product",
      location: "TP. Hồ Chí Minh, Việt Nam",
      type: "Full-time",
    },
    {
      id: 3,
      title: "Marketing Manager",
      department: "Marketing",
      location: "Hà Nội, Việt Nam",
      type: "Full-time",
    },
    {
      id: 4,
      title: "Customer Support Specialist",
      department: "Customer Service",
      location: "Remote",
      type: "Full-time",
    },
    {
      id: 5,
      title: "UX/UI Designer",
      department: "Design",
      location: "TP. Hồ Chí Minh, Việt Nam",
      type: "Full-time",
    },
    {
      id: 6,
      title: "Data Analyst",
      department: "Analytics",
      location: "Hà Nội, Việt Nam",
      type: "Full-time",
    },
  ];

  const benefits = [
    "Lương thưởng cạnh tranh",
    "Bảo hiểm sức khỏe toàn diện",
    "Cơ hội phát triển nghề nghiệp",
    "Môi trường làm việc năng động",
    "Du lịch công ty hàng năm",
    "Làm việc linh hoạt",
  ];

  return (
    <div className="min-h-screen bg-background">
      <TravelHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Tham gia đội ngũ VietTravel</h1>
            <p className="text-xl mb-8">
              Cùng nhau tạo nên những trải nghiệm du lịch tuyệt vời cho hàng triệu người
            </p>
            <Button size="lg" variant="secondary">
              Xem tất cả vị trí tuyển dụng
            </Button>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tại sao nên làm việc tại VietTravel?</h2>
            <p className="text-lg text-muted-foreground">
              Chúng tôi tin rằng nhân viên hạnh phúc sẽ tạo ra sản phẩm tuyệt vời
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">✓</span>
                  </div>
                  <h3 className="font-semibold">{benefit}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Job Openings */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Vị trí đang tuyển dụng</h2>
            
            <div className="space-y-4">
              {jobOpenings.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.department}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.type}
                          </div>
                        </div>
                      </div>
                      <Button>Ứng tuyển</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;