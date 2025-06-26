"""
FastAPI backend for Student Score Insight Dashboard

Features:
- Student management (CRUD)
- Score management (CRUD, linked to students)
- Authentication/login (JWT-based)
- Score analytics & trends endpoints
- DB health check endpoint
- Fully documented OpenAPI (Swagger)

PUBLIC_INTERFACE
"""
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import sessionmaker, relationship, Session, declarative_base
import sqlite3
import os

# === CONFIGURATION ===

SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkeychangeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, '../../students_scores.sqlite3')}"
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
OAUTH2_SCHEME = OAuth2PasswordBearer(tokenUrl="auth/token")

# === DATABASE SETUP ===

Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)


# === MODELS ===

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True, nullable=False)
    student_number = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    scores = relationship("Score", back_populates="student", cascade="all,delete")


class Score(Base):
    __tablename__ = "scores"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    subject = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    max_value = Column(Float, nullable=True)  # Allow percentile calculations
    date = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="scores")


# === SCHEMA ===

# AUTH


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserInDB(BaseModel):
    username: str
    hashed_password: str


class UserCreate(BaseModel):
    username: str = Field(..., description="Username for the new user.")
    password: str = Field(..., description="User password.")


# STUDENT


class StudentBase(BaseModel):
    name: str = Field(..., description="Full name of the student.")
    student_number: str = Field(..., description="Unique student number.")
    email: Optional[str] = Field(None, description="Email address of the student.")


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class StudentOut(StudentBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# SCORE


class ScoreBase(BaseModel):
    subject: str = Field(..., description="Subject of the score.")
    value: float = Field(..., description="Score value.")
    max_value: Optional[float] = Field(None, description="Maximum possible score.")
    date: Optional[datetime] = Field(None, description="Date of the score.")


class ScoreCreate(ScoreBase):
    student_id: int = Field(..., description="ID of the student.")


class ScoreUpdate(BaseModel):
    subject: Optional[str] = None
    value: Optional[float] = None
    max_value: Optional[float] = None
    date: Optional[datetime] = None


class ScoreOut(ScoreBase):
    id: int
    student_id: int

    class Config:
        orm_mode = True


# ANALYTICS


class StudentPerformance(BaseModel):
    student_id: int
    name: str
    avg_score: float
    scores: List[ScoreOut]


class SubjectTrendPoint(BaseModel):
    subject: str
    date: datetime
    avg_score: float


class AnalyticsSummary(BaseModel):
    total_students: int
    total_scores: int
    avg_score_overall: float
    top_student: Optional[str]
    top_subject: Optional[str]


# === FASTAPI SETUP ===

app = FastAPI(
    title="Student Score Insight API",
    description=(
        "RESTful API backend for managing students and scores, with analytics, authentication, "
        "and dashboard-ready endpoints."
    ),
    version="1.0.0",
    openapi_tags=[
        {"name": "Auth", "description": "Authentication endpoints."},
        {"name": "Students", "description": "Student management."},
        {"name": "Scores", "description": "Score management."},
        {"name": "Analytics", "description": "Score analytics and performance visualizations."},
        {"name": "Health", "description": "Health check endpoints."},
    ]
)

# Configure CORS (allow all by default, adjust for production!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === UTILS ===


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db_and_seed():
    """Helper to create tables and an initial admin user if not present."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(User).count() == 0:
        # Default user: admin / admin123 (only for demo, require reset in prod!)
        initial = User(username="admin", hashed_password=PWD_CONTEXT.hash("admin123"))
        db.add(initial)
        db.commit()
    db.close()


# PASSWORD UTILS


def verify_password(plain, hashed):
    return PWD_CONTEXT.verify(plain, hashed)


def get_password_hash(password):
    return PWD_CONTEXT.hash(password)


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(OAUTH2_SCHEME), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = get_user_by_username(db, username)
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception


create_db_and_seed()


# === AUTH ROUTES ===

# PUBLIC_INTERFACE
@app.post(
    "/auth/token",
    response_model=Token,
    tags=["Auth"],
    summary="Obtain access token."
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticates user and returns an access token.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# PUBLIC_INTERFACE
@app.post(
    "/auth/register",
    response_model=StudentOut,
    tags=["Auth"],
    summary="Register new admin user."
)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new admin user (for demo purposes, this is not intended for mass registration).
    """
    existing = get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    # Return basic student record sample ONLY for docs sample
    return StudentOut(
        id=0, name="admin", student_number="admin", email="admin@example.com",
        created_at=datetime.utcnow()
    )


# === STUDENT ROUTES ===

# PUBLIC_INTERFACE
@app.post(
    "/students",
    response_model=StudentOut,
    tags=["Students"],
    summary="Create student",
    status_code=201
)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Add a new student.
    """
    if db.query(Student).filter(Student.student_number == student.student_number).first():
        raise HTTPException(status_code=400, detail="Student number already exists.")
    s = Student(**student.dict())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


# PUBLIC_INTERFACE
@app.get(
    "/students",
    response_model=List[StudentOut],
    tags=["Students"],
    summary="List students"
)
def list_students(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Return all students (paginated).
    """
    return db.query(Student).offset(skip).limit(limit).all()


# PUBLIC_INTERFACE
@app.get(
    "/students/{student_id}",
    response_model=StudentOut,
    tags=["Students"],
    summary="Get student"
)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get a student by id.
    """
    s = db.query(Student).get(student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    return s


# PUBLIC_INTERFACE
@app.put(
    "/students/{student_id}",
    response_model=StudentOut,
    tags=["Students"],
    summary="Update student"
)
def update_student(
    student_id: int,
    student: StudentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Update details of a student.
    """
    s = db.query(Student).get(student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    for k, v in student.dict(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


# PUBLIC_INTERFACE
@app.delete(
    "/students/{student_id}",
    tags=["Students"],
    summary="Delete student",
    status_code=204
)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Remove student record.
    """
    s = db.query(Student).get(student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    db.delete(s)
    db.commit()
    return JSONResponse(content={"detail": "Deleted."}, status_code=204)


# === SCORE ROUTES ===

# PUBLIC_INTERFACE
@app.post(
    "/scores",
    response_model=ScoreOut,
    tags=["Scores"],
    summary="Add score",
    status_code=201
)
def add_score(
    score: ScoreCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Add a new score entry for a student.
    """
    if not db.query(Student).get(score.student_id):
        raise HTTPException(status_code=400, detail="Student does not exist.")
    sc = Score(**score.dict())
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return sc


# PUBLIC_INTERFACE
@app.get(
    "/scores",
    response_model=List[ScoreOut],
    tags=["Scores"],
    summary="List scores"
)
def list_scores(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    List all scores (paginated).
    """
    return db.query(Score).offset(skip).limit(limit).all()


# PUBLIC_INTERFACE
@app.get(
    "/scores/{score_id}",
    response_model=ScoreOut,
    tags=["Scores"],
    summary="Get score"
)
def get_score(
    score_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retrieve a score by its ID.
    """
    score = db.query(Score).get(score_id)
    if not score:
        raise HTTPException(status_code=404, detail="Score not found.")
    return score


# PUBLIC_INTERFACE
@app.put(
    "/scores/{score_id}",
    response_model=ScoreOut,
    tags=["Scores"],
    summary="Update score"
)
def update_score(
    score_id: int,
    score: ScoreUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Update a score by its ID.
    """
    sc = db.query(Score).get(score_id)
    if not sc:
        raise HTTPException(status_code=404, detail="Score not found.")
    for k, v in score.dict(exclude_unset=True).items():
        setattr(sc, k, v)
    db.commit()
    db.refresh(sc)
    return sc


# PUBLIC_INTERFACE
@app.delete(
    "/scores/{score_id}",
    tags=["Scores"],
    summary="Delete score",
    status_code=204
)
def delete_score(
    score_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Remove a score record.
    """
    sc = db.query(Score).get(score_id)
    if not sc:
        raise HTTPException(status_code=404, detail="Score not found.")
    db.delete(sc)
    db.commit()
    return JSONResponse(content={"detail": "Deleted."}, status_code=204)


# === ANALYTICS ROUTES ===

# PUBLIC_INTERFACE
@app.get(
    "/analytics/summary",
    response_model=AnalyticsSummary,
    tags=["Analytics"],
    summary="Dashboard summary analytics"
)
def analytics_summary(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns summary statistics for dashboard: totals/counts, averages, top performers, etc.
    """
    total_students = db.query(Student).count()
    total_scores = db.query(Score).count()
    avg_score_overall = db.query(func.avg(Score.value)).scalar() or 0.0

    top_student = (
        db.query(Student.name, func.avg(Score.value).label("avg"))
        .join(Score)
        .group_by(Student.id)
        .order_by(func.avg(Score.value).desc())
        .first()
    )
    top_student_name = top_student[0] if top_student else None

    top_subject = (
        db.query(Score.subject, func.avg(Score.value).label("avg"))
        .group_by(Score.subject)
        .order_by(func.avg(Score.value).desc())
        .first()
    )
    top_subject_name = top_subject[0] if top_subject else None

    return AnalyticsSummary(
        total_students=total_students,
        total_scores=total_scores,
        avg_score_overall=avg_score_overall,
        top_student=top_student_name,
        top_subject=top_subject_name
    )


# PUBLIC_INTERFACE
@app.get(
    "/analytics/students/{student_id}/performance",
    response_model=StudentPerformance,
    tags=["Analytics"],
    summary="Student performance details"
)
def student_performance(
    student_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns analytics for a given student: average score, all scores, etc.
    """
    s = db.query(Student).get(student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    scores = db.query(Score).filter(Score.student_id == student_id).all()
    avg_score = (
        db.query(func.avg(Score.value)).filter(Score.student_id == student_id).scalar() or 0.0
    )
    return StudentPerformance(
        student_id=s.id,
        name=s.name,
        avg_score=avg_score,
        scores=scores
    )


# PUBLIC_INTERFACE
@app.get(
    "/analytics/trends/subject",
    response_model=List[SubjectTrendPoint],
    tags=["Analytics"],
    summary="Subject trend analytics"
)
def subject_trend(
    subject: str = Query(..., description="Subject to plot trends for."),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns a list of average scores in the subject per test date. Used for trendline charting.
    """
    # Get average per day
    rows = (
        db.query(
            Score.subject,
            func.date(Score.date).label("date"),
            func.avg(Score.value).label("avg_score")
        )
        .filter(Score.subject == subject)
        .group_by(func.date(Score.date))
        .order_by(func.date(Score.date))
        .all()
    )
    return [
        SubjectTrendPoint(
            subject=row[0],
            date=datetime.strptime(row[1], "%Y-%m-%d"),
            avg_score=row[2]
        )
        for row in rows
    ]


# PUBLIC_INTERFACE
@app.get(
    "/analytics/distribution/subject",
    tags=["Analytics"],
    summary="Subject score distribution"
)
def subject_distribution(
    subject: str = Query(..., description="Subject for distribution analysis."),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns a histogram/distribution of scores for dashboard charting.
    """
    scores = db.query(Score.value).filter(Score.subject == subject).all()
    values = [v[0] for v in scores]
    # Provide histogram bins for frontend (simple equal-width, 5 bins)
    if not values:
        return {"bins": [0, 20, 40, 60, 80, 100], "counts": [0] * 5}
    min_val = min(0, min(values))
    max_val = max(100, max(values))
    bins = [
        min_val + i * (max_val - min_val) / 5
        for i in range(6)
    ]
    counts = [0] * 5
    for v in values:
        for i in range(5):
            if bins[i] <= v < bins[i + 1]:
                counts[i] += 1
                break
        if v == bins[5]:  # Edge case
            counts[-1] += 1
    return {"bins": bins, "counts": counts}


# === HEALTH CHECK ENDPOINT ===

# PUBLIC_INTERFACE
@app.get(
    "/health",
    tags=["Health"],
    summary="Database health check"
)
def db_health():
    """
    Checks if SQLite DB connection is operational.
    """
    try:
        # Simple SQLite file probe
        conn = sqlite3.connect(os.path.join(BASE_DIR, '../../students_scores.sqlite3'))
        c = conn.cursor()
        c.execute('SELECT 1')
        conn.close()
        return {"status": "ok", "detail": "Database reachable."}
    except Exception as e:
        return JSONResponse(content={"status": "error", "detail": str(e)}, status_code=500)


# PUBLIC_INTERFACE
@app.get(
    "/",
    summary="Basic health check",
    tags=["Health"]
)
def root_health():
    """
    Simple health probe for application.
    """
    return {"message": "Healthy API up & running."}
