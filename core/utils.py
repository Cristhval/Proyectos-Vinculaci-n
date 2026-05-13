from rest_framework import status
from rest_framework.response import Response


def api_response(success, message, data=None, http_status=status.HTTP_200_OK):
	return Response({'success': success, 'message': message, 'data': data}, status=http_status)
