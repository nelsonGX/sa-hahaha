import json
import os
from pathlib import Path
from app.schemas.credit_schema import (
    CourseRecord, CreditSummary, 
    CreditCategory, GeneralEducationCredit, DetailedRequirements
)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Department, GraduationRule, GEExclusion
from app.utils.course_utils import normalize_course_name, get_course_status
import re

DB_PATH = "sqlite:///app/data/sa_hahaha.db"

class AuditService:
    def __init__(self):
        self.engine = create_engine(DB_PATH)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.rules_dir = Path(__file__).parent.parent / "data" / "rules"
        
    def _load_rules(self, department_name: str, enrollment_year: int = None) -> dict:
        session = self.SessionLocal()
        try:
            # 找到對應系所
            dept = session.query(Department).filter_by(name=department_name).first()
            if not dept:
                # 嘗試模糊比對 (例如 "資訊管理" 找到 "資訊管理學系")
                dept = session.query(Department).filter(Department.name.like(f"%{department_name}%")).first()
                if not dept:
                    return None
            
            # 尋找該學年度的規則，若無則降級找最近的一年，或隨便抓一年當預設
            rule = session.query(GraduationRule).filter_by(department_id=dept.id, year=enrollment_year).first()
            if not rule:
                 rule = session.query(GraduationRule).filter_by(department_id=dept.id).order_by(GraduationRule.year.desc()).first()
            
            if not rule:
                 return None
                 
            # 將 ORM Object 轉回 Dict 格式，相容後面的舊邏輯
            other_reqs = []
            if rule.other_requirements:
                try:
                    other_reqs = json.loads(rule.other_requirements)
                except:
                    pass
            
            return {
                "dept_code": dept.code or "",
                "department_name": dept.name,
                "required_credits": rule.required_credits,
                "elective_credits": rule.elective_credits,
                "total_graduation_credits": rule.total_graduation_credits,
                "holistic_total_credits": rule.holistic_total_credits,
                "holistic_core_credits": rule.holistic_core_credits,
                "basic_skills_credits": rule.basic_skills_credits,
                "general_education_credits": rule.general_education_credits,
                "emi_course_minimum": rule.emi_course_minimum,
                "other_requirements": other_reqs
            }
        finally:
            session.close()
            
    def _load_ge_exclusions(self, department_name: str) -> list[str]:
        """從資料庫讀取該系所的通識排除名單"""
        session = self.SessionLocal()
        try:
            dept = session.query(Department).filter(Department.name.like(f"%{department_name}%")).first()
            if not dept: return []
            
            exclusions = session.query(GEExclusion).filter_by(department_id=dept.id).all()
            return [ex.course_name for ex in exclusions]
        finally:
            session.close()

    def calculate_credit_summary(self, records: list[CourseRecord], department_name: str, enrollment_year: int) -> tuple[CreditSummary, list[str]]:
        warnings = []
        rules = self._load_rules(department_name, enrollment_year)
        
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
        distance_learning_credits = 0 # 遠距教學學分

        # 用於檢查重複修習與學年課
        passed_normalized_names = set()
        enrolled_normalized_names = set()
        year_course_terms = {} # dict[norm_name, set(term_type)] 追蹤學年課修習狀況

        # 初始化預設值
        HOLISTIC_CORE_KEYWORDS = rules.get("holistic_core_keywords") or ["大學入門", "人生哲學", "專業倫理", "企業倫理"]
        BASIC_SKILLS_KEYWORDS = rules.get("basic_skills_keywords") or ["國文", "外語", "外國語文"]
        PE_KEYWORDS = rules.get("pe_keywords") or ["體育"]
        DEPT_CODE = rules.get("dept_code") or "40" # 資管系代碼預設 40
        
        ge_domains_config = rules.get("general_education_domains", {
            "人文藝術領域": 4, "自然科技領域": 4, "社會科學領域": 4
        }) if rules else {
            "人文藝術領域": 4, "自然科技領域": 4, "社會科學領域": 4
        }
        
        ge_domains = {
            domain: CreditCategory(earned=0, target=target)
            for domain, target in ge_domains_config.items()
        }

        # 預先載入系選修白名單，避免在迴圈內重複讀取檔案造成效能瓶頸
        im_elective_whitelist = set()
        whitelist_path = self.rules_dir / "im_elective_whitelist.json"
        if whitelist_path.exists():
            try:
                with open(whitelist_path, "r", encoding="utf-8") as f:
                    im_elective_whitelist = set(json.load(f))
            except:
                pass

        # 預先掃描建立集合
        for r in records:
            norm_name = normalize_course_name(r.course_name)
            st = get_course_status(r.score)
            if st == "passed":
                passed_normalized_names.add(norm_name)
                # 記錄學期/學年狀態
                if "學年" in r.term_type:
                    if norm_name not in year_course_terms:
                        year_course_terms[norm_name] = set()
                    year_course_terms[norm_name].add(r.term_type)
            elif st == "enrolled":
                enrolled_normalized_names.add(norm_name)

        passed_courses = {r.course_name for r in records if get_course_status(r.score) == "passed"}
        enrolled_courses = {r.course_name for r in records if get_course_status(r.score) == "enrolled"}
        failed_courses = {r.course_name for r in records if get_course_status(r.score) == "failed" and r.score != "停修"}

        # 讀取通識排除名單
        ge_exclusions = self._load_ge_exclusions(department_name)

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

        # 用於追蹤本迴圈內已計入學分的課，避免同名同屬性的課程重複計分
        counted_courses = set()

        for r in records:
            r.status = get_course_status(r.score)
            
            if r.status == "failed":
                r.audit_category = "不及格/停修"
                continue
                
            norm_name = normalize_course_name(r.course_name)
            is_passed_course = (r.status == "passed")
            is_enrolled_course = (r.status == "enrolled")

            # A. 重複修習剔除 (修訂：允許同名但不同學期，例如國文上下)
            # 使用 (norm_name, semester) 作為唯一鍵值，防止同一學期抓到重複的紀錄
            course_key = (norm_name, r.semester)
            if is_passed_course or is_enrolled_course:
                if course_key in counted_courses:
                    r.audit_category = "重複修習(不計學分)"
                    continue
                counted_courses.add(course_key)

            # E. 檢查系排除通識
            excluded_ge = rules.get("excluded_general_education", []) if rules else []
            # 合併 JSON 規則裡的排除名單和資料庫的排除名單
            combined_exclusions = set(excluded_ge + ge_exclusions)
            if any(k in r.course_name for k in combined_exclusions):
                if "通識" in r.category:
                    # 被系排除的通識，預設轉為一般選修
                    r.category = r.category.replace("通識", "選修")
                    warnings.append(f"ℹ️ 提醒：『{r.course_name}』為本系排除之通識，已自動轉為選修學分。")

            # 判斷是否為體育課
            is_pe_course = False
            if r.offering_dept and "體育" in r.offering_dept:
                is_pe_course = True
            elif any(k in r.course_name for k in PE_KEYWORDS):
                is_pe_course = True
            elif r.credits == 0 and "必" in r.category and not any(k in r.course_name for k in ["導師", "班會", "週會", "軍訓", "國防", "操行"]):
                # 防呆：SIS 歷年成績經常缺少 offering_dept，導致「羽球」、「籃球」等 0 學分必修無法被識別為體育
                is_pe_course = True

            # B. 排除軍訓與體育"選修"
            is_military = any(k in r.course_name for k in ["軍訓", "全民國防", "操行"])
            if is_military:
                r.audit_category = "不計畢業學分"
                continue
                
            if "選修" in r.category and (is_pe_course or is_military or "ATP3" in r.course_name):
                r.audit_category = "不計畢業學分(體育/軍訓選修)"
                continue

            # 計入遠距教學學分
            if getattr(r, 'is_distance_learning', False) and is_passed_course:
                distance_learning_credits += r.credits

            if is_pe_course:
                r.audit_category = "核心課程(體育)"
                if is_passed_course:
                    pe_count += 1
                    holistic_core_earned += r.credits
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
                is_dept_elective = False
                if r.offering_dept and (DEPT_CODE in r.offering_dept or "資訊管理" in r.offering_dept):
                    is_dept_elective = True
                else:
                    # 使用預先載入的白名單回退機制 (Fallback)
                    if norm_name in im_elective_whitelist:
                        is_dept_elective = True

                if is_dept_elective:
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

        # C. 遠距教學 (網修) 上限控管
        if earned_total > 0 and distance_learning_credits > (earned_total / 2):
            warnings.append(f"🚨 警告：您的遠距教學學分 ({distance_learning_credits}) 已超過畢業總學分 ({earned_total}) 之二分之一，超修部分將不計入畢業學分。")

        # D. 學年課未完成防呆
        for course_name, terms in year_course_terms.items():
            if len(terms) == 1 and course_name not in enrolled_normalized_names:
                # 只有 1(學年) 或 2(學年) 且目前沒在修
                warnings.append(f"⚠️ 提醒：學年課『{course_name}』似乎未修畢上下學期，依規定學年課未完成不列計畢業學分。")

        details = None
        if rules:
            # 處理資管系選修拆分邏輯
            dept_electives = None
            non_dept_electives = None
            if "資訊管理" in department_name:
                non_dept_ele_earned = ele_earned - dept_ele_earned
                total_ele_target = rules.get("elective_credits") or 32
                dept_electives = CreditCategory(earned=dept_ele_earned, target=10)
                non_dept_electives = CreditCategory(earned=non_dept_ele_earned, target=total_ele_target - 10)

            details = DetailedRequirements(
                required_courses=CreditCategory(earned=req_earned, target=rules.get("required_credits") or 64),
                elective_courses=CreditCategory(earned=ele_earned, target=rules.get("elective_credits") or 32),
                dept_electives=dept_electives,
                non_dept_electives=non_dept_electives,
                holistic_education=CreditCategory(
                    earned=actual_holistic_valid, 
                    target=rules.get("holistic_total_credits") or 32
                ),
                holistic_core=CreditCategory(earned=holistic_core_earned, target=rules.get("holistic_core_credits") or 8),
                basic_skills=CreditCategory(earned=basic_skills_earned, target=rules.get("basic_skills_credits") or 12),
                general_ed=GeneralEducationCredit(
                    earned=ge_earned, 
                    target=rules.get("general_education_credits") or 10, 
                    domains=ge_domains
                ),
                pe_semesters=CreditCategory(earned=pe_count, target=rules.get("pe_semesters") or 4),
                emi_courses=CreditCategory(earned=emi_passed_count, target=rules.get("emi_course_minimum") or 0) if "emi_course_minimum" in rules else None,
                distance_learning_credits=distance_learning_credits
            )

        summary = CreditSummary(
            total_earned=earned_total,
            details=details
        )
        return summary, warnings
