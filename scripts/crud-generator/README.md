# CRUD generator

CLI sinh một module quản trị hoàn chỉnh theo kiến trúc clean architecture của
dự án (domain / infrastructure / application / presentation — xem
`.claude/skills/clean-architecture/SKILL.md`):

- `BasicTable` có phân trang, search theo field và lưu cấu hình cột.
- Drawer thêm mới/cập nhật với validation.
- Drawer xem chi tiết và thao tác xóa có xác nhận.
- Entity + repository interface (domain), repository implementation dùng
  request client chung (infrastructure), use-case hooks/functions
  (application) — trang chỉ import từ hai layer domain và application.
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

CLI sinh 12 file, trải đều bốn layer:

```text
src/domain/<module>/<name>/<name>.entity.ts        # entity + Create/Update/Query types
src/domain/<module>/<name>/<name>.repository.ts    # repository interface (port)
src/domain/<module>/<name>/index.ts
src/infrastructure/<module>/<name>/<name>.repository.ts  # implementation dùng `request`
src/infrastructure/<module>/<name>/index.ts
src/application/<module>/<name>/list-<name>s.ts     # dùng làm `request` prop của BasicTable
src/application/<module>/<name>/get-<name>-detail.ts
src/application/<module>/<name>/use-<name>-mutations.ts  # useCreate/useUpdate/useDelete
src/application/<module>/<name>/index.ts
src/pages/<module>/<name>/constants.ts
src/pages/<module>/<name>/components/<name>-drawer.tsx
src/pages/<module>/<name>/index.tsx
```

Sau đó chỉ cần lazy import page mới vào module router phù hợp. CLI cố ý không tự sửa router vì cấu trúc menu, icon, role và permission là quyết định riêng của từng màn hình.

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
