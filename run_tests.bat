@echo off
echo ==========================================
echo  EJECUTOR DE TESTS AUTOMATIZADOS
echo  Sistema de Gestion de Proyectos
echo ==========================================
echo.
echo Activando entorno virtual...
call .venv\Scripts\activate.bat
echo.
echo Ejecutando todos los tests...
echo ------------------------------------------
python manage.py test --verbosity=2
echo ------------------------------------------
echo.
echo Presiona cualquier tecla para salir...
pause > nul
