"""
Postür Analiz Modülü
Intel RealSense D435i + MediaPipe Pose

Web uygulaması için optimize edilmiş versiyon
"""

import pyrealsense2 as rs
import mediapipe as mp
import cv2
import numpy as np
from collections import deque
import base64
import time
from typing import Optional, Tuple, Dict, Any


class PostureAnalyzer:
    """Intel RealSense D435i ve MediaPipe kullanarak postür analizi yapar"""
    
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
        self.depth_scale = None
        
        # Kamera durumu
        self.is_running = False
        
        # Smoothing için deque
        self.depth_history = deque(maxlen=10)
        
        # Eşik değeri (mm cinsinden)
        self.good_posture_threshold = 40  # 40mm
        
    def start(self) -> bool:
        """Kamerayı başlat"""
        try:
            profile = self.pipeline.start(self.config)
            
            # Align objesi oluştur
            align_to = rs.stream.color
            self.align = rs.align(align_to)
            
            # Derinlik skalası al
            depth_sensor = profile.get_device().first_depth_sensor()
            self.depth_scale = depth_sensor.get_depth_scale()
            
            self.is_running = True
            print(f"✅ RealSense kamera başlatıldı (Derinlik skalası: {self.depth_scale})")
            return True
        except Exception as e:
            print(f"❌ Kamera başlatma hatası: {e}")
            self.is_running = False
            return False
        
    def stop(self):
        """Kamerayı durdur"""
        if self.is_running:
            try:
                self.pipeline.stop()
                self.is_running = False
                self.depth_history.clear()
                print("✅ RealSense kamera durduruldu")
            except Exception as e:
                print(f"❌ Kamera durdurma hatası: {e}")
        
    def get_depth_at_point(self, depth_frame, x: int, y: int, window_size: int = 3) -> float:
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
    
    def calculate_chest_point(self, landmarks, width: int, height: int) -> Tuple[Tuple[int, int], ...]:
        """
        Göğüs noktasını hesapla
        İki omuzun ortasının 50 piksel altı
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
    
    def analyze_posture(self, left_shoulder_depth: float, right_shoulder_depth: float, 
                        chest_depth: float) -> Tuple[Optional[str], float]:
        """
        Postür analizi yap
        
        Mantık:
        - Fark > threshold → İYİ POSTÜR (omuzlar geride)
        - Fark <= threshold → KÖTÜ POSTÜR (omuzlar önde/kamburuk)
        """
        if left_shoulder_depth == 0 or right_shoulder_depth == 0 or chest_depth == 0:
            return None, 0
        
        avg_shoulder_depth = (left_shoulder_depth + right_shoulder_depth) / 2
        
        # Fark hesapla (pozitif = omuzlar geride)
        depth_diff = avg_shoulder_depth - chest_depth
        
        # Smoothing için geçmişe ekle
        self.depth_history.append(depth_diff)
        smoothed_diff = np.mean(self.depth_history)
        
        # Postür değerlendirmesi
        if smoothed_diff > self.good_posture_threshold:
            return "IYI", smoothed_diff
        else:
            return "KOTU", smoothed_diff
    
    def draw_overlay(self, frame, points: Tuple, depths: Tuple, 
                     posture_status: Optional[str]) -> np.ndarray:
        """Kamera görüntüsü üzerine işaretler çiz"""
        left_shoulder, right_shoulder, chest = points
        left_depth, right_depth, chest_depth = depths
        
        # Sol omuz - mavi daire
        cv2.circle(frame, left_shoulder, 12, (66, 133, 244), -1)  # Google Blue
        cv2.circle(frame, left_shoulder, 12, (255, 255, 255), 2)
        cv2.putText(frame, f"{left_depth:.0f}mm", 
                    (left_shoulder[0] - 30, left_shoulder[1] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (66, 133, 244), 2)
        
        # Sağ omuz - mavi daire
        cv2.circle(frame, right_shoulder, 12, (66, 133, 244), -1)
        cv2.circle(frame, right_shoulder, 12, (255, 255, 255), 2)
        cv2.putText(frame, f"{right_depth:.0f}mm", 
                    (right_shoulder[0] - 30, right_shoulder[1] - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (66, 133, 244), 2)
        
        # Göğüs - kırmızı/turuncu daire
        cv2.circle(frame, chest, 12, (244, 81, 30), -1)  # Deep Orange
        cv2.circle(frame, chest, 12, (255, 255, 255), 2)
        cv2.putText(frame, f"{chest_depth:.0f}mm", 
                    (chest[0] - 30, chest[1] + 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (244, 81, 30), 2)
        
        # Omuzları birleştiren sarı çizgi
        cv2.line(frame, left_shoulder, right_shoulder, (255, 235, 59), 3)  # Yellow
        
        # Omuz ortası ile göğüs arası çizgi
        shoulder_mid = ((left_shoulder[0] + right_shoulder[0]) // 2,
                        (left_shoulder[1] + right_shoulder[1]) // 2)
        cv2.line(frame, shoulder_mid, chest, (186, 104, 200), 2)  # Purple
        
        return frame
    
    def get_frame(self) -> Optional[Dict[str, Any]]:
        """
        Tek bir frame al ve analiz et
        WebSocket üzerinden gönderilecek veriyi döndür
        """
        if not self.is_running:
            return None
        
        try:
            # Frame al (timeout 1000ms)
            frames = self.pipeline.wait_for_frames(1000)
            
            # Hizala
            aligned_frames = self.align.process(frames)
            depth_frame = aligned_frames.get_depth_frame()
            color_frame = aligned_frames.get_color_frame()
            
            if not depth_frame or not color_frame:
                return None
            
            # Numpy array'e çevir
            color_image = np.asanyarray(color_frame.get_data())
            
            # MediaPipe için RGB'ye çevir
            rgb_image = cv2.cvtColor(color_image, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_image)
            
            # Varsayılan değerler
            posture_status = None
            depth_diff = 0.0
            left_depth = 0.0
            right_depth = 0.0
            chest_depth = 0.0
            
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
                
                # İşaretleri çiz
                points = (left_shoulder, right_shoulder, chest)
                depths = (left_depth, right_depth, chest_depth)
                color_image = self.draw_overlay(color_image, points, depths, posture_status)
                
                # İskelet çiz (hafif)
                self.mp_draw.draw_landmarks(
                    color_image,
                    results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=self.mp_draw.DrawingSpec(
                        color=(200, 200, 200), thickness=1, circle_radius=2),
                    connection_drawing_spec=self.mp_draw.DrawingSpec(
                        color=(200, 200, 200), thickness=1))
            
            # Frame'i base64'e çevir
            _, buffer = cv2.imencode('.jpg', color_image, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return {
                "status": posture_status,
                "depth_diff": round(depth_diff, 1),
                "left_shoulder_depth": round(left_depth, 0),
                "right_shoulder_depth": round(right_depth, 0),
                "chest_depth": round(chest_depth, 0),
                "frame_base64": frame_base64,
                "timestamp": time.time()
            }
            
        except Exception as e:
            print(f"❌ Frame alma hatası: {e}")
            return None
    
    def set_threshold(self, threshold: float):
        """Postür eşik değerini ayarla"""
        self.good_posture_threshold = threshold
        print(f"✅ Postür eşiği: {threshold}mm olarak ayarlandı")

