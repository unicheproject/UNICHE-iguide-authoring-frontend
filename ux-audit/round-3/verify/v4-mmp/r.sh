#!/bin/bash
# usage: r.sh script args...
f=$1; shift
cd /mnt/c/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/verify/v4-mmp
timeout 170 cmd.exe /c "cd /d C:\\Users\\mirto\\IdeaProjects\\iguide\\uniche_iguide_frontend && node ux-audit\\round-3\\verify\\v4-mmp\\$f $*" 2>&1 | tr -d '\r'
