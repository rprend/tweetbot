#!/bin/bash

# Create the table first
sqlite3 refresh.db "CREATE TABLE IF NOT EXISTS tokens (key TEXT PRIMARY KEY, value TEXT);"

# Then insert the token
sqlite3 refresh.db "INSERT OR REPLACE INTO tokens (key, value) VALUES ('refresh_token', '$1');"