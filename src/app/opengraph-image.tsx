import { ImageResponse } from 'next/og';

export const alt = 'KidHabit Hero - Cùng con xây thói quen tốt';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, color: '#172033', background: 'linear-gradient(135deg, #fff7ed 0%, #eef2ff 45%, #ede9fe 100%)', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 92, height: 92, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4f46e5', fontSize: 52 }}>⭐</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 44, fontWeight: 800 }}>KidHabit Hero</span><span style={{ marginTop: 6, color: '#4f46e5', fontSize: 24, fontWeight: 700 }}>Đồng hành cùng gia đình mỗi ngày</span></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 930 }}><span style={{ fontSize: 70, lineHeight: 1.05, fontWeight: 900 }}>Cùng con xây thói quen tốt, từng bước nhỏ</span><span style={{ marginTop: 28, color: '#475569', fontSize: 30, lineHeight: 1.35 }}>Gợi ý phù hợp độ tuổi · Lộ trình rõ ràng · Ghi nhận tiến bộ</span></div>
      <div style={{ display: 'flex', gap: 16 }}><span style={{ borderRadius: 999, padding: '14px 24px', background: '#ffffff', fontSize: 22, fontWeight: 700 }}>7 ngày trải nghiệm</span><span style={{ borderRadius: 999, padding: '14px 24px', background: '#ffffff', fontSize: 22, fontWeight: 700 }}>Không tự động trừ tiền</span></div>
    </div>,
    size,
  );
}
