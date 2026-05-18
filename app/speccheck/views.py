from django.http import HttpResponse

def home(request):
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SpecCheck</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f4f6f9; color: #333; }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
            h1 { color: #007bff; }
            .status { color: green; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>SpecCheck</h1>
            <p><strong>Status:</strong> <span class="status">Docker Container Running Successfully</span></p>
            <p>Homepage here</p>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)