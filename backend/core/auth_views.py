import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """Authenticate user with username/email and password."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return JsonResponse({"error": "Email and password are required."}, status=400)

    # Try authenticating with username first, then email
    user = authenticate(request, username=username, password=password)

    if user is None:
        # Try finding user by email
        try:
            user_obj = User.objects.get(email=username)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None

    if user is not None:
        login(request, user)
        return JsonResponse({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        })
    else:
        return JsonResponse({"error": "Invalid email or password."}, status=401)


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """Log out the current user."""
    logout(request)
    return JsonResponse({"message": "Logged out successfully."})


@ensure_csrf_cookie
@require_http_methods(["GET"])
def me_view(request):
    """Return current authenticated user info."""
    if request.user.is_authenticated:
        return JsonResponse({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
        })
    else:
        return JsonResponse({"error": "Not authenticated"}, status=401)
