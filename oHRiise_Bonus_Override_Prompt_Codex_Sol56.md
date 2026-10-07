# oHRiise — Bonus Override Prompt for Codex Sol 5.6
## AI Embedded Applications, Brand Fidelity, Shared Email, WFH Core, Typography & Visual Refinement

> **Purpose:** This file is a refinement and override layer for the existing `oHRiise_Codex_Sol56_Master_System_Prompt.md`.
>
> **Use:** Load the Master Prompt first, then load this file.
>
> **Priority rule:** When this file conflicts with the Master Prompt on visual design, branding, AI workspace architecture, typography, navigation shell, email availability, WFH core behavior, or UI density, **THIS BONUS OVERRIDE TAKES PRECEDENCE**.
>
> Do **not** discard the original business architecture, authorization model, domain logic, or workflow scope.

---

# 1. PRIMARY OVERRIDE DIRECTIVE

The previous implementation is too close to a generic dark enterprise dashboard.

You must refine oHRiise so that it feels like a **premium, purpose-built product ecosystem**, not a set of information panels.

The most important changes are:

1. Treat **AI CV Intelligence** as a first-class embedded application.
2. Treat **WFH Intelligence** as a first-class embedded application.
3. Make **Email** a core shared application for all personnel accounts.
4. Make the foundational **WFH Intelligence lifecycle** a core platform capability for all WFH-capable accounts.
5. Use the **official supplied oHRiise logo asset exactly as the source of truth**.
6. Add a collapsible application sidebar.
7. Increase typography scale and improve visual balance.
8. Redesign status components so icons and labels align properly.
9. Reduce the “dashboard full of text” feeling.
10. Introduce more branded, visually intentional product surfaces and selected illustration/visual assets where they improve identity.

---

# 2. OFFICIAL BRAND ASSET OVERRIDE

The official oHRiise logo asset has already been supplied in the project/repository.

It is the absolute source of truth for:

- logo geometry;
- icon shape;
- wordmark;
- exact casing;
- brand letter emphasis;
- color relationships;
- visual proportions.

You MUST inspect and use the official asset directly.

Never:

- redraw the logo;
- approximate it with CSS;
- replace it with a Lucide icon;
- generate a substitute logo;
- alter the icon geometry;
- simplify the wordmark;
- flatten the official color treatment without a verified brand variant;
- remove the intended emphasis from the highlighted brand letters;
- reinterpret the official logo from memory.

The application theme may derive colors from the official logo, but the logo itself must not be redesigned to fit the interface.

Priority:

```txt
OFFICIAL BRAND ASSET
        ↓
Brand color extraction
        ↓
Theme tokens
        ↓
Component styling
```

---

# 3. SIDEBAR BRAND PRESENTATION

Expanded sidebar:

```txt
[Official logo icon] [Official oHRiise wordmark]
```

Collapsed sidebar:

```txt
[Official logo icon only]
```

Never create a new compact logo.

The expanded sidebar must preserve the official wordmark treatment.

If the official wordmark visually emphasizes `HRii`, preserve that emphasis.

Do not render the whole wordmark as plain white text unless the provided brand package contains an official monochrome version.

---

# 4. APP SHELL — COLLAPSIBLE SIDEBAR

The application shell must support:

- expanded sidebar;
- collapsed icon-only sidebar;
- visible collapse/expand control;
- keyboard-accessible toggle;
- persisted state per session;
- tooltips in collapsed mode;
- mobile drawer behavior;
- smooth width transition.

Recommended desktop behavior:

```txt
Expanded: 240–268px
Collapsed: 68–76px
```

Do not ship a permanently expanded sidebar.

The toggle should be discoverable but not visually dominant.

---

# 5. AI ARCHITECTURE OVERRIDE — FIRST-CLASS EMBEDDED APPLICATIONS

AI CV Intelligence and WFH Intelligence must **not** be implemented as ordinary single-page dashboard modules.

They must feel like two specialist applications embedded within oHRiise.

They share:

