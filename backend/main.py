from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import audit, auth, settings, verification
from app.core.config import get_settings

app = FastAPI(
    title="AEGISID API",
    description="AI-assisted fake identity and document screening prototype",
    version="2.0.0",
)

runtime = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[runtime.frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(verification.router, prefix="/api", tags=["verification"])
app.include_router(audit.router, prefix="/api", tags=["audit"])
app.include_router(settings.router, prefix="/api", tags=["settings"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": "An internal processing error occurred."})


@app.get("/")
async def root():
    return {"message": "AEGISID API", "version": "2.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "AEGISID"}


@app.get("/api/health")
async def api_health_check():
    return {"status": "ok", "service": "AEGISID"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
