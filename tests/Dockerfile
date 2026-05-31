FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /tests

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "sed -i 's/\\r$//' wait_and_run.sh && chmod +x wait_and_run.sh && exec ./wait_and_run.sh"]
