# FiledCrews Disaster Recovery (DR) and Backup Policy

## Executive Summary
This document defines the Disaster Recovery (DR) and Business Continuity procedures for the FiledCrews Field Service Management (FSM) platform.

## Key Targets
- **Recovery Point Objective (RPO):** < 15 Minutes
- **Recovery Time Objective (RTO):** < 2 Hours

## Backup Schedule & Strategy
- **Continuous WAL Archiving:** Point-in-time recovery (PITR) active via Supabase PostgreSQL engine.
- **Daily Automated Snapshots:** Full database snapshots executed at 02:00 UTC daily.
- **Offsite Redundancy:** Encrypted backup artifacts replicated to secondary cloud region.

## Restore Procedure
1. **Incident Declaration:** On-Call Lead declares Severity 1 Outage.
2. **Target Provisioning:** Spin up clean PostgreSQL instance on Railway / Supabase.
3. **PITR Restore Execution:** Replay WAL logs to target recovery timestamp (`T - 5 mins`).
4. **Health Check Verification:** Execute `/functions/v1/health` endpoint validation.
5. **DNS Traffic Cutover:** Update CNAME routing to restored instance.
