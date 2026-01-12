"""
Oturum Yönetimi Modülü
Çalışma oturumlarını ve istatistiklerini yönetir
"""

import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
import json


class SessionStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


@dataclass
class PostureStats:
    """Postür istatistikleri"""
    good_posture_time: float = 0.0  # saniye
    bad_posture_time: float = 0.0   # saniye
    warning_count: int = 0
    timeline: List[Dict[str, Any]] = field(default_factory=list)  # Zaman çizelgesi
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "good_posture_time": round(self.good_posture_time, 1),
            "bad_posture_time": round(self.bad_posture_time, 1),
            "warning_count": self.warning_count,
            "timeline": self.timeline
        }


@dataclass
class Session:
    """Çalışma oturumu"""
    id: str
    duration_seconds: int  # Toplam süre (saniye)
    start_time: float = 0.0
    end_time: float = 0.0
    status: SessionStatus = SessionStatus.IDLE
    stats: PostureStats = field(default_factory=PostureStats)
    
    # Kötü postür takibi
    bad_posture_start: Optional[float] = None
    current_bad_posture_seconds: float = 0.0
    warning_threshold: float = 7.0  # 7 saniye
    warning_active: bool = False
    last_status: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        elapsed = self.get_elapsed_time()
        remaining = self.get_remaining_time()
        
        return {
            "id": self.id,
            "duration_seconds": self.duration_seconds,
            "elapsed_time": round(elapsed, 1),
            "remaining_time": round(remaining, 1),
            "status": self.status.value,
            "stats": self.stats.to_dict(),
            "warning_active": self.warning_active,
            "bad_posture_seconds": round(self.current_bad_posture_seconds, 1)
        }
    
    def get_elapsed_time(self) -> float:
        """Geçen süreyi hesapla"""
        if self.status == SessionStatus.RUNNING:
            return time.time() - self.start_time
        elif self.status == SessionStatus.COMPLETED:
            return self.end_time - self.start_time
        return 0.0
    
    def get_remaining_time(self) -> float:
        """Kalan süreyi hesapla"""
        elapsed = self.get_elapsed_time()
        remaining = self.duration_seconds - elapsed
        return max(0, remaining)


class SessionManager:
    """Oturum yöneticisi"""
    
    def __init__(self):
        self.current_session: Optional[Session] = None
        self.session_history: List[Dict[str, Any]] = []
        self._session_counter = 0
        
    def start_session(self, duration_minutes: int, warning_threshold: float = 7.0) -> Session:
        """Yeni oturum başlat"""
        self._session_counter += 1
        session_id = f"session_{self._session_counter}_{int(time.time())}"
        
        self.current_session = Session(
            id=session_id,
            duration_seconds=duration_minutes * 60,
            start_time=time.time(),
            status=SessionStatus.RUNNING,
            warning_threshold=warning_threshold
        )
        
        print(f"✅ Oturum başlatıldı: {session_id} ({duration_minutes} dakika)")
        return self.current_session
    
    def stop_session(self) -> Optional[Dict[str, Any]]:
        """Oturumu durdur ve sonuçları döndür"""
        if not self.current_session:
            return None
        
        self.current_session.end_time = time.time()
        self.current_session.status = SessionStatus.COMPLETED
        
        # Sonuçları hesapla
        result = self._calculate_results()
        
        # Geçmişe ekle
        self.session_history.append(result)
        
        print(f"✅ Oturum tamamlandı: {self.current_session.id}")
        
        session_result = result.copy()
        self.current_session = None
        
        return session_result
    
    def update_posture(self, status: Optional[str], frame_time: float = 1/30) -> Dict[str, Any]:
        """
        Postür durumunu güncelle
        Her frame'de çağrılır
        """
        if not self.current_session or self.current_session.status != SessionStatus.RUNNING:
            return {}
        
        session = self.current_session
        current_time = time.time()
        
        # Süre doldu mu kontrol et
        if session.get_remaining_time() <= 0:
            return self.stop_session()
        
        # Postür istatistiklerini güncelle
        if status == "IYI":
            session.stats.good_posture_time += frame_time
            
            # Kötü postür sayacını sıfırla
            session.bad_posture_start = None
            session.current_bad_posture_seconds = 0.0
            session.warning_active = False
            
        elif status == "KOTU":
            session.stats.bad_posture_time += frame_time
            
            # Kötü postür süresini takip et
            if session.bad_posture_start is None:
                session.bad_posture_start = current_time
            
            session.current_bad_posture_seconds = current_time - session.bad_posture_start
            
            # Uyarı kontrolü
            if session.current_bad_posture_seconds >= session.warning_threshold:
                if not session.warning_active:
                    session.warning_active = True
                    session.stats.warning_count += 1
                    print(f"⚠️ Uyarı #{session.stats.warning_count}: Kötü postür {session.warning_threshold}s aşıldı!")
            else:
                session.warning_active = False
        
        # Timeline'a ekle (her 5 saniyede bir)
        elapsed = session.get_elapsed_time()
        if len(session.stats.timeline) == 0 or elapsed - session.stats.timeline[-1].get("time", 0) >= 5:
            session.stats.timeline.append({
                "time": round(elapsed, 1),
                "status": status or "UNKNOWN"
            })
        
        session.last_status = status
        
        return {
            "warning_active": session.warning_active,
            "bad_posture_seconds": round(session.current_bad_posture_seconds, 1),
            "elapsed_time": round(elapsed, 1),
            "remaining_time": round(session.get_remaining_time(), 1),
            "stats": session.stats.to_dict()
        }
    
    def get_current_stats(self) -> Optional[Dict[str, Any]]:
        """Anlık istatistikleri döndür"""
        if not self.current_session:
            return None
        return self.current_session.to_dict()
    
    def get_history(self) -> List[Dict[str, Any]]:
        """Oturum geçmişini döndür"""
        return self.session_history
    
    def _calculate_results(self) -> Dict[str, Any]:
        """Oturum sonuçlarını hesapla"""
        session = self.current_session
        if not session:
            return {}
        
        total_time = session.get_elapsed_time()
        good_time = session.stats.good_posture_time
        bad_time = session.stats.bad_posture_time
        
        # Postür skoru (0-100)
        if total_time > 0:
            good_percentage = (good_time / total_time) * 100
            score = round(good_percentage)
        else:
            good_percentage = 0
            score = 0
        
        return {
            "session_id": session.id,
            "total_duration": round(total_time, 1),
            "good_posture_time": round(good_time, 1),
            "bad_posture_time": round(bad_time, 1),
            "good_percentage": round(good_percentage, 1),
            "bad_percentage": round(100 - good_percentage, 1),
            "warning_count": session.stats.warning_count,
            "posture_score": score,
            "timeline": session.stats.timeline,
            "completed_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def is_session_active(self) -> bool:
        """Aktif oturum var mı kontrol et"""
        return self.current_session is not None and self.current_session.status == SessionStatus.RUNNING

