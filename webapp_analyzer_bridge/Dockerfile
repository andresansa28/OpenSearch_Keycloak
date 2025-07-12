FROM python:3.10

# Installa ping (iputils-ping) e altri strumenti base
RUN apt-get update && apt-get install -y iputils-ping && rm -rf /var/lib/apt/lists/*

WORKDIR /webapp_analyzer_bridge

COPY ./requirements.txt /webapp_analyzer_bridge/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /webapp_analyzer_bridge/requirements.txt

COPY ./app /webapp_analyzer_bridge/app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"]