- oHRiise authentication;
- design tokens;
- permission system;
- data context;
- notifications;
- audit model;
- brand identity.

But each must have its own:

- internal navigation;
- workspace hierarchy;
- entity model;
- review states;
- specialist tools;
- history;
- filters;
- saved context;
- decision workflow;
- specialized layout language.

The user should feel:

> “I entered a dedicated AI product inside oHRiise.”

Not:

> “I opened another analytics page.”

---

# 6. AI PRODUCT SURFACE VISUAL LANGUAGE

AI workspaces must be more immersive and specialized than normal HR pages.

Use:

- split panes;
- resizable master-detail layouts;
- contextual inspectors;
- evidence drawers;
- review queues;
- comparison surfaces;
- trace views;
- compact toolbars;
- entity sidebars;
- timeline structures;
- layered analysis regions;
- sticky action bars where appropriate.

Do not rely primarily on:

- KPI cards;
- large text-heavy cards;
- static score boxes;
- oversized dashboard summaries.

The overview is useful, but it must not dominate the experience.

The true product value should come from the **interactive work surface**.

---

# 7. AI CV INTELLIGENCE — EMBEDDED APP

AI CV Intelligence must behave like a specialized **ATS Intelligence Application**.

Minimum internal sections:

```txt
Overview
Requisitions
Candidate Queue
Candidate Intelligence
Compare Candidates
Review Decisions
Analysis History
Explainability / Model Notes
```

Optional secondary sections when useful:

```txt
JD Criteria
Saved Views
Interview Evidence
Reviewer Notes
```

Do not implement this as one page with candidate list on the left and one static information panel on the right only.

That may be one view, but the app must feel deeper than that.

---

# 8. AI CV — INTERNAL NAVIGATION

Provide a subtle internal navigation layer.

Possible pattern:

```txt
AI CV Intelligence
[Overview] [Requisitions] [Candidates] [Compare] [History]
```

or a dedicated secondary sidebar inside the workspace.

Use whichever produces the cleaner experience.

Do not duplicate the global app sidebar unnecessarily.

---

# 9. AI CV — OVERVIEW PAGE

The AI CV overview may show:

- active requisitions;
- candidates analyzed;
- review queue;
- high-match candidates;
- analysis health;
- recent activity.

However:

The overview must be visually concise.

It should direct users into task surfaces:

```txt
Open requisition
Review candidate
Compare candidates
Resolve review queue
```

Avoid six large statistic cards with small text.

---

# 10. AI CV — REQUISITION WORKSPACE

A requisition is a first-class object.

Show:

- role;
- requisition ID;
- JD version;
- department;
- recruiter;
- hiring status;
- candidate count;
- analysis policy;
- date created;
- recent review activity.

The requisition workspace should include:

```txt
Candidate Queue
Scoring Criteria
Review Progress
Notes
Analysis History
```

Use tabs or contextual secondary navigation.

---

# 11. AI CV — CANDIDATE QUEUE

The queue should feel like an operational review list.

Each item may include:

- candidate name;
- current role;
- years of experience;
- top skills;
- match score;
- confidence;
- review state;
- reviewer;
- latest activity.

Allow:

- sort;
- filter;
- multi-select;
- compare;
- mark for review;
- shortlist;
- add note.

Use rows/cards optimized for scanning.

Do not cram every data point into tiny metadata text.

---

# 12. AI CV — CANDIDATE INTELLIGENCE WORKSPACE

Use a rich layout.

Recommended structure:

```txt
┌───────────────────────────────────────────────────────┐
│ Candidate identity + review state + actions          │
├──────────────────────────┬────────────────────────────┤
│ Evidence / score         │ Context / resume details  │
│ breakdown                │                            │
├──────────────────────────┴────────────────────────────┤
│ Gaps / verification / interview suggestions         │
├───────────────────────────────────────────────────────┤
│ Reviewer notes / decision history                    │
└───────────────────────────────────────────────────────┘
```

Alternative split-pane layouts are allowed.

