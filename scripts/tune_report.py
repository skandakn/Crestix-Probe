import subprocess
import os
import pypdf
import shutil

html_file = r"c:\Crestix Probe\scripts\report_illustrated.html"
with open(html_file, "r", encoding="utf-8") as f:
    c = f.read()

# Make Page 1 slightly tighter so the footer displays cleanly on Page 1
c = c.replace("font-size: 22pt;", "font-size: 20pt;")
c = c.replace("margin: 0 0 14px 0;", "margin: 0 0 8px 0;")
c = c.replace("padding: 3.5px 8px;", "padding: 2.8px 7px;")
c = c.replace("margin: 12mm 16mm 12mm 16mm;", "margin: 11mm 16mm 11mm 16mm;")

with open(html_file, "w", encoding="utf-8") as f:
    f.write(c)

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pdf_path = r"c:\Crestix Probe\Crestix_Probe_Hackathon_Final_Report.pdf"
cmd = [
    chrome_exe,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_file
]
subprocess.run(cmd, capture_output=True, text=True)

reader = pypdf.PdfReader(pdf_path)
print("Total pages:", len(reader.pages))
for i, page in enumerate(reader.pages):
    txt = page.extract_text().strip()
    last_line = txt.split('\n')[-1]
    print(f"Page {i+1} Footer: {last_line}")

artifact_dir = r"C:\Users\skand\.gemini\antigravity\brain\337f3f7a-f9a0-47b6-aae7-e725d5414de7"
artifact_pdf_path = os.path.join(artifact_dir, "Crestix_Probe_Hackathon_Final_Report.pdf")
shutil.copyfile(pdf_path, artifact_pdf_path)
print(f"Copied to artifact dir successfully! (size: {os.path.getsize(pdf_path):,} bytes)")
