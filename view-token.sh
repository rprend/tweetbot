#!/bin/bash

sqlite3 refresh.db "SELECT value FROM tokens WHERE key = 'refresh_token';"