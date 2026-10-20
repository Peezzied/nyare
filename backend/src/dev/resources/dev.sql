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

-- Dev fixtures: Initial courses linked to dev_student (user_id = 1)
INSERT OR IGNORE INTO courses (id, name, description, user_id)
VALUES (
    1,
    'CS101',
    'Introduction to Computer Science',
    1
);

INSERT OR IGNORE INTO courses (id, name, description, user_id)
VALUES (
    2,
    'MATH201',
    'Discrete Mathematics',
    1
);
