import { render } from "preact";
import { App } from "./app.tsx";
import "./index.css";
import "./reset.css";

render(<App />, document.getElementById("app")!);
