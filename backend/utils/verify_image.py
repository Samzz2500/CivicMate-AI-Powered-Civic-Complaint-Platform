from nudenet import NudeDetector
import sys
import json

detector = NudeDetector()

NSFW_CLASSES = [
    "EXPOSED_GENITALIA_FEMALE", "EXPOSED_GENITALIA_MALE",
    "EXPOSED_BREAST_FEMALE", "FEMALE_BREAST_COVERED",
    "EXPOSED_BUTTOCKS", "EXPOSED_ANUS", "BELLY_EXPOSED",
    "ARMPITS_EXPOSED", "COVERED_GENITALIA_FEMALE"
]

def main():
    try:
        image_path = sys.argv[1]
        detections = detector.detect(image_path)
        
        # Get all NSFW-related detections
        nsfw_detections = [
            {
                "class": d["class"],
                "score": float(d["score"]),
                "box": [int(coord) for coord in d["box"]]
            }
            for d in detections
            if d["class"] in NSFW_CLASSES
        ]
        
        # Calculate maximum NSFW score
        unsafe_score = max(
            (d["score"] for d in nsfw_detections),
            default=0.0
        )
        
        print(json.dumps({
            "nsfw": unsafe_score >= 0.3,
            "unsafe": unsafe_score,
            "detections": nsfw_detections,
            "path": image_path,
            "error": None
        }))
        
    except Exception as e:
        print(json.dumps({
            "nsfw": False,
            "unsafe": 0.0,
            "detections": [],
            "path": sys.argv[1] if len(sys.argv) > 1 else "unknown",
            "error": str(e)
        }))

if __name__ == "__main__":
    main()