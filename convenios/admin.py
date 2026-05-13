from django.contrib import admin

from . import models as m


class TimeStampedAdmin(admin.ModelAdmin):
	readonly_fields = ('creado_en', 'actualizado_en')
	date_hierarchy = 'creado_en'
	list_per_page = 20


class CompromisoInline(admin.TabularInline):
	model = m.Compromiso
	extra = 0
	fields = ('codigo', 'descripcion', 'estado', 'fecha_vencimiento')


class ProductoInline(admin.TabularInline):
	model = m.Producto
	extra = 0
	fields = ('codigo', 'nombre', 'entregado', 'fecha_entrega_esperada')


class ProyectoConvenioInline(admin.TabularInline):
	model = m.ProyectoConvenio
	extra = 0
	fields = ('proyecto', 'fecha_vinculacion', 'vigente')


@admin.register(m.Institucion)
class InstitucionAdmin(TimeStampedAdmin):
	list_display = ('nombre', 'sigla', 'email', 'telefono', 'activa')
	search_fields = ('nombre', 'sigla', 'email', 'telefono')
	list_filter = ('activa',)


@admin.register(m.Convenio)
class ConvenioAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'entidad_contraparte', 'institucion', 'tipo', 'estado', 'fecha_firma', 'activo')
	search_fields = ('codigo', 'entidad_contraparte', 'objeto', 'tipo')
	list_filter = ('estado', 'tipo', 'institucion', 'activo')
	list_select_related = ('institucion',)
	inlines = (CompromisoInline, ProductoInline, ProyectoConvenioInline)


@admin.register(m.ProyectoConvenio)
class ProyectoConvenioAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'convenio', 'fecha_vinculacion', 'vigente')
	search_fields = ('proyecto__codigo', 'convenio__codigo')
	list_filter = ('vigente', 'proyecto', 'convenio')
	list_select_related = ('proyecto', 'convenio')


@admin.register(m.Compromiso)
class CompromisoAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'convenio', 'estado', 'responsable', 'fecha_vencimiento')
	search_fields = ('codigo', 'descripcion', 'convenio__codigo')
	list_filter = ('estado', 'convenio')
	list_select_related = ('convenio', 'responsable')


@admin.register(m.Producto)
class ProductoAdmin(TimeStampedAdmin):
	list_display = ('codigo', 'nombre', 'convenio', 'entregado', 'fecha_entrega_esperada', 'fecha_entrega_real')
	search_fields = ('codigo', 'nombre', 'convenio__codigo')
	list_filter = ('entregado', 'convenio')
	list_select_related = ('convenio',)


@admin.register(m.Contribucion)
class ContribucionAdmin(TimeStampedAdmin):
	list_display = ('proyecto', 'institucion', 'tipo', 'valor', 'fecha_aporte')
	search_fields = ('proyecto__codigo', 'institucion__nombre', 'descripcion')
	list_filter = ('tipo', 'proyecto', 'institucion')
	list_select_related = ('proyecto', 'institucion')
