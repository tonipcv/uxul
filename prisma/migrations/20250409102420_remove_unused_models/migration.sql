-- This is an empty migration.

-- Drop unused models in reverse order of dependencies
DROP TABLE IF EXISTS "PomodoroStar";
DROP TABLE IF EXISTS "Thought";
DROP TABLE IF EXISTS "Checkpoint";
DROP TABLE IF EXISTS "Circle";
DROP TABLE IF EXISTS "DayProgress";
DROP TABLE IF EXISTS "Habit";
DROP TABLE IF EXISTS "EisenhowerTask";
DROP TABLE IF EXISTS "Task";
DROP TABLE IF EXISTS "Day";
DROP TABLE IF EXISTS "KeyResult";
DROP TABLE IF EXISTS "Goal";
DROP TABLE IF EXISTS "Week";
DROP TABLE IF EXISTS "Cycle";