# FEE-MENOUF Smart University Platform — AI Module Documentation

## Overview

The AI Engine is a Python-based microservice built with FastAPI that provides intelligent capabilities to the platform: a conversational AI assistant, RAG-based knowledge retrieval, automated lecture and exam scheduling, and student risk prediction.

## AI Assistant Capabilities

The AI assistant supports students, faculty, and administrators with:

| Capability              | Description                                           |
|-------------------------|-------------------------------------------------------|
| Course Information      | Prerequisites, syllabi, schedules, materials          |
| Grade Inquiries         | Current grades, GPA, CGPA, transcript requests        |
| Schedule Queries        | Class timetables, exam schedules, room information    |
| University Policies     | Regulations, attendance rules, grading policies       |
| Academic Guidance       | Course registration advice, program requirements      |
| Administrative Tasks    | Form submissions, document requests, leave requests   |
| Notification Summary    | Unread notifications, announcements, deadlines        |
| Multi-language          | Full Arabic (AR) and English (EN) support             |

## RAG System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          RAG Pipeline                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Query                                                         │
│      │                                                              │
│      ▼                                                              │
│  ┌──────────────┐      ┌──────────────────┐      ┌──────────────┐  │
│  │ Query        │─────►│ Intent           │─────►│ Query        │  │
│  │ Preprocessor │      │ Classifier       │      │ Expansion    │  │
│  └──────────────┘      └──────────────────┘      └──────┬───────┘  │
│                                                         │          │
│                                                         ▼          │
│  ┌──────────────┐      ┌──────────────────┐      ┌──────────────┐  │
│  │ Response     │◄─────│ LLM Inference    │◄─────│ Context       │  │
│  │ Formatter    │      │ (GPT-4o)         │      │ Assembly     │  │
│  └──────────────┘      └──────────────────┘      └──────┬───────┘  │
│                                                         │          │
│                                                ┌────────▼───────┐  │
│                                                │ Vector Search  │  │
│                                                │ (ChromaDB)     │  │
│                                                └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Components

#### Document Processor (`app/rag/document_processor.py`)
- Handles document ingestion: PDFs, DOCX, markdown, plain text
- Chunks documents using recursive character text splitter (chunk_size=1000, overlap=200)
- Extracts metadata (source, type, date, department)
- Stores processed chunks in vector database

#### Embeddings (`app/rag/embeddings.py`)
- Primary: OpenAI `text-embedding-3-small` (1536 dimensions)
- Fallback: Sentence Transformers `all-MiniLM-L6-v2` (384 dimensions)
- Batch processing with rate limiting
- Caching layer for frequently accessed embeddings

#### Vector Store (`app/rag/vector_store.py`)
- **ChromaDB** as the vector database (persistent at `data/chromadb/`)
- Supports: cosine similarity, MMR search, filter by metadata
- Index type: IVFFlat (Inverted File with Flat indexing)
- Automatic re-indexing on new document addition

#### RAG Engine (`app/rag/rag_engine.py`)
- Orchestrates the full RAG pipeline
- Retrieval: Top-K (default 5) relevant document chunks
- Context assembly: Truncates to fit model context window (max 8000 tokens)
- Prompt construction with system message, context, and user query
- Response generation with citation of sources

## Lecture Scheduler Algorithm

Located at `ai-engine/app/scheduler/lecture_scheduler.py`.

### Approach: Constraint Satisfaction Problem (CSP) + Genetic Algorithm

#### Hard Constraints (Must Satisfy)
1. No two lectures for the same student group at the same time
2. No two lectures for the same professor at the same time
3. Room capacity >= enrolled students
4. Room assigned to only one lecture per time slot
5. Lectures scheduled within available days (Sat-Thu for FEE-MENOUF)
6. Lab sessions scheduled only in lab-equipped rooms

#### Soft Constraints (Optimize For)
1. Minimize gaps between lectures for same group (compact schedule)
2. Prefer morning slots (8:00-12:00) for theoretical lectures
3. Avoid scheduling more than 3 consecutive lectures for same group
4. Respect professor time preferences (morning/afternoon)
5. Balance course distribution across weekdays
6. Minimize room changes between consecutive slots

#### Algorithm Steps

```
1. Initialize population with random feasible schedules
2. Evaluate fitness based on soft constraint satisfaction
3. Selection: Tournament selection (size=3)
4. Crossover: Order-preserving crossover of time assignments
5. Mutation: Swap two lectures with probability 0.1
6. Elitism: Keep top 10% solutions
7. Repeat 2-6 for 500 generations or until convergence
8. Return best solution
```

## Exam Scheduler Algorithm

Located at `ai-engine/app/scheduler/exam_scheduler.py`.

### Approach: CSP with Backtracking + Local Search

