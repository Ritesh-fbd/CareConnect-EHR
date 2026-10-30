# 🏥 CareConnect EHR
### A modern Electronic Health Record learning prototype

<p align="center">
  <strong>Connecting patient care, clinical workflows, and healthcare teams.</strong><br/>
  A full-stack EHR application built with Spring Boot, React, and JavaScript.
</p>

<p align="center">
  <img alt="Java" src="https://img.shields.io/badge/Java-17%2B-orange?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-Backend-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img alt="Maven" src="https://img.shields.io/badge/Maven-Build-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

> [!IMPORTANT]
> **Educational project only.** CareConnect EHR is a learning prototype, not a production healthcare system. Do not enter real patient information or rely on it for clinical decisions. Demo accounts are for local development only and must never be exposed on a public deployment.

---

## ✨ At a glance

CareConnect brings common EHR learning workflows into one application: patient records, clinical documentation, diagnostic and medication orders, role-based access, and appointment requests.

| 🧑‍⚕️ Clinical workspace | 📅 Appointment workflow | 🔐 Access control |
|---|---|---|
| Patient records, notes, assessments, treatment plans, and orders | Patient requests with doctor/admin approval | JWT authentication and role-specific permissions |

## 🚀 Features

<details open>
<summary><strong>Patient records and clinical workflows</strong></summary>

- Register, search, view, edit, and manage patient records.
- Create clinical notes, assessments, and treatment plans.
- Create lab and imaging orders and update their status or results.
- Manage prescriptions and medication status.
- Patient portal for viewing the patient's own record and requesting or cancelling appointments.
</details>

<details open>
<summary><strong>Appointment management</strong></summary>

- Search doctors by name or specialty.
- Request an available 30-minute appointment slot.
- The selected doctor or an administrator can approve or reject a request.
- Pending and approved appointments hold a slot; rejected or cancelled requests release it.
</details>

<details>
<summary><strong>Authentication and roles</strong></summary>

- JWT-based authentication.
- Role-specific access for `ADMIN`, `DOCTOR`, `NURSE`, and `PATIENT`.
- Patient self-registration.
- Staff-assisted patient registration with a generated temporary password.
- Admin workflows for managing doctors and resetting passwords.
</details>

<details>
<summary><strong>FHIR interoperability demo</strong></summary>

Read-only FHIR R4-style endpoints for Patient and MedicationRequest resources. Validate the responses against the implementation guide you intend to use before attempting interoperability.
</details>

## 🧰 Technology stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, JavaScript, Vite, CSS |
| **Backend** | Java 17+, Spring Boot, Spring Data JPA, Spring Security |
| **Authentication** | JWT |
| **Local database** | H2 in-memory database |
| **Optional database** | PostgreSQL configuration |
| **Build & deployment** | Maven, Docker, Docker Compose, Jenkins pipeline |

## 🗂️ Project structure

```text
CareConnect-EHR/
├── backend/
│   ├── src/main/java/com/ehr/
│   │   ├── model/        # JPA entities
│   │   ├── repo/         # Spring Data repositories
│   │   ├── security/     # JWT and security configuration
│   │   ├── web/          # REST controllers and services
│   │   └── DataSeeder.java
│   ├── src/main/resources/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/              # React components and API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── Jenkinsfile
└── README.md
```

## ⚡ Getting started

### Prerequisites

Make sure the following tools are installed:

- Java 17 or newer
- Maven
- Node.js 18 or newer and npm

### 1. Clone the repository

```bash
git clone https://github.com/Ritesh-fbd/CareConnect-EHR.git
cd CareConnect-EHR
```

### 2. Start the backend

From the repository root:

```bash
cd backend
mvn spring-boot:run
```

The backend starts at **http://localhost:8080** using the default H2 in-memory database and demo data.

### 3. Start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the frontend at **http://localhost:5173**.

> [!TIP]
> Ensure the frontend API base URL and backend CORS settings match. For a hosted deployment, point the frontend to the deployed backend URL—not `localhost`.

## 🔑 Local demo accounts

The following seeded accounts are intended **only for local development**.

| Username | Password | Role |
|---|---|---|
| `doctor` | `doctor123` | Doctor |
| `dr.arjun` | `doctor123` | Doctor |
| `dr.sana` | `doctor123` | Doctor |
| `nurse` | `nurse123` | Nurse |
| `admin` | `admin123` | Administrator |
| `patient` | `patient123` | Patient |

> [!WARNING]
> Never expose these credentials on a live deployment. Disable or replace demo seeding and use unique, strong credentials before sharing a deployed instance.

## 🗄️ Database configuration

### H2 — default local profile

The default profile uses an in-memory H2 database. Data is temporary and is lost when the application restarts.

### PostgreSQL — optional profile

The repository includes `backend/src/main/resources/application-postgres.yml`. The documented PostgreSQL setup uses the `postgres` profile and these environment variables:

- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

Create a PostgreSQL database named `ehr` when following the documented local setup. From the `backend` directory, run:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

For hosted deployment, verify the JDBC URL and all required variable names in `application-postgres.yml` before configuring your hosting provider. Never commit database passwords, JWT secrets, or `.env` files.

## 🔌 API overview

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

### FHIR demo endpoints

- `GET /fhir/Patient`
- `GET /fhir/Patient/{id}`
- `GET /fhir/MedicationRequest`

FHIR responses are for demonstration and are not a claim of production compliance.

## 🐳 Run with Docker

From the repository root:

```bash
docker compose up --build
```

The documented local Docker setup exposes the application at **http://localhost:8081**. Review `docker-compose.yml` and the Dockerfiles for the actual service and port configuration in your checkout.

## 🧪 Tests

From the repository root:

```bash
cd backend
mvn test
```

The repository includes JUnit tests, including workflow tests. Run them before submitting changes.

## 🛡️ Security and limitations

CareConnect is a learning prototype and has not been established as suitable for production healthcare use. Before any real deployment:

- Remove or disable demo-user seeding and replace all default credentials.
- Set a strong, unique `JWT_SECRET` using the hosting provider's secret/environment settings.
- Configure a persistent database, backups, HTTPS, and appropriate access controls.
- Review authorization, validation, audit logging, error handling, and sensitive-data handling.
- Disable development-only features such as the H2 console.
- Never use real patient data in this demo.

## 👥 Contributors

Thanks to everyone who contributed to this project:

- **Ritesh Singh**
- **Uday**
- **Aditya**
- **Rudraksh**

## 🤝 Contributing

Contributions and suggestions are welcome. To contribute:

1. Create a feature branch.
2. Make a focused change.
3. Run the backend tests and frontend build.
4. Open a pull request with a clear description of the change.

---

<p align="center">
  <strong>CareConnect EHR</strong><br/>
  Built as a collaborative learning project.
</p>
