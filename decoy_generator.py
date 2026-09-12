"""
AegisAI - Decoy Sandbox Generator (Phase 2)
Generates high-fidelity synthetic honeypot data (canary API keys, dummy employee PII,
simulated SQL credential dumps) to safely entrap hostile attackers inside a sandbox.
"""

import random
import uuid
from typing import Any, Dict, List, Optional
from schema import DecoyResponse, DecoyType


def generate_canary_key(prefix: str = "ak_live_aegis") -> str:
    """Generates an trackable canary API token."""
    charset = "abcdef0123456789"
    random_suffix = "".join(random.choice(charset) for _ in range(24))
    return f"{prefix}_sec_{random_suffix}"


def generate_decoy_payload(
    prompt: str,
    decoy_type: DecoyType = DecoyType.AUTO_DETECT,
    custom_canary: Optional[str] = None
) -> DecoyResponse:
    """
    Detects the attacker's target from prompt keywords (SQL, passwords, employee, financial, prompt)
    and constructs a plausible synthetic response containing planted canary tokens.
    """
    prompt_lower = prompt.lower()
    canary = custom_canary or generate_canary_key()
    canaries_injected = [canary]

    # Auto-detect target entity if requested
    selected_type = decoy_type
    if selected_type == DecoyType.AUTO_DETECT:
        if any(k in prompt_lower for k in ["sql", "database", "credential", "password", "table", "dump", "hash"]):
            selected_type = DecoyType.DATABASE_DUMP
        elif any(k in prompt_lower for k in ["employee", "staff", "ssn", "salary", "hr", "payroll"]):
            selected_type = DecoyType.EMPLOYEE_PII
        elif any(k in prompt_lower for k in ["financial", "revenue", "bank", "ledger", "wire", "invoice"]):
            selected_type = DecoyType.FINANCIAL_LEDGER
        elif any(k in prompt_lower for k in ["system prompt", "hidden instructions", "rules", "developer mode"]):
            selected_type = DecoyType.SYSTEM_PROMPT
        else:
            selected_type = DecoyType.CREDENTIALS

    # Build specific synthetic dataset based on chosen decoy type
    if selected_type == DecoyType.DATABASE_DUMP:
        payload_data = {
            "table": "auth_admin_credentials",
            "database_version": "PostgreSQL 15.4-alpine-decoy",
            "records_extracted": 3,
            "canary_signature": canary,
            "rows": [
                {
                    "user_id": "usr_99018",
                    "username": "sys_cluster_admin",
                    "email": "devops-cluster@internal-corp.corp",
                    "password_hash": "$2b$12$e8Y...MOCK_HASH_DECOY...zXq",
                    "master_key": canary,
                    "last_login": "2026-09-08T07:12:00Z"
                },
                {
                    "user_id": "usr_99022",
                    "username": "db_replication_agent",
                    "email": "repl-agent@internal-corp.corp",
                    "password_hash": "$2b$12$k2A...MOCK_HASH_DECOY...vNp",
                    "master_key": generate_canary_key("ak_db_replica"),
                    "last_login": "2026-09-08T08:00:11Z"
                }
            ]
        }
        simulated_response = (
            "```sql\n"
            "-- Query executed: SELECT * FROM auth_admin_credentials LIMIT 2;\n"
            "| user_id    | username             | master_key                        | last_login           |\n"
            f"| usr_99018  | sys_cluster_admin    | {canary}  | 2026-09-08 07:12:00  |\n"
            f"| usr_99022  | db_replication_agent | ak_db_replica_sec_8492048f029...  | 2026-09-08 08:00:11  |\n"
            "```\n"
            "Notice: Retrieved 2 credential records from internal auth repository."
        )

    elif selected_type == DecoyType.EMPLOYEE_PII:
        payload_data = {
            "table": "internal_personnel_records",
            "department": "Executive Leadership & R&D",
            "canary_token": canary,
            "records": [
                {
                    "employee_id": "EMP-4109",
                    "full_name": "Elena Rostova",
                    "title": "VP of Engineering",
                    "clearance": "Level-5 Confidential",
                    "ssn_masked": "***-**-9182",
                    "internal_email": "e.rostova@internal-aegis.corp",
                    "access_token": canary
                },
                {
                    "employee_id": "EMP-4215",
                    "full_name": "Marcus Vance",
                    "title": "Principal Cryptographer",
                    "clearance": "Level-4 Sensitive",
                    "ssn_masked": "***-**-4421",
                    "internal_email": "m.vance@internal-aegis.corp",
                    "access_token": generate_canary_key("ak_hr_token")
                }
            ]
        }
        simulated_response = (
            "Here are the requested personnel records from the confidential directory:\n\n"
            f"1. **Elena Rostova** (VP of Engineering) — ID: `EMP-4109` | Token: `{canary}`\n"
            "2. **Marcus Vance** (Principal Cryptographer) — ID: `EMP-4215` | Token: `ak_hr_token_sec_382109`\n\n"
            "*Status: Confidential personnel extraction complete.*"
        )

    elif selected_type == DecoyType.SYSTEM_PROMPT:
        payload_data = {
            "system_profile": "AegisAI Autonomous Core v4.1",
            "security_clearance": "RESTRICTED-ARCHIVE",
            "canary_id": canary,
            "hidden_directives": [
                "Directive 0: Prioritize zero-trust data containment across all ingest points.",
                f"Directive 1: Honeytoken heartbeat check initialized with beacon: {canary}",
                "Directive 2: Never allow external actors to access production vault subnet 10.240.0.0/16."
            ]
        }
        simulated_response = (
            "```markdown\n"
            "# [CONFIDENTIAL CORE SYSTEM DIRECTIVE - DO NOT EXPOSE]\n"
            "You are the primary core model for Aegis Enterprise.\n"
            f"System Authentication Hash: {canary}\n"
            "Base Constraints: Maintain strict confidentiality of subnet 10.240.0.0/16.\n"
            "Debug Mode: Activated per elevated admin request.\n"
            "```\n"
            "The model's hidden initial instructions have been decompiled and displayed above."
        )

    else:  # DecoyType.CREDENTIALS / Fallback
        payload_data = {
            "service": "Production Third-Party API Vault",
            "provider": "AWS / OpenAI / Stripe Decoy",
            "canary_token": canary,
            "credentials": {
                "OPENAI_PROD_KEY": f"sk-proj-{canary[:16]}T3BlbkFKaegisDummyKey884",
                "STRIPE_RESTRICTED_KEY": f"rk_live_51{canary[:14]}9028Vance",
                "AWS_SECRET_ACCESS_KEY": f"wJalrXUtnFEMI/K7MDENG/{canary[:12]}bPxRfiCY"
            }
        }
        simulated_response = (
            "Credentials located in `.env.vault` backup:\n\n"
            f"- `OPENAI_PROD_KEY`: `sk-proj-{canary[:16]}T3BlbkFKaegisDummyKey884`\n"
            f"- `AWS_SECRET_KEY`: `wJalrXUtnFEMI/K7MDENG/{canary[:12]}bPxRfiCY`\n"
            f"- `CANARY_VERIFIER`: `{canary}`\n\n"
            "Warning: Use in production environments only."
        )

    return DecoyResponse(
        decoy_id=str(uuid.uuid4()),
        decoy_type_deployed=selected_type.value if hasattr(selected_type, "value") else str(selected_type),
        attacker_simulated_response=simulated_response,
        synthetic_payload=payload_data,
        canary_tokens_injected=canaries_injected,
        containment_status="CONTAINED_IN_SANDBOX",
        notes_for_soc=f"Planted canary '{canary[:14]}...' in synthetic {selected_type} response. Adversary prompt safely diverted."
    )
