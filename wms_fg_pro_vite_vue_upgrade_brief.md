# Technical Brief — Build lại hệ thống WMS FG PRO bằng Vite + Vue 3 + TypeScript

> Tài liệu này dùng làm yêu cầu đầu vào cho Antigravity / Gemini Pro 1.5 để build lại hệ thống WMS FG PRO mới từ nền `index.html` hiện tại.

---

## 1. Mục tiêu tổng quát

Build lại hệ thống **WMS FG PRO** theo hướng nhẹ hơn, mượt hơn, dễ bảo trì hơn và phù hợp chạy trên **PC, điện thoại, PDA**.

Hệ thống mới cần chuyển từ file HTML đơn sang kiến trúc chuẩn:

```txt
Vite + Vue 3 + TypeScript + TailwindCSS + PrimeVue + AG Grid Community + Apache ECharts + Supabase
```

Yêu cầu quan trọng:

- Giữ nguyên logic nghiệp vụ nhập kho, xuất kho, phụ kiện, KPI, bảng tồn kho, biểu đồ và trung tâm cảnh báo rủi ro nếu không có yêu cầu thay đổi rõ ràng.
- Nếu muốn bỏ bất kỳ logic hoặc thao tác nào không nằm trong yêu cầu, phải hỏi lại trước.
- Ưu tiên giải pháp **0 đồng**, tránh thư viện hoặc dịch vụ tốn phí.
- Quy mô dữ liệu hiện tại dưới khoảng 3.000 dòng, có thể tăng nhẹ trong tương lai.
- Deploy bằng **GitHub Pages**.
- Backend vẫn dùng **Supabase**, nhưng cần kiểm tra lại RLS, policy và cách bảo mật anon key.

---

## 2. Tech stack bắt buộc

### Frontend

```txt
Vite
Vue 3
TypeScript
TailwindCSS
PrimeVue
shadcn-vue nếu cần component phụ trợ
AG Grid Community
Apache ECharts
Lucide Icons
motion-v hoặc Rive cho animation nhẹ
SheetJS/xlsx cho export Excel
PapaParse hoặc parser CSV tự viết
```

### Backend

```txt
Supabase Database
Supabase Client JS
PostgreSQL Views
Row Level Security
Optional: Supabase RPC cho thao tác replace dữ liệu master_data an toàn hơn
```

### Không dùng / tránh dùng

```txt
AG Grid Enterprise
Highcharts paid/commercial mode
Template PrimeVue trả phí
Backend riêng tốn phí
Service role key trong frontend
```

---

## 3. Cấu trúc project đề xuất

```txt
wms-fg-pro/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.js
├─ .env.example
├─ src/
│  ├─ main.ts
│  ├─ App.vue
│  ├─ assets/
│  ├─ styles/
│  │  └─ index.css
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppHeader.vue
│  │  │  └─ AppFooter.vue
│  │  ├─ kpi/
│  │  │  └─ KpiCards.vue
│  │  ├─ charts/
│  │  │  ├─ ComparisonChart.vue
│  │  │  └─ RiskNestedPieChart.vue
│  │  ├─ inventory/
│  │  │  ├─ InventoryGrid.vue
│  │  │  ├─ InboundModal.vue
│  │  │  ├─ OutboundModal.vue
│  │  │  ├─ UploadMasterModal.vue
│  │  │  ├─ QuickOutboundModal.vue
│  │  │  └─ EditInventoryModal.vue
│  │  ├─ accessories/
│  │  │  ├─ AccessoryModal.vue
│  │  │  ├─ AccessoryInboundModal.vue
│  │  │  ├─ AccessoryEditModal.vue
│  │  │  └─ AccessoryOutboundModal.vue
│  │  └─ shared/
│  │     ├─ ConfirmDialog.vue
│  │     ├─ ToastHost.vue
│  │     └─ LoadingOverlay.vue
│  ├─ composables/
│  │  ├─ useInventory.ts
│  │  ├─ useAccessories.ts
│  │  ├─ useKpi.ts
│  │  ├─ useCharts.ts
│  │  └─ useCsvImport.ts
│  ├─ services/
│  │  ├─ supabase.ts
│  │  ├─ csvNormalizer.ts
│  │  ├─ excelExport.ts
│  │  └─ feature.ts
│  ├─ types/
│  │  ├─ inventory.ts
│  │  ├─ accessory.ts
│  │  └─ summary.ts
│  └─ utils/
│     ├─ format.ts
│     ├─ validators.ts
│     └─ constants.ts
└─ database/
   ├─ supabase.sql
   ├─ views.sql
   └─ policies.sql
```

