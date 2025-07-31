
# backend/api/routes.py
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from models.schemas import ClientConstraints, ProductResponse
from pricing.selector import ProductSelector
from pdf_generator.generator import PDFGenerator

router = APIRouter()

@router.post("/generate-product", response_model=ProductResponse)
async def generate_product(constraints: ClientConstraints):
    try:
        selector = ProductSelector()
        result = selector.select_optimal_product(constraints.dict())
        
        if not result:
            raise HTTPException(status_code=404, detail="No suitable product found")
        
        # Generate PDF
        pdf_gen = PDFGenerator()
        pdf_url = await pdf_gen.generate_report(result, constraints)
        
        return ProductResponse(
            product=result,
            pdf_url=pdf_url,
            generated_at=datetime.now()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payoffs")
async def get_available_payoffs():
    from payoffs.registry import PayoffRegistry
    registry = PayoffRegistry()
    return registry.get_all_payoffs()
