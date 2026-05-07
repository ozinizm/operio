"""
Creates minimal real placeholder files for seeded demo FileAsset records.
The seed_demo.py stores file_path = 'storage/seed/...' (relative to backend/).
The download endpoint does os.path.exists(file_asset.file_path), so files must exist there.
"""
import os
import zipfile
import io

seed_dir = os.path.join("storage", "seed")
os.makedirs(seed_dir, exist_ok=True)

# ── 1. Minimal valid PDF ─────────────────────────────────────────────────────
pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 18 Tf 100 700 Td (Operio Demo Dosyasi) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000360 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
441
%%EOF
"""

pdf_path = os.path.join(seed_dir, "mutfak_v2.pdf")
with open(pdf_path, "wb") as f:
    f.write(pdf_content)
print(f"Created: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")

# ── 2. Minimal valid XLSX ────────────────────────────────────────────────────
content_types = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/xl/workbook.xml" '
    'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    '<Override PartName="/xl/worksheets/sheet1.xml" '
    'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    '</Types>'
)

rels = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" '
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
    'Target="xl/workbook.xml"/>'
    '</Relationships>'
)

workbook = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    '<sheets><sheet name="Lansman" sheetId="1" r:id="rId1"/></sheets>'
    '</workbook>'
)

wb_rels = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" '
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
    'Target="worksheets/sheet1.xml"/>'
    '</Relationships>'
)

sheet = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    '<sheetData>'
    '<row r="1"><c r="A1" t="inlineStr"><is><t>Operio Lansman Plan Demo</t></is></c></row>'
    '<row r="2"><c r="A2" t="inlineStr"><is><t>Bu dosya demo amacli olusturulmustur.</t></is></c></row>'
    '</sheetData>'
    '</worksheet>'
)

buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("xl/workbook.xml", workbook)
    z.writestr("xl/_rels/workbook.xml.rels", wb_rels)
    z.writestr("xl/worksheets/sheet1.xml", sheet)

xlsx_path = os.path.join(seed_dir, "lansman.xlsx")
with open(xlsx_path, "wb") as f:
    f.write(buf.getvalue())
print(f"Created: {xlsx_path} ({os.path.getsize(xlsx_path)} bytes)")

print("\nAll seed placeholder files created successfully.")
