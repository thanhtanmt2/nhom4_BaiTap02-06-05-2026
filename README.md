# Website Quản Lý Nhân Sự IT - ATRIA HRM (Nhóm 4)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="Sequelize" />
  <img src="https://img.shields.io/badge/React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75C2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

---

## 📖 Giới thiệu dự án
**ATRIA HRM** là hệ thống quản lý nhân sự chuyên nghiệp dành cho các doanh nghiệp công nghệ (IT), được thiết kế tối ưu với mô hình Fullstack (ReactJS + NodeJS/Express + MySQL). Hệ thống giải quyết các bài toán vận hành nhân sự thực tế, từ tuyển dụng sàng lọc hồ sơ bằng AI, quản lý hồ sơ, chấm công nhận diện khuôn mặt bằng AI, quản lý tiến độ công việc/KPI, cho đến tính lương tự động, xuất hóa đơn lương PDF và quản lý thuế/bảo hiểm theo luật hiện hành.

---

## 👥 Thông tin thành viên nhóm (Nhóm 4)

| STT | Họ và Tên | MSSV |
| :---: | :--- | :---: |
| 1 | Lê Hồ Chí Bảo | 23110179 |
| 2 | Đào Minh Nhựt | 23110282 |
| 3 | Lê Thanh Tân | 23110316 |
| 4 | Nguyễn Bảo Lợi | 23110256 |

---

## 📂 Cấu trúc cây thư mục

Dưới đây là sơ đồ cây thư mục chi tiết của dự án giúp giáo viên dễ dàng theo dõi mã nguồn và xác định **vị trí của Database**:

```text
nhom4_BaiTap02-06-05-2026/
├── backend/                        # MÃ NGUỒN BACKEND (Node.js & Express)
│   ├── config/                     # Cấu hình hệ thống
│   │   ├── database.js             # [DATABASE] Khởi tạo kết nối Sequelize ORM kết nối tới MySQL
│   │   └── initDb.js               # [DATABASE] Tạo CSDL (nhom4_baitap) & đồng bộ cấu trúc bảng tự động
│   ├── src/
│   │   ├── controllers/            # Bộ điều khiển xử lý logic yêu cầu HTTP (API)
│   │   ├── database/               # [DATABASE] Thư mục chứa tài nguyên khởi tạo database
│   │   │   └── seed.sql            # -> FILE SQL CHỨA CẤU TRÚC BẢNG & DỮ LIỆU MẪU BAN ĐẦU
│   │   ├── entities/               # [DATABASE] Định nghĩa các Model bảng (Sequelize Entities)
│   │   │   ├── index.js            # -> Thiết lập mối quan hệ (Association - One-to-Many, Many-to-Many)
│   │   │   ├── User.entity.js      # -> Bảng tài khoản người dùng
│   │   │   ├── Profile.entity.js   # -> Bảng thông tin hồ sơ chi tiết nhân viên
│   │   │   ├── Contract.entity.js  # -> Bảng hợp đồng lao động
│   │   │   ├── Task.entity.js      # -> Bảng công việc và KPI của nhân sự
│   │   │   └── ...                 # -> Các thực thể nghiệp vụ khác (LeaveRequest, Payroll, Attendance...)
│   │   ├── middlewares/            # Các bộ lọc trung gian (Auth, RateLimiter, Upload...)
│   │   ├── routes/                 # Khai báo các đường dẫn API
│   │   ├── services/               # Xử lý các logic nghiệp vụ phức tạp
│   │   ├── utils/                  # Thư viện tiện ích (Gửi mail, mã hóa, helper...)
│   │   └── validations/            # Xác thực dữ liệu đầu vào (Joi validation)
│   ├── .env                        # [DATABASE] Nơi khai báo thông số kết nối Database (Host, User, Password, Port)
│   ├── server.js                   # Điểm khởi chạy Backend Server
│   └── package.json                # Danh sách thư viện và scripts của Backend
│
├── frontend/                       # MÃ NGUỒN FRONTEND (React.js & Vite)
│   ├── src/
│   │   ├── assets/                 # Các tài nguyên tĩnh (Hình ảnh, logo, model AI...)
│   │   ├── components/             # Các thành phần giao diện dùng chung (Button, Table, Layout...)
│   │   ├── hooks/                  # Các Custom Hooks xử lý trạng thái React
│   │   ├── pages/                  # Các màn hình theo từng vai trò phân quyền
│   │   │   ├── admin/              # Màn hình cho Admin (Quản lý tài khoản, cấu hình tham số, nhật ký hệ thống)
│   │   │   ├── hr/                 # Màn hình cho HR (Quản lý hồ sơ, hợp đồng, tuyển dụng, chốt công)
│   │   │   ├── manager/            # Màn hình cho Manager (Duyệt phép/OT, giao việc/KPI, đánh giá năng lực)
│   │   │   ├── accountant/         # Màn hình cho Kế toán (Tính lương, điều chỉnh lương, xuất báo cáo ngân hàng)
│   │   │   ├── user/               # Màn hình cho Nhân viên (Xem lịch sử công, gửi đơn xin phép/OT, xem phiếu lương)
│   │   │   └── public/             # Màn hình chung (Đăng nhập, Đăng ký, Quên mật khẩu, Tra cứu tuyển dụng)
│   │   ├── redux/                  # State management toàn cục (Redux Toolkit Store & Slices)
│   │   ├── routes/                 # Định nghĩa phân tuyến màn hình Frontend
│   │   ├── services/               # Gọi API kết nối với Backend
│   │   └── utils/                  # Hàm định dạng tiền tệ, ngày tháng...
│   ├── tailwind.config.js          # Cấu hình giao diện Tailwind CSS v4
│   └── package.json                # Danh sách thư viện và scripts của Frontend
│
└── ATRIA_HRM_TestCases_Nhom11_Final (1).xlsx  # File kịch bản kiểm thử (Test Cases) của dự án
```

