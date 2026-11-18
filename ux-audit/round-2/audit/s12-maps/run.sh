#!/bin/bash
cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-2\audit\s12-maps\\$1" 2>&1 | tr -d '\r'
