import json
import re
from pathlib import Path
from typing import List, Set
from app.utils.course_utils import normalize_course_name

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
        room = course.get(f"room_{i}", "").strip()
        if weekday and period:
            day_ch = weekday[0] if weekday else ""
            day = _WEEKDAY_MAP.get(day_ch, weekday)
            room_str = f" ({room})" if room else ""
            parts.append(f"{day} {period}{room_str}")
    return " / ".join(parts) if parts else "時間未定"

def get_course_time_string(norm_name: str, department: str = "") -> str:
    """Find a matching course in the catalog and return its formatted time string."""
    courses = _load_catalog()
    for c in courses:
        raw_c_name = c.get("course_name", "").split(" ")[0]
        c_name = normalize_course_name(raw_c_name)
        if c_name == norm_name:
            c_dept = c.get("offering_unit", "")
            # Basic department match if provided
            if not department or department in c_dept or c_dept in department:
                return _format_time(c)
    return ""

PERIODS_ORDER = ["D1", "D2", "D3", "D4", "DN", "D5", "D6", "D7", "D8", "E0", "E1", "E2", "E3", "E4"]

def _parse_time_slots(course: dict) -> Set[str]:
    slots = set()
    for i in ("1", "2", "3"):
        weekday = course.get(f"weekday_{i}", "").strip()
        period = course.get(f"period_{i}", "").strip()
        if weekday and period and period != "-":
            day_ch = weekday[0] if weekday else ""
            if "-" in period:
                start, end = period.split("-", 1)
                try:
                    start_idx = PERIODS_ORDER.index(start)
                    end_idx = PERIODS_ORDER.index(end)
                    if start_idx <= end_idx:
                        for p in PERIODS_ORDER[start_idx:end_idx+1]:
                            slots.add(f"{day_ch}-{p}")
                except ValueError:
                    slots.add(f"{day_ch}-{period}")
            else:
                slots.add(f"{day_ch}-{period}")
    return slots

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

def get_recommendations(category: str, needed_credits: float, department: str = "", passed_courses: List[str] = None, enrolled_courses: list = None) -> list[dict]:
    courses = _load_catalog()
    
    passed_courses = passed_courses or []
    enrolled_courses = enrolled_courses or []
    
    # 正規化使用者已經修過或正在修的課名
    normalized_passed = {normalize_course_name(c) for c in passed_courses}
    
    # enrolled_courses 可能是 Pydantic models 或 dict
    enrolled_info = []
    normalized_enrolled_names = set()
    for ec in enrolled_courses:
        name = getattr(ec, "name", ec.get("name", "")) if isinstance(ec, dict) else ec.name
        dept = getattr(ec, "offering_dept", ec.get("offering_dept", "")) if isinstance(ec, dict) else ec.offering_dept
        norm_name = normalize_course_name(name)
        if norm_name:
            normalized_enrolled_names.add(norm_name)
            enrolled_info.append((norm_name, dept))
            
    all_taken = normalized_passed | normalized_enrolled_names

    # 計算正在修的課的時間，用來判斷衝堂
    busy_periods: Set[str] = set()
    if enrolled_info:
        for c in courses:
            raw_c_name = c.get("course_name", "").split(" ")[0]
            c_name = normalize_course_name(raw_c_name)
            c_dept = c.get("offering_unit", "")
            
            # 若課名相同，進一步比對開課單位，若有提供且不吻合則跳過，避免誤判多個班級的時間
            for e_name, e_dept in enrolled_info:
                if c_name == e_name:
                    if e_dept and e_dept not in c_dept and c_dept not in e_dept:
                        continue # 開課單位明確不符合，跳過這個時段
                    busy_periods.update(_parse_time_slots(c))

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

    results = []
    for c in filtered:
        raw_c_name = c.get("course_name", "").split(" ")[0]
        c_name = normalize_course_name(raw_c_name)
        
        # 1. 剔除已經修過或正在修的課
        if c_name in all_taken:
            continue
            
        # 2. 剔除衝堂的課
        course_slots = _parse_time_slots(c)
        if busy_periods and not course_slots.isdisjoint(busy_periods):
            continue
            
        rec = _to_recommended(c)
        # 3. 剔除沒有名額的課 (選用，目前還是列出但排在後面)
        results.append(rec)

    # 排序：優先推薦名額多的
    results.sort(key=lambda x: x["remaining"], reverse=True)

    # 去除重複 (課程代碼相同者)
    seen_codes = set()
    unique_results = []
    for r in results:
        if r["code"] not in seen_codes:
            unique_results.append(r)
            seen_codes.add(r["code"])

    return unique_results
