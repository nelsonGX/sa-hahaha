from bs4 import BeautifulSoup

with open("estu_result.html", "r", encoding="utf-8") as f:
    result_soup = BeautifulSoup(f.read(), "html.parser")

tables = result_soup.find_all("table")
target_table = None
for table in tables:
    rows = table.find_all("tr")
    if not rows:
        continue
    headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"])]
    if "NO" in headers and "科目名稱" in headers and "學分" in headers:
        target_table = table
        break
        
if not target_table:
    print("找不到 target_table")
else:
    courses = []
    rows = target_table.find_all("tr")
    headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"])]
    
    # 印出看看表頭到底有什麼，這樣我們比較好對照
    print(f"Headers: {headers}")
    
    for row in rows[1:]:
        cols = row.find_all("td")
        if len(cols) >= 10:
            course_data = {}
            for i, col in enumerate(cols):
                if i < len(headers):
                    course_data[headers[i]] = col.text.strip()
            
            # 科目名稱處理 (移除裡面的 table 標題)
            if '科目名稱' in course_data:
                # 只取最前面的文字，避免包含裡面的隱藏標題
                course_data['科目名稱'] = course_data['科目名稱'].split('\n')[0].strip()
                
            if course_data.get('科目名稱'):
                courses.append(course_data)
                
    for i, c in enumerate(courses):
        print(f"[{i+1}] {c.get('科目名稱')} | 學分: {c.get('學分')} | 選別: {c.get('學生選課設定選別')} | 通識領域: {c.get('通識領域')} | 標記: {c.get('課程標記')}")
