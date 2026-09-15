"""Generate reproducible fictional PDFs for upload demos."""

import json

import pymupdf

from .proof import ROOT


def run():
    for sample in json.loads((ROOT / "sample-data/notices.json").read_text()):
        with pymupdf.open() as doc:
            page = doc.new_page()
            page.insert_textbox(
                pymupdf.Rect(60, 60, 530, 780), sample["text"], fontsize=12, fontname="helv"
            )
            doc.set_metadata(
                {"title": "SYNTHETIC — " + sample["title"], "author": "NoticeLens demo"}
            )
            doc.save(ROOT / "sample-data" / (sample["id"] + ".pdf"))


if __name__ == "__main__":
    run()
