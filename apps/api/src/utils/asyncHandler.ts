import type { NextFunction, Request, Response } from 'express'

// 包裝 async 控制器，將拋出的錯誤自動轉交給 Express 錯誤中介層
// 避免每個 controller 都要寫 try/catch
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
