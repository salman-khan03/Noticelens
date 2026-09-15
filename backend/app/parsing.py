import io

import pymupdf
import pytesseract
from PIL import Image


class ParseError(ValueError):
    pass


def ocr(image):
    try:
        return pytesseract.image_to_string(image, timeout=15)
    except (pytesseract.TesseractNotFoundError, RuntimeError) as exc:
        raise ParseError(
            "OCR is unavailable or timed out. Upload a text PDF or paste the notice text."
        ) from exc


def parse(data: bytes) -> tuple[str, str]:
    try:
        if data.startswith(b"%PDF"):
            parts = []
            used_ocr = False
            with pymupdf.open(stream=data, filetype="pdf") as doc:
                if doc.needs_pass or not 0 < len(doc) <= 10:
                    raise ParseError("Use an unlocked PDF of 1–10 pages.")
                for page in doc:
                    text = page.get_text()
                    if len(text.strip()) < 20:
                        used_ocr = True
                        if page.rect.width * page.rect.height > 2_000_000:
                            raise ParseError(
                                "PDF page is too large for OCR. Upload a smaller scan."
                            )
                        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5))
                        text = ocr(Image.open(io.BytesIO(pix.tobytes("png"))))
                    parts.append(text)
            text = "\n".join(parts)
            method = "PDF text + OCR" if used_ocr else "PDF text extraction"
        elif data.startswith((b"\x89PNG", b"\xff\xd8")):
            with Image.open(io.BytesIO(data)) as im:
                if im.width * im.height > 20_000_000:
                    raise ParseError("Image exceeds 20 megapixels. Upload a smaller image.")
                text = ocr(im)
            method = "Image OCR • review extracted text"
        else:
            raise ParseError("Unsupported file. Upload a PDF, PNG, or JPEG, or paste text.")
        if not 25 <= len(text.strip()) <= 60000:
            raise ParseError(
                "Not enough readable text, or notice is too long. Paste 25–60,000 characters instead."
            )
        return text, method
    except ParseError:
        raise
    except Exception as exc:
        raise ParseError(
            "Could not read this document. Try an unlocked PDF, a clearer image, or paste text."
        ) from exc