#### Hard Constraints
1. No student has two exams simultaneously
2. Each exam assigned to a suitable room (capacity + type)
3. Exams in same year/subject area not on same day
4. At least 24-hour gap between exams for same student group
5. Exam duration respected in room assignment

#### Soft Constraints
1. Spread exams evenly across the exam period
2. Morning exams preferred for theoretical subjects
3. Avoid scheduling major required courses on same day
4. Minimize number of rooms per exam (prefer single large hall)

## Risk Prediction Model

Located at `ai-engine/app/analytics/`.

### Student Risk Prediction

Uses scikit-learn ensemble methods to predict:

| Risk Type       | Model              | Features                              |
|-----------------|--------------------|---------------------------------------|
| Academic Risk   | Random Forest      | GPA trend, attendance %, past warnings|
| Dropout Risk    | Gradient Boosting  | Semester trend, failed courses, engagement|
| Course Failure  | Logistic Regression| Prerequisite grades, attendance, hours|

### Model Pipeline

```
1. Feature Engineering
   - Academic history (GPA trajectory, credit completion rate)
   - Attendance patterns (per course, per month)
   - Engagement metrics (login frequency, material access)
   - Demographic factors (level, program)

2. Training
   - Data split: 80% train, 20% test
   - Cross-validation: 5-fold stratified
   - Hyperparameter tuning: GridSearchCV
   - Class imbalance handled via SMOTE

3. Evaluation
   - Metrics: Precision, Recall, F1, ROC-AUC
   - Minimum threshold: F1 > 0.80 before deployment
   - Monthly retraining with new data

4. Explainability
   - SHAP values for individual predictions
   - Feature importance charts for faculty
   - Reason codes included in risk reports
```

## Prompt Engineering Guide

### System Prompt Structure

```
You are an AI assistant for the Faculty of Electronic Engineering,
Menoufia University (FEE-MENOUF). You help students, faculty, and
staff with academic information and administrative tasks.

Capabilities:
- Answer questions about courses, schedules, grades, policies
- Provide academic guidance and program information
- Process requests in Arabic or English
- Access up-to-date information via the university database

Guidelines:
- Be concise, accurate, and helpful
- Use Arabic for Arabic queries, English for English queries
- If unsure, say "I don't have that information" rather than guessing
- For sensitive actions (grade changes, enrollments), redirect to appropriate office
- Always maintain student privacy - never share personal data
- When referencing policies, cite the source document when possible

Context: {retrieved_documents}
Conversation History: {chat_history}
User Query: {query}
```

### Prompt Templates

#### Grade Inquiry
```
You are checking grades for {student_name}.
Current semester: {semester}.
Only reveal grades to the authenticated student or authorized faculty.
Format: List each course with component scores and total percentage.
```

#### Schedule Query
```
The user is asking about their schedule for {semester}.
Retrieve from: schedule database filtered by user role (student/doctor).
Present in a clear day-by-day format with times and rooms.
```

#### Policy Question
```
Answer based on the retrieved policy documents.
If the policy document doesn't address the specific question,
explain the general principle and suggest contacting the
academic affairs office for clarification.
```

## Testing AI Responses

### Test Suite Structure

```python
# ai-engine/tests/test_rag.py
class TestRAGEngine:
    async def test_basic_query():
        # Test simple course info query
        result = await rag_engine.query("What is EC401?")
        assert "Digital Communications" in result

    async def test_arabic_query():
        result = await rag_engine.query("ما هي مواد الفرقة الثالثة؟")
        assert len(result) > 0

    async def test_empty_query():
        with pytest.raises(ValueError):
            await rag_engine.query("")

    async def test_retrieval_relevance():
        result = await rag_engine.query("grading policy")
        assert any("grade" in chunk.lower() for chunk in result.sources)

# ai-engine/tests/test_scheduler.py
class TestLectureScheduler:
    def test_no_overlap():
        schedule = generate_lecture_schedule(input_data)
        assert not has_overlaps(schedule)

    def test_capacity_respected():
        schedule = generate_lecture_schedule(input_data)
        for lecture in schedule:
            assert lecture.room.capacity >= lecture.enrolled_count

    def test_professor_constraints():
        schedule = generate_lecture_schedule(input_data)
        for professor, lectures in group_by_professor(schedule):
            assert not has_time_conflicts(lectures)
```

### Evaluation Metrics

| Metric               | Target   | Description                            |
|----------------------|----------|----------------------------------------|
| Response Accuracy    | > 90%    | Correct factual information            |
| Hallucination Rate   | < 2%     | Information not grounded in retrieved docs |
| Retrieval Precision  | > 0.85   | Relevant chunks retrieved              |
| User Satisfaction    | > 4.0/5  | Post-conversation rating               |
| Response Time (p95)  | < 3s     | End-to-end query response time         |
| Language Correctness | > 95%    | Proper grammar in both languages       |
| Arabic Support       | > 95%    | Correct handling of Arabic queries     |
