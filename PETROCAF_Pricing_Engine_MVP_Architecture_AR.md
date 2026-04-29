# PETROCAF Pricing Engine — MVP Architecture & Execution Plan (Arabic)

## 1) الهدف التشغيلي
بناء برنامج **Desktop على Windows** لإدارة تسعير BOQ ومراجعة تكلفة مشاريع EPC / Oil & Gas / Construction، يعمل **Offline-first**، قابل للتدقيق، وقابل للتوسع لاحقًا إلى Web App.

---

## 2) القرارات المعمارية (Phase-1)

### 2.1 Technology Stack (اقتراح عملي)
- **Language:** Python 3.12
- **Desktop UI:** PySide6 (Qt)
- **Database:** SQLite (Local file DB) مع WAL mode
- **Excel I/O:** pandas + openpyxl
- **PDF Reports:** ReportLab أو WeasyPrint
- **Validation Layer:** Pydantic models
- **Packaging to .exe:** PyInstaller
- **Background jobs:** QThread / concurrent.futures (لمنع تجميد الواجهة)

> ملاحظة: الاختيار أعلاه **general best practice** لتطبيقات Windows الصغيرة والمتوسطة مع متطلبات Offline.

### 2.2 Architectural Style
- **Layered Modular Architecture**:
  1. `presentation` (UI Forms + Dashboard)
  2. `application` (Use Cases / Services)
  3. `domain` (Pricing entities, rules, calculators)
  4. `infrastructure` (DB, Excel, PDF, file storage)

- فصل صريح بين:
  - منطق التسعير
  - التخزين
  - واجهة المستخدم

---

## 3) نموذج البيانات الأساسي (MVP)

## 3.1 الكيانات
1. **Project**
   - Project Code, Name, Client, Tender Ref, Currency, Start Date, Status
2. **BOQ Item**
   - Item No, Description, Discipline, Unit, Qty, Source Row, Confidence Flag
3. **Resource Library**
   - Labor rates, material prices, equipment rates, productivity norms
4. **Item Build-up**
   - Item ↔ Labor/Material/Equipment + coefficients + productivity + crew
5. **Cost Sheet**
   - Direct Cost, Indirect Cost, Overhead, Profit, Contingency
6. **Calibration Factors**
   - Labor/Material/Equipment/Productivity/Logistics/Risk multipliers
7. **Assumptions Register**
   - Assumption text, impact, owner, status
8. **Pricing Risk Register**
   - Risk, probability class (qualitative), impact class, mitigation, owner
9. **Missing Data Register**
   - Missing field, severity, required clarification, due date
10. **Audit Log**
   - User, action, entity, old/new value snapshot, timestamp

## 3.2 Discipline Dictionary (MVP)
- Mechanical
- Piping
- Civil
- E&I
- Hydrotest
- Steel

---

## 4) قواعد التسعير (Deterministic Rules)

> الهدف: منع أي حسابات غير قابلة للتفسير.

### 4.1 تكلفة البند المباشرة
- لكل بند:
  - Labor Cost = ساعات/إنتاجية × معدل العمالة
  - Material Cost = الكمية × سعر المادة
  - Equipment Cost = ساعات المعدة × معدل المعدة
- Direct Item Cost = مجموع البنود أعلاه

### 4.2 المعايرة السوقية (Egypt Factors)
- يطبق معامل لكل محور: Labor, Material, Equipment, Productivity, Logistics, Risk
- المعاملات يتم تعريفها على مستوى:
  - المشروع
  - أو التخصص
  - أو البند (override)

### 4.3 التكلفة الإجمالية
- Total Direct = Sum(Direct Items after factors)
- Indirect = قواعد ثابتة/بنود مستقلة
- Subtotal = Direct + Indirect
- Overhead = نسبة أو قيمة ثابتة
- Profit = نسبة أو قيمة ثابتة
- Contingency = نسبة أو قيمة ثابتة
- Final Price = Subtotal + Overhead + Profit + Contingency

### 4.4 وسم جودة البيانات
- أي قيمة غير مؤكدة: `Estimated`
- أي قيمة مفقودة: `Missing`
- يمنع اعتماد الإصدار النهائي قبل معالجة Missing الحرجة.

---

## 5) سير العمل التشغيلي (MVP Workflow)

