# CareConnect EHR

A full-stack Electronic Health Record (EHR) learning prototype built with **Spring Boot, React, and JavaScript**. CareConnect demonstrates patient records, clinical notes, medication and diagnostic orders, role-based access, and patient appointment workflows.

> **Project status:** Educational prototype only. Do not use real patient information or deploy this as a production healthcare system. Demo credentials are for local development only and must not be used for a public deployment.

## Contributors

- **Ritesh Singh**
- **Uday**
- **Aditya**
- **Rudraksh**

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Run locally](#run-locally)
- [Local demo accounts](#local-demo-accounts)
- [Database configuration](#database-configuration)
- [API overview](#api-overview)
- [Docker](#docker)
- [Security notes](#security-notes)
- [Contributing](#contributing)

## Features

### Patient and clinical workflows
- Register, search, view, edit, and manage patient records.
- Create clinical notes, assessments, and treatment plans.
- Create lab and imaging orders and update their status/results.
- Manage prescriptions and medication status.
- Provide a patient portal for viewing their own record and requesting or cancelling appointments.

### Appointments
- Patients can search doctors by name or specialty and request an available 30-minute slot.
- The selected doctor or an administrator can approve or reject appointment requests.
- Pending and approved appointments hold a slot; rejected or cancelled requests release it.

### Accounts and permissions
- JWT-based authentication with role-specific access for `ADMIN`, `DOCTOR`, `NURSE`, and `PATIENT`.
- Patient self-registration.
- Staff-assisted patient registration with a generated temporary password.
- Admin workflows for managing doctors and resetting passwords.

### Interoperability demo
- Read-only FHIR R4-style endpoints for Patient and MedicationRequest resources. Validate the output against the implementation guide you intend to use before attempting interoperability.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, CSS |
| Backend | Java 17+, Spring Boot, Spring Data JPA, Spring Security |
| Authentication | JWT |
| Local database | H2 in-memory database |
| Optional database | PostgreSQL configuration |
| Build and deployment | Maven, Docker, Docker Compose, Jenkins pipeline |

## Project structure

```text
CareConnect-EHR/
├── backend/
│   ├── src/main/java/com/ehr/
│   │   ├── model/       # JPA entities
│   │   ├── repo/        # Spring Data repositories
│   │   ├── security/    # JWT and security configuration
│   │   ├── web/         # REST controllers and services
│   │   └── DataSeeder.java
│   ├── src/main/resources/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/             # React components and API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── Jenkinsfile
└── README.md
```

## Run locally

### Prerequisites
- Java 17 or newer
- Maven
- Node.js 18 or newer and npm

### 1. Start the backend

From the repository root:

```bash
cd backend
mvn spring-boot:run
```

The backend starts at `http://localhost:8080` using the default H2 in-memory database and demo data.

### 2. Start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`.

> The frontend API base URL and CORS settings must match your local or deployed backend URL. For deployment, configure the API URL to point to the deployed backend rather than `localhost`.

## Local demo accounts

These seeded accounts are intended **only for local development**:

| Username | Password | Role |
|---|---|---|
| `doctor` | `doctor123` | Doctor |
| `dr.arjun` | `doctor123` | Doctor |
| `dr.sana` | `doctor123` | Doctor |
| `nurse` | `nurse123` | Nurse |
| `admin` | `admin123` | Administrator |
| `patient` | `patient123` | Patient |

Do not expose these credentials on a live deployment. Disable or replace demo seeding and use unique, strong credentials before sharing a deployed instance.

## Database configuration

### H2 (default for local development)

The default profile uses an in-memory H2 database. Data is temporary and is lost when the application restarts.

### PostgreSQL (optional profile)

The repository includes `backend/src/main/resources/application-postgres.yml`. The documented PostgreSQL setup uses the `postgres` profile and environment variables:

- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

Create a PostgreSQL database named `ehr` if following the repository's documented local setup. Start the backend from the `backend` directory with:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

For hosted deployment, confirm the PostgreSQL JDBC URL and required environment-variable names in `application-postgres.yml` before configuring the hosting provider. Do not commit passwords, JWT secrets, or `.env` files.

## API overview

| Method | Endpoint | Purpose / access |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with username and password |
| `GET, POST` | `/api/patients` | List/search and create patient records |
| `GET, PUT, DELETE` | `/api/patients/{id}` | View/update patient; deletion is admin-only |
| `GET, POST` | `/api/patients/{id}/notes` | Read/create clinical notes |
| `GET, POST` | `/api/patients/{id}/orders` | Read orders; creation restricted to doctor/admin |
| `PATCH` | `/api/patients/{id}/orders/{oid}` | Update order status/result |
| `GET, POST` | `/api/patients/{id}/medications` | Read/create medication records |
| `PATCH` | `/api/patients/{id}/medications/{rid}` | Update medication active status |
| `GET` | `/api/doctors` | Search doctors using optional `?q=` |
| `GET` | `/api/portal/doctors/{id}/slots?date=YYYY-MM-DD` | Patient checks appointment slots |
| `POST` | `/api/portal/appointments` | Patient requests an appointment |
| `PATCH` | `/api/portal/appointments/{id}/cancel` | Patient cancels an appointment |
| `GET` | `/api/appointments` | Doctor's appointments or all appointments for admin |
| `PATCH` | `/api/appointments/{id}/status` | Selected doctor/admin approves or rejects |
| `GET, POST` | `/api/admin/doctors` | Admin lists/adds doctors |
| `POST` | `/api/admin/doctors/{id}/reset-password` | Admin resets a doctor's password |
| `DELETE` | `/api/admin/doctors/{id}` | Admin removes a doctor |

FHIR demo endpoints:
- `GET /fhir/Patient`
- `GET /fhir/Patient/{id}`
- `GET /fhir/MedicationRequest`

FHIR responses are intended for demonstration and are not a claim of production compliance.

## Docker

From the repository root, run:

```bash
docker compose up --build
```

The project README's local Docker setup exposes the application at `http://localhost:8081`. Review `docker-compose.yml` and the Dockerfiles for the actual service and port configuration in your checkout.

## Tests

From the repository root:

```bash
cd backend
mvn test
```

The repository includes JUnit tests, including workflow tests. Run them locally before submitting changes.

## Security notes and limitations

This project is a learning prototype and has not been established as suitable for production healthcare use. Before any real deployment:
- Remove or disable demo-user seeding and change all default credentials.
- Set a strong, unique `JWT_SECRET` through the hosting provider's secret/environment settings.
- Configure a persistent database, backups, HTTPS, and appropriate access controls.
- Review authorization, validation, audit logging, error handling, and sensitive-data handling.
- Disable development-only features such as the H2 console.
- Never use real patient data in this demo.

## Contributing

For changes, create a branch, make a focused update, run the backend tests and frontend build, and open a pull request describing the change.