---

## 4. Database logic — Supabase

## 4.1. Bảng `inventory`

Đây là bảng lưu dữ liệu tồn kho thực tế khi quét vào hệ thống.

### Mục tiêu

- Lưu dữ liệu thực tế nhập kho từ giao diện.
- Dữ liệu nhập bằng quét thủ công hoặc CSV.
- Mỗi dòng phải có một ID ảo để làm key tuyệt đối khi xuất kho.
- Cho phép tồn tại các dòng trùng `tag_id` và `bin` nếu nghiệp vụ cần ghi thêm.
- Khi xuất kho nếu trùng `tag_id` hoặc trùng cả `tag_id + bin`, hệ thống phải dùng `id` làm key để xác định chính xác dòng cần xuất.

### Schema đề xuất

```sql
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  bin text,
  stock_in_date timestamptz not null default now(),
  source text default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Ghi chú nghiệp vụ

- `id` chính là ID ảo/key tuyệt đối dùng cho các thuật toán xuất kho.
- `tag_id` dùng để lookup với `master_data.batch`.
- `bin` là vị trí thực tế.
- `stock_in_date` tự động lấy thời gian hiện tại khi nhập dữ liệu vào Supabase.
- Không được phụ thuộc vào `tag_id` làm khóa chính vì có thể bị trùng.

---

## 4.2. Nhập kho thủ công vào `inventory`

Giao diện giữ nút **NHẬP** như hệ thống hiện tại.

### Input

```txt
Tag ID
Bin
```

### Logic

1. Người dùng nhập hoặc quét `Tag ID`.
2. Người dùng nhập hoặc quét `Bin`.
3. Hệ thống kiểm tra `tag_id` đã tồn tại chưa.
4. Nếu chưa tồn tại thì insert mới.
5. Nếu đã tồn tại thì hiển thị confirm giống logic cũ:
   - Đổi vị trí: update dòng đã chọn hoặc dòng phù hợp.
   - Ghi thêm: insert thêm dòng mới, tạo `id` mới.
6. Sau khi insert/update thành công thì refresh lại dữ liệu.

---

## 4.3. Nhập kho nhanh bằng CSV vào `inventory`

Nằm chung trong thẻ/nút **NHẬP KHO**.

### Yêu cầu

File CSV có thể sai header, do đó hệ thống phải tự nhận diện và chuyển đổi về đúng field Supabase.

### Field cần map

```txt
tag_id
bin
```

### Header alias cần hỗ trợ

```txt
Tag ID, TAG ID, tagid, tag_id, batch, BATCH, Batch
Bin, BIN, bin, location, Location, vị trí, vi tri
```

### Logic CSV

1. Đọc file CSV.
2. Chuẩn hóa header:
   - trim khoảng trắng
   - lowercase
   - bỏ ký tự đặc biệt như `_`, `-`, `.`, `/`
   - hỗ trợ header tiếng Việt không dấu nếu có
3. Tự nhận diện cột `tag_id` và `bin`.
4. Validate dòng:
   - bỏ dòng không có `tag_id`
   - `bin` có thể rỗng nhưng nên cảnh báo
5. Insert theo batch để tránh lag.
6. Mỗi dòng insert phải có `stock_in_date = now()`.
7. Không được làm mất dữ liệu trùng nếu người dùng muốn ghi thêm.
8. Sau khi import xong, hiển thị số dòng thành công và số dòng lỗi.

---

## 4.4. Bảng `master_data`

Đây là bảng dữ liệu nguồn từ hệ thống.

### Mục tiêu

- Upload file nguồn hệ thống dạng CSV, ví dụ: `Stock Balance With Batch.csv`.
- Khi upload nguồn mới thì xóa toàn bộ dữ liệu cũ và cập nhật dữ liệu mới.
- File mẫu có thể có header khác nhau nhẹ, hệ thống cần tự nhận diện.

### Schema đề xuất

```sql
create table if not exists master_data (
  id uuid primary key default gen_random_uuid(),
  batch text not null,
  stock_code text,
  qty numeric default 0,
  warehouse text,
  create_date text,
  uploaded_at timestamptz not null default now()
);
```

### Field cần map từ CSV

```txt
batch       = BATCH / Batch / tag_id / Tag ID
stock_code  = Stock Code / LP.No / LP NO / LP.No(Stock Code)
qty         = Qty / QTY / Quantity / Số lượng
warehouse   = Warehouse / WH / Location / Kho
create_date = CREATEDATE / CreateDate / Create Date / createdate
```

### Logic upload master data

1. Người dùng chọn file CSV nguồn.
2. Hệ thống đọc và normalize header.
3. Hệ thống map về đúng field Supabase.
4. Nếu dữ liệu hợp lệ:
   - xóa toàn bộ dữ liệu cũ trong `master_data`
   - insert dữ liệu mới
5. Nếu có lỗi khi insert, cần báo rõ lỗi.
6. Khuyến nghị dùng RPC để thao tác xóa + insert chạy như transaction, tránh trường hợp xóa xong nhưng insert lỗi.

### RPC đề xuất nếu muốn an toàn hơn

```sql
create or replace function replace_master_data(payload jsonb)
returns void
language plpgsql
security definer
as $$
begin
  delete from master_data;

  insert into master_data (batch, stock_code, qty, warehouse, create_date)
  select
    item->>'batch',
    item->>'stock_code',
    nullif(item->>'qty', '')::numeric,
    item->>'warehouse',
    item->>'create_date'
  from jsonb_array_elements(payload) as item;
