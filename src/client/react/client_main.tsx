import {App} from "client/react/app"
import {createRoot} from "react-dom/client"
import "../vars.scss"
import "../style_root.scss"
import "../../fonts/opensans.scss" // cannot be imported from scss, otherwise paths will break

const root = createRoot(document.body)
root.render(<App />)