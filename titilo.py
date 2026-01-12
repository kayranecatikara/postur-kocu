"""
Postür Analiz Antrenörü
Intel RealSense D435i + MediaPipe Pose

Mantık:
- Omuzlar göğüsten öndeyse (Z mesafesi küçükse) → KÖTÜ POSTÜR (kamburluk)
- Göğüs omuzlardan öndeyse veya aynı hizadaysa → İYİ POSTÜR
"""

import pyrealsense2 as rs
import mediapipe as mp
import cv2
import numpy as np
from collections import deque
import pygame
import threading
import time

class PostureAnalyzer:
    def __init__(self):
        # RealSense pipeline
        self.pipeline = rs.pipeline()
        self.config = rs.config()
        
        # 640x480 @ 30fps - renk ve derinlik
        self.config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
        self.config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
        
        # MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils
        
        # Align object - derinlik görüntüsünü renk görüntüsüne hizala
        self.align = None
        
        # Süre mantığı için sayaçlar
        self.bad_posture_frames = 0
        self.fps = 30
        self.warning_threshold_seconds = 10  # 10-20 saniye arası uyarı
        self.warning_active = False
        
        # Smoothing için deque
        self.depth_history = deque(maxlen=10)
        
        # Eşik değeri (mm cinsinden) - omuzların göğüsten ne kadar geride olması gerektiği
        self.good_posture_threshold = 40  # 40mm = 4cm - omuzlar en az bu kadar geride olmalı
        
        # Ses sistemi
        pygame.mixer.init()
        self.warning_sound = self._create_warning_sound()
        self.sound_playing = False
        self.last_sound_time = 0
        self.sound_cooldown = 3  # Sesler arası minimum 3 saniye
        
    def _create_warning_sound(self):
        """Uyarı sesi oluştur (beep)"""
        sample_rate = 44100
        duration = 0.5  # 0.5 saniye
        frequency = 800  # 800 Hz beep
        
        # Ses dalgası oluştur
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        wave = np.sin(2 * np.pi * frequency * t) * 0.5
        
        # Fade in/out ekle
        fade_samples = int(sample_rate * 0.05)
        wave[:fade_samples] *= np.linspace(0, 1, fade_samples)
        wave[-fade_samples:] *= np.linspace(1, 0, fade_samples)
        
        # Stereo yap ve int16'ya çevir
        stereo_wave = np.column_stack((wave, wave))
        sound_array = (stereo_wave * 32767).astype(np.int16)
        
        # Pygame sound objesi oluştur
        sound = pygame.sndarray.make_sound(sound_array)
        return sound
    
    def play_warning_sound(self):
        """Uyarı sesini çal (cooldown ile)"""
        current_time = time.time()
        if current_time - self.last_sound_time >= self.sound_cooldown:
            self.warning_sound.play()
            self.last_sound_time = current_time
        
    def start(self):
        """Kamerayı başlat"""
        profile = self.pipeline.start(self.config)
        
        # Align objesi oluştur
        align_to = rs.stream.color
        self.align = rs.align(align_to)
        
        # Derinlik skalası al (metre cinsinden)
        depth_sensor = profile.get_device().first_depth_sensor()
        self.depth_scale = depth_sensor.get_depth_scale()
        
        print(f"Derinlik skalası: {self.depth_scale}")
        print("Postür Analiz Antrenörü başlatıldı!")
        print("Çıkmak için 'q' tuşuna basın")
        
    def stop(self):
        """Kamerayı durdur"""
        self.pipeline.stop()
        pygame.mixer.quit()
        cv2.destroyAllWindows()
        
    def get_depth_at_point(self, depth_frame, x, y, window_size=3):
        """
        Belirli bir noktadaki derinlik değerini al
        3x3 alanda medyan alarak gürültüyü azalt
        """
        width = depth_frame.get_width()
        height = depth_frame.get_height()
        
        # Sınırları kontrol et
        x = int(np.clip(x, window_size, width - window_size - 1))
        y = int(np.clip(y, window_size, height - window_size - 1))
        
        # Pencere içindeki değerleri al
        depths = []
        half = window_size // 2
        for dy in range(-half, half + 1):
            for dx in range(-half, half + 1):
                d = depth_frame.get_distance(x + dx, y + dy)
                if d > 0:  # Geçerli derinlik değerleri
                    depths.append(d)
        
        if len(depths) > 0:
            return np.median(depths) * 1000  # mm'ye çevir
        return 0
    
    def calculate_chest_point(self, landmarks, width, height):
        """
        Göğüs noktasını hesapla
        İki omuzun ortasının biraz altı
        """
        left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
        
        # Omuz koordinatları
        left_x = int(left_shoulder.x * width)
        left_y = int(left_shoulder.y * height)
        right_x = int(right_shoulder.x * width)
        right_y = int(right_shoulder.y * height)
        
        # Göğüs = omuzların ortası, biraz aşağıda
        chest_x = (left_x + right_x) // 2
        chest_y = (left_y + right_y) // 2 + 50  # 50 piksel aşağı
        
        return (left_x, left_y), (right_x, right_y), (chest_x, chest_y)
    
    def analyze_posture(self, left_shoulder_depth, right_shoulder_depth, chest_depth):
        """
        Postür analizi yap
        
        Mantık:
        - Omuzların ortalama derinliği < göğüs derinliği → KÖTÜ (omuzlar öne çıkmış)
        - Göğüs derinliği <= omuz derinliği → İYİ (göğüs önde veya aynı hizada)
        
        Not: Derinlik değeri küçük = kameraya daha yakın = daha önde
        """
        if left_shoulder_depth == 0 or right_shoulder_depth == 0 or chest_depth == 0:
            return None, 0
        
        avg_shoulder_depth = (left_shoulder_depth + right_shoulder_depth) / 2
        
        # Fark hesapla (pozitif = omuzlar önde, negatif = göğüs önde)
        depth_diff = avg_shoulder_depth - chest_depth
        
        # Smoothing için geçmişe ekle
        self.depth_history.append(depth_diff)
        smoothed_diff = np.mean(self.depth_history)
        
        # Postür değerlendirmesi
        # Pozitif fark = omuzlar geride (iyi), Negatif fark = omuzlar önde (kötü)
        # İYİ postür için omuzlar göğüsten en az 5cm geride olmalı
        if smoothed_diff > self.good_posture_threshold:
            # Omuzlar yeterince geride = İYİ POSTÜR
            return "IYI", smoothed_diff
        else:
            # Omuzlar yeterince geride değil veya önde = KÖTÜ POSTÜR
            return "KOTU", smoothed_diff
    
    def draw_ui(self, frame, posture_status, depth_diff, points, depths):
        """Görselleştirme çiz"""
        left_shoulder, right_shoulder, chest = points
        left_depth, right_depth, chest_depth = depths
        
        # Renk belirle
        if posture_status == "IYI":
            status_color = (0, 255, 0)  # Yeşil
            self.bad_posture_frames = 0
            self.warning_active = False
        elif posture_status == "KOTU":
            self.bad_posture_frames += 1
            seconds_in_bad = self.bad_posture_frames / self.fps
            if self.bad_posture_frames > self.warning_threshold_seconds * self.fps:
                status_color = (0, 0, 255)  # Kırmızı - uyarı
                self.warning_active = True
                # Sesli uyarı çal
                self.play_warning_sound()
            else:
                status_color = (0, 165, 255)  # Turuncu - henüz uyarı yok
                # Kalan süreyi göster
                remaining = self.warning_threshold_seconds - seconds_in_bad
                cv2.putText(frame, f"Uyari: {remaining:.1f}s", (360, 35),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
        else:
            status_color = (128, 128, 128)  # Gri - tespit yok
        
        # Sol omuz - mavi daire
        cv2.circle(frame, left_shoulder, 15, (255, 0, 0), -1)
        cv2.circle(frame, left_shoulder, 15, (255, 255, 255), 2)
        cv2.putText(frame, f"Sol: {left_depth:.0f}mm", 
                    (left_shoulder[0] - 60, left_shoulder[1] - 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        
        # Sağ omuz - mavi daire
        cv2.circle(frame, right_shoulder, 15, (255, 0, 0), -1)
        cv2.circle(frame, right_shoulder, 15, (255, 255, 255), 2)
        cv2.putText(frame, f"Sag: {right_depth:.0f}mm", 
                    (right_shoulder[0] - 60, right_shoulder[1] - 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
        
        # Göğüs - kırmızı daire
        cv2.circle(frame, chest, 15, (0, 0, 255), -1)
        cv2.circle(frame, chest, 15, (255, 255, 255), 2)
        cv2.putText(frame, f"Gogus: {chest_depth:.0f}mm", 
                    (chest[0] - 60, chest[1] + 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # Omuzları birleştiren çizgi
        cv2.line(frame, left_shoulder, right_shoulder, (255, 255, 0), 2)
        
        # Omuz ortası ile göğüs arası çizgi
        shoulder_mid = ((left_shoulder[0] + right_shoulder[0]) // 2,
                        (left_shoulder[1] + right_shoulder[1]) // 2)
        cv2.line(frame, shoulder_mid, chest, (255, 0, 255), 2)
        
        # Durum paneli
        panel_height = 120
        cv2.rectangle(frame, (0, 0), (500, panel_height), (0, 0, 0), -1)
        cv2.rectangle(frame, (0, 0), (500, panel_height), status_color, 3)
        
        # Postür durumu
        if posture_status:
            cv2.putText(frame, f"POSTUR: {posture_status}", (10, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)
            
            # Derinlik farkı ve hedef
            diff_text = f"Fark: {depth_diff:.1f}mm (Hedef: >{self.good_posture_threshold}mm)"
            cv2.putText(frame, diff_text, (10, 65),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Açıklama
            if posture_status == "KOTU":
                cv2.putText(frame, "Omuzlarini geriye at!", (10, 95),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)
            else:
                cv2.putText(frame, "Omuzlar geride - Harika!", (10, 95),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        else:
            cv2.putText(frame, "Tespit edilemiyor...", (10, 35),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (128, 128, 128), 2)
        
        # Uyarı - ekranı kırmızıya boya
        if self.warning_active:
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (frame.shape[1], frame.shape[0]), (0, 0, 255), -1)
            cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)
            
            # Büyük uyarı yazısı
            cv2.putText(frame, "DURUSUNU DUZELT!", 
                        (frame.shape[1]//2 - 200, frame.shape[0]//2),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
            
            # Süre göster
            bad_seconds = self.bad_posture_frames / self.fps
            cv2.putText(frame, f"{bad_seconds:.0f} saniyedir kotu postur", 
                        (frame.shape[1]//2 - 150, frame.shape[0]//2 + 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Açıklama kutusu (sağ alt)
        legend_x = frame.shape[1] - 200
        legend_y = frame.shape[0] - 80
        cv2.rectangle(frame, (legend_x - 10, legend_y - 10), 
                      (frame.shape[1] - 10, frame.shape[0] - 10), (0, 0, 0), -1)
        cv2.circle(frame, (legend_x, legend_y + 5), 8, (255, 0, 0), -1)
        cv2.putText(frame, "Omuz", (legend_x + 15, legend_y + 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.circle(frame, (legend_x, legend_y + 30), 8, (0, 0, 255), -1)
        cv2.putText(frame, "Gogus", (legend_x + 15, legend_y + 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, "Q: Cikis", (legend_x, legend_y + 55),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        
        return frame
    
    def run(self):
        """Ana döngü"""
        self.start()
        
        try:
            while True:
                # Frame al
                frames = self.pipeline.wait_for_frames()
                
                # Hizala
                aligned_frames = self.align.process(frames)
                depth_frame = aligned_frames.get_depth_frame()
                color_frame = aligned_frames.get_color_frame()
                
                if not depth_frame or not color_frame:
                    continue
                
                # Numpy array'e çevir
                color_image = np.asanyarray(color_frame.get_data())
                
                # MediaPipe için RGB'ye çevir
                rgb_image = cv2.cvtColor(color_image, cv2.COLOR_BGR2RGB)
                results = self.pose.process(rgb_image)
                
                # Varsayılan değerler
                posture_status = None
                depth_diff = 0
                points = ((0, 0), (0, 0), (0, 0))
                depths = (0, 0, 0)
                
                if results.pose_landmarks:
                    landmarks = results.pose_landmarks.landmark
                    h, w = color_image.shape[:2]
                    
                    # Omuz ve göğüs noktalarını hesapla
                    left_shoulder, right_shoulder, chest = self.calculate_chest_point(
                        landmarks, w, h)
                    
                    # Derinlik değerlerini al
                    left_depth = self.get_depth_at_point(depth_frame, 
                                                          left_shoulder[0], left_shoulder[1])
                    right_depth = self.get_depth_at_point(depth_frame, 
                                                           right_shoulder[0], right_shoulder[1])
                    chest_depth = self.get_depth_at_point(depth_frame, 
                                                           chest[0], chest[1])
                    
                    # Postür analizi
                    posture_status, depth_diff = self.analyze_posture(
                        left_depth, right_depth, chest_depth)
                    
                    points = (left_shoulder, right_shoulder, chest)
                    depths = (left_depth, right_depth, chest_depth)
                    
                    # İskelet çiz (hafif)
                    self.mp_draw.draw_landmarks(
                        color_image,
                        results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=self.mp_draw.DrawingSpec(
                            color=(200, 200, 200), thickness=1, circle_radius=2),
                        connection_drawing_spec=self.mp_draw.DrawingSpec(
                            color=(200, 200, 200), thickness=1))
                
                # UI çiz
                color_image = self.draw_ui(color_image, posture_status, depth_diff, 
                                           points, depths)
                
                # Göster
                cv2.imshow("Postur Analiz Antrenoru", color_image)
                
                # Çıkış kontrolü
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                    
        finally:
            self.stop()


def main():
    print("=" * 50)
    print("  POSTÜR ANALİZ ANTRENÖRÜ")
    print("  Intel RealSense D435i + MediaPipe")
    print("=" * 50)
    print()
    print("Nasıl çalışır:")
    print("- Mavi noktalar: Omuzlarınız")
    print("- Kırmızı nokta: Göğüs bölgeniz")
    print("- Omuzlar göğüsten öndeyse → KÖTÜ POSTÜR")
    print("- Göğüs önde veya hizadaysa → İYİ POSTÜR")
    print()
    print("10+ saniye kötü postürde kalırsanız uyarı alırsınız!")
    print()
    
    analyzer = PostureAnalyzer()
    analyzer.run()


if __name__ == "__main__":
    main()