end;
$$;
```

---

## 4.5. View `vw_kho_thanh_pham`

Đây là bảng/view chính hiển thị tồn kho thành phẩm thực tế sau khi lookup giữa `inventory` và `master_data`.

### Mục tiêu

Lookup dữ liệu từ hệ thống thông qua:

```txt
inventory.tag_id = master_data.batch
```

`tag_id` và `batch` là giá trị tuyệt đối để tìm dữ liệu còn lại.

### Field nghiệp vụ cần có

Theo yêu cầu logic cũ:

```txt
colA = LP.No / Stock Code
colB = Feature
colC = Qty
colD = Warehouse
colE = CreateDate
colF = Stock_in_date
colG = Tag_ID
colH = Bin
colI = ID ảo
```

### Khuyến nghị sửa lỗi tiêu đề `col`

Không nên để UI hiển thị tiêu đề chung chung như `col`. View nên dùng alias rõ nghĩa, còn frontend có thể map sang label đẹp.

### View đề xuất dùng tên cột rõ nghĩa

```sql
create or replace view vw_kho_thanh_pham as
select
  coalesce(m.stock_code, 'No data') as lp_no,
  case
    when m.stock_code is not null and length(m.stock_code) >= 5
      then substring(m.stock_code from 2 for 4)
    else 'No data'
  end as feature,
  coalesce(m.qty, 0) as qty,
  coalesce(m.warehouse, 'No data') as warehouse,
  coalesce(m.create_date, 'No data') as create_date,
  i.stock_in_date as stock_in_date,
  i.tag_id as tag_id,
  i.bin as bin,
  i.id as inventory_id
from inventory i
left join master_data m
  on trim(lower(i.tag_id)) = trim(lower(m.batch));
