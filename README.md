## Giới thiệu

Frontend Vite + React + TypeScript cho nền tảng đặt tour (VietTravel), dùng Tailwind + shadcn/ui, React Query, Axios.

## Yêu cầu môi trường
- Node.js >= 18
- npm (hoặc Bun nếu muốn dùng `bun install` theo `bun.lockb`, nhưng npm vẫn chạy bình thường)

## Cài đặt & chạy local

```bash
git clone <YOUR_GIT_URL>
cd trip-curate
# cài dependency
npm install        # hoặc bun install

# chạy dev
npm run dev        # mặc định http://localhost:8080/

# build production
npm run build      # output trong dist/
```

## Biến môi trường
- Tạo `.env` (sao chép từ `.env.example` nếu có) và đặt:
  - `VITE_API_BASE_URL` (dev) và `VITE_API_BASE_URL_PROD` (prod) trỏ tới backend của bạn.
- Ứng dụng cần backend cho các API: auth, chatbot, recommendations... Nếu chạy backend riêng, chỉnh lại các URL này.

## Công nghệ chính
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Query, Axios
- Context API (user, cart, chat widget...)

## Lệnh hữu ích
- `npm run dev`: chạy dev server
- `npm run build`: build production
- `npm run preview`: xem thử build

## Lưu ý
- Chatbot yêu cầu header `Authorization: Bearer <token>` (token đăng nhập) để backend nhận diện user. Đăng nhập qua luồng có trả token để `localStorage("token")` tồn tại.
- Các trang gợi ý cá nhân hóa chỉ chạy khi có user đăng nhập; nếu không, sẽ fallback dữ liệu trending.

