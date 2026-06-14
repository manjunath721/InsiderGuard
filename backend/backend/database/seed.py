import csv
import os
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import Role, Permission, User, AccessLog, Alert, RiskScore, BehaviorProfile, Investigation
from backend.database.session import AsyncSessionLocal
from backend.auth.security import hash_password

DEFAULT_ROLES = [
    {"name": "Admin", "description": "Full platform administrator with user, alert, and configuration access."},
    {"name": "SOC Analyst", "description": "Security operations analyst focused on alerts, investigations, and threat response."},
    {"name": "Manager", "description": "Manager with read access to dashboards, reports, and team alerts."},
    {"name": "Auditor", "description": "Auditor with readonly access to logs, reports, and compliance evidence."},
]

DEFAULT_PERMISSIONS = [
    {"role": "Admin", "resource": "*", "action": "*"},
    {"role": "SOC Analyst", "resource": "alerts", "action": "read"},
    {"role": "SOC Analyst", "resource": "alerts", "action": "write"},
    {"role": "SOC Analyst", "resource": "investigations", "action": "read"},
    {"role": "SOC Analyst", "resource": "investigations", "action": "write"},
    {"role": "Manager", "resource": "reports", "action": "read"},
    {"role": "Manager", "resource": "users", "action": "read"},
    {"role": "Auditor", "resource": "access_logs", "action": "read"},
    {"role": "Auditor", "resource": "reports", "action": "read"},
]

async def seed_roles_and_permissions(session: AsyncSession) -> None:
    for role_data in DEFAULT_ROLES:
        existing = await session.execute(select(Role).where(Role.name == role_data["name"]))
        role = existing.scalar_one_or_none()
        if not role:
            role = Role(name=role_data["name"], description=role_data["description"])
            session.add(role)
            await session.commit()
            await session.refresh(role)

    for perm_data in DEFAULT_PERMISSIONS:
        role_result = await session.execute(select(Role).where(Role.name == perm_data["role"]))
        role = role_result.scalar_one_or_none()
        if not role:
            continue
        existing_perm = await session.execute(
            select(Permission).where(
                Permission.role_id == role.id,
                Permission.resource == perm_data["resource"],
                Permission.action == perm_data["action"],
            )
        )
        if existing_perm.scalar_one_or_none():
            continue
        permission = Permission(role_id=role.id, resource=perm_data["resource"], action=perm_data["action"])
        session.add(permission)
        await session.commit()

