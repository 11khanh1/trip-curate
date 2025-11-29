import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const footerSections = [
    {
      title: "Về VietTravel",
      links: [
        { name: "Câu chuyện của chúng tôi", url: "/about/our-story" },
        { name: "Tuyển dụng", url: "/about/careers" },
        { name: "Báo chí", url: "/about/press" },
        { name: "Quan hệ đối tác", url: "/about/partnership" },
        { name: "Chương trình liên kết", url: "/about/affiliate" },
      ],
    },
    {
      title: "Hỗ trợ",
      links: [
        { name: "Trung tâm trợ giúp", url: "/support/help-center" },
        { name: "Chính sách hủy", url: "/support/cancellation-policy" },
        { name: "Chính sách bảo mật", url: "/support/privacy-policy" },
        { name: "Điều khoản sử dụng", url: "/support/terms-of-service" },
      ],
    },
    {
      title: "Sản phẩm",
      links: [
        { name: "Vé tham quan", url: "/activities" },
        { name: "Ưu đãi hot", url: "/deals" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mb-4 text-2xl font-bold text-primary">VietTravel</div>
            <p className="mb-6 text-gray-400">
              Nền tảng đặt tour du lịch hàng đầu với gợi ý cá nhân hóa.
            </p>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span className="text-sm">140 Lê Trọng Tấn, Tây Thạnh, Tân Phú, TP.HCM</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                <span className="text-sm">+84 337236327</span>
              </div>
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                <span className="text-sm">info@travelbooking.com</span>
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.url}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-6 md:mb-0">
              <h4 className="mb-3 font-semibold">Theo dõi chúng tôi</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 transition-colors hover:text-white">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 transition-colors hover:text-white">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 transition-colors hover:text-white">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 transition-colors hover:text-white">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="mb-2 text-sm text-gray-400">Đăng ký nhận tin tức và ưu đãi mới nhất</p>
              <div className="flex max-w-sm">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 rounded-l-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
                />
                <button className="rounded-r-lg bg-primary px-6 py-2 text-sm text-white transition-colors hover:bg-primary/90">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-950 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between text-sm text-gray-400 md:flex-row">
            <p>&copy; 2024 TravelBooking. Tất cả quyền được bảo lưu.</p>
            <div className="mt-2 flex space-x-6 md:mt-0">
              <Link to="/support/privacy-policy" className="transition-colors hover:text-white">
                Chính sách bảo mật
              </Link>
              <Link to="/support/terms-of-service" className="transition-colors hover:text-white">
                Điều khoản dịch vụ
              </Link>
              <Link to="/support/help-center" className="transition-colors hover:text-white">
                Trợ giúp
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
