# React Antd Admin

Template trang quản trị được xây dựng bằng React, TypeScript, Vite và Ant Design. Dự án hỗ trợ giao diện responsive, phân quyền theo route, đa ngôn ngữ Việt/Anh, tùy chỉnh theme và mock API phục vụ phát triển frontend độc lập.

## Công nghệ chính

- React 19 và React Router 7
- TypeScript 6 và Vite 8
- Ant Design 6, Tailwind CSS 4
- Zustand và TanStack Query
- i18next (mặc định `vi-VN`, hỗ trợ `en-US`)
- Ky cho HTTP client
- Vitest và Testing Library
- `vite-plugin-fake-server` cho mock API

## Yêu cầu môi trường

- Node.js LTS
- Corepack
- Yarn 4.9.2 (được khai báo trong `package.json`)

Dự án dùng Yarn với `node_modules` linker. Không xóa file `.yarnrc.yml`, vì chế độ Yarn Plug'n'Play hiện không tương thích ổn định với Vite/Rolldown trong dự án này.

## Cài đặt

```bash
corepack enable
yarn install
```

## Chạy môi trường phát triển

```bash
yarn dev
```

Ứng dụng mặc định chạy tại [http://localhost:3333](http://localhost:3333). Nếu cổng `3333` đang được sử dụng, Vite sẽ tự chọn cổng tiếp theo.

Mock API được phục vụ dưới prefix `/api`. Các route mock nằm trong thư mục `fake/`; tên file phải theo định dạng `*.fake.ts`.

## Biến môi trường

Các giá trị mặc định nằm trong `.env`:

| Biến | Mô tả | Giá trị mặc định |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Prefix của backend API | `/api` |
| `VITE_BASE_HOME_PATH` | Trang chuyển đến sau đăng nhập | `/home` |
| `VITE_GLOB_APP_TITLE` | Tiêu đề ứng dụng | `React Antd Admin` |
| `VITE_APP_NAMESPACE` | Prefix cho dữ liệu lưu trong trình duyệt | `react-antd-admin` |
| `VITE_API_TIMEOUT` | Thời gian chờ API (ms) | `10000` |

Production sử dụng hash router, được cấu hình trong `.env.production`.

## Các lệnh thường dùng

| Lệnh | Chức năng |
| --- | --- |
| `yarn dev` | Khởi động dev server |
| `yarn build` | Build production vào thư mục `build/` |
| `yarn preview` | Xem thử bản production build |
| `yarn gen <feature>` | Sinh nhanh feature hoàn chỉnh theo tên và options |
| `yarn generate:crud` | Sinh nhanh module bảng/search/thêm/sửa/chi tiết/xóa |
| `yarn typecheck` | Kiểm tra TypeScript |
| `yarn lint` | Kiểm tra ESLint |
| `yarn lint:fix` | Tự động sửa lỗi ESLint có thể sửa |
| `yarn test` | Chạy test với Vitest |
| `yarn check:circular-deps` | Kiểm tra circular dependency |
| `yarn analyzer` | Phân tích kích thước bundle |

Tạo feature nhanh bằng `yarn gen product --title="Sản phẩm"`. Chi tiết schema CRUD và chế độ tùy biến field xem tại [`scripts/crud-generator/README.md`](scripts/crud-generator/README.md).

## Cấu trúc thư mục

```text
.
├── fake/              # Mock API cho môi trường phát triển
├── public/            # Tài nguyên tĩnh
├── src/
│   ├── api/           # Hàm gọi API và kiểu dữ liệu
│   ├── components/    # Component dùng chung
│   ├── layout/        # Khung giao diện quản trị
│   ├── locales/       # Bản dịch vi-VN và en-US
│   ├── pages/         # Các trang của ứng dụng
│   ├── router/        # Route và route guard
│   ├── store/         # Zustand stores
│   ├── styles/        # Global styles
│   └── utils/         # Tiện ích dùng chung
├── tests/             # Cấu hình và test hỗ trợ
└── vite.config.ts     # Cấu hình Vite và plugin
```

## Mock API

Các nhóm API mock hiện có:

- Đăng nhập, đăng xuất và refresh token
- Thông tin người dùng
- Dynamic routes và phân quyền
- Dữ liệu trang chủ
- Thông báo và trang cá nhân
- Quản lý menu, vai trò và dữ liệu hệ thống

Chi tiết cách khai báo route xem tại [`fake/README.md`](fake/README.md).

## Build và kiểm tra

Trước khi tạo pull request hoặc deploy, nên chạy:

```bash
yarn typecheck
yarn lint
yarn test --run
yarn build
```

## Xử lý sự cố

### `fake folder does not exist`

Đảm bảo thư mục `fake/` tồn tại và không bị bỏ qua khi sao chép hoặc clone dự án.

### Không resolve được `tslib` hoặc `@emotion/is-prop-valid`

Kiểm tra `.yarnrc.yml` có nội dung sau, sau đó cài lại dependency:

```yaml
nodeLinker: node-modules
```

```bash
yarn install
```

### Cảnh báo peer dependency của Yarn

Dùng lệnh dưới đây để xem nguyên nhân cụ thể:

```bash
yarn explain peer-requirements
```

Các cảnh báo peer dependency không nhất thiết làm dev server thất bại, nhưng nên được xử lý trước khi nâng cấp dependency.

## Giấy phép

Dự án sử dụng giấy phép [MIT](LICENSE). Nền tảng ban đầu được phát triển bởi [Condor Hero](https://github.com/condorheroblog/react-antd-admin).
