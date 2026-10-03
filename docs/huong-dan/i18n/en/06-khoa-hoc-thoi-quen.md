# 6. Habit science

[← 5. Family and settings](05-gia-dinh-va-cai-dat.md) · [Table of contents](README.md) · [Next: 7. Plans and payment →](07-goi-va-thanh-toan.md)

<!--op-->## In this chapter

[Principles](#nguyen-tac) · [47-habit framework](#khung) · [16 strengths and 7 ways of giving](#chan-dung) · [Four phases of a habit](#bon-pha) · [In-app suggestion logic](#logic) · [Suggestion rules](#goi-y) · [What the app does not claim](#khong-tuyen-bo) · [Features based on this knowledge](#ung-dung) · [Related](#lien-quan)<!--/op-->

This document explains **why** the app works this way, so parents can understand its suggestions and know when to do things differently. The full source-based version is [Habit science and adaptive logic](../habit-science-and-adaptive-logic.md); all public content is checked against the [claims ledger](../claims-ledger.md).

<a id="nguyen-tac"></a>
## Principles

1. **There is no “21-day” number.** Research shows that the time it takes a behavior to become nearly automatic varies greatly from person to person, from a few weeks to a few months, and has mainly been measured in adults. The app does not promise that a habit will form after a fixed number of days.
2. **Cues matter more than willpower.** A specific “if…then…” statement (“After brushing my teeth, I read one page”) and a stable context help a child get started more easily ([cue](04-thiet-ke-thoi-quen.md#chuong-trinh)).
3. **Missing once does not ruin a habit.** Simply continue the next day, without punishment or starting over. Missing several times in a row is a sign to adjust the approach, not that the child is “lazy.”
4. **Give the right level of support, then ease off**: do it together → remind → let the child do it independently.
5. **Specific acknowledgment works better than conditional rewards.** Clearly name what the child just did; keep material rewards light and gradually reduce them. Stars, streaks, and badges are only for motivation; they **do not** judge character or compare children.
6. **Do not take on too many new habits at once.** The app gives age-based soft warnings as a design convention, not as a number directly supported by evidence.
7. **Sleep is the foundation** for every other habit.

The specific thresholds (7/10 times, 8/10 times, 60%…) recorded in the source document have **low** confidence: they are hypotheses that need to be checked against real data, not scientific facts.

<a id="khung"></a>
## 47-habit framework

The framework is a set of **47 habits for children ages 0–18**, organized along two dimensions:

**Five stages** (age ranges are suggestions, not tests):

| Stage | Age | Name | Adult role |
|---|---|---|---|
| GD1 | 0–3 | Safety and sensory foundations | Model and describe |
| GD2 | 3–6 | Exploration and willpower | Do it together and remind |
| GD3 | 6–12 | Diligence and skills | Supervise and do it together |
| GD4 | 12–15 | Identity and emotions | Support them and follow shared rules together |
| GD5 | 15–18 | Direction and responsibility | Advise and back them up |

**Five domains**: Inner life, Health, Relationships, Study, Finance.

Each habit includes **meaning for the child**, **how adults can support it**, progress signs, and concept tags (strengths, ways of giving). Child profiles use **four age groups** (0–3, 3–6, 6–12, 12–18) for the starter habit pack and interface; the [roadmap](04-thiet-ke-thoi-quen.md#lo-trinh) and [library](04-thiet-ke-thoi-quen.md#khung-47) use the five stages above. Data and editorial workflows: [Habit framework data contract](../habit-framework-data-contract.md).

The framework is available in the app ([library](04-thiet-ke-thoi-quen.md#khung-47)) and on the website ([Habit framework page](11-website-va-trang-cong-khai.md#trang-khung)).

<a id="chan-dung"></a>
## 16 strengths and 7 ways of giving

**The 16 strengths** are *directions for growth*, not personality types to label children: Scholarly Wisdom, Peaceful Joy, Whole Character, Excellence, Outstanding Ability, Balanced Physique, Iron Health, Extraordinary Advocacy, Wise Communication, Self-Discipline, Clear Vision, Understanding Life, Leading with Compassion, Virtue in Action, Abundance and Good Fortune, and **Successful Humanity** (the 16th strength and overall goal). They are divided into four groups: character, virtue, capability, and vision.

- Each strength is a [badge](02-man-hinh-be.md#huy-hieu) unlocked when the child completes the required number of related actions; strength 16 unlocks when the child holds all the others.

**The 7 ways of giving** are seven simple ways everyone can give each day: **a smile** (giving through the face), **a warm gaze** (giving through the eyes), **kind words** (giving through speech), **gratitude** (giving through the heart), **forgiveness** (giving through an open heart), **acts of kindness** (giving through service), and **making room for others** (giving through space). The app uses everyday language and does not promise merit or spiritual results.

The **16 strengths & giving guide** (the button in the top bar) has three tabs:

1. **16 strengths and 4 stages**: choose your child’s age, view detailed actions for each strength, then choose **“Apply for (name)”** to add the action set to the schedule.
2. **7 ways to give**: the meaning and daily practice of each one.
3. **Lead by example and 6 principles**: the art of *leading by example* (“Do not only explain the value — live what you want your child to learn”), the **six golden words for wise parenting** (simple, joyful, trusting, gentle, consistent, intentional), and a **five-question nightly reflection checklist** (take two minutes before bed).

For children **ages 0–3**, children learn mainly through observation, so the screen shows the “Parent role-model journal”: parents practise the 16 character-building actions each day to model them for their child, and the record is attributed to the parents rather than rewarded to the child.

<a id="bon-pha"></a>
## Four phases of a habit

Each child’s habit passes through four phases. The phase is determined by **what the child actually does**, not by the number of days.

| Phase | Main task | What adults do |
|---|---|---|
| 1. **Set the cue** (setting the cue) | Choose the context and the “if…then…” statement | Decide together and record it |
| 2. **Build the routine** | Repeat regularly in the same context | Do it together or remind, and praise specifically |
| 3. **Ease off support** | Move from doing it together to reminding to doing it independently | Gradually withdraw support step by step |
| 4. **Now a routine** | Check less often | Acknowledge with words and intervene less |

Phase changes: 1→2 when a cue plan exists and the child has tried it at least 3 times; 2→3 after completing at least 7 of the last 10 times (weekly habits: 5 of 6); 3→4 when the child has **done it independently** at least 8 of the last 10 times (weekly: 5 of 6); return to phase 3 if the result falls below 6 of 10. Missing once does not change the phase.

<a id="logic"></a>
## In-app suggestion logic

Phases and suggestions are **calculated** from observed data, not stored as fixed values. Each time a habit is due is an *opportunity*, with one of these results: did it independently, needed a reminder, did it together, did not record how it was done, missed it, or the child chose to do it later (not counted as missed). A family [pause](05-gia-dinh-va-cai-dat.md#tam-nghi) is excluded from opportunities. “Did not record how it was done” counts as completed but **not** as independent, so [recording how the child did it](03-hom-nay-va-duyet-viec.md#muc-ho-tro) helps make suggestions more accurate.

The three difficulty levels (simple, moderate, complex) are used only to show “usually takes a few weeks / a few weeks to a few months / a few months” and set the “may be stuck” suggestion threshold; multiply by 1.5 for children under age 6. Who confirms the support level also varies by age: parents for ages 0–3; parents confirm for ages 3–12; parents confirm and the child helps design it for ages 12–15; from age 15, the child confirms their own independent performance.

<a id="goi-y"></a>
### Suggestion rules

| Suggestion | When it appears | Content |
|---|---|---|
| **Stuck in the building phase** | The number of weeks in phase 2 exceeds the threshold for the difficulty level | Make it smaller, change the cue or time, and add a plan for weekends and busy days |
| **Relying on reminders** | In phase 3, at least 6 of the last 10 times were “needed a reminder” | Switch to a visual cue or let the child set the reminder |
| **Too many new habits** | The number of phase 1–2 habits exceeds the age limit | Temporarily pause one habit |
| **Almost a routine** | The threshold for moving to phase 4 has been reached | Switch to praise in words and gradually reduce stars |
| **Step back one level** | 3 misses in the last 5 times in phase 3 | Return to the previous support level |
| **Check how it is done** | 3 consecutive misses in phase 2 | Review the cue, size, and weekend plan |
| **Record how the child did it** | More than half of the recent times have no record of how it was done, and the habit is close to the phase-change threshold | Gently ask, “How did you do it?” |

The limit for new habits at the same time (a soft warning, not a block) is: 1 for ages 0–3; 2 for ages 3–6; 3 for ages 6–15; 4 from age 15. A maximum of 3 suggestions is shown per child at a time; the “Later” suggestion stays hidden for 14 days. This analysis is **only for guiding parents** and is not used to rank or compare children.

<a id="khong-tuyen-bo"></a>
## What the app does not claim

- It does not say that a habit forms after a fixed number of days or promise a particular result (better studying, better behavior) for an individual child.
- It does not say that badges, streaks, or stars have “been proven” to increase motivation.
- It does not label children (“slow,” “weak,” “lazy”) or compare them.
- Health content does not replace advice from a doctor or psychologist.
- The framework’s philosophical content is expressed in everyday language, not presented as a scientific conclusion.

<a id="ung-dung"></a>
## Features based on this knowledge

| Knowledge | Feature |
|---|---|
| “If…then…” cues | [Cues and programs](04-thiet-ke-thoi-quen.md#chuong-trinh) |
| Four phases, easing off support | [Record how the child did it](03-hom-nay-va-duyet-viec.md#muc-ho-tro), [Progress and suggestions](03-hom-nay-va-duyet-viec.md#tien-trien), [Weekly review](03-hom-nay-va-duyet-viec.md#nhin-lai-tuan) |
| Missing once is okay | [Streak](02-man-hinh-be.md#sao-cap-chuoi), [do it later](02-man-hinh-be.md#hoan-thanh), [pause](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| Fewer new habits at once | [Age-based roadmaps](04-thiet-ke-thoi-quen.md#lo-trinh) (one habit added at each step), limit warnings |
| Praise in words | [Praise](02-man-hinh-be.md#hoan-thanh), [Morning letter](02-man-hinh-be.md#thu-buoi-sang), [experience-first reward store](04-thiet-ke-thoi-quen.md#kho-qua) |
| 16 strengths, 7 ways of giving | [Badge](02-man-hinh-be.md#huy-hieu), [47-habit framework](04-thiet-ke-thoi-quen.md#khung-47), guide |
| Leading by example | Children ages 0–3, the “Parent role-model profile” in the top bar |

<a id="lien-quan"></a>
## Related

- Use the framework and programs in practice: [4. Habit design](04-thiet-ke-thoi-quen.md).
- View suggestions and progress: [3. Today and task review](03-hom-nay-va-duyet-viec.md).
- Articles for parents on the website: [11. Website and public pages](11-website-va-trang-cong-khai.md#blog).
- Rules for children’s data: [9. Security and privacy](09-bao-mat-va-rieng-tu.md).
