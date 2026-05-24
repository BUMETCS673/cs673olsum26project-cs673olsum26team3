"""
Home and general application views.
"""

from django.shortcuts import redirect, render


def home(request):
    """
    Display the authenticated user homepage.
    """
    if not request.session.get('username'):
        return redirect('login')
    username = request.session.get('username')
    return render(request, 'home.html', {'username': username})
