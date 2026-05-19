import json
import re
from pathlib import Path

COURSES_PATH = Path(__file__).parent.parent.parent / "fju_day_courses.json"

_catalog_cache: list[dict] | None = None

def _load_catalog() -> list[dict]:
    global _catalog_cache
    if _catalog_cache is None:
        with open(COURSES_PATH, encoding="utf-8") as f:
            data = json.load(f)
        _catalog_cache = data["courses"]
    return _catalog_cache

def _parse_capacity(cap_str: str) -> int:
    m = re.search(r"開放：\s*(\d+)", cap_str)
    return int(m.group(1)) if m else 0

def _parse_instructor(instructor: str) -> str:
    if not instructor:
        return ""
    return instructor.split("專長")[0].strip()

_WEEKDAY_MAP = {"一": "週一", "二": "週二", "三": "週三", "四": "週四", "五": "週五", "六": "週六", "日": "週日"}

def _format_time(course: dict) -> str:
    parts = []
    for i in ("1", "2", "3"):
        weekday = course.get(f"weekday_{i}", "").strip()
        period = course.get(f"period_{i}", "").strip()
        if weekday and period:
            day_ch = weekday[0] if weekday else ""
            day = _WEEKDAY_MAP.get(day_ch, weekday)
            parts.append(f"{day} {period}")
    return " / ".join(parts) if parts else "時間未定"

def _to_recommended(course: dict) -> dict:
    seats = _parse_capacity(course.get("capacity_and_attributes", ""))
    return {
        "code": course["course_code"],
        "name": course["course_name"],
        "credits": int(float(course.get("credits", 0))),
        "teacher": _parse_instructor(course.get("instructor", "")),
        "time": _format_time(course),
        "seats": seats,
        "remaining": seats,
    }

_DOMAIN_MAP: dict[str, str] = {
    "通識-自然": "自然科技",
    "通識-人文": "人文藝術",
    "通識-社會": "社會科學",
    "通識-永續": "永續素養",
}

_CORE_KEYWORDS = ["大學入門", "人生哲學", "專業倫理", "企業倫理", "生命教育"]

def get_recommendations(category: str, needed_credits: float, department: str = "") -> list[dict]:
    courses = _load_catalog()

    if category in _DOMAIN_MAP:
        domain_key = _DOMAIN_MAP[category]
        filtered = [
            c for c in courses
            if c.get("course_type") == "通"
            and domain_key in c.get("general_domain_and_cluster", "")
        ]
    elif category == "通識-自由":
        filtered = [c for c in courses if c.get("course_type") == "通"]
    elif category == "核心課程":
        filtered = [
            c for c in courses
            if any(kw in c.get("course_name", "") for kw in _CORE_KEYWORDS)
        ]
    elif category == "國文":
        filtered = [c for c in courses if "國文" in c.get("course_name", "")]
    elif category == "外語":
        filtered = [
            c for c in courses
            if any(kw in c.get("course_name", "") for kw in ["英文", "外語", "外文", "English"])
            or "外國語文" in c.get("offering_unit", "")
        ]
    elif category in ("必修", "選修", "系選修"):
        type_code = "必" if category == "必修" else "選"
        if department:
            # Use first 3 chars of dept name as fuzzy key (e.g. "資訊管" from "資訊管理學系")
            dept_key = department[:3]
            filtered = [
                c for c in courses
                if c.get("course_type") == type_code
                and (dept_key in c.get("department_name", "") or dept_key in c.get("offering_unit", ""))
            ]
        else:
            filtered = [c for c in courses if c.get("course_type") == type_code][:100]
    else:
        filtered = []

    return [_to_recommended(c) for c in filtered]
