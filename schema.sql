-- =========================================================
-- SMP DATABASE MANAGEMENT & STAFF SUPERVISION SCHEMA
-- Run this in your Supabase or PostgreSQL SQL Editor
-- =========================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CANDIDATES TABLE (Interview evaluations)
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ign VARCHAR(64) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    interviewer_ign VARCHAR(64) DEFAULT 'Staff',
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast searching by IGN and filtering by status / rating
CREATE INDEX IF NOT EXISTS idx_candidates_ign ON candidates(ign);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_rating ON candidates(rating);

-- 2. STAFF MEMBERS TABLE (Staff roster & LOA tracking)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ign VARCHAR(64) NOT NULL,
    discord_tag VARCHAR(64),
    role VARCHAR(32) NOT NULL CHECK (role IN ('Owner', 'Developer', 'Admin', 'Moderator', 'Interviewer', 'Builder')),
    department VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Hiatus', 'LOA', 'Inactive')),
    pin VARCHAR(128),
    loa_reason TEXT,
    loa_return_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- 3. DEPARTMENTS TABLE (Department deficiency standards)
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    min_required_staff INTEGER NOT NULL DEFAULT 2,
    description TEXT
);

-- SEED DEPARTMENTS
INSERT INTO departments (id, name, min_required_staff, description) VALUES
('recruitment', 'Recruitment & Interviews', 3, 'Handles applicant voice interviews, 1-5 star evaluations, and onboarding'),
('moderation', 'Server Moderation', 4, 'In-game chat moderation, anti-griefing, rule enforcement, ticket handling'),
('development', 'Development & Tech', 2, 'Plugin maintenance, server performance, database and discord bots'),
('building', 'Building & World Design', 2, 'Spawn builds, community hubs, road networks, and season resets'),
('events', 'Community & Events', 2, 'Weekly mini-games, lore events, and tournaments')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    min_required_staff = EXCLUDED.min_required_staff,
    description = EXCLUDED.description;

-- SEED INITIAL DEVELOPER & INTERVIEWER ACCOUNTS
INSERT INTO staff (ign, discord_tag, role, department, status, pin, loa_reason, loa_return_date) VALUES
('Zenku8258', 'Zenku8258', 'Developer', 'Development & Tech', 'Active', '1234', '[PIN:1234]', NULL),
('Dream', 'Dream', 'Interviewer', 'Recruitment & Interviews', 'Active', NULL, NULL, NULL),
('Lccccccc4755', 'Lccccccc4755', 'Interviewer', 'Recruitment & Interviews', 'Active', NULL, NULL, NULL),
('bunnxyx', 'bunnxyx', 'Interviewer', 'Recruitment & Interviews', 'Active', NULL, NULL, NULL),
('.Avapaica', '.Avapaica', 'Interviewer', 'Recruitment & Interviews', 'Active', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- SEED RECOVERED CANDIDATES
INSERT INTO candidates (ign, rating, notes, interviewer_ign, status, tags) VALUES
('va nyavanya', 4, 'he’s 19 years old and newbie, experienced mc 3 months. he''s good and nicely to answer person to answer my all questions', 'bunnxyx', 'pending', '["Verified Audio/Mic", "Advanced Architecture"]'::jsonb),
('Layooopell2', 2, 'Hindi masyadong clear yung answers', '.Avapaica', 'pending', '["Verified Audio/Mic"]'::jsonb),
('fathersiterior', 5, 'Magaling sumagot mature sya friendly din', 'Dream', 'pending', '["Verified Audio/Mic"]'::jsonb),
('Goldsheep', 4, 'Builder po', 'Lccccccc4755', 'accepted', '["Verified Audio/Mic"]'::jsonb)
ON CONFLICT DO NOTHING;


