import { Router } from 'express'
import { attractionsRouter } from './attractions'
import { authRouter } from './auth'
import { familiesRouter } from './families'
import { flightsRouter } from './flights'
import { tripsRouter } from './trips'

// 掛載所有 /api 子路由。新增資源時在這裡 use 進來即可。
export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/trips', tripsRouter)
apiRouter.use('/families', familiesRouter)
apiRouter.use('/attractions', attractionsRouter)
apiRouter.use('/flights', flightsRouter)
