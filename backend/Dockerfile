FROM python:3.12-slim

WORKDIR /app

# Copy requirement dan install library
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend code
COPY . .

# Open port 8000
EXPOSE 8000

# Command to run the server
CMD ["python", "main.py"]