# Assignment 3 - Azure Function, Service Bus, and Container App

## Architecture Overview

This assignment implements a message processing pipeline:

1. **Container App (Web UI)** - A Node.js web application with a form to submit messages
2. **Azure Service Bus** - Message queue that receives messages from the web app
3. **Azure Function** - Triggered by Service Bus messages, writes them to Blob Storage
4. **Azure Blob Storage** - Stores all processed messages as JSON files

## Deployment Workflow Triggering

### Infrastructure Deployment (Terraform)
- **Trigger:** Changes to `Terraform/**` files
- **Workflow:** `.github/workflows/terraform-deploy.yml`
- **What happens:**
  1. Terraform plan runs on PRs
  2. Terraform apply runs on push to main
  3. After apply, the app-deploy workflow is automatically called

### Application Deployment
- **Trigger:** Changes to `Assignment3/container-app/**` or `Assignment3/function-app/**`
- **Workflow:** `.github/workflows/app-deploy.yml`
- **What happens:**
  1. Container App: Builds Docker image, pushes to ACR, updates Container App
  2. Function App: Installs dependencies, zips code, deploys to Azure Function

### Automatic App Redeployment After Infrastructure Changes
When Terraform deploys infrastructure changes, the `deploy-apps` job in `terraform-deploy.yml` automatically calls the `app-deploy.yml` workflow to ensure applications are redeployed with any new infrastructure configuration.

## Local Testing

### Container App
```bash
cd Assignment3/container-app
npm install
# Set environment variables
export SERVICEBUS_NAMESPACE="your-namespace.servicebus.windows.net"
export SERVICEBUS_QUEUE="messages"
npm start
```

### Function App
```bash
cd Assignment3/function-app
npm install
# Update local.settings.json with your values
func start
```

## Managed Identity and RBAC

All services use System-Assigned Managed Identity:
- **Function App** has `Azure Service Bus Data Receiver` and `Storage Blob Data Contributor` roles
- **Container App** has `Azure Service Bus Data Sender` role

No connection strings or secrets are stored in code.
