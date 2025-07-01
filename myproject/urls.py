from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # path('admin/', admin.site.urls),  # Có thể bỏ nếu không cần admin
    path('api/', include('django_api.urls')),
]
