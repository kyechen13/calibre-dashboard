#!/usr/bin/env python3
"""
把 Calibre 書庫匯出成 calibre-dashboard/ 裡的靜態資料（library.json + covers/ 縮圖），
供 index.html 在手機/任何瀏覽器上瀏覽封面牆。

直接讀 metadata.db（唯讀模式，Calibre 開著也能讀），不會去動書庫本身。
封面縮圖只會幫「還沒產生過縮圖」的新書產生，不會重新處理整個書庫，加快重複執行的速度。
"""

import csv
import json
import sqlite3
import subprocess
import sys
from pathlib import Path

LIBRARY_PATH = Path("/Users/kyechen/MEGA/MEGAsync/calibre library")
DB_PATH = LIBRARY_PATH / "metadata.db"
DASHBOARD_DIR = Path(__file__).parent
COVERS_DIR = DASHBOARD_DIR / "covers"
JSON_PATH = DASHBOARD_DIR / "library.json"
AI_CSV_PATH = DASHBOARD_DIR / "library_for_ai.csv"
AI_CSV_FIELDS = ["title", "authors", "tags", "quality_rating", "rating_label", "key_review", "reading_status", "date_added"]
THUMB_MAX_DIM = 240

QUERY = """
SELECT
    b.id,
    b.title,
    b.pubdate,
    b.timestamp AS date_added,
    b.has_cover,
    b.path,
    (SELECT group_concat(a.name, ' & ') FROM books_authors_link bal
        JOIN authors a ON a.id = bal.author WHERE bal.book = b.id) AS authors,
    (SELECT group_concat(t.name, '、') FROM books_tags_link btl
        JOIN tags t ON t.id = btl.tag WHERE btl.book = b.id) AS tags,
    (SELECT cc.value FROM books_custom_column_13_link l
        JOIN custom_column_13 cc ON cc.id = l.value WHERE l.book = b.id) AS quality_rating,
    (SELECT cc.value FROM books_custom_column_14_link l
        JOIN custom_column_14 cc ON cc.id = l.value WHERE l.book = b.id) AS rating_label,
    (SELECT cc.value FROM books_custom_column_15_link l
        JOIN custom_column_15 cc ON cc.id = l.value WHERE l.book = b.id) AS key_review,
    (SELECT cc.value FROM books_custom_column_6_link l
        JOIN custom_column_6 cc ON cc.id = l.value WHERE l.book = b.id) AS reading_status
FROM books b
ORDER BY b.id
"""


def make_thumbnail(book_id, src_path):
    dest = COVERS_DIR / f"{book_id}.jpg"
    if dest.exists():
        return True
    if not src_path.exists():
        return False
    result = subprocess.run(
        ["sips", "-Z", str(THUMB_MAX_DIM), str(src_path), "--out", str(dest)],
        capture_output=True, text=True
    )
    return result.returncode == 0


def main():
    COVERS_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(QUERY).fetchall()
    conn.close()

    books = []
    new_thumbs = 0
    for row in rows:
        has_cover = bool(row["has_cover"])
        cover_file = None
        if has_cover:
            src = LIBRARY_PATH / row["path"] / "cover.jpg"
            existed_before = (COVERS_DIR / f"{row['id']}.jpg").exists()
            if make_thumbnail(row["id"], src):
                cover_file = f"covers/{row['id']}.jpg"
                if not existed_before:
                    new_thumbs += 1

        quality_rating = row["quality_rating"]
        books.append({
            "id": row["id"],
            "title": row["title"],
            "authors": row["authors"] or "",
            "tags": row["tags"] or "",
            "pubdate": (row["pubdate"] or "")[:10],
            "date_added": (row["date_added"] or "").split("+")[0],
            "quality_rating": (quality_rating / 2) if quality_rating else None,
            "rating_label": row["rating_label"] or "",
            "key_review": row["key_review"] or "",
            "reading_status": row["reading_status"] or "",
            "cover": cover_file,
        })

    JSON_PATH.write_text(json.dumps(books, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"匯出 {len(books)} 本書到 {JSON_PATH}")
    print(f"新產生 {new_thumbs} 張封面縮圖到 {COVERS_DIR}")

    with AI_CSV_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=AI_CSV_FIELDS)
        writer.writeheader()
        for book in books:
            writer.writerow({k: book[k] for k in AI_CSV_FIELDS})
    print(f"匯出精簡版（給 AI 讀取用）到 {AI_CSV_PATH}")


if __name__ == "__main__":
    main()
