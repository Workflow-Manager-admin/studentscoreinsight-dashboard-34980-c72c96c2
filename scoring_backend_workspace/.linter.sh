#!/bin/bash
cd /home/kavia/workspace/code-generation/studentscoreinsight-dashboard-34980-c72c96c2/scoring_backend_workspace/scoring_backend
source venv/bin/activate
flake8 .
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

