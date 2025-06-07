#!/bin/bash
cd /home/kavia/workspace/code-generation/kollywood-quizverse-35600-5be2a52b/kollywood_quizverse
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

