import type { VercelRequest, VercelResponse } from '@vercel/node'
import { proxyPython, rawBodyConfig } from '../_python'

export const config = rawBodyConfig

export default function handler(req: VercelRequest, res: VercelResponse) {
  return proxyPython(req, res, ['convertword'])
}
