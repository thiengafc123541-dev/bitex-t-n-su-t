# Tần suất viếng thăm điểm bán (Web App độc lập)

Ứng dụng web một trang (HTML thuần, không cần build) để nhân viên ghi nhận viếng thăm trên điện thoại, xem báo cáo tiến độ **24 lượt/trung tâm/tháng** và chấm điểm ảnh trưng bày bằng AI. Triển khai trên **GitHub + Vercel**.

## Cấu trúc thư mục
```
avt-visit-app/
├── index.html              # Toàn bộ giao diện và logic (ghi nhận, báo cáo, chấm ảnh, lịch sử, cài đặt)
├── api/
│   └── score.js            # Vercel Serverless Function: máy chủ chấm điểm ảnh bằng Claude (giữ khóa API bí mật)
├── apps-script/
│   └── Code.gs             # Mã dán vào Google Sheet để cả đội dùng chung dữ liệu
├── manifest.webmanifest    # Cho phép "Thêm vào màn hình chính"
├── icon.svg
├── vercel.json             # Cấu hình Vercel (thời gian chạy hàm, header bảo mật)
├── package.json
├── .env.example            # Mẫu biến môi trường
├── .gitignore
└── README.md
```

## Cái gì chạy ở đâu
| Chức năng | Chạy ở | Cần cấu hình |
|---|---|---|
| Ghi nhận viếng thăm, báo cáo, biểu đồ, lịch sử, xuất CSV, sao lưu | Trình duyệt | Không |
| Lưu dữ liệu trên máy | localStorage của trình duyệt | Không |
| Dùng chung dữ liệu nhiều người | Google Apps Script + Google Sheet | **Có** (bước 3) |
| Chấm điểm ảnh bằng Claude AI | `api/score.js` trên Vercel | **Có: `ANTHROPIC_API_KEY`** |

### Phần dùng Claude AI cần cấu hình API riêng
Chỉ có **một** chức năng: nút **Chấm điểm bằng AI** ở tab "Chấm ảnh". Có 2 cách cấp khóa, ưu tiên cách 1:
1. **Khóa trên máy chủ (khuyến nghị):** đặt biến môi trường `ANTHROPIC_API_KEY` trên Vercel. Nhân viên không phải nhập gì, khóa không lộ ra trình duyệt. Nên đặt thêm `APP_ACCESS_CODE` để người lạ có link không dùng được khóa của bạn.
2. **Khóa riêng từng thiết bị:** nhập khóa ở tab Cài đặt. Khóa lưu trong trình duyệt của máy đó và gọi thẳng API Anthropic. Chỉ nên dùng cho thử nghiệm.

Lấy khóa tại console.anthropic.com và nên đặt hạn mức chi tiêu.

## Biến môi trường (Vercel)
| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `ANTHROPIC_API_KEY` | Có (nếu dùng chấm điểm AI) | Khóa API Anthropic |
| `APP_ACCESS_CODE` | Khuyến nghị | Mật khẩu của đội. Nhân viên nhập cùng mật khẩu ở ô "Mật khẩu đồng bộ" trong Cài đặt. Nên đặt trùng `MAT_KHAU` trong Code.gs |
| `ANTHROPIC_MODEL` | Không | Mặc định `claude-sonnet-4-6` |

## Hướng dẫn triển khai

### Bước 1. Đưa mã lên GitHub
```bash
cd avt-visit-app
git init
git add .
git commit -m "AVT visit app"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/avt-visit-app.git
git push -u origin main
```
Tạo repo trống `avt-visit-app` trên github.com trước và nên để chế độ Private.

### Bước 2. Triển khai trên Vercel
1. Vào vercel.com > **Add New > Project** > chọn repo `avt-visit-app` > **Import**.
2. Framework Preset: **Other**. Để trống Build Command và Output Directory.
3. Mở **Environment Variables**, thêm `ANTHROPIC_API_KEY` và `APP_ACCESS_CODE` (xem bảng trên).
4. Bấm **Deploy**. Nhận link dạng `https://avt-visit-app.vercel.app`.
5. Sau này mỗi lần `git push`, Vercel tự triển khai lại. Đổi biến môi trường thì phải **Redeploy** mới có hiệu lực.

