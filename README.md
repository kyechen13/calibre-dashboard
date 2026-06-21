# 我的書庫 Dashboard

封面牆瀏覽：https://kyechen13.github.io/calibre-dashboard/

## 給 AI／程式化存取用

`index.html` 是用 JavaScript 動態抓 `library.json` 來渲染畫面的，
單純爬取/WebFetch 首頁網址只會看到空的 HTML 骨架，看不到書目資料。

**要查書目資料（書名、作者、quality_rating、rating_label、key_review、tags、date_added），
請抓這個 CSV 網址，不要抓首頁，也不要抓 library.json：**

```
https://kyechen13.github.io/calibre-dashboard/library_for_ai.csv
```

這份 CSV 只保留推薦用得到的欄位（拿掉 id、pubdate、封面路徑），
檔案大小只有 library.json 的一半左右，讀取時占用的 token 更少。
`library.json` 含有完整欄位（含封面路徑），是給 dashboard 網頁渲染用的，AI 不需要讀它。

## 更新資料

書庫有新書或評分變動後，在這台 Mac 執行：

```bash
cd ~/Documents/Claude/calibre-dashboard
python3 export_dashboard.py
git add -A && git commit -m "更新書庫資料" && git push
```
