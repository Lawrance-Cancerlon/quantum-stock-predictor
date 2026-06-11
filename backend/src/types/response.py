from typing import Any

from fastapi.responses import JSONResponse


class Response(JSONResponse):
    def __init__(self, status_code: int, message: str | None = None, data: Any | None = None):
        content: dict[str, Any] = {"status": status_code}
        if message is not None:
            content["message"] = message
        if data is not None:
            content["data"] = data
        super().__init__(status_code=status_code, content=content)


class OkResponse(Response):
    def __init__(self, data: Any):
        super().__init__(status_code=200, data=data)


class CompleteResponse(Response):
    def __init__(self, message: str):
        super().__init__(status_code=200, message=message)


class BadRequestResponse(Response):
    def __init__(self, message: str):
        super().__init__(status_code=400, message=message)


class UnauthorizedResponse(Response):
    def __init__(self, message: str):
        super().__init__(status_code=401, message=message)


class ConflictResponse(Response):
    def __init__(self, message: str):
        super().__init__(status_code=409, message=message)


class NotFoundResponse(Response):
    def __init__(self, message: str):
        super().__init__(status_code=404, message=message)