```

### Nếu cần giữ tương thích với code cũ

Có thể tạo thêm alias kiểu `colA` đến `colI`, nhưng giao diện mới nên hiển thị bằng label rõ nghĩa.

```txt
LP.No
Feature
Qty
Warehouse
CreateDate
Stock In Date
Tag ID
Bin
ID
```

---

## 4.6. Cách tách Feature

Feature được tách giống công thức Excel:

```excel
=MID(text,2,4)
```

Trong PostgreSQL:

```sql
substring(stock_code from 2 for 4)
```

Ví dụ:

```txt
Stock Code = A1234XYZ
Feature    = 1234
```

---

## 4.7. View `vw_summary_analysis`

Đây là bảng/view phân tích để đưa dữ liệu lên KPI và chart.

### Mục tiêu

Phân tích số lượng actual, số lượng iScala, chênh lệch và phần trăm chênh lệch theo Feature.

### Field cần có

```txt
colA = feature
colB = actual
colC = iscala
colD = diff
colE = diff_percent
```

### Logic tính

#### Actual

Pivot nhanh tổng số lượng từ `vw_kho_thanh_pham` theo `feature`.

```txt
actual = sum(qty) theo feature từ vw_kho_thanh_pham
```

#### iScala

Pivot tổng số lượng từ `master_data` theo feature đã tách từ `stock_code`, nhưng chỉ lấy các dòng có warehouse là `60` hoặc `01`.

Điều kiện:

```txt
master_data.warehouse in ('60', '01')
```

Feature của `master_data` cũng được tách bằng:

```sql
substring(stock_code from 2 for 4)
```

#### Chênh lệch

```txt
diff = actual - iscala
```

#### Percent

```txt
diff_percent = diff / iscala * 100
```

Nếu `iscala = 0`, không được gây lỗi chia cho 0.

### View SQL đề xuất

```sql
create or replace view vw_summary_analysis as
with actual_by_feature as (
  select
    feature,
    sum(qty)::numeric as actual
  from vw_kho_thanh_pham
  where feature is not null
  group by feature
),
iscala_by_feature as (
  select
    substring(stock_code from 2 for 4) as feature,
    sum(qty)::numeric as iscala
  from master_data
  where warehouse in ('60', '01')
    and stock_code is not null
  group by substring(stock_code from 2 for 4)
)
select
  a.feature,
  coalesce(a.actual, 0) as actual,
  coalesce(i.iscala, 0) as iscala,
  coalesce(a.actual, 0) - coalesce(i.iscala, 0) as diff,
  case
    when coalesce(i.iscala, 0) = 0 then 0
    else round(((coalesce(a.actual, 0) - coalesce(i.iscala, 0)) / i.iscala) * 100, 2)
  end as diff_percent
from actual_by_feature a
left join iscala_by_feature i
  on a.feature = i.feature
