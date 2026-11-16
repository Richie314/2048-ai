FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt "debugpy>=1.8,<2"
COPY train/*.py ./train/

ENTRYPOINT ["python", "train/train.py"]
CMD ["/dataset", "--output", "/model/model.json", "--epochs", "200"]
