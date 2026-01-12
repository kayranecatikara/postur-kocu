"""
Postür Analiz Antrenörü - Backend API
FastAPI + WebSocket
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import json

from posture_analyzer import PostureAnalyzer
from session_manager import SessionManager

# FastAPI app
app = FastAPI(
    title="Postür Analiz Antrenörü API",
    description="Intel RealSense D435i ve MediaPipe ile gerçek zamanlı postür analizi",
    version="1.0.0"
)

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tüm originlere izin ver
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
posture_analyzer: Optional[PostureAnalyzer] = None
session_manager = SessionManager()


# Pydantic models
class SessionStartRequest(BaseModel):
    duration_minutes: int = 25
    warning_threshold: float = 7.0


class SessionStartResponse(BaseModel):
    success: bool
    session_id: Optional[str] = None
    message: str


class ThresholdRequest(BaseModel):
    threshold: float = 40.0


# REST Endpoints
@app.get("/")
async def root():
    """API durumu"""
    return {
        "status": "ok",
        "message": "Postür Analiz Antrenörü API",
        "camera_connected": posture_analyzer is not None and posture_analyzer.is_running
    }


@app.post("/api/session/start", response_model=SessionStartResponse)
async def start_session(request: SessionStartRequest):
    """Yeni oturum başlat"""
    global posture_analyzer
    
    # Aktif oturum varsa önce onu sonlandır
    if session_manager.is_session_active():
        session_manager.stop_session()
        if posture_analyzer and posture_analyzer.is_running:
            posture_analyzer.stop()
    
    # Kamerayı başlat
    try:
        if posture_analyzer is None:
            posture_analyzer = PostureAnalyzer()
        
        if not posture_analyzer.is_running:
            success = posture_analyzer.start()
            if not success:
                return SessionStartResponse(
                    success=False,
                    message="RealSense kamera başlatılamadı. Kameranın bağlı olduğundan emin olun."
                )
    except Exception as e:
        return SessionStartResponse(
            success=False,
            message=f"Kamera hatası: {str(e)}"
        )
    
    # Oturumu başlat
    session = session_manager.start_session(
        duration_minutes=request.duration_minutes,
        warning_threshold=request.warning_threshold
    )
    
    return SessionStartResponse(
        success=True,
        session_id=session.id,
        message=f"{request.duration_minutes} dakikalık oturum başlatıldı!"
    )


@app.post("/api/session/stop")
async def stop_session():
    """Oturumu sonlandır"""
    global posture_analyzer
    
    if not session_manager.is_session_active():
        return {"success": False, "message": "Aktif oturum bulunamadı", "result": None}
    
    result = session_manager.stop_session()
    
    # Kamerayı durdur
    if posture_analyzer and posture_analyzer.is_running:
        posture_analyzer.stop()
    
    return {
        "success": True,
        "message": "Oturum sonlandırıldı",
        "result": result
    }


@app.get("/api/session/stats")
async def get_stats():
    """Anlık istatistikleri al"""
    stats = session_manager.get_current_stats()
    if stats is None:
        return {"active": False, "message": "Aktif oturum yok"}
    return {"active": True, "stats": stats}


@app.get("/api/session/history")
async def get_history():
    """Oturum geçmişini al"""
    return {"history": session_manager.get_history()}


@app.post("/api/settings/threshold")
async def set_threshold(request: ThresholdRequest):
    """Postür eşik değerini ayarla"""
    global posture_analyzer
    
    if posture_analyzer:
        posture_analyzer.set_threshold(request.threshold)
        return {"success": True, "threshold": request.threshold}
    return {"success": False, "message": "Kamera henüz başlatılmadı"}


@app.get("/api/camera/status")
async def camera_status():
    """Kamera durumunu kontrol et"""
    global posture_analyzer
    
    if posture_analyzer is None:
        return {"connected": False, "running": False, "message": "Kamera başlatılmadı"}
    
    return {
        "connected": True,
        "running": posture_analyzer.is_running,
        "message": "Kamera hazır" if posture_analyzer.is_running else "Kamera bağlı ama çalışmıyor"
    }


# WebSocket endpoint
@app.websocket("/ws/posture")
async def websocket_posture(websocket: WebSocket):
    """Gerçek zamanlı postür verisi stream'i"""
    global posture_analyzer
    
    await websocket.accept()
    print("📡 WebSocket bağlantısı kuruldu")
    
    try:
        while True:
            # Aktif oturum yoksa bekle
            if not session_manager.is_session_active():
                await asyncio.sleep(0.5)
                try:
                    await websocket.send_json({
                        "type": "waiting",
                        "message": "Oturum başlatılmayı bekliyor..."
                    })
                except:
                    break
                continue
            
            # Kamera çalışmıyorsa hata gönder
            if posture_analyzer is None or not posture_analyzer.is_running:
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Kamera bağlantısı yok"
                    })
                except:
                    break
                await asyncio.sleep(1)
                continue
            
            # Frame al
            frame_data = posture_analyzer.get_frame()
            
            if frame_data:
                # Oturum istatistiklerini güncelle
                session_update = session_manager.update_posture(
                    status=frame_data.get("status"),
                    frame_time=1/30  # ~30 FPS
                )
                
                # Oturum tamamlandıysa sonucu gönder
                if "session_id" in session_update:
                    try:
                        await websocket.send_json({
                            "type": "completed",
                            "result": session_update
                        })
                    except:
                        pass
                    
                    # Kamerayı durdur
                    if posture_analyzer and posture_analyzer.is_running:
                        posture_analyzer.stop()
                    continue
                
                # Normal frame verisi gönder
                message = {
                    "type": "frame",
                    "status": frame_data.get("status"),
                    "depth_diff": frame_data.get("depth_diff"),
                    "left_shoulder_depth": frame_data.get("left_shoulder_depth"),
                    "right_shoulder_depth": frame_data.get("right_shoulder_depth"),
                    "chest_depth": frame_data.get("chest_depth"),
                    "frame_base64": frame_data.get("frame_base64"),
                    "warning_active": session_update.get("warning_active", False),
                    "bad_posture_seconds": session_update.get("bad_posture_seconds", 0),
                    "elapsed_time": session_update.get("elapsed_time", 0),
                    "remaining_time": session_update.get("remaining_time", 0),
                    "stats": session_update.get("stats", {})
                }
                
                try:
                    await websocket.send_json(message)
                except:
                    break
            
            # ~30 FPS için bekle
            await asyncio.sleep(1/30)
            
    except WebSocketDisconnect:
        print("📡 WebSocket bağlantısı kesildi")
    except Exception as e:
        print(f"❌ WebSocket hatası: {e}")
    
    # Cleanup - websocket.close() çağırmıyoruz çünkü zaten kapanmış olabilir


# Startup ve shutdown events
@app.on_event("startup")
async def startup_event():
    """Uygulama başlangıcı"""
    print("🚀 Postür Analiz Antrenörü API başlatıldı!")
    print("📍 API: http://localhost:8000")
    print("📍 Docs: http://localhost:8000/docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Uygulama kapatılıyor"""
    global posture_analyzer
    
    if posture_analyzer and posture_analyzer.is_running:
        posture_analyzer.stop()
    
    print("👋 Postür Analiz Antrenörü API kapatıldı")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
