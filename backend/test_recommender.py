import asyncio
from app.services.course_catalog_service import get_recommendations

res = get_recommendations(
    category="核心課程",
    needed_credits=2.0,
    enrolled_courses=[{"name": "簡帛文獻導讀 Early Chinese Bamboo and Silk Manuscripts Guilded Reading", "offering_dept": ""}]
)
for c in res[:3]:
    print(c["name"], c["time"])
