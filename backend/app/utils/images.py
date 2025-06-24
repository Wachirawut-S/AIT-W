from io import BytesIO
from PIL import Image

MAX_SIZE = 200 * 1024  # 200 KB
MAX_DIM = 1080
ALLOWED_FORMATS = {"PNG", "JPEG", "WEBP"}

class ImageValidationError(Exception):
    pass

def process_upload(data: bytes) -> bytes:
    if len(data) > MAX_SIZE:
        raise ImageValidationError("File too large (max 200KB)")

    try:
        img = Image.open(BytesIO(data))
    except Exception:
        raise ImageValidationError("Invalid image file")

    if img.format not in ALLOWED_FORMATS:
        raise ImageValidationError("Unsupported format")

    # ensure square and <=1080x1080
    w, h = img.size
    min_side = min(w, h, MAX_DIM)
    # crop center to square if needed
    left = (w - min_side) // 2
    top = (h - min_side) // 2
    img = img.crop((left, top, left + min_side, top + min_side))
    if min_side > MAX_DIM:
        img = img.resize((MAX_DIM, MAX_DIM))

    out = BytesIO()
    img.save(out, format="WEBP", quality=90)
    return out.getvalue() 