async def seed_from_csv(session: AsyncSession) -> None:
    # Check if CSV file exists in root or parent
    csv_path = "InsiderGuard_Synthetic_Dataset_5005.csv"
    if not os.path.exists(csv_path):
        csv_path = "../InsiderGuard_Synthetic_Dataset_5005.csv"
    if not os.path.exists(csv_path):
        print(f"CSV file not found at {csv_path}, skipping CSV seeding")
        return

    # Check if we have seeded users already (except admin)
    user_count = (await session.execute(select(User).where(User.username != "admin"))).scalars().all()
    if len(user_count) > 0:
        print("Database already contains seeded users, skipping CSV seeding")
        return

    print("Starting CSV parsing and seeding...")
    
    users_to_create = {}
    records = []
    
    role_results = await session.execute(select(Role))
    roles_dict = {r.name: r.id for r in role_results.scalars().all()}
    
    def get_role_id(csv_role):
        if csv_role == "System Admin":
            return roles_dict.get("Admin")
        elif csv_role == "Manager":
            return roles_dict.get("Manager")
        elif csv_role in ("Analyst", "Developer"):
            return roles_dict.get("SOC Analyst")
        else:
            return roles_dict.get("Auditor")

    # Read records from CSV
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append(row)
            uid = row['user_id']
            if uid not in users_to_create:
                users_to_create[uid] = {
                    'username': uid.lower(),
                    'email': f"{uid.lower()}@insiderguard.com",
                    'full_name': row['employee_name'],
                    'role_id': get_role_id(row['role']),
                }

    # Create users
    db_users = {}
    password_hash = hash_password("password123")
    for uid, udata in users_to_create.items():
        user = User(
            username=udata['username'],
            email=udata['email'],
            full_name=udata['full_name'],
            hashed_password=password_hash,
            role_id=udata['role_id'],
        )
        session.add(user)
        db_users[uid] = user
        
    await session.commit()
    
    # Refresh all users to get their IDs
    for user in db_users.values():
        await session.refresh(user)
    print(f"Seeded {len(db_users)} users from CSV")

    access_logs = []
    alerts = []
    user_max_risk = {}
    
    def parse_dt(dt_str):
        try:
            return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        except:
            return datetime.utcnow()

    # Process and add access logs
    for i, row in enumerate(records):
        uid = row['user_id']
        db_user = db_users.get(uid)
        user_id = db_user.id if db_user else None
        
        risk_score_val = int(row['risk_score']) if row['risk_score'] else 0
        anomaly_score_val = float(row['anomaly_score']) if row['anomaly_score'] else 0.0
        records_accessed_val = int(row['records_accessed']) if row['records_accessed'] else 0
        
        # Track max risk for RiskScore seeding
        if user_id not in user_max_risk or risk_score_val > user_max_risk[user_id]['risk_score']:
            user_max_risk[user_id] = {
                'risk_score': risk_score_val,
                'anomaly_score': anomaly_score_val,
                'threat_type': row['threat_type'],
                'severity': row['severity'],
                'department': row['department'],
                'created_at': parse_dt(row['timestamp']),
            }
            
        log = AccessLog(
            user_id=user_id,
            username=row['employee_name'],
            role=row['role'],
            department=row['department'],
            resource=row['resource_type'],
            action=row['action_type'],
            ip_address=f"10.0.{i % 254}.{i % 254 + 1}",
            location=row['location'],
            device="Windows 11 / Chrome" if i % 2 == 0 else "macOS / Safari",
            records_accessed=records_accessed_val,
            session_duration=120 + (i % 3600),
            anomaly_score=anomaly_score_val,
            risk_score=float(risk_score_val),
            metadata={'event_id': row['event_id']},
            created_at=parse_dt(row['timestamp']),
        )
        session.add(log)
        access_logs.append(log)

    # Commit access logs in batches
    batch_size = 1000
    for j in range(0, len(access_logs), batch_size):
        await session.commit()
    print(f"Seeded {len(access_logs)} access logs")

    # Re-fetch access log IDs for mapping alerts
    log_by_event_id = {log.metadata['event_id']: log.id for log in access_logs if log.metadata}
    
    # Process and add alerts
    for i, row in enumerate(records):
        if row['label'] == 'Threat' or (row['threat_type'] and row['threat_type'] != 'None'):
            uid = row['user_id']
            db_user = db_users.get(uid)
            user_id = db_user.id if db_user else None
            log_id = log_by_event_id.get(row['event_id'])
            
            severity_val = row['severity'].lower()
            risk_score_val = int(row['risk_score']) if row['risk_score'] else 0
            threat_type = row['threat_type']
            
            recs = ["Investigate user activity", "Audit department access permissions", "Review historical baseline"]
            if threat_type == "Data Exfiltration":
                recs = ["Temporarily disable USB and external shares", "Revoke outbound transfer rights", "Inspect cloud logs"]
            elif threat_type == "Credential Abuse":
                recs = ["Force password reset", "Revoke active sessions", "Enable MFA enforcement"]
            elif threat_type == "Privilege Escalation":
                recs = ["Revert temporary admin roles", "Review IAM policy attachments", "Notify HR and SOC Manager"]
            elif threat_type == "Impossible Travel":
                recs = ["Block incoming IP subnet", "Verify device posture", "Confirm location with employee"]
                
            alert = Alert(
                access_log_id=log_id,
                user_id=user_id,
                username=row['employee_name'],
                severity=severity_val,
                risk_score=risk_score_val,
                title=f"Suspicious {threat_type} Detected",
                description=f"User {row['employee_name']} from {row['department']} department triggered threat signature: {threat_type} accessing {row['resource_type']}.",
                status="open",
                recommendations=recs,
                created_at=parse_dt(row['timestamp']),
                assigned_to="Admin" if i % 2 == 0 else "SOC Analyst",
            )
            session.add(alert)
            alerts.append(alert)
            
    await session.commit()
    print(f"Seeded {len(alerts)} alerts")

    # Seed RiskScore and BehaviorProfile for users
    for user_id, data in user_max_risk.items():
        score_val = data['risk_score']
        cat = data['severity'].lower()
        
        factors_list = [
            {"factor": "Anomaly Score", "impact": int(data['anomaly_score'] * 100)},
            {"factor": "Unusual Resource Access", "impact": int(score_val * 0.4)},
            {"factor": "Department Baseline Deviation", "impact": int(score_val * 0.3)}
        ]
        
        rscore = RiskScore(
            user_id=user_id,
            score=score_val,
            category=cat,
            explanation=f"User triggered alert of type {data['threat_type']} with anomaly score {data['anomaly_score']:.3f}.",
            factors=factors_list,
            created_at=data['created_at'],
        )
        session.add(rscore)
        
        profile = BehaviorProfile(
            user_id=user_id,
            baseline={
                "department": data['department'],
                "typical_resources": ["File", "API"],
                "avg_records_accessed": 100,
                "typical_locations": ["Pune", "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"]
            },
            last_updated=data['created_at'],
        )
        session.add(profile)
        
    await session.commit()
    print("Seeded User Risk Scores and Behavioral Profiles")

    # Seed Investigations for High/Critical alerts
    high_critical_alerts = [a for a in alerts if a.severity in ('high', 'critical')]
    for alert in high_critical_alerts[:20]:
        inv = Investigation(
            alert_id=alert.id,
            user_id=alert.user_id,
            summary=f"Incident Investigation for {alert.username} ({alert.title})",
            risk_explanation=f"High risk score of {alert.risk_score} detected. The user performed actions deviating significantly from their department baseline.",
            root_cause="Credential compromise suspected. Login observed from unusual IP location followed by bulk data access.",
            recommendations=alert.recommendations,
            status="pending" if alert.id % 2 == 0 else "completed",
            created_at=alert.created_at,
            completed_at=alert.created_at if alert.id % 2 != 0 else None,
            ai_report=f"AUTOMATED SOC ANALYSIS REPORT\n\nThreat Category: {alert.title}\nSeverity: {alert.severity.upper()}\nRisk Score: {alert.risk_score}/100\n\nDetailed Timeline:\n- Event triggered at {alert.created_at}\n- Target User: {alert.username}\n\nConclusion:\nImmediate credential rotation and session invalidation recommended.",
        )
        session.add(inv)
        
    await session.commit()
    print(f"Seeded {min(len(high_critical_alerts), 20)} Investigations")

async def ensure_seeding() -> None:
    async with AsyncSessionLocal() as session:
        await seed_roles_and_permissions(session)
        
        # Add default admin user if not exists
        role_results = await session.execute(select(Role))
        roles_dict = {r.name: r.id for r in role_results.scalars().all()}
        admin_exists = await session.execute(select(User).where(User.username == "admin"))
        if not admin_exists.scalar_one_or_none():
            admin_user = User(
                username="admin",
                email="admin@insiderguard.com",
                full_name="Administrator",
                hashed_password=hash_password("admin123"),
                role_id=roles_dict.get("Admin"),
            )
            session.add(admin_user)
            await session.commit()
            print("Admin user seeded: admin / admin123")
            
        await seed_from_csv(session)