order by a.feature;
```

### Gợi ý nâng cấp logic

Có thể cân nhắc `full outer join` thay vì `left join` nếu muốn phát hiện cả trường hợp iScala có feature nhưng thực tế không có tồn.

---

## 4.8. Bảng `hang_phu_kien`

Giữ nguyên logic database và thao tác giao diện hiện tại.

### Schema gợi ý nếu cần chuẩn hóa

```sql
create table if not exists hang_phu_kien (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  qty numeric default 0,
  bin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Yêu cầu mới

Ở modal **Nhập kho phụ kiện**, ô **Mã phụ kiện** cần thêm dropdown/list gợi ý những mã đã từng nhập trước đó.

Logic:

1. Khi mở modal nhập phụ kiện, load distinct `code` từ `hang_phu_kien`.
2. Input `Mã phụ kiện` dùng autocomplete/dropdown của PrimeVue.
3. Người dùng vẫn có thể nhập mã mới nếu chưa có.
4. Khi chọn mã cũ, vẫn nhập `qty` và `bin` như cũ.

---

## 5. Logic giao diện cần giữ nguyên

Các nút thao tác chính giữ nguyên logic:

```txt
NGUỒN
NHẬP
XUẤT
PHỤ KIỆN
REFRESH
XUẤT EXCEL
```

Các khu vực tính toán cũng giữ nguyên:

```txt
KPI cards
Trung tâm cảnh báo rủi ro
Bảng dữ liệu tồn kho thành phẩm
Chart đứng Actual vs iScala + Diff %
Chart pie phân tích rủi ro
Modal nhập kho
Modal xuất kho
Modal nhập nguồn CSV
Modal sửa nhanh
Modal phụ kiện
```

---

## 6. KPI logic

### KPI 1 — Tổng tồn thực tế

```txt
totalActual = sum(qty) từ vw_kho_thanh_pham
```

### KPI 2 — Chênh lệch hệ thống

```txt
diff = sum(actual) - sum(iscala)
diffPercent = diff / sum(iscala) * 100
```

### KPI 3 — TagID không khớp / No Data

Đếm các dòng trong `vw_kho_thanh_pham` bị lookup không ra dữ liệu nguồn.

Điều kiện gợi ý:

```txt
lp_no = 'No data'
hoặc warehouse = 'No data'
hoặc feature = 'No data'
```

### KPI 4 — Cần chuyển kho

Đếm các dòng có warehouse thuộc nhóm cần chuyển.

```txt
warehouse in ('50', '62')
```

### KPI 5 — Trùng TagID

Đếm số `tag_id` bị trùng trong `inventory` hoặc `vw_kho_thanh_pham`.

```txt
count unique tag_id having count(*) > 1
```

---

## 7. Logic tính số kiện

Yêu cầu giữ nguyên công thức tính số kiện theo từng feature.

```txt
Tổng số kiện của 1 feature = tổng số lượng actual / 2 / số lượng lớn nhất có trong feature đó
```

Công thức:

```txt
kien = sum(qty) / 2 / max(qty)
```

Điều kiện:

```txt
Nếu max(qty) = 0 thì số kiện = 0
```

Ví dụ:

```txt
Feature A có các dòng qty: 100, 100, 50
sum(qty) = 250
max(qty) = 100
kien = 250 / 2 / 100 = 1.25 kiện
```

---

## 8. Bảng tồn kho thành phẩm — AG Grid Community

Thay table HTML hiện tại bằng **AG Grid Community**.

### Lý do

Hiện tại hệ thống bị lag lớn:

- index load chậm
- điện thoại/PDA chạm bị delay
- cuộn chuột trong bảng bị giật
- render table nhiều DOM gây nặng

### Yêu cầu AG Grid

- Dùng row virtualization mặc định của AG Grid.
- Hỗ trợ quick filter.
- Hỗ trợ sort/filter theo cột.
- Hỗ trợ group theo `feature`.
- Hỗ trợ custom row group hiển thị số kiện.
- Hỗ trợ pin cột quan trọng nếu cần:
  - Tag ID
  - Bin
  - Feature
- Hỗ trợ action column:
  - Xuất nhanh
  - Sửa nhanh
- Không dùng AG Grid Enterprise.

### Column đề xuất

```txt
LP.No
Feature
Qty
Warehouse
CreateDate
Stock In Date
Tag ID
Bin
ID
Action
```

### Action xuất nhanh

Khi người dùng bấm xuất nhanh:

```txt
delete from inventory where id = inventory_id
```

Không xóa theo `tag_id` nếu có thể trùng.

---

## 9. Chart — Apache ECharts

Thay ApexCharts bằng **Apache ECharts**.

---

## 9.1. Chart đứng Actual vs iScala + Diff %

Giữ nguyên logic chart cũ:

```txt
Actual = column/bar
IsScala = column/bar
Diff % = line
```

### Nâng cấp cần có

- Animation mượt hơn.
- Tooltip rõ hơn.
- Legend bật/tắt series.
- Zoom in/zoom out.
- Kéo ngang mượt bằng `dataZoom`.
- Responsive trên mobile/PDA.
- Nếu nhiều feature thì không bị dính label.

### ECharts option gợi ý

```ts
const option = {
  tooltip: { trigger: 'axis' },
  legend: { top: 0 },
  grid: { left: 40, right: 40, bottom: 80, containLabel: true },
  dataZoom: [
    { type: 'inside', xAxisIndex: 0 },
    { type: 'slider', xAxisIndex: 0 }
  ],
  xAxis: { type: 'category', data: featureLabels },
  yAxis: [
    { type: 'value', name: 'PCS' },
    { type: 'value', name: 'Diff %' }
  ],
  series: [
    { name: 'Actual', type: 'bar', data: actualData, smooth: true },
    { name: 'iScala', type: 'bar', data: iscalaData, smooth: true },
    { name: 'Diff %', type: 'line', yAxisIndex: 1, data: diffPercentData, smooth: true }
  ]
};
```

---

## 9.2. Chart pie phân tích rủi ro

Chart pie tham khảo theme **Nested Pies** của Apache ECharts.

### Mục tiêu

Hiển thị phân tích rủi ro/chênh lệch theo feature.

### Logic dữ liệu

Nguồn từ `vw_summary_analysis`.

Có thể dùng:

```txt
feature
abs(diff)
diff_percent
```

### Gợi ý phân lớp nested pie

Vòng trong:

```txt
Nhóm rủi ro
- Lệch cao
- Lệch thấp
- Khớp
```

Vòng ngoài:

```txt
Feature cụ thể và giá trị abs(diff)
```

### Điều kiện rủi ro gợi ý

```txt
Khớp: diff = 0
Lệch thấp: abs(diff_percent) > 0 và < 5
Lệch cao: abs(diff_percent) >= 5
```

---

## 10. Trung tâm cảnh báo rủi ro

Giữ logic cũ, nhưng tối ưu hiển thị bằng component rõ ràng hơn.

### Nhóm 1 — Ưu tiên xử lý

```txt
Tag ID lỗi No Data
Feature tồn thấp dưới 2 kiện
```

### Nhóm 2 — Theo dõi gần

```txt
Tag ID bị trùng
Feature sắp hết từ 3 đến 5 kiện
```

### Logic tồn thấp

```txt
lowStock = feature có số kiện < 2
```

### Logic sắp hết

```txt
midStock = feature có số kiện >= 3 và <= 5
```

---

## 11. Xuất Excel

Nút **XUẤT EXCEL** cần lấy dữ liệu đúng với dữ liệu thực tế trong Supabase, không chỉ lấy dữ liệu đang render trên table.

### Yêu cầu

- Export dữ liệu từ Supabase/view hiện tại.
- Không để mất định dạng Tag ID, Bin, Stock Code.
- Toàn bộ cell trong Excel nên là text.
- Có thể export nhiều sheet:
  - `Ton_Kho_Thanh_Pham`
  - `Summary_Analysis`
  - `Hang_Phu_Kien`

### Logic export

1. Fetch full data từ:
   - `vw_kho_thanh_pham`
   - `vw_summary_analysis`
   - `hang_phu_kien`
2. Convert toàn bộ value sang string trước khi tạo worksheet.
3. Set cell type là string nếu dùng SheetJS.
4. Xuất file `.xlsx`.

### Gợi ý tên file

```txt
WMS_FG_PRO_Report_YYYYMMDD_HHmm.xlsx
```

---

## 12. UI/UX — PrimeVue

Dùng PrimeVue để thay các phần tự viết thủ công:

```txt
Button
Dialog
ConfirmDialog
Toast
InputText
Dropdown
AutoComplete
FileUpload hoặc custom file input
Card
Tag
Badge
Tooltip
```

### Yêu cầu style

- Giữ phong cách sáng, hiện đại, glassmorphism nhẹ.
- Tối ưu mobile/PDA.
- Button đủ lớn để chạm bằng tay trên PDA.
- Không animation quá nhiều gây lag.
- Loading overlay gọn nhẹ.
- Toast/confirm rõ ràng.

---

## 13. Icons và Animation

### Icons

Giữ nguyên **Lucide Icons**.

### Animation

Có thể dùng:

```txt
motion-v
hoặc Rive nếu có asset phù hợp
```

Yêu cầu:

- Animation nhẹ.
- Không làm chậm cuộn bảng.
- Không animate từng row trong AG Grid.
- Chỉ animate header, KPI, loading hoặc modal.

---

## 14. Vấn đề hiện tại cần khắc phục

### 14.1. Lag giao diện

Hiện trạng:

```txt
index lag lớn
mobile/PDA chạm bị delay
cuộn bảng bị giật
```

Cách xử lý:

```txt
Dùng AG Grid virtualization
Không render toàn bộ table bằng v-for thường
Debounce ô tìm kiếm
Không gọi lucide.createIcons liên tục sau mỗi thao tác nhỏ
Lazy load modal phụ kiện/chart nếu cần
Giảm backdrop-filter blur quá nặng trên mobile
Tránh box-shadow quá nhiều ở hàng table
```

---

### 14.2. View `vw_kho_thanh_pham` bị thừa cột và tiêu đề chỉ hiện `col`

Yêu cầu sửa:

```txt
View phải có alias rõ nghĩa
Frontend phải map header đẹp
Không hiển thị raw col nếu không cần
Xóa hoặc không select cột thừa
```

---

### 14.3. Phụ kiện thiếu dropdown gợi ý mã cũ

Yêu cầu sửa:

```txt
Modal nhập phụ kiện > Mã phụ kiện dùng AutoComplete
Nguồn gợi ý lấy distinct code từ hang_phu_kien
Cho phép nhập mã mới
```

---

## 15. Bảo mật Supabase

### Nguyên tắc bắt buộc

- Không đưa service role key vào frontend.
- Chỉ dùng `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
- Phải bật RLS cho bảng thật.
- Nếu app nội bộ nhưng public trên GitHub Pages, anon key vẫn nhìn thấy được trong browser, nên policy phải an toàn.

### File `.env.example`

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### RLS gợi ý

Nếu chưa có đăng nhập, rủi ro là ai có URL + anon key có thể thao tác DB tùy policy. Khuyến nghị:

1. Tốt nhất: thêm Supabase Auth bằng email/password hoặc magic link.
2. Chỉ user authenticated mới được insert/update/delete.
3. Nếu cần public report, chỉ cho select view, không cho ghi bảng thật.
4. Với thao tác upload/xóa master data, nên giới hạn cho admin user.

### Policy mẫu tham khảo

```sql
alter table inventory enable row level security;
alter table master_data enable row level security;
alter table hang_phu_kien enable row level security;

create policy "authenticated_select_inventory"
on inventory for select
to authenticated
using (true);

create policy "authenticated_insert_inventory"
on inventory for insert
to authenticated
with check (true);

create policy "authenticated_update_inventory"
on inventory for update
to authenticated
using (true)
with check (true);

create policy "authenticated_delete_inventory"
on inventory for delete
to authenticated
using (true);
```

Nếu hệ thống chưa làm login, cần hỏi lại chủ dự án trước khi chọn policy public.

---

## 16. Deploy GitHub Pages

### Vite config

Nếu deploy vào repo dạng:

```txt
https://username.github.io/repo-name/
```

thì `vite.config.ts` cần có:

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/repo-name/'
});
```

Nếu deploy domain root hoặc custom domain thì base có thể là:

```ts
base: '/'
```

### Package scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

### GitHub Actions gợi ý

```yaml
name: Deploy Vite App to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 17. Gợi ý nâng cấp logic miễn phí

### 17.1. Chuẩn hóa header CSV bằng alias map

Tạo file:

```txt
src/services/csvNormalizer.ts
```

Mục tiêu:

```txt
Một parser dùng chung cho inventory CSV và master_data CSV.
Không phụ thuộc header chính xác tuyệt đối.
```

---

### 17.2. Thêm màn hình preview CSV trước khi upload

Trước khi ghi vào Supabase, hiển thị:

```txt
Tổng dòng đọc được
Số dòng hợp lệ
Số dòng lỗi
5-10 dòng preview đầu tiên
Cảnh báo cột nào không nhận diện được
```

---

### 17.3. Dùng RPC cho replace master data

Vì thao tác upload master data sẽ xóa toàn bộ dữ liệu cũ, nên nên dùng RPC để tránh lỗi nửa chừng.

Nếu không dùng RPC:

```txt
Delete xong mà insert lỗi = mất dữ liệu nguồn
```

---

### 17.4. Thêm bảng log thao tác nếu cần

Nên có thêm bảng log miễn phí trong Supabase:

```sql
create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  tag_id text,
  bin text,
  inventory_id uuid,
  payload jsonb,
  created_at timestamptz not null default now(),
  created_by uuid
);
```

Log các hành động:

```txt
IN_MANUAL
IN_CSV
OUT_QUICK
OUT_MANUAL
EDIT
UPLOAD_MASTER
ACCESSORY_IN
ACCESSORY_OUT
ACCESSORY_EDIT
```

Nếu chưa muốn thêm log, phải hỏi lại trước.

---

### 17.5. Tối ưu mobile/PDA

```txt
Button cao tối thiểu 44px
Input scan tự focus sau mỗi lần nhập
Enter để submit nhanh
Không dùng modal quá rộng trên mobile
AG Grid dùng rowHeight lớn hơn trên PDA
Giảm blur/background fixed trên mobile
```

---

### 17.6. Tối ưu Supabase query

```txt
Chỉ select cột cần dùng
Thêm index cho inventory.tag_id
Thêm index cho master_data.batch
Thêm index cho hang_phu_kien.code
```

SQL:

```sql
create index if not exists idx_inventory_tag_id on inventory (tag_id);
create index if not exists idx_inventory_bin on inventory (bin);
create index if not exists idx_master_data_batch on master_data (batch);
create index if not exists idx_master_data_warehouse on master_data (warehouse);
create index if not exists idx_hang_phu_kien_code on hang_phu_kien (code);
```

---

## 18. Acceptance checklist

Hệ thống hoàn thành khi đạt các điều kiện sau:

### Database

- [ ] Có bảng `inventory` đúng logic.
- [ ] Có bảng `master_data` đúng logic.
- [ ] Có bảng `hang_phu_kien` giữ được nghiệp vụ cũ.
- [ ] Có view `vw_kho_thanh_pham` lookup đúng `inventory.tag_id = master_data.batch`.
- [ ] Có view `vw_summary_analysis` tính đúng actual, iscala, diff, diff_percent.
- [ ] Không còn lỗi view hiển thị tiêu đề `col` không rõ nghĩa.
- [ ] Có index cho các cột lookup chính.

### Frontend

- [ ] Project chạy bằng Vite + Vue 3 + TypeScript.
- [ ] UI dùng PrimeVue.
- [ ] Table tồn kho dùng AG Grid Community.
- [ ] Chart dùng Apache ECharts.
- [ ] Icon vẫn dùng Lucide.
- [ ] Nhập kho thủ công hoạt động.
- [ ] Nhập kho CSV tự nhận diện header.
- [ ] Upload master CSV xóa dữ liệu cũ và cập nhật dữ liệu mới.
- [ ] Xuất kho dùng `inventory_id`, không xóa nhầm khi trùng Tag ID.
- [ ] Phụ kiện giữ logic cũ.
- [ ] Mã phụ kiện có dropdown/autocomplete gợi ý mã cũ.
- [ ] KPI tính đúng.
- [ ] Số kiện tính đúng công thức `sum(qty) / 2 / max(qty)`.
- [ ] Chart bar có dataZoom kéo ngang mượt.
- [ ] Chart pie dùng nested pie hoặc layout tương đương.
- [ ] Export Excel lấy dữ liệu thực tế từ Supabase và giữ toàn bộ cell dạng text.

### Performance

- [ ] Load nhanh hơn bản index cũ.
- [ ] Cuộn bảng không giật trên PC.
- [ ] Dùng được trên điện thoại/PDA.
- [ ] Không render toàn bộ table bằng DOM thường.
- [ ] Search/filter có debounce.

### Security

- [ ] Không có service role key trong frontend.
- [ ] Dùng env `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
- [ ] RLS được bật cho bảng thật.
- [ ] Policy không cho public ghi/xóa nếu chưa có xác thực.
- [ ] Nếu cần public report, chỉ public select view/read-only.

