from rest_framework import status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination


def api_response(success, message, data=None, http_status=status.HTTP_200_OK):
	return Response({'success': success, 'message': message, 'data': data}, status=http_status)


class FlexiblePageNumberPagination(PageNumberPagination):
	page_size = 10
	page_size_query_param = 'page_size'
	max_page_size = 100
	page_query_param = 'page'

	def get_page_size(self, request):
		if self.page_size_query_param:
			try:
				size = int(request.query_params.get(self.page_size_query_param, self.page_size))
				if size < 1:
					size = self.page_size
				if self.max_page_size and size > self.max_page_size:
					size = self.max_page_size
				return size
			except (TypeError, ValueError):
				pass
		return self.page_size
