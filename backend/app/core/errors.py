"""Structured error handling and custom application exceptions."""

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class CrestixAPIError(Exception):
    """Base domain exception producing structured error responses."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class ResourceNotFoundError(CrestixAPIError):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str, identifier: Any) -> None:
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource} '{identifier}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": str(identifier)},
        )


class DuplicateResourceError(CrestixAPIError):
    """Raised when a duplicate record or sensor reading is detected."""

    def __init__(self, resource: str, message: str, details: Optional[Any] = None) -> None:
        super().__init__(
            code="DUPLICATE_RESOURCE",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details or {"resource": resource},
        )


class InvalidPayloadError(CrestixAPIError):
    """Raised when business or calibration validation fails."""

    def __init__(self, message: str, details: Optional[Any] = None) -> None:
        super().__init__(
            code="INVALID_PAYLOAD",
            message=message,
            status_code=422,
            details=details,
        )


def _error_envelope(
    code: str,
    message: str,
    path: str,
    details: Optional[Any] = None,
) -> dict:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details,
            "path": path,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Attach structured exception handlers to the FastAPI app."""

    @app.exception_handler(CrestixAPIError)
    async def handle_crestix_error(request: Request, exc: CrestixAPIError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_envelope(
                code=exc.code,
                message=exc.message,
                path=request.url.path,
                details=exc.details,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        sanitized_errors = []
        for err in exc.errors():
            sanitized_errors.append(
                {
                    "loc": list(err.get("loc", [])),
                    "msg": err.get("msg", "Invalid value"),
                    "type": err.get("type", "value_error"),
                }
            )
        return JSONResponse(
            status_code=422,
            content=_error_envelope(
                code="VALIDATION_ERROR",
                message="Request payload validation failed.",
                path=request.url.path,
                details=sanitized_errors,
            ),
        )

    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_envelope(
                code=f"HTTP_{exc.status_code}",
                message=str(exc.detail),
                path=request.url.path,
            ),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_envelope(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected server error occurred.",
                path=request.url.path,
            ),
        )
