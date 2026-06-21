# 我的書庫 Dashboard

封面牆瀏覽：https://kyechen13.github.io/calibre-dashboard/

## 給 AI／程式化存取用

`index.html` 是用 JavaScript 動態抓 `library.json` 來渲染畫面的，
單純爬取/WebFetch 首頁網址只會看到空的 HTML 骨架，看不到書目資料。

**要查書目資料（書名、作者、quality_rating、rating_label、key_review、tags、date_added），
請直接抓這個 JSON 網址，不要抓首頁：**

```
https://kyechen13.github.io/calibre-dashboard/library.json
```

這是一份純 JSON，不需要執行 JavaScript 就能讀到完整資料。

## 更新資料

書庫有新書或評分變動後，在這台 Mac 執行：

```bash
cd ~/Documents/Claude/calibre-dashboard
python3 export_dashboard.py
git add -A && git commit -m "更新書庫資料" && git push
```