> [!IMPORTANT]
> **Vị trí Database:**
> 1. **Dữ liệu thô và cấu trúc SQL khởi tạo**: nằm tại file `backend/src/database/seed.sql`.
> 2. **ORM ánh xạ dữ liệu**: Toàn bộ các bảng dữ liệu được khai báo dưới dạng thực thể trong thư mục `backend/src/entities/` và kết nối thông qua file cấu hình `backend/src/config/database.js`.
> 3. **Tham số cấu hình**: Được thiết lập tại file ẩn `backend/.env`.

---

## 🚀 Công nghệ sử dụng

### 1. Frontend
* **Framework chính**: React.js (Vite) thế hệ mới mang lại hiệu năng cao.
* **Styling**: Tailwind CSS v4 hỗ trợ xây dựng giao diện hiện đại, responsive dễ dàng.
* **State Management**: Redux Toolkit hỗ trợ quản lý luồng trạng thái đồng bộ giữa các trang.
* **Routing**: React Router v7.
* **AI & Camera Integration**: Sử dụng thư viện `face-api.js` chạy trực tiếp ở client để nhận diện gương mặt chấm công qua Camera.
* **Khác**: Axios (gửi API), Lucide React (Icons hệ thống), React To Print, swiper, xlsx.

### 2. Backend
* **Platform**: Node.js & Express.js.
* **Database**: MySQL - Hệ quản trị cơ sở dữ liệu quan hệ ổn định và mạnh mẽ.
* **ORM**: Sequelize ORM giúp tương tác với cơ sở dữ liệu qua các đối tượng Javascript một cách an toàn, chống SQL Injection.
* **Xác thực & Bảo mật**: JSON Web Token (JWT), bcrypt (băm mật khẩu), express-rate-limit (giới hạn tần suất gửi yêu cầu để chống tấn công Brute-force).
* **Gửi mail tự động**: Nodemailer (Gửi mail tài khoản mới, gửi phiếu lương điện tử cho nhân viên).
* **Tích hợp AI**: Google Generative AI (Gemini API) phục vụ chatbot HR hỗ trợ nhân viên giải đáp thắc mắc nội bộ và hỗ trợ HR lọc CV tự động.

---

## ⚙️ Hướng dẫn cài đặt và chạy dự án (Local)

### Yêu cầu hệ thống:
* **Node.js**: Phiên bản 18.x trở lên.
* **MySQL**: Phiên bản 8.0 trở lên.
* **Gemini API Key**: Để chạy các tính năng AI (nếu có).

### Các bước cài đặt:

#### 1. Clone dự án và cấu hình database
Mở Terminal và clone dự án về máy:
```bash
git clone <đường-dẫn-repo>
cd nhom4_BaiTap02-06-05-2026
```

#### 2. Cài đặt và cấu hình Backend
Di chuyển vào thư mục backend và cài đặt các thư viện:
```bash
cd backend
npm install
```

