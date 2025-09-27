import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Về Klook",
      links: [
        "Câu chuyện của chúng tôi",
        "Tuyển dụng",
        "Báo chí",
        "Quan hệ đối tác",
        "Chương trình liên kết"
      ]
    },
    {
      title: "Hỗ trợ",
      links: [
        "Trung tâm trợ giúp",
        "Liên hệ chúng tôi",
        "Chính sách hủy",
        "Chính sách bảo mật",
        "Điều khoản sử dụng"
      ]
    },
    {
      title: "Điểm đến phổ biến",
      links: [
        "Du lịch Hà Nội",
        "Du lịch TP.HCM",
        "Du lịch Đà Nẵng",
        "Du lịch Phú Quốc",
        "Du lịch Nha Trang"
      ]
    },
    {
      title: "Sản phẩm",
      links: [
        "Vé tham quan",
        "Khách sạn",
        "Vé máy bay",
        "Xe đưa đón",
        "Tour trọn gói"
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="text-2xl font-bold text-primary mb-4">
              TravelBooking
            </div>
            <p className="text-gray-400 mb-6">
              Nền tảng đặt tour du lịch hàng đầu với gợi ý cá nhân hóa.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">+84 123 456 789</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm">info@travelbooking.com</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media & Newsletter */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h4 className="font-semibold mb-3">Theo dõi chúng tôi</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm mb-2">
                Đăng ký nhận tin tức và ưu đãi mới nhất
              </p>
              <div className="flex max-w-sm">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-primary text-sm"
                />
                <button className="px-6 py-2 bg-primary text-white rounded-r-lg hover:bg-primary/90 transition-colors text-sm">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2024 TravelBooking. Tất cả quyền được bảo lưu.</p>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
              <a href="#" className="hover:text-white transition-colors">Cookie</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;