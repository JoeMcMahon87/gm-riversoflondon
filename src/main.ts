import ReactDOM from "react-dom/client";
import React from "react";
import { GMRiversOfLondon } from "./components/gmrol/GMRiversOfLondon.tsx";
import "./_css/main.scss";

const root = ReactDOM.createRoot(<HTMLElement>document.querySelector("#app"));
root.render(React.createElement(GMRiversOfLondon));
