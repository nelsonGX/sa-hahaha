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

if target_table:
    # Use find_all with recursive=False on tbody or table
    tbody = target_table.find("tbody")
    if tbody:
        rows = tbody.find_all("tr", recursive=False)
    else:
        rows = target_table.find_all("tr", recursive=False)
        
    print(f"Found {len(rows)} top-level rows")
    
    headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"], recursive=False)]
    print(f"Headers: {headers}")
    
    for row in rows[1:]:
        cols = row.find_all("td", recursive=False)
        print(f"Row has {len(cols)} direct cols: {[c.text.strip()[:15] for c in cols]}")
        
