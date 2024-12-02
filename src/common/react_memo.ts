import {memo} from "react"

/** Because just `memo` loses generic arguments */
export const reactMemo: <T>(c: T) => T = memo