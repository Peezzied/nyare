-- Dev fixtures: Initial student account (matches VITE_DEV_USER=dev_student)
INSERT OR IGNORE INTO users (id, username, created_at, updated_at)
VALUES (
    1,
    'dev_student',
    '2026-10-15 00:00:00.000',
    '2026-10-15 00:00:00.000'
);

-- Repair dev databases seeded before the timestamp format fix.
UPDATE users
SET created_at = '2026-10-15 00:00:00.000',
    updated_at = '2026-10-15 00:00:00.000'
WHERE id = 1 AND created_at = '2026-10-15T00:00:00Z';

-- Dev fixtures: Courses from StudyPlannerEngineIntegrationTest (user_id = 1)
INSERT OR IGNORE INTO courses (id, name, description, user_id)
VALUES
    (3, 'Computer Architecture and Organization', 'CS Core Course', 1),
    (4, 'Principles of Programming Languages', 'CS Core Course', 1),
    (5, 'GE Elective 1 - Living in the IT Era', 'General Education Elective', 1),
    (6, 'Calculus 2', 'Mathematics Course', 1),
    (7, 'Readings in Philippine History', 'General Education Course', 1),
    (8, 'Mobile Computing', 'CS Elective Course', 1),
    (9, 'Object-Oriented Programming', 'CS Core Course', 1),
    (10, 'Physical Activities Toward Health & Fitness 3 (PATHFit 3)', 'Physical Education', 1);

-- Dev fixtures: Weekly class schedule from StudyPlannerEngineIntegrationTest
-- start_time/end_time are stored as epoch millis for the local dev timezone (UTC+8).
INSERT OR IGNORE INTO schedules (id, course_id, day, start_time, end_time)
VALUES
    (1, 3, 'MONDAY', -1800000, 1800000),
    (2, 4, 'MONDAY', 3600000, 9000000),
    (3, 5, 'MONDAY', 9000000, 14400000),
    (4, 6, 'MONDAY', 19800000, 27000000),
    (5, 7, 'MONDAY', 27000000, 30600000),
    (6, 8, 'TUESDAY', 9000000, 19800000),
    (7, 9, 'TUESDAY', 19800000, 30600000),
    (8, 3, 'WEDNESDAY', -1800000, 9000000),
    (9, 3, 'WEDNESDAY', 12600000, 16200000),
    (10, 6, 'WEDNESDAY', 19800000, 27000000),
    (11, 7, 'WEDNESDAY', 27000000, 30600000),
    (12, 8, 'THURSDAY', 9000000, 16200000),
    (13, 9, 'THURSDAY', 19800000, 27000000),
    (14, 4, 'FRIDAY', 3600000, 9000000),
    (15, 5, 'FRIDAY', 9000000, 14400000),
    (16, 10, 'FRIDAY', 19800000, 27000000),
    (17, 7, 'FRIDAY', 27000000, 30600000);