The candidate screen must feel like an intelligence dossier, not a static score report.

---

# 13. AI CV — VISUALIZED EVIDENCE

Do not show all AI reasoning as plain text blocks.

Where useful, visualize:

- skill match;
- requirement coverage;
- evidence strength;
- missing criteria;
- years of relevant experience;
- confidence;
- source snippets;
- chronology;
- role fit.

Possible visual structures:

- segmented requirement map;
- compact evidence chips;
- match bars;
- radial only if used sparingly;
- source-linked evidence rows;
- grouped skill clusters;
- gap matrix.

Avoid turning every metric into a chart.

The visualization must help decision-making.

---

# 14. AI CV — COMPARE MODE

Candidate comparison must feel like a real specialist tool.

Support at least 2–3 candidates.

Possible columns:

```txt
Candidate A
Candidate B
Candidate C
```

Compare:

- overall score;
- must-have requirements;
- nice-to-have requirements;
- experience;
- skills;
- certifications;
- language;
- key evidence;
- unresolved gaps;
- reviewer notes.

Keep comparison aligned row-by-row.

Avoid making comparison a giant table with tiny text.

---

# 15. AI CV — DECISION & REVIEW HISTORY

Every candidate should have a visible review history.

Examples:

```txt
AI analyzed
HR opened review
HR added note
Needs Review
Shortlisted
Compared with Candidate X
Decision updated
```

Show timestamps and actors.

AI result is advisory.

Human decision remains distinct.

---

# 16. AI CV — DESIGN TASTE OVERRIDE

The AI CV application must not visually resemble:

- HR dashboard;
- generic CRM;
- standard data table;
- static candidate score page.

It should feel closer to:

- specialist intelligence software;
- enterprise investigation workspace;
- ATS analytics product;
- high-end decision support tool.

Use the oHRiise brand system but permit slightly denser, more technical visual treatment.

---

# 17. WFH INTELLIGENCE — EMBEDDED APP

WFH Intelligence must behave like a dedicated **Human Review & Evidence Analysis Application**.

Minimum internal sections:

```txt
Overview
Today’s Review Queue
Employees
Case Review
Evidence Timeline
Daily Report Alignment
Flagged / Low-confidence Events
Decision Log
Review History
Privacy & Access
```

Do not make WFH Intelligence a dashboard with evidence rows underneath.

The primary experience must be the **review workspace**.

---

# 18. WFH AI — INTERNAL NAVIGATION

Provide specialist internal navigation such as:

```txt
WFH Intelligence
[Overview] [Review Queue] [Employees] [History] [Privacy]
```

The global oHRiise shell remains.

The WFH application owns its internal task flow.

---

# 19. WFH AI — OVERVIEW PAGE

The overview may summarize:

- active WFH sessions;
- evidence coverage;
- report submission;
- low-confidence items;
- cases awaiting human review;
- review completion;
- recent trends.

Keep overview compact.

Primary CTAs:

```txt
Open Review Queue
Review Low-confidence Case
View Employee Session
```

Do not use giant KPI panels with tiny labels.

---

# 20. WFH AI — REVIEW QUEUE

The Review Queue is central.

Each case should show:

- employee;
- team;
- date;
- session coverage;
- work-related signal;
- confidence;
- Daily Report alignment;
- unresolved event count;
- review priority;
- assigned reviewer.

Allow:

- filter;
- sort;
- search;
- reviewer assignment;
- resolve;
- defer;
- add context.

The queue should feel operational.

---

# 21. WFH AI — CASE REVIEW WORKSPACE

The Case Review view should be a real investigation/review surface.

Recommended multi-column layout:

```txt
┌─────────────────┬───────────────────────────────┬───────────────────┐
│ Session /       │ Evidence Timeline             │ Report Alignment  │
│ employee list   │                               │ & reviewer tools  │
│                 │                               │                   │
└─────────────────┴───────────────────────────────┴───────────────────┘
```

Or use:

