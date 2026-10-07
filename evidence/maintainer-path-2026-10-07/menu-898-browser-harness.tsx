import * as React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import Menu from "menu-source";
const root = createRoot(document.getElementById("root")!);
let menuRef = React.createRef<any>();
let mountKey = 0;
const w = window as any;
w.mountMenu = (config: any = {}) => {
  menuRef = React.createRef<any>();
  w.events = [];
  const makeLink = (id: string, href: string = "#destination") => <a id={id} href={href}>{id}</a>;
  const items = config.items === "plain" ? [{ key: "first", label: "plain" }] : [
    ...(config.disabled ? [{ key: "disabled", disabled: true, label: makeLink("disabled-link") }] : []),
    { key: "first", label: makeLink("first-link"), onFocus: (e: any) => w.events.push({ type: "focus", target: e.target.id || e.target.tagName }), onClick: (info: any) => w.events.push({ type: "item-click", event: info.domEvent.type }) },
    { key: "second", label: makeLink("second-link") },
    { key: "plain", label: "plain" },
  ];
  flushSync(() => root.render(<Menu key={++mountKey} multiple={config.multiple} ref={menuRef} mode={config.mode || "vertical"} disabledOverflow activeKey={config.activeKey} items={items} onClick={(info: any) => w.events.push({ type: "menu-click", event: info.domEvent.type, key: info.key })} />));
};
w.focusMenu = (options: any) => menuRef.current.focus(options);
w.focusItem = (options: any) => menuRef.current.findItem({ key: "first" }).focus(options);
w.snapshot = () => ({ active: document.activeElement?.id || document.activeElement?.tagName, activeClass: document.activeElement?.closest("li")?.className, scrollY, hash: location.hash, events: w.events.slice() });
