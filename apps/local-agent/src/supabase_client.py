"""
supabase_client.py — thin wrapper around supabase-py for the agent.
"""
from supabase import create_client, Client


def get_client(url: str, key: str) -> Client:
    return create_client(url, key)
