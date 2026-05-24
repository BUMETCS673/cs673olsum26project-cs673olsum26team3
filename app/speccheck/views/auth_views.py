'''Authentication-related views for user login and logout.'''
from django.contrib import messages
from django.shortcuts import redirect, render

from ..login import authenticate_user

 
def login_view(request):
    ''' Handle user login with POST form submission.'''
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()

        if authenticate_user(username, password):
            request.session['username'] = username
            return redirect('home')

        messages.error(request, 'Invalid username or password. Please try again.')
        return redirect('login')

    return render(request, 'login.html')

def logout_view(request):
    """
    Handle user logout and session cleanup.
    """
    if 'username' in request.session:
        del request.session['username']
    return redirect('login')
