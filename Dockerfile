FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml README.md requirements.txt ./
COPY app ./app
COPY alembic ./alembic
COPY scripts ./scripts
COPY data ./data
COPY alembic.ini ./alembic.ini

# Copy full medicine data files (A/B/C standalone + dosage + symptoms + D-Z ZIP)
COPY All_A_Medicines_With_Food_Interactions.xlsx ./
COPY All_B_Medicines_With_Food_Interactions.xlsx ./
COPY All_C_Medicines_With_Food_Interactions.xlsx ./
COPY ab.xlsx ./
COPY symptoms.xlsx ./
COPY workspace-*.zip ./

RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir -e .

EXPOSE 8000

# 1. Run migrations
# 2. Seed sample data (creates the 3 base medicines + interactions schema)
# 3. Seed full medicine data from Excel/ZIP files (idempotent — skips if DB already populated)
# 4. Start the API server
CMD ["sh", "-c", "alembic upgrade head && python scripts/seed.py && python scripts/seed_data.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
