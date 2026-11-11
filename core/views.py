from django.http import JsonResponse


def salud_view(request):
	return JsonResponse({'ok': True})