Tạo file `.env` (dựa theo nội dung của `.env.example` hoặc cấu hình như dưới đây):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nhom4_baitap
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
JWT_SECRET=super_secret_jwt_key_12345
GEMINI_API_KEY=your_gemini_api_key
```

**Khởi tạo Database**:
* Hệ thống có cơ chế tự động kết nối và khởi tạo database trống mang tên `nhom4_baitap` cùng cấu trúc các bảng qua Sequelize ORM khi server chạy lần đầu tiên.
* Để nạp dữ liệu mẫu ban đầu (seed data), hãy sử dụng file SQL đi kèm:
  ```bash
  mysql -u root -p nhom4_baitap < src/database/seed.sql
  ```

**Khởi chạy Backend server**:
```bash
npm run dev
```
*(Server sẽ chạy tại địa chỉ http://localhost:3000)*

#### 3. Cài đặt và cấu hình Frontend
Mở một cửa sổ Terminal mới tại thư mục gốc của dự án:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend chạy tại địa chỉ http://localhost:5173)*

---

## 🛠️ Tính năng chi tiết của hệ thống theo vai trò

Hệ thống được thiết kế phân quyền rõ rệt thành 5 vai trò nghiệp vụ khác nhau:

### 1. Vai trò: Admin (Quản trị hệ thống)
* **Xác thực tài khoản**: Đăng nhập, đăng xuất, quên mật khẩu (gửi OTP qua Email), đổi mật khẩu và cập nhật thông tin cá nhân.
* **Cấp tài khoản nhân viên mới**: Khi ứng viên trúng tuyển, HR gửi yêu cầu cấp tài khoản sang Admin. Admin xác nhận tạo tài khoản và hệ thống sẽ tự động gửi mail mật khẩu kích hoạt cho nhân viên.
* **Khóa/Mở khóa tài khoản**: Áp dụng khi nhân viên nghỉ việc, nghỉ thai sản dài hạn hoặc xảy ra sự cố lộ bảo mật tài khoản.
* **Phân quyền vai trò (Role-based Authorization)**: Gán lại vai trò khi nhân viên thăng chức, chuyển phòng ban. Hệ thống sẽ tự động thu hồi phiên đăng nhập hiện tại bắt buộc đăng nhập lại để nhận quyền mới.
* **Quản lý danh mục phòng ban**: Thêm mới và điều chỉnh tên phòng ban phục vụ cho các bộ phận khác.
* **Cấu hình tham số tài chính**: Thiết lập tỷ lệ đóng bảo hiểm xã hội, thuế TNCN, mức lương cơ sở, và hạn mức giảm trừ gia cảnh làm căn cứ tính lương cho kế toán.
* **Nhật ký hệ thống (Audit Logs)**: Ghi lại lịch sử các thao tác nghiệp vụ quan trọng nhằm phục vụ công tác giám sát hệ thống bảo mật.

### 2. Vai trò: HR (Chuyên viên Nhân sự)
* **Quản lý hồ sơ nhân viên**: Tạo và cập nhật thông tin hồ sơ cho nhân sự mới và nhân sự hiện tại khi có quyết định điều chuyển/thăng chức.
* **Quản lý hợp đồng lao động**: Thiết lập, ký mới và gia hạn các loại hợp đồng (thử việc, chính thức). Cảnh báo tự động khi hợp đồng sắp hết hạn để gửi thông báo cho quản lý đánh giá hiệu quả giữ chân nhân sự.
* **Tuyển dụng tích hợp công nghệ AI**:
  * Đăng tin tuyển dụng và tiếp nhận hồ sơ trực tuyến từ ứng viên.
  * **AI sàng lọc CV tự động**: Tích hợp mô hình AI đọc thông tin tệp PDF/Docx của ứng viên, phân tích độ tương thích kỹ năng với mô tả công việc và đưa ra điểm số đánh giá.
  * Lên lịch phỏng vấn và đồng bộ hóa tự động lịch làm việc lên **Google Calendar** nhằm nhắc lịch phỏng vấn.
  * Gửi mail tự động thông báo kết quả phỏng vấn dù ứng viên đỗ hay trượt.
* **Tổng hợp công tháng**: Tiến hành gom dữ liệu công vào cuối tháng, gửi đối soát để nhân viên phản hồi khiếu nại trước khi chính thức chốt công khóa dữ liệu chuyển sang kế toán.

### 3. Vai trò: Manager (Quản lý bộ phận)
* **Giám sát nhân sự**: Xem danh sách nhân viên trực thuộc phòng ban do mình quản lý.
* **Giao việc và Đánh giá KPI**: Phân chia nhiệm vụ kèm deadline và trọng số điểm. Nhân viên cập nhật tiến độ công việc và quản lý thực hiện nghiệm thu, tự động tính toán điểm KPI cuối tháng.
* **Phê duyệt nghỉ phép và Overtime (OT)**: Xem thông tin đơn xin nghỉ phép/OT của nhân viên, đối chiếu lịch làm việc của các thành viên khác để tránh thiếu hụt nhân sự trước khi bấm duyệt hoặc từ chối. Dữ liệu nghỉ phép/OT sau khi duyệt sẽ tự động tích hợp trực tiếp vào bảng công.
* **Đánh giá năng lực cuối kỳ**: Chấm điểm đánh giá xếp loại nhân sự dựa trên tỷ lệ hoàn thành KPI và kỷ luật lao động trong tháng.

### 4. Vai trò: Accountant (Kế toán tài chính)
* **Tính lương tự động**: Hệ thống gom dữ liệu từ: Hợp đồng lao động (Lương cơ bản), Bảng công chốt từ HR (Số ngày công), Quản lý duyệt (Số giờ OT, thưởng hiệu suất KPI), và Tham số cấu hình bảo hiểm/thuế từ Admin để tự động xuất bảng lương.
* **Điều chỉnh thu nhập**: Thêm thủ công các khoản thưởng nóng dự án, phụ cấp ngoài luồng hoặc các khoản phạt, khấu trừ tạm ứng kèm lý do chi tiết trên phiếu lương.
* **Thuế & Bảo hiểm**: Áp dụng công thức tính thuế thu nhập cá nhân lũy tiến từng phần và trích đóng bảo hiểm bắt buộc theo đúng luật định.
* **Xuất file ngân hàng**: Kết xuất dữ liệu thanh toán lương hàng loạt ra định dạng file ngân hàng (`.csv`, `.xlsx`) để tải lên hệ thống ngân hàng doanh nghiệp (Bulk Payment).
* **Gửi phiếu lương điện tử**: Sau khi xác nhận thanh toán lương, hệ thống khóa dữ liệu lương và gửi link phiếu lương bảo mật qua email của từng nhân viên.

### 5. Vai trò: Employee (Nhân viên / Ứng viên)
* **Gửi CV ứng tuyển**: Xem thông tin tuyển dụng, nhập thông tin liên lạc và tải CV ứng tuyển trực tiếp trên hệ thống.
* **Cập nhật hồ sơ cá nhân**: Được phép chỉnh sửa ảnh đại diện, thông tin liên hệ. Các thay đổi quan trọng như thông tin ngân hàng nhận lương, số người phụ thuộc giảm trừ gia cảnh, CMND/CCCD phải được gửi yêu cầu và chờ HR phê duyệt mới cập nhật.
* **Chấm công nhận diện khuôn mặt (AI Face Recognition)**: Chụp ảnh gương mặt trực tiếp qua camera tại trang chấm công để hệ thống phân tích đối khớp khuôn mặt lưu lịch sử ra vào.
* **Xem lịch sử công cá nhân**: Theo dõi chấm công trực quan qua **giao diện Lịch (Calendar View)** hoặc **giao diện danh sách (List View)** kèm thời gian đi trễ/về sớm. Cho phép gửi khiếu nại công ngay trên giao diện.
* **Tạo đơn xin nghỉ phép / OT**: Tạo đơn nghỉ phép năm, nghỉ ốm, OT kèm giải trình lý do và tệp đính kèm (giấy khám bệnh, ảnh chứng minh...). Hệ thống tự động kiểm tra quỹ phép còn lại và trùng lịch trước khi gửi đơn.
* **Xem và tải phiếu lương**: Tra cứu chi tiết phiếu lương hàng tháng và tải xuống dưới dạng tệp **PDF** chất lượng cao phục vụ các mục đích cá nhân.

---

## 🤖 Các tính năng thông minh nổi bật ứng dụng AI

1. **AI Face Recognition (Nhận diện khuôn mặt)**:
   * Tích hợp thư viện `face-api.js` trực tiếp trên trình duyệt giúp trích xuất vector khuôn mặt từ camera để đối chiếu với ảnh hồ sơ đăng ký, đảm bảo tính trung thực và ngăn chặn gian lận chấm công hộ.
2. **AI Resume Parser & Screener (Sàng lọc CV tự động)**:
   * Kết nối với mô hình **Google Generative AI (Gemini)** ở backend để trích xuất text từ CV tải lên (PDF, DOCX).
   * AI tự động phân tích kỹ năng, chấm điểm độ phù hợp với tin tuyển dụng (Job Description) giúp HR tiết kiệm đến 80% thời gian sàng lọc bước đầu.
3. **AI HR Assistant (Trợ lý ảo nhân sự)**:
   * Chatbot thông minh tích hợp ngay trên giao diện nhân viên, giúp giải đáp nhanh các câu hỏi liên quan đến nội quy công ty, cách tính phép nghỉ chế độ, chính sách phúc lợi bằng ngôn ngữ tự nhiên nhờ sức mạnh AI.

---

*Dự án thuộc bản quyền phát triển của Nhóm 4. Mọi hành vi sao chép và tái sử dụng cần có sự đồng ý của các thành viên trong nhóm.*
