@echo off
echo ==========================================
echo  GENERADOR DE DOCUMENTACION PDF
echo  Sistema de Gestion de Proyectos
echo ==========================================
echo.
echo Activando entorno virtual...
call .venv\Scripts\activate.bat
echo.
echo Generando documentacion PDF...
echo ------------------------------------------
python generate_docs_pdf.py
echo ------------------------------------------
echo.
echo Presiona cualquier tecla para salir...
pause > nul
