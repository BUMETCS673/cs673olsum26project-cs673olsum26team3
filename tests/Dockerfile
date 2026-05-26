FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /tests

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["pytest", "--tb=short", "-v"]
