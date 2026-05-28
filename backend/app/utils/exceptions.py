class FjuAppError(Exception):
    """基礎異常類"""
    def __init__(self, message: str, code: str = "SYSTEM_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)

class FjuAuthError(FjuAppError):
    """登入驗證失敗"""
    def __init__(self, message: str = "帳號或密碼錯誤"):
        super().__init__(message, code="AUTH_FAILED")

class SchoolServerError(FjuAppError):
    """學校伺服器回應異常"""
    def __init__(self, message: str = "學校伺服器暫時無法連線，請稍後再試"):
        super().__init__(message, code="SCHOOL_SERVER_ERROR")

class DataProcessingError(FjuAppError):
    """資料解析或處理錯誤"""
    def __init__(self, message: str = "資料處理過程中發生錯誤"):
        super().__init__(message, code="DATA_ERROR")
