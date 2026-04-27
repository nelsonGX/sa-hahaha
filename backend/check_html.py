from bs4 import BeautifulSoup
with open("estu_result.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

tables = soup.find_all("table")
for i, t in enumerate(tables):
    print(f"Table {i}:")
    rows = t.find_all("tr")
    if rows:
        headers = [th.text.strip().replace("\n", "").replace(" ", "") for th in rows[0].find_all(["th", "td"])]
        print(f"  Headers: {headers}")
        if len(rows) > 1:
            cols = [td.text.strip().replace("\n", "").replace(" ", "") for td in rows[1].find_all(["td"])]
            print(f"  Row 1: {cols}")
