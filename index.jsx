import { Forma } from "forma-embedded-view-sdk/auto";
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

function App() {
    return <h1>Hello, I'm a Forma extension!!</h1>;
}

render(<App />, document.getElementById("root"));
