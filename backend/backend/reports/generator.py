from datetime import datetime
import os

SUPPORTED_REPORTS = ["ISO27001", "SOC2", "GDPR", "HIPAA"]

async def generate_compliance_report(report_type: str) -> dict:
    if report_type not in SUPPORTED_REPORTS:
        return {}
    filename = f"{report_type.lower()}-report-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join(os.getenv("REPORT_DIR", "/reports"), filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"{report_type} compliance report generated at {datetime.utcnow().isoformat()}\n")
        f.write("This report includes a summary of access logs, alerts, investigations, risk scores, and evidence for compliance review.\n")
    return {"generated_at": datetime.utcnow(), "report_type": report_type, "file_url": f"/reports/{filename}", "metadata": {"report_type": report_type}}
