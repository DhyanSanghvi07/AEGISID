import io
import logging
import base64
from typing import Optional
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Import DeepFace with error handling
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    logger.warning("DeepFace not available, face recognition will use fallback")
except Exception as e:
    DEEPFACE_AVAILABLE = False
    logger.warning(f"DeepFace import failed ({str(e)}), face recognition will use fallback")

from app.services.face_extraction import FACE_MATCH_THRESHOLD


class FaceRecognitionService:
    """Service for comparing faces using DeepFace."""
    
    def __init__(self):
        self.available = DEEPFACE_AVAILABLE
        if self.available:
            logger.info("DeepFace face recognition service initialized")
        else:
            logger.warning("DeepFace not available, using fallback mode")
    
    def compare_faces(
        self,
        passport_face_bytes: bytes,
        live_face_bytes: bytes
    ) -> dict:
        """
        Compare passport face with live face using DeepFace.
        
        Args:
            passport_face_bytes: Extracted passport face image bytes
            live_face_bytes: Live captured face image bytes
            
        Returns:
            Dictionary with comparison results:
            {
                "success": bool,
                "face_detected": bool,
                "match": bool,
                "similarity_score": float,
                "threshold": float,
                "status": str ("MATCH" or "MISMATCH"),
                "details": dict,
                "error": str or None
            }
        """
        if not self.available:
            return self._fallback_comparison(passport_face_bytes, live_face_bytes)
        
        try:
            # Load images
            passport_img = Image.open(io.BytesIO(passport_face_bytes))
            if passport_img.mode != 'RGB':
                passport_img = passport_img.convert('RGB')
            passport_array = np.array(passport_img)
            
            live_img = Image.open(io.BytesIO(live_face_bytes))
            if live_img.mode != 'RGB':
                live_img = live_img.convert('RGB')
            live_array = np.array(live_img)
            
            # Use DeepFace to verify
            result = DeepFace.verify(
                img1_path=passport_array,
                img2_path=live_array,
                enforce_detection=False,
                model_name='VGG-Face',
                detector_backend='opencv'
            )
            
            # DeepFace returns distance (lower is better)
            # Convert distance to similarity percentage
            distance = result.get('distance', 1.0)
            similarity = float(max(0, min(100, (1 - distance) * 100)))
            
            # Determine match based on threshold
            match = bool(similarity >= (FACE_MATCH_THRESHOLD * 100))
            status = "MATCH" if match else "MISMATCH"
            
            return {
                "success": True,
                "face_detected": True,
                "match": match,
                "similarity_score": round(similarity, 1),
                "threshold": float(FACE_MATCH_THRESHOLD * 100),
                "status": status,
                "details": {
                    "passport_face_detected": True,
                    "live_face_detected": True,
                    "distance": round(distance, 3),
                    "model": "VGG-Face"
                },
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Face comparison error: {str(e)}")
            return {
                "success": False,
                "face_detected": False,
                "match": False,
                "similarity_score": 0.0,
                "threshold": float(FACE_MATCH_THRESHOLD * 100),
                "status": "ERROR",
                "details": {
                    "passport_face_detected": False,
                    "live_face_detected": False
                },
                "error": f"Face comparison failed: {str(e)}"
            }
    
    def _fallback_comparison(
        self,
        passport_face_bytes: bytes,
        live_face_bytes: bytes
    ) -> dict:
        """
        Fallback comparison when DeepFace is not available.
        Uses simple image similarity as a basic fallback.
        """
        try:
            # Load images
            passport_img = Image.open(io.BytesIO(passport_face_bytes))
            live_img = Image.open(io.BytesIO(live_face_bytes))
            
            # Resize to same dimensions
            size = (100, 100)
            passport_resized = passport_img.resize(size)
            live_resized = live_img.resize(size)
            
            # Convert to grayscale
            passport_gray = passport_resized.convert('L')
            live_gray = live_resized.convert('L')
            
            # Calculate pixel difference
            p_array = np.array(passport_gray)
            l_array = np.array(live_gray)
            
            # Simple similarity based on pixel difference
            diff = np.abs(p_array.astype(float) - l_array.astype(float))
            similarity = float(100 - (np.mean(diff) / 255 * 100))
            
            match = bool(similarity >= (FACE_MATCH_THRESHOLD * 100))
            status = "MATCH" if match else "MISMATCH"
            
            return {
                "success": True,
                "face_detected": True,
                "match": match,
                "similarity_score": round(similarity, 1),
                "threshold": float(FACE_MATCH_THRESHOLD * 100),
                "status": status,
                "details": {
                    "passport_face_detected": True,
                    "live_face_detected": True,
                    "model": "fallback_pixel_comparison"
                },
                "error": None,
                "warning": "Using fallback comparison (DeepFace not available)"
            }
            
        except Exception as e:
            logger.error(f"Fallback comparison error: {str(e)}")
            return {
                "success": False,
                "face_detected": False,
                "match": False,
                "similarity_score": 0.0,
                "threshold": float(FACE_MATCH_THRESHOLD * 100),
                "status": "ERROR",
                "details": {
                    "passport_face_detected": False,
                    "live_face_detected": False
                },
                "error": f"Comparison failed: {str(e)}"
            }


face_recognition_service = FaceRecognitionService()
