from django.shortcuts import redirect, render

from .login import authenticate_user
''' old views file, not used anymore.'''

def login_view(request):
    error = ''
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        if authenticate_user(username, password):
            request.session['username'] = username
            return redirect('home')
        error = 'Invalid username or password. Please try again.'
    return render(request, 'login.html', {'error': error})


def home(request):
    if not request.session.get('username'):
        return redirect('login')
    username = request.session.get('username')
    return render(request, 'home.html', {'username': username})