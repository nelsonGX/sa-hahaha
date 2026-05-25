from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Department(Base):
    __tablename__ = 'departments'
    
    id = Column(Integer, primary_key=True)
    code = Column(String(10), unique=True, index=True)
    name = Column(String(100), unique=True, index=True)
    
    rules = relationship("GraduationRule", back_populates="department")
    exclusions = relationship("GEExclusion", back_populates="department")

class GraduationRule(Base):
    __tablename__ = 'graduation_rules'
    
    id = Column(Integer, primary_key=True)
    department_id = Column(Integer, ForeignKey('departments.id'))
    year = Column(Integer, index=True)
    
    # 核心數值
    required_credits = Column(Integer, default=0)
    elective_credits = Column(Integer, default=0)
    total_graduation_credits = Column(Integer, default=0)
    holistic_total_credits = Column(Integer, default=32)
    holistic_core_credits = Column(Integer, default=10)
    basic_skills_credits = Column(Integer, default=12)
    general_education_credits = Column(Integer, default=10)
    emi_course_minimum = Column(Integer, default=0)
    
    # 存放無法被正規化的其他門檻 (JSON字串)
    other_requirements = Column(String)
    
    department = relationship("Department", back_populates="rules")

class GEExclusion(Base):
    __tablename__ = 'ge_exclusions'
    
    id = Column(Integer, primary_key=True)
    department_id = Column(Integer, ForeignKey('departments.id'))
    
    # 例如：自然與科技領域(NT), 人文與藝術領域(PT)
    domain_category = Column(String(50)) 
    
    # 例如：DNTI800443A
    course_code = Column(String(20))
    # 例如：數位攝影與影像處理
    course_name = Column(String(100))
    
    department = relationship("Department", back_populates="exclusions")
