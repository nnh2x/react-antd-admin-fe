# CRUD generator

CLI sinh một module quản trị hoàn chỉnh theo convention hiện tại của dự án:

- `BasicTable` có phân trang, search theo field và lưu cấu hình cột.
- Drawer thêm mới/cập nhật với validation.
- Drawer xem chi tiết và thao tác xóa có xác nhận.
- TypeScript types và REST API dùng request client chung.
- Kiểm tra file tồn tại trước khi ghi.

## Chạy nhanh

Chế độ tương tác:

```bash
yarn generate:crud
```

Sinh từ schema để dùng lại trong team hoặc CI:

```bash
yarn generate:crud --config scripts/crud-generator/example.json
```

Kiểm tra trước mà không tạo file:

```bash
yarn generate:crud --config scripts/crud-generator/example.json --dry-run
```

CLI sinh năm file trong `src/api/<module>/<name>` và `src/pages/<module>/<name>`. Sau đó chỉ cần lazy import page mới vào module router phù hợp. CLI cố ý không tự sửa router vì cấu trúc menu, icon, role và permission là quyết định riêng của từng màn hình.

## Schema

Các thuộc tính cấp resource:

| Thuộc tính | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `name` | Có | Tên resource dạng kebab-case, ví dụ `purchase-order` |
| `module` | Có | Nhóm thư mục dạng kebab-case, ví dụ `procurement` |
| `title` | Có | Tên hiển thị của màn hình |
| `endpoint` | Có | REST endpoint tương đối với API prefix |
| `idField` | Không | Khóa chính, mặc định `id` |
| `idType` | Không | `string` hoặc `number`, mặc định `number` |
| `idLabel` | Không | Nhãn khóa chính ở drawer chi tiết |
| `fields` | Có | Danh sách field, không khai báo lại khóa chính |

Mỗi field hỗ trợ:

| Thuộc tính | Giá trị |
| --- | --- |
| `name`, `label` | Tên dữ liệu và nhãn hiển thị |
| `type` | `text`, `textarea`, `number`, `select`, `boolean`, `date`, `datetime` |
| `required` | Field bắt buộc và rule validation tương ứng |
| `table` | Hiển thị trong bảng |
| `search` | Hiển thị trong search form của bảng |
| `form` | Hiển thị trong form thêm/sửa |
| `detail` | Hiển thị trong drawer chi tiết |
| `initialValue` | Giá trị mặc định khi thêm mới |
| `options` | Danh sách `{ label, value }` (value là string/number), bắt buộc với `select` |

API được sinh theo REST convention:

```text
GET    <endpoint>       danh sách
GET    <endpoint>/:id   chi tiết
POST   <endpoint>       thêm mới
PUT    <endpoint>/:id   cập nhật
DELETE <endpoint>/:id   xóa
```

Backend cần trả về `ApiResponse`/`ApiListResponse` như định nghĩa trong `src/types/index.d.ts`. Nếu backend dùng URL hoặc response shape khác, chỉnh file API vừa sinh; UI không cần thay đổi.
