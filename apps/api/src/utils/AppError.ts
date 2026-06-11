// 自訂應用錯誤：帶 HTTP 狀態碼與業務錯誤碼，供 errorHandler 統一輸出
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }

  // 常用錯誤的快捷建構子
  static notFound(message = '找不到資源') {
    return new AppError(404, 'NOT_FOUND', message)
  }

  static badRequest(message = '請求格式錯誤') {
    return new AppError(400, 'BAD_REQUEST', message)
  }

  static unauthorized(message = '未授權') {
    return new AppError(401, 'UNAUTHORIZED', message)
  }

  // 已登入但無權限存取該資源（與 401 區分：401 是「沒登入」，403 是「不是你的」）
  static forbidden(message = '無權存取此資源') {
    return new AppError(403, 'FORBIDDEN', message)
  }
}
