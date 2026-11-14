import subprocess
import pypdf

html = """<!DOCTYPE html>
<html>
<head>
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 18mm 18mm 18mm;
    @top-left {
      content: 'Build and Beyond 2026 — Hackathon Final Report';
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 8pt;
      color: #64748b;
    }
    @bottom-left {
      content: 'WeGrow Architects | Bangalore Institute of Technology';
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 8pt;
      color: #64748b;
    }
    @bottom-right {
      content: 'Page ' counter(page) ' of ' counter(pages);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 8pt;
      color: #64748b;
    }
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #1e293b;
  }
</style>
</head>
<body>
<h1>Page 1</h1>
<p>Content on page 1...</p>
<div style="page-break-before: always;"></div>
<h1>Page 2</h1>
<p>Content on page 2...</p>
</body>
</html>"""

with open(r"c:\Crestix Probe\test_paged_media.html", "w", encoding="utf-8") as f:
    f.write(html)

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pdf_path = r"c:\Crestix Probe\test_paged_media.pdf"
cmd = [chrome_exe, "--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", f"--print-to-pdf={pdf_path}", r"c:\Crestix Probe\test_paged_media.html"]
subprocess.run(cmd, capture_output=True)

r = pypdf.PdfReader(pdf_path)
print("Page 1:")
print(r.pages[0].extract_text())
print("Page 2:")
print(r.pages[1].extract_text())
