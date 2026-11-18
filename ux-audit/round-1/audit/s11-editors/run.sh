#!/bin/bash
s=$1; shift
cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-1\audit\s11-editors\\$s $*" 2>&1 | tr -d '\r'
