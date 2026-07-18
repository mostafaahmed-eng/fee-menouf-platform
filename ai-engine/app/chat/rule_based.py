import re
import logging
from typing import Optional

logger = logging.getLogger("ai_engine.rule_based")


class KnowledgeEntry:
    def __init__(self, keywords_ar: list[str], keywords_en: list[str], response_ar: str, response_en: str):
        self.keywords_ar = keywords_ar
        self.keywords_en = keywords_en
        self.response_ar = response_ar
        self.response_en = response_en


KNOWLEDGE_BASE: list[KnowledgeEntry] = [
    KnowledgeEntry(
        keywords_ar=["حضور", "غياب", "سياسة الحضور", "الغياب", "تنبيهات الحضور", "تقرير الحضور", "نسبة الحضور"],
        keywords_en=["attendance", "absence", "attendance policy", "absent", "attendance report"],
        response_ar="""سياسة الحضور والغياب في كلية الهندسة الإلكترونية - جامعة المنوفية:

• الحضور الإلزامي: الحضور محاضرة كل المقررات الدراسية إلزامي.
• التنبيه الأول: عند غياب 25% من المحاضرات.
• التنبيه الثاني: عند غياب 35% من المحاضرات.
• منع الامتحان: عند تجاوز نسبة الغياب المسموح بها (عادةً 25-30%)، يُمنع الطالب من امتحان المقرر.
• الغياب المبرر: يُقبل غياب مبرربمستندات رسمية (تقرير طبي، ظروف قهرية) من مكتب شؤون الطلاب.
• تسجيل الحضور: يتم تسجيل الحضور إلكترونياً عبر الـ QR code أو بصمة الحضور.

نصيحة: تأكد من حضور جميع محاضراتك خاصة المحاضرات العملية، فغياب المحاضرة الواحدة قد يؤثر على نسبتك.
""",
        response_en="""Attendance and Absence Policy at Faculty of Electronic Engineering - Menoufia University:

• Mandatory Attendance: Attendance at all lectures is mandatory.
• First Warning: At 25% absence from lectures.
• Second Warning: At 35% absence from lectures.
• Exam Prevention: Exceeding the allowed absence percentage (usually 25-30%) prevents the student from sitting for the course exam.
• Excused Absence: Excused absences are accepted with official documents (medical report, force majeure) from the student affairs office.
• Attendance Recording: Attendance is recorded electronically via QR code or biometric check-in.

Tip: Make sure to attend all your lectures, especially practical sessions, as even a single absence can affect your attendance percentage.""",
    ),
    KnowledgeEntry(
        keywords_ar=["معدل تراكمي", "حساب المعدل", "المعدل التراكمي", "GPA", "CGPA", "المعدل الفصلي", "المعدل العام"],
        keywords_en=["gpa", "cgpa", "calculate gpa", "cumulative gpa", "semester gpa", "grade point average"],
        response_ar="""كيفية حساب المعدل التراكمي (CGPA) والمعدل الفصلي (GPA):

**المعادلة:**
المعدل = (مجموع النقاط المكتسبة) ÷ (إجمالي ساعات المعادلة)

**خطوات الحساب:**
1. لكل مقرر: اضرب عدد ساعات المعادلة في النقاط المكتسبة:
   • A (ممتاز) = 4.0 × ساعات المعادلة
   • A- = 3.7 × ساعات المعادلة
   • B+ = 3.3 × ساعات المعادلة
   • B (جيد جداً) = 3.0 × ساعات المعادلة
   • B- = 2.7 × ساعات المعادلة
   • C+ = 2.3 × ساعات المعادلة
   • C (جيد) = 2.0 × ساعات المعادلة
   • C- = 1.7 × ساعات المعادلة
   • D+ = 1.3 × ساعات المعادلة
   • D (مقبول) = 1.0 × ساعات المعادلة
   • F (راسب) = 0 × ساعات المعادلة

2. اجمع النقاط المكتسبة لجميع المقررات.
3. اجمع ساعات المعادلة لجميع المقررات.
4. اقسم مجموع النقاط على مجموع الساعات.

**مثال:** إذا حصلت على B (3 ساعات) في مقرر و A (2 ساعات) في مقرر آخر:
المعدل = (3×3 + 2×4) ÷ (3+2) = (9+8) ÷ 5 = 3.40

المعدل التراكمي (CGPA) يشمل جميع الفصول الدراسية، بينما المعدل الفصلي (GPA) يشمل فصل واحد فقط.
""",
        response_en="""How to Calculate Cumulative GPA (CGPA) and Semester GPA:

**Formula:**
GPA = (Total Grade Points Earned) ÷ (Total Credit Hours)

**Steps:**
1. For each course: Multiply credit hours by grade points:
   • A (Excellent) = 4.0 × credit hours
   • A- = 3.7 × credit hours
   • B+ = 3.3 × credit hours
   • B (Very Good) = 3.0 × credit hours
   • B- = 2.7 × credit hours
   • C+ = 2.3 × credit hours
   • C (Good) = 2.0 × credit hours
   • C- = 1.7 × credit hours
   • D+ = 1.3 × credit hours
   • D (Pass) = 1.0 × credit hours
   • F (Fail) = 0 × credit hours

2. Sum all grade points earned.
3. Sum all credit hours.
4. Divide total grade points by total credit hours.

**Example:** If you got B (3 hours) in one course and A (2 hours) in another:
GPA = (3×3 + 2×4) ÷ (3+2) = (9+8) ÷ 5 = 3.40

CGPA covers all semesters, while GPA covers only one semester.""",
    ),
    KnowledgeEntry(
        keywords_ar=["التسجيل", "تسجيل المقررات", "فترة التسجيل", "إضافة مقرر", "حذف مقرر", "الجدول التسجيلي", "الانتساب"],
        keywords_en=["registration", "course registration", "register courses", "add course", "drop course", "enrollment"],
        response_ar="""التسجيل في المقررات الدراسية:

• التسجيل الإلكتروني: يتم التسجيل عبر نظام الانتساب الإلكتروني المتاح على بوابة الكلية.
• فترة التسجيل: تُحدد الجهة المختصة مواعيد التسجيل لكل فصل، وتنبيهات عبر البريد الإلكتروني والمنصة.
• الحد الأقصى للساعات: عادةً 18 ساعة معادلة كحد أقصى، و12 كحد أدنى.
• المتطلبات السابقة: تأكد من إتمام المتطلبات السابقة للمقرر قبل التسجيل.
• الانتساب والانتساب المتأخر: الانتساب المتأخر قد يترتب عليه رسوم إضافية.
• إضافة/حذف مقرر: يمكن إضافة أو حذف مقرر خلال أول أسبوعين من الفصل بموافقة المرشد الأكاديمي.
• شروط التسجيل: يجب ألا يكون لدى الطالب رصيد أكاديمي سلبي أو ديون مالية.

نصيحة: راجع مرشدك الأكاديمي قبل التسجيل للتأكد من اختيار المقررات المناسبة لمسارك الدراسي.""",
        response_en="""Course Registration:

• Electronic Registration: Registration is done through the electronic enrollment system on the faculty portal.
• Registration Period: The designated authority sets registration dates for each semester, with notifications via email and the platform.
• Maximum Credit Hours: Usually 18 credit hours maximum, 12 minimum.
• Prerequisites: Make sure to complete course prerequisites before registering.
• Late Enrollment: Late enrollment may incur additional fees.
• Add/Drop: Courses can be added or dropped within the first two weeks with academic advisor approval.
• Registration Conditions: Students must not have negative academic standing or financial dues.

Tip: Consult your academic advisor before registration to ensure you choose courses appropriate for your academic path.""",
    ),
    KnowledgeEntry(
        keywords_ar=["تخرج", "متطلبات التخرج", "ساعات التخرج", "الشروط للتخرج", "إتمام الدراسة", "الشهادة"],
        keywords_en=["graduation", "graduation requirements", "degree requirements", "complete degree", "certificate"],
        response_ar="""متطلبات التخرج من كلية الهندسة الإلكترونية - جامعة المنوفية:

• إجمالي ساعات المعادلة: 160-170 ساعة معادلة (حسب القسم).
• المعدل الأدنى: المعدل التراكمي 2.0 كحد أدنى للتخرج.
• المتطلبات الإجبارية: إتمام جميع المقررات الإجبارية للقسم.
• المتطلبات 선택ية: إتمام عدد محدد من المقررات الاختيارية.
• المشروع التخرج: إعداد وعرض مشروع التخرج (Senior Design Project).
• التدريب الصناعي: إتمام فترة التدريب الصناعي (إن وُجد).
• لا رساوب: عدم وجود مقررات راسبة غير مُجتازة.
• الواجبات المالية: تسويه جميع الواجبات المالية مع الكلية.

للحصول على تأكيد بمتطلبات تخرجك المحددة، راجع مكتب الدراسة والامتحانات أو مرشدك الأكاديمي.""",
        response_en="""Graduation Requirements at FEE - Menoufia University:

• Total Credit Hours: 160-170 credit hours (varies by department).
• Minimum GPA: CGPA of 2.0 minimum to graduate.
• Mandatory Requirements: Complete all mandatory courses for your department.
• Elective Requirements: Complete a specified number of elective courses.
• Senior Project: Prepare and present your graduation project.
• Industrial Training: Complete industrial training period (if applicable).
• No Failing Grades: No unresolved failing courses.
• Financial Clearance: Settle all financial dues with the faculty.

For a confirmation of your specific graduation requirements, visit the Exams and Registration Office or your academic advisor.""",
    ),
    KnowledgeEntry(
        keywords_ar=["تواصل", "التواصل", "البريد", "رقم الهاتف", "المكتب", "وقت الدوام", "العنوان", "هلات الاتصال"],
        keywords_en=["contact", "email", "phone", "office", "working hours", "address", "reach"],
        response_ar="""معلومات التواصل - كلية الهندسة الإلكترونية - جامعة المنوفية:

• العنوان: شارع جمال عبد الناصر، شبرا، المنوفية، مصر.
• هاتف المكتب الرئيسي: 048-222-XXXX
• البريد الإلكتروني: info@fee-menouf.edu.eg
• بوابة الطلاب: https://portal.fee-menouf.edu.eg
• ساعات العمل: الأحد إلى الخميس، 9:00 صباحاً - 3:00 مساءً.
• مكتب شؤون الطلاب: الطابق الأول، مبنى الإدارة.
• مكتب الدراسة والامتحانات: الطابق الأرضي، مبنى الإدارة.

للشكاوى والاستفسارات الأكاديمية، يُرجى التواصل مع مكتب شؤون الطلاب أولاً.""",
        response_en="""Contact Information - Faculty of Electronic Engineering - Menoufia University:

• Address: Jamal Abdel Nasser Street, Shubra, Menoufia, Egypt.
• Main Office Phone: 048-222-XXXX
• Email: info@fee-menouf.edu.eg
• Student Portal: https://portal.fee-menouf.edu.eg
• Working Hours: Sunday to Thursday, 9:00 AM - 3:00 PM.
• Student Affairs Office: First floor, Administration Building.
• Exams and Registration Office: Ground floor, Administration Building.

For complaints and academic inquiries, please contact the Student Affairs Office first.""",
    ),
    KnowledgeEntry(
        keywords_ar=["امتحانات", "أيام الامتحانات", "جدول الامتحانات", "نظام الامتحان", "الغش", "المخالفات", "أنظمة الامتحان"],
        keywords_en=["exams", "exam schedule", "exam rules", "cheating", "prohibited", "exam regulations"],
        response_ar="""نظام الامتحانات في كلية الهندسة الإلكترونية:

• جدول الامتحانات: يُعلن عن جدول الامتحانات قبل كل فصل عبر بوابة الكلية.
• الامتحان النصفي: عادةً في منتصف الفصل الدراسي.
• الامتحان النهائي: في نهاية الفصل الدراسي.
• الغياب عن الامتحان: يُعتبر الامتحان صفراً (F) في حالة الغياب بدون عذر مقبول.
• الغش: غش الامتحان يُسبب فصل فوري من الكلية.
• المخالفات الممنوعة: استخدام الهاتف، التحدث مع الزملاء، اقتحام الأوراق.
• البدائل: لا يُسمح بالامتحان البديل إلا في حالات استثنائية بقرار من مجلس القسم.
• درجة الامتحان: عادةً 40-60% من درجة المقرر النهائية.

تأكد من مراجعة لوائح الامتحانات المعلمة على لوحة الإعلانات في كل قسم.""",
        response_en="""Exam System at Faculty of Electronic Engineering:

• Exam Schedule: The exam schedule is announced before each semester on the faculty portal.
• Midterm Exam: Usually in the middle of the semester.
• Final Exam: At the end of the semester.
• Exam Absence: The exam is graded as zero (F) if absent without a valid excuse.
• Cheating: Exam cheating results in immediate expulsion from the faculty.
• Prohibited Items: Using phones, talking to colleagues, bringing unauthorized papers.
• Alternatives: Substitute exams are only allowed in exceptional cases by department council decision.
• Exam Weight: Usually 40-60% of the final course grade.

Make sure to review the exam rules posted on your department's notice board.""",
    ),
    KnowledgeEntry(
        keywords_ar=["مرشد أكاديمي", "المرشد", "التوجيه الأكاديمي", "استشارة أكاديمية", "نصيحة أكاديمية"],
        keywords_en=["academic advisor", "advisor", "academic guidance", "academic advice", "consultation"],
        response_ar="""المرشد الأكاديمي في كلية الهندسة الإلكترونية:

كل طالب يُعيّن له مرشد أكاديمي مسؤول عن:
• متابعة التقدم الأكاديمي للطالب.
• مساعدة في اختيار المقررات المناسبة.
• التعامل مع المشاكل الأكاديمية.
• تقديم النصائح حول المسار الدراسي.
• التوقيع على طلبات التسجيل والإضافة والحذف.
• الإطلاع على التقارير الأكاديمية.

كيف تعرف مرشدك:
1. سجّل الدخول على بوابة الطلاب.
2. ابحث عن قسم "المرشد الأكاديمي" في ملفك الشخصي.
3. أو تواصل مع مكتب شؤون الطلاب.

مواعيد الاستشارة: يُفضل حجز موعد مسبق عبر البريد الإلكتروني أو مكتب المرشد.""",
        response_en="""Academic Advisor at FEE:

Each student is assigned an academic advisor responsible for:
• Tracking the student's academic progress.
• Helping choose appropriate courses.
• Dealing with academic issues.
• Providing advice on the academic path.
• Signing registration, add, and drop requests.
• Reviewing academic reports.

How to find your advisor:
1. Log into the student portal.
2. Look for the "Academic Advisor" section in your profile.
3. Or contact the Student Affairs Office.

Consultation Hours: It's recommended to book an appointment in advance via email or the advisor's office.""",
    ),
    KnowledgeEntry(
        keywords_ar=["مواد", "المقررات المتاحة", "المقررات", "قائمة المقررات", "المناهج", "البرنامج الدراسي"],
        keywords_en=["courses", "available courses", "course list", "curriculum", "syllabus", "program"],
        response_ar="""المقررات الدراسية في كلية الهندسة الإلكترونية:

• المقررات الإجبارية: مقررات أساسية يجب اجتيازها للقسم.
• المقررات الاختيارية: مقررات تختارها حسب اهتماماتك.
• المقررات العامة: مقررات مشتركة بين جميع الأقسام (لغة إنجليزية، رياضيات، فيزياء...).

كيف تعرف المقررات المتاحة:
1. سجّل الدخول على بوابة الطلاب.
2. اختر "المقررات المتاحة لتسجيلي".
3. راجع الكتالوج الأكاديمي على موقع الكلية.

نصيحة: راجع المتطلبات السابقة لكل مقرر قبل التسجيل. بعض المقررات تحتاج اجتياز مقرر آخر أولاً.""",
        response_en="""Courses at FEE:

• Mandatory Courses: Core courses required for your department.
• Elective Courses: Courses you choose based on your interests.
• General Courses: Shared courses across all departments (English, Mathematics, Physics...).

How to find available courses:
1. Log into the student portal.
2. Select "Courses Available for Registration".
3. Review the academic catalog on the faculty website.

Tip: Check the prerequisites for each course before registration. Some courses require passing another course first.""",
    ),
    KnowledgeEntry(
        keywords_ar=["مشروع التخرج", "المشروع", "Senior Design", "مشاريع التخرج"],
        keywords_en=["graduation project", "senior design", "final project", "capstone"],
        response_ar="""مشروع التخرج في كلية الهندسة الإلكترونية:

• التسجيل: يتم تسجيل مشروع التخرج في الفصل الأخير (عادةً الفصل الثامن).
• المشرف: يُعيّن لكل مجموعة مشرف أكاديمي.
• المدة:عادةً فصل دراسي واحد (قد يكون فصلين في بعض الحالات).
• العرض: يُقدم المشروع عرض أمام لجنة من أعضاء هيئة التدريس.
• التقييم: يُقيّم المشروع بناءً على الجودة والابتكار والعرض والتقرير الكتابي.

نصائح لمشروع التخرج:
1. اختر موضوعاً يتناسب مع تخصصك واهتماماتك.
2. ابدأ التخطيط مبكراً.
3. تواصل مع مشرفك بانتظام.
4. راجع مشاريع التخرج السابقة للأفكار.""",
        response_en="""Graduation Project at FEE:

• Registration: The graduation project is registered in the final semester (usually the 8th).
• Supervisor: Each group is assigned an academic supervisor.
• Duration: Usually one semester (may be two in some cases).
• Presentation: The project is presented before a committee of faculty members.
• Evaluation: The project is evaluated based on quality, innovation, presentation, and written report.

Tips for your graduation project:
1. Choose a topic that matches your specialization and interests.
2. Start planning early.
3. Communicate with your supervisor regularly.
4. Review previous graduation projects for ideas.""",
    ),
    KnowledgeEntry(
        keywords_ar=["الساعات", "ساعات المعادلة", "الحد الأقصى", "الحد الأدنى", "load", "عبء دراسي", "كم مقرر"],
        keywords_en=["credit hours", "maximum credits", "minimum credits", "course load", "how many courses"],
        response_ar="""ساعات المعادلة في كلية الهندسة الإلكترونية:

• الحد الأقصى: 18 ساعة معادلة كحد أقصى في الفصل الواحد.
• الحد الأدنى: 12 ساعة معادلة كحد أدنى للتسجيل كطالب منتظم.
• المعدل النصفي: 15 ساعة معادلة هي العبء المعتاد.
• أقل من 12: أقل من 12 ساعة يُعتبر تسجيل جزئي (Part-time).
• أكثر من 18: يحتاج موافقة استثنائية من مجلس القسم.
• التوازن: يُنصح بتوزيع العبء الدراسي بشكل متوازن بين المقررات الصعبة والسهلة.

نصيحة: لا تحمل نفسك أكثر من اللازم. ركّز على جودة التعلم أكثر من كمية المقررات.""",
        response_en="""Credit Hours at FEE:

• Maximum: 18 credit hours maximum per semester.
• Minimum: 12 credit hours minimum for full-time enrollment.
• Average Load: 15 credit hours is the typical workload.
• Fewer than 12: Below 12 hours is considered part-time registration.
• More than 18: Requires special approval from the department council.
• Balance: It's recommended to distribute your workload evenly between difficult and easy courses.

Tip: Don't overload yourself. Focus on quality of learning rather than quantity of courses.""",
    ),
    KnowledgeEntry(
        keywords_ar=["فصل", "إيقاف", "فصل دراسي", "إيقاف دراسي", "إيقاف دائم", "فصل مؤقت", "فصل دائم", "انقطاع"],
        keywords_en=["expulsion", "suspension", "dismissal", "temporary dismissal", "permanent dismissal"],
        response_ar="""الفصل من كلية الهندسة الإلكترونية:

الفصل الدراسي (إيقاف أكاديمي):
• يُصدر قرار الفصل من مجلس القسم بسبب تراجع الأداء الأكاديمي.
• لا يُسمح بالتسجيل لمدة فصل دراسي واحد على الأقل.
• يمكن إعادة التسجيل بعد انتهاء مدة الفصل بطلب من الطالب.

الفصل المؤقت:
• قد يكون بسبب مخالفة أكاديمية أو سلوكية.
• مدة محددة يُحدد مجلس القسم.
• يُعاد الطالب تلقائياً بعد انتهاء المدة.

الفصل الدائم:
• في الحالات الجسيمة فقط (غش، سرقة، عنف).
• لا يمكن استئنافه.

للإعادة بعد الفصل: تواصل مع مكتب شؤون الطلاب لتقديم طلب الإعادة مع المستندات المطلوبة.""",
        response_en="""Expulsion from FEE:

Academic Dismissal:
• Issued by the department council due to declining academic performance.
• Registration is not permitted for at least one semester.
• Re-enrollment can be requested after the dismissal period ends.

Temporary Suspension:
• May be due to academic or behavioral violation.
• Duration determined by the department council.
• Student is automatically reinstated after the period.

Permanent Dismissal:
• Only in severe cases (cheating, theft, violence).
• Cannot be appealed.

For reinstatement after dismissal: Contact the Student Affairs Office to submit a reinstatement request with required documents.""",
    ),
]


