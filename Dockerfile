# 1. Фронтенд: Vite собирает React-приложение в src/main/resources/static
FROM node:24-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json tsconfig.json vite.config.ts .oxlintrc.json ./
RUN npm ci
COPY src/main/react src/main/react
RUN npm run build

# 2. Бэкенд: Maven собирает один fat jar (фронтенд уже собран выше)
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
COPY src src
COPY --from=frontend /app/src/main/resources/static src/main/resources/static
RUN mvn -B -DskipFrontend package

# 3. Урезанный JRE: jdeps определяет нужные модули, jlink собирает только их.
#    Собираем на alpine (musl), чтобы рантайм подошёл итоговому alpine-образу.
FROM eclipse-temurin:25-jdk-alpine AS jre
COPY --from=build /app/target/table-reservation-*.jar /app/app.jar
# Модули, которые jdeps не видит (рефлексия, ServiceLoader, JNDI, TLS для PostgreSQL и т.п.).
# jdk.zipfs обязателен: Jetty читает статику из jar через файловую систему jar:
ENV EXTRA_MODULES=java.naming,java.management,java.sql,java.xml,jdk.unsupported,jdk.crypto.ec,jdk.naming.dns,jdk.zipfs
RUN MODULES="$(jdeps --ignore-missing-deps --multi-release 25 --print-module-deps /app/app.jar),${EXTRA_MODULES}" \
 && jlink --add-modules "$MODULES" \
          --strip-debug --no-header-files --no-man-pages --compress zip-6 \
          --output /jre

# 4. Итоговый образ: alpine + урезанный JRE + jar, приложение запускается не от root
FROM alpine:3
RUN adduser -S -u 10001 app
ENV JAVA_HOME=/opt/jre
ENV PATH="${JAVA_HOME}/bin:${PATH}"
COPY --from=jre /jre /opt/jre
WORKDIR /app
COPY --from=build /app/target/table-reservation-*.jar app.jar
USER app

# Настройки: DB_URL, DB_USER, DB_PASSWORD, PORT (без DB_URL приложение работает на H2 в памяти)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