1. إنشاء مشروع جديد.
2. إدخال بيانات العميل/المناقصة.
3. استيراد BOQ من Excel.
4. Mapping أعمدة BOQ (مرة واحدة + حفظ Template).
5. تصنيف البنود حسب Discipline.
6. ربط كل بند بـ Resource Build-up.
7. تطبيق عوامل المعايرة.
8. تشغيل محرك الحساب.
9. مراجعة Missing Data + Assumptions + Risks.
10. إصدار:
   - Dashboard
   - Excel Pricing Output
   - PDF Executive Report

---

## 6) الشاشة/الوحدات المقترحة

1. **Project Setup Form**
2. **BOQ Import Wizard**
3. **Item Classification Grid**
4. **Resource Build-up Editor**
5. **Factors & Markups Panel**
6. **Risk/Assumption/Missing Registers**
7. **Pricing Dashboard**
8. **Reports Center (Excel/PDF)**
9. **Audit Trail Viewer**
10. **Backup & Restore Utility**

---

## 7) الأمان والحوكمة

### 7.1 Offline + حساسية البيانات
- Local encrypted backups (ZIP + password policy).
- صلاحيات مستخدمين بسيطة في MVP (Admin/Editor/Viewer) عند الحاجة.
- إخفاء/تقييد ملفات المشروع خارج التطبيق قدر الإمكان.

### 7.2 Auditability
- كل تعديل سعري يسجل قبل/بعد + وقت + مستخدم.
- رقم إصدار داخلي لكل Revision.
- منع حذف نهائي دون trace (soft delete).

### 7.3 النسخ الاحتياطي
- Auto backup عند الإغلاق.
- Manual backup/export.
- Restore with validation checksum.

---

## 8) المخرجات الرسمية

1. **Dashboard داخلي**:
   - إجمالي التكلفة
   - الربح
   - المخاطر
   - البنود الناقصة
   - نسب كل تخصص
2. **Excel Pricing File** منظم
3. **PDF Executive Report**
4. **Assumptions Register**
5. **Pricing Risk Register**
6. **Missing Data / Clarifications List**

---

## 9) خطة التنفيذ المرحلية

## Phase A — Foundation Prototype (4–8 أسابيع كافتراض تخطيطي)
- Data model + SQLite schema
- Project setup + BOQ import
- Basic pricing engine deterministic
- Initial dashboard summary
- Excel export baseline

## Phase B — Controlled MVP
- Full resource build-up editor
- Factors & markups matrix
- Risk/assumption/missing registers
- Audit trail
- PDF reports
- Backup/restore

## Phase C — Hardening for Production Use
- Performance tuning (large BOQ)
- Error handling and recovery
- QA test scenarios + UAT sheets
- Packaging .exe + installer
- Versioning and release notes

> التقديرات الزمنية أعلاه **assumption** وتحتاج تأكيد بعد حجم BOQ الحقيقي، عدد القوالب، ومتطلبات التقارير النهائية.

---

## 10) متطلبات جودة و اختبار

### 10.1 Test Protocol (Minimum)
- Unit tests لمحرك التسعير.
- Integration tests لاستيراد/تصدير Excel.
- Regression cases لسيناريوهات تسعير سابقة.
- Validation tests لوسوم Estimated/Missing.

### 10.2 Acceptance Criteria (MVP)
- استيراد BOQ وتشغيل تسعير كامل دون تعديل يدوي واسع.
- وجود trace كامل للتعديلات.
- إخراج Excel + PDF قابلين للمراجعة التنفيذية.
- عدم وجود عمليات حسابية “black box”.

---

## 11) قابلية التحويل إلى Web لاحقًا
- عزل domain/application layer من الآن.
- جعل UI adapter فقط في desktop layer.
- مستقبلًا يمكن استبدال UI بـ Web (FastAPI + React مثلًا) دون إعادة كتابة محرك التسعير.

---

## 12) الخطوات التالية العملية (للشروع فورًا)

1. اعتماد نموذج البيانات النهائي (ERD).
2. اعتماد Template موحد لاستيراد BOQ (Excel mapping spec).
3. اعتماد صيغة تقرير PDF التنفيذي (section-by-section).
4. تحديد قواعد التصنيف التلقائي/اليدوي للبنود.
5. بدء تنفيذ Prototype للـ 3 وحدات الأولى:
   - Project Setup
   - BOQ Import
   - Pricing Engine Core

