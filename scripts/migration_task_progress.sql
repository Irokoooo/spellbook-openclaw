-- Migration: add progress column to tasks table
-- Run in Supabase SQL Editor

alter table tasks add column if not exists progress text default null;
