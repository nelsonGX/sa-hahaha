import re

def normalize_course_name(name: str) -> str:
    """
    移除課程名稱中的標記 (EMI, 網, 英) 並統一格式，用於重複修習判定。
    """
    if not name:
        return ""
    # 移除 (EMI) 或 英-專業 等標記，並處理後綴如 -英, -網, -英-網
    normalized = name.replace("英-專業", "").replace("英-專", "").replace(" ", "").strip()
    # 使用正則表示式移除結尾的 (EMI), -英, -網, -英-網
    normalized = re.sub(r"(-英-網|-網-英|-英|-網|\(EMI\)|EMI)$", "", normalized).strip()
    return normalized

def get_course_status(score: str) -> str:
    """
    根據成績字串判定修課狀態。
    """
    normalized_score = score.strip()
    if not normalized_score or normalized_score == "未評定成績": 
        return "enrolled"
    if normalized_score.isdigit(): 
        return "passed" if int(normalized_score) >= 60 else "failed"
    if normalized_score in ["抵免", "及格", "通過"]: 
        return "passed"
    return "failed"
