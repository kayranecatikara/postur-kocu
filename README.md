# 🧘 Postür Analiz Antrenörü

Intel RealSense D435i derinlik kamerası ve MediaPipe kullanarak gerçek zamanlı postür analizi yapan modern web uygulaması.

![Postür Antrenörü](https://img.shields.io/badge/React-18-blue?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10+-yellow?logo=python)

## ✨ Özellikler

- 🎯 **Gerçek zamanlı postür analizi** - MediaPipe Pose ile omuz ve göğüs noktalarının tespiti
- 📷 **Intel RealSense D435i** desteği - Derinlik sensörü ile hassas ölçüm
- ⏱️ **Pomodoro tarzı çalışma seansları** - 15, 25, 45, 60 dakika veya özel süre
- ⚠️ **Akıllı uyarı sistemi** - 7 saniye kötü postürde kalınca sesli uyarı
- 📊 **Detaylı istatistikler** - Pasta grafikleri ve zaman çizelgesi
- 🎨 **Modern UI/UX** - Pastel renkler, glassmorphism efektleri
- 🔄 **WebSocket ile gerçek zamanlı iletişim**

## 🛠️ Teknik Altyapı

### Backend
- Python 3.10+
- FastAPI + WebSocket
- pyrealsense2 (Intel RealSense SDK)
- MediaPipe Pose
- OpenCV

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts (grafikler)
- Canvas Confetti

## 📦 Kurulum

### 1. Backend Kurulumu

```bash
# Backend klasörüne git
cd backend

# Virtual environment oluştur (önerilir)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
.\venv\Scripts\activate  # Windows

# Bağımlılıkları yükle
pip install -r requirements.txt
```

### 2. Frontend Kurulumu

```bash
# Frontend klasörüne git
cd frontend

# Bağımlılıkları yükle
npm install
```

## 🚀 Çalıştırma

### 1. Backend'i Başlat

```bash
cd backend
python main.py
# veya
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend şu adreste çalışacak: http://localhost:8000

### 2. Frontend'i Başlat

```bash
cd frontend
npm run dev
```

Frontend şu adreste çalışacak: http://localhost:3000

## 📡 API Endpoints

### REST API

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | API durumu |
| POST | `/api/session/start` | Oturum başlat |
| POST | `/api/session/stop` | Oturumu sonlandır |
| GET | `/api/session/stats` | Anlık istatistikler |
| GET | `/api/session/history` | Oturum geçmişi |
| POST | `/api/settings/threshold` | Postür eşiğini ayarla |
| GET | `/api/camera/status` | Kamera durumu |

### WebSocket

| Endpoint | Açıklama |
|----------|----------|
| `/ws/posture` | Gerçek zamanlı postür verisi stream'i |

## 🎯 Postür Analizi Mantığı

```
1. MediaPipe ile sol omuz ve sağ omuz noktaları tespit edilir
2. Göğüs noktası = İki omuzun ortasının 50 piksel altı
3. RealSense'den bu 3 noktanın Z (derinlik) değerleri alınır (3x3 pencerede medyan)
4. Fark = Ortalama omuz derinliği - Göğüs derinliği
5. Fark > 40mm ise İYİ POSTÜR, değilse KÖTÜ POSTÜR
6. 7 saniye boyunca kötü postürde kalınırsa uyarı verilir
```

## 📸 Ekran Görüntüleri

### Ana Sayfa
- Gülen postür ikonu
- "Tespite Başla" butonu
- İstatistik kartları

### Süre Seçim Modalı
- Hazır süre seçenekleri (15, 25, 45, 60 dk)
- Özel süre girişi

### Analiz Ekranı
- Circular progress bar (kalan süre)
- Kamera görüntüsü (işaretli noktalarla)
- Anlık durum kartı
- Canlı istatistikler
- Uyarı overlay'i

### Sonuç Ekranı
- Konfeti animasyonu
- Postür skoru (0-100)
- Pasta grafiği
- Zaman çizelgesi
- Detaylı istatistikler

## ⚙️ Konfigürasyon

### Postür Eşik Değeri
Varsayılan: 40mm

Değiştirmek için:
```bash
curl -X POST http://localhost:8000/api/settings/threshold \
  -H "Content-Type: application/json" \
  -d '{"threshold": 50}'
```

### Uyarı Eşiği
Varsayılan: 7 saniye

Oturum başlatırken değiştirilebilir:
```json
{
  "duration_minutes": 25,
  "warning_threshold": 10
}
```

## 🔧 Gereksinimler

- Intel RealSense D435i kamera
- Python 3.10+
- Node.js 18+
- Modern web tarayıcı (Chrome, Firefox, Edge)

## 📝 Notlar

- RealSense kamera bağlı değilse uygun hata mesajı gösterilir
- WebSocket bağlantısı kopması durumunda otomatik reconnect yapılır
- Oturum geçmişi LocalStorage'da tutulur
- Sesli uyarı için Web Audio API kullanılır (800Hz beep)

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

💪 Sağlıklı duruş için yanındayım! 🧘
