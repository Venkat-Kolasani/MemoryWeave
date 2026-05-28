# MemoryWeave API — Python + Coral CLI for production SQL retrieval
FROM python:3.11-slim-bookworm

ARG CORAL_VERSION=0.4.1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates bash \
    && rm -rf /var/lib/apt/lists/*

# Install Coral to /usr/local/bin (visible to all users; not only /root/.local/bin)
ENV CORAL_VERSION=${CORAL_VERSION}
ENV CORAL_INSTALL_DIR=/usr/local/bin
RUN curl -fsSL https://withcoral.com/install.sh | sh \
    && chmod +x /usr/local/bin/coral \
    && /usr/local/bin/coral --version

ENV PATH="/usr/local/bin:/root/.local/bin:${PATH}"
ENV CORAL_CONFIG_DIR=/app/.coral_config
ENV CORAL_AUTO_SETUP=true
ENV CORAL_SKIP_TESTS=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x scripts/start.sh scripts/install_coral_cli.sh coral/install_sources.sh \
    && bash scripts/install_coral_cli.sh

EXPOSE 8000

CMD ["bash", "scripts/start.sh"]
