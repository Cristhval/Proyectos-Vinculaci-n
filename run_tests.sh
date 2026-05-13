#!/bin/bash
# ==========================================
#  EJECUTOR DE TESTS AUTOMATIZADOS
#  Sistema de Gestion de Proyectos
# ==========================================

echo "=========================================="
echo "  EJECUTOR DE TESTS AUTOMATIZADOS"
echo "  Sistema de Gestion de Proyectos"
echo "=========================================="
echo ""
echo "Activando entorno virtual..."
source .venv/bin/activate
echo ""
echo "Ejecutando todos los tests..."
echo "------------------------------------------"
python manage.py test --verbosity=2
echo "------------------------------------------"
echo ""
read -p "Presiona Enter para salir..."
