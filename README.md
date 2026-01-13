# 🧘 Postür Analiz Antrenörü (Postür Koçu)

Intel RealSense D435i derinlik kamerası ve MediaPipe kullanarak gerçek zamanlı postür analizi yapan modern web uygulaması.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
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

---

## 🚀 Hızlı Kurulum (Adım Adım)

### Gereksinimler
- Intel RealSense D435i kamera
- Python 3.10 veya üzeri
- Node.js 18 veya üzeri
- Git

---

### 📥 1. Projeyi İndir

```bash
# Projeyi bilgisayarına klonla
git clone https://github.com/kayranecatikara/postur-kocu.git

# Proje klasörüne gir
cd postur-kocu
```

---

### 🐍 2. Backend Kurulumu (Python)

```bash
# Backend klasörüne gir
cd backend

# Virtual environment oluştur (önerilir)
python3 -m venv venv

# Virtual environment'ı aktif et
# Linux/Mac:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Python bağımlılıklarını yükle
pip install -r requirements.txt
```

---

### ⚛️ 3. Frontend Kurulumu (React)

Yeni bir terminal aç ve:

```bash
# Proje klasörüne git (klonladığın yere göre değiştir)
cd postur-kocu/frontend

# Node.js bağımlılıklarını yükle
npm install

# Eğer hata alırsan şunu dene:
npm install --force
```

---

### ▶️ 4. Uygulamayı Çalıştır

**İki ayrı terminal** açman gerekiyor:

#### Terminal 1 - Backend:
```bash
cd postur-kocu/backend

# Virtual environment aktif et (kurulumda yaptıysan)
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Backend'i başlat
python main.py
```

Şu mesajı görmelisin:
```
🚀 Postür Analiz Antrenörü API başlatıldı!
📍 API: http://localhost:8000
📍 Docs: http://localhost:8000/docs
```

#### Terminal 2 - Frontend:
```bash
cd postur-kocu/frontend

# Frontend'i başlat
npm run dev
```

Şu mesajı görmelisin:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

---

### 🌐 5. Uygulamayı Aç

Tarayıcında şu adresi aç: **http://localhost:3000**

🎉 **Tebrikler!** Uygulama hazır!

---

## 📖 Kullanım

1. **"Tespite Başla"** butonuna tıkla
2. Çalışma süresini seç (15, 25, 45, 60 dakika veya özel)
3. **"Başlat"** butonuna tıkla
4. Kamera önünde otur ve çalışmaya başla!
5. Kötü postürde 7 saniye kalırsan uyarı alırsın ⚠️
6. Çalışma bitince detaylı istatistiklerini gör 📊

---

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

---

## 🎯 Postür Analizi Mantığı

```
1. MediaPipe ile sol omuz ve sağ omuz noktaları tespit edilir
2. Göğüs noktası = İki omuzun ortasının 50 piksel altı
3. RealSense'den bu 3 noktanın Z (derinlik) değerleri alınır (3x3 pencerede medyan)
4. Fark = Ortalama omuz derinliği - Göğüs derinliği
5. Fark > 40mm ise İYİ POSTÜR, değilse KÖTÜ POSTÜR
6. 7 saniye boyunca kötü postürde kalınırsa uyarı verilir
```

---

## 📡 API Endpoints

### REST API

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | API durumu |
| POST | `/api/session/start` | Oturum başlat |
| POST | `/api/session/stop` | Oturumu sonlandır |
| GET | `/api/session/stats` | Anlık istatistikler |
| GET | `/api/session/history` | Oturum geçmişi |

### WebSocket

| Endpoint | Açıklama |
|----------|----------|
| `/ws/posture` | Gerçek zamanlı postür verisi |

---

## ❓ Sık Karşılaşılan Sorunlar

### "RealSense kamera başlatılamadı" hatası
- Kameranın USB'ye bağlı olduğundan emin ol
- USB 3.0 portu kullan
- `realsense-viewer` ile kamerayı test et

### "npm install" hatası
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --force
```

### Backend bağlantı hatası
- Backend'in çalıştığından emin ol (Terminal 1)
- http://localhost:8000 adresini kontrol et

---

## 📝 Notlar

- RealSense kamera bağlı değilse uygun hata mesajı gösterilir
- WebSocket bağlantısı kopması durumunda otomatik reconnect yapılır
- Oturum geçmişi LocalStorage'da tutulur
- Sesli uyarı için Web Audio API kullanılır (800Hz beep)

---

## 👨‍💻 Geliştirici

**Kayra Necati Kara**
- GitHub: [@kayranecatikara](https://github.com/kayranecatikara)

---

## 📄 Lisans

MIT License

---

💪 Sağlıklı duruş için yanındayım! 🧘
