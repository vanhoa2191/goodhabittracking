import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'KidHabit Hero',
    short_name: 'KidHabit',
    description: 'Cùng gia đình xây thói quen tích cực mỗi ngày.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#4f46e5',
    lang: 'vi',
    categories: ['education', 'lifestyle', 'family'],
    shortcuts: [
      { name: 'Duyệt việc', short_name: 'Duyệt việc', description: 'Việc và quà đang chờ ba mẹ', url: '/?section=approvals', icons: [{ src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Hướng dẫn sử dụng', short_name: 'Hướng dẫn', description: 'Cách dùng từng tính năng', url: '/docs', icons: [{ src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
