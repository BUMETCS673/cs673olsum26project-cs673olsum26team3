"""Generate the sample fixture files needed by the test suite.

Run once before running tests:
    python create_fixtures.py

Generates inside tests/fixtures/:
  sample_valid.pdf  - minimal 1-page PDF (parseable by pdf-parse-fork)
  sample_valid.png  - minimal 1x1 white PNG (processable by Tesseract)
  sample_valid.jpg  - minimal 1x1 white JPEG (processable by Tesseract)

The oversized and invalid-extension files are already committed as part of
the repository (created once via PowerShell during framework setup).
"""
import base64
import struct
import zlib
from pathlib import Path

FIXTURES = Path(__file__).parent / "fixtures"


def _create_minimal_pdf() -> bytes:
    """Return bytes of a minimal but valid 1-page PDF with extractable text."""
    content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Contents 4 0 R
  /Resources << /Font << /F1 5 0 R >> >>
>>
endobj

4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Test Document) Tj ET
endstream
endobj

5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj
"""
    offsets = []
    obj_starts = []
    pos = 0
    lines = content.split(b"\n")
    rebuilt = b""
    for line in lines:
        rebuilt += line + b"\n"
        if line.endswith(b"obj"):
            obj_starts.append(len(rebuilt) - len(line) - 1)

    # Build properly-offsetted PDF
    body = content
    xref_offset = len(body)

    # Compute actual byte offsets for each object
    obj_offsets: dict[int, int] = {}
    current = 0
    for byte in body.split(b"\n"):
        current += len(byte) + 1
        stripped = byte.strip()
        if stripped and stripped[0:1].isdigit() and b" obj" in stripped:
            obj_num = int(stripped.split(b" ")[0])
            obj_offsets[obj_num] = current - len(byte) - 1

    xref = f"xref\n0 6\n0000000000 65535 f \n"
    for i in range(1, 6):
        offset = body.find(f"\n{i} 0 obj\n".encode())
        if offset == -1:
            offset = body.find(f"{i} 0 obj\n".encode())
        xref += f"{offset:010d} 00000 n \n"

    trailer = (
        f"trailer\n<< /Size 6 /Root 1 0 R >>\n"
        f"startxref\n{len(body)}\n%%EOF\n"
    )
    return body + xref.encode() + trailer.encode()


def _create_minimal_png() -> bytes:
    """Return bytes of a valid 1x1 white pixel PNG."""
    def _chunk(chunk_type: bytes, data: bytes) -> bytes:
        c = chunk_type + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = _chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
    # 1x1 white pixel: filter byte 0 + RGB(255,255,255)
    raw_row = b"\x00\xff\xff\xff"
    idat = _chunk(b"IDAT", zlib.compress(raw_row))
    iend = _chunk(b"IEND", b"")
    return signature + ihdr + idat + iend


def _create_minimal_jpg() -> bytes:
    """Return bytes of a valid 1x1 white pixel JPEG (from a known-good base64 blob)."""
    b64 = (
        "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDB"
        "kSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBD"
        "AQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMj"
        "IyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/"
        "EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/"
        "aAAwDAQACEQMRAD8AJQAB/9k="
    )
    return base64.b64decode(b64)


def main() -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)

    pdf_path = FIXTURES / "sample_valid.pdf"
    if not pdf_path.exists():
        pdf_path.write_bytes(_create_minimal_pdf())
        print(f"Created {pdf_path} ({pdf_path.stat().st_size} bytes)")
    else:
        print(f"Already exists: {pdf_path}")

    png_path = FIXTURES / "sample_valid.png"
    if not png_path.exists():
        png_path.write_bytes(_create_minimal_png())
        print(f"Created {png_path} ({png_path.stat().st_size} bytes)")
    else:
        print(f"Already exists: {png_path}")

    jpg_path = FIXTURES / "sample_valid.jpg"
    if not jpg_path.exists():
        jpg_path.write_bytes(_create_minimal_jpg())
        print(f"Created {jpg_path} ({jpg_path.stat().st_size} bytes)")
    else:
        print(f"Already exists: {jpg_path}")

    print("\nFixtures ready.")


if __name__ == "__main__":
    main()
