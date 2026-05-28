# MemoryWeave API — Python + Coral CLI for production SQL retrieval
FROM python:3.11-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates bash \
    && rm -rf /var/lib/apt/lists/*

# Coral CLI (Linux install script)
RUN curl -fsSL https://withcoral.com/install.sh | sh

ENV PATH="/root/.local/bin:/usr/local/bin:${PATH}"
ENV CORAL_CONFIG_DIR=/app/.coral_config
ENV CORAL_AUTO_SETUP=true
ENV CORAL_SKIP_TESTS=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x scripts/start.sh scripts/install_coral_cli.sh coral/install_sources.sh

EXPOSE 8000

CMD ["bash", "scripts/start.sh"]
