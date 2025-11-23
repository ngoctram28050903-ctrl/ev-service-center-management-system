# Môn học: Xây dựng phần mềm Hướng Đối Tượng
# Giao viên hướng dẫn: Nguyen Van Chien
# Nhóm Ngọc Trâm: 
 Thành viên:
  - Nguyễn Thị Ngọc Trâm   (NT)
  - Nguyễn Thị Thùy TRang
  - Nguyễn Tuấn Cường
  - Lê Thế Khang
  - Lê Gia Bảo

# Hệ Thống Quản Lý Trung Tâm Dịch Vụ Xe Điện (EV Service Center Management)
Đây là một hệ thống quản lý toàn diện dành cho các Gara/Trung tâm bảo dưỡng xe điện, được xây dựng dựa trên kiến trúc Microservices hiện đại và Event-Driven Architecture. Hệ thống bao gồm đầy đủ các phân hệ từ đặt lịch, quản lý kho, phiếu sửa chữa đến tài chính.

# Tính Năng Chính
 - User Management (Auth): Đăng ký, đăng nhập, phân quyền (RBAC: Admin, Staff, User) sử dụng JWT & Refresh Token.
 - Booking System: Khách hàng đặt lịch hẹn bảo dưỡng, kiểm tra khung giờ trống (Availability Check).
 - Vehicle Management: Quản lý hồ sơ xe, lịch sử sửa chữa và nhắc nhở bảo dưỡng tự động.
 - Work Orders: Quy trình sửa chữa kỹ thuật số (Checklist), phân công thợ máy.
 - Inventory Management: Quản lý xuất/nhập kho phụ tùng, tự động cảnh báo khi tồn kho thấp (Low Stock Alert).
 - Finance: Tự động tạo hóa đơn khi sửa chữa hoàn tất, quản lý thanh toán và doanh thu.
 - Notifications: Hệ thống thông báo qua Email/System Alert dựa trên sự kiện (RabbitMQ).
 - Dashboard Analytics: Biểu đồ thống kê doanh thu, khách hàng, hiệu suất theo thời gian thực.

# Kiến Trúc Hệ Thống
Dự án áp dụng mô hình Microservices giao tiếp qua API Gateway và Message Queue:
 - Frontend: Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript.
 - API Gateway: Node.js (Express + Http-Proxy-Middleware).
 - Backend Services: Node.js (Express), Sequelize ORM.
 - Database: MySQL (Lưu trữ chính), Redis (Caching).
 - Message Broker: RabbitMQ (Xử lý bất đồng bộ: Trừ kho, Gửi mail, Tạo hóa đơn).
 - Infrastructure: Docker & Docker Compose.

# Cấu Trúc Dự Án
```
EV-Service-Center/
│
│
├── 📁 api-gateway                     # Cổng giao tiếp duy nhất (Port 8080)
│   └── 🐳 Dockerfile
├── 📁 db
├── 📁 ev-service-center-backend
│   ├── 📁 auth-service                # Quản lý User & Authentication (Port 5001)
│   ├── 📁 booking-service            # Quản lý Lịch hẹn (Port 5002)          
│   ├── 📁 finance-service           # Quản lý Hóa đơn & Thanh toán (Port 5003)
│   ├── 📁 inventory-service         # Quản lý Kho & Phụ tùng (Port 5004)
│   ├── 📁 notification-service      # Quản lý Thông báo & Email (Port 5005)
│   ├── 📁 vehicle-service          # Quản lý Xe & Nhắc nhở (Port 5006)
│   └── 📁 workorder-service         # Quản lý Phiếu dịch vụ (Port 5007)
├── 📁 ev-service-center-frontend    # Next.js Admin Dashboard & Client App
│   ├── 📁 public
│   │   └── 📁 images
│   │       ├── 📁 brand
│   │       ├── 📁 cards
│   │       ├── 📁 carousel
│   │       ├── 📁 chat
│   │       ├── 📁 country
│   │       ├── 📁 error
│   │       ├── 📁 grid-image
│   │       ├── 📁 icons
│   │       ├── 📁 logo
│   │       ├── 📁 product
│   │       ├── 📁 shape
│   │       ├── 📁 task
│   │       ├── 📁 user
│   │       └── 📁 video-thumb
│   └── 📁 src
│       ├── 📁 app
│       │   ├── 📁 (admin)
│       │   │   └── 📁 (others-pages)
│       │   │       ├── 📁 appointment
│       │   │       ├── 📁 blank
│       │   │       ├── 📁 booking
│       │   │       ├── 📁 part
│       │   │       ├── 📁 profile
│       │   │       ├── 📁 service-center
│       │   │       ├── 📁 task
│       │   │       ├── 📁 user
│       │   │       └── 📁 vehicle
│       │   └── 📁 (full-width-pages)
│       │       ├── 📁 (auth)
│       │       │   ├── 📁 signin
│       │       │   └── 📁 signup
│       │       └── 📁 (error-pages)
│       │           └── 📁 error-404
│       ├── 📁 components
│       │   ├── 📁 appointment
│       │   ├── 📁 auth
│       │   ├── 📁 booking
│       │   ├── 📁 calendar
│       │   ├── 📁 common
│       │   ├── 📁 ecommerce
│       │   ├── 📁 form
│       │   │   ├── 📁 group-input
│       │   │   ├── 📁 input
│       │   │   └── 📁 switch
│       │   ├── 📁 header
│       │   ├── 📁 part
│       │   ├── 📁 service-center
│       │   ├── 📁 task
│       │   ├── 📁 ui
│       │   │   ├── 📁 alert
│       │   │   ├── 📁 avatar
│       │   │   ├── 📁 badge
│       │   │   ├── 📁 button
│       │   │   ├── 📁 dropdown
│       │   │   ├── 📁 images
│       │   │   ├── 📁 modal
│       │   │   ├── 📁 table
│       │   │   ├── 📁 toast
│       │   │   └── 📁 video
│       │   ├── 📁 user
│       │   ├── 📁 user-profile
│       │   └── 📁 vehicle
│       ├── 📁 constants
│       ├── 📁 context
│       ├── 📁 hooks
│       ├── 📁 icons
│       ├── 📁 layout
│       ├── 📁 lib
│       ├── 📁 services
│       ├── 📁 types
│       └── 📁 utils
└── 📁 infra
    └── 📁 nifi_data
```

