import type * as Crypto from "crypto"
import {v4, v5} from "uuid"

export type UUID = ReturnType<typeof Crypto.randomUUID>
export const getRandomUUID = v4 as () => UUID
const hashNamespace = "7481d539-5aea-407f-933c-88de86b57198"
export const getHashUUID = (value: string | ArrayLike<number>) => v5(value, hashNamespace) as UUID