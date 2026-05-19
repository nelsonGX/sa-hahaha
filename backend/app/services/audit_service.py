import json
import os
from pathlib import Path
from app.schemas.credit_schema import (
    CourseRecord, CreditSummary, 
    CreditCategory, GeneralEducationCredit, DetailedRequirements
)

class AuditService:
    def __init__(self):
        self.rules_dir = Path(__file__).parent.parent / "data" / "rules"
        
    def _load_rules(self, department_name: str, enrollment_year: int = None) -> dict:
        # 優先尋找帶年份的規則，如果沒有則找系所通用規則
        year_rule_path = self.rules_dir / f"{department_name}_{enrollment_year}.json"
        if enrollment_year and year_rule_path.exists():
            with open(year_rule_path, "r", encoding="utf-8") as f:
                return json.load(f)
                
        general_rule_path = self.rules_dir / f"{department_name}.json"
        if general_rule_path.exists():
            with open(general_rule_path, "r", encoding="utf-8") as f:
                return json.load(f)
                
        # 如果找不到規則，回傳預設的空規則或拋出例外
        return None

    def calculate_credit_summary(self, records: list[CourseRecord], department_name: str, enrollment_year: int) -> tuple[CreditSummary, list[str]]:
        warnings = []
        rules = self._load_rules(department_name, enrollment_year)
        
        def get_status(score: str):
            normalized_score = score.strip()
            if not normalized_score or normalized_score == "未評定成績": return "enrolled"
            if normalized_score.isdigit(): return "passed" if int(normalized_score) >= 60 else "failed"
            if normalized_score in ["抵免", "及格", "通過"]: return "passed"
            return "failed"

        # 計數器
        earned_total = 0
        req_earned = 0
        ele_earned = 0
        dept_ele_earned = 0 # 系選修
        ge_earned = 0
        holistic_core_earned = 0
        basic_skills_earned = 0
        pe_count = 0
        emi_passed_count = 0

        # 初始化預設值
        HOLISTIC_CORE_KEYWORDS = rules.get("holistic_core_keywords", []) if rules else ["大學入門", "人生哲學", "專業倫理", "企業倫理"]
        BASIC_SKILLS_KEYWORDS = rules.get("basic_skills_keywords", []) if rules else ["國文", "外語", "外國語文"]
        PE_KEYWORDS = rules.get("pe_keywords", []) if rules else ["體育"]
        DEPT_CODE = rules.get("dept_code", "40") # 資管系代碼預設 40
        
        ge_domains_config = rules.get("general_education_domains", {
            "人文藝術領域": 4, "自然科技領域": 4, "社會科學領域": 4
        }) if rules else {
            "人文藝術領域": 4, "自然科技領域": 4, "社會科學領域": 4
        }
        
        ge_domains = {
            domain: CreditCategory(earned=0, target=target)
            for domain, target in ge_domains_config.items()
        }

        passed_courses = {r.course_name for r in records if get_status(r.score) == "passed"}
        enrolled_courses = {r.course_name for r in records if get_status(r.score) == "enrolled"}
        failed_courses = {r.course_name for r in records if get_status(r.score) == "failed" and r.score != "停修"}

        # 前綴代碼對照表
        PREFIX_TO_DOMAIN_KEYWORD = {
            "PT": "人文",
            "NT": "自然",
            "ST": "社會",
            "DT": "永續"
        }

        # 關鍵字強制對照表 (當無代碼時使用)
        KEYWORD_REDIRECTION = {
            "資訊科技": "自然",
            "歷史": "人文",
            "文化": "人文",
            "哲學": "人文",
            "藝術": "人文",
            "社會": "社會",
            "經濟": "社會",
            "法律": "社會",
            "生態": "自然",
            "科技": "自然"
        }

        for r in records:
            r.status = get_status(r.score)
            
            if r.status == "failed":
                r.audit_category = "不及格/停修"
                continue
            
            is_passed_course = (r.status == "passed")
            is_pe_course = "體育" in (r.offering_dept or "") if r.offering_dept else any(k in r.course_name for k in PE_KEYWORDS)

            # 軍訓/全民國防不計分
            if any(k in r.course_name for k in ["軍訓", "全民國防", "操行"]):
                r.audit_category = "不計畢業學分"
                continue

            if is_pe_course:
                r.audit_category = "核心課程(體育)"
                if is_passed_course:
                    pe_count += 1
                    holistic_core_earned += r.credits
                    # 體育 0 學分不計入總數，但如果有人修有學分的體育（通常是選修），則計入
                    earned_total += r.credits
            elif any(k in r.course_name for k in HOLISTIC_CORE_KEYWORDS):
                r.audit_category = "核心課程"
                if is_passed_course:
                    holistic_core_earned += r.credits
                    earned_total += r.credits
            elif ("FT" in (r.offering_dept or "")) or any(k in r.course_name for k in BASIC_SKILLS_KEYWORDS):
                r.audit_category = "基本能力課程"
                if is_passed_course:
                    basic_skills_earned += r.credits
                    earned_total += r.credits
            elif "通識" in r.category:
                r.audit_category = "通識課程"
                
                # 取得大類代碼 (優先級 1: PT/NT/ST/DT)
                ge_prefix = ""
                # 檢查 offering_dept 或 category 括號內容
                search_targets = [r.offering_dept, r.category]
                for target in search_targets:
                    if not target: continue
                    # 尋找獨立的代碼或是冒號後的代碼
                    parts = target.replace("(", " ").replace(")", " ").replace(":", " ").split()
                    for p in parts:
                        p_upper = p[:2].upper()
                        if p_upper in PREFIX_TO_DOMAIN_KEYWORD:
                            ge_prefix = p_upper
                            break
                    if ge_prefix: break

                matched_domain = None
                if ge_prefix:
                    keyword = PREFIX_TO_DOMAIN_KEYWORD[ge_prefix]
                    for domain in ge_domains:
                        if keyword in domain:
                            matched_domain = domain
                            break
                
                # 優先級 2: 關鍵字強制對照 (例如: 資訊科技)
                if not matched_domain:
                    for kw, domain_key in KEYWORD_REDIRECTION.items():
                        if kw in r.category or kw in (r.offering_dept or ""):
                            # 尋找包含 domain_key 的領域
                            for domain in ge_domains:
                                if domain_key in domain:
                                    matched_domain = domain
                                    break
                        if matched_domain: break
                
                # 優先級 3: 原始分類名稱匹配 (人文/自然/社會)
                if not matched_domain:
                    for domain in ge_domains:
                        if domain[:2] in r.category:
                            matched_domain = domain
                            break
                
                if matched_domain:
                    # 整理顯示名稱，優先從類別字串中提取詳細資訊
                    sub_info = ""
                    if ":" in r.category:
                        sub_info = r.category.split(":")[-1].split("[")[0].strip()
                    elif r.offering_dept:
                        sub_info = r.offering_dept
                        
                    r.audit_category = f"通識-{matched_domain[:2]} ({sub_info})" if sub_info else f"通識-{matched_domain[:2]}"
                    if is_passed_course:
                        ge_domains[matched_domain].earned += r.credits
                        ge_earned += r.credits
                        # 注意：全人教育超修不計入總畢業學分的邏輯在後續處理
                else:
                    r.audit_category = "通識-其他"
                    if is_passed_course:
                        ge_earned += r.credits
            elif "必修" in r.category:
                r.audit_category = "必修"
                if is_passed_course:
                    req_earned += r.credits
                    earned_total += r.credits
            elif "選修" in r.category:
                r.audit_category = "選修"
                # 檢查是否為系選修 (開課單位包含系代碼或是系名)
                if DEPT_CODE in (r.offering_dept or "") or "資訊管理" in (r.offering_dept or ""):
                    r.audit_category = "系選修"
                    if is_passed_course:
                        dept_ele_earned += r.credits
                
                if is_passed_course:
                    ele_earned += r.credits
                    earned_total += r.credits
            else:
                r.audit_category = "其他"

            # 檢查 EMI (英-專業)
            if "英-專業" in r.category or "英-專業" in (r.offering_dept or "") or "英-專業" in r.course_name or "[英-專業]" in r.category:
                if "(EMI)" not in r.audit_category:
                    r.audit_category += " (EMI)"
                if is_passed_course:
                    emi_passed_count += 1
            
            # 檢查程式設計標記 (程)
            if "程" in r.category or "[程]" in r.category:
                if "(程式)" not in r.audit_category:
                    r.audit_category += " (程式)"

        # 處理全人教育上限邏輯
        # 1. 計算各領域有效學分 (不超過該領域 target)
        valid_ge_total = 0
        for domain, cat in ge_domains.items():
            valid_ge_total += min(cat.earned, cat.target)
        
        # 2. 基本能力與核心課程也通常有上限 (根據規則)
        valid_core = min(holistic_core_earned, rules.get("holistic_core_credits", 8)) if rules else holistic_core_earned
        valid_basic = min(basic_skills_earned, rules.get("basic_skills_credits", 12)) if rules else basic_skills_earned
        
        # 3. 總全人有效學分 (通常上限 32)
        total_holistic_limit = rules.get("holistic_total_credits", 32) if rules else 32
        actual_holistic_valid = min(valid_ge_total + valid_core + valid_basic, total_holistic_limit)
        
        # 更新總學分：總學分 = 必修 + 選修 + 有效全人
        earned_total = req_earned + ele_earned + actual_holistic_valid

        # 擋修預警 (根據 JSON 規則動態計算)
        if rules and "prerequisites" in rules:
            for pre_rule in rules["prerequisites"]:
                target_course = pre_rule.get("target")
                required_passed = pre_rule.get("required_passed", [])
                
                if required_passed:
                    # 檢查所有先修課是否皆已過關
                    all_passed = all(rp in passed_courses for rp in required_passed)
                    any_enrolled = any(rp in enrolled_courses for rp in required_passed)
                    
                    if not all_passed:
                        if any_enrolled and pre_rule.get("warning_enrolled"):
                            warnings.append(pre_rule["warning_enrolled"])
                        elif pre_rule.get("warning_not_taken"):
                            warnings.append(pre_rule["warning_not_taken"])
                
                # 特定課程被當的後果
                if "fail_consequence" in pre_rule and any(target_course in c for c in failed_courses):
                    warnings.append(pre_rule["fail_consequence"])

        details = None
        if rules:
            details = DetailedRequirements(
                required_courses=CreditCategory(earned=req_earned, target=rules.get("required_credits", 64)),
                elective_courses=CreditCategory(earned=ele_earned, target=rules.get("elective_credits", 32)),
                holistic_education=CreditCategory(
                    earned=actual_holistic_valid, 
                    target=rules.get("holistic_total_credits", 32)
                ),
                holistic_core=CreditCategory(earned=holistic_core_earned, target=rules.get("holistic_core_credits", 8)),
                basic_skills=CreditCategory(earned=basic_skills_earned, target=rules.get("basic_skills_credits", 12)),
                general_ed=GeneralEducationCredit(
                    earned=ge_earned, 
                    target=rules.get("general_education_credits", 12), 
                    domains=ge_domains
                ),
                pe_semesters=CreditCategory(earned=pe_count, target=rules.get("pe_semesters", 4)),
                emi_courses=CreditCategory(earned=emi_passed_count, target=rules.get("emi_course_minimum", 0)) if "emi_course_minimum" in rules else None
            )

        summary = CreditSummary(
            total_earned=earned_total,
            details=details
        )
        return summary, warnings
