// 擴充 Express Request 型別，讓 requireAuth 中介層能掛上目前登入者的 userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export {}
