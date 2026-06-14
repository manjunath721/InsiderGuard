from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.dependencies import require_roles
from backend.database.session import get_db
from backend.schemas.entities import ReportOut
from backend.reports.generator import generate_compliance_report

router = APIRouter()

@router.post("/generate", response_model=ReportOut)
async def generate_report(report_type: str, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    report = await generate_compliance_report(report_type)
    if not report:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported report type")
    return report

@router.get("/types")
async def report_types(current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"]))):
    return ["ISO27001", "SOC2", "GDPR", "HIPAA"]
