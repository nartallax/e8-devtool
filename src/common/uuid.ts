import type * as Crypto from "crypto"
import {v4, NIL} from "uuid"

export type UUID = ReturnType<typeof Crypto.randomUUID>
export const getRandomUUID = v4 as () => UUID
export const zeroUUID = NIL as UUID