"""Carreras de grado de la UNL, agrupadas por facultad.

Se crean solo si no existen (por código), así que se puede ajustar cualquier carrera
desde el administrador sin que la migración la sobrescriba.
"""
from django.db import migrations

FACULTADES = {
	'FEIRNNR': ('Facultad de la Energía, las Industrias y los Recursos Naturales No Renovables', [
		('COMP', 'Computación'), ('ELEC', 'Electricidad'), ('EYA', 'Electrónica y Automatización'),
		('TELE', 'Telecomunicaciones'), ('AUTO', 'Ingeniería Automotriz'), ('MINAS', 'Minas'), ('GEO', 'Geología'),
	]),
	'FARNR': ('Facultad Agropecuaria y de Recursos Naturales Renovables', [
		('AGRO', 'Agronomía'), ('MVET', 'Medicina Veterinaria'), ('FORE', 'Ingeniería Forestal'),
		('AMBI', 'Ingeniería Ambiental'), ('AGRI', 'Ingeniería Agrícola'), ('ZOOT', 'Zootecnia'),
	]),
	'FSH': ('Facultad de la Salud Humana', [
		('MED', 'Medicina'), ('ENF', 'Enfermería'), ('ODON', 'Odontología'),
		('PSIC', 'Psicología Clínica'), ('LAB', 'Laboratorio Clínico'),
	]),
	'FJSA': ('Facultad Jurídica, Social y Administrativa', [
		('DER', 'Derecho'), ('ADME', 'Administración de Empresas'), ('CONT', 'Contabilidad y Auditoría'),
		('ECON', 'Economía'), ('FIN', 'Finanzas'), ('TSOC', 'Trabajo Social'), ('TUR', 'Turismo'),
		('ADMP', 'Administración Pública'),
	]),
	'FEAC': ('Facultad de la Educación, el Arte y la Comunicación', [
		('COM', 'Comunicación'), ('AMUS', 'Artes Musicales'), ('AVIS', 'Artes Visuales'),
		('EBAS', 'Educación Básica'), ('EINI', 'Educación Inicial'), ('PSPE', 'Psicopedagogía'),
		('IDIO', 'Pedagogía de los Idiomas Nacionales y Extranjeros'), ('PLL', 'Pedagogía de la Lengua y la Literatura'),
		('PCE', 'Pedagogía de las Ciencias Experimentales'), ('PAFD', 'Pedagogía de la Actividad Física y Deporte'),
	]),
}


def cargar(apps, schema_editor):
	Carrera = apps.get_model('usuarios', 'Carrera')
	for sigla, (facultad, carreras) in FACULTADES.items():
		for codigo, nombre in carreras:
			Carrera.objects.get_or_create(codigo=f'{sigla}-{codigo}', defaults={'nombre': nombre, 'facultad': facultad})


class Migration(migrations.Migration):
	dependencies = [('usuarios', '0006_usuario_foto')]
	operations = [migrations.RunPython(cargar, migrations.RunPython.noop)]
