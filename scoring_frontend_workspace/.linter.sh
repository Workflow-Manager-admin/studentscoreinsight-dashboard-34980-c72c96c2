#!/bin/bash
cd /home/kavia/workspace/code-generation/studentscoreinsight-dashboard-34980-c72c96c2/scoring_frontend_workspace/scoring_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

