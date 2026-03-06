# ── Database Dockerfile ───────────────────────────────────────────────────────
# Extends the official MySQL 8.0 image with our schema and seed data baked in.
# The init script runs automatically on first container startup.

FROM mysql:8.0

# Set default environment variables (overridden by docker-compose or Kubernetes)
ENV MYSQL_DATABASE=pipelinepilot \
    MYSQL_USER=pilot \
    MYSQL_PASSWORD=pilotpass \
    MYSQL_ROOT_PASSWORD=rootpassword

# Copy the initialisation SQL script into MySQL's entrypoint directory.
# Any *.sql file placed here is executed automatically on first boot.
COPY init.sql /docker-entrypoint-initdb.d/init.sql

# MySQL port
EXPOSE 3306

# Custom config: increase max connections and set UTF-8 as default charset
COPY my.cnf /etc/mysql/conf.d/pipelinepilot.cnf

# Healthcheck so Docker Compose and Kubernetes know when MySQL is ready
HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=30s \
  CMD mysqladmin ping -h localhost -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" --silent