```txt
Left: session navigation
Center: evidence
Right: context / decision
```

Resizable panels are encouraged.

The reviewer should not need to navigate between many separate pages for one case.

---

# 22. WFH AI — EVIDENCE VISUALIZATION

Evidence should not be plain text rows only.

Use meaningful visual elements:

- application icon;
- timestamp;
- classification;
- confidence;
- evidence source;
- screenshot preview if authorized;
- Daily Report linkage;
- AI explanation;
- low-confidence marker;
- reviewer context.

Potential visual patterns:

- timeline;
- activity stream;
- evidence cards;
- contextual thumbnails;
- confidence rail;
- linked report item indicator.

Do not make screenshot previews visually dominant.

---

# 23. WFH AI — LOW-CONFIDENCE EVENT UX

Low-confidence events must look reviewable, not accusatory.

Example:

```txt
14:07
Video content
Possible learning material
Confidence 61%

[Open Evidence] [Add Context] [Mark Valid]
```

Use amber / neutral review state.

Never imply misconduct from weak evidence.

---

# 24. WFH AI — REPORT ALIGNMENT

Daily Report comparison should be a structured analysis surface.

For each task:

```txt
Task
Evidence coverage
Related events
Confidence
Reviewer note
```

Represent supported / uncertain / unsupported items clearly.

Do not reduce alignment to plain checkmarks only.

---

# 25. WFH AI — DECISION LOG

Review actions must be recorded.

Examples:

```txt
Evidence marked valid
Reviewer added context
No issue found
Needs employee clarification
Case resolved
```

Keep AI classification separate from human outcome.

---

# 26. WFH AI — PRIVACY & ACCESS

Provide dedicated privacy context.

Include:

- consent status;
- retention policy;
- sensitive-content blur;
- who accessed evidence;
- reason for access;
- screenshot expiry;
- deletion status.

This should feel like a serious enterprise privacy feature.

---

# 27. WFH INTELLIGENCE IS A CORE PLATFORM CAPABILITY

WFH Intelligence is not only an optional Team Lead feature.

All personnel accounts participating in WFH must be part of the foundational WFH lifecycle.

Base WFH capabilities for applicable employees:

```txt
WFH request
WFH schedule/status
WFH session status
Daily Report
evidence/monitoring awareness
privacy / consent information
own session summary where appropriate
```

The employee should understand:

- when WFH monitoring is active;
- what evidence may be collected;
- how long it is retained;
- which policy applies.

Advanced review authority remains permission-controlled.

---

# 28. WFH AI REVIEW AUTHORITY

Do not expose advanced evidence-review tools to every employee.

Review access requires appropriate permission / relationship.

Examples:

```txt
Team Lead of the employee
Authorized HR reviewer
Authorized compliance role
```

Admin manages configuration and access policy but should not casually browse employee evidence.

Access should be auditable.

---

# 29. EMAIL AS A CORE SHARED APPLICATION

Email is a core product capability available to every personnel account.

It must not exist only as Admin SMTP configuration.

Every account should have an email workspace appropriate to its permissions.

Base capabilities:

```txt
Inbox
Sent
Drafts
Starred
Search
Compose
Thread view
Attachments
Message detail
```

Optional:

```txt
Archive
Labels
Unread filters
```

Do not overbuild into a full Gmail clone.

The purpose is integrated enterprise communication.

---

# 30. EMAIL — ROLE-AWARE EXTENSIONS

Employee:

```txt
Personal company mailbox
Internal communication
HR communication
Attachments
```

Team Lead:

```txt
Team follow-up
Approval-related communication
Project/team correspondence
```

HR:

```txt
Employee communication
Candidate communication
Shared HR mailbox if authorized
Recruitment email context
```

Admin:

```txt
SMTP
DLP
Shared mailbox policy
Routing
Delivery health
System templates
```

Do not confuse mail usage with mail infrastructure configuration.

---

# 31. EMAIL — UI TASTE

Email must feel like a real embedded work app.

Recommended structure:

