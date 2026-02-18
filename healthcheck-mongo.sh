#!/bin/sh
# MongoDB health check - simple ping from localhost
mongo --eval "db.adminCommand('ping').ok" --quiet
