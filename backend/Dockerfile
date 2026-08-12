FROM python:3.12-slim

# Installer ffmpeg et autres dépendances système
RUN apt-get update && apt-get install -y ffmpeg libmagic1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
