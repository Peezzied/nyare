# Quickstart: Configurable Planning Horizons

This guide provides runnable scenarios to validate user horizon configuration end-to-end.

## Prerequisites

- Java 25 & Gradle (backend in `app/`)
- Node.js & npm (frontend in `frontend/`)
- Active user session (e.g. logged into test user via `/api/users/login` or UI account picker)

---

## Validation Scenario 1: Settings REST API Verification

Verify the settings endpoints enforce validation bounds and persist changes per user session.

### 1. Read Default Settings
```bash
# Verify new user defaults to 14 days
curl -s -b cookies.txt http://localhost:8080/api/settings
```
**Expected Outcome**: `{"planningHorizonDays":14,"backdatingHorizonDays":14}`

### 2. Update to Valid Horizons
```bash
curl -s -b cookies.txt -X PUT http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{"planningHorizonDays":21,"backdatingHorizonDays":30}'
```
**Expected Outcome**: Status 200 with `{"planningHorizonDays":21,"backdatingHorizonDays":30}`

### 3. Reject Out-of-Bounds Values
```bash
curl -s -b cookies.txt -X PUT http://localhost:8080/api/settings \
  -H "Content-Type: application/json" \
  -d '{"planningHorizonDays":0,"backdatingHorizonDays":61}'
```
**Expected Outcome**: Status 400 Problem Detail with field validation errors.

---

## Validation Scenario 2: Note Backdating Enforcement

Prove that note creation validates against the user's active `backdatingHorizonDays`.

### 1. Note Creation Within Horizon
- Given `backdatingHorizonDays = 30`:
- Post a note with `entryDate = today - 25 days`:
```bash
# Valid creation
curl -s -b cookies.txt -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{"courseId":1,"content":"Catching up on week 2 lecture notes","entryDate":"<25-days-ago>"}'
```
**Expected Outcome**: Status 201 Created.

### 2. Note Creation Exceeding Horizon
- Post a note with `entryDate = today - 35 days`:
```bash
# Invalid creation
curl -s -b cookies.txt -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{"courseId":1,"content":"Too old lecture notes","entryDate":"<35-days-ago>"}'
```
**Expected Outcome**: Status 400 Bad Request with message indicating entry date exceeds the maximum backdating limit.

---

## Validation Scenario 3: Frontend Settings Page & Reset Flow

Verify the frontend user interface in browser:

1. Open http://localhost:5173 (or bundled http://localhost:8080).
2. Click the hamburger menu button in the top navigation bar.
3. Verify "Settings" appears with a gear icon in the drawer navigation list.
4. Click "Settings" to navigate to `/settings`.
5. Verify the fields show the current values (e.g. 14 / 14).
6. Edit planning horizon to `25`, backdating horizon to `20`.
7. Click "Save". Verify a green toast confirms "Settings saved successfully".
8. Click "Reset to Defaults". Verify both inputs instantly revert to `14`.
9. Click "Save" to commit default restoration.

---

## Automated Verification Commands

```bash
# Backend unit & slice tests
cd app
./gradlew test --tests "group.four.nyare.nyare.controller.SettingsControllerTest"
./gradlew test --tests "group.four.nyare.nyare.service.UserSettingsServiceImplTest"

# Frontend unit tests
cd ../frontend
npm run test:unit -- src/views/__tests__/SettingsView.spec.ts
```
