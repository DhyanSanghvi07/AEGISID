import io
import logging
import base64
from typing import Tuple, Optional
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Face match threshold
FACE_MATCH_THRESHOLD = 0.75


class FaceExtractionService:
    """Service for extracting faces from passport documents."""
    
    def __init__(self):
        # Load OpenCV's Haar Cascade for face detection
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        if self.face_cascade.empty():
            logger.warning("Failed to load Haar Cascade classifier")
    
    def detect_faces(self, image: np.ndarray) -> list:
        """
        Detect faces in an image using OpenCV Haar Cascade.
        
        Args:
            image: OpenCV image array (BGR format)
            
        Returns:
            List of face bounding boxes [(x, y, w, h), ...]
        """
        if self.face_cascade.empty():
            logger.error("Face cascade classifier not loaded")
            return []
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        return faces.tolist()
    
    def extract_face_from_passport(
        self, 
        image_bytes: bytes
    ) -> dict:
        """
        Extract the passport holder's face from a passport image.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Dictionary with extraction results:
            {
                "success": bool,
                "face_detected": bool,
                "confidence": float,
                "face_image": str (base64),
                "bounding_box": dict or None,
                "error": str or None
            }
        """
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Detect faces
            faces = self.detect_faces(opencv_image)
            
            if len(faces) == 0:
                return {
                    "success": False,
                    "face_detected": False,
                    "confidence": 0.0,
                    "face_image": None,
                    "bounding_box": None,
                    "error": "No face detected in passport image"
                }
            
            if len(faces) > 1:
                logger.warning(f"Multiple faces detected ({len(faces)}), using largest face")
            
            # Select the largest face (most likely the passport photo)
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = largest_face
            
            # Add padding to the crop
            padding = int(0.2 * min(w, h))
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(opencv_image.shape[1] - x, w + 2 * padding)
            h = min(opencv_image.shape[0] - y, h + 2 * padding)
            
            # Crop the face
            face_crop = opencv_image[y:y+h, x:x+w]
            
            # Convert back to PIL and encode as base64
            face_pil = Image.fromarray(cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB))
            buffered = io.BytesIO()
            face_pil.save(buffered, format="JPEG", quality=95)
            face_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            # Calculate confidence based on face size relative to image
            face_area = w * h
            image_area = opencv_image.shape[0] * opencv_image.shape[1]
            confidence = min(0.95, face_area / image_area * 5)
            
            return {
                "success": True,
                "face_detected": True,
                "confidence": round(confidence, 2),
                "face_image": face_base64,
                "bounding_box": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h)
                },
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Face extraction error: {str(e)}")
            return {
                "success": False,
                "face_detected": False,
                "confidence": 0.0,
                "face_image": None,
                "bounding_box": None,
                "error": f"Face extraction failed: {str(e)}"
            }


face_extraction_service = FaceExtractionService()
