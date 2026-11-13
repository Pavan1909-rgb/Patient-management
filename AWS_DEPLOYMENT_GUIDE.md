# AWS Deployment Guide

This guide provides simple, step-by-step instructions to deploy the Patient Management System to AWS using:
- **Database**: AWS RDS PostgreSQL
- **Backend**: AWS Elastic Beanstalk (direct executable JAR upload, Java 21)
- **Frontend**: AWS Amplify (React + Vite)

---

## Architecture Overview

```
[ User Browser ]
       │
       ▼
[ AWS Amplify ]  ── (HTTP/REST) ──>  [ AWS Elastic Beanstalk (Java 21 JAR) ]
(React + Vite)                       [ Port 5000 / Nginx Proxy           ]
                                                     │
                                                     ▼
                                     [ AWS RDS PostgreSQL Database ]
                                     [ Port 5432                   ]
```

---

## Step 1: Create AWS RDS PostgreSQL Database

1. Log in to the **AWS Management Console** and search for **RDS**.
2. Click **Create database**.
3. Choose **Standard create**.
4. Under **Engine options**, select **PostgreSQL** (version 15 or 16 recommended).
5. Under **Templates**, select **Free tier** (if eligible) or **Dev/Test**.
6. Under **Settings**:
   - **DB instance identifier**: `patient-db`
   - **Master username**: `postgres`
   - **Master password**: Choose a secure password (e.g., `PatientPass123!`)
7. Under **Instance configuration**: Choose `db.t3.micro` or `db.t4g.micro` (free-tier eligible).
8. Under **Connectivity**:
   - **Virtual private cloud (VPC)**: Default VPC.
   - **Public access**: **Yes** (or ensure Elastic Beanstalk security group has inbound access on port 5432).
   - **VPC security group**: Create new or select existing (ensure inbound rule allows TCP port **5432**).
9. Under **Additional configuration**:
   - **Initial database name**: `patient_db`
10. Click **Create database**.
11. Once the status changes to **Available**, click on the database and copy the **Endpoint** (e.g., `patient-db.c123456789.us-east-1.rds.amazonaws.com`).

> **Security Group Check**: Ensure the RDS Security Group has an Inbound rule for **PostgreSQL (Port 5432)** allowing traffic from your Elastic Beanstalk environment's security group (or `0.0.0.0/0` with password auth if testing publicly).

---

## Step 2: Build & Deploy Backend to AWS Elastic Beanstalk

### 2.1 Build the Executable JAR

Open your terminal in the `backend` folder and run:

```bash
cd backend
mvn clean package -DskipTests
```

The executable JAR will be generated at:
`backend/target/patient-management-backend-0.0.1-SNAPSHOT.jar`

### 2.2 Create Elastic Beanstalk Application & Environment

1. In the AWS Console, search for **Elastic Beanstalk**.
2. Click **Create application**.
3. Fill in the details:
   - **Application name**: `patient-management-backend`
   - **Platform**: **Java**
   - **Platform branch**: **Corretto 21 running on 64bit Amazon Linux 2023** (or latest Corretto 21)
   - **Application code**: Select **Upload your code**
   - **Source code origin**: Select **Local file** -> Click **Choose file** and upload:
     `backend/target/patient-management-backend-0.0.1-SNAPSHOT.jar`
   - **Version label**: `v1`
   - **Presets**: Select **Single instance (free tier eligible)**
4. Click **Next**.
5. Under **Configure service access**:
   - Select or create an **EC2 instance profile** (ensure it has `AWSElasticBeanstalkWebTier` policy).
6. Under **Configure networking, database, and tags**:
   - Click **Next** (using default VPC).
7. Under **Configure instance traffic and scaling**:
   - Leave defaults and click **Next**.
8. Under **Configure updates, monitoring, and logging**:
   - Scroll down to **Environment properties** (crucial step!).
   - Add the following environment variables:

| Name | Value | Note |
|---|---|---|
| `PORT` | `5000` | Beanstalk Java SE routes to 5000 |
| `DB_HOST` | `patient-db.xxxxxx.us-east-1.rds.amazonaws.com` | Your RDS Endpoint from Step 1 |
| `DB_PORT` | `5432` | Standard PostgreSQL port |
| `DB_NAME` | `patient_db` | Database name from Step 1 |
| `DB_USERNAME` | `postgres` | RDS master username |
| `DB_PASSWORD` | `PatientPass123!` | RDS master password |

9. Click **Next**, review your settings, and click **Submit**.
10. Wait a few minutes until Elastic Beanstalk finishes provisioning. When the health status is **Green (OK)**, copy your environment URL:
    `http://patient-management-backend-env.eba-xxxxxx.us-east-1.elasticbeanstalk.com`
11. Test the backend in your browser or curl:
    `curl http://<your-beanstalk-url>/` -> should return `"Patient Management API is running"`

---

## Step 3: Deploy Frontend to AWS Amplify

### Option A: Via GitHub / Git Repository (Recommended)

1. Push your project (including `frontend` and `amplify.yml`) to GitHub, GitLab, or Bitbucket.
2. In the AWS Console, search for **AWS Amplify**.
3. Click **Deploy an app** (or **New app** -> **Host web app**).
4. Select **GitHub** (or your Git provider) and authorize.
5. Select your repository and branch (e.g. `main`).
6. Amplify will automatically detect `amplify.yml`.
7. Expand **Advanced settings** -> **Environment variables**:
   - Add:
     - **Variable**: `VITE_API_BASE_URL`
     - **Value**: `http://<your-beanstalk-url>` (your Elastic Beanstalk URL from Step 2, no trailing slash)
8. Click **Next** -> **Save and deploy**.
9. Amplify will build and host your app. Once deployed, open the provided Amplify URL (e.g. `https://main.xxxxxx.amplifyapp.com`).

### Option B: Manual Deploy (Zip Upload)

If you prefer not to use Git:
1. Build the frontend locally with your Beanstalk URL:
   ```bash
   cd frontend
   # In Windows PowerShell:
   $env:VITE_API_BASE_URL="http://<your-beanstalk-url>"
   npm run build
   ```
2. Compress the contents of `frontend/dist` into a `.zip` file (e.g., `dist.zip`).
3. In AWS Amplify, choose **Deploy without Git provider**.
4. Choose **Drag and drop**, select your `dist.zip`, give your app a name, and click **Save and deploy**.

---

## Step 4: Verification

1. Open your AWS Amplify URL in your browser.
2. You will see the **Patient Management System** UI.
3. Test the basic CRUD operations:
   - **Add**: Enter a patient's details and click **Add Patient**.
   - **View**: Verify the patient appears in the table.
   - **Edit**: Click **Edit**, modify a field, and click **Update Patient**.
   - **Delete**: Click **Delete** and confirm.