```txt
Mailbox sidebar
Message list
Message detail / thread
```

Desktop can use three-column layout.

Use:

- keyboard-friendly navigation;
- readable message typography;
- clear thread grouping;
- attachment cards;
- compact toolbar.

Avoid excessive rounded cards inside the mailbox.

---

# 32. EMAIL — AI CV INTEGRATION

Where permission allows, recruitment mail may integrate with AI CV.

Example:

```txt
Candidate email
   ↓
Attachment detected
   ↓
Open / Send CV to AI CV Intelligence
```

Do not auto-analyze private attachments without explicit product logic.

---

# 33. TYPOGRAPHY SCALE OVERRIDE

The current implementation uses too much tiny text.

You must increase readability.

Do not use `text-[10px]` or `text-xs` as the default body language.

Micro labels are metadata only.

Recommended guidance:

```txt
Page title:        28–36px
Section title:     18–24px
Entity title:      16–20px
Body:              14–16px
Important labels:  14–16px
Secondary:         13–14px
Metadata:          11–12px only when appropriate
```

The principle is:

> text size must match the physical visual weight of the surface.

---

# 34. TYPOGRAPHY VS WHITESPACE

Large whitespace with tiny text creates visual weakness.

If a card occupies significant screen area:

- increase primary typography;
- strengthen hierarchy;
- reduce empty dead space;
- introduce meaningful visual structure;
- avoid leaving huge containers with one tiny number and one tiny label.

The design should feel balanced, not under-filled.

---

# 35. MICRO-LABEL RESTRICTION

The following style:

```txt
10px
uppercase
tracking-widest
mono
```

must be restricted to:

- technical metadata;
- AI model labels;
- audit labels;
- small category markers;
- system states.

Do not apply it to normal section names everywhere.

Overuse makes the UI look synthetic and difficult to read.

---

# 36. STATUS COMPONENT OVERRIDE

Status components must be visually balanced.

Mandatory:

```txt
[icon] [label]
```

on one horizontal row.

Use:

```txt
display: inline-flex
align-items: center
gap: 6–8px
```

The icon must never float above the label unintentionally.

The label size must match the size of the colored container.

Avoid:

- tiny text in oversized chips;
- icon overlapping text;
- icon stacked vertically without purpose;
- excessive status pill height.

---

# 37. STATUS CHIP EXAMPLE

Good:

```tsx
<div className="
  inline-flex
  items-center
  gap-2
  rounded-lg
  bg-emerald-500/10
  px-3
  py-2
  text-sm
  font-medium
  text-emerald-400
">
  <CheckCircle2 size={15} strokeWidth={1.5} />
  Đúng giờ
</div>
```

Bad:

```txt
Large colored box
tiny icon on top
tiny label below
```

---

# 38. SIDEBAR TYPOGRAPHY

Sidebar navigation labels must remain comfortably readable.

Avoid extremely small labels.

Use:

```txt
14–15px
medium weight for active item
regular/medium for normal item
```

Section dividers may be smaller.

Collapsed state uses tooltips.

---

# 39. NAVIGATION DENSITY

Do not create a very tall sidebar with all capabilities flat.

Group modules.

Example:

```txt
Cá nhân
  Tổng quan
  Hồ sơ
  Chấm công
  WFH
  Daily Report

Công việc
  Nghỉ phép
  Chi phí
  Email
  Hợp đồng
  Phiếu lương

Cập nhật
  Thông báo
```

Role-specific groups appear dynamically.

AI apps should appear under a clear specialist area when authorized.

---

# 40. VISUAL ASSET STRATEGY

Use visual assets selectively to strengthen product identity.

The app should not depend on illustrations for usability, but custom branded assets may be used for:

```txt
Login
Welcome / onboarding
AI application landing states
Empty states
No-results states
Module intro pages
Setup flows
Email empty state
```

Preferred asset formats:

```txt
SVG for vector illustration/pattern
WebP/PNG for complex raster art
```

Use local assets.

Do not hotlink fragile third-party demo images.

