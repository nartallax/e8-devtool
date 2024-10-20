import {App} from "client/parts/app"
import {createRoot} from "react-dom/client"
import "./style_root.css"
import "./../fonts/opensans.css" // cannot be imported from scss, otherwise paths will break

const root = createRoot(document.getElementById("app")!)
root.render(<App/>)