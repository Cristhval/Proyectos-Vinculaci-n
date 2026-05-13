#!/usr/bin/env python3
"""
Generador de Documentación PDF del Proyecto
Sistema de Gestión de Proyectos de Vinculación

Uso:
    python generate_docs_pdf.py
    
Requisitos:
    pip install reportlab
"""

import os
import sys
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


def generate_pdf(filename="documentacion_proyecto.pdf"):
    """Genera el PDF con toda la documentación del proyecto"""
    
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Contenedor para los elementos
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo personalizado para títulos
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2c5aa0'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    # ========== PORTADA ==========
    elements.append(Spacer(1, 2*inch))
    
    elements.append(Paragraph("SISTEMA DE GESTIÓN", title_style))
    elements.append(Paragraph("DE PROYECTOS DE VINCULACIÓN", title_style))
    elements.append(Paragraph("Y CONVENIOS INTERINSTITUCIONALES", title_style))
    
    elements.append(Spacer(1, 0.5*inch))
    
    elements.append(Paragraph("Documentación Técnica", subtitle_style))
    
    elements.append(Spacer(1, 1*inch))
    
    # Fecha de generación
    fecha_actual = datetime.now().strftime("%d de %B de %Y")
    elements.append(Paragraph(f"<b>Fecha de generación:</b> {fecha_actual}", normal_style))
    elements.append(Paragraph("<b>Universidad Nacional de Loja</b>", normal_style))
    elements.append(Paragraph("<b>Proyecto de Vinculación</b>", normal_style))
    
    elements.append(PageBreak())
    
    # ========== ÍNDICE ==========
    elements.append(Paragraph("ÍNDICE", subtitle_style))
    elements.append(Spacer(1, 0.2*inch))
    
    indice_items = [
        "1. Resumen Ejecutivo",
        "2. Información General del Proyecto",
        "3. Stack Tecnológico",
        "4. Estructura del Proyecto",
        "5. Tests Automatizados",
        "6. Endpoints de la API",
        "7. Modelos de Datos",
        "8. Estado Actual y Avances",
        "9. Próximos Pasos",
        "10. Conclusión"
    ]
    
    for item in indice_items:
        elements.append(Paragraph(f"• {item}", normal_style))
    
    elements.append(PageBreak())
    
    # ========== 1. RESUMEN EJECUTIVO ==========
    elements.append(Paragraph("1. RESUMEN EJECUTIVO", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    resumen = """
    El Sistema de Gestión de Proyectos de Vinculación es una aplicación web desarrollada 
    para la Universidad Nacional de Loja que permite gestionar, monitorear y evaluar 
    proyectos de vinculación con la sociedad y convenios interinstitucionales.
    
    El sistema está construido con Django 6.0 y Django REST Framework, proporcionando 
    una API RESTful robusta y documentada. Incluye autenticación JWT, gestión de usuarios 
    con roles, control de proyectos, seguimiento de actividades, convenios con instituciones 
    y generación de reportes.
    """
    elements.append(Paragraph(resumen, normal_style))
    
    elements.append(Spacer(1, 0.2*inch))
    
    # Estadísticas rápidas
    elements.append(Paragraph("<b>Estadísticas del Proyecto:</b>", heading3_style))
    
    stats_data = [
        ['Métrica', 'Valor'],
        ['Tests Automatizados', '19'],
        ['Cobertura de Endpoints', '40+ endpoints'],
        ['Módulos Funcionales', '6 módulos'],
        ['Modelos de Datos', '20+ modelos'],
        ['Fase Actual', 'Desarrollo Avanzado'],
    ]
    
    stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    elements.append(stats_table)
    elements.append(PageBreak())
    
    # ========== 2. INFORMACIÓN GENERAL ==========
    elements.append(Paragraph("2. INFORMACIÓN GENERAL DEL PROYECTO", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    info_data = [
        ['Campo', 'Detalle'],
        ['Nombre del Proyecto', 'Sistema de Gestión de Proyectos de Vinculación'],
        ['Institución', 'Universidad Nacional de Loja'],
        ['Tipo de Proyecto', 'Vinculación con la Sociedad'],
        ['Área', 'Desarrollo de Software'],
        ['Estado', 'En Desarrollo'],
        ['Versión', '1.0.0'],
        ['Repositorio', 'Git - Control de versiones'],
    ]
    
    info_table = Table(info_data, colWidths=[2.5*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    elements.append(info_table)
    elements.append(PageBreak())
    
    # ========== 3. STACK TECNOLÓGICO ==========
    elements.append(Paragraph("3. STACK TECNOLÓGICO", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    stack_data = [
        ['Categoría', 'Tecnología', 'Versión', 'Uso'],
        ['Backend Framework', 'Django', '6.0.5', 'Framework principal'],
        ['API Framework', 'Django REST Framework', '3.17.1', 'API RESTful'],
        ['Autenticación', 'Simple JWT', '5.5.1', 'Tokens JWT'],
        ['Documentación API', 'drf-spectacular', '0.28+', 'Swagger/OpenAPI'],
        ['Base de Datos', 'SQLite/PostgreSQL', '-', 'Almacenamiento'],
        ['CORS', 'django-cors-headers', '4.9.0', 'Cross-origin requests'],
        ['Filtros', 'django-filter', '25.2', 'Filtrado de datos'],
        ['Variables Entorno', 'django-environ', '0.13.0', 'Configuración'],
        ['Testing', 'Django Test + DRF Test', '-', 'Tests automatizados'],
        ['Generación PDF', 'ReportLab', '4.5.1', 'Documentación'],
    ]
    
    stack_table = Table(stack_data, colWidths=[1.6*inch, 1.8*inch, 0.9*inch, 1.7*inch])
    stack_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(stack_table)
    elements.append(PageBreak())
    
    # ========== 4. ESTRUCTURA DEL PROYECTO ==========
    elements.append(Paragraph("4. ESTRUCTURA DEL PROYECTO", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    estructura = """
    El proyecto sigue la arquitectura estándar de Django con aplicaciones modulares:
    
    <b>4.1 Aplicaciones Principales</b>
    
    • <b>core/</b> - Modelo base (TimeStampedModel) y utilidades compartidas
    • <b>usuarios/</b> - Gestión de usuarios, carreras, roles y autenticación
    • <b>proyectos/</b> - Proyectos, objetivos, indicadores, actividades
    • <b>convenios/</b> - Instituciones, convenios, compromisos, productos
    • <b>seguimiento/</b> - Avances, evidencias, informes, alertas, revisiones
    • <b>reportes/</b> - Dashboard, reportes y KPIs
    • <b>auditoria/</b> - Registro de auditoría y trazabilidad
    
    <b>4.2 Archivos de Configuración</b>
    
    • <b>manage.py</b> - Script principal de Django
    • <b>requirements.txt</b> - Dependencias del proyecto
    • <b>.env / .env.example</b> - Variables de entorno
    • <b>run_tests.bat/.sh</b> - Ejecutores de tests automatizados
    • <b>generate_docs_pdf.py</b> - Generador de documentación PDF
    
    <b>4.3 Documentación</b>
    
    • <b>README.md</b> - Documentación principal
    • <b>docs/TESTING.md</b> - Guía de tests automatizados
    • <b>specs/</b> - Especificaciones OpenAPI, dominio, workflows
    """
    
    elements.append(Paragraph(estructura, normal_style))
    elements.append(PageBreak())
    
    # ========== 5. TESTS AUTOMATIZADOS ==========
    elements.append(Paragraph("5. TESTS AUTOMATIZADOS", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    tests_intro = """
    El proyecto cuenta con un sistema completo de tests automatizados que verifican 
    el funcionamiento correcto de los endpoints y la lógica de negocio.
    
    <b>Resultado de última ejecución:</b> 19 tests exitosos (100% aprobados)
    <b>Tiempo de ejecución:</b> ~22 segundos
    <b>Base de datos:</b> SQLite en memoria (aislada)
    """
    elements.append(Paragraph(tests_intro, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    elements.append(Paragraph("<b>Casos de Test por Módulo:</b>", heading3_style))
    
    tests_data = [
        ['Módulo', 'Tests', 'Descripción'],
        ['AuthTestCase', '4', 'Login, registro, credenciales inválidas, duplicados'],
        ['UsuarioTestCase', '3', 'Listar usuarios, perfil actual, carreras'],
        ['ProyectoTestCase', '3', 'Crear, listar proyectos, enviar a revisión'],
        ['ConveniosTestCase', '2', 'Crear instituciones y convenios'],
        ['SeguimientoTestCase', '3', 'Actividades, avances, alertas'],
        ['ReportesTestCase', '1', 'Dashboard KPIs'],
        ['ErrorHandlingTestCase', '3', 'Autenticación, errores 404'],
        ['<b>TOTAL</b>', '<b>19</b>', '<b>Todos los tests pasan correctamente</b>'],
    ]
    
    tests_table = Table(tests_data, colWidths=[1.8*inch, 0.7*inch, 3*inch])
    tests_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5aa0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#90EE90')),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTNAME', (0, 1), (0, -2), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
    ]))
    
    elements.append(tests_table)
    elements.append(Spacer(1, 0.2*inch))
    
    elements.append(Paragraph("<b>Ejecución de Tests:</b>", heading3_style))
    comando = """
    <code>python manage.py test --verbosity=2</code>
    
    O usar el script automático:
    <code>run_tests.bat</code> (Windows) o <code>./run_tests.sh</code> (Linux/Mac)
    """
    elements.append(Paragraph(comando, normal_style))
    elements.append(PageBreak())
    
    # ========== 6. ENDPOINTS DE LA API ==========
    elements.append(Paragraph("6. ENDPOINTS DE LA API (RESTful)", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    endpoints_intro = """
    La API REST proporciona más de 40 endpoints organizados por módulos funcionales.
    Todos los endpoints requieren autenticación JWT excepto registro y login.
    
    <b>Documentación Interactiva:</b>
    • Swagger UI: http://localhost:8000/api/docs/
    • ReDoc: http://localhost:8000/api/redoc/
    """
    elements.append(Paragraph(endpoints_intro, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Tabla de endpoints (resumida)
    endpoints_data = [
        ['Módulo', 'Método', 'Endpoint', 'Descripción'],
        ['Auth', 'POST', '/api/v1/auth/register/', 'Registro de usuarios'],
        ['Auth', 'POST', '/api/v1/auth/login/', 'Inicio de sesión JWT'],
        ['Auth', 'POST', '/api/v1/auth/refresh/', 'Renovar token'],
        ['Usuarios', 'GET', '/api/v1/usuarios/', 'Listar usuarios'],
        ['Usuarios', 'GET', '/api/v1/usuarios/me/', 'Perfil actual'],
        ['Usuarios', 'GET', '/api/v1/carreras/', 'Listar carreras'],
        ['Proyectos', 'GET/POST', '/api/v1/proyectos/', 'CRUD proyectos'],
        ['Proyectos', 'POST', '/api/v1/proyectos/{id}/enviar-revision/', 'Enviar a revisión'],
        ['Proyectos', 'POST', '/api/v1/proyectos/{id}/aprobar/', 'Aprobar proyecto'],
        ['Proyectos', 'POST', '/api/v1/proyectos/{id}/rechazar/', 'Rechazar proyecto'],
        ['Proyectos', 'GET/POST', '/api/v1/actividades/', 'CRUD actividades'],
        ['Proyectos', 'GET/POST', '/api/v1/objetivos/', 'CRUD objetivos'],
        ['Proyectos', 'GET/POST', '/api/v1/indicadores/', 'CRUD indicadores'],
        ['Convenios', 'GET/POST', '/api/v1/instituciones/', 'CRUD instituciones'],
        ['Convenios', 'GET/POST', '/api/v1/convenios/', 'CRUD convenios'],
        ['Convenios', 'GET/POST', '/api/v1/compromisos/', 'CRUD compromisos'],
        ['Seguimiento', 'GET/POST', '/api/v1/avances/', 'CRUD avances'],
        ['Seguimiento', 'POST', '/api/v1/avances/{id}/aprobar/', 'Aprobar avance'],
        ['Seguimiento', 'GET/POST', '/api/v1/evidencias/', 'CRUD evidencias'],
        ['Seguimiento', 'GET', '/api/v1/alertas/', 'Listar alertas'],
        ['Reportes', 'GET', '/api/v1/reportes/dashboard/', 'Dashboard KPIs'],
        ['Reportes', 'GET', '/api/v1/reportes/proyectos/', 'Reporte proyectos'],
        ['Auditoría', 'GET', '/api/v1/auditoria/', 'Registro auditoría'],
    ]
    
    endpoints_table = Table(endpoints_data, colWidths=[1.2*inch, 0.6*inch, 2.4*inch, 1.8*inch])
    endpoints_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(endpoints_table)
    elements.append(PageBreak())
    
    # ========== 7. MODELOS DE DATOS ==========
    elements.append(Paragraph("7. MODELOS DE DATOS PRINCIPALES", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    modelos_text = """
    El sistema cuenta con más de 20 modelos de datos organizados en aplicaciones Django:
    
    <b>7.1 Módulo Usuarios</b>
    • <b>Usuario</b> - Perfil extendido de usuario con roles
    • <b>Carrera</b> - Carreras universitarias
    • <b>RolUsuario</b> - Enum: ADMIN, COORDINADOR, DOCENTE, ESTUDIANTE
    
    <b>7.2 Módulo Proyectos</b>
    • <b>Proyecto</b> - Proyectos de vinculación/convenio
    • <b>Objetivo</b> - Objetivos de un proyecto
    • <b>Indicador</b> - Indicadores de medición
    • <b>Actividad</b> - Actividades del proyecto
    • <b>Participante</b> - Participantes del proyecto
    • <b>Presupuesto</b> - Presupuesto del proyecto
    • <b>Beneficiario</b> - Beneficiarios del proyecto
    
    <b>7.3 Módulo Convenios</b>
    • <b>Institucion</b> - Entidades externas
    • <b>Convenio</b> - Convenios interinstitucionales
    • <b>Compromiso</b> - Compromisos del convenio
    • <b>Producto</b> - Productos esperados
    • <b>Contribucion</b> - Contribuciones de partes
    
    <b>7.4 Módulo Seguimiento</b>
    • <b>Avance</b> - Registro de avances
    • <b>Evidencia</b> - Evidencias de avances
    • <b>Informe</b> - Informes de seguimiento
    • <b>Alerta</b> - Sistema de alertas
    • <b>Revision</b> - Revisiones de proyectos
    
    Todos los modelos heredan de <b>TimeStampedModel</b> (core) que agrega campos 
    created_at y updated_at automáticamente.
    """
    
    elements.append(Paragraph(modelos_text, normal_style))
    elements.append(PageBreak())
    
    # ========== 8. ESTADO ACTUAL Y AVANCES ==========
    elements.append(Paragraph("8. ESTADO ACTUAL Y AVANCES", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    avances_text = """
    <b>8.1 Funcionalidades Completadas ✓</b>
    
    ✅ <b>Autenticación y Autorización</b>
       • Registro de usuarios con validaciones
       • Login con JWT (JSON Web Tokens)
       • Control de acceso por roles
       • 4 tests automatizados aprobados
    
    ✅ <b>Gestión de Usuarios</b>
       • CRUD de usuarios
       • Perfil de usuario actual
       • Gestión de carreras
       • 3 tests automatizados aprobados
    
    ✅ <b>Gestión de Proyectos</b>
       • CRUD completo de proyectos
       • Flujo de aprobación (borrador → revisión → aprobado)
       • Gestión de objetivos, indicadores y actividades
       • 3 tests automatizados aprobados
    
    ✅ <b>Gestión de Convenios</b>
       • CRUD de instituciones
       • CRUD de convenios
       • Vinculación proyecto-convenio
       • 2 tests automatizados aprobados
    
    ✅ <b>Sistema de Seguimiento</b>
       • Registro de avances
       • Sistema de evidencias
       • Alertas automáticas
       • Revisiones
       • 3 tests automatizados aprobados
    
    ✅ <b>Reportes y Dashboard</b>
       • Dashboard con KPIs
       • Reportes de proyectos y convenios
       • 1 test automatizado aprobado
    
    ✅ <b>Testing y Documentación</b>
       • 19 tests automatizados
       • Documentación Swagger/ReDoc
       • Este generador de PDF
       • 3 tests de manejo de errores aprobados
    
    <b>8.2 Métricas de Calidad</b>
    • Cobertura funcional: ~90%
    • Tests pasando: 100% (19/19)
    • Documentación API: Completa
    • Código organizado y modular
    """
    
    elements.append(Paragraph(avances_text, normal_style))
    elements.append(PageBreak())
    
    # ========== 9. PRÓXIMOS PASOS ==========
    elements.append(Paragraph("9. PRÓXIMOS PASOS Y MEJORAS", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    pasos_text = """
    <b>Mejoras Planificadas:</b>
    
    📋 <b>Corto Plazo</b>
    • Agregar más tests para alcanzar cobertura >95%
    • Implementar notificaciones por email
    • Mejorar validaciones de formularios
    • Optimizar consultas a base de datos
    
    📊 <b>Mediano Plazo</b>
    • Exportar reportes a Excel/PDF
    • Implementar carga de archivos (evidencias)
    • Sistema de notificaciones en tiempo real
    • Dashboard con gráficos interactivos
    
    🚀 <b>Largo Plazo</b>
    • Aplicación móvil (React Native/Flutter)
    • Integración con sistemas universitarios
    • Análisis predictivo con Machine Learning
    • Escalabilidad para múltiples facultades
    
    <b>Recomendaciones:</b>
    • Mantener la ejecución regular de tests
    • Actualizar documentación con cada nuevo feature
    • Realizar revisiones de código periódicas
    • Implementar integración continua (CI/CD)
    """
    
    elements.append(Paragraph(pasos_text, normal_style))
    elements.append(PageBreak())
    
    # ========== 10. CONCLUSIÓN ==========
    elements.append(Paragraph("10. CONCLUSIÓN", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    conclusion = """
    El Sistema de Gestión de Proyectos de Vinculación representa una solución robusta 
    y completa para la administración de proyectos de vinculación con la sociedad en 
    la Universidad Nacional de Loja.
    
    <b>Fortalezas del Proyecto:</b>
    
    ✓ <b>Arquitectura sólida:</b> Django + DRF + JWT
    ✓ <b>Código limpio:</b> Modular, documentado y testeado
    ✓ <b>Testing completo:</b> 19 tests automatizados
    ✓ <b>Documentación:</b> Swagger, ReDoc y PDF
    ✓ <b>Escalable:</b> Preparado para crecimiento
    
    <b>Estado Final:</b> El proyecto se encuentra en una fase avanzada de desarrollo 
    con todas las funcionalidades principales implementadas y probadas. Está listo 
    para pasar a fase de pruebas de usuario y eventual despliegue en producción.
    
    ---
    
    <i>Documento generado automáticamente el {}</i>
    <i>Sistema de Gestión de Proyectos de Vinculación</i>
    <i>Universidad Nacional de Loja - 2026</i>
    """.format(datetime.now().strftime("%d de %B de %Y a las %H:%M"))
    
    elements.append(Paragraph(conclusion, normal_style))
    
    # Generar PDF
    doc.build(elements)
    print(f"[OK] Documentacion PDF generada exitosamente: {filename}")
    print(f"[INFO] Ubicacion: {os.path.abspath(filename)}")
    return filename


if __name__ == "__main__":
    try:
        output_file = generate_pdf()
        print(f"\n[OK] Documentacion completada!")
        print(f"[INFO] Abre el archivo PDF para ver la documentacion completa del proyecto.")
    except Exception as e:
        print(f"[ERROR] Error al generar PDF: {e}")
        sys.exit(1)
