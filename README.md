# Placement Portal V2

A scalable institution-focused Placement Portal Management System (PPMS) built using React, TypeScript, Supabase, PostgreSQL, and TanStack Router.

Repository:
`placement-portal-v2-by-shrey`

---

# Project Overview

Placement Portal V2 is designed as a centralized placement ecosystem for educational institutions to manage:

* Student Profiles
* Academic Records
* Skill Profiles
* Placement Drives
* Opportunity Eligibility
* Resume Management
* Document Verification
* NOC Workflows
* Placement Analytics
* RBAC Administration

The system follows a modular, scalable, and audit-friendly architecture while maintaining strict ownership and security boundaries.

---

# Current Development Status

## Overall Project Completion

~60% Complete

## Student Side

~85% Complete

## Admin Side

Not Started (Planned Next)

---

# Completed Modules

## Authentication

* Google OAuth
* Supabase Authentication
* Session handling
* Protected routing
* Role-aware architecture foundation

## Student Profile Module

* Student identity management
* Enrollment normalization
* Contact validation
* Readonly summary lifecycle
* Edit/save synchronization

## Academic Module

* CGPA handling
* HSC/Diploma conditional persistence
* Academic validation layer
* Reload stabilization
* Completion integration

## Resume Module

* External resume URL persistence
* Google Drive / OneDrive / Dropbox validation
* Resume completion integration

## Skills Module

* Structured skills persistence
* Selectable skill tags
* LinkedIn / GitHub / Portfolio validation
* Readonly summary card lifecycle
* Completion engine integration

## Dashboard

* Centralized completion engine
* Completion synchronization
* Skills integration
* Certification removal cleanup
* Refresh stabilization

---

# Current Architecture

## Frontend

* React
* TypeScript
* Vite
* TanStack Router

## Backend

* Supabase

## Database

* PostgreSQL

## Authentication

* Supabase Auth
* Google OAuth

## Storage

* Supabase Storage

## Authorization

* RBAC Architecture

---

# Database Architecture

The system follows:

* UUID-only primary keys
* Soft delete strategy
* Centralized ownership
* Row-level security
* Single source of truth architecture

Core tables include:

* user_accounts
* student_master
* student_academic_details
* student_skill_profile
* document_metadata
* student_documents
* roles
* permissions
* role_permissions
* user_roles

Reference:

* Physical schema draft
* Supabase implementation specification

---

# Current Stable Student Features

## Profile

* Editable lifecycle
* Completion-aware
* Validation stabilized

## Academics

* Diploma/HSC conditional logic
* Percentage/CGPA validation
* Reload-safe persistence

## Resume

* Secure external link handling
* Resume completion tracking

## Skills

* Structured multi-select tags
* Secure URL validation
* Summary-card lifecycle
* Completion-aware persistence

---

# Important Architecture Decisions

## Skills Normalization

Current implementation stores:

* comma-separated skills

Reason:

* fast delivery
* lower complexity
* stable student-side architecture

Future roadmap:

* normalize into reusable master entities
* eligibility mapping
* analytics filtering
* recommendation systems

## Academic Normalization Engine

A standalone normalization/consolidation engine already exists separately.

Future purpose:

* branch normalization
* degree normalization
* mixed UG/PG/Diploma handling
* spreadsheet consolidation
* eligibility filtering
* placement analytics

This will later evolve into:
Admin-side Eligibility & Normalization Engine.

---

# Current Known Constraints

## Intentionally Postponed

The following are intentionally NOT implemented yet:

* AI resume scoring
* Skill normalization engine
* Certification management
* Resume parsing
* GitHub analytics
* Leetcode integration
* Recommendation engines
* Notification systems
* Analytics dashboards

Reason:
Avoid scope explosion before core architecture stabilization.

---

# Remaining Student-Side Tasks

## Minor UI Cleanup

* spacing refinement
* component consistency
* responsive polish
* reusable summary cards
* mobile optimization

## Final Stabilization

* validation standardization
* readonly lifecycle consistency
* loading cleanup
* dead state cleanup

---

# Next Planned Phase

# Admin MVP

Planned implementation order:

1. Admin Authentication
2. Role-Based Access
3. Student Viewer
4. Student Filters
5. Opportunity Creation
6. Eligibility Engine Basics
7. Resume Viewer
8. Academic Viewer
9. NOC Workflow Foundation

---

# Future Planned Systems

## Eligibility Engine

* branch filtering
* degree filtering
* CGPA filtering
* backlog filtering
* normalized eligibility computation

## Placement Analytics

* student readiness
* placement ratios
* department statistics
* skill analytics

## NOC Workflow

* application
* approval
* audit tracking
* status lifecycle

## Opportunity System

* drive creation
* application lifecycle
* eligibility enforcement

---

# Security Rules

The system enforces:

* Row Level Security (RLS)
* RBAC authorization
* UUID ownership mapping
* Soft delete architecture
* Secure document handling

Restricted uploads:

* executables
* scripts
* malicious formats

---

# Development Philosophy

This project intentionally prioritizes:

* architecture stability
* incremental development
* backend correctness
* scalability
* maintainability

Over:

* rapid UI redesigns
* overengineering
* premature optimization

---

# Important Engineering Rules

DO NOT:

* redesign database schema casually
* regenerate route tree unnecessarily
* introduce large state libraries suddenly
* bypass ownership mappings
* remove RLS
* over-normalize prematurely

ALWAYS:

* preserve architecture consistency
* follow existing patterns
* implement incrementally
* stabilize before scaling

---

# Current Priority

Student-side stabilization freeze before Admin MVP implementation.

---

# Maintainer

Shrey Vyas
Computer Science Engineering Student

Focused on:

* scalable systems
* sustainable technology
* placement automation
* AI-driven workflows
* infrastructure engineering
