export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  gender: 'nam' | 'nữ';
  birthDate: string;
  address: string;
  memberSince: string;
  totalSpent: number;
  visitCount: number;
  notes: string;
  tags: string[];
}

export interface Service {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number; // minutes
  image: string;
  active: boolean;
}

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  originalPrice: number;
  stock: number;
  minStock: number;
  discount: number;
  image: string;
  active: boolean;
}

export interface InvoiceItem {
  type: 'service' | 'product';
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ';
  status: 'completed' | 'pending' | 'cancelled';
  notes: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  date: string;
  note: string;
  ref: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export const siteConfig = {
  name: "Sakura Spa & Beauty",
  shortName: "Sakura Spa",
  slogan: "Nâng tầm vẻ đẹp, thư thái tâm hồn",
  phone: "0988 888 888",
  email: "info@sakuraspa.vn",
  address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  taxId: "0312345678",
  nav: [
    { label: "Tổng quan", href: "/", icon: "LayoutDashboard" },
    { label: "Khách hàng", href: "/customers", icon: "Users" },
    { label: "Dịch vụ", href: "/services", icon: "Sparkles" },
    { label: "Sản phẩm", href: "/products", icon: "Package" },
    { label: "Hóa đơn", href: "/invoices", icon: "FileText" },
    { label: "Kho hàng", href: "/inventory", icon: "Warehouse" },
    { label: "Báo cáo", href: "/reports", icon: "BarChart3" },
  ],
};

export const services: Service[] = [
  { id: "sv1", code: "SV001", name: "Massage Thư Giãn", category: "Massage", description: "Massage toàn thân với tinh dầu thiên nhiên, giúp giảm căng thẳng và mệt mỏi", price: 350000, duration: 60, image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80", active: true },
  { id: "sv2", code: "SV002", name: "Massage Đá Nóng", category: "Massage", description: "Massage với đá núi lửa kết hợp tinh dầu, thư giãn sâu các cơ", price: 500000, duration: 90, image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80", active: true },
  { id: "sv3", code: "SV003", name: "Chăm Sóc Da Cơ Bản", category: "Chăm sóc da", description: "Làm sạch sâu, tẩy tế bào chết, đắp mặt nạ dưỡng ẩm", price: 400000, duration: 60, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80", active: true },
  { id: "sv4", code: "SV004", name: "Trị Mụn Chuyên Sâu", category: "Chăm sóc da", description: "Quy trình trị mụn 5 bước với sản phẩm đặc trị", price: 650000, duration: 90, image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80", active: true },
  { id: "sv5", code: "SV005", name: "Gội Đầu Dưỡng Sinh", category: "Gội đầu", description: "Gội đầu thảo dược kết hợp massage bấm huyệt vùng đầu - cổ - vai", price: 250000, duration: 45, image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&q=80", active: true },
  { id: "sv6", code: "SV006", name: "Tắm Trắng Collagen", category: "Tắm trắng", description: "Tắm trắng công nghệ Nhật Bản với collagen và tinh chất sữa", price: 800000, duration: 120, image: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&q=80", active: true },
  { id: "sv7", code: "SV007", name: "Trị Liệu Đá Nóng Cao Cấp", category: "Trị liệu", description: "Liệu pháp đá nóng basalt kết hợp tinh dầu thơm, giải phóng mọi căng thẳng", price: 700000, duration: 90, image: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400&q=80", active: true },
  { id: "sv8", code: "SV008", name: "Massage Chân Thảo Dược", category: "Massage", description: "Massage chân với thảo dược, bấm huyệt giúp tuần hoàn máu", price: 200000, duration: 30, image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80", active: true },
];

export const products: Product[] = [
  { id: "pr1", code: "SP001", barcode: "8935000100001", name: "Kem Dưỡng Ẩm Sakura", category: "Skincare", description: "Kem dưỡng ẩm cao cấp với chiết xuất hoa anh đào", costPrice: 150000, sellingPrice: 350000, originalPrice: 450000, stock: 50, minStock: 10, discount: 22, image: "https://images.unsplash.com/photo-1570194065650-d99fb4ee8e39?w=400&q=80", active: true },
  { id: "pr2", code: "SP002", barcode: "8935000100002", name: "Serum Vitamin C", category: "Skincare", description: "Serum vitamin C 15% làm sáng da, mờ thâm", costPrice: 200000, sellingPrice: 450000, originalPrice: 550000, stock: 30, minStock: 5, discount: 18, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80", active: true },
  { id: "pr3", code: "SP003", barcode: "8935000100003", name: "Sữa Rửa Mặt Sakura", category: "Skincare", description: "Sữa rửa mặt dịu nhẹ cho da nhạy cảm", costPrice: 80000, sellingPrice: 180000, originalPrice: 220000, stock: 80, minStock: 15, discount: 18, image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80", active: true },
  { id: "pr4", code: "SP004", barcode: "8935000100004", name: "Tinh Dầu Massage Lavender", category: "Tinh dầu", description: "Tinh dầu lavender nguyên chất 100%", costPrice: 120000, sellingPrice: 280000, originalPrice: 320000, stock: 25, minStock: 5, discount: 12, image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80", active: true },
  { id: "pr5", code: "SP005", barcode: "8935000100005", name: "Mặt Nạ Đất Sét Sakura", category: "Skincare", description: "Mặt nạ đất sét Nhật Bản, làm sạch sâu lỗ chân lông", costPrice: 90000, sellingPrice: 200000, originalPrice: 250000, stock: 40, minStock: 8, discount: 20, image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80", active: true },
  { id: "pr6", code: "SP006", barcode: "8935000100006", name: "Kem Chống Nắng Sakura SPF50", category: "Skincare", description: "Kem chống nắng vật lý lai hóa học, kiềm dầu", costPrice: 130000, sellingPrice: 320000, originalPrice: 380000, stock: 35, minStock: 10, discount: 15, image: "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=400&q=80", active: true },
  { id: "pr7", code: "SP007", barcode: "8935000100007", name: "Nước Hoa Hồng Sakura", category: "Skincare", description: "Toner cân bằng pH, se khít lỗ chân lông", costPrice: 70000, sellingPrice: 160000, originalPrice: 200000, stock: 60, minStock: 12, discount: 20, image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80", active: true },
  { id: "pr8", code: "SP008", barcode: "8935000100008", name: "Set Quà Tặng Sakura", category: "Quà tặng", description: "Set quà gồm kem dưỡng, serum và mặt nạ", costPrice: 350000, sellingPrice: 750000, originalPrice: 900000, stock: 15, minStock: 3, discount: 16, image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80", active: true },
];

export const customers: Customer[] = [
  { id: "c1", code: "KH001", name: "Nguyễn Thị Hương", phone: "0901 234 567", email: "huong.nguyen@email.com", gender: "nữ", birthDate: "1990-05-15", address: "12 Lê Lợi, Q.1, TP.HCM", memberSince: "2024-01-10", totalSpent: 5800000, visitCount: 12, notes: "Khách VIP, thích massage đá nóng", tags: ["VIP", "Thân thiết"] },
  { id: "c2", code: "KH002", name: "Trần Thị Minh Anh", phone: "0902 345 678", email: "minhanh@email.com", gender: "nữ", birthDate: "1995-08-22", address: "45 Nguyễn Văn Cừ, Q.5, TP.HCM", memberSince: "2024-03-15", totalSpent: 3200000, visitCount: 8, notes: "Dị ứng tinh dầu oải hương", tags: ["Thường xuyên"] },
  { id: "c3", code: "KH003", name: "Lê Thị Phương", phone: "0903 456 789", email: "phuong.le@email.com", gender: "nữ", birthDate: "1988-11-30", address: "78 Hai Bà Trưng, Q.3, TP.HCM", memberSince: "2024-02-20", totalSpent: 7500000, visitCount: 15, notes: "Khách hàng thân thiết nhất", tags: ["VIP", "Vàng"] },
  { id: "c4", code: "KH004", name: "Phạm Thị Thu Hà", phone: "0904 567 890", email: "thuha@email.com", gender: "nữ", birthDate: "1992-03-10", address: "23 Bùi Thị Xuân, Q.1, TP.HCM", memberSince: "2024-04-05", totalSpent: 1800000, visitCount: 5, notes: "Thích trị mụn", tags: [] },
  { id: "c5", code: "KH005", name: "Võ Thị Kim Ngân", phone: "0905 678 901", email: "kimngan@email.com", gender: "nữ", birthDate: "2000-07-18", address: "56 Cách Mạng Tháng 8, Q.10, TP.HCM", memberSince: "2024-05-20", totalSpent: 4200000, visitCount: 9, notes: "Sinh viên, thích gội đầu dưỡng sinh", tags: ["Trẻ"] },
  { id: "c6", code: "KH006", name: "Đặng Thị Mỹ Linh", phone: "0906 789 012", email: "mylinh@email.com", gender: "nữ", birthDate: "1985-12-25", address: "90 Nguyễn Đình Chiểu, Q.3, TP.HCM", memberSince: "2024-01-05", totalSpent: 9200000, visitCount: 20, notes: "Khách hàng lâu năm, thường xuyên mua SP", tags: ["VIP", "Vàng", "Thân thiết"] },
];

export const invoices: Invoice[] = [
  {
    id: "inv1", invoiceNo: "HD-202407-001", customerId: "c1", customerName: "Nguyễn Thị Hương", customerPhone: "0901 234 567",
    date: "2024-07-20T09:30:00", items: [
      { type: "service", id: "sv2", name: "Massage Đá Nóng", quantity: 1, unitPrice: 500000, discount: 0 },
      { type: "product", id: "pr1", name: "Kem Dưỡng Ẩm Sakura", quantity: 1, unitPrice: 350000, discount: 10 },
    ], subtotal: 850000, discount: 35000, total: 815000, paymentMethod: "Tiền mặt", status: "completed", notes: ""
  },
  {
    id: "inv2", invoiceNo: "HD-202407-002", customerId: "c3", customerName: "Lê Thị Phương", customerPhone: "0903 456 789",
    date: "2024-07-21T14:00:00", items: [
      { type: "service", id: "sv6", name: "Tắm Trắng Collagen", quantity: 1, unitPrice: 800000, discount: 0 },
      { type: "product", id: "pr2", name: "Serum Vitamin C", quantity: 2, unitPrice: 450000, discount: 15 },
    ], subtotal: 1700000, discount: 135000, total: 1565000, paymentMethod: "Chuyển khoản", status: "completed", notes: "Khách đặt trước"
  },
  {
    id: "inv3", invoiceNo: "HD-202407-003", customerId: "c6", customerName: "Đặng Thị Mỹ Linh", customerPhone: "0906 789 012",
    date: "2024-07-22T10:15:00", items: [
      { type: "service", id: "sv1", name: "Massage Thư Giãn", quantity: 1, unitPrice: 350000, discount: 0 },
      { type: "service", id: "sv5", name: "Gội Đầu Dưỡng Sinh", quantity: 1, unitPrice: 250000, discount: 0 },
      { type: "product", id: "pr8", name: "Set Quà Tặng Sakura", quantity: 1, unitPrice: 750000, discount: 5 },
    ], subtotal: 1350000, discount: 37500, total: 1312500, paymentMethod: "Thẻ", status: "completed", notes: ""
  },
  {
    id: "inv4", invoiceNo: "HD-202407-004", customerId: "c2", customerName: "Trần Thị Minh Anh", customerPhone: "0902 345 678",
    date: "2024-07-23T16:00:00", items: [
      { type: "service", id: "sv3", name: "Chăm Sóc Da Cơ Bản", quantity: 1, unitPrice: 400000, discount: 0 },
    ], subtotal: 400000, discount: 0, total: 400000, paymentMethod: "Tiền mặt", status: "completed", notes: ""
  },
  {
    id: "inv5", invoiceNo: "HD-202407-005", customerId: "c5", customerName: "Võ Thị Kim Ngân", customerPhone: "0905 678 901",
    date: "2024-07-24T08:30:00", items: [
      { type: "service", id: "sv5", name: "Gội Đầu Dưỡng Sinh", quantity: 1, unitPrice: 250000, discount: 0 },
      { type: "product", id: "pr3", name: "Sữa Rửa Mặt Sakura", quantity: 1, unitPrice: 180000, discount: 0 },
    ], subtotal: 430000, discount: 0, total: 430000, paymentMethod: "Tiền mặt", status: "pending", notes: "Chờ thanh toán"
  },
  {
    id: "inv6", invoiceNo: "HD-202407-006", customerId: "c4", customerName: "Phạm Thị Thu Hà", customerPhone: "0904 567 890",
    date: "2024-07-19T11:00:00", items: [
      { type: "service", id: "sv4", name: "Trị Mụn Chuyên Sâu", quantity: 1, unitPrice: 650000, discount: 0 },
      { type: "product", id: "pr5", name: "Mặt Nạ Đất Sét Sakura", quantity: 1, unitPrice: 200000, discount: 10 },
    ], subtotal: 850000, discount: 20000, total: 830000, paymentMethod: "Chuyển khoản", status: "completed", notes: ""
  },
];

export const inventoryTransactions: InventoryTransaction[] = [
  { id: "it1", productId: "pr1", productName: "Kem Dưỡng Ẩm Sakura", productCode: "SP001", type: "inbound", quantity: 50, date: "2024-07-01", note: "Nhập hàng tháng 7", ref: "NK-202407-001" },
  { id: "it2", productId: "pr2", productName: "Serum Vitamin C", productCode: "SP002", type: "inbound", quantity: 30, date: "2024-07-01", note: "Nhập hàng tháng 7", ref: "NK-202407-001" },
  { id: "it3", productId: "pr1", productName: "Kem Dưỡng Ẩm Sakura", productCode: "SP001", type: "outbound", quantity: 5, date: "2024-07-20", note: "Bán cho KH Nguyễn Thị Hương", ref: "HD-202407-001" },
  { id: "it4", productId: "pr2", productName: "Serum Vitamin C", productCode: "SP002", type: "outbound", quantity: 2, date: "2024-07-21", note: "Bán cho KH Lê Thị Phương", ref: "HD-202407-002" },
  { id: "it5", productId: "pr8", productName: "Set Quà Tặng Sakura", productCode: "SP008", type: "outbound", quantity: 1, date: "2024-07-22", note: "Bán cho KH Đặng Thị Mỹ Linh", ref: "HD-202407-003" },
  { id: "it6", productId: "pr3", productName: "Sữa Rửa Mặt Sakura", productCode: "SP003", type: "inbound", quantity: 30, date: "2024-07-15", note: "Nhập bổ sung", ref: "NK-202407-002" },
];

export const promotions: Promotion[] = [
  { id: "promo1", code: "SUMMER24", name: "Khuyến mãi mùa hè", discountPercent: 15, startDate: "2024-07-01", endDate: "2024-08-31", active: true },
  { id: "promo2", code: "VIP10", name: "Giảm 10% cho khách VIP", discountPercent: 10, startDate: "2024-06-01", endDate: "2024-12-31", active: true },
  { id: "promo3", code: "NEWSKIN", name: "Giảm 20% sản phẩm skincare", discountPercent: 20, startDate: "2024-07-15", endDate: "2024-08-15", active: true },
];