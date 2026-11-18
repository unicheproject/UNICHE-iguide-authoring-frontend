#!/bin/bash
cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-3\verify\v1-chrome\\$*" 2>&1 | grep -v "^$"
