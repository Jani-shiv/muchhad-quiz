-- muchhad-quiz Initial PostgreSQL Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  settings JSONB NOT NULL DEFAULT '{
    "negativeMarking": false,
    "negativePenaltyRatio": 0.25,
    "allowAnswerChange": false,
    "enablePowerUps": true,
    "enableReactions": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  type VARCHAR(30) NOT NULL CHECK (type IN ('single_choice', 'multiple_choice', 'true_false', 'type_answer', 'poll')),
  text TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB NOT NULL DEFAULT 'null'::jsonb,
  time_limit INTEGER NOT NULL DEFAULT 20 CHECK (time_limit >= 5 AND time_limit <= 120),
  points_mode VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (points_mode IN ('standard', 'double', 'none')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_order ON questions(quiz_id, sort_order);

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'LOBBY' CHECK (status IN ('LOBBY', 'ACTIVE', 'PAUSED', 'FINISHED')),
  player_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_host ON game_sessions(host_id, created_at DESC);

CREATE TABLE IF NOT EXISTS session_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_token VARCHAR(128) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  avatar_id INTEGER NOT NULL DEFAULT 1,
  final_score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  total_response_ms BIGINT NOT NULL DEFAULT 0,
  final_rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_session_rank ON session_results(session_id, final_rank ASC);