---

# 41. CUSTOM ILLUSTRATION STYLE

If custom illustrations are introduced, they must match oHRiise:

- dark-compatible;
- clean;
- geometric;
- restrained;
- abstract;
- people/workforce-inspired without childish cartoon characters;
- blue/cyan/green accent derived from official brand;
- no generic SaaS blob art;
- no random 3D floating people;
- no stock-style diversity illustrations.

Think:

```txt
technical editorial illustration
enterprise product art
abstract workforce intelligence
data/evidence motifs
```

---

# 42. ASSET USAGE LIMIT

Illustrations are accents.

Do not place them inside every operational screen.

Avoid large decorative art in:

- permission matrix;
- employee table;
- AI evidence review;
- audit log;
- timesheet;
- approval queue;
- contract data tables.

Operational workspaces prioritize function.

---

# 43. AI APP LANDING VISUALS

AI CV and WFH AI may each have a distinctive visual motif.

AI CV motif may suggest:

```txt
matching
candidate graph
skills
requirements
evidence
```

WFH AI motif may suggest:

```txt
timeline
remote work
evidence
human review
signal confidence
```

Both must still belong to the same oHRiise brand family.

---

# 44. AVOID GENERIC CARD SOUP

Do not solve every design problem with a bordered card.

Use:

- open layout regions;
- split panels;
- thin separators;
- grouped lists;
- inline metadata;
- toolbars;
- sticky side inspectors;
- meaningful whitespace.

Cards should represent real conceptual modules.

---

# 45. DASHBOARD OVERVIEW IS NOT THE WHOLE PRODUCT

Metrics such as:

```txt
WFH today
Evidence coverage
Needs review
AI match
Candidate count
```

belong in overview surfaces.

They should not dominate deep work screens.

Once the user enters a specialist workflow, transition from overview to workspace.

---

# 46. VISUAL HIERARCHY FOR AI

AI app screen hierarchy:

```txt
Context
    ↓
Entity
    ↓
Primary evidence / analysis
    ↓
Uncertainty / gaps
    ↓
Human action
    ↓
History / audit
```

Do not invert this by placing KPIs before the actual review task.

---

# 47. HUMAN ACTIONS MUST BE PROMINENT

In AI workspaces, the UI must make human actions visible.

Examples:

```txt
Shortlist
Needs Review
Compare
Add Note
Mark Valid
Add Context
Resolve Case
Request Clarification
```

Actions should not be buried at the bottom of a giant information panel.

Use sticky or contextual action bars when appropriate.

---

# 48. EMPTY STATES IN AI APPS

Do not show a huge empty dark rectangle.

Use:

- concise text;
- subtle branded illustration or motif;
- meaningful CTA.

Examples:

```txt
No candidates awaiting review
[Open Requisitions]
```

```txt
No WFH cases require review
All reviewed sessions are currently resolved.
```

---

# 49. FILTER & SEARCH QUALITY

AI apps must support useful filters.

AI CV:

```txt
requisition
score range
confidence
review state
skills
experience
reviewer
```

WFH AI:

```txt
date
team
employee
confidence
review status
evidence coverage
Daily Report alignment
```

Use compact filter toolbars.

Do not make filters into giant form cards.

---

# 50. DETAIL DENSITY

Dense does not mean tiny.

Use comfortable vertical rhythm.

Rows should be scannable.

Primary entity labels should be readable at a glance.

Do not hide important information in 11px text to fit more content.

---

# 51. RESPONSIVE BEHAVIOR FOR AI

Desktop:

- multi-pane;
- resizable;
- dense;
- review-focused.

Tablet:

- 2-pane or collapsible inspector.

Mobile:

- stacked entity detail;
- bottom sheet / drawer for inspector;
- preserved actions.

Do not simply shrink the desktop three-column layout.

---

# 52. USER EXPERIENCE QUALITY BAR

The application should feel like:

```txt
a polished enterprise SaaS product
+
a purpose-built HR operating system
+
two specialist AI applications
```