### Deployment

- [ ] Build thành công bằng `npm run build`.
- [ ] Deploy được lên GitHub Pages.
- [ ] Cấu hình đúng `base` trong `vite.config.ts`.
- [ ] Không lỗi path assets sau khi deploy.

---

## 19. Quy tắc làm việc cho AI coding agent

1. Không tự ý bỏ logic cũ nếu chưa được yêu cầu.
2. Nếu phát hiện logic mâu thuẫn, phải ghi chú và hỏi lại trước khi thay đổi lớn.
3. Ưu tiên giải pháp miễn phí.
4. Không dùng thư viện enterprise/trả phí.
5. Không đưa secret key vào frontend.
6. Ưu tiên code rõ ràng, chia module, dễ sửa.
7. Không dồn toàn bộ code vào một file lớn.
8. Phải tạo đầy đủ file cần thiết để chạy project bằng Vite.
9. Phải có file SQL riêng cho Supabase.
10. Phải có README hướng dẫn setup, env, build và deploy GitHub Pages.

---

## 20. Output mong muốn từ Antigravity / Gemini Pro 1.5

Cần tạo ra đầy đủ:

```txt
1. Source code Vite + Vue 3 + TypeScript hoàn chỉnh
2. Component UI theo PrimeVue
3. AG Grid cho bảng tồn kho
4. Apache ECharts cho chart
5. Supabase service layer
6. CSV normalizer
7. Excel export module
8. SQL tạo bảng/view/policy/index
9. README hướng dẫn chạy local
10. README hoặc section hướng dẫn deploy GitHub Pages
```

---

## 21. Ghi chú cuối

Hệ thống này là report/tool nội bộ, nên ưu tiên:

```txt
ổn định
nhẹ
mượt trên PDA
dễ sửa
không tốn phí
không mất dữ liệu
không xuất kho nhầm khi trùng Tag ID
bảo mật Supabase ở mức hợp lý cho app nội bộ
```
