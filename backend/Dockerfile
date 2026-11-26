# Stage 1: Build Application
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create unprivileged application user
RUN addgroup -S payflow && adduser -S payflow -G payflow

COPY --from=builder /app/target/payflow-backend-*.jar app.jar
RUN chown -R payflow:payflow /app

USER payflow
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