### Bước 3. Dùng chung dữ liệu qua Google Sheet
1. Mở Google Sheet > Tiện ích mở rộng > **Apps Script**, xóa code cũ, dán nội dung `apps-script/Code.gs`.
2. Đổi `MAT_KHAU` thành mật khẩu của đội (trùng `APP_ACCESS_CODE`).
3. **Triển khai > Tùy chọn triển khai mới > Ứng dụng web**: Thực thi dưới tên "Tôi", Người có quyền truy cập "Bất kỳ ai". Cấp quyền khi được hỏi.
4. Sao chép URL ứng dụng web.
5. Mỗi nhân viên mở app > tab **Cài đặt** > dán URL và mật khẩu > **Lưu cài đặt**. Chỉ làm một lần trên mỗi thiết bị.

Sheet sẽ tự có tab `LUOT_VIEN_THAM` (đọc được) và `AVT_DATA` (dữ liệu hệ thống, không sửa tay).

### Bước 4. Kiểm tra sau khi triển khai
- Mở link, ghi nhận 1 lượt thử, tải lại trang: lượt vẫn còn.
- Cài đặt có URL và mật khẩu: huy hiệu đầu trang chuyển "Đã đồng bộ"; dòng mới xuất hiện trong tab `LUOT_VIEN_THAM`.
- Chấm điểm 1 ảnh: ra điểm 4 tiêu chí và hướng khắc phục.

## Chạy thử trên máy
Mở `index.html` bằng trình duyệt là dùng được (ghi nhận, báo cáo, đồng bộ Sheet). Chấm điểm AI qua máy chủ cần Vercel (hoặc `npx vercel dev` sau khi tạo file `.env` từ `.env.example`), hoặc nhập khóa riêng trong Cài đặt.

## Điều đã thay đổi khi đưa ra khỏi Claude
| Trong môi trường Claude | Bản độc lập | Khác biệt cần biết |
|---|---|---|
| Cơ sở dữ liệu dùng chung của Claude (cập nhật tức thì cho mọi người) | Lưu trên máy + đồng bộ Google Sheet qua Apps Script | Cập nhật theo chu kỳ **30 giây** hoặc khi mở lại app, không tức thì |
| Phân quyền theo tài khoản Claude (Contributor/Viewer/Admin) | Một mật khẩu chung cho cả đội | **Không thể chuyển trực tiếp.** Không còn phân quyền từng người. Ai có link và mật khẩu đều ghi được; việc đổi nhân viên phụ trách mặc định cũng không còn giới hạn cho quản trị viên |
| Gọi Claude qua cầu nối có sẵn của Claude | `api/score.js` (khóa trên máy chủ) hoặc khóa riêng từng thiết bị | Phải có khóa API Anthropic riêng và chịu chi phí gọi API |
| Tải CSV qua hộp thoại của Claude | Tải tệp bằng trình duyệt | Không có hộp thoại xác nhận |
| Cần tài khoản Claude để mở | Mở bằng link công khai | Link công khai, nên bảo vệ bằng mật khẩu |

Giao diện, quy tắc tính lượt (Có ghé thăm + Có ảnh Zalo + điểm FHS TP.HCM), 4 trung tâm, danh sách điểm bán, tìm kiếm điểm bán, biểu đồ và cách thao tác được giữ nguyên.

## Lưu ý bảo mật
- Link Apps Script để "Bất kỳ ai" truy cập, bảo vệ bằng `MAT_KHAU`. Chọn mật khẩu riêng, không đăng link công khai.
- Không đưa khóa API vào mã nguồn hay đẩy lên GitHub. Khóa chỉ nằm trong biến môi trường Vercel.
- Dữ liệu viếng thăm không được mã hóa; đừng ghi thông tin nhạy cảm vào ô ghi chú.