# Cài Đặt & Chạy Dự Án
Yêu cầu tiên quyết
 - Docker & Docker Compose
 - Node.js (v18 trở lên - nếu chạy local)

Cách 1: Chạy bằng Docker (Khuyên dùng)
Đây là cách nhanh nhất để dựng toàn bộ hệ thống (Database, Redis, RabbitMQ và các Services).
 1. Clone dự án:
    git clone https://github.com/ngoctram28050903-ctrl/ev-service-center-management-system.git
    cd ev-service-center
 2. Thiết lập biến môi trường: Tạo file .env trong từng thư mục service (hoặc sửa file docker-compose.yml trong thư mục infra).
 3. Khởi chạy hệ thống:
    cd infra
    docker-compose up --build -d
 4. Truy cập:
    - Frontend: http://localhost:3000
    - API Gateway: http://localhost:8080
    - RabbitMQ Dashboard: http://localhost:15672 (User/Pass: guest/guest)
Cách 2: Chạy Local (Dành cho Dev)
Nếu bạn muốn chạy từng service riêng lẻ để debug:
 1. Chạy các dịch vụ nền (MySQL, Redis, RabbitMQ) bằng Docker:
    cd infra
    docker-compose up mysql redis-cache rabbitmq -d
 2. Cài đặt và chạy từng service (Ví dụ: Auth Service):
    cd auth-service
    npm install
    npm run dev

# Danh Sách Cổng (Ports)
Service             │ Docker Port │ Local Port │ Mô tả
Frontend            │  3000       │    3000    │ Giao diện người dùng (Next.js)
API-Gateway         │  8080       │    8080    │ Cổng API chính (Client gọi vào đây)
Auth-Service        │  5001       │    5001    │ Dịch vụ xác thực
Booking-Service     │  5002       │    5002    │ Dịch vụ đặt lịch
Finance-Service     │  5003       │    5003    │ Dịch vụ tài chính
Inventory-Service   │  5004       │    5004    │ Dịch vụ kho
Notification-Service│  5005       │    5005    │ Dịch vụ thông báo
Vehicle-Service     │  5006       │    5006    │ Dịch vụ phương tiện
WorkOrder-Service   │  5007       │    5007    │ Dịch vụ phiếu sửa chữa
MySQL               │  3306       │    3307    │ Cơ sở dữ liệu chính
RabbitMQ UI         │  15672      │    15672   │ Quản lý hàng đợi tin nhắn

# API Documentation
Hệ thống sử dụng API Gateway làm điểm truy cập duy nhất.
 - Auth: POST /api/auth/login, POST /api/auth/register
 - Booking: GET /api/booking, POST /api/booking
 - Vehicle: GET /api/vehicle/user/:id
 ... (Xem chi tiết trong code của từng Service hoặc file Postman Collection kèm theo).

 Developed with ❤️ by Nhóm Ngọc Trâm