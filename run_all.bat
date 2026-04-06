@echo off
echo Starting Crop Disease Detection Project...

:: Navigate to backend
cd backend

:: Activate virtual environment
call venv\Scripts\activate

:: Start Flask backend
start cmd /k python main.py

start cmd /k python fertilizer_app.py

start cmd /k python crop_app.py

:: Go to frontend
cd ../frontend

:: Start frontend
timeout /t 3
start cmd /k npm run dev

echo Project started successfully!
pause