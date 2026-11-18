#!/bin/bash
cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-1\audit\s13-media\\$1 $2 $3" 2>&1 | tr -d '\r'