class RuleBasedAI:
    def __init__(self):
        self.knowledge = KNOWLEDGE_BASE

    def _normalize(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r"[؟؟!،.:\s]+", " ", text)
        return text

    def _score_entry(self, query: str, entry: KnowledgeEntry) -> int:
        normalized = self._normalize(query)
        words = set(normalized.split())
        score = 0

        for kw in entry.keywords_ar:
            kw_norm = self._normalize(kw)
            if kw_norm in normalized:
                score += len(kw_norm.split()) * 3
            else:
                for w in kw_norm.split():
                    if w in words:
                        score += 1

        for kw in entry.keywords_en:
            kw_norm = self._normalize(kw)
            if kw_norm in normalized:
                score += len(kw_norm.split()) * 3
            else:
                for w in kw_norm.split():
                    if w in words:
                        score += 1

        return score

    def respond(self, query: str, language: Optional[str] = None) -> Optional[str]:
        lang = language or ("ar" if re.search(r"[\u0600-\u06FF]", query) else "en")

        best_score = 0
        best_entry = None

        for entry in self.knowledge:
            score = self._score_entry(query, entry)
            if score > best_score:
                best_score = score
                best_entry = entry

        if best_entry and best_score >= 2:
            logger.info(f"Rule-based match: score={best_score}, lang={lang}")
            return best_entry.response_ar if lang == "ar" else best_entry.response_en

        return None


rule_based_ai = RuleBasedAI()