It must not feel like:

```txt
a university CRUD dashboard
a generated admin template
a Figma prototype with dead controls
a collection of KPI cards
```

---

# 53. REFINEMENT PASS — MANDATORY

After the core functionality is working, perform a dedicated premium refinement pass.

Audit every screen for:

- typography scale;
- spacing;
- dead space;
- text-to-container proportion;
- visual hierarchy;
- status alignment;
- icon alignment;
- sidebar usability;
- responsive behavior;
- hover/focus states;
- chart density;
- table density;
- component consistency;
- theme consistency;
- brand fidelity;
- AI product depth.

Do not add new business features during this refinement pass unless required to complete an already defined workflow.

---

# 54. SCREEN REVIEW QUESTIONS

For each screen ask:

```txt
Does this look like a real product?
Is the text too small?
Is the content too sparse?
Is the layout just cards?
Does the primary task stand out?
Does the user know what to do next?
Does this screen look unique to oHRiise?
Does this feel like an application rather than an information sheet?
```

If the answer is weak, refine.

---

# 55. AI APP REVIEW QUESTIONS

For AI CV:

```txt
Can HR actively review and compare?
Can HR understand why the model produced the result?
Can HR inspect evidence and gaps?
Can HR leave a human decision trail?
Does this feel like an ATS intelligence product?
```

For WFH AI:

```txt
Can Team Lead work through review cases efficiently?
Can low-confidence events be investigated?
Can Daily Report evidence be cross-checked?
Can the reviewer add context?
Is privacy context visible?
Does this feel like a human-review console?
```

If not, redesign.

---

# 56. EMAIL REVIEW QUESTIONS

```txt
Can every account access its mailbox?
Does the mailbox feel integrated into oHRiise?
Can users search and compose?
Are role-specific shared mailbox abilities permission-controlled?
Is Admin infrastructure separate from user mail usage?
```

---

# 57. WFH CORE REVIEW QUESTIONS

```txt
Does every WFH-capable employee have WFH lifecycle access?
Can the employee see monitoring/privacy context?
Is Daily Report integrated?
Are advanced review tools permission-controlled?
Is evidence access auditable?
```

---

# 58. FINAL OVERRIDE QUALITY STANDARD

Do not consider the refinement complete unless the result communicates:

1. the official oHRiise brand is respected;
2. the application shell is polished and collapsible;
3. typography is comfortably readable;
4. status components are visually balanced;
5. Email is a real shared core app;
6. WFH lifecycle applies platform-wide where relevant;
7. WFH evidence review remains specialized and permission-controlled;
8. AI CV feels like a dedicated ATS intelligence app;
9. WFH AI feels like a dedicated human-review application;
10. overview dashboards are subordinate to real workspaces;
11. visual assets strengthen branding without overwhelming operations;
12. the UI no longer looks generic or AI-generated.

---

# 59. EXECUTION INSTRUCTION FOR CODEX

When this override is loaded:

1. keep the existing working business logic;
2. inspect the current implementation;
3. identify screens violating this override;
4. prioritize app shell, logo fidelity, typography, sidebar collapse, and status composition;
5. restructure AI CV into a first-class embedded application;
6. restructure WFH AI into a first-class embedded application;
7. add Email as a common personnel module;
8. ensure WFH foundational capability exists for all relevant personnel accounts;
9. preserve dynamic authorization;
10. run a final visual refinement pass.

Do not rebuild the application from zero unless the current architecture makes compliance impossible.

Prefer targeted refactoring.

Preserve working flows.

---

# 60. FINAL DIRECTIVE

The final product should feel like:

> **oHRiise is one enterprise HR platform containing several high-quality work surfaces, including two specialist AI applications, not one dashboard with many pages.**

The AI applications must feel distinct enough to stand on their own while remaining unmistakably part of oHRiise.

The brand must feel intentional.

The UI must feel usable.

The typography must feel confident.

The visual hierarchy must feel expensive.

The interactions must feel finished.
