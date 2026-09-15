from pathlib import Path

readme = """# SolarOps

SolarOps is a full-stack operations management application built to help Chico solar cleaning manage day-to-day jobs, customers, invoices, payments, costs, materials, and business performance from one place.

The project is currently being developed for **Chico Solar Cleaners** as an internal operations platform.

## Overview

Running a service business involves more than scheduling jobs. Owners need to know who their customers are, what work is scheduled, whether invoices have been paid, how much each job costs, and whether the business is actually profitable.

SolarOps brings that information into a single dashboard.

The application is designed around the complete lifecycle of a service job:

**Customer → Property → Job → Costs → Invoice → Payment → Analytics**

## Current Features

### Job Management

- Add new jobs
- View scheduled jobs by date
- Edit existing jobs
- Delete jobs
- Track scheduled, in-progress, and completed jobs
- Store scheduled dates and times
- Track quoted and final job prices
- Associate jobs with customers and properties
- Track panel counts for solar cleaning jobs

### Customer & Property Management

- Store customer information
- Associate customers with service properties
- Store property addresses
- Track solar panel counts by property
- Connect customer and property information directly to jobs

### Invoices & Payments

- View invoices
- Track payments made
- Connect billing information to completed work
- Keep job and payment records organized in the operations system

### Cost & Profit Tracking

SolarOps tracks the underlying costs of completing jobs, including:

- Labor costs
- Gas costs
- Resin/material costs
- Total job cost
- Estimated profit

This makes it possible to evaluate a job based on actual operating economics instead of revenue alone.

### Operations Dashboard

The dashboard provides a daily view of business activity, including:

- Jobs scheduled
- Jobs completed
- Upcoming jobs
- Daily revenue
- Panels scheduled/cleaned
- Customer
- Service address
- Appointment time
- Job price

Users can navigate between dates to review previous work or see upcoming jobs.

### Monthly Analytics

SolarOps currently calculates operational metrics including:

- Jobs completed
- Monthly revenue
- Labor costs
- Material / operating costs
- Estimated profit
- Average job value
- Panels cleaned

These metrics are calculated from job, property, and cost data stored in the database.

## Planned Analytics

SolarOps is being expanded into a deeper business analytics platform. Planned metrics include:

- Cost per job
- Profit per job
- Profit margin
- Material usage
- Material cost per job
- Revenue trends
- Average revenue per job
- Customer value
- Job volume trends
- Cost trends
- Operational efficiency metrics

## Scalability & Long-Term Vision

SolarOps is currently being developed around the real-world operations
of **Chico Solar Cleaners**, but the system is being designed with a
larger goal in mind.

The long-term vision is to evolve SolarOps from an internal business
tool into a **secure, scalable software platform for solar panel
cleaning companies**.

Rather than hard-coding the application around a single business, future
development will focus on creating an architecture capable of supporting
multiple independent companies while keeping each company's customers,
jobs, invoices, payments, costs, and analytics securely separated.

### SaaS Development Goals

Future development will focus on:

-   Multi-tenant architecture for supporting multiple solar cleaning
    businesses
-   Secure user authentication and authorization
-   Role-based access for owners, managers, and employees
-   Strict separation of company and customer data
-   Database-level security and access policies
-   Scalable database architecture
-   Secure handling of customer and financial information
-   Automated backups and recovery strategies
-   Logging, monitoring, and error tracking
-   API and server-side validation
-   Rate limiting and abuse prevention
-   Performance optimization as customer and job volume grows
-   Subscription and billing infrastructure
-   Configurable business settings, pricing, materials, and operating
    costs
-   Mobile-friendly workflows for technicians working in the field

### Product Vision

The goal is for SolarOps to eventually provide solar panel cleaning
businesses with one platform for managing:

**Customers → Properties → Jobs → Materials → Costs → Invoices →
Payments → Analytics**

Instead of relying on separate scheduling apps, spreadsheets, invoicing
tools, and manual cost calculations, SolarOps could provide an
operations system specifically designed around the workflow and
economics of a solar panel cleaning business.

Chico Solar Cleaners serves as the initial real-world environment for
developing and testing these workflows before expanding the software for
use by other businesses.

## Tech Stack

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
- **PostgreSQL**

## Architecture

SolarOps uses a relational data model centered around business operations.

Core entities include:

```text
Customers
    ↓
Properties
    ↓
Jobs
    ↓
Job Costs
    ↓
Invoices
    ↓
Payments