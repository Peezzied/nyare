# Few-Shot Learning Patterns for Nyare

Use few-shot examples when the model misclassifies notes or hallucinates dates.

## 1. Preserving Uncertainty (No Hallucinated Deadlines)

```text
Input Note:
"Reviewed Chapter 4 on sorting algorithms today. Need to implement quicksort."

Extracted Output:
{
  "tasks": [
    {
      "noteRef": "n1",
      "title": "Implement quicksort",
      "description": "Implement quicksort algorithm from Chapter 4",
      "scheduledDate": null,
      "estimatedMinutes": null
    }
  ],
  "events": [],
  "contexts": [
    {
      "noteRef": "n1",
      "value": "Covered Chapter 4 on sorting algorithms"
    }
  ]
}
```

## 2. Rigid Academic Event Extraction

```text
Input Note:
"Midterm exam announced for next Friday October 3 at 10:00 AM."

Extracted Output:
{
  "tasks": [],
  "events": [
    {
      "noteRef": "n1",
      "title": "Midterm Exam",
      "description": "Midterm examination",
      "deadline": "2026-10-03T10:00:00"
    }
  ],
  "contexts": []
}
```

## 3. Event-Anchored Study Task Generation

```text
Existing Event:
Midterm Exam on 2026-10-03

Extracted Plan Task:
{
  "noteRef": "n1",
  "title": "Study for Midterm Exam",
  "description": "Prepare for upcoming exam",
  "scheduledDate": "2026-10-01",
  "estimatedMinutes": 90
}
```

## 4. Cross-Disciplinary Baseline vs. Uncertainty Preservation

Few-shot examples must represent diverse academic disciplines and avoid software-only bias:

```text
Input Note (Digital Workspace Onboarding):
"Need to create an account and configure the online chemistry lab portal before Tuesday."

Extracted Output:
{
  "tasks": [
    {
      "noteRef": "n1",
      "title": "Configure online chemistry lab portal",
      "description": "Create an account and configure the online chemistry lab portal before Tuesday",
      "scheduledDate": "2026-09-29",
      "estimatedMinutes": 30
    }
  ]
}
```