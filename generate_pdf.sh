#!/bin/bash
# ==========================================
#  GENERADOR DE DOCUMENTACION PDF
#  Sistema de Gestion de Proyectos
# ==========================================

echo "=========================================="
echo "  GENERADOR DE DOCUMENTACION PDF"
echo "  Sistema de Gestion de Proyectos"
echo "=========================================="
echo ""
echo "Activando entorno virtual..."
source .venv/bin/activate
echo ""
echo "Generando documentacion PDF..."
echo "------------------------------------------"
python generate_docs_pdf.py
echo "------------------------------------------"
echo ""
read -p "Presiona Enter para salir..."
